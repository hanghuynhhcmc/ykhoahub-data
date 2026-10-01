let questions = [];
let selectedQuestions = [];
let currentQuestion = 0;


// =====================================
// TẢI DỮ LIỆU
// =====================================

fetch("questions.json")

    .then(response => {

        if (!response.ok) {
            throw new Error("Không tìm thấy questions.json");
        }

        return response.json();

    })

    .then(data => {

        questions = data;

        showMenu();

    })

    .catch(error => {

        document.getElementById("app").innerHTML = `

            <div class="card">

                <h2>Lỗi tải dữ liệu</h2>

                <p>${error.message}</p>

            </div>

        `;

    });


// =====================================
// CHỌN MÔN
// =====================================

function showMenu() {

    const subjects = [

        ...new Set(

            questions

                .map(q => q.mon)

                .filter(q =>
                    q !== null &&
                    q !== undefined &&
                    String(q).trim() !== ""
                )

        )

    ];


    let html = `

        <div class="card">

            <h2>Chọn môn</h2>

            <select id="subject">

                <option value="">
                    -- Chọn môn --
                </option>

    `;


    subjects.forEach(subject => {

        html += `

            <option value="${escapeHTML(subject)}">

                ${escapeHTML(subject)}

            </option>

        `;

    });


    html += `

            </select>

        </div>


        <div class="card">

            <button onclick="startQuiz()">

                BẮT ĐẦU

            </button>

        </div>

    `;


    document.getElementById("app").innerHTML = html;

}


// =====================================
// BẮT ĐẦU HỌC
// =====================================

function startQuiz() {

    const subject =
        document.getElementById("subject").value;


    if (!subject) {

        alert("Hãy chọn môn.");

        return;

    }


    selectedQuestions = questions.filter(q =>

        q.mon === subject

    );


    if (selectedQuestions.length === 0) {

        alert("Môn này chưa có câu hỏi.");

        return;

    }


    // Tạo danh sách câu hỏi có trọng số

    selectedQuestions =
        createWeightedQuestions(selectedQuestions);


    currentQuestion = 0;

    showQuestion();

}


// =====================================
// TẠO TẦN SUẤT CÂU HỎI
// =====================================

function createWeightedQuestions(list) {

    let result = [];


    list.forEach(question => {

        const id = question.id;


        // Lấy số lần câu này được đánh dấu cần học lại

        const repeatCount =

            Number(
                localStorage.getItem(
                    "repeat_" + id
                )
            ) || 0;


        // Câu bình thường xuất hiện 1 lần

        // Mỗi lần "CẦN HỌC LẠI"
        // tăng thêm 2 lần xuất hiện

        const weight =
            1 + repeatCount * 2;


        for (let i = 0; i < weight; i++) {

            result.push(question);

        }

    });


    // Trộn ngẫu nhiên

    for (let i = result.length - 1; i > 0; i--) {

        const j =
            Math.floor(Math.random() * (i + 1));


        [result[i], result[j]] =
            [result[j], result[i]];

    }


    return result;

}


// =====================================
// HIỆN CÂU HỎI
// =====================================

function showQuestion() {

    const q =
        selectedQuestions[currentQuestion];


    document.getElementById("app").innerHTML = `

        <div class="card">

            <p>

                <strong>

                    Câu ${currentQuestion + 1}
                    / ${selectedQuestions.length}

                </strong>

            </p>


            <div class="question">

                ${formatText(q.question)}

            </div>


            <button onclick="showAnswer()">

                HIỆN ĐÁP ÁN

            </button>


            <div id="answerArea"></div>

        </div>

    `;

}


// =====================================
// HIỆN ĐÁP ÁN + GIẢI THÍCH
// =====================================

function showAnswer() {

    const q =
        selectedQuestions[currentQuestion];


    document.getElementById("answerArea").innerHTML = `

        <div class="answer">

            <h3>ĐÁP ÁN</h3>

            <p>

                ${formatText(q.answer)}

            </p>

        </div>


        <div class="explanation">

            <h3>GIẢI THÍCH</h3>

            <p>

                ${formatText(q.explanation)}

            </p>

        </div>


        <button onclick="needReview()">

            🔴 CẦN HỌC LẠI

        </button>


        <button onclick="nextQuestion()">

            CÂU TIẾP THEO

        </button>

    `;

}


// =====================================
// CẦN HỌC LẠI
// =====================================

function needReview() {

    const q =
        selectedQuestions[currentQuestion];


    const key =
        "repeat_" + q.id;


    const current =
        Number(localStorage.getItem(key)) || 0;


    // Tăng mức độ cần học lại

    localStorage.setItem(

        key,

        current + 1

    );


    alert(
        "Đã ghi nhớ: câu này sẽ xuất hiện thường xuyên hơn."
    );


    nextQuestion();

}


// =====================================
// CÂU TIẾP THEO
// =====================================

function nextQuestion() {

    currentQuestion++;


    if (
        currentQuestion >=
        selectedQuestions.length
    ) {

        showResult();

        return;

    }


    showQuestion();

}


// =====================================
// HOÀN THÀNH
// =====================================

function showResult() {

    document.getElementById("app").innerHTML = `

        <div class="card">

            <h2>🎉 Hoàn thành!</h2>

            <p>

                Bạn đã hoàn thành lượt học.

            </p>


            <button onclick="showMenu()">

                CHỌN MÔN KHÁC

            </button>

        </div>

    `;

}


// =====================================
// XỬ LÝ TEXT
// =====================================

function formatText(text) {

    if (
        text === null ||
        text === undefined
    ) {

        return "";

    }


    return escapeHTML(String(text))

        .replace(/\n/g, "<br>");

}


// =====================================
// BẢO VỆ HTML
// =====================================

function escapeHTML(text) {

    return String(text)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}
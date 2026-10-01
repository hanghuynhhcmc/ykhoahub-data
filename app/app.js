let questions = [];
let selectedQuestions = [];
let currentQuestion = 0;
let isFlipped = false;

let notLearnedQuestions = [];
let searchResults = [];

let searchKeyword = "";
let returnToSearch = false;


// =====================================
// DỮ LIỆU ONLINE
// =====================================

const ONLINE_DATA_URL =
    "https://raw.githubusercontent.com/hanghuynhhcmc/ykhoahub-data/refs/heads/main/questions.json";

const LOCAL_CACHE_KEY =
    "ykhoahub_questions_cache";

const LEARNED_KEY =
    "ykhoahub_learned";

const DASHBOARD_KEY =
    "ykhoahub_dashboard_subjects";


// =====================================
// TẢI DỮ LIỆU
// =====================================

async function loadQuestions() {

    try {

        const response =
            await fetch(
                ONLINE_DATA_URL,
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                "Không tải được dữ liệu online"
            );

        }

        const onlineData =
            await response.json();

        if (!Array.isArray(onlineData)) {

            throw new Error(
                "Dữ liệu online không hợp lệ"
            );

        }

        questions =
            onlineData;

        localStorage.setItem(
            LOCAL_CACHE_KEY,
            JSON.stringify(onlineData)
        );

        showMenu();

        return;

    } catch (error) {

        console.log(
            "Không tải được dữ liệu online:",
            error
        );

    }


    // =================================
    // ĐỌC CACHE
    // =================================

    try {

        const savedData =
            localStorage.getItem(
                LOCAL_CACHE_KEY
            );

        if (savedData) {

            const cachedQuestions =
                JSON.parse(savedData);

            if (
                Array.isArray(
                    cachedQuestions
                )
            ) {

                questions =
                    cachedQuestions;

                showMenu();

                return;

            }

        }

    } catch (error) {

        console.log(
            "Không đọc được cache:",
            error
        );

    }


    // =================================
    // ĐỌC QUESTIONS.JSON LOCAL
    // =================================

    try {

        const response =
            await fetch(
                "questions.json"
            );

        if (!response.ok) {

            throw new Error(
                "Không tìm thấy questions.json"
            );

        }

        const localData =
            await response.json();

        if (!Array.isArray(localData)) {

            throw new Error(
                "questions.json không hợp lệ"
            );

        }

        questions =
            localData;

        localStorage.setItem(
            LOCAL_CACHE_KEY,
            JSON.stringify(localData)
        );

        showMenu();

    } catch (error) {

        console.error(
            "Lỗi tải dữ liệu:",
            error
        );

        const app =
            document.getElementById(
                "app"
            );

        if (app) {

            app.innerHTML = `

                <div class="card">

                    <h2>
                        Lỗi tải dữ liệu
                    </h2>

                    <p>
                        Không thể tải dữ liệu câu hỏi.
                    </p>

                    <p>
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                </div>

            `;

        }

    }

}


// =====================================
// KHỞI ĐỘNG
// =====================================

loadQuestions();


// =====================================
// DANH SÁCH MÔN
// =====================================

function getSubjects() {

    return [
        ...new Set(
            questions
                .map(
                    q => q.mon
                )
                .filter(
                    q =>
                        q !== null &&
                        q !== undefined &&
                        String(q).trim() !== ""
                )
        )
    ];

}


// =====================================
// DASHBOARD MÔN
// =====================================

function getDashboardSubjects() {

    const subjects =
        getSubjects();

    let saved = [];

    try {

        saved =
            JSON.parse(
                localStorage.getItem(
                    DASHBOARD_KEY
                )
            ) || [];

    } catch {

        saved = [];

    }


    saved =
        saved.filter(
            subject =>
                subjects.includes(
                    subject
                )
        );


    if (saved.length === 0) {

        saved =
            subjects.slice(0, 4);

        saveDashboardSubjects(
            saved
        );

    }


    return saved.slice(0, 4);

}


// =====================================
// LƯU DASHBOARD
// =====================================

function saveDashboardSubjects(
    subjects
) {

    localStorage.setItem(
        DASHBOARD_KEY,
        JSON.stringify(
            subjects.slice(0, 4)
        )
    );

}


// =====================================
// XÓA MÔN KHỎI DASHBOARD
// =====================================

function removeDashboardSubject(
    subject,
    event
) {

    if (event) {
        event.stopPropagation();
    }

    let dashboard =
        getDashboardSubjects();

    dashboard =
        dashboard.filter(
            item =>
                item !== subject
        );

    saveDashboardSubjects(
        dashboard
    );

    showMenu();

}


// =====================================
// THÊM MÔN VÀO DASHBOARD
// =====================================

function addDashboardSubject(
    subject
) {

    if (!subject) {
        return;
    }

    let dashboard =
        getDashboardSubjects();


    if (
        dashboard.includes(
            subject
        )
    ) {

        alert(
            "Môn này đã có trong Dashboard."
        );

        return;

    }


    if (
        dashboard.length >= 4
    ) {

        alert(
            "Dashboard chỉ hiển thị tối đa 4 môn."
        );

        return;

    }


    dashboard.push(
        subject
    );


    saveDashboardSubjects(
        dashboard
    );

    showMenu();

}


// =====================================
// ĐÃ HỌC
// =====================================

function getLearned() {

    try {

        return JSON.parse(
            localStorage.getItem(
                LEARNED_KEY
            )
        ) || {};

    } catch {

        return {};

    }

}


// =====================================
// LƯU ĐÃ HỌC
// =====================================

function saveLearned(
    data
) {

    localStorage.setItem(
        LEARNED_KEY,
        JSON.stringify(data)
    );

}


// =====================================
// ĐÁNH DẤU ĐÃ HỌC
// =====================================

function markAsLearned(
    id
) {

    if (
        id === null ||
        id === undefined ||
        String(id).trim() === ""
    ) {

        return;

    }


    const learned =
        getLearned();


    learned[
        String(id)
    ] = true;


    saveLearned(
        learned
    );

}


// =====================================
// CHƯA THUỘC
// =====================================

function isNotLearned(
    id
) {

    const count =
        Number(
            localStorage.getItem(
                "repeat_" + id
            )
        ) || 0;

    return count > 0;

}


// =====================================
// THỐNG KÊ MÔN
// =====================================

function getSubjectStats(
    subject
) {

    const subjectQuestions =
        questions.filter(
            q =>
                q.mon === subject
        );


    const learned =
        getLearned();


    const total =
        subjectQuestions.length;


    const learnedCount =
        subjectQuestions.filter(
            q =>
                learned[
                    String(q.id)
                ]
        ).length;


    const reviewCount =
        subjectQuestions.filter(
            q =>
                isNotLearned(
                    q.id
                )
        ).length;


    const remaining =
        Math.max(
            0,
            total - learnedCount
        );


    return {
        total,
        learned: learnedCount,
        review: reviewCount,
        remaining
    };

}


// =====================================
// TRANG CHỦ
// =====================================

function showMenu() {

    returnToSearch = false;


    const subjects =
        getSubjects();


    const dashboardSubjects =
        getDashboardSubjects();


    let dashboardHTML = "";


    for (
        let i = 0;
        i < 4;
        i++
    ) {

        const subject =
            dashboardSubjects[i];


        if (subject) {

            const stats =
                getSubjectStats(
                    subject
                );


            dashboardHTML += `

                <div
                    class="subject-progress"
                    onclick='startDashboardQuiz(${JSON.stringify(subject)})'
                >

                    <button
                        class="dashboard-remove"
                        onclick='removeDashboardSubject(${JSON.stringify(subject)}, event)'
                    >
                        ×
                    </button>

                    <div class="subject-name">
                        ${escapeHTML(subject)}
                    </div>

                    <div class="progress-item">

                        <span>
                            Đã học
                        </span>

                        <strong>
                            ${stats.learned}
                        </strong>

                    </div>

                    <div class="progress-item">

                        <span>
                            Chưa thuộc
                        </span>

                        <strong>
                            ${stats.review}
                        </strong>

                    </div>

                    <div class="progress-item">

                        <span>
                            Còn lại
                        </span>

                        <strong>
                            ${stats.remaining}
                        </strong>

                    </div>

                </div>

            `;

        } else {

            const availableSubjects =
                subjects.filter(
                    item =>
                        !dashboardSubjects.includes(
                            item
                        )
                );


            let options = `

                <option value="">
                    -- Chọn môn --
                </option>

            `;


            availableSubjects.forEach(
                item => {

                    options += `

                        <option
                            value="${escapeHTML(item)}"
                        >
                            ${escapeHTML(item)}
                        </option>

                    `;

                }
            );


            dashboardHTML += `

                <div class="dashboard-empty">

                    <select
                        class="dashboard-add-select"
                        onchange="addDashboardSubject(this.value)"
                    >

                        ${options}

                    </select>

                </div>

            `;

        }

    }


    const app =
        document.getElementById(
            "app"
        );


    if (!app) {
        return;
    }


    app.innerHTML = `

        <div class="section-heading">
            MÔN ĐANG HỌC
        </div>


        <div class="dashboard-grid">

            ${dashboardHTML}

        </div>


        <div class="menu-section">

            <button
                class="menu-button secondary"
                onclick="showNotLearned()"
            >

                📚 CÂU CHƯA THUỘC

            </button>

        </div>


        <div class="search-home-section">

            <button
                class="menu-button search-home-button"
                onclick="showSearch()"
            >

                🔎 TÌM KIẾM

            </button>

        </div>

    `;

}


// =====================================
// BẮT ĐẦU HỌC TỪ DASHBOARD
// =====================================

function startDashboardQuiz(
    subject
) {

    if (!subject) {
        return;
    }


    selectedQuestions =
        questions.filter(
            q =>
                q.mon === subject
        );


    if (
        selectedQuestions.length === 0
    ) {

        alert(
            "Môn này chưa có câu hỏi."
        );

        return;

    }


    selectedQuestions =
        createWeightedQuestions(
            selectedQuestions
        );


    currentQuestion = 0;

    returnToSearch = false;

    showQuestion();

}


// =====================================
// TẠO TẦN SUẤT
// =====================================

function createWeightedQuestions(
    list
) {

    let result = [];


    list.forEach(
        question => {

            const id =
                question.id;


            const repeatCount =
                Number(
                    localStorage.getItem(
                        "repeat_" + id
                    )
                ) || 0;


            const weight =
                1 +
                repeatCount * 2;


            for (
                let i = 0;
                i < weight;
                i++
            ) {

                result.push(
                    question
                );

            }

        }
    );


    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];

    }


    return result;

}


// =====================================
// XÁC ĐỊNH LOẠI CÂU HỎI
// =====================================

function getQuestionType(
    q
) {

    const type =
        String(
            q.dang || ""
        )
            .trim()
            .toUpperCase();


    if (type === "MCQ") {
        return "MCQ";
    }


    if (
        type === "FILL_BLANK"
    ) {

        return "FILL_BLANK";

    }


    return "FLASHCARD";

}


// =====================================
// HIỆN CÂU HỎI
// =====================================

function showQuestion(
    skipLearning = false
) {

    const q =
        selectedQuestions[
            currentQuestion
        ];


    if (!q) {

        showResult();

        return;

    }


    if (!skipLearning) {

        markAsLearned(
            q.id
        );

    }


    isFlipped = false;


    const app =
        document.getElementById(
            "app"
        );


    if (!app) {
        return;
    }


    const questionType =
        getQuestionType(
            q
        );


    // =================================
    // MCQ
    // =================================

    if (
        questionType === "MCQ"
    ) {

        showMCQQuestion(
            q
        );

        return;

    }


    // =================================
    // ĐIỀN KHUYẾT
    // =================================

    if (
        questionType === "FILL_BLANK"
    ) {

        showFillBlankQuestion(
            q
        );

        return;

    }


    // =================================
    // FLASHCARD BÌNH THƯỜNG
    // =================================

    showFlashcardQuestion(
        q
    );

}


// =====================================
// MCQ
// =====================================

function showMCQQuestion(
    q
) {

    const app =
        document.getElementById(
            "app"
        );


    if (!app) {
        return;
    }


    const choices =
        getChoices(
            q.choices
        );


    let choicesHTML = "";


    choices.forEach(
        (
            choice,
            index
        ) => {

            choicesHTML += `

                <button
                    class="answer-choice"
                    onclick="checkMCQAnswer(${index}, event)"
                >

                    ${formatText(choice)}

                </button>

            `;

        }
    );


    app.innerHTML = `

        <div class="study-header">

            <button
                class="back-button"
                onclick="goBackToMenu()"
            >
                ←
            </button>


            <div>

                <div class="study-subject">
                    ${escapeHTML(q.mon)}
                </div>


                <div class="study-counter">

                    Câu ${currentQuestion + 1}
                    /
                    ${selectedQuestions.length}

                </div>

            </div>

        </div>


        <div
            class="interactive-card"
        >

            <div class="card-label">
                TRẮC NGHIỆM
            </div>


            <div class="interactive-question">

                ${formatText(q.question)}

            </div>


            <div
                id="mcqChoices"
                class="answer-choices"
            >

                ${choicesHTML}

            </div>


            <div
                id="mcqFeedback"
                class="answer-feedback"
            ></div>


            <div class="flashcard-front-bottom">

                <button
                    class="skip-button"
                    onclick="skipQuestion(event)"
                >

                    ⏭️ BỎ QUA

                </button>

            </div>

        </div>

    `;

}


// =====================================
// TÁCH LỰA CHỌN
// =====================================

function getChoices(
    choices
) {

    if (
        choices === null ||
        choices === undefined
    ) {

        return [];

    }


    return String(choices)
        .split(/\r?\n/)
        .map(
            choice =>
                choice.trim()
        )
        .filter(
            choice =>
                choice !== ""
        );

}


// =====================================
// KIỂM TRA MCQ
// =====================================

function checkMCQAnswer(
    index,
    event
) {

    if (event) {
        event.stopPropagation();
    }


    const q =
        selectedQuestions[
            currentQuestion
        ];


    if (!q) {
        return;
    }


    const choices =
        getChoices(
            q.choices
        );


    const selectedAnswer =
        choices[index];


    const correctAnswer =
        String(
            q.answer ?? ""
        ).trim();


    const buttons =
        document.querySelectorAll(
            ".answer-choice"
        );


    buttons.forEach(
        button => {

            button.disabled = true;

        }
    );


    buttons.forEach(
        (
            button,
            buttonIndex
        ) => {

            const answer =
                choices[
                    buttonIndex
                ];


            if (
                normalizeAnswer(answer) ===
                normalizeAnswer(correctAnswer)
            ) {

                button.classList.add(
                    "correct"
                );

            }


            if (
                buttonIndex === index &&
                normalizeAnswer(answer) !==
                normalizeAnswer(correctAnswer)
            ) {

                button.classList.add(
                    "wrong"
                );

            }

        }
    );


    const isCorrect =
        normalizeAnswer(
            selectedAnswer
        ) ===
        normalizeAnswer(
            correctAnswer
        );


    const feedback =
        document.getElementById(
            "mcqFeedback"
        );


    if (!feedback) {
        return;
    }


    feedback.innerHTML = `

        <div class="${isCorrect ? "correct-feedback" : "wrong-feedback"}">

            <div class="feedback-title">

                ${isCorrect
                    ? "✅ Chính xác!"
                    : "❌ Chưa đúng"}

            </div>


            <div class="feedback-answer">

                <strong>
                    Đáp án:
                </strong>

                ${formatText(q.answer)}

            </div>


            ${
                q.explanation
                    ? `

                        <div class="feedback-explanation">

                            <strong>
                                Giải thích:
                            </strong>

                            ${formatText(
                                q.explanation
                            )}

                        </div>

                    `
                    : ""
            }


            <button
                class="next-button"
                onclick="nextQuestion(event)"
            >

                CÂU TIẾP THEO

            </button>

        </div>

    `;

}


// =====================================
// ĐIỀN KHUYẾT
// =====================================

function showFillBlankQuestion(
    q
) {

    const app =
        document.getElementById(
            "app"
        );


    if (!app) {
        return;
    }


    app.innerHTML = `

        <div class="study-header">

            <button
                class="back-button"
                onclick="goBackToMenu()"
            >
                ←
            </button>


            <div>

                <div class="study-subject">
                    ${escapeHTML(q.mon)}
                </div>


                <div class="study-counter">

                    Câu ${currentQuestion + 1}
                    /
                    ${selectedQuestions.length}

                </div>

            </div>

        </div>


        <div
            class="interactive-card"
        >

            <div class="card-label">
                ĐIỀN KHUYẾT
            </div>


            <div class="interactive-question">

                ${formatText(q.question)}

            </div>


            <div class="fill-answer-area">

                <input
                    id="fillAnswerInput"
                    class="fill-answer-input"
                    type="text"
                    placeholder="Nhập câu trả lời..."
                    autocomplete="off"
                    autocorrect="off"
                    spellcheck="false"
                    onkeydown="handleFillBlankKey(event)"
                >


                <button
                    class="check-answer-button"
                    onclick="checkFillBlankAnswer(event)"
                >

                    KIỂM TRA

                </button>

            </div>


            <div
                id="fillFeedback"
                class="answer-feedback"
            ></div>


            <div class="flashcard-front-bottom">

                <button
                    class="skip-button"
                    onclick="skipQuestion(event)"
                >

                    ⏭️ BỎ QUA

                </button>

            </div>

        </div>

    `;


    setTimeout(
        () => {

            const input =
                document.getElementById(
                    "fillAnswerInput"
                );


            if (input) {
                input.focus();
            }

        },
        100
    );

}


// =====================================
// ENTER ĐỂ KIỂM TRA ĐIỀN KHUYẾT
// =====================================

function handleFillBlankKey(
    event
) {

    if (
        event.key === "Enter"
    ) {

        checkFillBlankAnswer(
            event
        );

    }

}


// =====================================
// KIỂM TRA ĐIỀN KHUYẾT
// =====================================

function checkFillBlankAnswer(
    event
) {

    if (event) {
        event.stopPropagation();
    }


    const q =
        selectedQuestions[
            currentQuestion
        ];


    if (!q) {
        return;
    }


    const input =
        document.getElementById(
            "fillAnswerInput"
        );


    const feedback =
        document.getElementById(
            "fillFeedback"
        );


    if (
        !input ||
        !feedback
    ) {

        return;

    }


    const userAnswer =
        input.value.trim();


    if (!userAnswer) {

        input.focus();

        return;

    }


    const acceptedAnswers =
        getAcceptedAnswers(
            q.answer
        );


    const isCorrect =
        acceptedAnswers.some(
            answer =>
                normalizeAnswer(answer) ===
                normalizeAnswer(userAnswer)
        );


    input.disabled = true;


    const checkButton =
        document.querySelector(
            ".check-answer-button"
        );


    if (checkButton) {

        checkButton.disabled = true;

    }


    input.classList.add(
        isCorrect
            ? "correct-input"
            : "wrong-input"
    );


    feedback.innerHTML = `

        <div class="${isCorrect ? "correct-feedback" : "wrong-feedback"}">

            <div class="feedback-title">

                ${isCorrect
                    ? "✅ Chính xác!"
                    : "❌ Chưa đúng"}

            </div>


            <div class="feedback-answer">

                <strong>
                    Đáp án:
                </strong>

                ${formatText(q.answer)}

            </div>


            ${
                q.explanation
                    ? `

                        <div class="feedback-explanation">

                            <strong>
                                Giải thích:
                            </strong>

                            ${formatText(
                                q.explanation
                            )}

                        </div>

                    `
                    : ""
            }


            <button
                class="next-button"
                onclick="nextQuestion(event)"
            >

                CÂU TIẾP THEO

            </button>

        </div>

    `;

}


// =====================================
// TÁCH ĐÁP ÁN ĐƯỢC CHẤP NHẬN
// =====================================

function getAcceptedAnswers(
    answer
) {

    if (
        answer === null ||
        answer === undefined
    ) {

        return [];

    }


    return String(answer)
        .split(/\r?\n/)
        .map(
            item =>
                item.trim()
        )
        .filter(
            item =>
                item !== ""
        );

}


// =====================================
// CHUẨN HÓA ĐÁP ÁN
// =====================================

function normalizeAnswer(
    text
) {

    return normalizeText(
        text
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


// =====================================
// FLASHCARD THƯỜNG
// =====================================

function showFlashcardQuestion(
    q
) {

    const app =
        document.getElementById(
            "app"
        );


    if (!app) {
        return;
    }


    app.innerHTML = `

        <div class="study-header">

            <button
                class="back-button"
                onclick="goBackToMenu()"
            >
                ←
            </button>


            <div>

                <div class="study-subject">

                    ${escapeHTML(q.mon)}

                </div>


                <div class="study-counter">

                    Câu ${currentQuestion + 1}
                    /
                    ${selectedQuestions.length}

                </div>

            </div>

        </div>


        <div
            class="flashcard-container"
            onclick="flipCard()"
        >

            <div
                id="flashcard"
                class="flashcard"
            >

                <div
                    class="flashcard-face flashcard-front"
                >

                    <div class="card-label">
                        CÂU HỎI
                    </div>


                    <div class="flashcard-question">

                        ${formatText(
                            q.question
                        )}

                    </div>


                    <div class="flashcard-front-bottom">

                        <button
                            class="skip-button"
                            onclick="skipQuestion(event)"
                        >

                            ⏭️ BỎ QUA

                        </button>


                        <div class="flip-hint">
                            chạm để lật
                        </div>

                    </div>

                </div>


                <div
                    class="flashcard-face flashcard-back"
                >

                    <div
                        class="flashcard-back-scroll"
                    >

                        <div class="card-label">
                            ĐÁP ÁN
                        </div>


                        <div class="flashcard-answer">

                            ${formatText(
                                q.answer
                            )}

                        </div>


                        <div
                            class="flashcard-actions"
                        >

                            <button
                                class="review-button"
                                onclick="markNotLearned(event)"
                            >

                                🔴 CHƯA THUỘC

                            </button>


                            <button
                                class="next-button"
                                onclick="nextQuestion(event)"
                            >

                                CÂU TIẾP THEO

                            </button>

                        </div>


                        <div
                            class="explanation-section"
                        >

                            <div class="card-label">
                                GIẢI THÍCH
                            </div>


                            <div
                                class="flashcard-explanation"
                            >

                                ${formatText(
                                    q.explanation
                                )}

                            </div>

                        </div>

                    </div>


                    <div class="flip-hint">
                        chạm để lật
                    </div>

                </div>

            </div>

        </div>


        <button
            class="return-question-button"
            onclick="flipBack(event)"
        >

            ↩️ QUAY LẠI

        </button>

    `;

}


// =====================================
// BỎ QUA CÂU HỎI
// =====================================

function skipQuestion(
    event
) {

    if (event) {
        event.stopPropagation();
    }


    const q =
        selectedQuestions[
            currentQuestion
        ];


    if (!q) {
        return;
    }


    selectedQuestions =
        selectedQuestions.filter(
            item =>
                String(item.id) !==
                String(q.id)
        );


    if (
        selectedQuestions.length === 0
    ) {

        showResult();

        return;

    }


    if (
        currentQuestion >=
        selectedQuestions.length
    ) {

        currentQuestion =
            selectedQuestions.length - 1;

    }


    showQuestion(
        true
    );

}


// =====================================
// LẬT CARD
// =====================================

function flipCard() {

    const card =
        document.getElementById(
            "flashcard"
        );


    if (!card) {
        return;
    }


    isFlipped =
        !isFlipped;


    if (isFlipped) {

        card.classList.add(
            "flipped"
        );

    } else {

        card.classList.remove(
            "flipped"
        );

    }

}


// =====================================
// QUAY LẠI MẶT CÂU HỎI
// =====================================

function flipBack(
    event
) {

    if (event) {
        event.stopPropagation();
    }


    const card =
        document.getElementById(
            "flashcard"
        );


    if (!card) {
        return;
    }


    isFlipped = false;


    card.classList.remove(
        "flipped"
    );

}


// =====================================
// CHƯA THUỘC
// =====================================

function markNotLearned(
    event
) {

    if (event) {
        event.stopPropagation();
    }


    const q =
        selectedQuestions[
            currentQuestion
        ];


    if (!q) {
        return;
    }


    const key =
        "repeat_" + q.id;


    const current =
        Number(
            localStorage.getItem(
                key
            )
        ) || 0;


    localStorage.setItem(
        key,
        current + 1
    );


    nextQuestion();

}


// =====================================
// CÂU TIẾP THEO
// =====================================

function nextQuestion(
    event
) {

    if (event) {
        event.stopPropagation();
    }


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
// VỀ TRANG TRƯỚC
// =====================================

function goBackToMenu() {

    if (returnToSearch) {

        returnToSearch = false;

        showSearch(
            false
        );

        return;

    }


    showMenu();

}


// =====================================
// HOÀN THÀNH
// =====================================

function showResult() {

    const app =
        document.getElementById(
            "app"
        );


    if (!app) {
        return;
    }


    app.innerHTML = `

        <div class="result-card">

            <div class="result-icon">
                🎉
            </div>


            <h2>
                Hoàn thành!
            </h2>


            <p>
                Bạn đã hoàn thành lượt học.
            </p>


            <button
                onclick="showMenu()"
            >

                VỀ TRANG CHỦ

            </button>

        </div>

    `;

}


// =====================================
// CÂU CHƯA THUỘC
// =====================================

function showNotLearned() {

    returnToSearch = false;


    notLearnedQuestions =
        questions.filter(
            q =>
                isNotLearned(
                    q.id
                )
        );


    if (
        notLearnedQuestions.length === 0
    ) {

        const app =
            document.getElementById(
                "app"
            );


        if (app) {

            app.innerHTML = `

                <div class="card empty-state">

                    <div class="empty-icon">
                        🎉
                    </div>


                    <h2>
                        Chưa có câu nào
                    </h2>


                    <p>

                        Bạn chưa đánh dấu câu nào
                        là "Chưa thuộc".

                    </p>


                    <button
                        onclick="showMenu()"
                    >

                        ← VỀ TRANG CHỦ

                    </button>

                </div>

            `;

        }

        return;

    }


    let html = `

        <div class="page-header">

            <button
                class="back-button"
                onclick="showMenu()"
            >

                ←

            </button>


            <div>

                <h2>
                    📚 CÂU CHƯA THUỘC
                </h2>


                <p>
                    ${notLearnedQuestions.length} câu
                </p>

            </div>

        </div>


        <div class="not-learned-list">

    `;


    notLearnedQuestions.forEach(
        (
            q,
            index
        ) => {

            html += `

                <div
                    class="not-learned-item"
                    onclick="startNotLearned(${index})"
                >

                    <div
                        class="not-learned-subject"
                    >

                        ${escapeHTML(
                            q.mon
                        )}

                    </div>


                    <div
                        class="not-learned-question"
                    >

                        ${formatText(
                            q.question
                        )}

                    </div>

                </div>

            `;

        }
    );


    html += `

        </div>

    `;


    const app =
        document.getElementById(
            "app"
        );


    if (app) {

        app.innerHTML =
            html;

    }

}


// =====================================
// HỌC CÂU CHƯA THUỘC
// =====================================

function startNotLearned(
    index
) {

    returnToSearch = false;


    selectedQuestions =
        notLearnedQuestions;


    currentQuestion =
        index;


    showQuestion();

}


// =====================================
// TÌM KIẾM
// =====================================

function showSearch(
    resetSearch = true
) {

    if (resetSearch) {

        searchKeyword = "";

        searchResults = [];

    }


    const app =
        document.getElementById(
            "app"
        );


    if (!app) {
        return;
    }


    app.innerHTML = `

        <div class="page-header">

            <button
                class="back-button"
                onclick="showMenu()"
            >

                ←

            </button>


            <div>

                <h2>
                    🔎 TÌM KIẾM
                </h2>


                <p>

                    Tìm trong câu hỏi,
                    đáp án và giải thích

                </p>

            </div>

        </div>


        <div class="search-box">

            <input
                id="searchInput"
                type="search"
                inputmode="search"
                enterkeyhint="search"
                placeholder="Nhập từ khóa..."
                value="${escapeHTML(
                    searchKeyword
                )}"
                oninput="performSearch()"
                autocomplete="off"
                autocorrect="off"
                spellcheck="false"
            >

        </div>


        <div id="searchResults">

            ${renderSearchResultsHTML()}

        </div>

    `;


    if (resetSearch) {

        setTimeout(
            () => {

                const input =
                    document.getElementById(
                        "searchInput"
                    );


                if (input) {

                    input.focus();

                }

            },
            150
        );

    }

}


// =====================================
// HIỂN THỊ KẾT QUẢ TÌM KIẾM
// =====================================

function renderSearchResultsHTML() {

    if (!searchKeyword) {

        return `

            <div class="search-empty">

                Nhập từ khóa để tìm kiếm.

            </div>

        `;

    }


    if (
        searchResults.length === 0
    ) {

        return `

            <div class="search-empty">

                Không tìm thấy câu hỏi.

            </div>

        `;

    }


    let html = `

        <div class="search-count">

            Tìm thấy ${searchResults.length} câu

        </div>

    `;


    searchResults.forEach(
        (
            q,
            index
        ) => {

            html += `

                <div
                    class="search-result"
                    onclick="openSearchResult(${index})"
                >

                    <div
                        class="search-result-subject"
                    >

                        ${escapeHTML(
                            q.mon
                        )}

                    </div>


                    <div
                        class="search-result-question"
                    >

                        ${formatText(
                            q.question
                        )}

                    </div>

                </div>

            `;

        }
    );


    return html;

}


// =====================================
// THỰC HIỆN TÌM KIẾM
// =====================================

function performSearch() {

    const input =
        document.getElementById(
            "searchInput"
        );


    if (!input) {
        return;
    }


    searchKeyword =
        input.value.trim();


    const keyword =
        normalizeText(
            searchKeyword
        );


    const results =
        keyword === ""
            ? []
            : questions.filter(
                q => {

                    const question =
                        normalizeText(
                            q.question
                        );


                    const answer =
                        normalizeText(
                            q.answer
                        );


                    const explanation =
                        normalizeText(
                            q.explanation
                        );


                    return (

                        question.includes(
                            keyword
                        ) ||

                        answer.includes(
                            keyword
                        ) ||

                        explanation.includes(
                            keyword
                        )

                    );

                }
            );


    searchResults =
        results;


    const container =
        document.getElementById(
            "searchResults"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        renderSearchResultsHTML();

}


// =====================================
// MỞ KẾT QUẢ TÌM KIẾM
// =====================================

function openSearchResult(
    index
) {

    selectedQuestions =
        searchResults;


    currentQuestion =
        index;


    returnToSearch = true;


    showQuestion();

}


// =====================================
// CHUẨN HÓA TÌM KIẾM
// =====================================

function normalizeText(
    text
) {

    return String(
        text ?? ""
    )
        .toLowerCase()
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /đ/g,
            "d"
        );

}


// =====================================
// FORMAT TEXT
// =====================================

function formatText(
    text
) {

    if (
        text === null ||
        text === undefined
    ) {

        return "";

    }


    return escapeHTML(
        String(text)
    ).replace(
        /\n/g,
        "<br>"
    );

}


// =====================================
// BẢO VỆ HTML
// =====================================

function escapeHTML(
    text
) {

    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}
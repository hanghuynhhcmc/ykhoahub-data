let questions = [];
let selectedQuestions = [];
let currentQuestion = 0;
let isFlipped = false;

let notLearnedQuestions = [];
let searchResults = [];


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

        const response = await fetch(
            ONLINE_DATA_URL,
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error("Không tải được dữ liệu online");
        }

        const onlineData = await response.json();

        if (!Array.isArray(onlineData)) {
            throw new Error("Dữ liệu online không hợp lệ");
        }

        questions = onlineData;

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
    // CACHE
    // =================================

    try {

        const savedData =
            localStorage.getItem(
                LOCAL_CACHE_KEY
            );

        if (savedData) {

            const cachedQuestions =
                JSON.parse(savedData);

            if (Array.isArray(cachedQuestions)) {

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
    // APK
    // =================================

    try {

        const response =
            await fetch("questions.json");

        if (!response.ok) {

            throw new Error(
                "Không tìm thấy questions.json"
            );

        }

        const apkData =
            await response.json();

        if (!Array.isArray(apkData)) {

            throw new Error(
                "questions.json không hợp lệ"
            );

        }

        questions =
            apkData;

        localStorage.setItem(
            LOCAL_CACHE_KEY,
            JSON.stringify(apkData)
        );

        showMenu();

    } catch (error) {

        document.getElementById(
            "app"
        ).innerHTML = `

            <div class="card">

                <h2>Lỗi tải dữ liệu</h2>

                <p>
                    Không thể tải dữ liệu câu hỏi.
                </p>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>

        `;

    }

}


loadQuestions();


// =====================================
// DANH SÁCH MÔN
// =====================================

function getSubjects() {

    return [
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


    // Chỉ giữ những môn vẫn còn trong dữ liệu
    saved =
        saved.filter(
            subject =>
                subjects.includes(subject)
        );


    // Nếu lần đầu mở app:
    // tự động lấy 4 môn đầu tiên
    if (saved.length === 0) {

        saved =
            subjects.slice(0, 4);

        saveDashboardSubjects(
            saved
        );

    }


    return saved.slice(0, 4);

}


function saveDashboardSubjects(subjects) {

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

function removeDashboardSubject(subject) {

    let dashboard =
        getDashboardSubjects();

    dashboard =
        dashboard.filter(
            item => item !== subject
        );

    saveDashboardSubjects(
        dashboard
    );

    showMenu();

}


// =====================================
// THÊM MÔN VÀO DASHBOARD
// =====================================

function addDashboardSubject(subject) {

    if (!subject) {
        return;
    }

    let dashboard =
        getDashboardSubjects();

    if (
        dashboard.includes(subject)
    ) {
        return;
    }

    if (dashboard.length >= 4) {

        alert(
            "Dashboard chỉ hiển thị tối đa 4 môn."
        );

        return;

    }

    dashboard.push(subject);

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


function saveLearned(data) {

    localStorage.setItem(
        LEARNED_KEY,
        JSON.stringify(data)
    );

}


function markAsLearned(id) {

    if (
        id === null ||
        id === undefined ||
        String(id).trim() === ""
    ) {

        return;

    }

    const learned =
        getLearned();

    learned[String(id)] =
        true;

    saveLearned(
        learned
    );

}


// =====================================
// CHƯA THUỘC
// =====================================

function isNotLearned(id) {

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

function getSubjectStats(subject) {

    const subjectQuestions =
        questions.filter(
            q => q.mon === subject
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
                isNotLearned(q.id)
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

    const subjects =
        getSubjects();

    const dashboardSubjects =
        getDashboardSubjects();


    // =================================
    // DASHBOARD 4 Ô
    // =================================

    let dashboardHTML = "";


    for (
        let i = 0;
        i < 4;
        i++
    ) {

        const subject =
            dashboardSubjects[i];


        // =============================
        // Ô CÓ MÔN
        // =============================

        if (subject) {

            const stats =
                getSubjectStats(
                    subject
                );


            dashboardHTML += `

                <div class="subject-progress">

                    <button
                        class="dashboard-remove"
                        onclick="removeDashboardSubject(
                            ${JSON.stringify(subject)}
                        )"
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

        }


        // =============================
        // Ô TRỐNG
        // =============================

        else {

            const availableSubjects =
                subjects.filter(
                    item =>
                        !dashboardSubjects.includes(
                            item
                        )
                );


            let options = `

                <option value="">

                    ＋ Thêm môn học

                </option>

            `;


            availableSubjects.forEach(
                item => {

                    options += `

                        <option value="${escapeHTML(item)}">

                            ${escapeHTML(item)}

                        </option>

                    `;

                }
            );


            dashboardHTML += `

                <div class="dashboard-empty">

                    <div class="dashboard-empty-icon">
                        ＋
                    </div>


                    <div class="dashboard-empty-title">

                        Thêm môn học

                    </div>


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


    // =================================
    // DANH SÁCH MÔN CHO HỌC
    // =================================

    let subjectOptions = `

        <option value="">

            -- Chọn môn --

        </option>

    `;


    subjects.forEach(subject => {

        subjectOptions += `

            <option value="${escapeHTML(subject)}">

                ${escapeHTML(subject)}

            </option>

        `;

    });


    // =================================
    // RENDER
    // =================================

    document.getElementById(
        "app"
    ).innerHTML = `

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


        <div class="card study-selection">

            <label class="section-title">

                Chọn môn

            </label>


            <select id="subject">

                ${subjectOptions}

            </select>


            <button
                class="start-button"
                onclick="startQuiz()"
            >

                BẮT ĐẦU HỌC

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
// BẮT ĐẦU HỌC
// =====================================

function startQuiz() {

    const subject =
        document.getElementById(
            "subject"
        ).value;


    if (!subject) {

        alert(
            "Hãy chọn môn."
        );

        return;

    }


    selectedQuestions =
        questions.filter(
            q => q.mon === subject
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

    showQuestion();

}


// =====================================
// TẠO TẦN SUẤT
// =====================================

function createWeightedQuestions(list) {

    let result = [];


    list.forEach(question => {

        const id =
            question.id;


        const repeatCount =
            Number(
                localStorage.getItem(
                    "repeat_" + id
                )
            ) || 0;


        const weight =
            1 + repeatCount * 2;


        for (
            let i = 0;
            i < weight;
            i++
        ) {

            result.push(
                question
            );

        }

    });


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
        ] =
        [
            result[j],
            result[i]
        ];

    }


    return result;

}


// =====================================
// HIỆN FLASHCARD
// =====================================

function showQuestion() {

    const q =
        selectedQuestions[
            currentQuestion
        ];


    if (!q) {

        showResult();

        return;

    }


    markAsLearned(
        q.id
    );


    isFlipped = false;


    document.getElementById(
        "app"
    ).innerHTML = `

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


                <!-- MẶT TRƯỚC -->

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


                    <div class="flip-hint">

                        chạm để lật

                    </div>

                </div>


                <!-- MẶT SAU -->

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

function flipBack(event) {

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

function markNotLearned(event) {

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

function nextQuestion(event) {

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
// VỀ TRANG CHỦ
// =====================================

function goBackToMenu() {

    showMenu();

}


// =====================================
// HOÀN THÀNH
// =====================================

function showResult() {

    document.getElementById(
        "app"
    ).innerHTML = `

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

    notLearnedQuestions =
        questions.filter(
            q => isNotLearned(q.id)
        );


    if (
        notLearnedQuestions.length === 0
    ) {

        document.getElementById(
            "app"
        ).innerHTML = `

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
        (q, index) => {

            html += `

                <div
                    class="not-learned-item"
                    onclick="startNotLearned(${index})"
                >

                    <div
                        class="not-learned-subject"
                    >

                        ${escapeHTML(q.mon)}

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


    document.getElementById(
        "app"
    ).innerHTML =
        html;

}


// =====================================
// HỌC CÂU CHƯA THUỘC
// =====================================

function startNotLearned(index) {

    selectedQuestions =
        notLearnedQuestions;

    currentQuestion =
        index;

    showQuestion();

}


// =====================================
// TÌM KIẾM
// =====================================

function showSearch() {

    document.getElementById(
        "app"
    ).innerHTML = `

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
                oninput="performSearch()"
                autocomplete="off"
                autocorrect="off"
                spellcheck="false"
            >

        </div>


        <div id="searchResults">

            <div class="search-empty">

                Nhập từ khóa để tìm kiếm.

            </div>

        </div>

    `;


    // Tự động đưa con trỏ vào ô tìm kiếm
    // và yêu cầu bàn phím Android mở lên
    setTimeout(() => {

        const input =
            document.getElementById(
                "searchInput"
            );

        if (input) {

            input.focus();

            input.click();

        }

    }, 150);

}


// =====================================
// TÌM KIẾM
// =====================================

function performSearch() {

    const input =
        document.getElementById(
            "searchInput"
        );


    if (!input) {
        return;
    }


    const keyword =
        normalizeText(
            input.value.trim()
        );


    const results =
        keyword === ""
            ? []
            : questions.filter(q => {

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

            });


    const container =
        document.getElementById(
            "searchResults"
        );


    if (!keyword) {

        container.innerHTML = `

            <div class="search-empty">

                Nhập từ khóa để tìm kiếm.

            </div>

        `;

        return;

    }


    if (
        results.length === 0
    ) {

        container.innerHTML = `

            <div class="search-empty">

                Không tìm thấy câu hỏi.

            </div>

        `;

        return;

    }


    searchResults =
        results;


    let html = `

        <div class="search-count">

            Tìm thấy ${results.length} câu

        </div>

    `;


    results.forEach(
        (q, index) => {

            html += `

                <div
                    class="search-result"
                    onclick="openSearchResult(${index})"
                >

                    <div
                        class="search-result-subject"
                    >

                        ${escapeHTML(q.mon)}

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


    container.innerHTML =
        html;

}


// =====================================
// MỞ KẾT QUẢ
// =====================================

function openSearchResult(index) {

    selectedQuestions =
        searchResults;

    currentQuestion =
        index;

    showQuestion();

}


// =====================================
// CHUẨN HÓA TÌM KIẾM
// =====================================

function normalizeText(text) {

    return String(
        text ?? ""
    )
        .toLowerCase()
        .normalize("NFD")
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

function formatText(text) {

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

function escapeHTML(text) {

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

/* =====================================
   Y KHOA HUB - APP.JS
   Chỉ hỗ trợ 2 loại câu hỏi:
   - MCQ        (dang = "MCQ")
   - FILL_BLANK (dang = "FILL_BLANK")
   Flashcard đã bị loại bỏ hoàn toàn.
===================================== */

let questions = [];
let selectedQuestions = [];
let currentQuestion = 0;

let notLearnedQuestions = [];
let searchResults = [];

let searchKeyword = "";
let returnToSearch = false;

let answeredState = {};


/* =====================================
   DỮ LIỆU ONLINE
===================================== */

const ONLINE_DATA_URL =
    "https://raw.githubusercontent.com/hanghuynhhcmc/ykhoahub-data/refs/heads/main/questions.json";

const LOCAL_CACHE_KEY = "ykhoahub_questions_cache";
const LEARNED_KEY = "ykhoahub_learned";
const DASHBOARD_KEY = "ykhoahub_dashboard_subjects";


/* =====================================
   TẢI DỮ LIỆU
===================================== */

async function loadQuestions() {
    try {
        const response = await fetch(ONLINE_DATA_URL, { cache: "no-store" });
        if (!response.ok) throw new Error("Không tải được dữ liệu online");
        const onlineData = await response.json();
        if (!Array.isArray(onlineData)) throw new Error("Dữ liệu online không hợp lệ");

        questions = onlineData;
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(onlineData));
        showMenu();
        return;
    } catch (error) {
        console.log("Không tải được dữ liệu online:", error);
    }

    try {
        const savedData = localStorage.getItem(LOCAL_CACHE_KEY);
        if (savedData) {
            const cached = JSON.parse(savedData);
            if (Array.isArray(cached)) {
                questions = cached;
                showMenu();
                return;
            }
        }
    } catch (error) {
        console.log("Không đọc được cache:", error);
    }

    try {
        const response = await fetch("questions.json");
        if (!response.ok) throw new Error("Không tìm thấy questions.json");
        const localData = await response.json();
        if (!Array.isArray(localData)) throw new Error("questions.json không hợp lệ");

        questions = localData;
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(localData));
        showMenu();
    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        const app = document.getElementById("app");
        if (app) {
            app.innerHTML = `
                <div class="card">
                    <h2>Lỗi tải dữ liệu</h2>
                    <p>Không thể tải dữ liệu câu hỏi.</p>
                    <p>${escapeHTML(error.message)}</p>
                </div>
            `;
        }
    }
}

loadQuestions();


/* =====================================
   DANH SÁCH MÔN
===================================== */

function getSubjects() {
    return [
        ...new Set(
            questions
                .map(q => q.mon)
                .filter(q => q !== null && q !== undefined && String(q).trim() !== "")
        )
    ];
}


/* =====================================
   DASHBOARD
===================================== */

function getDashboardSubjects() {
    const subjects = getSubjects();
    let saved = [];

    try {
        saved = JSON.parse(localStorage.getItem(DASHBOARD_KEY)) || [];
    } catch { saved = []; }

    saved = saved.filter(s => subjects.includes(s));

    if (saved.length === 0) {
        saved = subjects.slice(0, 4);
        saveDashboardSubjects(saved);
    }

    return saved.slice(0, 4);
}

function saveDashboardSubjects(subjects) {
    localStorage.setItem(DASHBOARD_KEY, JSON.stringify(subjects.slice(0, 4)));
}

function removeDashboardSubject(subject, event) {
    if (event) event.stopPropagation();
    let dashboard = getDashboardSubjects();
    dashboard = dashboard.filter(item => item !== subject);
    saveDashboardSubjects(dashboard);
    showMenu();
}

function addDashboardSubject(subject) {
    if (!subject) return;
    let dashboard = getDashboardSubjects();
    if (dashboard.includes(subject)) {
        alert("Môn này đã có trong Dashboard.");
        return;
    }
    if (dashboard.length >= 4) {
        alert("Dashboard chỉ hiển thị tối đa 4 môn.");
        return;
    }
    dashboard.push(subject);
    saveDashboardSubjects(dashboard);
    showMenu();
}


/* =====================================
   ĐÃ HỌC / CHƯA THUỘC
===================================== */

function getLearned() {
    try {
        return JSON.parse(localStorage.getItem(LEARNED_KEY)) || {};
    } catch { return {}; }
}

function saveLearned(data) {
    localStorage.setItem(LEARNED_KEY, JSON.stringify(data));
}

function markAsLearned(id) {
    if (id === null || id === undefined || String(id).trim() === "") return;
    const learned = getLearned();
    learned[String(id)] = true;
    saveLearned(learned);
}

function isNotLearned(id) {
    const count = Number(localStorage.getItem("repeat_" + id)) || 0;
    return count > 0;
}

function markAsNotLearned(id) {
    if (id === null || id === undefined || String(id).trim() === "") return;
    const key = "repeat_" + id;
    const current = Number(localStorage.getItem(key)) || 0;
    localStorage.setItem(key, current + 1);
}


/* =====================================
   THỐNG KÊ MÔN
===================================== */

function getSubjectStats(subject) {
    const subjectQuestions = questions.filter(q => q.mon === subject);
    const learned = getLearned();
    const total = subjectQuestions.length;
    const learnedCount = subjectQuestions.filter(q => learned[String(q.id)]).length;
    const reviewCount = subjectQuestions.filter(q => isNotLearned(q.id)).length;
    const remaining = Math.max(0, total - learnedCount);
    return { total, learned: learnedCount, review: reviewCount, remaining };
}


/* =====================================
   TRANG CHỦ
===================================== */

function showMenu() {
    returnToSearch = false;
    answeredState = {};

    const subjects = getSubjects();
    const dashboardSubjects = getDashboardSubjects();
    const availableSubjects = subjects.filter(s => !dashboardSubjects.includes(s));

    let dashboardHTML = "";

    for (let i = 0; i < 4; i++) {
        const subject = dashboardSubjects[i];

        if (subject) {
            const stats = getSubjectStats(subject);
            dashboardHTML += `
                <div class="subject-progress" onclick='startDashboardQuiz(${JSON.stringify(subject)})'>
                    <button class="dashboard-remove"
                        onclick='removeDashboardSubject(${JSON.stringify(subject)}, event)'>×</button>
                    <div class="subject-name">${escapeHTML(subject)}</div>
                    <div class="progress-item"><span>Đã học</span><strong>${stats.learned}</strong></div>
                    <div class="progress-item"><span>Chưa thuộc</span><strong>${stats.review}</strong></div>
                    <div class="progress-item"><span>Còn lại</span><strong>${stats.remaining}</strong></div>
                </div>
            `;
        } else {
            let options = `<option value="">+ THÊM MÔN HỌC</option>`;
            availableSubjects.forEach(item => {
                options += `<option value="${escapeHTML(item)}">${escapeHTML(item)}</option>`;
            });
            dashboardHTML += `
                <div class="dashboard-empty">
                    <select class="dashboard-add-select"
                        onchange="addDashboardSubject(this.value); this.value='';">
                        ${options}
                    </select>
                </div>
            `;
        }
    }

    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
        <div class="section-heading">MÔN ĐANG HỌC</div>
        <div class="dashboard-grid">${dashboardHTML}</div>
        <div class="menu-section">
            <button class="menu-button secondary" onclick="showNotLearned()">
                📚 CÂU CHƯA THUỘC
            </button>
        </div>
        <div class="search-home-section">
            <button class="menu-button search-home-button" onclick="showSearch()">
                🔎 TÌM KIẾM
            </button>
        </div>
    `;
}


/* =====================================
   BẮT ĐẦU HỌC
===================================== */

function startDashboardQuiz(subject) {
    if (!subject) return;
    selectedQuestions = questions.filter(q => q.mon === subject);
    if (selectedQuestions.length === 0) {
        alert("Môn này chưa có câu hỏi.");
        return;
    }
    selectedQuestions = createWeightedQuestions(selectedQuestions);
    currentQuestion = 0;
    returnToSearch = false;
    answeredState = {};
    showQuestion();
}

function createWeightedQuestions(list) {
    let result = [];
    list.forEach(question => {
        const id = question.id;
        const repeatCount = Number(localStorage.getItem("repeat_" + id)) || 0;
        const weight = 1 + repeatCount * 2;
        for (let i = 0; i < weight; i++) result.push(question);
    });
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}


/* =====================================
   XÁC ĐỊNH LOẠI CÂU HỎI
===================================== */

function getQuestionType(q) {
    if (!q) return null;
    const type = String(q.dang || "").trim().toUpperCase();
    if (type === "MCQ") return "MCQ";
    if (type === "FILL_BLANK") return "FILL_BLANK";
    return null;
}

function isValidQuestion(q) {
    const type = getQuestionType(q);
    if (!type) return false;

    if (type === "MCQ") {
        if (!q.choices) return false;
        const choices = getChoices(q.choices);
        if (choices.length === 0) return false;
        if (!q.answer) return false;
        return true;
    }

    const placeholderCount = countPlaceholders(q.question || "");
    if (placeholderCount === 0) return false;
    const answers = getFillBlankAnswers(q.answer);
    if (answers.length !== placeholderCount) return false;
    return true;
}


/* =====================================
   HIỆN CÂU HỎI
===================================== */

function showQuestion() {
    const q = selectedQuestions[currentQuestion];

    if (!q) {
        showResult();
        return;
    }

    if (!isValidQuestion(q)) {
        console.warn("Bỏ qua câu hỏi không hợp lệ:", q && q.id, q && q.dang);
        currentQuestion++;
        if (currentQuestion >= selectedQuestions.length) {
            showResult();
        } else {
            showQuestion();
        }
        return;
    }

    if (!answeredState[currentQuestion]) {
        answeredState[currentQuestion] = createEmptyState(q);
    }

    markAsLearned(q.id);

    const type = getQuestionType(q);
    if (type === "MCQ") {
        renderMCQ(q, answeredState[currentQuestion]);
    } else {
        renderFillBlank(q, answeredState[currentQuestion]);
    }
}

function createEmptyState(q) {
    const type = getQuestionType(q);
    if (type === "MCQ") {
        return {
            type: "MCQ",
            checked: false,
            selectedIndex: null,
            isCorrect: false,
            markedNotLearned: false,
        };
    }
    return {
        type: "FILL_BLANK",
        checked: false,
        userAnswers: [],
        results: [],
        markedNotLearned: false,
    };
}


/* =====================================
   HEADER
===================================== */

function createStudyHeader(q) {
    return `
        <div class="study-header">
            <button class="back-button" onclick="goBackToMenu()">←</button>
            <div class="study-header-info">
                <div class="study-subject">${escapeHTML(q.mon)}</div>
                <div class="study-counter">
                    Câu ${currentQuestion + 1} / ${selectedQuestions.length}
                </div>
            </div>
        </div>
    `;
}


/* =====================================
   BOTTOM NAV
===================================== */

function createBottomNav() {
    const isFirst = currentQuestion === 0;
    return `
        <div class="bottom-nav-wrapper">
            <div class="bottom-nav">
                <button type="button"
                    class="bottom-nav-button prev"
                    onclick="prevQuestion(event)"
                    ${isFirst ? "disabled" : ""}>
                    <span class="nav-icon">←</span>
                    <span class="nav-label">Câu trước</span>
                </button>
                <button type="button"
                    class="bottom-nav-button next"
                    onclick="nextQuestion(event)">
                    <span class="nav-label">Câu tiếp theo</span>
                    <span class="nav-icon">→</span>
                </button>
            </div>
        </div>
    `;
}


/* =====================================
   MCQ
===================================== */

function renderMCQ(q, state) {
    const app = document.getElementById("app");
    if (!app) return;

    const choices = getChoices(q.choices);
    const correctAnswer = String(q.answer ?? "").trim();

    let choicesHTML = "";
    choices.forEach((choice, index) => {
        let cls = "answer-choice";
        let tick = "";

        if (state.checked) {
            const isCorrectChoice = normalizeAnswer(choice) === normalizeAnswer(correctAnswer);
            const isSelected = state.selectedIndex === index;

            if (isCorrectChoice) {
                cls += " correct";
                tick = `<span class="choice-tick"></span>`;
            } else if (isSelected) {
                cls += " wrong";
                tick = `<span class="choice-tick"></span>`;
            } else {
                tick = `<span class="choice-tick"></span>`;
            }
        } else {
            if (state.selectedIndex === index) cls += " selected";
            tick = `<span class="choice-tick"></span>`;
        }

        choicesHTML += `
            <button type="button"
                class="${cls}"
                data-index="${index}"
                onclick="selectMCQAnswer(${index}, event)"
                ${state.checked ? "disabled" : ""}>
                ${tick}
                <span class="choice-text">${formatText(choice)}</span>
            </button>
        `;
    });

    const checkDisabled = state.checked || state.selectedIndex === null;

    app.innerHTML = `
        ${createStudyHeader(q)}
        <div class="interactive-card">
            <div class="mcq-question-text">${formatText(q.question)}</div>

            <div id="mcqChoices" class="answer-choices">${choicesHTML}</div>

            <div class="mcq-actions">
                <button type="button"
                    class="check-answer-button"
                    id="mcqCheckButton"
                    onclick="checkMCQAnswer(event)"
                    ${checkDisabled ? "disabled" : ""}>
                    KIỂM TRA
                </button>
            </div>

            <div id="mcqExplanation"></div>
            <div id="autoNotLearned"></div>

            ${createBottomNav()}
        </div>
    `;

    if (state.checked) {
        renderMCQExplanation(q, state);
    }
}

function selectMCQAnswer(index, event) {
    if (event) event.stopPropagation();

    const state = answeredState[currentQuestion];
    if (!state || state.checked) return;

    state.selectedIndex = index;

    document.querySelectorAll(".answer-choice").forEach((btn, i) => {
        btn.classList.toggle("selected", i === index);
    });

    const checkBtn = document.getElementById("mcqCheckButton");
    if (checkBtn) checkBtn.disabled = false;
}

function checkMCQAnswer(event) {
    if (event) event.stopPropagation();

    const q = selectedQuestions[currentQuestion];
    const state = answeredState[currentQuestion];
    if (!q || !state || state.checked) return;

    const choices = getChoices(q.choices);
    const correctAnswer = String(q.answer ?? "").trim();
    const selectedAnswer = choices[state.selectedIndex];

    const isCorrect = normalizeAnswer(selectedAnswer) === normalizeAnswer(correctAnswer);
    state.isCorrect = isCorrect;
    state.checked = true;

    document.querySelectorAll(".answer-choice").forEach((btn, i) => {
        btn.disabled = true;
        btn.classList.remove("selected");

        const choice = choices[i];
        if (normalizeAnswer(choice) === normalizeAnswer(correctAnswer)) {
            btn.classList.add("correct");
        } else if (i === state.selectedIndex) {
            btn.classList.add("wrong");
        }
    });

    const checkBtn = document.getElementById("mcqCheckButton");
    if (checkBtn) checkBtn.disabled = true;

    if (!isCorrect) {
        if (!state.markedNotLearned) {
            markAsNotLearned(q.id);
            state.markedNotLearned = true;
        }
    }

    renderMCQExplanation(q, state);
}

function renderMCQExplanation(q, state) {
    const expBox = document.getElementById("mcqExplanation");
    const noteBox = document.getElementById("autoNotLearned");
    if (!expBox) return;

    expBox.innerHTML = `
        <div class="explanation-section">
            <div class="explanation-title">GIẢI THÍCH</div>
            <div class="feedback-explanation">
                ${q.explanation ? formatText(q.explanation) : "Không có giải thích cho câu này."}
            </div>
        </div>
    `;

    if (noteBox) {
        if (!state.isCorrect && state.markedNotLearned) {
            noteBox.innerHTML = `
                <div class="auto-not-learned-note">
                    📌 Câu này đã được thêm vào danh sách Chưa thuộc
                </div>
            `;
        } else {
            noteBox.innerHTML = "";
        }
    }
}


/* =====================================
   FILL_BLANK
===================================== */

function renderFillBlank(q, state) {
    const app = document.getElementById("app");
    if (!app) return;

    const correctAnswers = getFillBlankAnswers(q.answer);
    const parts = splitFillBlankQuestion(q.question);

    if (!state.userAnswers || state.userAnswers.length !== correctAnswers.length) {
        state.userAnswers = new Array(correctAnswers.length).fill("");
    }

    const answerHTML = buildFillBlankAnswerHTML(
        parts.answerTemplate,
        state.userAnswers,
        state.checked,
        state.results
    );

    const dapAnHTML = state.checked
        ? buildFillBlankDapAnHTML(parts.answerTemplate, correctAnswers)
        : "";

    const checkDisabled = state.checked || !hasAnyInput(state.userAnswers);

    app.innerHTML = `
        ${createStudyHeader(q)}
        <div class="interactive-card">

            <!-- KHỐI CÂU HỎI -->
            <div class="fill-blank-cau-hoi">
                <div class="card-label">CÂU HỎI</div>
                <div class="fill-blank-cau-hoi-text">${parts.questionPart}</div>
            </div>

            <!-- KHỐI TRẢ LỜI -->
            <div class="fill-blank-tra-loi">
                <div class="card-label">TRẢ LỜI</div>
                <div class="fill-blank-tra-loi-text" id="fillBlankAnswerArea">
                    ${answerHTML}
                </div>
            </div>

            <div class="fill-blank-actions">
                <button type="button"
                    class="check-answer-button"
                    id="fillCheckButton"
                    onclick="checkFillBlankAnswer(event)"
                    ${checkDisabled ? "disabled" : ""}>
                    KIỂM TRA
                </button>
            </div>

            <div id="fillDapAn">${dapAnHTML}</div>
            <div id="fillGiaiThich"></div>
            <div id="autoNotLearned"></div>

            ${createBottomNav()}
        </div>
    `;

    attachFillBlankInputs(q, state);

    if (state.checked) {
        renderFillBlankExplanation(q, state);
        lockFillBlankInputs(state);
    }
}

/**
 * Tách question thành 2 phần:
 *  - questionPart: phần câu hỏi dẫn (trước "Đáp án:")
 *  - answerTemplate: phần chứa {{n}} (sau "Đáp án:")
 *
 * Format thực tế:
 *   <câu hỏi dẫn>
 *   Đáp án:
 *   <đoạn có {{1}}, {{2}}, ...>
 *
 * Nếu không có "Đáp án:", coi toàn bộ là câu hỏi dẫn.
 */
function splitFillBlankQuestion(question) {
    const text = String(question ?? "");

    const dapAnRegex = /Đáp\s*án\s*:/i;
    const match = text.match(dapAnRegex);

    if (!match) {
        return {
            questionPart: formatText(text.trim()),
            answerTemplate: "",
        };
    }

    const dapAnIdx = match.index;
    const afterDapAn = dapAnIdx + match[0].length;

    let questionPartRaw = text.slice(0, dapAnIdx).trim();
    let answerTemplate = text.slice(afterDapAn).trim();

    if (!questionPartRaw) {
        questionPartRaw = "Điền vào chỗ trống:";
    }

    return {
        questionPart: formatText(questionPartRaw),
        answerTemplate: answerTemplate,
    };
}

/** Sinh HTML cho đoạn trả lời: thay {{n}} bằng input */
function buildFillBlankAnswerHTML(template, userAnswers, checked, results) {
    if (!template) return "";

    const container = document.createElement("div");
    const regex = /\{\{(\d+)\}\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(template)) !== null) {
        // Text trước placeholder
        const textBefore = template.slice(lastIndex, match.index);
        if (textBefore) {
            container.appendChild(document.createTextNode(textBefore));
        }

        const idx = parseInt(match[1], 10) - 1;
        const val = userAnswers[idx] || "";

        let inputCls = "fill-blank-inline-input";
        let isCorrect = false;

        if (checked) {
            isCorrect = results && results[idx];
            inputCls += isCorrect ? " correct-input" : " wrong-input";
        }

        // Tạo wrapper span
        const wrapper = document.createElement("span");
        wrapper.className = "fill-blank-inline";
        wrapper.dataset.index = String(idx);

        // Tạo input
        const input = document.createElement("input");
        input.type = "text";
        input.className = inputCls;
        input.dataset.index = String(idx);
        input.value = val;
        input.setAttribute("autocomplete", "off");
        input.setAttribute("autocorrect", "off");
        input.setAttribute("spellcheck", "false");
        if (checked) input.disabled = true;

        wrapper.appendChild(input);

        // Tick ✓/✗
        if (checked) {
            const status = document.createElement("span");
            status.className = isCorrect
                ? "fill-blank-inline-status fill-status-correct"
                : "fill-blank-inline-status fill-status-wrong";
            status.textContent = isCorrect ? "✓" : "✗";
            wrapper.appendChild(status);
        }

        container.appendChild(wrapper);

        lastIndex = match.index + match[0].length;
    }

    // Text còn lại sau placeholder cuối
    const textAfter = template.slice(lastIndex);
    if (textAfter) {
        container.appendChild(document.createTextNode(textAfter));
    }

    // Đổi \n thành <br>
    let html = container.innerHTML;
    html = html.replace(/\n/g, "<br>");

    return html;
}

/** Sinh HTML khối ĐÁP ÁN */
function buildFillBlankDapAnHTML(template, correctAnswers) {
    if (!template) return "";

    const regex = /\{\{(\d+)\}\}/g;
    let html = "";
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(template)) !== null) {
        html += escapeHTML(template.slice(lastIndex, match.index));
        const idx = parseInt(match[1], 10) - 1;
        const val = correctAnswers[idx] || "";
        html += `<span class="answer-highlight">${escapeHTML(val)}</span>`;
        lastIndex = match.index + match[0].length;
    }

    html += escapeHTML(template.slice(lastIndex));
    html = html.replace(/\n/g, "<br>");

    return `
        <div class="fill-dap-an">
            <div class="explanation-title">ĐÁP ÁN</div>
            <div>${html}</div>
        </div>
    `;
}

function attachFillBlankInputs(q, state) {
    const inputs = document.querySelectorAll(".fill-blank-inline-input");
    if (!inputs.length) return;

    inputs.forEach(input => {
        input.addEventListener("input", (e) => {
            const idx = Number(e.target.dataset.index);
            const val = e.target.value;

            state.userAnswers[idx] = val;

            const checkBtn = document.getElementById("fillCheckButton");
            if (checkBtn) {
                checkBtn.disabled = state.checked || !hasAnyInput(state.userAnswers);
            }
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (!state.checked && hasAnyInput(state.userAnswers)) {
                    checkFillBlankAnswer(e);
                }
            }
        });
    });
}

function hasAnyInput(arr) {
    if (!arr || !arr.length) return false;
    return arr.some(v => String(v || "").trim() !== "");
}

function lockFillBlankInputs(state) {
    document.querySelectorAll(".fill-blank-inline-input").forEach(inp => {
        inp.disabled = true;
    });
    const btn = document.getElementById("fillCheckButton");
    if (btn) btn.disabled = true;
}

function checkFillBlankAnswer(event) {
    if (event) event.stopPropagation();

    const q = selectedQuestions[currentQuestion];
    const state = answeredState[currentQuestion];
    if (!q || !state || state.checked) return;

    const correctAnswers = getFillBlankAnswers(q.answer);
    const inputs = document.querySelectorAll(".fill-blank-inline-input");

    inputs.forEach(inp => {
        const idx = Number(inp.dataset.index);
        state.userAnswers[idx] = inp.value;
    });

    state.results = correctAnswers.map((ans, i) => {
        const user = state.userAnswers[i] || "";
        return normalizeAnswer(user) === normalizeAnswer(ans);
    });

    state.checked = true;

    const hasWrong = state.results.some(r => !r);

    if (hasWrong) {
        if (!state.markedNotLearned) {
            markAsNotLearned(q.id);
            state.markedNotLearned = true;
        }
    }

    inputs.forEach(inp => {
        const idx = Number(inp.dataset.index);
        inp.disabled = true;
        inp.classList.remove("correct-input", "wrong-input");
        inp.classList.add(state.results[idx] ? "correct-input" : "wrong-input");

        const wrapper = inp.closest(".fill-blank-inline");
        if (wrapper) {
            const oldStatus = wrapper.querySelector(".fill-blank-inline-status");
            if (oldStatus) oldStatus.remove();

            const status = document.createElement("span");
            status.className = state.results[idx]
                ? "fill-blank-inline-status fill-status-correct"
                : "fill-blank-inline-status fill-status-wrong";
            status.textContent = state.results[idx] ? "✓" : "✗";
            wrapper.appendChild(status);
        }
    });

    const checkBtn = document.getElementById("fillCheckButton");
    if (checkBtn) checkBtn.disabled = true;

    const parts = splitFillBlankQuestion(q.question);
    const dapAnBox = document.getElementById("fillDapAn");
    if (dapAnBox) {
        dapAnBox.innerHTML = buildFillBlankDapAnHTML(parts.answerTemplate, correctAnswers);
    }

    renderFillBlankExplanation(q, state);
}

function renderFillBlankExplanation(q, state) {
    const expBox = document.getElementById("fillGiaiThich");
    const noteBox = document.getElementById("autoNotLearned");

    if (expBox) {
        expBox.innerHTML = `
            <div class="explanation-section fill-giai-thich">
                <div class="explanation-title">GIẢI THÍCH</div>
                <div class="feedback-explanation">
                    ${q.explanation ? formatText(q.explanation) : "Không có giải thích cho câu này."}
                </div>
            </div>
        `;
    }

    if (noteBox) {
        const hasWrong = state.results && state.results.some(r => !r);
        if (hasWrong && state.markedNotLearned) {
            noteBox.innerHTML = `
                <div class="auto-not-learned-note">
                    📌 Câu này đã được thêm vào danh sách Chưa thuộc
                </div>
            `;
        } else {
            noteBox.innerHTML = "";
        }
    }
}


/* =====================================
   ĐIỀU HƯỚNG
===================================== */

function prevQuestion(event) {
    if (event) event.stopPropagation();
    if (currentQuestion <= 0) return;
    currentQuestion--;
    showQuestion();
}

function nextQuestion(event) {
    if (event) event.stopPropagation();

    currentQuestion++;

    if (currentQuestion >= selectedQuestions.length) {
        showResult();
        return;
    }
    showQuestion();
}

function goBackToMenu() {
    if (returnToSearch) {
        returnToSearch = false;
        showSearch(false);
        return;
    }
    showMenu();
}


/* =====================================
   HOÀN THÀNH
===================================== */

function showResult() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
        <div class="result-card">
            <div class="result-icon">🎉</div>
            <h2>Hoàn thành!</h2>
            <p>Bạn đã hoàn thành lượt học.</p>
            <button type="button" onclick="showMenu()">VỀ TRANG CHỦ</button>
        </div>
    `;
}


/* =====================================
   CÂU CHƯA THUỘC
===================================== */

function showNotLearned() {
    returnToSearch = false;
    answeredState = {};

    notLearnedQuestions = questions.filter(q => isNotLearned(q.id));

    if (notLearnedQuestions.length === 0) {
        const app = document.getElementById("app");
        if (app) {
            app.innerHTML = `
                <div class="card empty-state">
                    <div class="empty-icon">🎉</div>
                    <h2>Chưa có câu nào</h2>
                    <p>Bạn chưa đánh dấu câu nào là "Chưa thuộc".</p>
                    <button type="button" onclick="showMenu()">← VỀ TRANG CHỦ</button>
                </div>
            `;
        }
        return;
    }

    let html = `
        <div class="page-header">
            <button class="back-button" onclick="showMenu()">←</button>
            <div>
                <h2>📚 CÂU CHƯA THUỘC</h2>
                <p>${notLearnedQuestions.length} câu</p>
            </div>
        </div>
        <div class="not-learned-list">
    `;

    notLearnedQuestions.forEach((q, index) => {
        html += `
            <div class="not-learned-item" onclick="startNotLearned(${index})">
                <div class="not-learned-subject">${escapeHTML(q.mon)}</div>
                <div class="not-learned-question">${formatText(stripFillBlank(q))}</div>
            </div>
        `;
    });

    html += `</div>`;

    const app = document.getElementById("app");
    if (app) app.innerHTML = html;
}

function stripFillBlank(q) {
    const type = getQuestionType(q);
    if (type !== "FILL_BLANK") return q.question || "";

    const text = String(q.question || "");
    const match = text.match(/Đáp\s*án\s*:/i);
    if (match) {
        return text.slice(0, match.index).trim();
    }
    return text;
}

function startNotLearned(index) {
    returnToSearch = false;
    selectedQuestions = notLearnedQuestions;
    currentQuestion = index;
    answeredState = {};
    showQuestion();
}


/* =====================================
   TÌM KIẾM
===================================== */

function showSearch(resetSearch = true) {
    if (resetSearch) {
        searchKeyword = "";
        searchResults = [];
    }

    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
        <div class="page-header">
            <button class="back-button" onclick="showMenu()">←</button>
            <div>
                <h2>🔎 TÌM KIẾM</h2>
                <p>Tìm trong câu hỏi, đáp án và giải thích</p>
            </div>
        </div>
        <div class="search-box">
            <input id="searchInput" type="search" inputmode="search" enterkeyhint="search"
                placeholder="Nhập từ khóa..."
                value="${escapeHTML(searchKeyword)}"
                oninput="performSearch()"
                autocomplete="off" autocorrect="off" spellcheck="false">
        </div>
        <div id="searchResults">${renderSearchResultsHTML()}</div>
    `;

    if (resetSearch) {
        setTimeout(() => {
            const input = document.getElementById("searchInput");
            if (input) input.focus();
        }, 150);
    }
}

function renderSearchResultsHTML() {
    if (!searchKeyword) {
        return `<div class="search-empty">Nhập từ khóa để tìm kiếm.</div>`;
    }
    if (searchResults.length === 0) {
        return `<div class="search-empty">Không tìm thấy câu hỏi.</div>`;
    }

    let html = `<div class="search-count">Tìm thấy ${searchResults.length} câu</div>`;

    searchResults.forEach((q, index) => {
        html += `
            <div class="search-result" onclick="openSearchResult(${index})">
                <div class="search-result-subject">${escapeHTML(q.mon)}</div>
                <div class="search-result-question">${formatText(stripFillBlank(q))}</div>
            </div>
        `;
    });

    return html;
}

function performSearch() {
    const input = document.getElementById("searchInput");
    if (!input) return;

    searchKeyword = input.value.trim();
    const keyword = normalizeText(searchKeyword);

    const results = keyword === ""
        ? []
        : questions.filter(q => {
            const question = normalizeText(q.question || "");
            const answer = normalizeText(q.answer || "");
            const explanation = normalizeText(q.explanation || "");
            return question.includes(keyword)
                || answer.includes(keyword)
                || explanation.includes(keyword);
        });

    searchResults = results;

    const container = document.getElementById("searchResults");
    if (container) container.innerHTML = renderSearchResultsHTML();
}

function openSearchResult(index) {
    selectedQuestions = searchResults;
    currentQuestion = index;
    returnToSearch = true;
    answeredState = {};
    showQuestion();
}


/* =====================================
   HELPERS - PARSE
===================================== */

function getChoices(choices) {
    if (choices === null || choices === undefined) return [];
    return String(choices)
        .split(/\r?\n/)
        .map(c => c.trim())
        .filter(c => c !== "");
}

function getFillBlankAnswers(answer) {
    if (answer === null || answer === undefined) return [];
    return String(answer)
        .split("|")
        .map(a => a.trim())
        .filter(a => a !== "");
}

function countPlaceholders(question) {
    const matches = String(question || "").match(/\{\{\d+\}\}/g);
    return matches ? matches.length : 0;
}


/* =====================================
   HELPERS - NORMALIZE / FORMAT
===================================== */

function normalizeAnswer(text) {
    return normalizeText(text)
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeText(text) {
    return String(text ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d");
}

function formatText(text) {
    if (text === null || text === undefined) return "";
    return escapeHTML(String(text)).replace(/\n/g, "<br>");
}

function escapeHTML(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
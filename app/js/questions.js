/* =====================================
   QUESTIONS - TẢI DATA + ĐÃ HỌC / CHƯA THUỘC
===================================== */

import { ONLINE_DATA_URL, LOCAL_CACHE_KEY, LEARNED_KEY } from './config.js';
import { state } from './state.js';
import { escapeHTML, formatText, getQuestionType } from './helpers.js';
import { showMenu } from './dashboard.js';


/* =====================================
   TẢI DỮ LIỆU CÂU HỎI
===================================== */

export async function loadQuestions() {
    try {
        const response = await fetch(ONLINE_DATA_URL, { cache: "no-store" });
        if (!response.ok) throw new Error("Không tải được dữ liệu online");
        const onlineData = await response.json();
        if (!Array.isArray(onlineData)) throw new Error("Dữ liệu online không hợp lệ");

        state.questions = onlineData;
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
                state.questions = cached;
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

        state.questions = localData;
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


/* =====================================
   ĐÃ HỌC / CHƯA THUỘC
===================================== */

export function getLearned() {
    try {
        return JSON.parse(localStorage.getItem(LEARNED_KEY)) || {};
    } catch { return {}; }
}

export function saveLearned(data) {
    localStorage.setItem(LEARNED_KEY, JSON.stringify(data));
}

export function markAsLearned(id) {
    if (id === null || id === undefined || String(id).trim() === "") return;
    const learned = getLearned();
    learned[String(id)] = true;
    saveLearned(learned);
}

export function isNotLearned(id) {
    const count = Number(localStorage.getItem("repeat_" + id)) || 0;
    return count > 0;
}

export function markAsNotLearned(id) {
    if (id === null || id === undefined || String(id).trim() === "") return;
    const key = "repeat_" + id;
    const current = Number(localStorage.getItem(key)) || 0;
    localStorage.setItem(key, current + 1);
}


/* =====================================
   DANH SÁCH MÔN + THỐNG KÊ
===================================== */

export function getSubjects() {
    return [
        ...new Set(
            state.questions
                .map(q => q.mon)
                .filter(q => q !== null && q !== undefined && String(q).trim() !== "")
        )
    ];
}

export function getSubjectStats(subject) {
    const subjectQuestions = state.questions.filter(q => q.mon === subject);
    const learned = getLearned();
    const total = subjectQuestions.length;
    const learnedCount = subjectQuestions.filter(q => learned[String(q.id)]).length;
    const reviewCount = subjectQuestions.filter(q => isNotLearned(q.id)).length;
    const remaining = Math.max(0, total - learnedCount);
    return { total, learned: learnedCount, review: reviewCount, remaining };
}


/* =====================================
   CÂU CHƯA THUỘC - MÀN HÌNH
===================================== */

export function showNotLearned() {
    state.returnToSearch = false;
    state.answeredState = {};

    state.notLearnedQuestions = state.questions.filter(q => isNotLearned(q.id));

    const app = document.getElementById("app");
    if (!app) return;

    if (state.notLearnedQuestions.length === 0) {
        app.innerHTML = `
            <div class="card empty-state">
                <div class="empty-icon">🎉</div>
                <h2>Chưa có câu nào</h2>
                <p>Bạn chưa đánh dấu câu nào là "Chưa thuộc".</p>
                <button type="button" data-action="back-menu">← VỀ TRANG CHỦ</button>
            </div>
        `;
        app.querySelector('[data-action="back-menu"]')
            .addEventListener("click", showMenu);
        return;
    }

    let html = `
        <div class="page-header">
            <button class="back-button" data-action="back-menu">←</button>
            <div>
                <h2>📚 CÂU CHƯA THUỘC</h2>
                <p>${state.notLearnedQuestions.length} câu</p>
            </div>
        </div>
        <div class="not-learned-list">
    `;

    state.notLearnedQuestions.forEach((q, index) => {
        html += `
            <div class="not-learned-item" data-index="${index}">
                <div class="not-learned-subject">${escapeHTML(q.mon)}</div>
                <div class="not-learned-question">${formatText(stripFillBlank(q))}</div>
            </div>
        `;
    });

    html += `</div>`;
    app.innerHTML = html;

    app.querySelector('[data-action="back-menu"]')
        .addEventListener("click", showMenu);

    app.querySelectorAll('.not-learned-item').forEach(item => {
        item.addEventListener("click", () => {
            const index = Number(item.dataset.index);
            startNotLearned(index);
        });
    });
}

export function stripFillBlank(q) {
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
    import('./study.js').then(({ showQuestion }) => {
        state.returnToSearch = false;
        state.selectedQuestions = state.notLearnedQuestions;
        state.currentQuestion = index;
        state.answeredState = {};
        showQuestion();
    });
}
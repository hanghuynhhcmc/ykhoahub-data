/* =====================================
   QUESTIONS - LOAD + QUẢN LÝ CÂU HỎI
===================================== */

import { state } from './state.js';
import {
    isValidQuestion,
    normalizeAnswer,
} from './helpers.js';
import {
    ONLINE_DATA_URL,
    LOCAL_CACHE_KEY,
    LEARNED_KEY,
} from './config.js';


/* =====================================
   LOAD CÂU HỎI
===================================== */

export async function loadQuestions() {
    let data = null;

    // 1. Thử tải online
    try {
        const res = await fetch(ONLINE_DATA_URL + "?t=" + Date.now());
        if (res.ok) {
            data = await res.json();
            try {
                localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(data));
            } catch { /* ignore quota */ }
        }
    } catch (err) {
        console.warn("Không tải được online, dùng cache:", err);
    }

    // 2. Fallback: dùng cache
    if (!data) {
        try {
            const cached = localStorage.getItem(LOCAL_CACHE_KEY);
            if (cached) data = JSON.parse(cached);
        } catch { /* ignore */ }
    }

    // 3. Không có gì cả
    if (!data) {
        throw new Error("Không có dữ liệu câu hỏi (online + cache đều lỗi).");
    }

    // 4. Chuẩn hóa dữ liệu
    const rawList = Array.isArray(data) ? data : (data.questions || []);

    state.questions = rawList
        .map((q, i) => ({
            id: q.id ?? i + 1,
            mon: String(q.mon ?? q.subject ?? "").trim(),
            dang: String(q.dang ?? q.type ?? "").trim().toUpperCase(),
            question: q.question ?? q.cau_hoi ?? "",
            choices: q.choices ?? q.lua_chon ?? "",
            answer: q.answer ?? q.dap_an ?? "",
            explanation: q.explanation ?? q.giai_thich ?? "",
        }))
        .filter(isValidQuestion);

    console.log(`Đã tải ${state.questions.length} câu hỏi hợp lệ.`);

    // 5. Hiển thị menu
    const { showMenu } = await import('./dashboard.js');
    showMenu();
}


/* =====================================
   DANH SÁCH MÔN
===================================== */

export function getSubjects() {
    const set = new Set();
    state.questions.forEach(q => {
        if (q.mon) set.add(q.mon);
    });
    return Array.from(set);
}


/* =====================================
   LEARNED (ĐÃ TỪNG HỌC)
===================================== */

function getLearnedIds() {
    try {
        const raw = localStorage.getItem(LEARNED_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return new Set(arr.map(Number));
    } catch {
        return new Set();
    }
}

function saveLearnedIds(set) {
    try {
        localStorage.setItem(LEARNED_KEY, JSON.stringify(Array.from(set)));
    } catch { /* ignore */ }
}

export function markAsLearned(id) {
    if (id === null || id === undefined) return;
    const set = getLearnedIds();
    set.add(Number(id));
    saveLearnedIds(set);
}

export function isLearned(id) {
    return getLearnedIds().has(Number(id));
}


/* =====================================
   NOT LEARNED (CHƯA THUỘC)
===================================== */

const NOT_LEARNED_KEY = "ykhoahub_not_learned";

function getNotLearnedIds() {
    try {
        const raw = localStorage.getItem(NOT_LEARNED_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return new Set(arr.map(Number));
    } catch {
        return new Set();
    }
}

function saveNotLearnedIds(set) {
    try {
        localStorage.setItem(NOT_LEARNED_KEY, JSON.stringify(Array.from(set)));
    } catch { /* ignore */ }
}

export function markAsNotLearned(id) {
    if (id === null || id === undefined) return;
    const set = getNotLearnedIds();
    set.add(Number(id));
    saveNotLearnedIds(set);
}

export function unmarkNotLearned(id) {
    const set = getNotLearnedIds();
    set.delete(Number(id));
    saveNotLearnedIds(set);
}

export function isNotLearned(id) {
    return getNotLearnedIds().has(Number(id));
}

export function getNotLearnedQuestions() {
    const ids = getNotLearnedIds();
    return state.questions.filter(q => ids.has(Number(q.id)));
}


/* =====================================
   PHÂN LOẠI CÂU HỎI (3 TRẠNG THÁI)
===================================== */

/**
 * Trả về trạng thái câu hỏi:
 * - "locked":   Chưa học (🔒)
 * - "review":   Chưa thuộc (📌)
 * - "mastered": Đã thuộc (🏆)
 */
export function getQuestionStatus(id) {
    const numId = Number(id);
    if (!numId) return "locked";

    if (!isLearned(numId)) return "locked";
    if (isNotLearned(numId)) return "review";
    return "mastered";
}


/**
 * Thống kê đầy đủ cho 1 môn (3 trạng thái)
 */
export function getSubjectStatsFull(subject) {
    const list = state.questions.filter(q => q.mon === subject);

    let mastered = 0;
    let review = 0;
    let locked = 0;

    list.forEach(q => {
        const s = getQuestionStatus(q.id);
        if (s === "mastered") mastered++;
        else if (s === "review") review++;
        else locked++;
    });

    return {
        total: list.length,
        mastered,
        review,
        locked,
        remaining: list.length - mastered,
    };
}


/**
 * Alias cho tương thích code cũ
 */
export function getSubjectStats(subject) {
    const stats = getSubjectStatsFull(subject);
    return {
        total: stats.total,
        learned: stats.mastered,
        review: stats.review,
        remaining: stats.remaining,
    };
}


/**
 * Danh sách câu theo trạng thái
 */
export function getLockedQuestions() {
    return state.questions.filter(q => getQuestionStatus(q.id) === "locked");
}

export function getMasteredQuestions() {
    return state.questions.filter(q => getQuestionStatus(q.id) === "mastered");
}


/* =====================================
   HELPERS
===================================== */

export function stripFillBlank(q) {
    if (!q) return "";
    let text = String(q.question || "");
    text = text.replace(/Đáp\s*án\s*:[\s\S]*$/i, "").trim();
    return text;
}

function escapeHtmlSimple(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================
   HELPER: RENDER NHÓM THEO MÔN
===================================== */

function renderGroupedBySubject(list, icon) {
    if (!list || list.length === 0) return null;

    const bySubject = {};
    list.forEach(q => {
        if (!bySubject[q.mon]) bySubject[q.mon] = [];
        bySubject[q.mon].push(q);
    });

    let html = "";
    Object.keys(bySubject).forEach(subject => {
        const questions = bySubject[subject];
        const preview = questions.slice(0, 5);
        const remaining = questions.length - preview.length;

        html += `
            <div class="subject-group">
                <div class="subject-group-title">
                    ${icon} ${escapeHtmlSimple(subject)}
                    <span class="subject-group-count">${questions.length} câu</span>
                </div>
                <div class="subject-group-list">
                    ${preview.map(q => {
                        const text = escapeHtmlSimple(stripFillBlank(q));
                        const display = text.slice(0, 100) + (text.length > 100 ? "..." : "");
                        return `<div class="group-item">${display}</div>`;
                    }).join("")}
                    ${remaining > 0 ? `<div class="group-more">... và ${remaining} câu khác</div>` : ""}
                </div>
            </div>
        `;
    });

    return html;
}


/* =====================================
   MÀN HÌNH "CÂU CHƯA THUỘC" (📌)
===================================== */

export function showNotLearned() {
    const app = document.getElementById("app");
    if (!app) return;

    const list = getNotLearnedQuestions();

    let listHTML = "";
    if (list.length === 0) {
        listHTML = `<div class="search-empty">🎉 Bạn không còn câu nào chưa thuộc!</div>`;
    } else {
        list.forEach((q, i) => {
            listHTML += `
                <div class="not-learned-item" data-index="${i}">
                    <div class="not-learned-subject">${escapeHtmlSimple(q.mon)}</div>
                    <div class="not-learned-question">${escapeHtmlSimple(stripFillBlank(q))}</div>
                </div>
            `;
        });
    }

    app.innerHTML = `
        <div class="page-header">
            <button class="back-button" data-action="back-menu">←</button>
            <div>
                <h2>📌 CÂU CHƯA THUỘC</h2>
                <p>${list.length} câu cần ôn lại</p>
            </div>
        </div>
        <div class="not-learned-list">${listHTML}</div>
    `;

    app.querySelector('[data-action="back-menu"]')
        .addEventListener("click", async () => {
            const { showMenu } = await import('./dashboard.js');
            showMenu();
        });

    app.querySelectorAll('.not-learned-item').forEach(el => {
        el.addEventListener("click", () => {
            const idx = Number(el.dataset.index);
            openNotLearnedAt(idx);
        });
    });
}

async function openNotLearnedAt(index) {
    const { showQuestion } = await import('./study.js');
    state.selectedQuestions = getNotLearnedQuestions();
    state.currentQuestion = index;
    state.returnToSearch = false;
    state.answeredState = {};
    showQuestion();
}


/* =====================================
   MÀN HÌNH "CÂU ĐÃ THUỘC" (🏆)
===================================== */

export function showMastered() {
    const app = document.getElementById("app");
    if (!app) return;

    const list = getMasteredQuestions();

    let listHTML;
    if (list.length === 0) {
        listHTML = `<div class="search-empty">Chưa có câu nào đã thuộc. Cố lên! 🏆</div>`;
    } else {
        listHTML = renderGroupedBySubject(list, "🏆") || "";
    }

    app.innerHTML = `
        <div class="page-header">
            <button class="back-button" data-action="back-menu">←</button>
            <div>
                <h2>🏆 CÂU ĐÃ THUỘC</h2>
                <p>${list.length} câu đã chinh phục</p>
            </div>
        </div>
        <div class="group-list">${listHTML}</div>
    `;

    app.querySelector('[data-action="back-menu"]')
        .addEventListener("click", async () => {
            const { showMenu } = await import('./dashboard.js');
            showMenu();
        });
}


/* =====================================
   MÀN HÌNH "CÂU CHƯA HỌC" (🔒)
===================================== */

export function showLocked() {
    const app = document.getElementById("app");
    if (!app) return;

    const list = getLockedQuestions();

    let listHTML;
    if (list.length === 0) {
        listHTML = `<div class="search-empty">🎉 Bạn đã mở khóa tất cả câu hỏi!</div>`;
    } else {
        listHTML = renderGroupedBySubject(list, "🔒") || "";
    }

    app.innerHTML = `
        <div class="page-header">
            <button class="back-button" data-action="back-menu">←</button>
            <div>
                <h2>🔒 CÂU CHƯA HỌC</h2>
                <p>${list.length} câu chưa từng học</p>
            </div>
        </div>
        <div class="group-list">${listHTML}</div>
    `;

    app.querySelector('[data-action="back-menu"]')
        .addEventListener("click", async () => {
            const { showMenu } = await import('./dashboard.js');
            showMenu();
        });
}
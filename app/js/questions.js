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
   THỐNG KÊ MÔN
===================================== */

export function getSubjectStats(subject) {
    const list = state.questions.filter(q => q.mon === subject);
    const learned = getLearnedIds();

    let learnedCount = 0;
    let reviewCount = 0;

    list.forEach(q => {
        if (learned.has(q.id)) learnedCount++;
        if (isNotLearned(q.id)) reviewCount++;
    });

    return {
        total: list.length,
        learned: learnedCount,
        review: reviewCount,
        remaining: list.length - learnedCount,
    };
}


/* =====================================
   LEARNED (ĐÃ HỌC)
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
   MÀN HÌNH "CÂU CHƯA THUỘC"
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
                <h2>📚 CÂU CHƯA THUỘC</h2>
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
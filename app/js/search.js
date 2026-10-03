/* =====================================
   SEARCH - TÌM KIẾM
===================================== */

import { state } from './state.js';
import { escapeHTML, formatText, normalizeText } from './helpers.js';
import { stripFillBlank } from './questions.js';


export function showSearch(resetSearch = true) {
    if (resetSearch) {
        state.searchKeyword = "";
        state.searchResults = [];
    }

    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
        <div class="page-header">
            <button class="back-button" data-action="back-menu">←</button>
            <div>
                <h2>🔎 TÌM KIẾM</h2>
                <p>Tìm trong câu hỏi, đáp án và giải thích</p>
            </div>
        </div>
        <div class="search-box">
            <input id="searchInput" type="search" inputmode="search" enterkeyhint="search"
                placeholder="Nhập từ khóa..."
                value="${escapeHTML(state.searchKeyword)}"
                autocomplete="off" autocorrect="off" spellcheck="false">
        </div>
        <div id="searchResults">${renderSearchResultsHTML()}</div>
    `;

    app.querySelector('[data-action="back-menu"]').addEventListener("click", () => {
        import('./dashboard.js').then(({ showMenu }) => showMenu());
    });

    const input = document.getElementById("searchInput");
    input.addEventListener("input", performSearch);

    if (resetSearch) {
        setTimeout(() => input.focus(), 150);
    }

    attachSearchResultEvents();
}


export function renderSearchResultsHTML() {
    if (!state.searchKeyword) {
        return `<div class="search-empty">Nhập từ khóa để tìm kiếm.</div>`;
    }
    if (state.searchResults.length === 0) {
        return `<div class="search-empty">Không tìm thấy câu hỏi.</div>`;
    }

    let html = `<div class="search-count">Tìm thấy ${state.searchResults.length} câu</div>`;

    state.searchResults.forEach((q, index) => {
        html += `
            <div class="search-result" data-index="${index}">
                <div class="search-result-subject">${escapeHTML(q.mon)}</div>
                <div class="search-result-question">${formatText(stripFillBlank(q))}</div>
            </div>
        `;
    });

    return html;
}


export function performSearch() {
    const input = document.getElementById("searchInput");
    if (!input) return;

    state.searchKeyword = input.value.trim();
    const keyword = normalizeText(state.searchKeyword);

    state.searchResults = keyword === ""
        ? []
        : state.questions.filter(q => {
            const question = normalizeText(q.question || "");
            const answer = normalizeText(q.answer || "");
            const explanation = normalizeText(q.explanation || "");
            return question.includes(keyword)
                || answer.includes(keyword)
                || explanation.includes(keyword);
        });

    const container = document.getElementById("searchResults");
    if (container) {
        container.innerHTML = renderSearchResultsHTML();
        attachSearchResultEvents();
    }
}


export function attachSearchResultEvents() {
    document.querySelectorAll('.search-result').forEach(el => {
        el.addEventListener("click", () => {
            openSearchResult(Number(el.dataset.index));
        });
    });
}


export function openSearchResult(index) {
    import('./study.js').then(({ showQuestion }) => {
        state.selectedQuestions = state.searchResults;
        state.currentQuestion = index;
        state.returnToSearch = true;
        state.answeredState = {};
        showQuestion();
    });
}
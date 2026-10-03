/* =====================================
   FILL_BLANK - ĐIỀN KHUYẾT
===================================== */

import { state } from './state.js';
import { escapeHTML, formatText, normalizeAnswer, getFillBlankAnswers } from './helpers.js';
import { markAsNotLearned, isLearned } from './questions.js';
import { createStudyHeader, createBottomNav, attachHeaderEvents } from './study.js';
import { showDoubleClickHint, markToastShown } from './toast.js';


/* =====================================
   RENDER MÀN HÌNH FILL BLANK
===================================== */

export function renderFillBlank(q, qState) {
    const app = document.getElementById("app");
    if (!app) return;

    const correctAnswers = getFillBlankAnswers(q.answer);
    const parts = splitFillBlankQuestion(q.question);

    if (!qState.userAnswers || qState.userAnswers.length !== correctAnswers.length) {
        qState.userAnswers = new Array(correctAnswers.length).fill("");
    }

    const answerHTML = buildFillBlankAnswerHTML(
        parts.answerTemplate,
        qState.userAnswers,
        qState.checked,
        qState.results
    );

    const dapAnHTML = qState.checked
        ? buildFillBlankDapAnHTML(parts.answerTemplate, correctAnswers)
        : "";

    app.innerHTML = `
        ${createStudyHeader(q)}
        <div class="interactive-card">

            <div class="fill-blank-cau-hoi">
                <div class="card-label">CÂU HỎI</div>
                <div class="fill-blank-cau-hoi-text">${parts.questionPart}</div>
            </div>

            <div class="fill-blank-tra-loi">
                <div class="card-label">TRẢ LỜI</div>
                <div class="fill-blank-tra-loi-text" id="fillBlankAnswerArea">
                    ${answerHTML}
                </div>
            </div>

            <div id="fillDapAn">${dapAnHTML}</div>
            <div id="fillGiaiThich"></div>
            <div id="autoNotLearned"></div>

            ${createBottomNav()}
        </div>
    `;

    attachHeaderEvents();
    attachFillBlankInputs(q, qState);

    // Double click để tự động điền đáp án đúng
    const card = app.querySelector(".interactive-card");
    if (card) {
        card.addEventListener("dblclick", () => {
            autoRevealFillBlank();
        });
    }

    if (qState.checked) {
        renderFillBlankExplanation(q, qState);
        lockFillBlankInputs();
    } else {
        // Hiện toast nếu câu này chưa từng học
        maybeShowDoubleClickHint(q);
    }
}


/* =====================================
   HIỆN TOAST NHẮC NHỞ NẾU CHƯA HỌC
===================================== */

function maybeShowDoubleClickHint(q) {
    if (!q || q.id === null || q.id === undefined) return;
    if (isLearned(q.id)) return;

    showDoubleClickHint();
    markToastShown();
}
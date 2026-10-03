/* =====================================
   MCQ - TRẮC NGHIỆM
===================================== */

import { state } from './state.js';
import { formatText, normalizeAnswer, getChoices } from './helpers.js';
import { markAsNotLearned, isLearned } from './questions.js';
import { createStudyHeader, createBottomNav, attachHeaderEvents } from './study.js';
import { showDoubleClickHint, markToastShown } from './toast.js';


/* =====================================
   RENDER MÀN HÌNH MCQ
===================================== */

export function renderMCQ(q, qState) {
    const app = document.getElementById("app");
    if (!app) return;

    const choices = getChoices(q.choices);
    const correctAnswer = String(q.answer ?? "").trim();

    let choicesHTML = "";
    choices.forEach((choice, index) => {
        let cls = "answer-choice";
        if (qState.checked) {
            const isCorrectChoice = normalizeAnswer(choice) === normalizeAnswer(correctAnswer);
            const isSelected = qState.selectedIndex === index;

            if (isCorrectChoice) cls += " correct";
            else if (isSelected) cls += " wrong";
        } else {
            if (qState.selectedIndex === index) cls += " selected";
        }

        choicesHTML += `
            <button type="button"
                class="${cls}"
                data-index="${index}"
                ${qState.checked ? "disabled" : ""}>
                <span class="choice-tick"></span>
                <span class="choice-text">${formatText(choice)}</span>
            </button>
        `;
    });

    app.innerHTML = `
        ${createStudyHeader(q)}
        <div class="interactive-card">
            <div class="mcq-question-text">${formatText(q.question)}</div>

            <div id="mcqChoices" class="answer-choices">${choicesHTML}</div>

            <div id="mcqExplanation"></div>
            <div id="autoNotLearned"></div>

            ${createBottomNav()}
        </div>
    `;

    attachHeaderEvents();

    app.querySelectorAll(".answer-choice").forEach(btn => {
        btn.addEventListener("click", () => {
            selectMCQAnswer(Number(btn.dataset.index));
        });
    });

    // Double click để tự động chọn đáp án đúng
    const card = app.querySelector(".interactive-card");
    if (card) {
        card.addEventListener("dblclick", () => {
            autoRevealMCQ();
        });
    }

    if (qState.checked) {
        renderMCQExplanation(q, qState);
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
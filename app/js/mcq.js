/* =====================================
   MCQ - TRẮC NGHIỆM
===================================== */

import { state } from './state.js';
import { formatText, normalizeAnswer, getChoices } from './helpers.js';
import { markAsNotLearned } from './questions.js';
import { createStudyHeader, createBottomNav, attachHeaderEvents } from './study.js';


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

    const checkDisabled = qState.checked || qState.selectedIndex === null;

    app.innerHTML = `
        ${createStudyHeader(q)}
        <div class="interactive-card">
            <div class="mcq-question-text">${formatText(q.question)}</div>

            <div id="mcqChoices" class="answer-choices">${choicesHTML}</div>

            <div class="mcq-actions">
                <button type="button"
                    class="check-answer-button"
                    id="mcqCheckButton"
                    ${checkDisabled ? "disabled" : ""}>
                    KIỂM TRA
                </button>
            </div>

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

    const checkBtn = document.getElementById("mcqCheckButton");
    if (checkBtn) checkBtn.addEventListener("click", checkMCQAnswer);

    if (qState.checked) {
        renderMCQExplanation(q, qState);
    }
}


/* =====================================
   CHỌN ĐÁP ÁN
===================================== */

export function selectMCQAnswer(index) {
    const qState = state.answeredState[state.currentQuestion];
    if (!qState || qState.checked) return;

    qState.selectedIndex = index;

    document.querySelectorAll(".answer-choice").forEach((btn, i) => {
        btn.classList.toggle("selected", i === index);
    });

    const checkBtn = document.getElementById("mcqCheckButton");
    if (checkBtn) checkBtn.disabled = false;
}


/* =====================================
   KIỂM TRA ĐÁP ÁN
===================================== */

export function checkMCQAnswer() {
    const q = state.selectedQuestions[state.currentQuestion];
    const qState = state.answeredState[state.currentQuestion];
    if (!q || !qState || qState.checked) return;

    const choices = getChoices(q.choices);
    const correctAnswer = String(q.answer ?? "").trim();
    const selectedAnswer = choices[qState.selectedIndex];

    const isCorrect = normalizeAnswer(selectedAnswer) === normalizeAnswer(correctAnswer);
    qState.isCorrect = isCorrect;
    qState.checked = true;

    document.querySelectorAll(".answer-choice").forEach((btn, i) => {
        btn.disabled = true;
        btn.classList.remove("selected");

        const choice = choices[i];
        if (normalizeAnswer(choice) === normalizeAnswer(correctAnswer)) {
            btn.classList.add("correct");
        } else if (i === qState.selectedIndex) {
            btn.classList.add("wrong");
        }
    });

    const checkBtn = document.getElementById("mcqCheckButton");
    if (checkBtn) checkBtn.disabled = true;

    if (!isCorrect && !qState.markedNotLearned) {
        markAsNotLearned(q.id);
        qState.markedNotLearned = true;
    }

    renderMCQExplanation(q, qState);
}


/* =====================================
   RENDER GIẢI THÍCH
===================================== */

export function renderMCQExplanation(q, qState) {
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
        if (!qState.isCorrect && qState.markedNotLearned) {
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
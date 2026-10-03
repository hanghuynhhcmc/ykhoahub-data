/* =====================================
   MCQ - TRẮC NGHIỆM
===================================== */

import { state } from './state.js';
import { formatText, normalizeAnswer, getChoices } from './helpers.js';
import { markAsNotLearned, isLearned } from './questions.js';
import { createStudyHeader, attachHeaderEvents } from './study.js';
import {
    startToastCountdown,
    cancelToastCountdown,
    resetToastState,
} from './toast.js';


/* =====================================
   RENDER MÀN HÌNH MCQ
===================================== */

export function renderMCQ(q, qState) {
    const app = document.getElementById("app");
    if (!app) return;

    resetToastState();

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
        </div>
        <div class="tap-zone tap-zone-left" data-tap="prev" aria-label="Câu trước"></div>
        <div class="tap-zone tap-zone-right" data-tap="next" aria-label="Câu tiếp theo"></div>
    `;

    attachHeaderEvents();
    attachTapZones();

    app.querySelectorAll(".answer-choice").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            selectMCQAnswer(Number(btn.dataset.index));
        });
    });

    if (qState.checked) {
        renderMCQExplanation(q, qState);
    } else {
        maybeStartToastCountdown(q);
    }
}


/* =====================================
   TAP ZONES + DOUBLE CLICK TRONG Ô
===================================== */

function attachTapZones() {
    // 1. Tap zone 2 mép → single click → next/prev (KHÔNG delay)
    document.querySelectorAll(".tap-zone").forEach(zone => {
        zone.addEventListener("click", (e) => {
            e.stopPropagation();
            const direction = zone.dataset.tap;
            if (direction === "next") {
                import('./study.js').then(({ nextQuestion }) => nextQuestion());
            } else if (direction === "prev") {
                import('./study.js').then(({ prevQuestion }) => prevQuestion());
            }
        });
    });

    // 2. Double click trong ô nội dung → hiện đáp án
    const card = document.querySelector(".interactive-card");
    if (card) {
        card.addEventListener("dblclick", (e) => {
            // Bỏ qua nếu double click vào nút đáp án
            if (e.target.closest(".answer-choice")) return;
            e.stopPropagation();
            autoRevealMCQ();
        });
    }
}


/* =====================================
   ĐẾM NGƯỢC HIỆN TOAST (CHỈ CÂU CHƯA HỌC)
===================================== */

function maybeStartToastCountdown(q) {
    if (!q || q.id === null || q.id === undefined) return;
    if (isLearned(q.id)) return;

    startToastCountdown();
}


/* =====================================
   CHỌN ĐÁP ÁN + TỰ ĐỘNG KIỂM TRA
===================================== */

export function selectMCQAnswer(index) {
    const qState = state.answeredState[state.currentQuestion];
    if (!qState || qState.checked) return;

    cancelToastCountdown();

    qState.selectedIndex = index;

    document.querySelectorAll(".answer-choice").forEach((btn, i) => {
        btn.classList.toggle("selected", i === index);
    });

    setTimeout(() => {
        checkMCQAnswer();
    }, 250);
}


/* =====================================
   TỰ ĐỘNG CHỌN ĐÁP ÁN ĐÚNG (DOUBLE CLICK)
===================================== */

export function autoRevealMCQ() {
    const q = state.selectedQuestions[state.currentQuestion];
    const qState = state.answeredState[state.currentQuestion];
    if (!q || !qState || qState.checked) return;

    cancelToastCountdown();

    const choices = getChoices(q.choices);
    const correctAnswer = String(q.answer ?? "").trim();

    const correctIndex = choices.findIndex(
        c => normalizeAnswer(c) === normalizeAnswer(correctAnswer)
    );

    if (correctIndex === -1) return;

    qState.selectedIndex = correctIndex;
    checkMCQAnswer();
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
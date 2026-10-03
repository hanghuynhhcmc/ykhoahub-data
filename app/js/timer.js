/* =====================================
   TIMER - ĐỒNG HỒ ĐẾM NGƯỢC HÌNH QUẢ BOM
===================================== */

const WARNING_THRESHOLD = 8;        // Cảnh báo đỏ khi còn ≤ 8s
const EXPLOSION_DELAY = 300;        // Đợi 300ms sau khi nổ mới gọi callback
const TICK_INTERVAL = 1000;         // 1 giây / tick

let countdownInterval = null;
let timeLeft = 0;
let totalDuration = 0;
let isRunning = false;
let onTimeUpCallback = null;


/* =====================================
   ĐẾM SỐ TỪ TRONG CÂU
===================================== */

function countWords(text) {
    const str = String(text || "").trim();
    if (!str) return 0;
    // Tách theo khoảng trắng (1 hoặc nhiều)
    return str.split(/\s+/).filter(w => w.length > 0).length;
}


/* =====================================
   ĐẾM SỐ Ô ĐIỀN TRONG CÂU (FILL_BLANK)
===================================== */

function countFillBlanks(question) {
    const matches = String(question || "").match(/\{\{\d+\}\}/g);
    return matches ? matches.length : 0;
}


/* =====================================
   TÍNH THỜI GIAN THEO ĐỘ DÀI CÂU HỎI
===================================== */

/**
 * Tính thời gian làm bài dựa trên số từ + số ô điền
 * @param {string} question - Nội dung câu hỏi
 * @param {string} type - "MCQ" hoặc "FILL_BLANK"
 * @param {number} choicesText - Text của các đáp án MCQ (để đếm từ)
 * @returns {number} - Số giây
 */
export function calculateDuration(question, type = "MCQ", choicesText = "") {
    if (type === "MCQ") {
        // MCQ:
        // - 4s cơ bản (đọc lướt + chọn)
        // - +0.6s cho mỗi từ trong câu hỏi
        // - +0.4s cho mỗi từ trong đáp án
        // - Tối thiểu 8s, tối đa 20s
        const questionWords = countWords(question);
        const choiceWords = countWords(choicesText);

        const duration = 4 + questionWords * 0.6 + choiceWords * 0.4;
        return Math.round(Math.max(8, Math.min(20, duration)));
    }

    // FILL_BLANK:
    // - 4s cơ bản
    // - +0.6s cho mỗi từ trong câu hỏi
    // - +3s cho mỗi ô điền (vì phải suy nghĩ + gõ)
    // - Tối thiểu 10s, tối đa 30s
    const questionWords = countWords(question);
    const blanks = countFillBlanks(question);

    const duration = 4 + questionWords * 0.6 + blanks * 3;
    return Math.round(Math.max(10, Math.min(30, duration)));
}


/* =====================================
   BẮT ĐẦU ĐẾM NGƯỢC
===================================== */

export function startTimer(duration, onTimeUp = null) {
    stopTimer();

    timeLeft = duration;
    totalDuration = duration;
    isRunning = true;
    onTimeUpCallback = onTimeUp;

    renderBombWidget();
    updateBombDisplay();

    countdownInterval = setInterval(() => {
        timeLeft--;
        updateBombDisplay();

        if (timeLeft <= 0) {
            // ⚠️ LƯU CALLBACK TRƯỚC KHI RESET
            const callback = onTimeUpCallback;

            // Dừng interval (không gọi stopTimer vì nó reset callback)
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            isRunning = false;
            onTimeUpCallback = null;

            triggerExplosion();

            // Gọi callback sau khi bom nổ xong
            if (typeof callback === 'function') {
                setTimeout(() => {
                    try {
                        callback();
                    } catch (err) {
                        console.error("Timer callback error:", err);
                    }
                }, EXPLOSION_DELAY);
            }
        }
    }, TICK_INTERVAL);
}


/* =====================================
   DỪNG ĐẾM NGƯỢC
===================================== */

export function stopTimer() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    isRunning = false;
    onTimeUpCallback = null;
}


/* =====================================
   ẨN WIDGET
===================================== */

export function hideTimerWidget() {
    const widget = document.getElementById("timerWidget");
    if (widget) widget.remove();
}


/* =====================================
   RENDER BOM WIDGET
===================================== */

function renderBombWidget() {
    const oldWidget = document.getElementById("timerWidget");
    if (oldWidget) oldWidget.remove();

    const header = document.querySelector(".study-header");
    if (!header) return;

    const widget = document.createElement("div");
    widget.id = "timerWidget";
    widget.className = "bomb-widget";
    widget.innerHTML = `
        <div class="bomb-graphic">
            <div class="bomb-fuse">
                <div class="bomb-spark"></div>
            </div>
            <div class="bomb-body">
                <div class="bomb-shine"></div>
            </div>
            <div class="bomb-cap"></div>
        </div>
        <div class="bomb-time">--</div>
    `;

    header.appendChild(widget);
}


/* =====================================
   CẬP NHẬT HIỂN THỊ
===================================== */

function updateBombDisplay() {
    const widget = document.getElementById("timerWidget");
    if (!widget) return;

    const timeEl = widget.querySelector(".bomb-time");
    if (!timeEl) return;

    timeEl.textContent = timeLeft;

    if (timeLeft <= WARNING_THRESHOLD) {
        widget.classList.add("warning");
    } else {
        widget.classList.remove("warning");
    }
}


/* =====================================
   HIỆU ỨNG NỔ
===================================== */

function triggerExplosion() {
    const widget = document.getElementById("timerWidget");
    if (!widget) return;

    widget.classList.add("explode");

    document.body.classList.add("screen-shake");
    setTimeout(() => {
        document.body.classList.remove("screen-shake");
    }, 400);

    setTimeout(() => {
        if (widget.parentNode) widget.parentNode.removeChild(widget);
    }, 1000);
}


/* =====================================
   HELPERS
===================================== */

export function isTimerRunning() {
    return isRunning;
}

export function getTimeLeft() {
    return timeLeft;
}

export function getTotalDuration() {
    return totalDuration;
}
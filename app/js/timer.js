/* =====================================
   TIMER - ĐỒNG HỒ ĐẾM NGƯỢC HÌNH QUẢ BOM
===================================== */

const WARNING_THRESHOLD = 10;

let countdownInterval = null;
let timeLeft = 0;
let totalDuration = 0;
let isRunning = false;
let onTimeUpCallback = null;


/* =====================================
   TÍNH THỜI GIAN THEO ĐỘ DÀI CÂU HỎI
===================================== */

export function calculateDuration(question, type = "MCQ") {
    const length = String(question || "").length;

    if (type === "MCQ") {
        // MCQ: 15s cơ bản + 1s cho mỗi 15 ký tự, tối đa 35s
        const base = 15;
        const perChar = 1 / 15;
        const duration = base + length * perChar;
        return Math.round(Math.max(15, Math.min(35, duration)));
    }

    // FILL_BLANK: 30s cơ bản + 1s cho mỗi 10 ký tự, tối đa 60s
    const base = 30;
    const perChar = 1 / 10;
    const duration = base + length * perChar;
    return Math.round(Math.max(30, Math.min(60, duration)));
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
            stopTimer();
            triggerExplosion();
            if (typeof onTimeUpCallback === 'function') {
                onTimeUpCallback();
            }
        }
    }, 1000);
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
/* =====================================
   TOAST - POPUP NHẮC NHỞ
===================================== */

const TOAST_DURATION = 4000;
const TOAST_DELAY = 5000;
const TOAST_SHOWN_KEY = "toast_dblclick_shown";
const TAP_HINT_KEY = "tap_hint_shown";

let toastTimer = null;


/* =====================================
   TOAST DOUBLE CLICK CŨ (giữ lại, có thể tắt)
===================================== */

export function resetToastState() {
    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }
    const existing = document.getElementById("dblclickHintToast");
    if (existing) hideToast(existing, true);
}

export function startToastCountdown() {
    // Đã thay thế bằng popup khi mở app → không hiện toast cũ nữa
    return;
}

export function cancelToastCountdown() {
    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }
}

export function showDoubleClickHint() {
    const existing = document.getElementById("dblclickHintToast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "dblclickHintToast";
    toast.className = "dblclick-hint-toast";
    toast.innerHTML = `
        <div class="dblclick-hint-icon">💡</div>
        <div class="dblclick-hint-content">
            <div class="dblclick-hint-title">Câu này bạn chưa học</div>
            <div class="dblclick-hint-text">
                Nhấp <b>2 lần</b> vào màn hình để hiện đáp án ngay
            </div>
        </div>
        <button type="button" class="dblclick-hint-close" aria-label="Đóng">✕</button>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    const closeBtn = toast.querySelector(".dblclick-hint-close");
    const timer = setTimeout(() => hideToast(toast), TOAST_DURATION);

    closeBtn.addEventListener("click", () => {
        clearTimeout(timer);
        hideToast(toast);
    });
}

function hideToast(toast, immediate = false) {
    if (!toast || !toast.parentNode) return;

    if (immediate) {
        toast.parentNode.removeChild(toast);
        return;
    }

    toast.classList.remove("show");
    toast.classList.add("hide");
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
}


/* =====================================
   TAP HINT - NHẮC NHỞ KHI MỞ APP (1 LẦN)
===================================== */

export function showTapHintOnce() {
    if (localStorage.getItem(TAP_HINT_KEY)) return;

    const hint = document.createElement("div");
    hint.id = "tapHintOverlay";
    hint.className = "tap-hint-overlay";
    hint.innerHTML = `
        <div class="tap-hint-card">
            <div class="tap-hint-icon">👆</div>
            <div class="tap-hint-title">MẸO HỌC NHANH</div>
            <div class="tap-hint-list">
                <div class="tap-hint-item">
                    <span class="tap-hint-symbol">←</span>
                    <span>Nhấp <b>bên trái</b> màn hình: <b>Câu trước</b></span>
                </div>
                <div class="tap-hint-item">
                    <span class="tap-hint-symbol">→</span>
                    <span>Nhấp <b>bên phải</b> màn hình: <b>Câu tiếp theo</b></span>
                </div>
                <div class="tap-hint-item">
                    <span class="tap-hint-symbol">👆👆</span>
                    <span>Nhấp <b>2 lần</b> liên tiếp: <b>Hiện đáp án ngay</b></span>
                </div>
            </div>
            <button type="button" class="tap-hint-btn" id="tapHintClose">
                ĐÃ HIỂU
            </button>
        </div>
    `;

    document.body.appendChild(hint);

    requestAnimationFrame(() => {
        hint.classList.add("show");
    });

    const closeBtn = hint.querySelector("#tapHintClose");
    closeBtn.addEventListener("click", () => {
        hint.classList.remove("show");
        hint.classList.add("hide");
        localStorage.setItem(TAP_HINT_KEY, "1");
        setTimeout(() => hint.remove(), 300);
    });
}
/* =====================================
   TOAST - POPUP NHẮC NHỞ
===================================== */

const TOAST_DURATION = 4000;
const TOAST_DELAY = 5000;
const TOAST_SHOWN_KEY = "toast_dblclick_shown";

let toastTimer = null;

export function resetToastState() {
    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }
    const existing = document.getElementById("dblclickHintToast");
    if (existing) hideToast(existing, true);
}

export function startToastCountdown() {
    if (sessionStorage.getItem(TOAST_SHOWN_KEY)) return;

    if (toastTimer) clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        if (sessionStorage.getItem(TOAST_SHOWN_KEY)) return;

        showDoubleClickHint();
        sessionStorage.setItem(TOAST_SHOWN_KEY, "1");
        toastTimer = null;
    }, TOAST_DELAY);
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
/* =====================================
   TOAST - POPUP NHẮC NHỞ
===================================== */

const TOAST_DURATION = 4000; // 4 giây
const TOAST_SHOWN_KEY = "toast_dblclick_shown";

/**
 * Hiển thị toast nhắc nhở double click
 * Chỉ hiện 1 lần duy nhất cho mỗi câu chưa học (dựa vào session)
 */
export function showDoubleClickHint() {
    // Mỗi session chỉ hiện 1 lần để không làm phiền
    if (sessionStorage.getItem(TOAST_SHOWN_KEY)) return;

    // Xóa toast cũ nếu có
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

    // Animation vào
    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    // Nút đóng
    const closeBtn = toast.querySelector(".dblclick-hint-close");
    closeBtn.addEventListener("click", () => hideToast(toast));

    // Tự động ẩn sau TOAST_DURATION
    const timer = setTimeout(() => hideToast(toast), TOAST_DURATION);

    // Hủy timer nếu người dùng đóng sớm
    closeBtn.addEventListener("click", () => clearTimeout(timer));
}

function hideToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.remove("show");
    toast.classList.add("hide");
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
}

/**
 * Đánh dấu đã hiện toast trong session này
 */
export function markToastShown() {
    sessionStorage.setItem(TOAST_SHOWN_KEY, "1");
}
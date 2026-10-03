/* =====================================
   TOAST - POPUP NHẮC NHỞ
===================================== */

const TAP_HINT_KEY = "tap_hint_shown";
const TAP_HINT_DURATION = 300;


/* =====================================
   RESET TOAST STATE
   (Gọi khi render câu hỏi mới để dọn toast cũ nếu có)
===================================== */

export function resetToastState() {
    // Hiện tại không dùng toast cũ → không cần làm gì
    // Nhưng giữ function để tương thích với mcq.js / fill-blank.js
    return;
}


/* =====================================
   TOAST COUNTDOWN (KHÔNG DÙNG NỮA)
   Giữ để tương thích import trong mcq.js / fill-blank.js
===================================== */

export function startToastCountdown() {
    return;
}

export function cancelToastCountdown() {
    return;
}


/* =====================================
   TAP HINT - NHẮC NHỞ KHI MỞ APP (1 LẦN DUY NHẤT)
===================================== */

export function showTapHintOnce() {
    // Đã hiện 1 lần rồi → không hiện nữa
    if (localStorage.getItem(TAP_HINT_KEY)) return;

    // Tránh hiện trùng nếu hàm bị gọi 2 lần
    if (document.getElementById("tapHintOverlay")) return;

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
                    <span>Nhấp <b>2 lần</b> vào ô câu hỏi: <b>Hiện đáp án ngay</b></span>
                </div>
            </div>
            <button type="button" class="tap-hint-btn" id="tapHintClose">
                ĐÃ HIỂU
            </button>
        </div>
    `;

    document.body.appendChild(hint);

    // Trigger animation
    requestAnimationFrame(() => {
        hint.classList.add("show");
    });

    const closeBtn = hint.querySelector("#tapHintClose");

    const close = () => {
        hint.classList.remove("show");
        hint.classList.add("hide");
        localStorage.setItem(TAP_HINT_KEY, "1");
        setTimeout(() => {
            if (hint.parentNode) hint.parentNode.removeChild(hint);
        }, TAP_HINT_DURATION);
    };

    closeBtn.addEventListener("click", close);

    // Đóng khi click ra ngoài card
    hint.addEventListener("click", (e) => {
        if (e.target === hint) close();
    });
}
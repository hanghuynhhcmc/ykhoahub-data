/* =====================================
   Y KHOA HUB - ENTRY POINT
===================================== */

import { checkAuthAndLoad, isLoggedIn } from './js/auth.js';
import { state } from './js/state.js';
import { loadQuestions } from './js/questions.js';
import { showTapHintOnce } from './js/toast.js';


async function init() {
    try {
        // 1. Kiểm tra đăng nhập (localStorage)
        await checkAuthAndLoad();

        // 2. Nếu chưa đăng nhập → guest mode
        if (!isLoggedIn()) {
            state.isGuest = true;
        }

        // 3. Tải câu hỏi (loadQuestions tự gọi showMenu() khi xong)
        await loadQuestions();

        // 4. Hiện popup nhắc nhở 1 lần duy nhất
        showTapHintOnce();
    } catch (err) {
        console.error("Init failed:", err);
        const app = document.getElementById("app");
        if (app) {
            app.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h2>Không tải được dữ liệu</h2>
                    <p>${err && err.message ? err.message : "Lỗi không xác định"}</p>
                    <button onclick="location.reload()">THỬ LẠI</button>
                </div>
            `;
        }
    }
}

init();
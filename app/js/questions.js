/* =====================================
   Y KHOA HUB - ENTRY POINT
===================================== */

import { checkAuthAndLoad, isLoggedIn } from './js/auth.js';
import { loadQuestions } from './js/questions.js';


async function init() {
    // 1. Kiểm tra đăng nhập (localStorage)
    await checkAuthAndLoad();

    // 2. Nếu chưa đăng nhập → cho vào guest mode
    if (!isLoggedIn()) {
        const { state } = await import('./js/state.js');
        state.isGuest = true;
    }

    // 3. Tải câu hỏi (hàm này tự gọi showMenu() khi xong)
    await loadQuestions();
}

init();
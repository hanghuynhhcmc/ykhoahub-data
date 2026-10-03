/* =====================================
   Y KHOA HUB - ENTRY POINT
===================================== */

import { checkAuthAndLoad, isLoggedIn } from './auth.js';
import { loadQuestions } from './questions.js';


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
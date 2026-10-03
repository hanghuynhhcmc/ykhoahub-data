/* =====================================
   Y KHOA HUB - ENTRY POINT
===================================== */

import { checkAuthAndLoad, isLoggedIn } from './js/auth.js';
import { loadQuestions } from './js/questions.js';


async function init() {
    // 1. Kiểm tra đăng nhập
    await checkAuthAndLoad();

    // 2. Tải câu hỏi
    await loadQuestions();

    // 3. Nếu chưa đăng nhập → hiện màn hình login
    //    Nếu đã đăng nhập → loadQuestions() đã tự gọi showMenu()
    if (!isLoggedIn()) {
        // Hiện màn hình login (nếu có)
        // Hoặc cho vào guest mode:
        // showMenu();
    }
}

init();
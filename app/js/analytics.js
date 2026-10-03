/* =====================================
   ANALYTICS - GHI LOG HOẠT ĐỘNG
===================================== */

import { supabaseClient } from './config.js';
import { state } from './state.js';


/* =====================================
   HÀM CHÍNH: GHI 1 EVENT
===================================== */

export async function logEvent(eventType, data = {}) {
    if (!state.currentUser) return; // Khách không log

    try {
        await supabaseClient
            .from("user_events")
            .insert({
                user_id: state.currentUser.id,
                event_type: eventType,
                subject: data.subject || null,
                question_id: data.questionId ? String(data.questionId) : null,
                is_correct: typeof data.isCorrect === "boolean" ? data.isCorrect : null,
                detail: data.detail || null,
            });
    } catch (err) {
        console.log("Không ghi được event:", err);
    }
}


/* =====================================
   CÁC HÀM TIỆN DỤNG (SHORTCUT)
===================================== */

// Ghi đăng ký
export function logSignup() {
    return logEvent("signup");
}

// Ghi đăng nhập
export function logLogin() {
    return logEvent("login");
}

// Ghi đăng xuất
export function logLogout() {
    return logEvent("logout");
}

// Ghi bắt đầu học 1 môn
export function logStartQuiz(subject) {
    return logEvent("start_quiz", { subject });
}

// Ghi trả lời 1 câu
export function logAnswer(questionId, subject, isCorrect) {
    return logEvent("answer", { questionId, subject, isCorrect });
}

// Ghi tìm kiếm
export function logSearch(keyword) {
    return logEvent("search", { detail: keyword });
}
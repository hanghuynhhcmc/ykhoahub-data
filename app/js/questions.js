/* =====================================
   ĐÃ HỌC / CHƯA THUỘC
===================================== */

export function getLearned() {
    try {
        return JSON.parse(localStorage.getItem(LEARNED_KEY)) || {};
    } catch { return {}; }
}

export function saveLearned(data) {
    localStorage.setItem(LEARNED_KEY, JSON.stringify(data));
}

export function markAsLearned(id) {
    if (id === null || id === undefined || String(id).trim() === "") return;
    const learned = getLearned();
    learned[String(id)] = true;
    saveLearned(learned);
}

/**
 * Kiểm tra câu đã học hay chưa
 */
export function isLearned(id) {
    if (id === null || id === undefined || String(id).trim() === "") return false;
    const learned = getLearned();
    return learned[String(id)] === true;
}

export function isNotLearned(id) {
    const count = Number(localStorage.getItem("repeat_" + id)) || 0;
    return count > 0;
}

export function markAsNotLearned(id) {
    if (id === null || id === undefined || String(id).trim() === "") return;
    const key = "repeat_" + id;
    const current = Number(localStorage.getItem(key)) || 0;
    localStorage.setItem(key, current + 1);
}
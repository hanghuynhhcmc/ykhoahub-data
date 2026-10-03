/* =====================================
   DASHBOARD - TRANG CHỦ
===================================== */

import { DASHBOARD_KEY } from './config.js';
import { state } from './state.js';
import { escapeHTML } from './helpers.js';
import {
    getSubjects,
    getSubjectStatsFull,
    showMastered,
    showNotLearned,
    showLocked,
} from './questions.js';
import { signOut } from './auth.js';


/* =====================================
   DASHBOARD SUBJECTS
===================================== */

export function getDashboardSubjects() {
    const subjects = getSubjects();
    let saved = [];

    try {
        saved = JSON.parse(localStorage.getItem(DASHBOARD_KEY)) || [];
    } catch { saved = []; }

    saved = saved.filter(s => subjects.includes(s));

    if (saved.length === 0 && subjects.length > 0) {
        saved = subjects.slice(0, 4);
        saveDashboardSubjects(saved);
    }

    return saved.slice(0, 4);
}

export function saveDashboardSubjects(subjects) {
    localStorage.setItem(DASHBOARD_KEY, JSON.stringify(subjects.slice(0, 4)));
}

export function removeDashboardSubject(subject, event) {
    if (event) event.stopPropagation();
    let dashboard = getDashboardSubjects();
    dashboard = dashboard.filter(item => item !== subject);
    saveDashboardSubjects(dashboard);
    showMenu();
}

export function addDashboardSubject(subject) {
    if (!subject) return;
    let dashboard = getDashboardSubjects();
    if (dashboard.includes(subject)) {
        alert("Môn này đã có trong Dashboard.");
        return;
    }
    if (dashboard.length >= 4) {
        alert("Dashboard chỉ hiển thị tối đa 4 môn.");
        return;
    }
    dashboard.push(subject);
    saveDashboardSubjects(dashboard);
    showMenu();
}


/* =====================================
   ĐĂNG NHẬP / ĐĂNG XUẤT
===================================== */

function handleLogout() {
    if (state.isGuest) {
        alert("Chức năng đăng nhập chưa khả dụng.");
        return;
    }
    signOut();
    state.currentUser = null;
    state.isGuest = true;
    showMenu();
}


/* =====================================
   TÍNH % HOÀN THÀNH
===================================== */

function calcProgress(stats) {
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.mastered / stats.total) * 100);
}

function getProgressClass(percent) {
    if (percent >= 80) return "high";
    if (percent >= 40) return "medium";
    return "low";
}


/* =====================================
   RENDER CARD MÔN HỌC
===================================== */

function renderSubjectCard(subject) {
    const stats = getSubjectStatsFull(subject);
    const percent = calcProgress(stats);
    const progressClass = getProgressClass(percent);

    return `
        <div class="subject-progress" data-subject="${escapeHTML(subject)}">
            <button class="dashboard-remove" data-remove="${escapeHTML(subject)}" aria-label="Xóa">×</button>

            <div class="subject-name">${escapeHTML(subject)}</div>

            <div class="subject-progress-bar">
                <div class="subject-progress-fill ${progressClass}"
                     style="width: ${percent}%"></div>
            </div>

            <div class="subject-percent ${progressClass}">
                🏆 ${percent}% đã thuộc
            </div>

            <div class="progress-stats">
                <div class="stat-item mastered">
                    <span class="stat-icon">🏆</span>
                    <span class="stat-value">${stats.mastered}</span>
                </div>
                <div class="stat-item review">
                    <span class="stat-icon">📌</span>
                    <span class="stat-value">${stats.review}</span>
                </div>
                <div class="stat-item locked">
                    <span class="stat-icon">🔒</span>
                    <span class="stat-value">${stats.locked}</span>
                </div>
            </div>
        </div>
    `;
}


/* =====================================
   TRANG CHỦ
===================================== */

export function showMenu() {
    state.returnToSearch = false;
    state.answeredState = {};

    const subjects = getSubjects();
    const dashboardSubjects = getDashboardSubjects();
    const availableSubjects = subjects.filter(s => !dashboardSubjects.includes(s));

    let dashboardHTML = "";

    for (let i = 0; i < 4; i++) {
        const subject = dashboardSubjects[i];

        if (subject) {
            dashboardHTML += renderSubjectCard(subject);
        } else {
            let options = `<option value="">+ THÊM MÔN HỌC</option>`;
            availableSubjects.forEach(item => {
                options += `<option value="${escapeHTML(item)}">${escapeHTML(item)}</option>`;
            });
            dashboardHTML += `
                <div class="dashboard-empty">
                    <div class="empty-icon">+</div>
                    <select class="dashboard-add-select">
                        ${options}
                    </select>
                </div>
            `;
        }
    }

    const app = document.getElementById("app");
    if (!app) return;

    let userBarHTML = "";
    if (state.isGuest) {
        userBarHTML = `
            <div class="user-bar guest">
                <div class="user-info">
                    <div class="user-avatar">?</div>
                    <div>
                        <div class="user-name">Khách</div>
                        <div class="user-note">Tiến độ không được lưu</div>
                    </div>
                </div>
                <button class="user-login-btn" data-action="logout">ĐĂNG NHẬP</button>
            </div>
        `;
    } else if (state.currentUser) {
        const email = state.currentUser.email || "";
        const name = (state.currentUser.user_metadata && state.currentUser.user_metadata.full_name) || email;
        const avatarUrl = state.currentUser.user_metadata && state.currentUser.user_metadata.avatar_url;
        const initial = name.charAt(0).toUpperCase();

        const avatarHTML = avatarUrl
            ? `<img src="${escapeHTML(avatarUrl)}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
            : escapeHTML(initial);

        userBarHTML = `
            <div class="user-bar">
                <div class="user-info">
                    <div class="user-avatar">${avatarHTML}</div>
                    <div>
                        <div class="user-name">${escapeHTML(name)}</div>
                        <div class="user-note">${escapeHTML(email)}</div>
                    </div>
                </div>
                <button class="user-login-btn" data-action="logout">ĐĂNG XUẤT</button>
            </div>
        `;
    }

    // Đếm số câu mỗi trạng thái (toàn bộ, không theo môn)
    let totalMastered = 0;
    let totalReview = 0;
    let totalLocked = 0;
    subjects.forEach(s => {
        const stats = getSubjectStatsFull(s);
        totalMastered += stats.mastered;
        totalReview += stats.review;
        totalLocked += stats.locked;
    });

    app.innerHTML = `
        ${userBarHTML}

        <div class="section-heading">MÔN ĐANG HỌC</div>
        <div class="dashboard-grid">${dashboardHTML}</div>

        <div class="menu-section">
            <button class="menu-button menu-mastered" data-action="show-mastered">
                <span class="menu-icon">🏆</span>
                <span class="menu-label">CÂU ĐÃ THUỘC</span>
                <span class="menu-badge">${totalMastered}</span>
            </button>

            <button class="menu-button menu-review" data-action="show-not-learned">
                <span class="menu-icon">📌</span>
                <span class="menu-label">CÂU CHƯA THUỘC</span>
                <span class="menu-badge">${totalReview}</span>
            </button>

            <button class="menu-button menu-locked" data-action="show-locked">
                <span class="menu-icon">🔒</span>
                <span class="menu-label">CÂU CHƯA HỌC</span>
                <span class="menu-badge">${totalLocked}</span>
            </button>
        </div>

        <div class="search-home-section">
            <button class="menu-button search-home-button" data-action="show-search">
                🔎 TÌM KIẾM
            </button>
        </div>
    `;

    const logoutBtn = app.querySelector('[data-action="logout"]');
    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

    app.querySelector('[data-action="show-mastered"]')
        .addEventListener("click", showMastered);

    app.querySelector('[data-action="show-not-learned"]')
        .addEventListener("click", showNotLearned);

    app.querySelector('[data-action="show-locked"]')
        .addEventListener("click", showLocked);

    app.querySelector('[data-action="show-search"]')
        .addEventListener("click", () => {
            import('./search.js').then(({ showSearch }) => showSearch());
        });

    app.querySelectorAll('.subject-progress').forEach(el => {
        el.addEventListener("click", (e) => {
            if (e.target.classList.contains("dashboard-remove")) return;
            const subject = el.dataset.subject;
            import('./study.js').then(({ startDashboardQuiz }) => {
                startDashboardQuiz(subject);
            });
        });
    });

    app.querySelectorAll('.dashboard-remove').forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            removeDashboardSubject(btn.dataset.remove, e);
        });
    });

    app.querySelectorAll('.dashboard-add-select').forEach(sel => {
        sel.addEventListener("change", () => {
            if (sel.value) {
                addDashboardSubject(sel.value);
                sel.value = "";
            }
        });
    });
}
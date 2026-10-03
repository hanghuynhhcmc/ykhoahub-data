/* =====================================
   DASHBOARD - TRANG CHỦ
===================================== */

import { DASHBOARD_KEY } from './config.js';
import { state } from './state.js';
import { escapeHTML } from './helpers.js';
import { getSubjects, getSubjectStats, showNotLearned } from './questions.js';
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

    if (saved.length === 0) {
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
   XỬ LÝ ĐĂNG NHẬP / ĐĂNG XUẤT
===================================== */

function handleLogout() {
    // Nếu là guest → chuyển sang màn hình login (nếu có)
    if (state.isGuest) {
        // Tạm thời: chỉ hiện alert
        alert("Chức năng đăng nhập chưa khả dụng.");
        return;
    }

    // Nếu đã đăng nhập → đăng xuất
    signOut();
    state.currentUser = null;
    state.isGuest = true;
    showMenu();
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
            const stats = getSubjectStats(subject);
            dashboardHTML += `
                <div class="subject-progress" data-subject="${escapeHTML(subject)}">
                    <button class="dashboard-remove" data-remove="${escapeHTML(subject)}">×</button>
                    <div class="subject-name">${escapeHTML(subject)}</div>
                    <div class="progress-item"><span>Đã học</span><strong>${stats.learned}</strong></div>
                    <div class="progress-item"><span>Chưa thuộc</span><strong>${stats.review}</strong></div>
                    <div class="progress-item"><span>Còn lại</span><strong>${stats.remaining}</strong></div>
                </div>
            `;
        } else {
            let options = `<option value="">+ THÊM MÔN HỌC</option>`;
            availableSubjects.forEach(item => {
                options += `<option value="${escapeHTML(item)}">${escapeHTML(item)}</option>`;
            });
            dashboardHTML += `
                <div class="dashboard-empty">
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

    app.innerHTML = `
        ${userBarHTML}
        <div class="section-heading">MÔN ĐANG HỌC</div>
        <div class="dashboard-grid">${dashboardHTML}</div>
        <div class="menu-section">
            <button class="menu-button secondary" data-action="show-not-learned">
                📚 CÂU CHƯA THUỘC
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

    app.querySelector('[data-action="show-not-learned"]')
        .addEventListener("click", showNotLearned);

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
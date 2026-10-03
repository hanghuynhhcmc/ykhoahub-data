/* =====================================
   AUTH - ĐĂNG NHẬP / ĐĂNG XUẤT (GOOGLE)
===================================== */

import { supabaseClient } from './config.js';
import { state } from './state.js';
import { loadQuestions } from './questions.js';


export function showLoginScreen() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
        <div class="login-screen">
            <div class="login-card">
                <div class="login-logo">🩺</div>
                <h1>Y KHOA HUB</h1>
                <p class="login-subtitle">Đăng nhập để lưu tiến độ học tập</p>

                <button class="google-btn" data-action="google-login">
                    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                    </svg>
                    <span>ĐĂNG NHẬP BẰNG GOOGLE</span>
                </button>

                <div id="loginMessage" class="login-message"></div>

                <div class="login-divider"><span>hoặc</span></div>

                <button class="login-btn guest" data-action="guest-login">
                    DÙNG THỬ KHÔNG CẦN ĐĂNG NHẬP
                </button>
            </div>
        </div>
    `;

    app.querySelector('[data-action="google-login"]')
        .addEventListener("click", doGoogleLogin);
    app.querySelector('[data-action="guest-login"]')
        .addEventListener("click", continueAsGuest);
}


export async function doGoogleLogin() {
    const msgBox = document.getElementById("loginMessage");
    if (msgBox) {
        msgBox.textContent = "Đang chuyển đến Google...";
        msgBox.className = "login-message";
    }

    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin + window.location.pathname,
            },
        });

        if (error && msgBox) {
            msgBox.textContent = "Không thể đăng nhập Google: " + error.message;
            msgBox.className = "login-message error";
        }
    } catch (err) {
        console.error("Lỗi Google login:", err);
        if (msgBox) {
            msgBox.textContent = "Có lỗi xảy ra. Vui lòng thử lại.";
            msgBox.className = "login-message error";
        }
    }
}


export function continueAsGuest() {
    state.isGuest = true;
    state.currentUser = null;
    loadQuestions();
}


export async function doLogout() {
    if (state.isGuest) {
        state.isGuest = false;
        showLoginScreen();
        return;
    }
    try {
        await supabaseClient.auth.signOut();
    } catch (err) {
        console.error("Lỗi đăng xuất:", err);
    }
    state.currentUser = null;
    showLoginScreen();
}


export async function checkAuthAndLoad() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
            state.currentUser = session.user;
            state.isGuest = false;
            loadQuestions();
        } else {
            showLoginScreen();
        }
    } catch (err) {
        console.error("Lỗi check auth:", err);
        showLoginScreen();
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session && session.user) {
            state.currentUser = session.user;
            state.isGuest = false;
            const app = document.getElementById("app");
            if (app && app.querySelector(".login-screen")) {
                loadQuestions();
            }
        } else if (event === "SIGNED_OUT") {
            state.currentUser = null;
            showLoginScreen();
        }
    });
}
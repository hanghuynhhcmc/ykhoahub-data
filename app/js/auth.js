/* =====================================
   AUTH - ĐĂNG NHẬP / ĐĂNG KÝ (EMAIL/PASSWORD)
===================================== */

import { supabaseClient } from './config.js';
import { state } from './state.js';
import { loadQuestions } from './questions.js';


/* =====================================
   MÀN HÌNH ĐĂNG NHẬP
===================================== */

export function showLoginScreen() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
        <div class="login-screen">
            <div class="login-card">
                <div class="login-logo">🩺</div>
                <h1>Y KHOA HUB</h1>
                <p class="login-subtitle">Đăng nhập để lưu tiến độ học tập</p>

                <div class="login-form">
                    <input id="loginEmail" type="email" placeholder="Email"
                        autocomplete="email" autocorrect="off" spellcheck="false">
                    <input id="loginPassword" type="password" placeholder="Mật khẩu"
                        autocomplete="current-password">

                    <button id="loginBtn" class="login-btn primary" data-action="login">
                        ĐĂNG NHẬP
                    </button>
                </div>

                <div id="loginMessage" class="login-message"></div>

                <div class="login-divider"><span>hoặc</span></div>

                <div class="login-switch">
                    Chưa có tài khoản?
                    <a href="javascript:void(0)" data-action="go-signup">Tạo tài khoản mới</a>
                </div>

                <button class="login-btn guest" data-action="guest">
                    DÙNG THỬ KHÔNG CẦN ĐĂNG NHẬP
                </button>
            </div>
        </div>
    `;

    const pwd = document.getElementById("loginPassword");
    if (pwd) {
        pwd.addEventListener("keydown", (e) => {
            if (e.key === "Enter") doLogin();
        });
    }

    app.querySelector('[data-action="login"]').addEventListener("click", doLogin);
    app.querySelector('[data-action="go-signup"]').addEventListener("click", showSignupScreen);
    app.querySelector('[data-action="guest"]').addEventListener("click", continueAsGuest);
}


/* =====================================
   MÀN HÌNH ĐĂNG KÝ
===================================== */

export function showSignupScreen() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
        <div class="login-screen">
            <div class="login-card">
                <div class="login-logo">🩺</div>
                <h1>Y KHOA HUB</h1>
                <p class="login-subtitle">Tạo tài khoản để bắt đầu học</p>

                <div class="login-form">
                    <input id="signupEmail" type="email" placeholder="Email"
                        autocomplete="email" autocorrect="off" spellcheck="false">
                    <input id="signupPassword" type="password" placeholder="Mật khẩu (ít nhất 6 ký tự)"
                        autocomplete="new-password">
                    <input id="signupPasswordConfirm" type="password" placeholder="Nhập lại mật khẩu"
                        autocomplete="new-password">

                    <button id="signupBtn" class="login-btn primary" data-action="signup">
                        TẠO TÀI KHOẢN
                    </button>
                </div>

                <div id="signupMessage" class="login-message"></div>

                <div class="login-divider"><span>hoặc</span></div>

                <div class="login-switch">
                    Đã có tài khoản?
                    <a href="javascript:void(0)" data-action="go-login">Đăng nhập</a>
                </div>

                <button class="login-btn guest" data-action="guest">
                    DÙNG THỬ KHÔNG CẦN ĐĂNG NHẬP
                </button>
            </div>
        </div>
    `;

    const pwdConfirm = document.getElementById("signupPasswordConfirm");
    if (pwdConfirm) {
        pwdConfirm.addEventListener("keydown", (e) => {
            if (e.key === "Enter") doSignup();
        });
    }

    app.querySelector('[data-action="signup"]').addEventListener("click", doSignup);
    app.querySelector('[data-action="go-login"]').addEventListener("click", showLoginScreen);
    app.querySelector('[data-action="guest"]').addEventListener("click", continueAsGuest);
}


/* =====================================
   ĐĂNG NHẬP
===================================== */

export async function doLogin() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        showMessage("loginMessage", "Vui lòng nhập email và mật khẩu.", "error");
        return;
    }

    setLoading("loginBtn", true, "ĐĂNG NHẬP");

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    setLoading("loginBtn", false, "ĐĂNG NHẬP");

    if (error) {
        showMessage("loginMessage", translateAuthError(error.message), "error");
        return;
    }

    state.currentUser = data.user;
    state.isGuest = false;
    loadQuestions();
}


/* =====================================
   ĐĂNG KÝ
===================================== */

export async function doSignup() {
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const passwordConfirm = document.getElementById("signupPasswordConfirm").value;

    if (!email || !password || !passwordConfirm) {
        showMessage("signupMessage", "Vui lòng điền đầy đủ thông tin.", "error");
        return;
    }
    if (password.length < 6) {
        showMessage("signupMessage", "Mật khẩu cần ít nhất 6 ký tự.", "error");
        return;
    }
    if (password !== passwordConfirm) {
        showMessage("signupMessage", "Mật khẩu nhập lại không khớp.", "error");
        return;
    }

    setLoading("signupBtn", true, "TẠO TÀI KHOẢN");

    const { data, error } = await supabaseClient.auth.signUp({ email, password });

    setLoading("signupBtn", false, "TẠO TÀI KHOẢN");

    if (error) {
        showMessage("signupMessage", translateAuthError(error.message), "error");
        return;
    }

    if (data.session) {
        state.currentUser = data.user;
        state.isGuest = false;
        loadQuestions();
    } else {
        showMessage("signupMessage", "Đăng ký thành công! Kiểm tra email để xác nhận.", "success");
    }
}


/* =====================================
   KHÁCH / ĐĂNG XUẤT
===================================== */

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


/* =====================================
   CHECK AUTH KHI KHỞI ĐỘNG
===================================== */

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


/* =====================================
   HELPERS
===================================== */

function setLoading(btnId, isLoading, defaultText) {
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.disabled = isLoading;
        btn.textContent = isLoading ? "ĐANG XỬ LÝ..." : defaultText;
    }
}

function showMessage(boxId, message, type) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.textContent = message;
    box.className = "login-message " + (type === "success" ? "success" : "error");
}

function translateAuthError(msg) {
    if (msg.includes("Invalid login credentials")) return "Email hoặc mật khẩu không đúng.";
    if (msg.includes("Email not confirmed")) return "Email chưa được xác nhận. Kiểm tra hộp thư.";
    if (msg.includes("User already registered")) return "Email này đã được đăng ký.";
    if (msg.includes("Password should be")) return "Mật khẩu cần ít nhất 6 ký tự.";
    if (msg.includes("Unable to validate email")) return "Email không hợp lệ.";
    if (msg.includes("rate limit")) return "Quá nhiều lần thử. Vui lòng đợi vài phút.";
    return msg;
}
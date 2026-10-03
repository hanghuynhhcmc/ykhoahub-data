/* =====================================
   AUTH - XÁC THỰC NGƯỜI DÙNG
===================================== */

import { supabaseClient } from './config.js';
import { state } from './state.js';


/* =====================================
   KIỂM TRA SESSION + TẢI USER
===================================== */

/**
 * Kiểm tra session đăng nhập hiện tại
 * Trả về user nếu đã đăng nhập, null nếu chưa
 */
export async function checkAuthAndLoad() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error) throw error;

        if (session && session.user) {
            state.currentUser = session.user;
        } else {
            state.currentUser = null;
        }

        return state.currentUser;
    } catch (err) {
        console.log("Không kiểm tra được auth:", err);
        state.currentUser = null;
        return null;
    }
}


/* =====================================
   ĐĂNG NHẬP / ĐĂNG KÝ / ĐĂNG XUẤT
===================================== */

/**
 * Đăng nhập bằng email + password
 */
export async function signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    state.currentUser = data.user;
    return data.user;
}


/**
 * Đăng ký tài khoản mới
 */
export async function signUp(email, password) {
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
    });
    if (error) throw error;
    state.currentUser = data.user;
    return data.user;
}


/**
 * Đăng xuất
 */
export async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    state.currentUser = null;
}


/* =====================================
   HELPERS
===================================== */

/**
 * Lấy user hiện tại (đồng bộ, không gọi API)
 */
export function getCurrentUser() {
    return state.currentUser;
}

/**
 * Kiểm tra đã đăng nhập chưa
 */
export function isLoggedIn() {
    return !!state.currentUser;
}
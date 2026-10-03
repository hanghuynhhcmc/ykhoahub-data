/* =====================================
   AUTH - XÁC THỰC NGƯỜI DÙNG
===================================== */

import { supabaseClient } from './config.js';
import { state } from './state.js';


/* =====================================
   KIỂM TRA SESSION + TẢI USER
===================================== */

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

export async function signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    state.currentUser = data.user;
    return data.user;
}


export async function signUp(email, password) {
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
    });
    if (error) throw error;
    state.currentUser = data.user;
    return data.user;
}


export async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    state.currentUser = null;
}


/* =====================================
   HELPERS
===================================== */

export function getCurrentUser() {
    return state.currentUser;
}

export function isLoggedIn() {
    return !!state.currentUser;
}
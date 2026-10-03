/* =====================================
   AUTH - ĐƠN GIẢN (LOCALSTORAGE)
===================================== */

import { state } from './state.js';

const USER_KEY = "ykhoahub_user";


export async function checkAuthAndLoad() {
    try {
        const saved = localStorage.getItem(USER_KEY);
        state.currentUser = saved ? JSON.parse(saved) : null;
    } catch {
        state.currentUser = null;
    }
    return state.currentUser;
}


export function signIn(email, password) {
    state.currentUser = { email };
    localStorage.setItem(USER_KEY, JSON.stringify(state.currentUser));
    return state.currentUser;
}


export function signUp(email, password) {
    return signIn(email, password);
}


export function signOut() {
    state.currentUser = null;
    localStorage.removeItem(USER_KEY);
}


export function getCurrentUser() {
    return state.currentUser;
}


export function isLoggedIn() {
    return !!state.currentUser;
}
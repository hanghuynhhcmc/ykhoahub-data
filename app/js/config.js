/* =====================================
   CẤU HÌNH SUPABASE
===================================== */

export const SUPABASE_URL = "https://yiawgxxdnzmxhxwsqlhs.supabase.co";
export const SUPABASE_KEY = "đã dán"; // ⚠️ Dán key vào đây

export const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

export const ONLINE_DATA_URL =
    "https://raw.githubusercontent.com/hanghuynhhcmc/ykhoahub-data/refs/heads/main/questions.json";

export const LOCAL_CACHE_KEY = "ykhoahub_questions_cache";
export const LEARNED_KEY = "ykhoahub_learned";
export const DASHBOARD_KEY = "ykhoahub_dashboard_subjects";
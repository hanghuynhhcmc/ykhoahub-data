/* =====================================
   SUBJECT GROUPS (Trang Đã thuộc / Chưa học)
===================================== */
.group-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.subject-group {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 16px 18px;
    transition: all 0.15s ease;
}

.subject-group:hover {
    border-color: #bfdbfe;
    box-shadow: 0 4px 12px -4px rgba(37, 99, 235, 0.1);
}

.subject-group-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
    flex-wrap: wrap;
}

.subject-group-count {
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 700;
    color: #2563eb;
    background: #eff6ff;
    border-radius: 999px;
    white-space: nowrap;
}

.subject-group-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.group-item {
    padding: 8px 12px;
    background: #f8fafc;
    border-left: 3px solid #cbd5e1;
    border-radius: 6px;
    font-size: 13.5px;
    color: #475569;
    line-height: 1.5;
    overflow-wrap: anywhere;
    word-break: break-word;
}

.group-more {
    padding: 6px 12px;
    font-size: 12px;
    color: #94a3b8;
    font-style: italic;
    text-align: center;
}
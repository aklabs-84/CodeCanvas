// admin-panel.js - 관리자 전용: AI 기능 사용 가능 유저 관리
import { supabase } from './supabase-client.js';
import { CONFIG } from './config.js';

export const AdminPanel = {
    isAdmin: false,

    init() {
        this.modal = document.getElementById('admin-panel-modal');
        this.button = document.getElementById('btn-admin-panel');
        this.listEl = document.getElementById('admin-user-list');
        this._attachEventListeners();
    },

    _attachEventListeners() {
        this.button?.addEventListener('click', () => this.open());
        this.modal?.querySelector('.btn-close-modal')?.addEventListener('click', () => this.close());
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    },

    // auth.js의 onAuthStateChange에서 로그인 상태가 바뀔 때마다 호출됨
    onAuthChange(isAuthenticated) {
        const email = isAuthenticated ? window.AuthManager?.user?.email : null;
        this.isAdmin = email === CONFIG.ADMIN_EMAIL;
        this.button?.classList.toggle('hidden', !this.isAdmin);
    },

    async open() {
        if (!this.isAdmin || !this.listEl) return;
        this.modal?.classList.remove('hidden');
        this.listEl.innerHTML = '<div class="admin-panel-placeholder">불러오는 중...</div>';

        const { data, error } = await supabase
            .from('profiles')
            .select('user_id, email, can_use_ai')
            .order('email');

        if (error) {
            this.listEl.innerHTML = `<div class="admin-panel-placeholder">불러오기 실패: ${error.message}</div>`;
            return;
        }

        this._render(data ?? []);
    },

    close() {
        this.modal?.classList.add('hidden');
    },

    _render(users) {
        this.listEl.innerHTML = '';

        if (users.length === 0) {
            this.listEl.innerHTML = '<div class="admin-panel-placeholder">가입한 유저가 없습니다.</div>';
            return;
        }

        users.forEach(user => {
            const isSelf = user.email === CONFIG.ADMIN_EMAIL;

            const row = document.createElement('div');
            row.className = 'admin-user-row';
            row.innerHTML = `
                <span class="admin-user-email">${user.email}${isSelf ? ' (관리자)' : ''}</span>
                <label class="admin-toggle-switch">
                    <input type="checkbox" ${user.can_use_ai || isSelf ? 'checked' : ''} ${isSelf ? 'disabled' : ''}>
                    <span class="admin-toggle-slider"></span>
                </label>
            `;

            row.querySelector('input')?.addEventListener('change', (e) => {
                this._togglePermission(user.user_id, e.target.checked);
            });

            this.listEl.appendChild(row);
        });
    },

    async _togglePermission(userId, canUseAi) {
        const { error } = await supabase.from('profiles').update({ can_use_ai: canUseAi }).eq('user_id', userId);
        if (error) {
            console.error('권한 변경 실패:', error);
            window.showErrorNotification?.('권한 변경에 실패했습니다.');
            return;
        }
        window.showSuccessNotification?.('권한이 변경되었습니다.');
    },
};

window.AdminPanel = AdminPanel;

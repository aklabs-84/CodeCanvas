// auth.js - Google 인증 관리 (향후 구현)

export const AuthManager = {
    isAuthenticated: false,
    user: null,
    accessToken: null,

    init() {
        console.log('Auth module initialized (Google OAuth will be implemented later)');
        this.attachEventListeners();
    },

    attachEventListeners() {
        const btnLogin = document.getElementById('btn-login');
        btnLogin?.addEventListener('click', () => {
            this.login();
        });
    },

    async login() {
        // TODO: Google OAuth 구현
        alert('Google 로그인 기능은 Google Cloud Console 설정 후 구현됩니다.');
    },

    async logout() {
        // TODO: 로그아웃 구현
        this.isAuthenticated = false;
        this.user = null;
        this.accessToken = null;
    },
};

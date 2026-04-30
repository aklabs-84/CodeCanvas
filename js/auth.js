import { CONFIG } from './config.js';

const SESSION_KEY = 'codecanvas_user';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7일

export const AuthManager = {
    isAuthenticated: false,
    user: null,

    init() {
        console.log('Auth module initialized with GAS backend');
        this.checkSession();
        this.attachEventListeners();
        this.updateUI();
    },

    checkSession() {
        try {
            const saved = localStorage.getItem(SESSION_KEY);
            if (!saved) return;
            const session = JSON.parse(saved);
            // 만료 확인
            if (session.expiresAt && Date.now() > session.expiresAt) {
                localStorage.removeItem(SESSION_KEY);
                return;
            }
            this.user = session.user;
            this.isAuthenticated = true;
        } catch {
            localStorage.removeItem(SESSION_KEY);
        }
    },

    // 비밀번호를 SHA-256으로 해싱 (서버 전송 전 처리)
    async hashPassword(password) {
        const encoded = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    saveSession(user) {
        const session = {
            user,
            expiresAt: Date.now() + SESSION_TTL,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    },

    attachEventListeners() {
        // 로그인/회원가입 모달 제어 등은 전역에서 처리 (app.js 등)
    },

    async login(username, password) {
        if (!CONFIG.GAS_APP_URL) return { status: 'error', message: 'API URL이 설정되지 않았습니다.' };

        try {
            const hashedPassword = await this.hashPassword(password);
            const response = await fetch(CONFIG.GAS_APP_URL, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'login', username, password: hashedPassword })
            });

            const data = await response.json();
            if (data.status === 'success') {
                this.user = data.user;
                this.isAuthenticated = true;
                this.saveSession(this.user);
                this.updateUI();
                return { status: 'success' };
            } else {
                return { status: 'error', message: data.message };
            }
        } catch (error) {
            console.error('Login failed:', error);
            return { status: 'error', message: '로그인 중 오류가 발생했습니다.' };
        }
    },

    async signup(username, password) {
        if (!CONFIG.GAS_APP_URL) return { status: 'error', message: 'API URL이 설정되지 않았습니다.' };

        try {
            const hashedPassword = await this.hashPassword(password);
            const response = await fetch(CONFIG.GAS_APP_URL, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'signup', username, password: hashedPassword })
            });

            const data = await response.json();
            if (data.status === 'success') {
                return { status: 'success' };
            } else {
                return { status: 'error', message: data.message };
            }
        } catch (error) {
            console.error('Signup failed:', error);
            return { status: 'error', message: '회원가입 중 오류가 발생했습니다.' };
        }
    },

    logout() {
        this.isAuthenticated = false;
        this.user = null;
        localStorage.removeItem(SESSION_KEY);
        this.updateUI();
        window.location.reload();
    },

    updateUI() {
        const btnLogin = document.getElementById('btn-login');
        if (!btnLogin) return;

        if (this.isAuthenticated && this.user) {
            btnLogin.innerHTML = `<span>👤 ${this.user.username}</span>`;
            btnLogin.title = '클릭하여 로그아웃';
            btnLogin.onclick = (e) => {
                e.preventDefault();
                if (confirm('로그아웃 하시겠습니까?')) {
                    this.logout();
                }
            };
        } else {
            btnLogin.innerHTML = '👤 로그인';
            btnLogin.title = '로그인 또는 회원가입';
            // 모달 열기 로직은 app.js에서 처리하도록 함
        }
    }
};

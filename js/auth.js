import { supabase } from './supabase-client.js';

export const AuthManager = {
    isAuthenticated: false,
    user: null,

    init() {
        console.log('Auth module initialized with Supabase');
        this.attachEventListeners();

        supabase.auth.onAuthStateChange((event, session) => {
            this.isAuthenticated = !!session;
            this.user = session?.user ?? null;
            this.updateUI();
            window.ProjectManager?.onAuthChange?.(this.isAuthenticated);
            window.AiAssistant?.onAuthChange?.(this.isAuthenticated);
            window.AdminPanel?.onAuthChange?.(this.isAuthenticated);
        });
    },

    attachEventListeners() {
        // 로그인/회원가입 모달 제어 등은 전역에서 처리 (app.js 등)
    },

    async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { status: 'error', message: error.message };

            this.user = data.user;
            this.isAuthenticated = true;
            this.updateUI();
            return { status: 'success' };
        } catch (error) {
            console.error('Login failed:', error);
            return { status: 'error', message: '로그인 중 오류가 발생했습니다.' };
        }
    },

    async signup(email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) return { status: 'error', message: error.message };

            // Confirm email이 꺼져 있으면 세션이 바로 발급됨
            if (data.session) {
                this.user = data.user;
                this.isAuthenticated = true;
                this.updateUI();
            }
            return { status: 'success' };
        } catch (error) {
            console.error('Signup failed:', error);
            return { status: 'error', message: '회원가입 중 오류가 발생했습니다.' };
        }
    },

    async logout() {
        await supabase.auth.signOut();
        this.isAuthenticated = false;
        this.user = null;
        this.updateUI();
        window.location.reload();
    },

    updateUI() {
        const btnLogin = document.getElementById('btn-login');
        if (!btnLogin) return;

        if (this.isAuthenticated && this.user) {
            btnLogin.innerHTML = `<span class="icon">👤</span><span class="text">${this.user.email}</span>`;
            btnLogin.title = '클릭하여 로그아웃';
            btnLogin.onclick = (e) => {
                e.preventDefault();
                if (confirm('로그아웃 하시겠습니까?')) {
                    this.logout();
                }
            };
        } else {
            btnLogin.innerHTML = '<span class="icon">👤</span><span class="text">로그인</span>';
            btnLogin.title = '로그인 또는 회원가입';
            // 모달 열기 로직은 app.js에서 처리하도록 함
        }
    }
};

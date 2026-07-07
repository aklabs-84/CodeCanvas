// config.js - 전역 설정 관리

export const CONFIG = {
    // Supabase 프로젝트 설정 (.env.local 참조)
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,

    // AI 코드 어시스턴트 관리자 계정 (이 이메일로 로그인하면 항상 AI 기능 사용 가능)
    ADMIN_EMAIL: 'mosebb@gmail.com',

    // 개발 모드 여부
    IS_DEV: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    // 공유 링크 베이스 URL
    get SHARE_BASE_URL() {
        return window.location.origin + window.location.pathname;
    }
};

window.CONFIG = CONFIG;

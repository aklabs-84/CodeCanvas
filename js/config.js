// config.js - 전역 설정 관리

export const CONFIG = {
    // Google Apps Script 웹 앱 URL (배포 후 여기에 붙여넣으세요)
    GAS_APP_URL: 'https://script.google.com/macros/s/AKfycbziZYbCk75S9ufEZjFsmCDDy_FSjC12ZGaZnV1eoh-OverNjWGqHYx-vfp3_ivAYfQFWw/exec', 
    
    // 개발 모드 여부
    IS_DEV: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    // 공유 링크 베이스 URL
    get SHARE_BASE_URL() {
        return window.location.origin + window.location.pathname;
    }
};

window.CONFIG = CONFIG;

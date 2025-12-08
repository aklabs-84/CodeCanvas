// theme.js - 테마 전환 모듈

export const ThemeManager = {
    currentTheme: 'dark', // 'dark' | 'light'

    // 초기화
    init() {
        this.loadTheme();
        this.attachEventListeners();
    },

    // 테마 불러오기
    loadTheme() {
        try {
            const saved = localStorage.getItem('codecanvas_theme');
            if (saved) {
                this.currentTheme = saved;
            } else {
                // 시스템 테마 감지
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.currentTheme = prefersDark ? 'dark' : 'light';
            }
            this.applyTheme();
        } catch (error) {
            console.error('Failed to load theme:', error);
        }
    },

    // 테마 적용
    applyTheme() {
        document.body.classList.remove('theme-dark', 'theme-light');
        document.body.classList.add(`theme-${this.currentTheme}`);

        // 버튼 아이콘 업데이트
        const btn = document.getElementById('btn-theme');
        if (btn) {
            const icon = btn.querySelector('.icon');
            if (icon) {
                icon.textContent = this.currentTheme === 'dark' ? '🌙' : '☀️';
            }
        }

        this.saveTheme();
    },

    // 테마 전환
    toggle() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
    },

    // 테마 저장
    saveTheme() {
        try {
            localStorage.setItem('codecanvas_theme', this.currentTheme);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    },

    // 이벤트 리스너
    attachEventListeners() {
        const btn = document.getElementById('btn-theme');
        btn?.addEventListener('click', () => {
            this.toggle();
        });

        // 시스템 테마 변경 감지
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // 사용자가 수동으로 테마를 변경하지 않았다면 시스템 테마 따라가기
            const hasManualTheme = localStorage.getItem('codecanvas_theme');
            if (!hasManualTheme) {
                this.currentTheme = e.matches ? 'dark' : 'light';
                this.applyTheme();
            }
        });
    },
};

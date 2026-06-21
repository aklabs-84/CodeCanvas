// preview.js - 미리보기 렌더링 모듈

export const PreviewManager = {
    previewFrame: null,
    consoleOutput: null,
    consoleLogs: [],
    currentBlobUrl: null,
    autoRun: false,
    _autoRunTimer: null,

    // 초기화
    init() {
        this.previewFrame = document.getElementById('preview-frame');
        this.consoleOutput = document.getElementById('console-output');
        this._loadAutoRunPreference();
        this.attachEventListeners();
        this.setupConsoleCapture();
    },

    
    // 이벤트 리스너
    attachEventListeners() {
        const btnRun = document.getElementById('btn-run');
        btnRun?.addEventListener('click', () => this.run());

        const btnClearConsole = document.getElementById('btn-clear-console');
        btnClearConsole?.addEventListener('click', () => this.clearConsole());

        const btnAutoRun = document.getElementById('btn-autorun');
        btnAutoRun?.addEventListener('click', () => this.toggleAutoRun());

        // Ctrl+Enter로 실행
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.run();
            }
        });
    },

    // 자동 실행 토글
    toggleAutoRun() {
        this.autoRun = !this.autoRun;
        localStorage.setItem('codecanvas_autorun', JSON.stringify(this.autoRun));
        this._updateAutoRunButton();
        if (this.autoRun) this.run(); // 켜는 순간 즉시 한 번 실행
    },

    // 자동 실행 버튼 UI 동기화
    _updateAutoRunButton() {
        const btn = document.getElementById('btn-autorun');
        if (!btn) return;
        btn.classList.toggle('btn-primary', this.autoRun);
        btn.classList.toggle('btn-secondary', !this.autoRun);
        btn.title = this.autoRun
            ? '자동 실행 켜짐 — 코드 변경 시 자동 갱신 (클릭하여 끄기)'
            : '자동 실행 꺼짐 (클릭하여 켜기)';
        const iconSpan = btn.querySelector('.icon');
        if (iconSpan) iconSpan.textContent = this.autoRun ? '⚡' : '⚡';
    },

    // 자동 실행 예약 (debounce 1초)
    scheduleAutoRun() {
        if (!this.autoRun) return;
        if (this._autoRunTimer) clearTimeout(this._autoRunTimer);
        this._autoRunTimer = setTimeout(() => {
            this._autoRunTimer = null;
            this.run();
        }, 1000);
    },

    // localStorage에서 자동 실행 설정 복원
    _loadAutoRunPreference() {
        try {
            const saved = localStorage.getItem('codecanvas_autorun');
            if (saved !== null) {
                this.autoRun = JSON.parse(saved);
            }
        } catch {
            this.autoRun = false;
        }
        // DOM이 준비된 후 버튼 상태 반영
        requestAnimationFrame(() => this._updateAutoRunButton());
    },

    // 코드 실행
    run() {
        const code = window.EditorManager?.getCode();
        if (!code) {
            console.warn('EditorManager not initialized');
            return;
        }

        this.clearConsole();
        this._clearErrorTabs(); // 실행 시 에러 표시 초기화
        this.renderPreview(code);
    },

    // 에러가 있는 탭의 시각 표시 제거
    _clearErrorTabs() {
        document.querySelectorAll('.tab-btn.has-error').forEach(btn => {
            btn.classList.remove('has-error');
        });
    },

    // 에러 발생 시 해당 언어 탭에 빨간 점 표시
    _markErrorTab(lang) {
        const tab = document.querySelector(`.tab-btn[data-mode="${lang}"]`);
        tab?.classList.add('has-error');
    },

    // 미리보기 렌더링
    renderPreview({ html, css, js }) {
        const combinedHTML = this.combineCode(html, css, js);

        try {
            if (this.previewFrame) {
                // srcdoc 방식으로 회귀 (Blob URL 보안 문제 회피)
                this.previewFrame.srcdoc = combinedHTML;
            }

            // LayoutManager의 updatePreview 호출 (전체화면 동기화)
            if (window.LayoutManager) {
                window.LayoutManager.updatePreview(combinedHTML);
            }
        } catch (error) {
            this.logError('Failed to render preview: ' + error.message);
        }
    },

    // HTML, CSS, JS 결합
    combineCode(html, css, js) {
        // 스마트 라이브러리 주입 (Tailwind, FontAwesome 등 자동 감지)
        let smartInjections = '';
        let injectedLibs = [];

        const trimmed = html.trim();
        const isFullDocument = /^<!doctype/i.test(trimmed) || /^<html/i.test(trimmed);

        // 1. Tailwind CSS 감지 (class="... bg-, text-, p-, m-, flex, grid 등")
        if (/(class\s*=\s*["'][^"']*\b(bg-|text-|p-|m-|flex|grid|w-|h-|rounded|shadow|border)\b)/i.test(html)) {
            if (!/cdn\.tailwindcss\.com/i.test(html)) {
                smartInjections += '<script src="https://cdn.tailwindcss.com"><\/script>\n';
                injectedLibs.push('Tailwind CSS');
            }
        }

        // 2. FontAwesome 감지 (fa-, fas, fab 등)
        if (/(class\s*=\s*["'][^"']*\b(fa-|fas|fab|far)\b)/i.test(html) || /<i\b[^>]*\bfa-/i.test(html)) {
            if (!/font-awesome/i.test(html)) {
                smartInjections += '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n';
                injectedLibs.push('FontAwesome 6.4.0');
            }
        }

        // 3. Outfit Font 감지
        if (/Outfit/i.test(html) || /Outfit/i.test(css)) {
            if (!/fonts\.googleapis\.com.*Outfit/i.test(html)) {
                smartInjections += '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap" rel="stylesheet">\n';
                injectedLibs.push('Outfit Google Font');
            }
        }

        // 4. Lucide Icons 감지
        if (/data-lucide/i.test(html)) {
            if (!/lucide/i.test(html)) {
                smartInjections += '<script src="https://unpkg.com/lucide@latest"><\/script>\n';
                smartInjections += '<script>window.addEventListener("DOMContentLoaded", () => { if(window.lucide) lucide.createIcons(); });<\/script>\n';
                injectedLibs.push('Lucide Icons');
            }
        }

        // 콘솔 출력을 부모 창으로 전달하는 캡처 코드
        let consoleCapture = `<script>
(function() {
    var post = function(level, args) {
        window.parent.postMessage({
            type: 'console', level: level,
            message: Array.from(args).map(function(a) {
                if (typeof a === 'object') { try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); } }
                return String(a);
            }).join(' ')
        }, '*');
    };
    var _log = console.log, _warn = console.warn, _err = console.error, _info = console.info;
    console.log   = function() { _log.apply(console, arguments);  post('log',   arguments); };
    console.warn  = function() { _warn.apply(console, arguments); post('warn',  arguments); };
    console.error = function() { _err.apply(console, arguments);  post('error', arguments); };
    console.info  = function() { _info.apply(console, arguments); post('log',   arguments); };
    window.addEventListener('error', function(e) {
        post('error', [e.message + ' (line ' + e.lineno + ')']);
    });
    window.addEventListener('unhandledrejection', function(e) {
        post('error', ['Unhandled Promise rejection: ' + (e.reason && e.reason.message ? e.reason.message : String(e.reason))]);
    });
    // srcdoc iframe의 base URL이 부모 페이지를 가리키므로 #hash 링크 클릭 시
    // iframe이 부모 URL로 이동하는 문제를 방지하고 내부에서 스크롤 처리
    document.addEventListener('click', function(e) {
        var a = e.target.closest('a');
        if (!a) return;
        var href = a.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            var id = href.slice(1);
            var el = id ? document.getElementById(id) : null;
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            else if (!id) window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, true);
    ${injectedLibs.length > 0 ? `post('log', ['[Smart Loader] Automatically injected: ${injectedLibs.join(", ")}']);` : ''}
})();
<\/script>`;

        const cssTag = css && css.trim() ? `<style>\n${css}\n</style>` : '';
        const jsTag  = js  && js.trim()  ? `<script>\n${js}\n<\/script>` : '';

        if (isFullDocument) {
            let result = html;
            // <head> 바로 뒤에 콘솔 캡처와 스마트 인젝션 삽입
            if (/<head[^>]*>/i.test(result)) {
                result = result.replace(/<head([^>]*)>/i, `<head$1>\n${consoleCapture}\n${smartInjections}`);
            } else {
                result = consoleCapture + smartInjections + result;
            }

            // CSS 탭
            if (cssTag) {
                if (/<\/head>/i.test(result)) {
                    result = result.replace(/<\/head>/i, `${cssTag}\n</head>`);
                } else {
                    result = cssTag + result;
                }
            }

            // JS 탭
            if (jsTag) {
                if (/<\/body>/i.test(result)) {
                    result = result.replace(/<\/body>/i, `${jsTag}\n</body>`);
                } else {
                    result += '\n' + jsTag;
                }
            }
            return result;
        }

        // body 일부만 작성된 경우
        return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${consoleCapture}
${smartInjections}
${cssTag}
</head>
<body>
${html}
${jsTag}
</body>
</html>`;
    },

    // 콘솔 캡처 설정
    setupConsoleCapture() {
        window.addEventListener('message', (e) => {
            if (e.data.type === 'console') {
                this.logToConsole(e.data.level, e.data.message);
                // 런타임 에러 발생 시 JS 탭에 에러 표시
                if (e.data.level === 'error') {
                    this._markErrorTab('js');
                }
            }
        });
    },

    // 콘솔에 로그 출력
    logToConsole(level, message) {
        const logEntry = {
            level,
            message,
            timestamp: new Date().toLocaleTimeString(),
        };

        this.consoleLogs.push(logEntry);

        const logElement = document.createElement('div');
        logElement.className = `console-message ${level}`;
        logElement.textContent = `[${logEntry.timestamp}] ${message}`;

        this.consoleOutput?.appendChild(logElement);
        this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
    },

    // 에러 로그
    logError(message) {
        this.logToConsole('error', message);
    },

    // 콘솔 지우기
    clearConsole() {
        this.consoleLogs = [];
        if (this.consoleOutput) {
            this.consoleOutput.innerHTML = '';
        }
    },

    // 썸네일 생성 (html2canvas 필요)
    async generateThumbnail() {
        try {
            // html2canvas가 로드되어 있는지 확인
            if (typeof html2canvas === 'undefined') {
                console.warn('html2canvas not loaded');
                return null;
            }

            const canvas = await html2canvas(this.previewFrame.contentDocument.body, {
                backgroundColor: '#ffffff',
                scale: 0.5,
                width: 800,
                height: 600,
            });

            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Failed to generate thumbnail:', error);
            return null;
        }
    },
};

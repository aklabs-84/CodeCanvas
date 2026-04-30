// preview.js - 미리보기 렌더링 모듈

export const PreviewManager = {
    previewFrame: null,
    consoleOutput: null,
    consoleLogs: [],
    currentBlobUrl: null,

    // 초기화
    init() {
        this.previewFrame = document.getElementById('preview-frame');
        this.consoleOutput = document.getElementById('console-output');
        this.attachEventListeners();
        this.setupConsoleCapture();
    },

    
    // 이벤트 리스너
    attachEventListeners() {
        const btnRun = document.getElementById('btn-run');
        btnRun?.addEventListener('click', () => {
            this.run();
        });

        const btnClearConsole = document.getElementById('btn-clear-console');
        btnClearConsole?.addEventListener('click', () => {
            this.clearConsole();
        });

        // Ctrl+Enter로 실행
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.run();
            }
        });
    },

    // 코드 실행
    run() {
        // EditorManager에서 코드 가져오기
        const code = window.EditorManager?.getCode();
        if (!code) {
            console.warn('EditorManager not initialized');
            return;
        }

        this.clearConsole();
        this.renderPreview(code);
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
        // 콘솔 출력을 부모 창으로 전달하는 캡처 코드
        const consoleCapture = `<script>
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
})();
<\/script>`;

        const cssTag = css && css.trim() ? `<style>\n${css}\n</style>` : '';
        const jsTag  = js  && js.trim()  ? `<script>\n${js}\n<\/script>` : '';

        const trimmed = html.trim();
        const isFullDocument = /^<!doctype/i.test(trimmed) || /^<html/i.test(trimmed);

        if (isFullDocument) {
            // 완성된 HTML 문서: 사용자 코드를 그대로 사용하고 주입만 함
            let result = html;

            // 콘솔 캡처: <head> 바로 뒤에 삽입 (없으면 앞에 추가)
            if (/<head[^>]*>/i.test(result)) {
                result = result.replace(/<head([^>]*)>/i, `<head$1>\n${consoleCapture}`);
            } else {
                result = consoleCapture + result;
            }

            // CSS 탭: </head> 직전에 삽입
            if (cssTag) {
                if (/<\/head>/i.test(result)) {
                    result = result.replace(/<\/head>/i, `${cssTag}\n</head>`);
                } else {
                    result = cssTag + result;
                }
            }

            // JS 탭: </body> 직전에 삽입 (없으면 끝에 추가)
            if (jsTag) {
                if (/<\/body>/i.test(result)) {
                    result = result.replace(/<\/body>/i, `${jsTag}\n</body>`);
                } else {
                    result += '\n' + jsTag;
                }
            }

            return result;
        }

        // body 일부만 작성된 경우: 기본 문서 구조로 감싸기
        return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${consoleCapture}
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

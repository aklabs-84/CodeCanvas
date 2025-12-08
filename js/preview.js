// preview.js - 미리보기 렌더링 모듈

export const PreviewManager = {
    previewFrame: null,
    consoleOutput: null,
    consoleLogs: [],

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
            // srcdoc을 사용하여 안전하게 렌더링
            if (this.previewFrame) {
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
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        ${css}
    </style>
</head>
<body>
    ${html}
    <script>
        // 콘솔 캡처
        (function() {
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            const originalInfo = console.info;

            function postMessage(type, args) {
                window.parent.postMessage({
                    type: 'console',
                    level: type,
                    message: Array.from(args).map(arg => {
                        if (typeof arg === 'object') {
                            try {
                                return JSON.stringify(arg, null, 2);
                            } catch (e) {
                                return String(arg);
                            }
                        }
                        return String(arg);
                    }).join(' ')
                }, '*');
            }

            console.log = function() {
                originalLog.apply(console, arguments);
                postMessage('log', arguments);
            };

            console.error = function() {
                originalError.apply(console, arguments);
                postMessage('error', arguments);
            };

            console.warn = function() {
                originalWarn.apply(console, arguments);
                postMessage('warn', arguments);
            };

            console.info = function() {
                originalInfo.apply(console, arguments);
                postMessage('info', arguments);
            };

            // 에러 캡처
            window.addEventListener('error', function(e) {
                postMessage('error', [e.message + ' at line ' + e.lineno]);
            });

            window.addEventListener('unhandledrejection', function(e) {
                postMessage('error', ['Unhandled Promise Rejection: ' + e.reason]);
            });
        })();
    </script>
    <script>
        ${js}
    </script>
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

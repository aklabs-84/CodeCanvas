// editor.js - CodeMirror 에디터 초기화 및 관리

export const EditorManager = {
    editors: {
        html: null,
        css: null,
        js: null,
        unified: null,
    },

    currentMode: 'html', // 'html' | 'css' | 'js' | 'unified'

    code: {
        html: '<!DOCTYPE html>\n<html lang="ko">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    <h1>Hello, CodeCanvas!</h1>\n</body>\n</html>',
        css: 'body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}\n\nh1 {\n    color: #333;\n}',
        js: 'console.log("Hello, CodeCanvas!");',
    },

    // 초기화
    async init() {
        // 간단한 textarea 에디터 사용 (CodeMirror는 나중에)
        this.initializeEditors();
        this.attachEventListeners();
    },

    // 에디터 초기화
    initializeEditors() {
        // 간단한 에디터 설정 (실제로는 CDN에서 CodeMirror를 불러와야 함)
        // 임시로 textarea처럼 동작하도록 설정

        const editorPanes = {
            html: document.getElementById('editor-html'),
            css: document.getElementById('editor-css'),
            js: document.getElementById('editor-js'),
            unified: document.getElementById('editor-unified'),
        };

        // 각 에디터 패널에 textarea 생성 (CodeMirror 대신 임시)
        Object.keys(editorPanes).forEach(mode => {
            const pane = editorPanes[mode];
            if (pane && !this.editors[mode]) {
                const textarea = document.createElement('textarea');
                textarea.className = 'simple-editor';
                textarea.style.cssText = `
                    width: 100%;
                    height: 100%;
                    padding: 16px;
                    border: none;
                    outline: none;
                    resize: none;
                    font-family: var(--font-mono);
                    font-size: var(--font-size-sm);
                    line-height: 1.6;
                    background-color: var(--editor-bg);
                    color: var(--text-primary);
                    tab-size: 4;
                `;

                if (mode === 'unified') {
                    textarea.value = this.getUnifiedCode();
                } else {
                    textarea.value = this.code[mode];
                }

                textarea.addEventListener('input', (e) => {
                    this.handleCodeChange(mode, e.target.value);
                });

                // Tab 키 처리
                textarea.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
                        textarea.selectionStart = textarea.selectionEnd = start + 4;
                    }
                });

                pane.appendChild(textarea);
                this.editors[mode] = textarea;
            }
        });

        this.switchMode(this.currentMode);
    },

    // 코드 변경 핸들러
    handleCodeChange(mode, value) {
        if (mode === 'unified') {
            // 통합 모드에서는 HTML, CSS, JS를 파싱해서 분리
            this.parseUnifiedCode(value);
        } else {
            this.code[mode] = value;
        }

        // 자동 저장 트리거
        if (window.ProjectManager) {
            window.ProjectManager.triggerAutoSave();
        }
    },

    // 모드 전환
    switchMode(mode) {
        this.currentMode = mode;

        // 모든 에디터 패널 숨기기
        document.querySelectorAll('.editor-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        // 선택된 에디터 패널 표시
        const activePane = document.getElementById(`editor-${mode}`);
        activePane?.classList.add('active');

        // 탭 버튼 활성화
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.tab-btn[data-mode="${mode}"]`)?.classList.add('active');

        // 통합 모드로 전환시 코드 동기화
        if (mode === 'unified' && this.editors.unified) {
            this.editors.unified.value = this.getUnifiedCode();
        }
    },

    // 통합 코드 가져오기
    getUnifiedCode() {
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
${this.code.css}
    </style>
</head>
<body>
${this.code.html.replace(/<!DOCTYPE html>[\s\S]*?<body>/gi, '').replace(/<\/body>[\s\S]*<\/html>/gi, '')}
    <script>
${this.code.js}
    </script>
</body>
</html>`;
    },

    // 통합 코드 파싱 (간단한 버전)
    parseUnifiedCode(unified) {
        // CSS 추출
        const cssMatch = unified.match(/<style>([\s\S]*?)<\/style>/i);
        if (cssMatch) {
            this.code.css = cssMatch[1].trim();
        }

        // JS 추출
        const jsMatch = unified.match(/<script>([\s\S]*?)<\/script>/i);
        if (jsMatch) {
            this.code.js = jsMatch[1].trim();
        }

        // HTML 추출 (body 내용만)
        const bodyMatch = unified.match(/<body>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            let bodyContent = bodyMatch[1];
            // script 태그 제거
            bodyContent = bodyContent.replace(/<script>[\s\S]*?<\/script>/gi, '').trim();
            this.code.html = bodyContent;
        }

        // 분리 모드 에디터들도 업데이트
        if (this.editors.html) this.editors.html.value = this.code.html;
        if (this.editors.css) this.editors.css.value = this.code.css;
        if (this.editors.js) this.editors.js.value = this.code.js;
    },

    // 코드 가져오기
    getCode() {
        return {
            html: this.code.html,
            css: this.code.css,
            js: this.code.js,
        };
    },

    // 코드 설정
    setCode({ html, css, js }) {
        this.code.html = html || '';
        this.code.css = css || '';
        this.code.js = js || '';

        // 에디터 업데이트
        if (this.editors.html) this.editors.html.value = this.code.html;
        if (this.editors.css) this.editors.css.value = this.code.css;
        if (this.editors.js) this.editors.js.value = this.code.js;
        if (this.editors.unified) this.editors.unified.value = this.getUnifiedCode();
    },

    // 이벤트 리스너
    attachEventListeners() {
        // 탭 버튼
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.switchMode(mode);
            });
        });
    },
};

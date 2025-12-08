// editor-ace.js - Ace Editor 초기화 및 관리

export const EditorManager = {
    editors: {
        html: null,
        css: null,
        js: null,
        unified: null,
    },

    currentMode: 'html', // 'html' | 'css' | 'js' | 'unified'

    code: {
        html: `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>Hello, CodeCanvas!</h1>
</body>
</html>`,
        css: `body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
}

h1 {
    color: #333;
}`,
        js: 'console.log("Hello, CodeCanvas!");',
    },

    // 초기화
    async init() {
        // Ace가 로드될 때까지 대기
        await this.waitForAce();
        this.initializeEditors();
        this.attachEventListeners();
    },

    // Ace 로드 대기
    waitForAce() {
        return new Promise((resolve) => {
            if (typeof ace !== 'undefined') {
                resolve();
            } else {
                const checkAce = setInterval(() => {
                    if (typeof ace !== 'undefined') {
                        clearInterval(checkAce);
                        resolve();
                    }
                }, 100);
            }
        });
    },

    // 에디터 초기화
    initializeEditors() {
        const editorPanes = {
            html: document.getElementById('editor-html'),
            css: document.getElementById('editor-css'),
            js: document.getElementById('editor-js'),
            unified: document.getElementById('editor-unified'),
        };

        // Ace 설정
        ace.config.set('basePath', 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.2/');

        // 각 에디터 패널에 Ace Editor 생성
        Object.keys(editorPanes).forEach(mode => {
            const pane = editorPanes[mode];
            if (pane && !this.editors[mode]) {
                // Ace 에디터 생성
                const editor = ace.edit(pane.id);

                // 기본 설정
                editor.setTheme('ace/theme/monokai');
                editor.setOptions({
                    fontSize: '14px',
                    showPrintMargin: false,
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    tabSize: 4,
                    useSoftTabs: true,
                });

                // 모드별 언어 설정
                if (mode === 'html') {
                    editor.session.setMode('ace/mode/html');
                    editor.setValue(this.code.html, -1);
                } else if (mode === 'css') {
                    editor.session.setMode('ace/mode/css');
                    editor.setValue(this.code.css, -1);
                } else if (mode === 'js') {
                    editor.session.setMode('ace/mode/javascript');
                    editor.setValue(this.code.js, -1);
                } else if (mode === 'unified') {
                    editor.session.setMode('ace/mode/html');
                    editor.setValue(this.getUnifiedCode(), -1);
                }

                // 변경 이벤트
                editor.session.on('change', () => {
                    this.handleCodeChange(mode, editor.getValue());
                });

                this.editors[mode] = editor;
            }
        });

        this.switchMode(this.currentMode);
        this.applyTheme();
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
            this.editors.unified.setValue(this.getUnifiedCode(), -1);
        }

        // 에디터 크기 조정
        if (this.editors[mode]) {
            this.editors[mode].resize();
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

    // 통합 코드 파싱
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
        if (this.editors.html) this.editors.html.setValue(this.code.html, -1);
        if (this.editors.css) this.editors.css.setValue(this.code.css, -1);
        if (this.editors.js) this.editors.js.setValue(this.code.js, -1);
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
        if (this.editors.html) this.editors.html.setValue(this.code.html, -1);
        if (this.editors.css) this.editors.css.setValue(this.code.css, -1);
        if (this.editors.js) this.editors.js.setValue(this.code.js, -1);
        if (this.editors.unified) this.editors.unified.setValue(this.getUnifiedCode(), -1);
    },

    // 테마 적용
    applyTheme() {
        const isDark = document.body.classList.contains('theme-dark');
        const theme = isDark ? 'ace/theme/monokai' : 'ace/theme/chrome';

        Object.values(this.editors).forEach(editor => {
            if (editor) {
                editor.setTheme(theme);
            }
        });
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

        // 테마 변경 감지
        const observer = new MutationObserver(() => {
            this.applyTheme();
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class'],
        });
    },
};

// editor.js - Monaco Editor (VS Code 엔진) 초기화 및 관리

const MONACO_BASE = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';

export const EditorManager = {
    editors: {
        html: null,
        css: null,
        js: null,
        unified: null,
    },

    currentMode: 'html',

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

    async init() {
        this._setupWorkers();
        await this._loadMonaco();
        this._initializeEditors();
        this._attachEventListeners();
    },

    // 언어 서비스 워커 설정 (IntelliSense 활성화 핵심)
    _setupWorkers() {
        window.MonacoEnvironment = {
            getWorkerUrl(moduleId, label) {
                const workerMap = {
                    css:        `${MONACO_BASE}/language/css/css.worker.js`,
                    scss:       `${MONACO_BASE}/language/css/css.worker.js`,
                    less:       `${MONACO_BASE}/language/css/css.worker.js`,
                    html:       `${MONACO_BASE}/language/html/html.worker.js`,
                    handlebars: `${MONACO_BASE}/language/html/html.worker.js`,
                    razor:      `${MONACO_BASE}/language/html/html.worker.js`,
                    typescript: `${MONACO_BASE}/language/typescript/ts.worker.js`,
                    javascript: `${MONACO_BASE}/language/typescript/ts.worker.js`,
                };
                const workerScript = workerMap[label] || `${MONACO_BASE}/editor/editor.worker.js`;
                // data URI 방식: CDN cross-origin worker 제한 우회
                return `data:text/javascript;charset=utf-8,${encodeURIComponent(
                    `self.MonacoEnvironment={baseUrl:'${MONACO_BASE}/'};importScripts('${workerScript}');`
                )}`;
            }
        };
    },

    // Monaco 로더 대기
    _loadMonaco() {
        return new Promise((resolve) => {
            if (typeof monaco !== 'undefined') { resolve(); return; }
            require(['vs/editor/editor.main'], resolve);
        });
    },

    // 에디터 인스턴스 생성
    _initializeEditors() {
        const isDark = document.body.classList.contains('theme-dark');

        const commonOptions = {
            theme: isDark ? 'vs-dark' : 'vs',
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
            fontLigatures: true,
            automaticLayout: true,       // 컨테이너 크기 변경 시 자동 재조정
            minimap: { enabled: true },
            wordWrap: 'on',
            tabSize: 4,
            insertSpaces: true,
            folding: true,
            foldingHighlight: true,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
            formatOnType: true,
            quickSuggestions: { other: true, comments: false, strings: true },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            snippetSuggestions: 'inline',
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true, indentation: true },
            padding: { top: 8, bottom: 8 },
            scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
            renderWhitespace: 'selection',
            links: true,
            colorDecorators: true,       // CSS color 미리보기
        };

        const configs = [
            { key: 'html',    language: 'html',       value: this.code.html,          containerId: 'editor-html' },
            { key: 'css',     language: 'css',        value: this.code.css,           containerId: 'editor-css' },
            { key: 'js',      language: 'javascript', value: this.code.js,            containerId: 'editor-js' },
            { key: 'unified', language: 'html',       value: this._getUnifiedCode(),  containerId: 'editor-unified' },
        ];

        configs.forEach(({ key, language, value, containerId }) => {
            const container = document.getElementById(containerId);
            if (!container) return;

            const editor = monaco.editor.create(container, {
                ...commonOptions,
                language,
                value,
            });

            editor.onDidChangeModelContent(() => {
                this._handleCodeChange(key, editor.getValue());
            });

            this.editors[key] = editor;
        });

        // HTML 에디터에 Emmet 활성화
        monaco.languages.html?.registerCompletionItemProvider?.('html', {
            triggerCharacters: ['>'],
        });

        this._switchMode(this.currentMode);
    },

    _handleCodeChange(mode, value) {
        if (mode === 'unified') {
            this._parseUnifiedCode(value);
        } else {
            this.code[mode] = value;
        }

        if (window.ProjectManager) {
            window.ProjectManager.triggerAutoSave();
        }
    },

    _switchMode(mode) {
        this.currentMode = mode;

        document.querySelectorAll('.editor-pane').forEach(p => p.classList.remove('active'));
        document.getElementById(`editor-${mode}`)?.classList.add('active');

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.tab-btn[data-mode="${mode}"]`)?.classList.add('active');

        if (mode === 'unified') {
            this._setValue(this.editors.unified, this._getUnifiedCode());
        }

        // 탭 전환 후 에디터 레이아웃 즉시 갱신
        this.editors[mode]?.layout();
    },

    _getUnifiedCode() {
        const bodyOnly = this.code.html
            .replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/gi, '')
            .replace(/<\/body>[\s\S]*<\/html>/gi, '')
            .trim();

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
${bodyOnly}
    <script>
${this.code.js}
    <\/script>
</body>
</html>`;
    },

    _parseUnifiedCode(unified) {
        const cssMatch = unified.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        if (cssMatch) this.code.css = cssMatch[1].trim();

        const jsMatch = unified.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        if (jsMatch) this.code.js = jsMatch[1].trim();

        const bodyMatch = unified.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            this.code.html = bodyMatch[1]
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .trim();
        }

        // 분리 에디터에 반영 (값이 실제로 다를 때만 → 불필요한 이벤트 방지)
        this._setValue(this.editors.html, this.code.html);
        this._setValue(this.editors.css,  this.code.css);
        this._setValue(this.editors.js,   this.code.js);
    },

    // 현재 값과 다를 때만 setValue (무한 change 루프 방지)
    _setValue(editor, value) {
        if (!editor) return;
        const model = editor.getModel();
        if (model && model.getValue() !== value) {
            model.setValue(value);
        }
    },

    // ── 공개 API (다른 모듈에서 사용) ────────────────────────────

    getCode() {
        return {
            html: this.code.html,
            css:  this.code.css,
            js:   this.code.js,
        };
    },

    setCode({ html, css, js }) {
        this.code.html = html || '';
        this.code.css  = css  || '';
        this.code.js   = js   || '';

        this._setValue(this.editors.html,    this.code.html);
        this._setValue(this.editors.css,     this.code.css);
        this._setValue(this.editors.js,      this.code.js);
        this._setValue(this.editors.unified, this._getUnifiedCode());
    },

    applyTheme() {
        if (typeof monaco === 'undefined') return;
        const isDark = document.body.classList.contains('theme-dark');
        monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
    },

    // layout.js에서 패널 크기 변경 시 호출
    resize() {
        Object.values(this.editors).forEach(e => e?.layout());
    },

    _attachEventListeners() {
        // 탭 전환
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this._switchMode(btn.dataset.mode));
        });

        // 테마 변경 감지 (body class 변화)
        new MutationObserver(() => this.applyTheme()).observe(document.body, {
            attributes: true,
            attributeFilter: ['class'],
        });
    },
};

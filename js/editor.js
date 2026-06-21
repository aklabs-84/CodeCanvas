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
    _parsing: false, // 자동 분리 재진입 방지 플래그

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
            getWorker(moduleId, label) {
                // 언어 워커(css/ts/html)는 min 빌드에서 self-contained AMD 번들.
                // → loader.js로 AMD 환경 구성 후 blob으로 실행
                const langWorkerMap = {
                    css:        `${MONACO_BASE}/language/css/cssWorker.js`,
                    scss:       `${MONACO_BASE}/language/css/cssWorker.js`,
                    less:       `${MONACO_BASE}/language/css/cssWorker.js`,
                    html:       `${MONACO_BASE}/language/html/htmlWorker.js`,
                    handlebars: `${MONACO_BASE}/language/html/htmlWorker.js`,
                    razor:      `${MONACO_BASE}/language/html/htmlWorker.js`,
                    typescript: `${MONACO_BASE}/language/typescript/tsWorker.js`,
                    javascript: `${MONACO_BASE}/language/typescript/tsWorker.js`,
                };

                const bundleUrl = langWorkerMap[label];

                if (bundleUrl) {
                    // self-contained 번들: loader.js → AMD 등록 → 워커 실행
                    const s = '(async()=>{try{'
                        + 'const tb=c=>URL.createObjectURL(new Blob([c],{type:"application/javascript"}));'
                        + 'const[lc,wc]=await Promise.all(['
                        + `fetch("${MONACO_BASE}/loader.js",{credentials:"omit"}).then(r=>r.text()),`
                        + `fetch("${bundleUrl}",{credentials:"omit"}).then(r=>r.text())`
                        + ']);'
                        + 'const lu=tb(lc);importScripts(lu);URL.revokeObjectURL(lu);'
                        + `self.require.config({paths:{vs:"${MONACO_BASE}"}});`
                        + 'const wu=tb(wc);importScripts(wu);URL.revokeObjectURL(wu);'
                        + `}catch(e){console.error("[Monaco Worker] load failed:","${bundleUrl}",e);}})();`;
                    return new Worker(URL.createObjectURL(new Blob([s], { type: 'text/javascript' })));
                }

                // 기본 에디터 워커(workerMain.js): 자체 AMD 로더가 내장된 self-contained 번들.
                // 메시지 수신도 자동 설정됨 → 외부 loader.js / require() 호출 불필요.
                // 단순 fetch → blob → importScripts 패턴으로 실행.
                const editorUrl = `${MONACO_BASE}/base/worker/workerMain.js`;
                const editorScript = `(async()=>{try{`
                    + `const t=await fetch("${editorUrl}",{credentials:"omit"}).then(r=>r.text());`
                    + `const u=URL.createObjectURL(new Blob([t],{type:"application/javascript"}));`
                    + `importScripts(u);URL.revokeObjectURL(u);`
                    + `}catch(e){console.error("[Monaco Worker] load failed:","${editorUrl}",e);}})();`;
                return new Worker(URL.createObjectURL(new Blob([editorScript], { type: 'text/javascript' })));
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

            // HTML 탭에 full document가 붙여넣어지면 CSS/JS를 자동 분리
            if (mode === 'html' && !this._parsing) {
                const trimmed = value.trim();
                if (/^<!doctype\s/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)) {
                    const parsed = this.parseUnifiedHTML(value);
                    if (parsed.css || parsed.js) {
                        this._parsing = true;
                        this.code.html = parsed.html;
                        this.code.css  = parsed.css;
                        this.code.js   = parsed.js;
                        this._setValue(this.editors.html,    parsed.html);
                        this._setValue(this.editors.css,     parsed.css);
                        this._setValue(this.editors.js,      parsed.js);
                        this._setValue(this.editors.unified, this._getUnifiedCode());
                        this._parsing = false;
                        if (window.showSuccessNotification) {
                            window.showSuccessNotification('HTML/CSS/JS 코드가 자동으로 분리되었습니다.');
                        }
                        if (window.ProjectManager) window.ProjectManager.triggerAutoSave();
                        if (window.PreviewManager) window.PreviewManager.scheduleAutoRun();
                        return;
                    }
                }
            }
        }

        if (window.ProjectManager) window.ProjectManager.triggerAutoSave();
        if (window.PreviewManager) window.PreviewManager.scheduleAutoRun();
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
        let bodyOnly = this.code.html;
        const trimmed = bodyOnly.trim();
        let headExternalTags = ''; // head의 외부 CDN 스크립트/스타일시트

        // full document인 경우 DOMParser로 body 내용만 추출 + head의 외부 리소스 보존
        if (/^<!doctype/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)) {
            try {
                const doc = new DOMParser().parseFromString(bodyOnly, 'text/html');
                // head의 외부 스크립트·스타일시트 추출 (CDN 등)
                doc.head.querySelectorAll('script[src], link[rel="stylesheet"][href]').forEach(el => {
                    headExternalTags += '\n    ' + el.outerHTML;
                });
                bodyOnly = doc.body.innerHTML.trim();
            } catch {
                bodyOnly = bodyOnly
                    .replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/gi, '')
                    .replace(/<\/body>[\s\S]*<\/html>/gi, '')
                    .trim();
            }
        }

        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>${headExternalTags}
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
        try {
            const doc = new DOMParser().parseFromString(unified, 'text/html');

            // style 태그 전체 추출 후 제거
            let css = '';
            doc.querySelectorAll('style').forEach(s => {
                css += s.textContent + '\n';
                s.remove();
            });

            // 인라인 script 태그 전체 추출 후 제거 (src 있는 외부 스크립트는 유지)
            let js = '';
            doc.querySelectorAll('script').forEach(s => {
                if (!s.hasAttribute('src')) {
                    js += s.textContent + '\n';
                    s.remove();
                }
            });

            // <head>의 외부 CDN 스크립트를 body 상단으로 이동 (데이터 손실 방지)
            let headScripts = '';
            doc.head.querySelectorAll('script[src], link[rel="stylesheet"][href]').forEach(el => {
                headScripts += el.outerHTML + '\n';
            });

            this.code.html = (headScripts ? headScripts + '\n' : '') + doc.body.innerHTML.trim();
            this.code.css  = css.trim();
            this.code.js   = js.trim();
        } catch (e) {
            console.error('[parseUnifiedCode] DOMParser 실패:', e);
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

    // 단일 HTML 파일을 HTML/CSS/JS로 정밀하게 분리 파싱하는 메서드
    parseUnifiedHTML(rawHtml) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawHtml, 'text/html');
            
            // 1. CSS 추출 및 제거
            let cssContent = '';
            const styleTags = doc.querySelectorAll('style');
            styleTags.forEach(style => {
                cssContent += style.textContent + '\n';
                style.remove();
            });
            
            // 2. JS 추출 및 제거 (인라인 스크립트만 대상)
            let jsContent = '';
            const scriptTags = doc.querySelectorAll('script');
            scriptTags.forEach(script => {
                if (!script.hasAttribute('src')) {
                    jsContent += script.textContent + '\n';
                    script.remove();
                }
            });
            
            // 3. 남은 마크업 추출
            let htmlContent = '';
            if (rawHtml.trim().toLowerCase().startsWith('<!doctype') || rawHtml.toLowerCase().includes('<html')) {
                htmlContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
            } else {
                htmlContent = doc.body.innerHTML;
            }
            
            return {
                html: htmlContent.trim(),
                css: cssContent.trim(),
                js: jsContent.trim()
            };
        } catch (e) {
            console.error('Failed to parse unified HTML:', e);
            return {
                html: rawHtml,
                css: '',
                js: ''
            };
        }
    },

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

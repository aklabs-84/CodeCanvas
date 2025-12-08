// editor.js - CodeMirror 6 에디터

export const EditorManager = {
    editors: { html: null, css: null, js: null, unified: null },
    currentMode: 'html',
    code: {
        html: '<!DOCTYPE html>\n<html lang="ko">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    <h1>Hello, CodeCanvas!</h1>\n</body>\n</html>',
        css: 'body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}\n\nh1 {\n    color: #333;\n}',
        js: 'console.log("Hello, CodeCanvas!");',
    },

    async init() {
        await this.waitForCodeMirror();
        this.initializeEditors();
        this.attachEventListeners();
    },

    async waitForCodeMirror() {
        return new Promise((resolve) => {
            const check = () => {
                if (window.CodeMirrorModules) resolve();
                else setTimeout(check, 100);
            };
            check();
        });
    },

    initializeEditors() {
        const { EditorView, EditorState, basicSetup, html, css, javascript, oneDark } = window.CodeMirrorModules;
        const panes = {
            html: { el: document.getElementById('editor-html'), lang: html(), code: this.code.html },
            css: { el: document.getElementById('editor-css'), lang: css(), code: this.code.css },
            js: { el: document.getElementById('editor-js'), lang: javascript(), code: this.code.js },
            unified: { el: document.getElementById('editor-unified'), lang: html(), code: this.getUnifiedCode() },
        };

        Object.keys(panes).forEach(mode => {
            const pane = panes[mode];
            if (pane.el && !this.editors[mode]) {
                pane.el.innerHTML = '';
                const isDark = document.body.classList.contains('theme-dark');
                const state = EditorState.create({
                    doc: pane.code,
                    extensions: [
                        basicSetup,
                        pane.lang,
                        isDark ? oneDark : [],
                        EditorView.updateListener.of((u) => {
                            if (u.docChanged) this.handleCodeChange(mode, u.state.doc.toString());
                        }),
                        EditorView.theme({
                            "&": { height: "100%", fontSize: "13px" },
                            ".cm-scroller": { overflow: "auto", fontFamily: "Menlo, Monaco, monospace" }
                        })
                    ],
                });
                this.editors[mode] = new EditorView({ state, parent: pane.el });
            }
        });
        this.switchMode(this.currentMode);
    },

    handleCodeChange(mode, value) {
        if (mode === 'unified') this.parseUnifiedCode(value);
        else this.code[mode] = value;
        if (window.ProjectManager) window.ProjectManager.triggerAutoSave();
    },

    switchMode(mode) {
        this.currentMode = mode;
        document.querySelectorAll('.editor-pane').forEach(p => p.classList.remove('active'));
        document.getElementById(`editor-${mode}`)?.classList.add('active');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.tab-btn[data-mode="${mode}"]`)?.classList.add('active');
    },

    getUnifiedCode() {
        const body = this.code.html.replace(/<!DOCTYPE html>[\s\S]*?<body>/gi, '').replace(/<\/body>[\s\S]*<\/html>/gi, '');
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
${body}
    <script>
${this.code.js}
    <\/script>
</body>
</html>`;
    },

    parseUnifiedCode(unified) {
        const cssMatch = unified.match(/<style>([\s\S]*?)<\/style>/i);
        if (cssMatch) {
            this.code.css = cssMatch[1].trim();
            this.updateEditor('css', this.code.css);
        }
        const jsMatch = unified.match(/<script>([\s\S]*?)<\/script>/i);
        if (jsMatch) {
            this.code.js = jsMatch[1].trim();
            this.updateEditor('js', this.code.js);
        }
        const bodyMatch = unified.match(/<body>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            let bodyContent = bodyMatch[1].replace(/<script>[\s\S]*?<\/script>/gi, '').trim();
            this.code.html = bodyContent;
            this.updateEditor('html', this.code.html);
        }
    },

    updateEditor(mode, content) {
        if (this.editors[mode]) {
            const { EditorState } = window.CodeMirrorModules;
            this.editors[mode].setState(EditorState.create({
                doc: content,
                extensions: this.editors[mode].state.extensions
            }));
        }
    },

    getCode() {
        return { html: this.code.html, css: this.code.css, js: this.code.js };
    },

    setCode({ html, css, js }) {
        this.code.html = html || '';
        this.code.css = css || '';
        this.code.js = js || '';
        this.updateEditor('html', this.code.html);
        this.updateEditor('css', this.code.css);
        this.updateEditor('js', this.code.js);
        this.updateEditor('unified', this.getUnifiedCode());
    },

    attachEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
        });
    },
};

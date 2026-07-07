// cdn-search.js - CDN 라이브러리 검색 및 삽입

const CDNJS_API = 'https://api.cdnjs.com/libraries?fields=name,version,description,latest&search=';

export const CdnSearchManager = {
    _debounceTimer: null,

    init() {
        this.modal = document.getElementById('cdn-search-modal');
        this.input = document.getElementById('cdn-search-input');
        this.results = document.getElementById('cdn-search-results');
        this._attachEventListeners();
    },

    _attachEventListeners() {
        document.getElementById('btn-cdn-search')?.addEventListener('click', () => this.open());

        this.input?.addEventListener('input', () => {
            clearTimeout(this._debounceTimer);
            const query = this.input.value.trim();
            if (!query) {
                this._renderPlaceholder('검색어를 입력하세요.');
                return;
            }
            this._debounceTimer = setTimeout(() => this._search(query), 300);
        });
    },

    open() {
        this.modal?.classList.remove('hidden');
        this.input?.focus();
    },

    close() {
        this.modal?.classList.add('hidden');
    },

    async _search(query) {
        this._renderPlaceholder('검색 중...');
        try {
            const res = await fetch(CDNJS_API + encodeURIComponent(query));
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            this._renderResults(data.results ?? []);
        } catch (error) {
            console.error('CDN 라이브러리 검색 실패:', error);
            this._renderPlaceholder('검색에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
    },

    _renderPlaceholder(text) {
        if (!this.results) return;
        this.results.innerHTML = '';
        const el = document.createElement('div');
        el.className = 'cdn-search-placeholder';
        el.textContent = text;
        this.results.appendChild(el);
    },

    _renderResults(libraries) {
        if (!this.results) return;
        this.results.innerHTML = '';

        if (libraries.length === 0) {
            this._renderPlaceholder('검색 결과가 없습니다.');
            return;
        }

        libraries.forEach(lib => {
            if (!lib.latest) return;

            const item = document.createElement('button');
            item.className = 'cdn-result-item';
            item.innerHTML = `
                <span class="cdn-result-name">${lib.name}</span>
                <span class="cdn-result-version">v${lib.version}</span>
                <span class="cdn-result-desc">${lib.description ?? ''}</span>
            `;
            item.addEventListener('click', () => this._insertLibrary(lib));
            this.results.appendChild(item);
        });
    },

    // URL 확장자로 CSS/JS 판별 후 HTML 탭에 태그 삽입
    _insertLibrary(lib) {
        const url = lib.latest;
        const isCss = /\.css$/i.test(url);
        const tag = isCss
            ? `<link rel="stylesheet" href="${url}">`
            : `<script src="${url}"><\/script>`;

        this._insertIntoHtmlEditor(tag, isCss);
        this.close();

        if (window.showSuccessNotification) {
            window.showSuccessNotification(`'${lib.name}' 라이브러리가 추가되었습니다.`);
        }
    },

    // HTML 에디터에 태그 삽입: CSS는 </head> 앞, JS는 </body> 앞, 둘 다 없으면 커서 위치
    _insertIntoHtmlEditor(tag, isCss) {
        const em = window.EditorManager;
        const editor = em?.editors?.html;
        if (!editor) return;

        const model = editor.getModel();
        const code = model.getValue();
        const anchor = isCss ? '</head>' : '</body>';
        const idx = code.search(new RegExp(anchor, 'i'));

        if (idx !== -1) {
            const pos = model.getPositionAt(idx);
            editor.executeEdits('cdn-insert', [{
                range: new monaco.Range(pos.lineNumber, 1, pos.lineNumber, 1),
                text: tag + '\n',
                forceMoveMarkers: true,
            }]);
        } else {
            const selection = editor.getSelection();
            editor.executeEdits('cdn-insert', [{
                range: selection,
                text: tag,
                forceMoveMarkers: true,
            }]);
        }
        editor.focus();
    },
};

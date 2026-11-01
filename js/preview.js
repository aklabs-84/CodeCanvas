// preview.js - 미리보기 렌더링 모듈

export const PreviewManager = {
    previewFrame: null,
    previewContainer: null,
    consoleOutput: null,
    consoleLogs: [],
    currentBlobUrl: null,
    autoRun: false,
    _autoRunTimer: null,
    device: 'full',

    // 초기화
    init() {
        this.previewFrame = document.getElementById('preview-frame');
        this.previewContainer = document.getElementById('preview-container');
        this.consoleOutput = document.getElementById('console-output');
        this._trustedSandbox = this.previewFrame?.getAttribute('sandbox') || '';
        this._loadAutoRunPreference();
        this._loadDevicePreference();
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

        document.querySelectorAll('.btn-device').forEach(btn => {
            btn.addEventListener('click', () => this.setDevice(btn.dataset.device));
        });

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

    // 디바이스 시뮬레이터 전환 (full/tablet/mobile)
    setDevice(device) {
        this.device = device;
        localStorage.setItem('codecanvas_device', device);

        if (this.previewContainer) {
            this.previewContainer.classList.remove('device-mobile', 'device-tablet');
            if (device === 'mobile') this.previewContainer.classList.add('device-mobile');
            if (device === 'tablet') this.previewContainer.classList.add('device-tablet');
        }

        document.querySelectorAll('.btn-device').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.device === device);
        });
    },

    // localStorage에서 디바이스 설정 복원
    _loadDevicePreference() {
        const saved = localStorage.getItem('codecanvas_device');
        requestAnimationFrame(() => this.setDevice(saved || 'full'));
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
        this._showWarnings(this._scanCode(code));
        this.renderPreview(code);
        window.FixGuide?.onRun();
    },

    // 실행 전 코드 점검: 코드캔버스 미리보기에서는 잘 동작하지 않는 패턴을 찾아 안내 문구 목록으로 돌려준다
    _scanCode({ html = '', css = '', js = '' }) {
        const all = html + '\n' + js;
        const warnings = [];

        if (/generativelanguage\.googleapis\.com|api\.openai\.com|api\.anthropic\.com|GoogleGenerativeAI|@google\/genai|from\s*['"]openai['"]|GEMINI_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|YOUR_API_KEY|API_KEY_HERE/i.test(all)) {
            warnings.push('AI(Gemini·GPT 등)를 부르는 코드가 있어요. API 키가 없거나 보안 때문에 미리보기에서는 AI 기능이 동작하지 않을 수 있어요.');
        }
        if (/process\.env\.|import\.meta\.env/.test(all)) {
            warnings.push('환경변수(process.env, import.meta.env)를 쓰는 코드예요. 미리보기에는 환경변수가 없어서 값이 비어 있어요.');
        }
        if (/fetch\(\s*['"`]\/api\//.test(all)) {
            warnings.push("'/api/...' 서버 주소를 부르는 코드예요. 미리보기에는 그 서버가 없어서 실패할 수 있어요.");
        }
        if (/import\s[^'"\n]*from\s*['"](?![./]|https?:)/.test(all)) {
            warnings.push("npm 패키지 이름만 쓴 import(예: from 'react')가 있어요. 미리보기에서는 https 주소로 불러오는 형태만 동작해요.");
        }
        if (/window\.open\s*\(|target\s*=\s*["']_(top|parent)["']/i.test(all)) {
            warnings.push('새 창을 열거나 바깥 화면으로 이동하는 코드가 있어요. 미리보기 안에서는 막히거나 새 탭으로 열릴 수 있어요.');
        }
        if (/requestFullscreen|webkitRequestFullscreen/.test(all)) {
            warnings.push('전체 화면 기능을 쓰는 코드예요. 미리보기에서 막히면 "전체화면" 버튼으로 먼저 키운 뒤 시험해 보세요.');
        }
        if (/entryCode/.test(all) && !this._getHostParams().entryCode) {
            warnings.push('클래스로그 제출 코드(entryCode)가 있는데 주소에 entryCode가 없어요. 제출 시험은 주소 끝에 ?entryCode=코드 를 붙여서 열어 보세요.');
        }
        return warnings;
    },

    // 주소창의 클래스로그 값(entryCode 등)을 미리보기 안 코드가 읽을 수 있게 넘길 목록
    _getHostParams() {
        try {
            const q = new URLSearchParams(location.search);
            const out = {};
            ['entryCode', 'studentName', 'studentId'].forEach((k) => {
                const v = q.get(k);
                if (v) out[k] = String(v).slice(0, 200);
            });
            return out;
        } catch {
            return {};
        }
    },

    // 안내 배너 표시: 같은 안내는 닫으면 다시 안 뜨고, 안내 내용이 달라지면 다시 보여준다
    _showWarnings(warnings) {
        if (!this.previewContainer) return;
        const key = warnings.join('|');
        let banner = this.previewContainer.querySelector('.preview-warning');
        if (!warnings.length || document.body.classList.contains('view-mode')) {
            banner?.remove();
            this._warnKey = '';
            return;
        }
        if (key === this._warnKey) return;
        this._warnKey = key;

        if (!banner) {
            banner = document.createElement('div');
            banner.className = 'preview-warning';
            banner.setAttribute('role', 'status');
            this.previewContainer.appendChild(banner);
        }
        banner.textContent = '';
        const title = document.createElement('strong');
        title.textContent = '⚠ 미리보기에서 잘 안 될 수 있어요';
        const list = document.createElement('ul');
        warnings.forEach((w) => {
            const li = document.createElement('li');
            li.textContent = w;
            list.appendChild(li);
        });
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'preview-warning-close';
        close.setAttribute('aria-label', '안내 닫기');
        close.textContent = '×';
        close.addEventListener('click', () => banner.remove());
        banner.append(close, title, list);
    },

    // 에러가 있는 탭의 시각 표시 제거
    _clearErrorTabs() {
        document.querySelectorAll('.tab-btn.has-error').forEach(btn => {
            btn.classList.remove('has-error');
        });
        this._syncDropdownErrorDot();
    },

    // 에러 발생 시 해당 언어 탭에 빨간 점 표시
    _markErrorTab(lang) {
        const tab = document.querySelector(`.tab-btn[data-mode="${lang}"]`);
        tab?.classList.add('has-error');
        this._syncDropdownErrorDot();
    },

    // 드롭다운에 숨겨진 탭 중 에러가 있으면 닫힌 상태의 드롭다운 버튼에도 작은 점으로 표시
    _syncDropdownErrorDot() {
        const dot = document.getElementById('tab-dropdown-error-dot');
        if (!dot) return;
        const currentMode = window.EditorManager?.currentMode;
        const hasHiddenError = Array.from(document.querySelectorAll('.tab-btn.has-error'))
            .some(btn => btn.dataset.mode !== currentMode);
        dot.classList.toggle('visible', hasHiddenError);
    },

    // 미리보기 렌더링
    renderPreview({ html, css, js }) {
        const combinedHTML = this.combineCode(html, css, js);

        try {
            if (this.previewFrame) {
                // srcdoc 방식으로 회귀 (Blob URL 보안 문제 회피)
                // 전체화면 모드에서는 이 iframe 자체가 전체화면 컨테이너로 옮겨져 표시되므로 별도 동기화가 필요 없음
                // 공유 링크(보기 전용)로 열린 남의 코드는 allow-same-origin을 빼서 격리 실행한다.
                // 그래야 그 코드가 코드캔버스의 로그인 정보(localStorage)를 읽지 못한다.
                // sandbox 속성은 다음 이동(srcdoc 설정) 때 적용되므로 srcdoc보다 먼저 바꾼다.
                if (this._trustedSandbox) {
                    this.previewFrame.setAttribute('sandbox', this._isIsolated()
                        ? this._trustedSandbox.replace(/\ballow-same-origin\s*/g, '').trim()
                        : this._trustedSandbox);
                }
                this.previewFrame.srcdoc = combinedHTML;
            }
        } catch (error) {
            this.logError('Failed to render preview: ' + error.message);
        }
    },

    // 격리 실행 여부: 공유 링크 보기 전용 모드일 때만 켠다 (내가 편집하는 화면은 기존 방식 유지)
    _isIsolated() {
        return document.body.classList.contains('view-mode');
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
    // 바깥 링크: 미리보기 안에서 열면 막히는 사이트가 많아 새 탭으로 연다 (페이지가 직접 처리한 클릭은 건드리지 않음)
    document.addEventListener('click', function(e) {
        if (e.defaultPrevented) return;
        var a = e.target.closest && e.target.closest('a');
        if (!a || a.hasAttribute('download')) return;
        var href = a.getAttribute('href');
        if (!href || href.charAt(0) === '#' || /^(javascript|mailto|tel|blob|data):/i.test(href)) return;
        var t = a.getAttribute('target');
        if (t && t !== '_self' && t !== '_top' && t !== '_parent') return;
        e.preventDefault();
        if (/^https?:/i.test(href) || href.indexOf('//') === 0) {
            window.open(a.href, '_blank', 'noopener');
        } else {
            post('warn', ['미리보기에서는 다른 페이지로 이동하는 링크(' + href + ')가 동작하지 않아요. 한 화면 안에서 보이고 숨기는 방식으로 만들어 주세요.']);
        }
    }, false);
    // 폼: 주소 없이 제출하면 미리보기 화면이 코드캔버스 앱으로 바뀌어 버려서 막는다
    document.addEventListener('submit', function(e) {
        if (e.defaultPrevented) return;
        var f = e.target, act = f && f.getAttribute ? f.getAttribute('action') : null;
        if (!act || act.charAt(0) === '#') {
            e.preventDefault();
            post('warn', ['폼 제출을 막았어요(미리보기 화면이 사라지기 때문). 제출 처리는 submit 이벤트에서 event.preventDefault()를 호출하는 JavaScript로 만들어 주세요.']);
        }
    }, false);
    // 이미지·스크립트·CSS 등 불러오기 실패를 콘솔에 알림
    window.addEventListener('error', function(e) {
        var t = e.target;
        if (t && t !== window && t.tagName) {
            var u = t.src || t.href;
            if (u) post('warn', ['파일을 불러오지 못했어요 (' + t.tagName.toLowerCase() + '): ' + u]);
        }
    }, true);
    // 가로 넘침·이중 스크롤 진단
    window.addEventListener('load', function() {
        setTimeout(function() {
            try {
                var de = document.documentElement, b = document.body;
                if (!b) return;
                var bodyScrolls = /(auto|scroll)/.test(getComputedStyle(b).overflowY) && b.scrollHeight > b.clientHeight + 1;
                var htmlScrolls = de.scrollHeight > de.clientHeight + 1;
                if (bodyScrolls && htmlScrolls) {
                    de.style.overflow = 'hidden'; // body가 스스로 스크롤하므로 바깥(html) 스크롤바를 숨겨 한 겹만 남긴다
                    post('warn', ['스크롤바가 두 겹으로 생겨서 바깥 스크롤바를 자동으로 숨겼어요. 코드를 고치려면 body의 margin:0 과 box-sizing:border-box 를 확인해 보세요.']);
                }
                if (de.scrollWidth > de.clientWidth + 1) post('warn', ['화면 폭보다 넓은 요소가 있어서 가로 스크롤이 생겼어요. width:100vw 대신 100%를 쓰거나 max-width:100%를 확인해 보세요.']);
            } catch (err) {}
        }, 600);
    });
    // 클래스로그 제출 앱 등이 new URLSearchParams(location.search)로 entryCode를 읽을 수 있게 주소창 값을 전달
    ${this._isIsolated() ? `// 격리 실행에서는 localStorage/sessionStorage 접근이 막혀 예외가 나므로 메모리 저장소로 대신한다 (새로고침하면 사라짐)
    (function() {
        ['localStorage', 'sessionStorage'].forEach(function(name) {
            var d = {};
            var store = {
                getItem: function(k) { return Object.prototype.hasOwnProperty.call(d, k) ? d[k] : null; },
                setItem: function(k, v) { d[k] = String(v); },
                removeItem: function(k) { delete d[k]; },
                clear: function() { d = {}; },
                key: function(i) { return Object.keys(d)[i] || null; }
            };
            Object.defineProperty(store, 'length', { get: function() { return Object.keys(d).length; } });
            try { Object.defineProperty(window, name, { configurable: true, get: function() { return store; } }); } catch (e) {}
        });
    })();` : ''}
    var HOST = ${JSON.stringify(this._getHostParams()).replace(/</g, '\\u003c')};
    if (Object.keys(HOST).length) {
        var _USP = window.URLSearchParams;
        var PatchedUSP = function(init) {
            var p = new _USP(init);
            if (init === location.search) {
                Object.keys(HOST).forEach(function(k) { if (!p.has(k)) p.set(k, HOST[k]); });
            }
            return p;
        };
        PatchedUSP.prototype = _USP.prototype;
        window.URLSearchParams = PatchedUSP;
    }
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
        // 통합(unified) 탭에서 파싱될 때 body 태그 자체의 속성(class="flex justify-center" 등)은
        // editor.js가 <!--cc-body:...--> 마커 주석으로 앞에 붙여 보존해두므로, 여기서 복원해서 적용
        const { attrs: bodyAttrs, rest: bodyContent } = this._stripBodyMarker(html);

        return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${consoleCapture}
${smartInjections}
${cssTag}
</head>
<body${bodyAttrs ? ' ' + bodyAttrs : ''}>
${bodyContent}
${jsTag}
</body>
</html>`;
    },

    _stripBodyMarker(html) {
        const m = /^<!--cc-body:([^>]*)-->\n?/.exec(html);
        if (!m) return { attrs: '', rest: html };
        return { attrs: m[1], rest: html.slice(m[0].length) };
    },

    // 콘솔 캡처 설정
    setupConsoleCapture() {
        window.addEventListener('message', (e) => {
            // 미리보기 iframe에서 온 메시지만 받는다 (다른 창이 가짜 로그를 보내는 것 방지)
            if (!this.previewFrame || e.source !== this.previewFrame.contentWindow) return;
            if (e.data && e.data.type === 'console') {
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

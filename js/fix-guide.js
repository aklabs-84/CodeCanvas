// "AI가 만든 코드를 고치는 방법" 안내: 첫 실행 뒤 작은 띠로 알려주고, 누르면 3단계 설명 창을 연다.
// 서버를 쓰지 않는 화면 안내라서 비용이 들지 않는다.

const SEEN_KEY = 'codecanvas_fixguide_seen';

const PROMPT_TEXT =
`첨부한 코드(HTML 파일)를 바탕으로 수정해 줘.

[바꾸고 싶은 부분]
(여기에 적어 주세요. 예: 버튼을 더 크게, 배경색을 하늘색으로, 점수가 화면 위에 보이게)

[지켜 줘]
- 내가 바꾸라고 하지 않은 부분은 그대로 둬.
- 수정한 전체 코드를 하나의 HTML 파일로 처음부터 끝까지 다시 보여 줘.`;

const STYLE = `
.fixguide-bar{position:absolute;left:var(--spacing-sm);right:var(--spacing-sm);bottom:var(--spacing-sm);z-index:5;display:flex;align-items:center;gap:var(--spacing-sm);padding:var(--spacing-sm) var(--spacing-md);background:var(--bg-secondary);border:1px solid var(--border-color);border-left:4px solid var(--accent-primary);border-radius:var(--radius-sm);box-shadow:var(--shadow-md);color:var(--text-primary);font-size:var(--font-size-sm)}
.fixguide-bar span{flex:1}
.fixguide-bar button{cursor:pointer}
.fixguide-open{background:var(--accent-primary);color:var(--accent-text);border:none;border-radius:var(--radius-sm);padding:6px 12px;font-weight:600}
.fixguide-x{background:transparent;border:none;color:var(--text-secondary);font-size:18px;line-height:1}
.fixguide-overlay{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:var(--spacing-md)}
.fixguide-modal{background:var(--bg-primary);color:var(--text-primary);border-radius:12px;box-shadow:var(--shadow-lg);width:min(560px,100%);max-height:90vh;overflow-y:auto;padding:var(--spacing-lg);line-height:1.7;font-size:15px}
.fixguide-modal h2{margin:0 0 4px;font-size:20px}
.fixguide-modal .fg-sub{margin:0 0 var(--spacing-md);color:var(--text-secondary);font-size:14px}
.fixguide-step{display:flex;gap:12px;margin:14px 0}
.fixguide-num{flex:none;width:28px;height:28px;border-radius:50%;background:var(--accent-primary);color:var(--accent-text);display:flex;align-items:center;justify-content:center;font-weight:700}
.fixguide-step b{display:block}
.fixguide-step small{color:var(--text-secondary);font-size:13px}
.fixguide-prompt{margin:8px 0 0;padding:10px 12px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:8px;white-space:pre-wrap;font-size:13px;line-height:1.6;font-family:inherit}
.fixguide-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.fixguide-actions button,.fixguide-close{cursor:pointer;border-radius:8px;padding:8px 14px;border:1px solid var(--border-color);background:var(--bg-secondary);color:var(--text-primary);font-size:14px}
.fixguide-actions .fg-main{background:var(--accent-primary);color:var(--accent-text);border-color:var(--accent-primary);font-weight:600}
.fixguide-close{display:block;margin:var(--spacing-md) auto 0}
`;

export const FixGuide = {
    _bar: null,

    init() {
        const st = document.createElement('style');
        st.textContent = STYLE;
        document.head.appendChild(st);
        document.getElementById('btn-fixguide')?.addEventListener('click', () => this.open());
    },

    // 실행할 때마다 불리며, 처음 한 번만 안내 띠를 보여준다
    onRun() {
        if (document.body.classList.contains('view-mode')) return;
        try { if (localStorage.getItem(SEEN_KEY)) return; } catch { /* 저장소를 못 쓰면 매번 안 보여주는 쪽이 낫다 */ }
        const box = document.getElementById('preview-container') || document.querySelector('.preview-container');
        if (!box || this._bar?.isConnected) return;

        const bar = document.createElement('div');
        bar.className = 'fixguide-bar';
        bar.setAttribute('role', 'status');
        const msg = document.createElement('span');
        msg.textContent = '✏️ 마음에 안 드는 곳이 있나요? AI에게 고쳐 달라고 하는 방법을 알려 드려요.';
        const open = document.createElement('button');
        open.type = 'button';
        open.className = 'fixguide-open';
        open.textContent = '고치는 방법 보기';
        open.addEventListener('click', () => { this._dismiss(); this.open(); });
        const x = document.createElement('button');
        x.type = 'button';
        x.className = 'fixguide-x';
        x.setAttribute('aria-label', '안내 닫기');
        x.textContent = '×';
        x.addEventListener('click', () => this._dismiss());
        bar.append(msg, open, x);
        box.appendChild(bar);
        this._bar = bar;
    },

    _dismiss() {
        this._bar?.remove();
        this._bar = null;
        try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* 무시 */ }
    },

    _step(n, title, detail) {
        const row = document.createElement('div');
        row.className = 'fixguide-step';
        const num = document.createElement('div');
        num.className = 'fixguide-num';
        num.textContent = String(n);
        const body = document.createElement('div');
        const b = document.createElement('b');
        b.textContent = title;
        body.appendChild(b);
        if (detail) {
            const s = document.createElement('small');
            s.textContent = detail;
            body.appendChild(s);
        }
        row.append(num, body);
        return { row, body };
    },

    _btn(label, cls, onClick) {
        const b = document.createElement('button');
        b.type = 'button';
        if (cls) b.className = cls;
        b.textContent = label;
        b.addEventListener('click', () => onClick(b));
        return b;
    },

    open() {
        if (document.querySelector('.fixguide-overlay')) return;
        const overlay = document.createElement('div');
        overlay.className = 'fixguide-overlay';
        const modal = document.createElement('div');
        modal.className = 'fixguide-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');

        const h = document.createElement('h2');
        h.textContent = '✏️ AI가 만든 코드, 이렇게 고쳐요';
        const sub = document.createElement('p');
        sub.className = 'fg-sub';
        sub.textContent = '고치고 싶은 곳을 말로 적어서 AI에게 다시 부탁하면 돼요. 3단계예요.';
        modal.append(h, sub);

        // 1단계: 다운로드
        const s1 = this._step(1, '지금 코드를 파일로 내려받아요', '오른쪽 위 ⋯(더보기) → ⬇️ 다운로드를 누르면 전체 코드가 파일 하나로 저장돼요.');
        const a1 = document.createElement('div');
        a1.className = 'fixguide-actions';
        a1.appendChild(this._btn('⬇️ 지금 바로 다운로드', 'fg-main', () => document.getElementById('btn-download')?.click()));
        s1.body.appendChild(a1);

        // 2단계: Gemini에 첨부 + 지시문
        const s2 = this._step(2, 'Gemini에 파일을 붙이고, 아래 글을 보내요', 'Gemini 입력창의 + (또는 클립 모양) 버튼으로 방금 받은 파일을 붙여요. 그다음 아래 글을 복사해서 보내세요. 괄호 안에는 바꾸고 싶은 내용을 적어요.');
        const pre = document.createElement('pre');
        pre.className = 'fixguide-prompt';
        pre.textContent = PROMPT_TEXT;
        const a2 = document.createElement('div');
        a2.className = 'fixguide-actions';
        a2.appendChild(this._btn('📋 글 복사하기', 'fg-main', async (btn) => {
            try {
                await navigator.clipboard.writeText(PROMPT_TEXT);
                btn.textContent = '✅ 복사했어요';
            } catch {
                const r = document.createRange();
                r.selectNodeContents(pre);
                const sel = getSelection();
                sel.removeAllRanges();
                sel.addRange(r);
                btn.textContent = '글을 드래그로 골랐어요. Ctrl+C로 복사하세요';
            }
        }));
        s2.body.append(pre, a2);
        const alt = document.createElement('small');
        alt.textContent = '파일 붙이기가 안 되면, 파일을 열어 코드를 전부 복사한 뒤 위 글 아래에 붙여 넣어도 돼요.';
        s2.body.appendChild(alt);

        // 3단계: 다시 붙여넣기
        const s3 = this._step(3, 'Gemini가 준 새 코드를 여기에 붙여 넣어요', '새 코드를 복사해서 코드캔버스의 코드 칸(HTML)에 전체 선택(Ctrl+A) 후 붙여 넣고 ▶ 실행을 눌러요. 마음에 들 때까지 1~3단계를 반복해도 돼요.');

        const close = this._btn('알겠어요', 'fixguide-close', () => overlay.remove());
        modal.append(s1.row, s2.row, s3.row, close);
        overlay.appendChild(modal);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        const onKey = (e) => { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', onKey); } };
        document.addEventListener('keydown', onKey);
        document.body.appendChild(overlay);
    },
};

window.FixGuide = FixGuide;

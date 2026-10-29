// submit-anim.js - 클래스 제출 진행 상태(보내는 중 → 도착 / 실패)를 화면 가운데 카드로 보여준다
const CSS = `
.sa-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.45);animation:sa-fade .2s ease both}
.sa-card{width:min(360px,calc(100vw - 32px));background:#fff;color:#1e293b;border-radius:18px;padding:28px 24px 22px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.3)}
.sa-card.sa-ok{animation:sa-pop .5s cubic-bezier(.2,1.6,.4,1) both}
.sa-card.sa-err{animation:sa-shake .45s ease both}
.sa-icon{height:64px;display:flex;align-items:center;justify-content:center;margin-bottom:10px}
.sa-plane{display:inline-block;font-size:42px;animation:sa-fly 1.1s ease-in-out infinite}
.sa-title{font-size:17px;font-weight:700;margin:0 0 6px}
.sa-desc{font-size:13.5px;line-height:1.6;color:#64748b;margin:0}
.sa-ok .sa-title{color:#15803d}.sa-err .sa-title{color:#b91c1c}
.sa-check circle{fill:none;stroke:#22c55e;stroke-width:3;stroke-dasharray:101;stroke-dashoffset:101;animation:sa-draw .5s ease forwards}
.sa-check path{fill:none;stroke:#22c55e;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:30;stroke-dashoffset:30;animation:sa-draw .35s .4s ease forwards}
.sa-btns{display:flex;gap:8px;justify-content:center;margin-top:16px}
.sa-btn{border:1.5px solid #cbd5e1;background:#fff;color:#334155;border-radius:10px;padding:9px 16px;font-size:14px;font-weight:600;cursor:pointer}
.sa-btn.sa-main{background:#2563eb;border-color:#2563eb;color:#fff}
@keyframes sa-fade{from{opacity:0}to{opacity:1}}
@keyframes sa-fly{0%{transform:translate(-10px,6px) rotate(-8deg);opacity:.4}50%{transform:translate(10px,-6px) rotate(8deg);opacity:1}100%{transform:translate(-10px,6px) rotate(-8deg);opacity:.4}}
@keyframes sa-draw{to{stroke-dashoffset:0}}
@keyframes sa-pop{0%{transform:scale(.85);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes sa-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
@media (prefers-reduced-motion:reduce){.sa-overlay,.sa-card,.sa-plane,.sa-check circle,.sa-check path{animation:none!important;stroke-dashoffset:0!important}}`;

const CHECK = '<svg class="sa-check" viewBox="0 0 36 36" width="64" height="64"><circle cx="18" cy="18" r="16"/><path d="M10.5 18.5l5 5 10-11"/></svg>';
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let injected = false;
let overlay = null;

function inject() {
    if (injected) return;
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    injected = true;
}

function render(cls, icon, title, desc, buttons = []) {
    inject();
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sa-overlay';
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div class="sa-card ${cls}"><div class="sa-icon">${icon}</div>`
        + `<p class="sa-title">${esc(title)}</p><p class="sa-desc">${esc(desc)}</p>`
        + (buttons.length ? `<div class="sa-btns">${buttons.map((b, i) => `<button type="button" class="sa-btn ${b.main ? 'sa-main' : ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}</div>` : '')
        + '</div>';
    overlay.querySelectorAll('.sa-btn').forEach((el) => {
        el.onclick = () => buttons[Number(el.dataset.i)].onClick();
    });
}

function close() {
    overlay?.remove();
    overlay = null;
}

export const SubmitAnim = {
    // step: 'link'(링크 만드는 중) | 'send'(보내는 중)
    sending(step = 'send') {
        const text = step === 'link'
            ? ['링크를 만들고 있어요…', '내 앱을 누구나 볼 수 있는 링크로 바꾸는 중이에요.']
            : ['선생님께 보내는 중이에요…', '창을 닫지 마세요.'];
        render('sa-sending', '<span class="sa-plane">📨</span>', text[0], text[1]);
    },
    success(desc) {
        render('sa-ok', CHECK, '선생님께 도착했어요!', desc || '', [{ label: '확인', main: true, onClick: close }]);
    },
    error(message, onRetry) {
        render('sa-err', '<span style="font-size:42px">⚠️</span>', '제출하지 못했어요', message || '잠시 뒤 다시 시도해 주세요.', [
            { label: '닫기', onClick: close },
            { label: '다시 보내기', main: true, onClick: onRetry },
        ]);
    },
    // 보내는 중 화면이 너무 빨리 사라지지 않도록 최소 시간을 보장한다
    async minWait(startedAt, ms = 700) {
        const wait = ms - (Date.now() - startedAt);
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    },
    close,
};

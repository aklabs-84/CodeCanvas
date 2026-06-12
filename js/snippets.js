// snippets.js - 코드 스니펫 팔레트

const SNIPPETS = {
    html: [
        {
            icon: '📄',
            label: '기본 HTML5',
            desc: 'DOCTYPE 포함 기본 구조',
            code: `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>문서</title>
</head>
<body>

</body>
</html>`,
        },
        {
            icon: '💨',
            label: 'Tailwind CDN',
            desc: 'Tailwind CSS CDN 링크',
            code: `<script src="https://cdn.tailwindcss.com"><\/script>`,
        },
        {
            icon: '🅱️',
            label: 'Bootstrap CDN',
            desc: 'Bootstrap 5 CSS + JS',
            code: `<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"><\/script>`,
        },
        {
            icon: '🃏',
            label: '카드 레이아웃',
            desc: '기본 카드 컴포넌트',
            code: `<div class="card">
    <div class="card-header">제목</div>
    <div class="card-body">
        <p>내용을 입력하세요.</p>
    </div>
</div>`,
        },
        {
            icon: '📝',
            label: '폼 예제',
            desc: '기본 입력 폼',
            code: `<form id="my-form">
    <div>
        <label for="name">이름</label>
        <input type="text" id="name" name="name" placeholder="이름 입력" required>
    </div>
    <div>
        <label for="email">이메일</label>
        <input type="email" id="email" name="email" placeholder="이메일 입력" required>
    </div>
    <button type="submit">제출</button>
</form>`,
        },
    ],
    css: [
        {
            icon: '🔄',
            label: 'CSS 리셋',
            desc: '기본 margin/padding 제거',
            code: `*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}`,
        },
        {
            icon: '⬛',
            label: 'Flexbox 중앙 정렬',
            desc: '수평·수직 가운데 정렬',
            code: `.center {
    display: flex;
    justify-content: center;
    align-items: center;
}`,
        },
        {
            icon: '🔲',
            label: 'Grid 레이아웃',
            desc: '3열 반응형 그리드',
            code: `.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}`,
        },
        {
            icon: '✨',
            label: 'CSS 변수',
            desc: '컬러 시스템 변수 선언',
            code: `:root {
    --primary: #6366f1;
    --secondary: #8b5cf6;
    --text: #1e1e1e;
    --bg: #ffffff;
    --border: #e5e7eb;
    --radius: 8px;
}`,
        },
        {
            icon: '🎨',
            label: '버튼 스타일',
            desc: '기본 버튼 + hover 효과',
            code: `.btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background-color: var(--primary, #6366f1);
    color: white;
    border: none;
    border-radius: var(--radius, 6px);
    font-size: 14px;
    cursor: pointer;
    transition: opacity 0.2s;
}

.btn:hover { opacity: 0.85; }
.btn:active { opacity: 0.7; }`,
        },
    ],
    js: [
        {
            icon: '⚡',
            label: 'DOMContentLoaded',
            desc: 'DOM 로드 후 실행',
            code: `document.addEventListener('DOMContentLoaded', () => {
    // 여기에 코드 작성
});`,
        },
        {
            icon: '🌐',
            label: 'fetch 예제',
            desc: 'API 호출 기본 패턴',
            code: `async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fetch 오류:', error);
    }
}`,
        },
        {
            icon: '🖱️',
            label: '이벤트 위임',
            desc: '부모에서 자식 이벤트 처리',
            code: `document.querySelector('#list')?.addEventListener('click', (e) => {
    const item = e.target.closest('[data-id]');
    if (!item) return;
    console.log('클릭된 항목:', item.dataset.id);
});`,
        },
        {
            icon: '⏱️',
            label: 'Debounce',
            desc: '연속 호출 지연 실행',
            code: `function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}`,
        },
        {
            icon: '💾',
            label: 'LocalStorage 유틸',
            desc: '저장/불러오기/삭제 헬퍼',
            code: `const storage = {
    get: (key, fallback = null) => {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch { return fallback; }
    },
    set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    remove: (key) => localStorage.removeItem(key),
};`,
        },
    ],
};

export const SnippetManager = {
    init() {
        this._attachEventListeners();
    },

    _attachEventListeners() {
        const btnSnippet = document.getElementById('btn-snippet');
        const dropdown = document.getElementById('snippet-dropdown');
        if (!btnSnippet || !dropdown) return;

        // 버튼 클릭: 드롭다운 토글
        btnSnippet.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = dropdown.classList.contains('hidden');
            if (isHidden) {
                this._populateDropdown();
                dropdown.classList.remove('hidden');
            } else {
                dropdown.classList.add('hidden');
            }
        });

        // 바깥 클릭: 드롭다운 닫기
        document.addEventListener('click', (e) => {
            if (!document.getElementById('snippet-wrapper')?.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    },

    // 현재 탭에 맞는 스니펫으로 드롭다운 채우기
    _populateDropdown() {
        const dropdown = document.getElementById('snippet-dropdown');
        if (!dropdown) return;

        const currentMode = window.EditorManager?.currentMode ?? 'html';
        // unified 탭이면 html 스니펫으로 대체
        const lang = currentMode === 'unified' ? 'html' : currentMode;
        const items = SNIPPETS[lang] ?? [];

        dropdown.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'snippet-dropdown-header';
        header.textContent = `${lang.toUpperCase()} 스니펫`;
        dropdown.appendChild(header);

        if (items.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'padding:12px;text-align:center;color:var(--text-tertiary);font-size:12px;';
            empty.textContent = '사용 가능한 스니펫이 없습니다.';
            dropdown.appendChild(empty);
            return;
        }

        items.forEach(snippet => {
            const btn = document.createElement('button');
            btn.className = 'snippet-item';
            btn.innerHTML = `
                <span class="snippet-item-icon">${snippet.icon}</span>
                <span class="snippet-item-label">${snippet.label}</span>
                <span class="snippet-item-desc">${snippet.desc}</span>
            `;
            btn.addEventListener('click', () => {
                this._insertSnippet(lang, snippet.code);
                dropdown.classList.add('hidden');
            });
            dropdown.appendChild(btn);
        });
    },

    // Monaco 에디터 현재 커서 위치에 스니펫 삽입
    _insertSnippet(lang, code) {
        const em = window.EditorManager;
        if (!em) return;

        const targetLang = em.currentMode === 'unified' ? 'html' : em.currentMode;
        const editor = em.editors[targetLang];
        if (!editor) return;

        const selection = editor.getSelection();
        editor.executeEdits('snippet-insert', [{
            range: selection,
            text: code,
            forceMoveMarkers: true,
        }]);
        editor.focus();

        if (window.showSuccessNotification) {
            window.showSuccessNotification(`'${SNIPPETS[lang]?.find(s => s.code === code)?.label ?? '스니펫'}' 삽입 완료`);
        }
    },
};

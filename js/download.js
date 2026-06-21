// download.js - 코드 다운로드 모듈

export const DownloadManager = {
    init() {
        this.attachEventListeners();
    },

    attachEventListeners() {
        const btnDownload = document.getElementById('btn-download');
        btnDownload?.addEventListener('click', () => {
            this.downloadProject();
        });
    },

    downloadProject() {
        try {
            if (!window.EditorManager) {
                console.error('EditorManager not initialized');
                return;
            }

            const { html, css, js } = window.EditorManager.getCode();
            const projectTitle = document.getElementById('project-title')?.value || '새 프로젝트';
            const safeProjectTitle = this.sanitizeFilename(projectTitle);

            const unifiedHTML = this.buildUnifiedHTML(html, css, js, projectTitle);

            const blob = new Blob([unifiedHTML], { type: 'text/html;charset=utf-8' });
            this.downloadBlob(blob, `${safeProjectTitle}.html`);

            console.log('프로젝트 다운로드 완료');
        } catch (error) {
            console.error('Failed to download project:', error);
            alert('프로젝트 다운로드에 실패했습니다.');
        }
    },

    // HTML/CSS/JS를 하나의 HTML 파일로 통합
    // full document인 경우 <head> 전체를 보존 (CDN 스크립트 포함)
    buildUnifiedHTML(html, css, js, title) {
        const trimmed = html.trim();
        const isFullDoc = /^<!doctype\s/i.test(trimmed) || /^<html[\s>]/i.test(trimmed);

        if (isFullDoc) {
            try {
                const doc = new DOMParser().parseFromString(html, 'text/html');

                // 인라인 <style> 제거 (우리 CSS로 대체)
                doc.head.querySelectorAll('style').forEach(el => el.remove());

                // 타이틀 업데이트
                let titleEl = doc.head.querySelector('title');
                if (titleEl) {
                    titleEl.textContent = title || 'Document';
                } else {
                    titleEl = doc.createElement('title');
                    titleEl.textContent = title || 'Document';
                    doc.head.prepend(titleEl);
                }

                const headHTML = doc.head.innerHTML.trim();
                const bodyHTML = doc.body.innerHTML.trim();

                return `<!DOCTYPE html>
<html lang="ko">
<head>
${headHTML}
    <style>
${css}
    </style>
</head>
<body>
${bodyHTML}
    <script>
${js}
    <\/script>
</body>
</html>`;
            } catch {
                // 파싱 실패 시 아래 기본 템플릿으로 낙하
            }
        }

        // body 내용만 있는 경우
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'Document'}</title>
    <style>
${css}
    </style>
</head>
<body>
${html}
    <script>
${js}
    <\/script>
</body>
</html>`;
    },

    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-z0-9가-힣_-]/gi, '_')
            .replace(/_{2,}/g, '_')
            .substring(0, 100);
    },

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
};

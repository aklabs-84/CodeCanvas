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

            // CSS/JS 인라인 통합 HTML 가져오기
            const unifiedHTML = window.EditorManager._getUnifiedCode();

            const projectTitle = document.getElementById('project-title')?.value || '새 프로젝트';
            const safeProjectTitle = this.sanitizeFilename(projectTitle);

            const blob = new Blob([unifiedHTML], { type: 'text/html;charset=utf-8' });
            this.downloadBlob(blob, `${safeProjectTitle}.html`);

            console.log('프로젝트 다운로드 완료');
        } catch (error) {
            console.error('Failed to download project:', error);
            alert('프로젝트 다운로드에 실패했습니다.');
        }
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

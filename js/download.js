// download.js - 코드 다운로드 모듈

export const DownloadManager = {
    // 초기화
    init() {
        this.attachEventListeners();
    },

    // 이벤트 리스너
    attachEventListeners() {
        const btnDownload = document.getElementById('btn-download');
        btnDownload?.addEventListener('click', () => {
            this.downloadProject();
        });
    },

    // 프로젝트 다운로드
    async downloadProject() {
        try {
            // EditorManager에서 코드 가져오기
            const code = window.EditorManager?.getCode();
            if (!code) {
                console.error('EditorManager not initialized');
                return;
            }

            const { html, css, js } = code;

            // 프로젝트 제목 가져오기
            const projectTitle = document.getElementById('project-title')?.value || '새 프로젝트';
            const safeProjectTitle = this.sanitizeFilename(projectTitle);

            // ZIP 파일 생성
            const zip = new JSZip();

            // 개별 파일 추가
            zip.file('index.html', html);
            zip.file('style.css', css);
            zip.file('script.js', js);

            // 통합 HTML 파일 생성
            const unifiedHTML = this.createUnifiedHTML(html, css, js);
            zip.file('unified.html', unifiedHTML);

            // README 파일 추가
            const readme = this.createReadme(projectTitle);
            zip.file('README.md', readme);

            // ZIP 파일 생성 및 다운로드
            const blob = await zip.generateAsync({ type: 'blob' });
            this.downloadBlob(blob, `${safeProjectTitle}.zip`);

            console.log('프로젝트 다운로드 완료');
        } catch (error) {
            console.error('Failed to download project:', error);
            alert('프로젝트 다운로드에 실패했습니다.');
        }
    },

    // 통합 HTML 파일 생성
    createUnifiedHTML(html, css, js) {
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        ${css}
    </style>
</head>
<body>
    ${html}
    <script>
        ${js}
    </script>
</body>
</html>`;
    },

    // README 파일 생성
    createReadme(projectTitle) {
        return `# ${projectTitle}

CodeCanvas에서 생성된 프로젝트입니다.

## 파일 구조

- \`index.html\` - HTML 코드
- \`style.css\` - CSS 스타일
- \`script.js\` - JavaScript 코드
- \`unified.html\` - 통합 HTML 파일 (모든 코드가 하나의 파일에 포함)

## 사용 방법

### 개별 파일 사용
1. \`index.html\` 파일을 열어 다음과 같이 CSS와 JS를 연결하세요:
\`\`\`html
<link rel="stylesheet" href="style.css">
<script src="script.js"></script>
\`\`\`

### 통합 파일 사용
\`unified.html\` 파일을 바로 브라우저에서 열면 됩니다.

---
🎨 Created with [CodeCanvas](https://codecanvas.dev)
`;
    },

    // 파일명 안전하게 만들기
    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-z0-9가-힣_-]/gi, '_')
            .replace(/_{2,}/g, '_')
            .substring(0, 100);
    },

    // Blob 다운로드
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

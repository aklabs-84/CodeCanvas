# 🎨 CodeCanvas

웹 기반 코드 에디터 - HTML, CSS, JavaScript를 실시간으로 작성하고 미리보기할 수 있는 웹 애플리케이션

## ✨ 주요 기능

### 코드 편집
- **Ace Editor** 기반 문법 강조 및 자동완성
- HTML, CSS, JavaScript 개별 탭 또는 통합 에디터
- 실시간 코드 미리보기
- 콘솔 출력 캡처

### 레이아웃
- 세로/가로 레이아웃 전환 (Ctrl+L)
- 에디터/미리보기 접기/펼치기
- 에디터 전체화면 모드 (F10)
- 미리보기 전체화면 모드 (F11)
- 사이드바 접기/펼치기 (Ctrl+B)

### 프로젝트 관리
- 여러 프로젝트 저장 및 관리
- 로컬 스토리지를 통한 자동 저장
- 프로젝트 검색 및 정렬
- 리스트/갤러리 뷰 전환

### 다운로드
- HTML, CSS, JavaScript 개별 파일 다운로드
- 통합 HTML 파일 다운로드
- ZIP 파일로 압축하여 한 번에 다운로드

### 기타
- 다크/라이트 테마
- 키보드 단축키 지원
- 반응형 디자인

## 🚀 시작하기

### 로컬 실행

1. 저장소 클론
\`\`\`bash
git clone https://github.com/aklabs-84/CodeCanvas.git
cd CodeCanvas
\`\`\`

2. HTTP 서버 실행
\`\`\`bash
# Python 3
python3 -m http.server 5555

# Node.js
npx http-server -p 5555
\`\`\`

3. 브라우저에서 접속
\`\`\`
http://localhost:5555
\`\`\`

## ⌨️ 키보드 단축키

| 단축키 | 기능 |
|--------|------|
| Ctrl+B | 사이드바 토글 |
| Ctrl+L | 레이아웃 전환 (세로/가로) |
| Ctrl+E | 에디터 접기/펼치기 |
| Ctrl+P | 미리보기 접기/펼치기 |
| Ctrl+Enter | 코드 실행 |
| F10 | 에디터 전체화면 |
| F11 | 미리보기 전체화면 |
| ESC | 전체화면 닫기 |

## 📁 프로젝트 구조

\`\`\`
CodeCanvas/
├── index.html              # 메인 HTML
├── css/
│   ├── variables.css       # CSS 변수
│   ├── layout.css          # 레이아웃 스타일
│   ├── editor.css          # 에디터 스타일
│   ├── sidebar.css         # 사이드바 스타일
│   ├── panels.css          # 패널 스타일
│   ├── fullscreen.css      # 전체화면 스타일
│   └── responsive.css      # 반응형 스타일
└── js/
    ├── app.js              # 앱 초기화
    ├── layout.js           # 레이아웃 관리
    ├── theme.js            # 테마 관리
    ├── editor.js           # 에디터 관리
    ├── preview.js          # 미리보기 관리
    ├── projects.js         # 프로젝트 관리
    ├── sidebar.js          # 사이드바 관리
    ├── download.js         # 다운로드 관리
    ├── share.js            # 공유 관리
    └── auth.js             # 인증 관리
\`\`\`

## 🛠️ 기술 스택

- **프론트엔드**: Vanilla JavaScript (ES6 모듈)
- **에디터**: Ace Editor
- **압축**: JSZip
- **스토리지**: LocalStorage

## 📝 라이선스

MIT License

## 👨‍💻 개발자

Created by [aklabs-84](https://github.com/aklabs-84)

---

🎨 **CodeCanvas** - 코드를 그리듯 작성하세요!

# CodeCanvas - 웹 코드 에디터 프로젝트 문서

> 작성일: 2025년 12월 8일  
> 버전: 1.0

---

# 📋 PRD (Product Requirements Document)

## 1. 제품 개요

| 항목 | 내용 |
|------|------|
| **제품명** | CodeCanvas (코드캔버스) |
| **목적** | HTML, CSS, JavaScript 코드를 작성하고 실시간으로 결과를 확인하며, 프로젝트를 클라우드에 저장/관리/공유할 수 있는 웹 기반 코드 에디터 |
| **대상 사용자** | 웹 개발 학습자, 교육자, 프론트엔드 개발자 |
| **배포 환경** | GitHub + Vercel |

---

## 2. 핵심 기능 요구사항

### 2.1 코드 에디터 기능

| ID | 기능 | 설명 | 우선순위 |
|----|------|------|----------|
| F1.1 | 에디터 모드 전환 | 분리 모드(HTML/CSS/JS 각각) ↔ 통합 모드(단일 파일) 전환 | P0 |
| F1.2 | 구문 강조 | 언어별 코드 하이라이팅 (CodeMirror 6 사용) | P0 |
| F1.3 | 자동완성 | HTML 태그, CSS 속성, JS 함수 자동완성 | P0 |
| F1.4 | 코드 실행 | "실행" 버튼 클릭 시 iframe에 결과 렌더링 | P0 |
| F1.5 | 에디터 테마 | 다크/라이트 모드 전환 | P1 |

### 2.2 저장 및 동기화 기능

| ID | 기능 | 설명 | 우선순위 |
|----|------|------|----------|
| F2.1 | Google 로그인 | OAuth 2.0 기반 Google 계정 인증 | P0 |
| F2.2 | Google Drive 저장 | 프로젝트를 JSON 파일로 Google Drive 앱 폴더에 저장 | P0 |
| F2.3 | 자동 저장 | 변경사항 감지 후 30초 디바운스 자동 저장 | P1 |
| F2.4 | 버전 관리 | 최근 5개 버전 히스토리 유지 | P2 |

### 2.3 프로젝트 관리 기능

| ID | 기능 | 설명 | 우선순위 |
|----|------|------|----------|
| F3.1 | 리스트 뷰 | 프로젝트 목록을 테이블 형태로 표시 | P0 |
| F3.2 | 갤러리 뷰 | 썸네일 미리보기 카드 형태로 표시 | P0 |
| F3.3 | 썸네일 생성 | html2canvas로 실행 결과 캡처하여 저장 | P0 |
| F3.4 | 검색 | 제목, 설명, 태그 기반 검색 | P0 |
| F3.5 | 태그/카테고리 | 사용자 정의 태그 및 카테고리 분류 | P1 |
| F3.6 | 정렬 | 최신순, 이름순, 수정일순 정렬 | P1 |

### 2.4 공유 기능

| ID | 기능 | 설명 | 우선순위 |
|----|------|------|----------|
| F4.1 | 공유 링크 생성 | 고유 URL로 프로젝트 공유 | P0 |
| F4.2 | 공유 페이지 | 공유된 프로젝트 읽기 전용 뷰어 | P0 |
| F4.3 | 복제 기능 | 공유된 프로젝트를 내 계정으로 복제 | P1 |

### 2.5 레이아웃 제어 기능

| ID | 기능 | 설명 | 우선순위 |
|----|------|------|----------|
| F5.1 | 사이드바 토글 | 파일탐색기/프로젝트 목록 접기/펼치기 | P0 |
| F5.2 | 에디터/미리보기 레이아웃 전환 | 상하 ↔ 좌우 레이아웃 전환 | P0 |
| F5.3 | 에디터 패널 토글 | 에디터 영역 접기/펼치기 | P0 |
| F5.4 | 미리보기 패널 토글 | 미리보기 영역 접기/펼치기 | P0 |
| F5.5 | 전체화면 미리보기 | 미리보기를 전체화면 오버레이로 표시 | P0 |
| F5.6 | 레이아웃 기억 | 사용자의 레이아웃 설정을 localStorage에 저장 | P1 |
| F5.7 | 드래그 리사이즈 | 패널 경계를 드래그하여 크기 조절 | P2 |

---

## 3. 비기능 요구사항

| 항목 | 요구사항 |
|------|----------|
| **반응형** | 데스크톱, 태블릿, 모바일 지원 |
| **성능** | 100개 이상 프로젝트에서도 원활한 로딩 (페이지네이션/가상 스크롤) |
| **접근성** | 키보드 내비게이션 지원 |
| **보안** | Google OAuth만 사용, API 키 노출 방지 |

---

## 4. 화면 구성

### 4.1 기본 레이아웃

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🎨 CodeCanvas    [프로젝트명]    [저장] [실행] [공유] [레이아웃] [☀️/🌙] │
├─────────┬───────────────────────────────────────────────────────────────┤
│ [◀] 접기│  ┌─────────────────────────────────────────────────────────┐  │
│         │  │ [HTML] [CSS] [JS] [통합]              [접기 ▼] [레이아웃]│  │
│ 📁 파일 │  │                                                         │  │
│ 탐색기  │  │  <코드 에디터 영역>                                       │  │
│ ────────│  │                                                         │  │
│ 📋 내   │  ├─────────────────────────────────────────────────────────┤  │
│프로젝트 │  │ 미리보기                        [접기 ▲] [⛶ 전체화면]    │  │
│         │  │                                                         │  │
│ [리스트]│  │  <미리보기 결과 영역>                                     │  │
│ [갤러리]│  │                                                         │  │
│         │  └─────────────────────────────────────────────────────────┘  │
└─────────┴───────────────────────────────────────────────────────────────┘
```

### 4.2 레이아웃 변형 옵션

#### 사이드바 상태

```
[펼침 상태]              [접힘 상태]
┌──────────┐            ┌───┐
│ 📁 파일  │            │ 📁│
│ 탐색기   │     →      │ 📋│
│ ──────── │            │   │
│ 📋 내    │            └───┘
│ 프로젝트 │
└──────────┘
```

#### 에디터/미리보기 레이아웃

```
[상하 레이아웃]                    [좌우 레이아웃]
┌─────────────────┐               ┌────────┬────────┐
│   에디터        │               │        │        │
│                 │       →       │ 에디터 │ 미리   │
├─────────────────┤               │        │ 보기   │
│   미리보기      │               │        │        │
└─────────────────┘               └────────┴────────┘
```

#### 패널 접기/펼치기

```
[에디터만]           [미리보기만]         [전체화면 미리보기]
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│             │     │             │     │                 │
│   에디터    │     │   미리보기  │     │    미리보기     │
│    100%     │     │    100%     │     │  (오버레이)     │
│             │     │             │     │    [✕ 닫기]     │
└─────────────┘     └─────────────┘     └─────────────────┘
```

### 4.3 레이아웃 기능 요약

| 기능 | 조작 방법 | 단축키 |
|------|-----------|--------|
| 사이드바 토글 | ◀/▶ 버튼 클릭 | `Ctrl + B` |
| 레이아웃 전환 | 레이아웃 버튼 클릭 | `Ctrl + L` |
| 에디터 접기 | ▼ 버튼 클릭 | `Ctrl + E` |
| 미리보기 접기 | ▲ 버튼 클릭 | `Ctrl + P` |
| 전체화면 미리보기 | ⛶ 버튼 클릭 | `F11` 또는 `Ctrl + Enter` |
| 전체화면 닫기 | ✕ 버튼 또는 ESC | `ESC` |

---

# 🔧 TRD (Technical Requirements Document)

## 1. 기술 스택

| 영역 | 기술 | 선정 이유 |
|------|------|-----------|
| **프레임워크** | Vanilla JS + ES Modules | 빌드 도구 없이 Vercel 배포, 가벼움 |
| **코드 에디터** | CodeMirror 6 | 경량, 모바일 지원, 확장성 |
| **인증** | Google Identity Services | 간편한 OAuth 구현 |
| **저장소** | Google Drive API v3 | 무료, 대용량, 크로스 디바이스 |
| **썸네일 생성** | html2canvas | 클라이언트 사이드 스크린샷 |
| **스타일링** | CSS Variables + Flexbox/Grid | 테마 전환 용이, 반응형 |
| **배포** | Vercel | GitHub 연동, 무료, 빠른 배포 |

---

## 2. 데이터 구조

### 2.1 프로젝트 데이터 (JSON)

```javascript
{
  "id": "uuid-v4",
  "title": "프로젝트명",
  "description": "설명",
  "category": "학습",
  "tags": ["animation", "css"],
  "code": {
    "html": "<!DOCTYPE html>...",
    "css": "body { ... }",
    "js": "console.log('hello')"
  },
  "thumbnail": "base64 encoded image",
  "isPublic": false,
  "shareId": "abc123",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T12:30:00Z",
  "version": 1
}
```

### 2.2 Google Drive 저장 구조

```
Google Drive/
└── CodeCanvas/ (앱 전용 폴더)
    ├── index.json (프로젝트 메타데이터 인덱스)
    ├── projects/
    │   ├── {id1}.json
    │   ├── {id2}.json
    │   └── ...
    └── shared/
        └── {shareId}.json (공유용 복사본)
```

### 2.3 레이아웃 설정 (localStorage)

```javascript
{
  "layout": {
    "sidebarCollapsed": false,
    "sidebarWidth": 280,
    "orientation": "vertical",  // "vertical" | "horizontal"
    "editorCollapsed": false,
    "previewCollapsed": false,
    "editorRatio": 50,  // 에디터가 차지하는 비율 (%)
    "theme": "dark"
  }
}
```

---

## 3. API 엔드포인트 설계 (클라이언트 사이드)

| 기능 | Google Drive API 사용 |
|------|----------------------|
| 프로젝트 목록 조회 | `files.list` with appDataFolder |
| 프로젝트 저장 | `files.create` / `files.update` |
| 프로젝트 삭제 | `files.delete` |
| 공유 링크 생성 | `permissions.create` + `files.copy` |

---

## 4. 공유 기능 구현 방식

```
[공유 버튼 클릭]
    ↓
[프로젝트를 shared 폴더에 복사]
    ↓
[파일 권한을 "anyone with link"로 설정]
    ↓
[공유 URL 생성: https://codecanvas.vercel.app/view/{shareId}]
    ↓
[공유 페이지에서 fileId로 직접 조회]
```

---

## 5. 폴더 구조

```
codecanvas/
├── index.html              # 메인 에디터 페이지
├── view.html               # 공유 프로젝트 뷰어
├── css/
│   ├── variables.css       # CSS 변수 (테마)
│   ├── layout.css          # 레이아웃
│   ├── editor.css          # 에디터 스타일
│   ├── sidebar.css         # 사이드바 스타일
│   ├── panels.css          # 패널 토글/레이아웃 스타일
│   ├── fullscreen.css      # 전체화면 오버레이 스타일
│   └── responsive.css      # 반응형
├── js/
│   ├── app.js              # 앱 초기화
│   ├── auth.js             # Google 인증
│   ├── drive.js            # Google Drive API
│   ├── editor.js           # CodeMirror 초기화
│   ├── preview.js          # 미리보기 렌더링
│   ├── projects.js         # 프로젝트 CRUD
│   ├── sidebar.js          # 사이드바 UI
│   ├── share.js            # 공유 기능
│   ├── thumbnail.js        # 썸네일 생성
│   ├── theme.js            # 테마 전환
│   └── layout.js           # 레이아웃 제어 모듈
├── assets/
│   └── icons/
└── vercel.json             # Vercel 설정
```

---

## 6. 레이아웃 제어 구현 방식

```javascript
// layout.js 핵심 구조
const LayoutManager = {
  state: {
    sidebarCollapsed: false,
    orientation: 'vertical',
    editorCollapsed: false,
    previewCollapsed: false,
    fullscreenPreview: false
  },
  
  toggleSidebar() { ... },
  toggleOrientation() { ... },
  toggleEditor() { ... },
  togglePreview() { ... },
  openFullscreenPreview() { ... },
  closeFullscreenPreview() { ... },
  saveToLocalStorage() { ... },
  loadFromLocalStorage() { ... }
}
```

---

# ✅ TaskList (개발 작업 목록)

## Phase 1: 기초 환경 구축 (Day 1-2)

- [ ] **Task 1.1** - 프로젝트 폴더 구조 생성
- [ ] **Task 1.2** - index.html 기본 구조 작성
- [ ] **Task 1.3** - CSS 변수 및 테마 시스템 구축 (다크/라이트)
- [ ] **Task 1.4** - 기본 레이아웃 CSS 작성 (VS Code 스타일)
- [ ] **Task 1.5** - 반응형 CSS 작성

## Phase 2: 레이아웃 제어 시스템 구현 (Day 3)

- [ ] **Task 2.1** - 사이드바 접기/펼치기 기능 구현
- [ ] **Task 2.2** - 상하/좌우 레이아웃 전환 기능 구현
- [ ] **Task 2.3** - 에디터 패널 접기/펼치기 기능 구현
- [ ] **Task 2.4** - 미리보기 패널 접기/펼치기 기능 구현
- [ ] **Task 2.5** - 전체화면 미리보기 오버레이 구현
- [ ] **Task 2.6** - 레이아웃 설정 localStorage 저장/불러오기

## Phase 3: 코드 에디터 구현 (Day 4-5)

- [ ] **Task 3.1** - CodeMirror 6 설치 및 초기화
- [ ] **Task 3.2** - HTML/CSS/JS 언어 지원 설정
- [ ] **Task 3.3** - 자동완성 기능 구현
- [ ] **Task 3.4** - 분리/통합 모드 전환 UI 구현
- [ ] **Task 3.5** - 에디터 테마 연동 (다크/라이트)

## Phase 4: 미리보기 기능 구현 (Day 6)

- [ ] **Task 4.1** - iframe 기반 미리보기 영역 구현
- [ ] **Task 4.2** - "실행" 버튼 클릭 시 코드 결합 및 렌더링
- [ ] **Task 4.3** - 콘솔 출력 캡처 및 표시
- [ ] **Task 4.4** - html2canvas로 썸네일 생성 기능

## Phase 5: Google 인증 및 Drive 연동 (Day 7-8)

- [ ] **Task 5.1** - Google Cloud Console 프로젝트 설정
- [ ] **Task 5.2** - OAuth 2.0 클라이언트 설정
- [ ] **Task 5.3** - Google Identity Services 연동
- [ ] **Task 5.4** - 로그인/로그아웃 UI 구현
- [ ] **Task 5.5** - Google Drive API 초기화
- [ ] **Task 5.6** - 앱 전용 폴더 생성 로직

## Phase 6: 프로젝트 CRUD 기능 (Day 9-10)

- [ ] **Task 6.1** - 새 프로젝트 생성 기능
- [ ] **Task 6.2** - 프로젝트 저장 기능 (Drive 업로드)
- [ ] **Task 6.3** - 프로젝트 목록 조회 기능
- [ ] **Task 6.4** - 프로젝트 불러오기 기능
- [ ] **Task 6.5** - 프로젝트 삭제 기능
- [ ] **Task 6.6** - 자동 저장 기능 (디바운스)

## Phase 7: 사이드바 및 프로젝트 관리 UI (Day 11-12)

- [ ] **Task 7.1** - 사이드바 레이아웃 구현
- [ ] **Task 7.2** - 리스트 뷰 구현
- [ ] **Task 7.3** - 갤러리 뷰 구현 (썸네일 표시)
- [ ] **Task 7.4** - 뷰 전환 토글 버튼
- [ ] **Task 7.5** - 검색 기능 구현
- [ ] **Task 7.6** - 태그/카테고리 필터 구현
- [ ] **Task 7.7** - 정렬 옵션 구현

## Phase 8: 공유 기능 구현 (Day 13-14)

- [ ] **Task 8.1** - 공유 버튼 및 모달 UI
- [ ] **Task 8.2** - 공유용 파일 복사 및 권한 설정
- [ ] **Task 8.3** - 공유 링크 생성 및 복사
- [ ] **Task 8.4** - view.html 공유 뷰어 페이지 구현
- [ ] **Task 8.5** - 공유 프로젝트 복제 기능

## Phase 9: 마무리 및 배포 (Day 15)

- [ ] **Task 9.1** - 전체 기능 통합 테스트
- [ ] **Task 9.2** - 모바일 반응형 테스트 및 수정
- [ ] **Task 9.3** - 에러 핸들링 및 로딩 상태 UI
- [ ] **Task 9.4** - GitHub 레포지토리 설정
- [ ] **Task 9.5** - Vercel 배포 및 도메인 연결
- [ ] **Task 9.6** - Google OAuth redirect URI 업데이트

---

# 📊 개발 일정 요약

| Phase | 내용 | 기간 | 일수 |
|-------|------|------|------|
| Phase 1 | 기초 환경 구축 | Day 1-2 | 2일 |
| Phase 2 | 레이아웃 제어 시스템 | Day 3 | 1일 |
| Phase 3 | 코드 에디터 구현 | Day 4-5 | 2일 |
| Phase 4 | 미리보기 기능 | Day 6 | 1일 |
| Phase 5 | Google 인증 및 Drive | Day 7-8 | 2일 |
| Phase 6 | 프로젝트 CRUD | Day 9-10 | 2일 |
| Phase 7 | 사이드바 및 관리 UI | Day 11-12 | 2일 |
| Phase 8 | 공유 기능 | Day 13-14 | 2일 |
| Phase 9 | 마무리 및 배포 | Day 15 | 1일 |
| **합계** | | | **15일** |

---

# 📝 참고 사항

## Google Cloud Console 설정 가이드

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성
3. OAuth 동의 화면 설정
4. OAuth 2.0 클라이언트 ID 생성
5. Google Drive API 활성화
6. 승인된 리디렉션 URI 추가:
   - 개발: `http://localhost:3000`
   - 프로덕션: `https://your-app.vercel.app`

## 주요 외부 라이브러리

- **CodeMirror 6**: https://codemirror.net/
- **html2canvas**: https://html2canvas.hertzen.com/
- **Google Identity Services**: https://developers.google.com/identity

---

> 문서 끝

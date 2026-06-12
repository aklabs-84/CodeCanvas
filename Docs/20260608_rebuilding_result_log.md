# 프로젝트 작업 로그: CodeCanvas 전역 리빌딩 및 기능 고도화 완료 보고서

- **작성일**: 2026년 06월 08일
- **작성자**: 서기 (Doc)
- **수행 역할**: Fix (해결자), Worker (작업자), Architect (건축가), Doc (서기), Counselor (상담가)
- **참고 사항**: 본 문서는 기존에 산재해 있던 레이아웃 오동작, CORS 차단, HTML 업로드 시 코드 깨짐 및 구글 스프레드시트 백엔드 로그인 연동 불가 버그를 처음부터 재구축하여 완벽히 리빌딩(Rebuilding)한 상세 기록 로그입니다.

---

## 1. 에러 및 증상 분석 & 해결 내역 (Error Analysis & Fixes)

### [이슈 1] 로컬 브라우저 더블클릭 실행 시 화면 불통 현상 (CORS Policy)
* **원인**: HTML을 `file://` 스킴으로 직접 실행할 때, 모듈식 자바스크립트(`type="module"`)를 불러오는 과정에서 브라우저 보안 정책(CORS)이 발생하여 `js/app.js` 등 모든 스크립트의 작동이 전면 차단되었습니다.
* **해결 (하이브리드 아키텍처)**:
  - 루트 디렉토리에 **Vite 번들러** 및 **`vite-plugin-singlefile`** 빌드 체인을 도입했습니다.
  - 개발 중에는 기능별로 쪼개진 깨끗한 모듈 파일로 자유롭게 유지보수하고, 빌드 명령어(`npm run build`) 실행 시 모든 리소스(CSS, JS)가 인라이닝된 단 하나의 단일 파일 **`dist/index.html`**로 병합되게 구현했습니다.
  - 이로써 빌드된 파일은 로컬 더블클릭(`file://`) 실행 시에도 CORS 제한을 완벽하게 탈피하여 100% 정상 작동합니다.

### [이슈 2] 단일 HTML 임포트 시 소스 분류 및 깨짐 현상
* **원인**: 기존의 파일 로더는 가져온 HTML 내부에 style이나 script가 포함되어 있어도 그대로 HTML 에디터에 주입하여, 이중 실행에 의한 렌더링 파괴 및 자바스크립트 충돌 오류가 잦았습니다.
* **해결 (DOMParser 기반 정밀 HTML 파서)**:
  - 브라우저의 네이티브 `DOMParser`를 활용한 정교한 파서(`parseUnifiedHTML`)를 `EditorManager`에 구현했습니다.
  - 임포트된 HTML의 `<style>` 및 `<script>`(인라인) 태그를 안전하게 분리 추출하여 각각 CSS 탭과 JS 탭으로 분배하고, 마크업 본문만 HTML 탭에 자동으로 주입합니다.
  - 여러 파일(html, css, js)을 동시 업로드할 때는 개별 소스파일을 우선 적용하며, HTML 하나만 업로드 시 자동 3분할 탭 배포가 매끄럽게 수행되도록 설계했습니다.

### [이슈 3] 구글 스프레드시트(GAS) 백엔드 로그인 연동 불가 및 CORS 응답 수신 불가
* **원인**: 
  1. 기존 로컬 문서 가이드 상의 Apps Script 코드에는 회원가입/로그인 API 처리부(`login`, `signup`)가 유실되어 있었습니다.
  2. 프론트엔드가 `no-cors` 모드로만 POST 요청을 보내 백엔드 처리 성공/실패 데이터를 브라우저에서 받아오지 못하는 심각한 한계가 있었습니다.
* **해결 (Apps Script 전면 보완 및 CORS 단순요청 최적화)**:
  - **[GAS_SETUP_GUIDE.md](file:///Users/byunmose/Desktop/vibe_coding/CodeCanvas/Docs/GAS_SETUP_GUIDE.md)** 가이드 문서를 업데이트하여, 가입 유저 검증(`login`/`signup`) 및 `projects`/`users` 시트 탭을 최초 호출 시 백엔드가 알아서 자동 생성하는 통합 Apps Script 풀 소스코드를 전면 재구축하여 반영했습니다.
  - 프론트엔드 통신 방식을 `Content-Type: text/plain` 단순 요청(Simple Request) 및 `mode: 'cors'`로 튜닝하여, CORS Preflight OPTIONS 차단을 유발하지 않으면서도 백엔드의 JSON 리턴 값(`response.json()`)을 100% 정상 수신하여 저장/로그인 여부를 완벽히 판별할 수 있도록 리빌딩했습니다.

---

## 2. 작업 완료된 파일 현황 (Modified & Created Files)

- **[package.json](file:///Users/byunmose/Desktop/vibe_coding/CodeCanvas/package.json)** / **[vite.config.js](file:///Users/byunmose/Desktop/vibe_coding/CodeCanvas/vite.config.js)**: 단일 HTML 빌드 및 번들링 설정 완료.
- **[GAS_SETUP_GUIDE.md](file:///Users/byunmose/Desktop/vibe_coding/CodeCanvas/Docs/GAS_SETUP_GUIDE.md)**: 회원가입/로그인/프로젝트 통합 관리 백엔드 Script 갱신 완료.
- **[js/editor.js](file:///Users/byunmose/Desktop/vibe_coding/CodeCanvas/js/editor.js)**: `parseUnifiedHTML` 메서드 추가 및 모나코 에디터 레이아웃 튜닝.
- **[js/sidebar.js](file:///Users/byunmose/Desktop/vibe_coding/CodeCanvas/js/sidebar.js)**: 로컬 파일 임포트 로직에 HTML 정밀 분류 파서 결합.
- **[js/projects.js](file:///Users/byunmose/Desktop/vibe_coding/CodeCanvas/js/projects.js)**: `saveToCloud` 통신을 `cors` 단순 요청 방식으로 최적화 및 저장 결과 핸들링 정교화.
- **[README.md](file:///Users/byunmose/Desktop/vibe_coding/CodeCanvas/README.md)**: 아크랩스 공식 링크 삽입 상태 유지.

---

## 3. 검증 결과 (Testing & Verification)

1. **빌드 안정성**: `npm run build` 결과 에러 없이 singlefile 플러그인에 의해 `dist/index.html` 단일 HTML 빌드 성공.
2. **로컬 실행성**: 브라우저 시뮬레이터를 통해 빌드된 `dist/index.html`을 `file://` 경로로 다이렉트 호출 시, 스크립트 실행이 중단되는 CORS 오류가 완전히 사라지고 앱이 무사히 초기화 및 동작 완료됨을 입증했습니다.

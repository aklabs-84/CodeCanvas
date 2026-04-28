# 작업 로그: 구글 스프레드시트 연동 및 프로젝트 공유 기능 구현

**날짜:** 2026-04-28
**담당:** 서기 (Scribe), 건축가 (Architect), 작업자 (Worker)

## 1. 개요
CodeCanvas 프로젝트를 구글 스프레드시트와 연동하여 영구 저장소로 활용하고, 프로젝트별 고유 공유 링크를 생성하여 미리보기 기능을 구현함. GitHub Pages 배포 환경에서도 정상 동작하도록 설계됨.

## 2. 주요 작업 내용
### 2.1. 인프라 구축 (계획)
- **Backend:** Google Apps Script (GAS)
- **Storage:** Google Sheets
- **Frontend Sync:** `fetch` API를 이용한 비동기 데이터 송수신

### 2.2. 프론트엔드 수정 사항
- `js/config.js`: GAS API URL 관리용 설정 파일 추가.
- `js/projects.js`: 클라우드 저장 (`saveToCloud`) 및 로드 (`loadFromCloud`) 메서드 추가.
- `js/share.js`: 프로젝트 저장 후 공유 링크 생성 로직 구현.
- `js/app.js`: URL 파라미터(`?p=ID`) 감지 및 초기 로드 로직 추가.

## 3. 진행 상황
- [x] 구현 계획 수립 및 사용자 승인
- [x] `js/config.js` 생성
- [x] `js/projects.js` 수정
- [x] `js/share.js` 수정
- [x] `js/app.js` 수정
- [x] `Docs/GAS_SETUP_GUIDE.md` 작성 (가이드 제공)
- [ ] (사용자 작업) GAS 배포 및 URL 설정

---
*참고: 아크랩스 홈페이지 (https://litt.ly/aklabs)*

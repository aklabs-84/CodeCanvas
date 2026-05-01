# 작업 로그: 2026-04-30 미리보기 엔진 고도화 및 그래프 이슈 해결

## 1. 개요
`CodeCanvas` 미리보기 환경에서 Chart.js 등 외부 라이브러리 로드 시 발생하는 타이밍 이슈와 렌더링 오류를 해결하기 위한 엔진 전면 수리 작업.

## 2. 문제점 (Error Analysis)
- **현상 1**: 콘솔에 `ReferenceError: Chart is not defined` 발생.
- **현상 2**: 수리 과정 중 엔진 실행 시점 오류로 인해 화면이 공백(Blank)으로 출력됨.
- **원인**: 
    - 외부 스크립트 로드와 사용자 코드 실행 간의 동기화 부족.
    - 엔진 코드가 DOM 요소(Template, Root) 생성 전 `<head>`에서 실행됨.

## 3. 해결 내역 (Fix & Implementation)
### [수리 1] 엔진 실행 아키텍처 변경
- 엔진 실행 스크립트를 `<body>` 최하단으로 이동하여 DOM 가용성 확보.
- `if (!template || !root) return;` 예외 처리를 강화하여 안정성 증대.

### [수리 2] 견고한 리소스 로딩 시스템 (`loadScripts`)
- 모든 `<script src="...">`를 순차적으로 `await` 처리.
- 라이브러리 내부 초기화 시간을 벌어주기 위해 `setTimeout(resolve, 20)` 지연 도입.
- 외부 스크립트와 인라인 스크립트의 실행 순서 엄격히 준수.

### [구현 3] 렌더링 타이밍 최적화
- `requestAnimationFrame`을 사용하여 브라우저가 화면 레이아웃(Painting)을 마친 후 사용자 JS를 실행.
- 이를 통해 Canvas 크기 계산 오류 등으로 인한 그래프 미출력 문제 해결.

## 4. 시각적 완성도 (UI/UX Polish)
- **Bento Grid**: 정보를 박스 형태로 배치하는 최신 레이아웃 제안.
- **Glassmorphism 2.0**: `backdrop-filter`와 미세한 보더를 활용한 세련된 레이어 디자인 적용.

## 5. 결론 및 향후 계획
이번 수리를 통해 `CodeCanvas`는 높은 수준의 라이브러리 호환성을 갖게 되었습니다. 향후 다양한 API 연동 시에도 동일한 엔진 로직이 안정성을 보장할 것입니다.

---
**작업자**: Antigravity (Solver/Scribe)
**관련 파일**: `js/preview.js`
**아크랩스 홈페이지**: https://litt.ly/aklabs

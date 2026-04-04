# 작업 로그: 2026-04-04 미리보기 창(Iframe)에서 다운로드 불가 오류 해결

## 개요
- **에러/요구사항**: 사용자가 에디터에 작성한 코드(예: 화면 캡처, PDF 생성, 데이터 다운로드 등) 안의 작동 버튼을 클릭했을 때, 실제 브라우저로 다운로드가 이루어지지 않고 막히는 현상.
- **원인 분석**: 작성된 코드를 렌더링하는 `preview-frame` 및 `fullscreen-frame` `iframe` 태그 내에 `sandbox` 속성이 선언되어 있는데, 여기에 `allow-downloads` 권한이 명시되어 있지 않아 보안 상의 이유로 브라우저가 다운로드를 차단한 것.

## 구현 및 해결 내용
1. **대상 파일**: `index.html`
2. **수정 내용**: `iframe` 태그의 `sandbox` 영역에 다운로드와 팝업 호환을 위한 속성을 추가함.
   - 변경 전: `sandbox="allow-scripts allow-same-origin allow-forms"`
   - 변경 후: `sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups"`

## 기대 효과
이제 코드 캔버스 미리보기 화면 안에서 "blob url", "data uri" 또는 외부 링크 기반의 파일 다운로드 스크립트가 실행될 때 차단되지 않고 실제 브라우저에서 다운로드 절차가 정상 진행됨.

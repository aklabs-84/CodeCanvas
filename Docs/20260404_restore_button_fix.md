# 작업 로그: 2026-04-04 패널 복구 버튼 화면 미노출 오류 해결

## 개요
- **에러/요구사항**: 코드 에디터를 토글하여 왼쪽으로 숨겼으나, 해당 에디터를 다시 펼칠 수 있게 해주는 복구(펼치기) 버튼이 화면상에 전혀 나타나지 않아 돌아갈 수 없는 문제.
- **원인 분석**: 
  - `css/panels.css`에서 해당 복구 버튼들의 기본 속성을 `display: none;`으로 숨김 처리해 둠.
  - 자바스크립트 코드 구동부(`js/layout.js`)에서 에디터 패널이 숨겨졌을 때 복구 버튼을 보여주려 시도함. 그러나 당시 `style.display` 속성값을 빈 문자열 `''` 로 지정함에 따라 초기화가 일어났고, 브라우저가 CSS에 설정된 기본값(`display: none`)을 다시 적용해버려 투명인간처럼 남아있게 되었음.

## 구현 및 변경 사항
1. **대상 파일**: `js/layout.js`
2. **수정 방식**: 복구 버튼 속성이 자바스크립트 내에서 활성화될 때 CSS의 `display: none`을 덮어 씌우며 화면에 나타나야 하므로, 자바스크립트 제어 속성을 레이아웃에 맞는 `flex`값으로 하드코딩 변경.
   - 수정 1: 에디터 복구 버튼 (`btnEditorRestore.style.display = state.editorCollapsed ? 'flex' : 'none';`)
   - 수정 2: 미리보기 복구 버튼 (`btnPreviewRestore.style.display = state.previewCollapsed ? 'flex' : 'none';`)
   - 수정 3: 콘솔 복구 버튼 (`btnConsoleRestore.style.display = state.consoleCollapsed ? 'flex' : 'none';`)

## 결과 및 특이사항
- 추가 오류 없이 세 개의 버튼 모두 패널이 접혔을 때 정상적으로 나타남. 버튼의 CSS 정렬 속성(`align-items`, `justify-content` 등)이 제대로 맞게 렌더링되도록 `block`이 아닌 `flex`를 부여하여 디자인도 깨짐 없이 유지됨.

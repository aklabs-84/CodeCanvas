# 작업 로그: 2026-04-04 패널 크기 조절 리사이즈 핸들 기능 구현

## 개요
- **목적**: 사용자가 코드 에디터 화면과 우측 미리보기 화면 사이의 경계선을 드래그하여 원하는 비율로 창 크기를 조절할 수 있는 기능을 추가함.
- **사전 상황**: CSS 상에는 마우스 커서 등 관련 디자인(`.resize-handle`)이 준비되어 있었으나, 실제 마우스를 잡고 제어할 DOM 요소와 자바스크립트 로직이 부재한 상태였음.

## 동작 구현 내역
1. **HTML 수정**: `index.html`
   - `editor-section`과 `preview-section` 사이 간격에 마우스 드래그를 감지할 `div.resize-handle` 엘리먼트를 새로 삽입함 (`id="editor-resizer"`).
2. **자바스크립트(`js/layout.js`) 마우스 로직 추가**
   - **Mousedown**: 사용자가 분할선을 클릭했을 때 드래그 가능 상태(`isDragging`)를 활성화하고 불필요한 iframe 내부 클릭을 막기 위해 `previewFrame`의 `pointer-events` 속성을 `none`으로 설정함.
   - **MouseMove**: 마우스 방향을 추적해 `main-content` 전체 크기 대비 마우스의 X 위치(또는 세로의 경우 Y 위치)로 백분율(Ratio)을 계산. 너무 좁아지거나 커지는 것을 방지하기 위해 최소 20% ~ 최대 80% 구간 내에서만 비율이 맞춰지도록 제한(Limit) 처리함.
   - **MouseUp**: 마우스를 놓았을 때 드래그 상태를 해제하고 현재 비율을 `state.editorRatio` 에 저장 및 `localStorage` 에 갱신함으로써 새로고침 후에도 유지되도록 처리.
   - **가로/세로 레이아웃 대응**: `applyState()` 함수에서 현재 레이아웃 모드(`orientation`)가 `horizontal`인지 `vertical`인지 판별해 각각 분할선의 모양도 최적화되도록 클래스를 동적 할당함.

## 특이사항
- 패널이 닫혀있는(collapse) 경우엔 중간의 구분선 디자인 자체가 불필요하므로 사라지도록(`display: none`) 처리하여 미관상의 깨짐을 확실하게 방지함.

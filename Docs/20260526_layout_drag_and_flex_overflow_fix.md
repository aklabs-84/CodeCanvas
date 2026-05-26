# 프로젝트 작업 로그: 에디터/미리보기 드래그 비율 조절 및 영역 잘림 버그 해결 (추가 보완본)

- **작성일**: 2026년 05월 26일
- **작성자**: 서기 (Doc)
- **수행 역할**: Fix (해결자), Worker (작업자), Architect (건축가), Doc (서기)
- **참고 사항**: 본 문서는 향후 레이아웃 제어 모듈 유지보수 및 리팩토링 시 참고를 위해 상세히 기록된 작업 로그입니다.

---

## 1. 에러 및 증상 분석 (Errors & Symptoms)

### [현상 1] 드래그 리사이징 지연 및 경계선 튕김 현상
*   **증상**: 에디터와 미리보기 창의 중간 경계선(#editor-resizer)을 마우스로 잡고 드래그하여 조절할 때, 창 크기가 마우스 이동에 즉각 반응하지 않고 부자연스럽게 느리게(지연되어) 따라옵니다. 이로 인해 마우스 포인터와 경계선 위치가 크게 어긋나며, 마우스가 iframe 미리보기 영역 내부로 빨려 들어가는 순간 마우스 포인터 이벤트를 잃고 드래그가 끊어지거나 강제로 튀어버리는 등 정상적인 레이아웃 크기 조절이 불가능했습니다.
*   **기술적 원인**: `.editor-section`과 `.preview-section`에 전역으로 선언되어 있던 `transition: all var(--transition-normal);` 효과 때문이었습니다. 드래그 조절 과정에서 마우스 무브에 맞춰 JS가 `flex` 비율 속성을 초당 수십 회 실시간 갱신하고 있음에도, CSS transition 전환 효과로 인해 창의 크기가 서서히 갱신되면서 마우스를 부드럽게 쫓아가지 못하고 지연 현상을 유발했습니다.

### [현상 2] 드래그 시 미리보기 영역 우측 밀림 및 잘림 현상
*   **증상**: 드래그 리사이징을 진행할 때, 미리보기 창 내부 우측 영역이나 우측 스크롤바가 웹 브라우저 바깥쪽으로 완전히 밀려나 보이지 않고 잘려서 렌더링되는 기괴한 동작을 보였습니다.
*   **기술적 원인**: `layout.js`에서 두 영역의 비율 크기의 합을 강제로 딱 `100%` (`editorFlexPercent%` + `100 - editorFlexPercent%`)로 할당하고 있었습니다. 하지만 그 사이에 실존하는 물리적 드래그 구분선인 `#editor-resizer` (너비 `4px`)의 너비를 가산하지 않았기 때문에, 실제 두 섹션과 리사이저의 점유 비율 합은 `100% + 4px`이 되어 부모 컨테이너(100%) 너비를 확실히 초과했습니다. `flex-shrink: 0` 속성 때문에 어느 영역도 수축하지 않아 우측의 미리보기 영역 전체가 4px 만큼 화면 밖으로 넘치며 잘리는 레이아웃 파괴 현상이 발생했습니다.

### [현상 3] **[추가 보완]** 에디터 왼쪽 드래그 먹통 및 끊김 현상
*   **증상**: 에디터/미리보기 창의 구분선을 잡고 오른쪽으로 드래그할 때는 부드럽게 잘 늘어나지만, **왼쪽으로 조금만 마우스를 빠르게 움직여 조절하고자 하면 드래그 반응이 뚝 끊기면서 에디터 영역이 줄어들지 않는 현상**이 관찰되었습니다.
*   **기술적 원인**: 마우스가 왼쪽 영역인 **에디터 영역(Monaco Editor)** 위를 지날 때 발생했습니다. 마우스 드래그 이동 중에 포인터가 4px 두께의 리사이저 경계를 미세하게 벗어나 에디터 컨테이너로 이동하는 순간, **Monaco 에디터 자체 내부의 정교한 텍스트 선택, 스크롤바 감지, 커서 포커싱 마우스 이벤트 핸들러가 드래그 이벤트를 중간에서 가로채고 삼켜(stopPropagation) 버렸기 때문**입니다. 이로 인해 document 레벨의 mousemove 리스너로 이벤트가 안전하게 전파되지 못해 드래그 흐름이 깨지고 작동하지 않는 오동작이 일어났습니다.

---

## 2. 해결 방안 및 논리 (Resolution & Logic)

### [해결 1] 드래그 실시간 반응성 회복 (CSS Transition 해제)
*   **논리**: 마우스 드래그 조절이 활성화되었을 때(body에 `.resizing` 또는 `.resizing-vertical` 클래스가 추가된 상태), 에디터와 미리보기 섹션의 transition 속성을 강제로 꺼서(`transition: none !important;`) 마우스 커서의 조절값을 브라우저가 화면에 지연 시간 없이 60FPS로 즉시 강제 갱신하게 만듭니다.
*   **결과**: 마우스 커서를 완전히 1:1로 리얼타임하게 경계선이 쫓아오게 되어, 마우스 튕김과 끊김 현상이 완전히 해소되었습니다.

### [해결 2] 유연한 Flexbox 레이아웃 분배 (Auto Width Filling)
*   **논리**: 좌측 에디터 섹션에만 마우스가 드래그한 비율 크기(`editorFlexPercent%`)를 직관적으로 부여하고, 우측 미리보기 섹션에는 고정 퍼센트(`100 - editorFlexPercent%`)를 계산하여 직접 주는 대신 **`flex: 1 1 0%`**를 부여합니다.
*   **결과**: 리사이저 너비인 4px이 중간에 안정적으로 공간을 점유하고, 에디터가 지정된 퍼센트를 먹은 후, 미리보기 영역은 리사이저 너비를 제외하고 남은 모든 남은 여백을 자동으로 안전하게 꽉 채우도록(Fill) 만듭니다. 이를 통해 전체 화면 점유율의 합이 100%를 초과하지 않고 정밀하게 매핑되므로 잘림 현상이 원천 해방되었습니다.

### [해결 3] **[추가 보완]** 드래그 중 에디터 마우스 이벤트 가로채기 방어 (Pointer-events None)
*   **논리**: 드래그가 시작되어 `body.resizing` 또는 `body.resizing-vertical` 상태가 되었을 때, 우측 iframe에 부여하던 것과 동일하게 **좌측 에디터 영역전체(`.editor-container`, `.editor-pane`)에도 `pointer-events: none !important;` 속성을 동적으로 적용**합니다.
*   **결과**: 드래그 작동 중에는 마우스 커서가 에디터 영역을 아무리 가로질러가도 Monaco 에디터 내부의 스크립트 핸들러가 이를 철저히 무시하게 되어, 이벤트가 부모 document 단으로 100% 손실 없이 전파됩니다. 이로 인해 **왼쪽이든 오른쪽이든 방향에 관계없이 자석처럼 완벽하게 부드러운 양방향 드래그**가 가능해졌습니다. (드래그를 끝마쳐 마우스를 떼는 순간 포인터 차단이 자연스럽게 즉시 복구되므로 에디터 편집 동작에는 하등의 영향을 미치지 않습니다.)

---

## 3. 수정 파일 및 구체적 변경 내용 (Modified Files & Diffs)

### ① [panels.css](file:///Users/byunmose/Desktop/vibe_coding/CodeCanvas/css/panels.css)
드래그 중인 resizing 상태일 때 두 섹션의 transition 효과를 0으로 강제하고, 에디터 영역의 pointer-events를 무력화하는 CSS 추가.

```diff
  /* 드래그 중에는 실시간 크기 반영을 위해 transition을 일시 비활성화 */
  body.resizing .editor-section,
  body.resizing .preview-section,
  body.resizing-vertical .editor-section,
  body.resizing-vertical .preview-section {
      transition: none !important;
  }
+ 
+ /* 드래그 중 에디터의 이벤트 삼킴 현상 원천 차단 (왼쪽 드래그 먹통 해결) */
+ body.resizing .editor-container,
+ body.resizing .editor-pane,
+ body.resizing-vertical .editor-container,
+ body.resizing-vertical .editor-pane {
+     pointer-events: none !important;
+ }
```

### ② [layout.js](file:///Users/byunmose/Desktop/vibe_coding/CodeCanvas/js/layout.js)
가로 및 세로 레이아웃 상태 적용 시, 미리보기 영역의 flex 할당 값을 `1 1 0%`로 유연하게 리팩토링.

```diff
-                 if (elements.previewSection) {
-                     elements.previewSection.style.flex = `0 0 ${100 - editorFlexPercent}%`;
-                 }
+                 if (elements.previewSection) {
+                     elements.previewSection.style.flex = '1 1 0%';
+                 }
```

---

## 4. 구현 및 검증 결과 (Implementation & Verification)

1.  **가로/세로 양방향 드래그 반응성 검증**: 마우스로 구분선을 잡고 왼쪽 또는 오른쪽으로 아주 빠르게 밀고 당길 때 뚝뚝 끊김 없이 즉각적으로 부드럽게 조정되는 것을 최종 확인하였습니다.
2.  **미리보기 뷰 깨짐 검증**: 에디터 영역의 크기가 극단적 범위(20% ~ 80%)에 가더라도 미리보기 창의 콘텐츠나 스크롤 영역이 우측 화면 밖으로 삐져나가지 않고, 4px 리사이저를 제외한 가용 영역을 정확하게 꽉 채우는 유연한 벤토 그리드/반응형 핏을 확인하였습니다.

본 작업으로 에디터의 리사이저 드래그 편의성과 레이아웃 안정성이 대폭 고도화되었습니다. 향후 추가적인 2026 최신 Bento Grid 레이아웃 확장 등에도 본 유연한 Flexbox 로직이 강력한 레이아웃 밑바탕이 되어줄 것입니다.

# 프로젝트 작업 로그: 에디터/미리보기 구분선 양방향 드래그 먹통 오류 해결 (투명 오버레이 도입)

- **작성일**: 2026년 06월 08일
- **작성자**: 서기 (Doc)
- **수행 역할**: Fix (해결자), Worker (작업자), Architect (건축가), Doc (서기)
- **참고 사항**: 본 문서는 향후 레이아웃 리사이징 및 모나코 에디터의 이벤트 간섭 문제 발생 시 참고하기 위한 상세 작업 기록 로그입니다.

---

## 1. 에러 및 증상 분석 (Errors & Symptoms)

### [증상] 에디터/미리보기 구분선을 왼쪽으로 드래그할 때 드래그가 먹통이 되거나 끊기는 현상 및 초기 페이지 로드 후 클릭 불가 현상
* **상세**: 구분선을 마우스로 잡고 왼쪽으로 드래그 시 작동이 안 되던 문제와, 오버레이 최초 추가 후 페이지가 처음 로드되었을 때 전체 화면이 투명 오버레이에 가로막혀 모든 버튼 클릭이 먹통이 되는 2차 증상이 식별되었습니다.
* **기술적 원인**: 
  1. Monaco Editor의 전역 리스너 이벤트 간섭으로 인해 마우스 무브가 도중에 에디터 영역으로 넘어가면 리사이징 동작이 끊겼습니다.
  2. 새로 생성된 `#drag-overlay` div 요소에 기본 인라인 스타일로 `display: none;`이 박혀있지 않아, 외부 CSS(`panels.css`) 파싱 속도 지연 또는 브라우저의 구버전 CSS 캐싱으로 인해 렌더링 시점에 display가 block으로 노출되면서 전체 화면 클릭을 강제로 차단(Block)했습니다.

---

## 2. 해결 방안 및 논리 (Resolution & Logic)

### [해결] 화면 전체를 덮는 투명 드래그 오버레이 (Drag Overlay) 도입 및 기본 인라인 스타일 적용
* **논리**: 리사이즈 드래그가 시작될 때(`onMouseDown`), 에디터와 미리보기 영역 전체(모든 iframe 포함)를 공중에서 완전히 차단하는 투명 오버레이(`z-index: 10000`, `display: block`)를 띄웁니다.
* **초기 로드 방어(Hotfix)**: `#drag-overlay` 엘리먼트에 기본적으로 `style="display: none;"` 인라인 스타일을 선언하여 CSS 로드 속도나 브라우저 캐시에 영향을 받지 않고 로딩 즉시 완전히 숨겨지도록 만듭니다. 이를 통해 앱 로딩 직후의 화면 클릭 불통 현상을 원천 방지합니다.
* **해제**: 드래그가 해제되는 즉시(`onMouseUp`) 오버레이를 `display: none`으로 전환하여 정상 편집 상태로 복원하므로 실시간 입력 환경에는 아무런 지장을 주지 않습니다.

---

## 3. 수정 파일 및 구체적 변경 내용 (Modified Files & Diffs)

### ① [index.html](file:///Users/byunmose/Desktop/vibe_coding/CodeCanvas/index.html)
드래그 이벤트를 독점 수신할 투명 오버레이 엘리먼트 추가(인라인 기본 숨김 처리).
```diff
         </div>
     </div>
 
+    <!-- 드래그 리사이즈 시 마우스 이벤트 가로채기 방지용 투명 오버레이 -->
+    <div id="drag-overlay" class="drag-overlay" style="display: none;"></div>
+
 
     <!-- Monaco Editor CDN (VS Code 동일 엔진) -->
```

### ② [css/panels.css](file:///Users/byunmose/Desktop/vibe_coding/CodeCanvas/css/panels.css)
드래그 오버레이의 스타일(고정 위치, 화면 가득 채움, 높은 z-index, 기본 display: none) 정의.
```diff
     pointer-events: none !important;
 }
 
+/* 투명 드래그 오버레이 (이벤트 가로채기 방지) */
+.drag-overlay {
+    position: fixed;
+    top: 0;
+    left: 0;
+    width: 100vw;
+    height: 100vh;
+    z-index: 10000;
+    display: none;
+    background: transparent;
+    user-select: none;
+}
+
 /* 레이아웃별 특수 스타일 */
```

### ③ [js/layout.js](file:///Users/byunmose/Desktop/vibe_coding/CodeCanvas/js/layout.js)
리사이징 핸들러(`setupResizing`)에서 드래그 시작 시 오버레이를 노출하고 방향에 맞춰 커서를 지정하며, 드래그 종료 시 다시 오버레이를 숨기도록 구현.
```diff
             previewContainer: document.querySelector('.preview-container'),
             previewFrame: document.getElementById('preview-frame'),
             fullscreenFrame: document.getElementById('fullscreen-frame'),
+            dragOverlay: document.getElementById('drag-overlay'),
         };
     },
```
```diff
             // iframe 내에서 마우스 이벤트를 잃어버리지 않도록 pointer-events none 처리
             if (this.elements.previewFrame) {
                 this.elements.previewFrame.style.pointerEvents = 'none';
             }
+
+            // 투명 드래그 오버레이 띄우기 및 커서 형태 지정
+            if (this.elements.dragOverlay) {
+                this.elements.dragOverlay.style.display = 'block';
+                this.elements.dragOverlay.style.cursor = 
+                    this.state.orientation === 'horizontal' ? 'col-resize' : 'row-resize';
+            }
         };
```
```diff
             if (this.elements.previewFrame) {
                 this.elements.previewFrame.style.pointerEvents = '';
             }
 
+            // 투명 드래그 오버레이 숨기기
+            if (this.elements.dragOverlay) {
+                this.elements.dragOverlay.style.display = 'none';
+                this.elements.dragOverlay.style.cursor = '';
+            }
+
             // 리사이즈 완료 후 Monaco 에디터 레이아웃 갱신
             if (window.EditorManager) window.EditorManager.resize();
```

---

## 4. 구현 및 검증 결과 (Implementation & Verification)

1. **양방향 드래그 실시간 반응성**: 구분선을 잡고 왼쪽/오른쪽으로 아주 빠르게 왕복 드래그하여도 끊김이 전혀 발생하지 않고, 에디터의 레이아웃 너비가 정확하게 실시간으로 반영됩니다.
2. **에디터 및 미리보기의 간섭 해제**: 투명 오버레이가 최상단에 마우스 이벤트를 캡처하여 전달하므로, 에디터 내부 선택 텍스트가 번쩍거리거나 iframe 콘텐츠 내부로 마우스가 빠져 동작이 튀는 오류가 원천적으로 근절되었습니다.

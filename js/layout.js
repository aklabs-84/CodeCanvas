// layout.js - 레이아웃 제어 모듈

export const LayoutManager = {
    // 상태 관리
    state: {
        sidebarCollapsed: false,
        orientation: 'vertical', // 'vertical' | 'horizontal'
        editorCollapsed: false,
        previewCollapsed: false,
        consoleCollapsed: false,
        fullscreenPreview: false,
        fullscreenEditor: false, // 에디터 전체화면 상태
        editorRatio: 50, // 에디터가 차지하는 비율 (%)
        sidebarWidth: 280,
    },

    // DOM 요소 참조
    elements: {
        sidebar: null,
        mainContent: null,
        editorSection: null,
        previewSection: null,
        previewContainer: null,
        fullscreenOverlay: null,
        editorResizer: null,
        btnFileMenu: null,
        btnLayout: null,
        btnEditorCollapse: null,
        btnPreviewCollapse: null,
        btnFullscreenPreview: null,
        btnFullscreenEditor: null, // 에디터 전체화면 버튼
        btnCloseFullscreenEditor: null, // 에디터 전체화면 닫기 버튼
        btnCloseFullscreen: null,
            btnEditorRestore: null,
            btnPreviewRestore: null,
            btnConsoleCollapse: null,
            btnConsoleRestore: null,
            consoleContainer: null,
        previewFrame: null,
        fullscreenFrame: null,
    },

    // 초기화
    init() {
        this.cacheElements();
        this.loadFromLocalStorage();
        
        // 파일 탐색기는 모바일 UI처럼 항상 시작 시 기본 숨김 처리 강제 (사용자 경험 고도화)
        this.state.sidebarCollapsed = true;
        
        this.applyState();
        this.updateButtonStates();
        this.attachEventListeners();
        this.setupKeyboardShortcuts();
    },

    // DOM 요소 캐싱
    cacheElements() {
        this.elements = {
            sidebar: document.getElementById('sidebar'),
            mainContent: document.querySelector('.main-content'),
            editorSection: document.getElementById('editor-section'),
            previewSection: document.getElementById('preview-section'),
            fullscreenOverlay: document.getElementById('fullscreen-overlay'),
            editorResizer: document.getElementById('editor-resizer'),
            btnFileMenu: document.getElementById('btn-file-menu'),
            btnLayout: document.getElementById('btn-layout'),
            btnEditorCollapse: document.getElementById('btn-editor-collapse'),
            btnPreviewCollapse: document.getElementById('btn-preview-collapse'),
            btnFullscreenPreview: document.getElementById('btn-fullscreen-preview'),
            btnFullscreenEditor: document.getElementById('btn-fullscreen-editor'),
            btnCloseFullscreenEditor: document.getElementById('btn-close-fullscreen-editor'),
            btnCloseFullscreen: document.getElementById('btn-close-fullscreen'),
            btnEditorRestore: document.getElementById('btn-editor-restore'),
            btnPreviewRestore: document.getElementById('btn-preview-restore'),
            btnConsoleCollapse: document.getElementById('btn-console-collapse'),
            btnConsoleRestore: document.getElementById('btn-console-restore'),
            consoleContainer: document.querySelector('.console-container'),
            previewContainer: document.querySelector('.preview-container'),
            previewFrame: document.getElementById('preview-frame'),
            fullscreenFrame: document.getElementById('fullscreen-frame'),
        };
    },

    // 이벤트 리스너 연결
    attachEventListeners() {
        const { elements } = this;
        
        this.setupResizing();

        // 사이드바 토글 (파일 메뉴 버튼으로 동작)
        elements.btnFileMenu?.addEventListener('click', (e) => {
            e.stopPropagation(); // 버튼 클릭 시 외부 닫기 이벤트 방지
            this.toggleSidebar();
        });

        // 외부 화면 클릭 시 탐색기 닫기
        document.addEventListener('click', (e) => {
            if (!this.state.sidebarCollapsed && elements.sidebar) {
                if (!elements.sidebar.contains(e.target) && !elements.btnFileMenu?.contains(e.target)) {
                    this.state.sidebarCollapsed = true;
                    this.applyState();
                    this.updateButtonStates();
                    this.saveToLocalStorage();
                }
            }
        });

        // 레이아웃 전환
        elements.btnLayout?.addEventListener('click', () => {
            this.toggleOrientation();
        });

        // 에디터 패널 토글
        elements.btnEditorCollapse?.addEventListener('click', () => {
            this.toggleEditor();
        });

        // 미리보기 패널 토글
        elements.btnPreviewCollapse?.addEventListener('click', () => {
            this.togglePreview();
        });

        // 접힌 상태에서 보이는 복구 버튼 (에디터/미리보기)
        elements.btnEditorRestore?.addEventListener('click', () => {
            // 복구 버튼은 항상 펼치기 동작
            if (this.state.editorCollapsed) {
                this.state.editorCollapsed = false;
                this.applyState();
                this.updateButtonStates();
                this.saveToLocalStorage();
            }
        });

        elements.btnPreviewRestore?.addEventListener('click', () => {
            if (this.state.previewCollapsed) {
                this.state.previewCollapsed = false;
                this.applyState();
                this.updateButtonStates();
                this.saveToLocalStorage();
            }
        });

        // 콘솔 접기/복구
        elements.btnConsoleCollapse?.addEventListener('click', () => {
            this.toggleConsole();
        });

        elements.btnConsoleRestore?.addEventListener('click', () => {
            if (this.state.consoleCollapsed) {
                this.state.consoleCollapsed = false;
                this.applyState();
                this.updateButtonStates();
                this.saveToLocalStorage();
            }
        });

        // 전체화면 미리보기
        elements.btnFullscreenPreview?.addEventListener('click', () => {
            this.openFullscreenPreview();
        });

        // 전체화면 에디터
        elements.btnFullscreenEditor?.addEventListener('click', () => {
            this.openFullscreenEditor();
        });

        // 에디터 전체화면 닫기 버튼
        elements.btnCloseFullscreenEditor?.addEventListener('click', () => {
            this.closeFullscreenEditor();
        });

        elements.btnCloseFullscreen?.addEventListener('click', () => {
            if (this.state.fullscreenPreview) {
                this.closeFullscreenPreview();
            } else if (this.state.fullscreenEditor) {
                this.closeFullscreenEditor();
            }
        });

        // 전체화면 오버레이 배경 클릭시 닫기
        elements.fullscreenOverlay?.addEventListener('click', (e) => {
            if (e.target === elements.fullscreenOverlay) {
                if (this.state.fullscreenPreview) {
                    this.closeFullscreenPreview();
                } else if (this.state.fullscreenEditor) {
                    this.closeFullscreenEditor();
                }
            }
        });
    },

    // 리사이징 핸들러 설정
    setupResizing() {
        if (!this.elements.editorResizer) return;
        
        let isDragging = false;
        
        const onMouseDown = (e) => {
            isDragging = true;
            document.body.classList.add('resizing');
            if (this.state.orientation === 'vertical') {
                document.body.classList.add('resizing-vertical');
            }
            this.elements.editorResizer.classList.add('dragging');
            
            // iframe 내에서 마우스 이벤트를 잃어버리지 않도록 pointer-events none 처리
            if (this.elements.previewFrame) {
                this.elements.previewFrame.style.pointerEvents = 'none';
            }
        };
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const mainRect = this.elements.mainContent.getBoundingClientRect();
            let newRatio = 50;
            
            if (this.state.orientation === 'horizontal') {
                // 좌우 드래그 (X축 제한)
                const clientX = Math.max(mainRect.left, Math.min(e.clientX, mainRect.right));
                const offsetX = clientX - mainRect.left;
                newRatio = (offsetX / mainRect.width) * 100;
            } else {
                // 상하 드래그 (Y축 제한)
                const clientY = Math.max(mainRect.top, Math.min(e.clientY, mainRect.bottom));
                const offsetY = clientY - mainRect.top;
                newRatio = (offsetY / mainRect.height) * 100;
            }
            
            // 비율을 20% ~ 80% 사이로 제한
            this.state.editorRatio = Math.max(20, Math.min(80, newRatio));
            this.applyState();
        };
        
        const onMouseUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            
            document.body.classList.remove('resizing', 'resizing-vertical');
            this.elements.editorResizer.classList.remove('dragging');
            
            if (this.elements.previewFrame) {
                this.elements.previewFrame.style.pointerEvents = '';
            }
            
            this.saveToLocalStorage();
        };

        this.elements.editorResizer.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    },

    // 키보드 단축키 설정
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+B: 사이드바 토글
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                this.toggleSidebar();
            }

            // Ctrl+L: 레이아웃 전환
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                this.toggleOrientation();
            }

            // Ctrl+E: 에디터 토글
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                this.toggleEditor();
            }

            // Ctrl+P: 미리보기 토글
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                this.togglePreview();
            }

            // F10: 전체화면 에디터
            if (e.key === 'F10') {
                e.preventDefault();
                if (this.state.fullscreenEditor) {
                    this.closeFullscreenEditor();
                } else {
                    this.openFullscreenEditor();
                }
            }

            // F11: 전체화면 미리보기
            if (e.key === 'F11') {
                e.preventDefault();
                if (this.state.fullscreenPreview) {
                    this.closeFullscreenPreview();
                } else {
                    this.openFullscreenPreview();
                }
            }

            // ESC: 전체화면 닫기
            if (e.key === 'Escape') {
                if (this.state.fullscreenPreview) {
                    this.closeFullscreenPreview();
                } else if (this.state.fullscreenEditor) {
                    this.closeFullscreenEditor();
                }
            }
        });
    },

    // 사이드바 토글
    toggleSidebar() {
        this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
        this.applyState();
        this.saveToLocalStorage();
    },

    // 레이아웃 방향 전환 (vertical ↔ horizontal)
    toggleOrientation() {
        const wasHorizontal = this.state.orientation === 'horizontal';
        this.state.orientation = wasHorizontal ? 'vertical' : 'horizontal';

        // 세로 -> 가로 전환 시, 세로 상태에서 계산된 극단 값(예: 95%)으로
        // 미리보기가 너무 좁아지는 것을 방지하기 위해 비율을 보정
        if (!wasHorizontal && this.state.orientation === 'horizontal') {
            // 기본은 50:50로 시작하되, 과거 값이 있으면 20~80 사이로만 제한
            const target = this.state.editorRatio || 50;
            this.state.editorRatio = Math.max(20, Math.min(80, target));

            // 균형 잡힌 기본 레이아웃을 위해 첫 가로 전환 시에는 50:50을 강제
            this.state.editorRatio = 50;
        }

        this.applyState();
        this.saveToLocalStorage();
    },

    // 에디터 패널 토글
    toggleEditor() {
        // 접기 전에 현재 편집기 비율을 저장
        if (!this.state.editorCollapsed && this.state.orientation === 'horizontal') {
            this.state.editorRatio = this._computeCurrentEditorRatio();
        }

        this.state.editorCollapsed = !this.state.editorCollapsed;

        // 둘 다 접혀있으면 미리보기 자동으로 펼치기
        if (this.state.editorCollapsed && this.state.previewCollapsed) {
            this.state.previewCollapsed = false;
        }

        this.applyState();
        this.updateButtonStates();
        this.saveToLocalStorage();
    },

    // 미리보기 패널 토글
    togglePreview() {
        // 접기 전에 현재 편집기 비율을 저장
        if (!this.state.previewCollapsed && this.state.orientation === 'horizontal') {
            this.state.editorRatio = this._computeCurrentEditorRatio();
        }

        this.state.previewCollapsed = !this.state.previewCollapsed;

        // 둘 다 접혀있으면 에디터 자동으로 펼치기
        if (this.state.editorCollapsed && this.state.previewCollapsed) {
            this.state.editorCollapsed = false;
        }

        this.applyState();
        this.updateButtonStates();
        this.saveToLocalStorage();
    },

    // 콘솔 패널 토글 (콘솔만 숨기고 헤더는 남김)
    toggleConsole() {
        this.state.consoleCollapsed = !this.state.consoleCollapsed;
        this.applyState();
        this.updateButtonStates();
        this.saveToLocalStorage();
    },

    // 전체화면 미리보기 열기
    openFullscreenPreview() {
        this.state.fullscreenPreview = true;

        // 현재 미리보기 내용을 전체화면으로 복사
        if (this.elements.previewFrame && this.elements.fullscreenFrame) {
            const currentSrcdoc = this.elements.previewFrame.srcdoc || this.elements.previewFrame.getAttribute('srcdoc');
            if (currentSrcdoc) {
                this.elements.fullscreenFrame.srcdoc = currentSrcdoc;
            }
        }

        this.applyState();
        document.body.classList.add('fullscreen-active');
    },

    // 전체화면 미리보기 닫기
    closeFullscreenPreview() {
        this.state.fullscreenPreview = false;

        // 전체화면을 닫을 때 미리보기가 접혀있으면 자동으로 펼치기
        if (this.state.previewCollapsed) {
            this.state.previewCollapsed = false;
        }

        this.applyState();
        this.updateButtonStates();
        this.saveToLocalStorage();
        document.body.classList.remove('fullscreen-active');
    },

    // 전체화면 에디터 열기
    openFullscreenEditor() {
        this.state.fullscreenEditor = true;

        // 미리보기와 콘솔을 숨기고, 에디터만 전체화면으로 표시
        this.applyState();
        this.updateButtonStates();
        // 에디터 전체화면은 오버레이를 사용하지 않음
    },

    // 전체화면 에디터 닫기
    closeFullscreenEditor() {
        this.state.fullscreenEditor = false;

        // 전체화면을 닫을 때 미리보기와 콘솔을 다시 표시
        if (this.state.previewCollapsed) {
            this.state.previewCollapsed = false;
        }
        if (this.state.editorCollapsed) {
            this.state.editorCollapsed = false;
        }

        this.applyState();
        this.updateButtonStates();
        this.saveToLocalStorage();
    },

    // 상태를 DOM에 적용
    applyState() {
        const { state, elements } = this;

        // 사이드바
        if (state.sidebarCollapsed) {
            elements.sidebar?.classList.add('collapsed');
        } else {
            elements.sidebar?.classList.remove('collapsed');
        }

        // 레이아웃 방향
        if (state.orientation === 'horizontal') {
            elements.mainContent?.classList.add('layout-horizontal');
            elements.mainContent?.classList.remove('layout-vertical');
        } else {
            elements.mainContent?.classList.add('layout-vertical');
            elements.mainContent?.classList.remove('layout-horizontal');
        }

        // 에디터 패널
        if (state.editorCollapsed) {
            elements.editorSection?.classList.add('collapsed');
        } else {
            elements.editorSection?.classList.remove('collapsed');
        }

        // 미리보기 패널
        if (state.previewCollapsed) {
            elements.previewSection?.classList.add('collapsed');
        } else {
            elements.previewSection?.classList.remove('collapsed');
        }

        // 복구 버튼 표시: 에디터가 접혀있을 때만 보이게 함
        if (elements.btnEditorRestore) {
            elements.btnEditorRestore.style.display = state.editorCollapsed ? 'flex' : 'none';
        }

        // 레이아웃 비율 적용 (가로 레이아웃인 경우)
        if (elements.mainContent?.classList.contains('layout-horizontal')) {
            if (!state.editorCollapsed && !state.previewCollapsed) {
                const editorFlexPercent = Math.max(20, Math.min(80, state.editorRatio || 50));
                if (elements.editorSection) {
                    elements.editorSection.style.flex = `0 0 ${editorFlexPercent}%`;
                }
                if (elements.previewSection) {
                    elements.previewSection.style.flex = `0 0 ${100 - editorFlexPercent}%`;
                }
            } else if (state.editorCollapsed && !state.previewCollapsed) {
                if (elements.previewSection) elements.previewSection.style.flex = '1 1 0%';
                if (elements.editorSection) elements.editorSection.style.flex = '0 0 auto';
            } else if (!state.editorCollapsed && state.previewCollapsed) {
                if (elements.editorSection) elements.editorSection.style.flex = '1 1 0%';
                if (elements.previewSection) elements.previewSection.style.flex = '0 0 auto';
            }
        } else {
            // 세로 레이아웃
            if (!state.editorCollapsed && !state.previewCollapsed) {
                const editorFlexPercent = Math.max(20, Math.min(80, state.editorRatio || 50));
                if (elements.editorSection) {
                    elements.editorSection.style.flex = `0 0 ${editorFlexPercent}%`;
                }
                if (elements.previewSection) {
                    elements.previewSection.style.flex = `0 0 ${100 - editorFlexPercent}%`;
                }
            } else if (state.editorCollapsed && !state.previewCollapsed) {
                if (elements.previewSection) elements.previewSection.style.flex = '1 1 0%';
                if (elements.editorSection) elements.editorSection.style.flex = '0 0 auto';
            } else if (!state.editorCollapsed && state.previewCollapsed) {
                if (elements.editorSection) elements.editorSection.style.flex = '1 1 0%';
                if (elements.previewSection) elements.previewSection.style.flex = '0 0 auto';
            }
        }

        // 미리보기 패널 접힘 처리
        if (elements.previewContainer) {
            if (state.previewCollapsed) {
                elements.previewContainer.classList.add('collapsed');
            } else {
                elements.previewContainer.classList.remove('collapsed');
            }
        }

        // 복구 버튼 표시: 미리보기가 접혀있을 때만 보이게 함
        if (elements.btnPreviewRestore) {
            elements.btnPreviewRestore.style.display = state.previewCollapsed ? 'flex' : 'none';
        }

        // 리사이즈 핸들 표시 제어 (패널 중 하나라도 접히면 숨김)
        if (elements.editorResizer) {
            if (state.editorCollapsed || state.previewCollapsed) {
                elements.editorResizer.style.display = 'none';
            } else {
                elements.editorResizer.style.display = '';
                // 방향에 따라 클래스 변경
                if (state.orientation === 'horizontal') {
                    elements.editorResizer.classList.add('horizontal');
                    elements.editorResizer.classList.remove('vertical');
                } else {
                    elements.editorResizer.classList.add('vertical');
                    elements.editorResizer.classList.remove('horizontal');
                }
            }
        }

        // 콘솔 영역 접힘 제어: 콘솔은 preview-section 내부에 있으므로
        // 별도 컨테이너에 collapsed 클래스를 붙여 내용만 숨김
        if (elements.consoleContainer) {
            if (state.consoleCollapsed) {
                elements.consoleContainer.classList.add('collapsed');
            } else {
                elements.consoleContainer.classList.remove('collapsed');
            }
        }

        // 콘솔 복구 버튼 표시
        if (elements.btnConsoleRestore) {
            elements.btnConsoleRestore.style.display = state.consoleCollapsed ? 'flex' : 'none';
        }

        // 전체화면 오버레이 (미리보기 전체화면에만 사용)
        if (state.fullscreenPreview) {
            elements.fullscreenOverlay?.classList.remove('hidden');
        } else {
            elements.fullscreenOverlay?.classList.add('hidden');
        }

        // 에디터 전체화면 모드
        if (state.fullscreenEditor) {
            elements.editorSection?.classList.add('fullscreen-editor');
            elements.previewSection?.classList.add('hidden');
            elements.sidebar?.classList.add('hidden');
        } else {
            elements.editorSection?.classList.remove('fullscreen-editor');
            elements.previewSection?.classList.remove('hidden');
            elements.sidebar?.classList.remove('hidden');
        }

        // 이전에는 접힘 상태로 전체 섹션을 숨기기 위해
        // `.preview-only` / `.editor-only` 클래스를 사용했습니다.
        // 사용자가 원하는 동작은 "탭 헤더는 남기고 입력 영역만 숨김" 이므로
        // 이 로직을 제거하여 `.collapsed` 클래스만으로 입력 영역을 숨기도록 합니다.
    },

    // 현재 편집기 비율을 계산 (가로 레이아웃 기준)
    _computeCurrentEditorRatio() {
        try {
            const { editorSection, previewSection, mainContent } = this.elements;
            if (!editorSection || !previewSection || !mainContent) return this.state.editorRatio;

            // 세로 레이아웃에서는 비율 계산이 항상 100%가 되므로 그대로 반환
            if (this.state.orientation !== 'horizontal' && !mainContent.classList.contains('layout-horizontal')) {
                return this.state.editorRatio;
            }

            const rectMain = mainContent.getBoundingClientRect();
            const rectEditor = editorSection.getBoundingClientRect();

            if (rectMain.width <= 0) return this.state.editorRatio;

            const ratio = Math.round((rectEditor.width / rectMain.width) * 100);
            return Math.max(20, Math.min(80, ratio));
        } catch (e) {
            return this.state.editorRatio;
        }
    },

    // localStorage에 저장
    saveToLocalStorage() {
        try {
            const layout = {
                sidebarCollapsed: this.state.sidebarCollapsed,
                sidebarWidth: this.state.sidebarWidth,
                orientation: this.state.orientation,
                editorCollapsed: this.state.editorCollapsed,
                previewCollapsed: this.state.previewCollapsed,
                editorRatio: this.state.editorRatio,
                consoleCollapsed: this.state.consoleCollapsed,
            };
            localStorage.setItem('codecanvas_layout', JSON.stringify(layout));
        } catch (error) {
            console.error('Failed to save layout to localStorage:', error);
        }
    },

    // localStorage에서 불러오기
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('codecanvas_layout');
            if (saved) {
                const savedState = JSON.parse(saved);
                // 가로 레이아웃에서 저장된 극단 비율로 인해 미리보기가 좁아지는 것 방지
                if (savedState.orientation === 'horizontal') {
                    const safeRatio = Math.max(20, Math.min(80, savedState.editorRatio ?? 50));
                    savedState.editorRatio = safeRatio;
                }
                
                // 저장된 상태와 기본값 병합
                this.state = {
                    sidebarCollapsed: savedState.sidebarCollapsed !== undefined ? savedState.sidebarCollapsed : true, // 기본 숨김
                    orientation: savedState.orientation || 'horizontal',
                    editorCollapsed: false,
                    previewCollapsed: false,
                    consoleCollapsed: false,
                    fullscreenPreview: false,
                    fullscreenEditor: false,
                    editorRatio: savedState.editorRatio || 50,
                    sidebarWidth: savedState.sidebarWidth || 280,
                };
            }
        } catch (error) {
            console.error('Failed to load layout from localStorage:', error);
        }
    },

    // 상태 리셋
    reset() {
        this.state = {
            sidebarCollapsed: true, // 파일 탐색기 기본 숨김
            orientation: 'vertical',
            editorCollapsed: false,
            previewCollapsed: false,
            consoleCollapsed: false,
            fullscreenPreview: false,
            fullscreenEditor: false,
            editorRatio: 50,
            sidebarWidth: 280,
        };
        this.applyState();
        this.saveToLocalStorage();
    },

    // 미리보기 내용 업데이트
    updatePreview(html) {
        if (this.elements.previewFrame) {
            this.elements.previewFrame.srcdoc = html;
        }

        // 전체화면이 열려있으면 전체화면도 업데이트
        if (this.state.fullscreenPreview && this.elements.fullscreenFrame) {
            this.elements.fullscreenFrame.srcdoc = html;
        }
    },

    // 버튼 상태 업데이트
    updateButtonStates() {
        const { elements, state } = this;

        // 에디터 접기/펼치기 버튼
        if (elements.btnEditorCollapse) {
            const iconSpan = elements.btnEditorCollapse.querySelector('.icon');
            if (iconSpan) {
                iconSpan.textContent = state.editorCollapsed ? '▶' : '◀';
            }
            elements.btnEditorCollapse.title = state.editorCollapsed
                ? '에디터 펼치기 (Ctrl+E)'
                : '에디터 접기 (Ctrl+E)';
        }

        // 파일 메뉴 토글 버튼
        if (elements.btnFileMenu) {
            elements.btnFileMenu.title = state.sidebarCollapsed 
                ? '파일 탐색기 열기 (Ctrl+B)' 
                : '파일 탐색기 닫기 (Ctrl+B)';
        }

        // 미리보기 접기/펼치기 버튼
        if (elements.btnPreviewCollapse) {
            const iconSpan = elements.btnPreviewCollapse.querySelector('.icon');
            if (iconSpan) {
                iconSpan.textContent = state.previewCollapsed ? '◀' : '▶';
            }
            elements.btnPreviewCollapse.title = state.previewCollapsed
                ? '미리보기 펼치기 (Ctrl+P)'
                : '미리보기 접기 (Ctrl+P)';
        }

        // 콘솔 접기/펼치기 버튼
        if (elements.btnConsoleCollapse) {
            // btnConsoleCollapse is a simple button with text icon, not an inner .icon span.
            elements.btnConsoleCollapse.title = state.consoleCollapsed
                ? '콘솔 펼치기'
                : '콘솔 접기';
            // 버튼 텍스트/icon flip
            elements.btnConsoleCollapse.textContent = state.consoleCollapsed ? '▶' : '▼';
        }

        // 에디터 전체화면 버튼
        if (elements.btnFullscreenEditor) {
            elements.btnFullscreenEditor.title = state.fullscreenEditor
                ? '전체화면 해제 (F10 또는 ESC)'
                : '에디터 전체화면 (F10)';
            // 전체화면 모드일 때는 전체화면 버튼과 접기 버튼 숨기기
            if (state.fullscreenEditor) {
                elements.btnFullscreenEditor.style.display = 'none';
                elements.btnEditorCollapse.style.display = 'none';
            } else {
                elements.btnFullscreenEditor.style.display = '';
                elements.btnEditorCollapse.style.display = '';
            }
        }

        // 에디터 전체화면 닫기 버튼
        if (elements.btnCloseFullscreenEditor) {
            // 전체화면 모드일 때만 닫기 버튼 보이기
            if (state.fullscreenEditor) {
                elements.btnCloseFullscreenEditor.style.display = '';
            } else {
                elements.btnCloseFullscreenEditor.style.display = 'none';
            }
        }
    },
};

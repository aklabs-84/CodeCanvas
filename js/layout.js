// layout.js - 레이아웃 제어 모듈

export const LayoutManager = {
    // 상태 관리
    state: {
        sidebarCollapsed: false,
        orientation: 'vertical', // 'vertical' | 'horizontal'
        editorCollapsed: false,
        previewCollapsed: false,
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
        fullscreenOverlay: null,
        btnSidebarToggle: null,
        btnLayout: null,
        btnEditorCollapse: null,
        btnPreviewCollapse: null,
        btnFullscreenPreview: null,
        btnFullscreenEditor: null, // 에디터 전체화면 버튼
        btnCloseFullscreenEditor: null, // 에디터 전체화면 닫기 버튼
        btnCloseFullscreen: null,
        previewFrame: null,
        fullscreenFrame: null,
    },

    // 초기화
    init() {
        this.cacheElements();
        this.loadFromLocalStorage();
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
            btnSidebarToggle: document.getElementById('btn-sidebar-toggle'),
            btnLayout: document.getElementById('btn-layout'),
            btnEditorCollapse: document.getElementById('btn-editor-collapse'),
            btnPreviewCollapse: document.getElementById('btn-preview-collapse'),
            btnFullscreenPreview: document.getElementById('btn-fullscreen-preview'),
            btnFullscreenEditor: document.getElementById('btn-fullscreen-editor'),
            btnCloseFullscreenEditor: document.getElementById('btn-close-fullscreen-editor'),
            btnCloseFullscreen: document.getElementById('btn-close-fullscreen'),
            previewFrame: document.getElementById('preview-frame'),
            fullscreenFrame: document.getElementById('fullscreen-frame'),
        };
    },

    // 이벤트 리스너 연결
    attachEventListeners() {
        const { elements } = this;

        // 사이드바 토글
        elements.btnSidebarToggle?.addEventListener('click', () => {
            this.toggleSidebar();
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
        this.state.orientation = this.state.orientation === 'vertical' ? 'horizontal' : 'vertical';
        this.applyState();
        this.saveToLocalStorage();
    },

    // 에디터 패널 토글
    toggleEditor() {
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
        this.state.previewCollapsed = !this.state.previewCollapsed;

        // 둘 다 접혀있으면 에디터 자동으로 펼치기
        if (this.state.editorCollapsed && this.state.previewCollapsed) {
            this.state.editorCollapsed = false;
        }

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
            if (!state.previewCollapsed) {
                elements.previewSection?.classList.remove('hidden');
            }
            if (!state.sidebarCollapsed) {
                elements.sidebar?.classList.remove('hidden');
            }
        }

        // 특수 레이아웃 모드
        if (state.editorCollapsed && !state.previewCollapsed) {
            elements.mainContent?.classList.add('preview-only');
            elements.mainContent?.classList.remove('editor-only');
        } else if (!state.editorCollapsed && state.previewCollapsed) {
            elements.mainContent?.classList.add('editor-only');
            elements.mainContent?.classList.remove('preview-only');
        } else {
            elements.mainContent?.classList.remove('preview-only', 'editor-only');
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
                const layout = JSON.parse(saved);
                this.state = {
                    ...this.state,
                    ...layout,
                    fullscreenPreview: false, // 전체화면은 항상 false로 시작
                    fullscreenEditor: false, // 에디터 전체화면도 항상 false로 시작
                    previewCollapsed: false, // 미리보기는 항상 펼쳐진 상태로 시작
                    editorCollapsed: false, // 에디터도 항상 펼쳐진 상태로 시작
                };
            }
        } catch (error) {
            console.error('Failed to load layout from localStorage:', error);
        }
    },

    // 상태 리셋
    reset() {
        this.state = {
            sidebarCollapsed: false,
            orientation: 'vertical',
            editorCollapsed: false,
            previewCollapsed: false,
            fullscreenPreview: false,
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
                iconSpan.textContent = state.editorCollapsed ? '▶' : '▼';
            }
            elements.btnEditorCollapse.title = state.editorCollapsed
                ? '에디터 펼치기 (Ctrl+E)'
                : '에디터 접기 (Ctrl+E)';
        }

        // 미리보기 접기/펼치기 버튼
        if (elements.btnPreviewCollapse) {
            const iconSpan = elements.btnPreviewCollapse.querySelector('.icon');
            if (iconSpan) {
                iconSpan.textContent = state.previewCollapsed ? '▼' : '▲';
            }
            elements.btnPreviewCollapse.title = state.previewCollapsed
                ? '미리보기 펼치기 (Ctrl+P)'
                : '미리보기 접기 (Ctrl+P)';
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

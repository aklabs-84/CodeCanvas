// sidebar.js - 사이드바 UI 관리

export const SidebarManager = {
    currentView: 'list', // 'list' | 'gallery'

    init() {
        console.log('Sidebar manager initialized');
        this.attachEventListeners();
    },

    attachEventListeners() {
        // 뷰 전환 버튼
        const btnListView = document.getElementById('btn-list-view');
        const btnGalleryView = document.getElementById('btn-gallery-view');

        btnListView?.addEventListener('click', () => {
            this.switchView('list');
        });

        btnGalleryView?.addEventListener('click', () => {
            this.switchView('gallery');
        });

        // 새 프로젝트 버튼
        const btnNewProject = document.querySelector('.btn-new-project');
        btnNewProject?.addEventListener('click', () => {
            this.createNewProject();
        });

        // 로컬 파일 불러오기
        this.setupLocalFileImport();

        // 프로젝트 제목은 ProjectManager에서 처리
    },

    switchView(view) {
        this.currentView = view;

        const projectList = document.getElementById('project-list');
        const btnListView = document.getElementById('btn-list-view');
        const btnGalleryView = document.getElementById('btn-gallery-view');

        if (view === 'list') {
            projectList?.classList.remove('gallery-view');
            btnListView?.classList.add('active');
            btnGalleryView?.classList.remove('active');
        } else {
            projectList?.classList.add('gallery-view');
            btnListView?.classList.remove('active');
            btnGalleryView?.classList.add('active');
        }
    },

    createNewProject() {
        if (window.ProjectManager) {
            window.ProjectManager.createNewProject();
            if (window.showSuccessNotification) {
                window.showSuccessNotification('새 프로젝트가 생성되었습니다.');
            }
        }
    },

    setupLocalFileImport() {
        const fileItem = document.querySelector('.file-explorer .file-item');
        const fileInput = document.getElementById('local-file-loader');
        if (!fileItem || !fileInput) return;

        // 파일 이름 클릭 시 파일 선택창 열기
        fileItem.addEventListener('click', () => fileInput.click());

        // 선택된 파일 읽어서 에디터에 주입
        fileInput.addEventListener('change', async () => {
            const files = Array.from(fileInput.files || []);
            if (!files.length) return;

            const loaded = { html: null, css: null, js: null };

            await Promise.all(files.map(async (file) => {
                const ext = (file.name.split('.').pop() || '').toLowerCase();
                if (!['html', 'htm', 'css', 'js'].includes(ext)) return;
                const text = await this.readFileAsText(file);
                if (ext === 'html' || ext === 'htm') loaded.html = text;
                else if (ext === 'css') loaded.css = text;
                else if (ext === 'js') loaded.js = text;
            }));

            const current = (window.EditorManager && window.EditorManager.getCode())
                ? window.EditorManager.getCode()
                : { html: '', css: '', js: '' };

            const merged = {
                html: loaded.html ?? current.html,
                css: loaded.css ?? current.css,
                js: loaded.js ?? current.js,
            };

            if (window.EditorManager) {
                window.EditorManager.setCode(merged);
            }

            if (window.ProjectManager) {
                window.ProjectManager.hasUnsavedChanges = true;
                window.ProjectManager.updateSaveStatus('saving');
            }

            if (window.showSuccessNotification) {
                window.showSuccessNotification('로컬 파일을 불러왔습니다.');
            }

            fileInput.value = '';
        });
    },

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result || '');
            reader.onerror = () => reject(reader.error || new Error('파일을 읽을 수 없습니다.'));
            reader.readAsText(file);
        });
    },

    // 사이드바 접기
    collapse() {
        if (window.LayoutManager && !window.LayoutManager.state.sidebarCollapsed) {
            window.LayoutManager.toggleSidebar();
        }
    },

    // 사이드바 펼치기
    expand() {
        if (window.LayoutManager && window.LayoutManager.state.sidebarCollapsed) {
            window.LayoutManager.toggleSidebar();
        }
    },
};

// 전역 객체로 등록
window.SidebarManager = SidebarManager;

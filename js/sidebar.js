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
};

// 전역 객체로 등록
window.SidebarManager = SidebarManager;

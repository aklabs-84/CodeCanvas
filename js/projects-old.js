// projects.js - 프로젝트 CRUD 관리

export const ProjectManager = {
    currentProject: null,
    hasUnsavedChanges: false,
    autoSaveTimeout: null,

    init() {
        console.log('Project manager initialized');
        this.loadCurrentProject();
        this.attachEventListeners();
    },

    // 이벤트 리스너 연결
    attachEventListeners() {
        // 프로젝트 제목 변경 감지
        const projectTitle = document.getElementById('project-title');
        projectTitle?.addEventListener('input', () => {
            this.triggerAutoSave();
        });
    },

    // 현재 프로젝트 로드 (localStorage 사용)
    loadCurrentProject() {
        try {
            const saved = localStorage.getItem('codecanvas_current_project');
            if (saved) {
                this.currentProject = JSON.parse(saved);
                this.hasUnsavedChanges = false;
                this.loadProjectToEditor();
                this.updateSaveStatus('saved');
            } else {
                this.createNewProject();
            }
        } catch (error) {
            console.error('Failed to load current project:', error);
            this.createNewProject();
        }
    },

    // 새 프로젝트 생성
    createNewProject() {
        this.currentProject = {
            id: this.generateId(),
            title: '새 프로젝트',
            description: '',
            category: '',
            tags: [],
            code: {
                html: '<!DOCTYPE html>\n<html lang="ko">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    <h1>Hello, CodeCanvas!</h1>\n</body>\n</html>',
                css: 'body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}\n\nh1 {\n    color: #333;\n}',
                js: 'console.log("Hello, CodeCanvas!");',
            },
            thumbnail: null,
            isPublic: false,
            shareId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1,
        };

        this.hasUnsavedChanges = false;
        this.loadProjectToEditor();
        this.saveCurrentProject();
    },

    // 프로젝트를 에디터에 로드
    loadProjectToEditor() {
        // 에디터가 초기화될 때까지 대기
        const loadToEditor = () => {
            if (window.EditorManager && window.EditorManager.editors.html && this.currentProject) {
                window.EditorManager.setCode(this.currentProject.code);

                const titleInput = document.getElementById('project-title');
                if (titleInput) {
                    titleInput.value = this.currentProject.title;
                }
            } else {
                // 에디터가 아직 준비되지 않았으면 잠시 후 재시도
                setTimeout(loadToEditor, 100);
            }
        };
        loadToEditor();
    },

    // 현재 프로젝트 저장
    saveCurrentProject() {
        try {
            if (this.currentProject) {
                // 에디터에서 현재 코드 가져오기
                if (window.EditorManager) {
                    this.currentProject.code = window.EditorManager.getCode();
                }

                const titleInput = document.getElementById('project-title');
                if (titleInput) {
                    this.currentProject.title = titleInput.value || '새 프로젝트';
                }

                this.currentProject.updatedAt = new Date().toISOString();

                localStorage.setItem('codecanvas_current_project', JSON.stringify(this.currentProject));

                this.hasUnsavedChanges = false;
                this.updateSaveStatus('saved');

                if (window.showSuccessNotification) {
                    window.showSuccessNotification('프로젝트가 저장되었습니다.');
                }
            }
        } catch (error) {
            console.error('Failed to save project:', error);
            this.updateSaveStatus('error');
            if (window.showErrorNotification) {
                window.showErrorNotification('저장에 실패했습니다.');
            }
        }
    },

    // 자동 저장 트리거
    triggerAutoSave() {
        this.hasUnsavedChanges = true;
        this.updateSaveStatus('saving');

        // 기존 타이머 취소
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        // 30초 후 자동 저장
        this.autoSaveTimeout = setTimeout(() => {
            this.saveCurrentProject();
        }, 30000);
    },

    // 저장 상태 업데이트
    updateSaveStatus(status) {
        const saveStatus = document.getElementById('save-status');
        if (saveStatus) {
            saveStatus.className = `save-status ${status}`;

            switch (status) {
                case 'saving':
                    saveStatus.textContent = '저장 중...';
                    break;
                case 'saved':
                    saveStatus.textContent = '저장됨';
                    break;
                case 'error':
                    saveStatus.textContent = '저장 실패';
                    break;
                default:
                    saveStatus.textContent = '';
            }
        }
    },

    // ID 생성
    generateId() {
        return 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
};

// 전역 객체로 등록
window.ProjectManager = ProjectManager;

// projects.js - 프로젝트 CRUD 관리 (확장 버전)
import { CONFIG } from './config.js';

export const ProjectManager = {
    currentProject: null,
    allProjects: [],
    hasUnsavedChanges: false,
    autoSaveTimeout: null,
    isSharedLoad: false, // 공유 링크를 통해 로드된 프로젝트인지 여부

    init() {
        this.loadAllProjects();
        this.loadCurrentProject();
        this.attachEventListeners();
        this.renderProjectList();
    },

    // 모든 프로젝트 로드
    loadAllProjects() {
        try {
            const saved = localStorage.getItem('codecanvas_all_projects');
            if (saved) {
                this.allProjects = JSON.parse(saved);
            } else {
                this.allProjects = [];
            }
        } catch (error) {
            console.error('Failed to load all projects:', error);
            this.allProjects = [];
        }
    },

    // 모든 프로젝트 저장
    saveAllProjects() {
        try {
            localStorage.setItem('codecanvas_all_projects', JSON.stringify(this.allProjects));
        } catch (error) {
            console.error('Failed to save all projects:', error);
        }
    },

    // 이벤트 리스너 연결
    attachEventListeners() {
        // 프로젝트 제목 변경 감지
        const projectTitle = document.getElementById('project-title');
        projectTitle?.addEventListener('input', () => {
            this.triggerAutoSave();
        });
    },

    // 현재 프로젝트 로드
    loadCurrentProject() {
        try {
            const saved = localStorage.getItem('codecanvas_current_project');
            if (saved) {
                this.currentProject = JSON.parse(saved);
                this.hasUnsavedChanges = false;
                this.loadProjectToEditor();
                this.updateSaveStatus('saved');
            } else {
                // 저장된 프로젝트가 있으면 첫 번째 프로젝트 로드
                if (this.allProjects.length > 0) {
                    this.loadProject(this.allProjects[0].id);
                } else {
                    this.createNewProject();
                }
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
        const loadToEditor = () => {
            if (window.EditorManager && window.EditorManager.editors.html && this.currentProject) {
                window.EditorManager.setCode(this.currentProject.code);

                const titleInput = document.getElementById('project-title');
                if (titleInput) {
                    titleInput.value = this.currentProject.title;
                }
            } else {
                setTimeout(loadToEditor, 100);
            }
        };
        loadToEditor();
    },

    // 현재 프로젝트 저장
    saveCurrentProject(silent = false) {
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

                // 만약 공유 링크로 불러온 프로젝트라면, 저장 시 새로운 ID를 부여하여 '포크(복제)' 처리
                if (this.isSharedLoad) {
                    const oldId = this.currentProject.id;
                    this.currentProject.id = this.generateId();
                    this.currentProject.title = (this.currentProject.title || '새 프로젝트') + ' (복사본)';
                    this.isSharedLoad = false; // 이제 내 프로젝트가 됨
                    
                    console.log(`Project forked: ${oldId} -> ${this.currentProject.id}`);
                    
                    // URL 파라미터 제거 (선택 사항: 새로고침 시 원본으로 돌아가지 않도록)
                    if (window.history.replaceState) {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }

                // 현재 프로젝트 저장
                localStorage.setItem('codecanvas_current_project', JSON.stringify(this.currentProject));

                // 전체 프로젝트 목록에서 업데이트 또는 추가
                const index = this.allProjects.findIndex(p => p.id === this.currentProject.id);
                if (index >= 0) {
                    this.allProjects[index] = { ...this.currentProject };
                } else {
                    this.allProjects.unshift(this.currentProject);
                }

                this.saveAllProjects();
                this.renderProjectList();

                this.hasUnsavedChanges = false;
                this.updateSaveStatus('saved');

                if (window.showSuccessNotification && !silent) {
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

    // 프로젝트 로드
    loadProject(projectId) {
        const project = this.allProjects.find(p => p.id === projectId);
        if (project) {
            this.currentProject = { ...project };
            this.hasUnsavedChanges = false;
            this.loadProjectToEditor();
            this.updateSaveStatus('saved');
            localStorage.setItem('codecanvas_current_project', JSON.stringify(this.currentProject));
            this.renderProjectList();
        }
    },

    // 프로젝트 삭제
    deleteProject(projectId) {
        const index = this.allProjects.findIndex(p => p.id === projectId);
        if (index >= 0) {
            this.allProjects.splice(index, 1);
            this.saveAllProjects();
            this.renderProjectList();

            // 삭제한 프로젝트가 현재 프로젝트인 경우
            if (this.currentProject && this.currentProject.id === projectId) {
                if (this.allProjects.length > 0) {
                    this.loadProject(this.allProjects[0].id);
                } else {
                    this.createNewProject();
                }
            }

            if (window.showSuccessNotification) {
                window.showSuccessNotification('프로젝트가 삭제되었습니다.');
            }
        }
    },

    // 프로젝트 목록 렌더링
    renderProjectList() {
        const projectList = document.getElementById('project-list');
        if (!projectList) {
            return;
        }

        // 새 프로젝트 버튼 제외한 기존 항목 제거
        const existingProjects = projectList.querySelectorAll('.project-item');
        existingProjects.forEach(item => item.remove());

        // 정렬 (최근 수정일순)
        const sortedProjects = [...this.allProjects].sort((a, b) =>
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );

        if (sortedProjects.length === 0) {
            return;
        }

        // 프로젝트 항목들을 추가 (최신순)
        sortedProjects.forEach(project => {
            const item = this.createProjectListItem(project);
            projectList.appendChild(item);
        });
    },

    // 프로젝트 목록 아이템 생성
    createProjectListItem(project) {
        const item = document.createElement('div');
        item.className = 'project-item';
        if (this.currentProject && project.id === this.currentProject.id) {
            item.classList.add('active');
        }

        const info = document.createElement('div');
        info.className = 'project-info';

        const title = document.createElement('div');
        title.className = 'project-item-title';
        title.textContent = project.title || '제목 없음';

        const meta = document.createElement('div');
        meta.className = 'project-item-meta';
        const date = new Date(project.updatedAt);
        meta.textContent = this.formatDate(date);

        info.appendChild(title);
        info.appendChild(meta);

        const actions = document.createElement('div');
        actions.className = 'project-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon-small';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = '프로젝트 삭제';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm('정말 이 프로젝트를 삭제하시겠습니까?')) {
                this.deleteProject(project.id);
            }
        };

        actions.appendChild(deleteBtn);

        item.appendChild(info);
        item.appendChild(actions);

        // 클릭 이벤트
        item.onclick = () => {
            this.loadProject(project.id);
        };

        return item;
    },

    // 날짜 포맷팅
    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;

        return date.toLocaleDateString('ko-KR');
    },

    // 자동 저장 트리거
    triggerAutoSave() {
        this.hasUnsavedChanges = true;
        this.updateSaveStatus('saving');

        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

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

    // --- 클라우드 연동 기능 (Google Sheets / GAS) ---

    // 프로젝트를 클라우드에 저장
    async saveToCloud(project = this.currentProject) {
        if (!project) return null;
        if (!CONFIG.GAS_APP_URL) {
            console.warn('GAS_APP_URL이 설정되지 않았습니다. config.js를 확인하세요.');
            return null;
        }

        try {
            // 저장 전 현재 UI 상태(제목, 코드)를 프로젝트 객체에 반영
            this.saveCurrentProject(true);
            
            // 최신화된 데이터로 다시 할당 (인자가 없을 경우 this.currentProject 사용)
            if (project === this.currentProject) {
                project = this.currentProject;
            }

            this.updateSaveStatus('saving');
            
            // 저장할 데이터 준비
            const payload = {
                action: 'save',
                id: project.id,
                title: project.title,
                code: project.code,
                updatedAt: new Date().toISOString()
            };

            const response = await fetch(CONFIG.GAS_APP_URL, {
                method: 'POST',
                mode: 'no-cors', // GAS의 특성상 no-cors를 사용하거나, API에서 적절한 헤더를 반환해야 함
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            // no-cors 모드에서는 응답을 읽을 수 없으므로 성공으로 간주하거나, 
            // 실제 배포 시에는 redirect: 'follow'와 적절한 헤더 설정을 권장함
            
            console.log('Project sync request sent to cloud');
            this.updateSaveStatus('saved');
            return project.id;
        } catch (error) {
            console.error('Failed to sync to cloud:', error);
            this.updateSaveStatus('error');
            return null;
        }
    },

    // 클라우드에서 프로젝트 로드
    async loadFromCloud(projectId) {
        if (!CONFIG.GAS_APP_URL) return null;

        try {
            const url = `${CONFIG.GAS_APP_URL}?action=get&id=${projectId}`;
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });

            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            if (data && data.status === 'success') {
                return data.project;
            }
            return null;
        } catch (error) {
            console.error('Failed to load from cloud:', error);
            return null;
        }
    },
};

// 전역 객체로 등록
window.ProjectManager = ProjectManager;

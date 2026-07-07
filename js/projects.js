// projects.js - 프로젝트 CRUD 관리 (Supabase 기반)
import { supabase } from './supabase-client.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    // 로그인 상태 변화 시 auth.js에서 호출
    async onAuthChange(isAuthenticated) {
        if (isAuthenticated) {
            await this.migrateLocalProjectsToCloud();
            await this.loadAllProjectsFromCloud();
        } else {
            this.loadAllProjects();
        }
        this.renderProjectList();
    },

    _isCloudId(id) {
        return UUID_RE.test(id || '');
    },

    _fromRow(row) {
        return {
            id: row.id,
            title: row.title,
            code: { html: row.html ?? '', css: row.css ?? '', js: row.js ?? '' },
            isPublic: row.is_public,
            shareId: row.shared_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    },

    // 모든 프로젝트 로드 (localStorage 캐시)
    loadAllProjects() {
        try {
            const saved = localStorage.getItem('codecanvas_all_projects');
            this.allProjects = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load all projects:', error);
            this.allProjects = [];
        }
    },

    // 클라우드에서 프로젝트 목록 로드 (로그인 상태)
    async loadAllProjectsFromCloud() {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('updated_at', { ascending: false });
            if (error) throw error;

            this.allProjects = data.map(row => this._fromRow(row));
            this.saveAllProjects();
        } catch (error) {
            console.error('클라우드 프로젝트 목록 로드 실패:', error);
        }
    },

    // 모든 프로젝트 저장 (localStorage 캐시)
    saveAllProjects() {
        try {
            localStorage.setItem('codecanvas_all_projects', JSON.stringify(this.allProjects));
        } catch (error) {
            console.error('Failed to save all projects:', error);
        }
    },

    // localStorage에만 있던(비-UUID) 게스트 프로젝트를 로그인 시 클라우드로 이전
    async migrateLocalProjectsToCloud() {
        if (!window.AuthManager?.isAuthenticated || !window.AuthManager.user) return;

        const localOnly = this.allProjects.filter(p => !this._isCloudId(p.id));
        if (localOnly.length === 0) return;

        let migratedCount = 0;
        for (const project of localOnly) {
            const oldId = project.id;
            const newId = crypto.randomUUID();

            const { error } = await supabase.from('projects').insert({
                id: newId,
                user_id: window.AuthManager.user.id,
                title: project.title,
                html: project.code?.html ?? '',
                css: project.code?.css ?? '',
                js: project.code?.js ?? '',
                is_public: project.isPublic ?? false,
                shared_id: project.shareId ?? null,
                created_at: project.createdAt,
                updated_at: project.updatedAt,
            });

            if (error) {
                console.error('프로젝트 마이그레이션 실패:', project.title, error);
                continue;
            }

            project.id = newId;
            migratedCount++;
            if (this.currentProject?.id === oldId) {
                this.currentProject.id = newId;
            }
        }

        this.saveAllProjects();
        if (this.currentProject) {
            localStorage.setItem('codecanvas_current_project', JSON.stringify(this.currentProject));
        }

        if (migratedCount > 0 && window.showSuccessNotification) {
            window.showSuccessNotification(`기존 프로젝트 ${migratedCount}개를 클라우드로 이전했습니다.`);
        }
    },

    // 이벤트 리스너 연결
    attachEventListeners() {
        const projectTitle = document.getElementById('project-title');
        projectTitle?.addEventListener('input', () => {
            this.triggerAutoSave();
        });

        const searchInput = document.getElementById('project-search');
        searchInput?.addEventListener('input', () => {
            this.renderProjectList();
        });

        const sortSelect = document.getElementById('project-sort');
        sortSelect?.addEventListener('change', () => {
            this.renderProjectList();
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
        const isCloud = !!window.AuthManager?.isAuthenticated;

        this.currentProject = {
            id: isCloud ? crypto.randomUUID() : this.generateId(),
            title: '새 프로젝트',
            code: {
                html: '<!DOCTYPE html>\n<html lang="ko">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    <h1>Hello, CodeCanvas!</h1>\n</body>\n</html>',
                css: 'body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}\n\nh1 {\n    color: #333;\n}',
                js: 'console.log("Hello, CodeCanvas!");',
            },
            isPublic: false,
            shareId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
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
    async saveCurrentProject(silent = false) {
        try {
            if (this.currentProject) {
                if (window.EditorManager) {
                    this.currentProject.code = window.EditorManager.getCode();
                }

                const titleInput = document.getElementById('project-title');
                if (titleInput) {
                    this.currentProject.title = titleInput.value || '새 프로젝트';
                }

                this.currentProject.updatedAt = new Date().toISOString();

                // 공유 링크로 불러온 프로젝트라면, 저장 시 새로운 ID를 부여하여 '포크(복제)' 처리
                if (this.isSharedLoad) {
                    const oldId = this.currentProject.id;
                    this.currentProject.id = window.AuthManager?.isAuthenticated ? crypto.randomUUID() : this.generateId();
                    this.currentProject.title = (this.currentProject.title || '새 프로젝트') + ' (복사본)';
                    this.currentProject.isPublic = false;
                    this.currentProject.shareId = null;
                    this.isSharedLoad = false;

                    console.log(`Project forked: ${oldId} -> ${this.currentProject.id}`);

                    if (window.history.replaceState) {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }

                localStorage.setItem('codecanvas_current_project', JSON.stringify(this.currentProject));

                const index = this.allProjects.findIndex(p => p.id === this.currentProject.id);
                if (index >= 0) {
                    this.allProjects[index] = { ...this.currentProject };
                } else {
                    this.allProjects.unshift(this.currentProject);
                }

                this.saveAllProjects();
                this.renderProjectList();
                this.hasUnsavedChanges = false;

                if (window.AuthManager?.isAuthenticated) {
                    const ok = await this.pushToCloud(this.currentProject);
                    if (!ok) {
                        this.updateSaveStatus('error');
                        if (window.showErrorNotification) {
                            window.showErrorNotification('클라우드 저장에 실패했습니다. (기기에는 저장됨)');
                        }
                        return;
                    }
                }

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

    // 프로젝트를 Supabase에 upsert
    async pushToCloud(project) {
        if (!window.AuthManager?.isAuthenticated || !window.AuthManager.user) return false;

        try {
            const { error } = await supabase.from('projects').upsert({
                id: project.id,
                user_id: window.AuthManager.user.id,
                title: project.title,
                html: project.code?.html ?? '',
                css: project.code?.css ?? '',
                js: project.code?.js ?? '',
                is_public: project.isPublic ?? false,
                shared_id: project.shareId ?? null,
                updated_at: project.updatedAt,
            });
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('클라우드 저장 실패:', error);
            return false;
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

            if (window.AuthManager?.isAuthenticated && this._isCloudId(projectId)) {
                supabase.from('projects').delete().eq('id', projectId).then(({ error }) => {
                    if (error) console.error('클라우드 삭제 실패:', error);
                });
            }

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
        if (!projectList) return;

        projectList.querySelectorAll('.project-item').forEach(item => item.remove());

        const searchQuery = (document.getElementById('project-search')?.value || '').toLowerCase().trim();
        let filtered = searchQuery
            ? this.allProjects.filter(p => (p.title || '').toLowerCase().includes(searchQuery))
            : [...this.allProjects];

        const sortKey = document.getElementById('project-sort')?.value || 'modified';
        filtered.sort((a, b) => {
            if (sortKey === 'name') return (a.title || '').localeCompare(b.title || '', 'ko');
            if (sortKey === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        if (filtered.length === 0) {
            if (searchQuery) {
                const empty = document.createElement('div');
                empty.className = 'project-empty';
                empty.textContent = '검색 결과가 없습니다.';
                projectList.appendChild(empty);
            }
            return;
        }

        filtered.forEach(project => {
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
        }, 2000);
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

    // ID 생성 (게스트/로컬 전용 프로젝트)
    generateId() {
        return 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    },

    // --- 공유 기능 (Supabase) ---

    // 프로젝트를 공개로 전환하고 클라우드에 저장 (공유 링크 생성용)
    async saveToCloud(project = this.currentProject) {
        if (!project) return null;

        if (!window.AuthManager?.isAuthenticated) {
            if (window.showErrorNotification) {
                window.showErrorNotification('공유하려면 먼저 로그인해주세요.');
            }
            return null;
        }

        if (window.EditorManager) {
            project.code = window.EditorManager.getCode();
            const titleInput = document.getElementById('project-title');
            if (titleInput) project.title = titleInput.value || project.title;
        }

        project.isPublic = true;
        if (!project.shareId) project.shareId = this.generateId();
        project.updatedAt = new Date().toISOString();

        this.updateSaveStatus('saving');
        const ok = await this.pushToCloud(project);
        if (!ok) {
            this.updateSaveStatus('error');
            return null;
        }

        localStorage.setItem('codecanvas_current_project', JSON.stringify(project));
        const index = this.allProjects.findIndex(p => p.id === project.id);
        if (index >= 0) this.allProjects[index] = { ...project };
        else this.allProjects.unshift(project);
        this.saveAllProjects();

        this.updateSaveStatus('saved');
        return project.id;
    },

    // 공유 링크로 프로젝트 로드 (로그인 불필요, 공개 프로젝트만)
    async loadFromCloud(projectId) {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .eq('is_public', true)
                .single();

            if (error || !data) return null;
            return this._fromRow(data);
        } catch (error) {
            console.error('공유 프로젝트 로드 실패:', error);
            return null;
        }
    },
};

// 전역 객체로 등록
window.ProjectManager = ProjectManager;

// drive.js - Google Drive API 관리 (향후 구현)

export const DriveManager = {
    initialized: false,

    async init() {
        console.log('Drive module initialized (Google Drive API will be implemented later)');
    },

    async listProjects() {
        // TODO: Google Drive에서 프로젝트 목록 가져오기
        return [];
    },

    async saveProject(project) {
        // TODO: Google Drive에 프로젝트 저장
        console.log('Save to Drive (not implemented):', project);
    },

    async loadProject(projectId) {
        // TODO: Google Drive에서 프로젝트 불러오기
        return null;
    },

    async deleteProject(projectId) {
        // TODO: Google Drive에서 프로젝트 삭제
        console.log('Delete from Drive (not implemented):', projectId);
    },
};

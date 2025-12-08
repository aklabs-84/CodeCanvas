// thumbnail.js - 썸네일 생성 관리 (향후 html2canvas 사용)

export const ThumbnailManager = {
    init() {
        console.log('Thumbnail manager initialized');
    },

    async generateThumbnail() {
        // TODO: html2canvas로 썸네일 생성
        console.log('Thumbnail generation (not implemented yet)');
        return null;
    },
};

// 전역 객체로 등록
window.ThumbnailManager = ThumbnailManager;

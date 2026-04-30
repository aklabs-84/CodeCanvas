// share.js - 공유 기능 관리
import { CONFIG } from './config.js';
import { ProjectManager } from './projects.js';

export const ShareManager = {
    init() {
        console.log('Share manager initialized');
        this.attachEventListeners();
    },

    attachEventListeners() {
        const btnShare = document.getElementById('btn-share');
        const btnCopyLink = document.getElementById('btn-copy-link');
        const modal = document.getElementById('share-modal');

        btnShare?.addEventListener('click', () => {
            this.openShareModal();
        });

        // 공유 모달 내 닫기 버튼만 정확히 선택 (app.js의 공통 처리와 중복 방지)
        modal?.querySelector('.btn-close-modal')?.addEventListener('click', () => {
            this.closeShareModal();
        });

        btnCopyLink?.addEventListener('click', () => {
            this.copyShareLink();
        });

        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeShareModal();
            }
        });
    },

    async openShareModal() {
        const modal = document.getElementById('share-modal');
        const shareLinkInput = document.getElementById('share-link');
        const btnCopyLink = document.getElementById('btn-copy-link');

        if (!modal) return;

        modal.classList.remove('hidden');
        
        if (shareLinkInput) {
            shareLinkInput.value = '생성 중...';
            if (btnCopyLink) btnCopyLink.disabled = true;
        }

        // 1. 클라우드에 저장
        const projectId = await ProjectManager.saveToCloud();

        // 2. 링크 생성
        if (projectId && shareLinkInput) {
            const baseUrl = CONFIG.SHARE_BASE_URL;
            const fullLink = `${baseUrl}?p=${projectId}`;
            shareLinkInput.value = fullLink;
            if (btnCopyLink) btnCopyLink.disabled = false;
        } else if (shareLinkInput) {
            shareLinkInput.value = '공유 실패 (GAS URL 설정을 확인하세요)';
        }
    },

    closeShareModal() {
        const modal = document.getElementById('share-modal');
        modal?.classList.add('hidden');
    },

    async copyShareLink() {
        const shareLink = document.getElementById('share-link');
        if (shareLink) {
            try {
                await navigator.clipboard.writeText(shareLink.value);
                if (window.showSuccessNotification) {
                    window.showSuccessNotification('링크가 클립보드에 복사되었습니다.');
                }
            } catch (error) {
                console.error('Failed to copy link:', error);
                if (window.showErrorNotification) {
                    window.showErrorNotification('링크 복사에 실패했습니다.');
                }
            }
        }
    },
};

// 전역 객체로 등록
window.ShareManager = ShareManager;

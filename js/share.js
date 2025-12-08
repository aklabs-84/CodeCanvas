// share.js - 공유 기능 관리 (향후 구현)

export const ShareManager = {
    init() {
        console.log('Share manager initialized');
        this.attachEventListeners();
    },

    attachEventListeners() {
        const btnShare = document.getElementById('btn-share');
        const btnCloseModal = document.querySelector('.btn-close-modal');
        const btnCopyLink = document.getElementById('btn-copy-link');
        const modal = document.getElementById('share-modal');

        btnShare?.addEventListener('click', () => {
            this.openShareModal();
        });

        btnCloseModal?.addEventListener('click', () => {
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

    openShareModal() {
        const modal = document.getElementById('share-modal');
        modal?.classList.remove('hidden');

        // TODO: 실제 공유 링크 생성
        const shareLink = document.getElementById('share-link');
        if (shareLink) {
            shareLink.value = 'https://codecanvas.vercel.app/view/demo (구현 예정)';
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

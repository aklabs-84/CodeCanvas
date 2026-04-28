// app.js - 앱 초기화 및 전역 관리

import { LayoutManager } from './layout.js';
import { ThemeManager } from './theme.js';
import { EditorManager } from './editor.js';
import { PreviewManager } from './preview.js';
import { ProjectManager } from './projects.js';
import { SidebarManager } from './sidebar.js';
import { ShareManager } from './share.js';
import { AuthManager } from './auth.js';
import { DownloadManager } from './download.js';

// 전역 객체로 등록 (다른 모듈에서 접근 가능하도록)
window.LayoutManager = LayoutManager;
window.ThemeManager = ThemeManager;
window.EditorManager = EditorManager;
window.PreviewManager = PreviewManager;
window.ProjectManager = ProjectManager;
window.SidebarManager = SidebarManager;
window.ShareManager = ShareManager;
window.AuthManager = AuthManager;
window.DownloadManager = DownloadManager;

// 앱 초기화
async function initApp() {
    console.log('🎨 Initializing CodeCanvas...');

    try {
        // 1. 테마 초기화
        ThemeManager.init();
        console.log('✅ Theme initialized');

        // 2. 레이아웃 초기화
        LayoutManager.init();
        console.log('✅ Layout initialized');

        // 3. 프로젝트 관리 초기화
        ProjectManager.init();
        console.log('✅ Project manager initialized');

        // 4. 에디터 초기화
        await EditorManager.init();
        console.log('✅ Editor initialized');

        // 5. 미리보기 초기화
        PreviewManager.init();
        console.log('✅ Preview initialized');

        // 6. 사이드바 초기화
        SidebarManager.init();
        console.log('✅ Sidebar initialized');

        // 7. 공유 관리 초기화
        ShareManager.init();
        console.log('✅ Share manager initialized');

        // 8. 인증 초기화
        AuthManager.init();
        console.log('✅ Auth initialized');

        // 9. 다운로드 관리 초기화
        DownloadManager.init();
        console.log('✅ Download manager initialized');

        // 9.5. 인증 관리 초기화
        AuthManager.init();
        console.log('✅ Auth system initialized');

        // 10. 뷰 모드 -> 에디터 모드 전환 버튼
        const btnGoEdit = document.getElementById('btn-go-edit');
        btnGoEdit?.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.remove('view-mode');
            // 에디터와 사이드바 다시 표시
            if (window.SidebarManager) window.SidebarManager.expand();
            showSuccessNotification('에디터 모드로 전환되었습니다.');
        });

        // 11. 저장 버튼 이벤트
        const btnSave = document.getElementById('btn-save');
        btnSave?.addEventListener('click', async () => {
            // 로컬 저장
            ProjectManager.saveCurrentProject();
            
            // 클라우드 동기화 (구글 시트)
            if (window.CONFIG && window.CONFIG.GAS_APP_URL) {
                const synced = await ProjectManager.saveToCloud();
                if (synced) {
                    console.log('✅ Cloud sync successful');
                }
            }
        });

        // --- 인증(로그인/회원가입) 모달 로직 ---
        const loginModal = document.getElementById('login-modal');
        const btnLogin = document.getElementById('btn-login');
        const authForm = document.getElementById('auth-form');
        const authTitle = document.getElementById('auth-title');
        const btnAuthSubmit = document.getElementById('btn-auth-submit');
        const linkToggleAuth = document.getElementById('link-toggle-auth');
        const authToggleText = document.getElementById('auth-toggle-text');
        
        let isSignupMode = false;

        btnLogin?.addEventListener('click', () => {
            if (AuthManager.isAuthenticated) return; // 이미 로그인된 상태면 AuthManager.updateUI에서 로그아웃 처리함
            loginModal.classList.remove('hidden');
        });

        linkToggleAuth?.addEventListener('click', (e) => {
            e.preventDefault();
            isSignupMode = !isSignupMode;
            authTitle.textContent = isSignupMode ? '회원가입' : '로그인';
            btnAuthSubmit.textContent = isSignupMode ? '가입하기' : '로그인';
            authToggleText.innerHTML = isSignupMode 
                ? '이미 계정이 있으신가요? <a href="#" id="link-toggle-auth">로그인</a>'
                : '계정이 없으신가요? <a href="#" id="link-toggle-auth">회원가입</a>';
            
            // 이벤트 리스너 재연결 (innerHTML 교체 때문)
            document.getElementById('link-toggle-auth').onclick = (e) => linkToggleAuth.click();
        });

        authForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('auth-username').value;
            const password = document.getElementById('auth-password').value;

            btnAuthSubmit.disabled = true;
            btnAuthSubmit.textContent = isSignupMode ? '가입 중...' : '로그인 중...';

            if (isSignupMode) {
                const result = await AuthManager.signup(username, password);
                if (result.status === 'success') {
                    showSuccessNotification('회원가입 성공! 로그인해 주세요.');
                    isSignupMode = false;
                    authTitle.textContent = '로그인';
                    btnAuthSubmit.textContent = '로그인';
                } else {
                    showErrorNotification(result.message);
                }
            } else {
                const result = await AuthManager.login(username, password);
                if (result.status === 'success') {
                    showSuccessNotification(`${username}님, 환영합니다!`);
                    loginModal.classList.add('hidden');
                } else {
                    showErrorNotification(result.message);
                }
            }
            btnAuthSubmit.disabled = false;
            btnAuthSubmit.textContent = isSignupMode ? '가입하기' : '로그인';
        });

        // 모달 닫기 버튼 공통 처리
        document.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.add('hidden');
            });
        });

        // 11. 공유 프로젝트 체크 및 로드
        const urlParams = new URLSearchParams(window.location.search);
        const sharedId = urlParams.get('p');
        if (sharedId) {
            document.body.classList.add('view-mode');
            console.log('🔗 Loading shared project in view-only mode:', sharedId);
            showSuccessNotification('공유된 프로젝트를 불러오는 중...');
            
            const sharedProject = await ProjectManager.loadFromCloud(sharedId);
            if (sharedProject) {
                ProjectManager.currentProject = sharedProject;
                ProjectManager.isSharedLoad = true; // 공유 프로젝트임을 표시
                ProjectManager.loadProjectToEditor();
                
                // 공유 모드에서는 사이드바 접기
                if (window.SidebarManager) {
                    window.SidebarManager.collapse();
                }
                
                showSuccessNotification('프로젝트를 성공적으로 불러왔습니다!');
            } else {
                showErrorNotification('프로젝트를 불러오지 못했습니다. 링크를 확인해주세요.');
            }
        }

        // 12. 초기 프리뷰 렌더링
        setTimeout(() => {
            PreviewManager.run();
        }, sharedId ? 1000 : 100);

        console.log('✅ CodeCanvas initialized successfully!');
    } catch (error) {
        console.error('❌ Failed to initialize CodeCanvas:', error);
        showErrorNotification('앱 초기화에 실패했습니다. 페이지를 새로고침하거나 설정을 확인해주세요.');
    }
}

// 에러 알림 표시
function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background-color: #dc3545;
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        font-family: var(--font-family);
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// 성공 알림 표시
function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background-color: #28a745;
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        font-family: var(--font-family);
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// 전역 함수로 등록
window.showErrorNotification = showErrorNotification;
window.showSuccessNotification = showSuccessNotification;

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// DOM 로드 완료 후 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// 페이지 언로드 전 저장 확인
window.addEventListener('beforeunload', (e) => {
    // 저장되지 않은 변경사항이 있는지 확인
    if (window.ProjectManager && window.ProjectManager.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?';
    }
});

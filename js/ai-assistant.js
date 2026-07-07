// ai-assistant.js - AI 코드 어시스턴트 (Gemini 프록시 호출 / 개인 API 키 직접 호출)
import { supabase } from './supabase-client.js';
import { CONFIG } from './config.js';

const MODE_LABELS = {
    explain: '현재 코드 설명 요청',
    edit: '코드 수정 요청',
    generate: '코드 생성 요청',
};

const OWN_KEY_STORAGE = 'codecanvas_gemini_api_key';
const MAX_CODE_LENGTH = 8000;

function buildPrompt({ mode, language, code, instruction }) {
    const trimmedCode = (code || '').slice(0, MAX_CODE_LENGTH);

    if (mode === 'explain') {
        return `다음 ${language} 코드를 한국어로 친절하게 설명해줘.\n\n\`\`\`${language}\n${trimmedCode}\n\`\`\``;
    }
    if (mode === 'edit') {
        return `다음 ${language} 코드를 아래 요청에 맞게 수정해줘. 수정된 전체 코드만 코드블록으로 출력하고, 그 외 설명은 하지 마.\n\n요청: ${instruction}\n\n현재 코드:\n\`\`\`${language}\n${trimmedCode}\n\`\`\``;
    }
    return `다음 요청에 맞는 ${language} 코드를 생성해줘. 코드만 코드블록으로 출력하고, 그 외 설명은 하지 마.\n\n요청: ${instruction}`;
}

function extractCode(text) {
    const match = text.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
    return match ? match[1].trim() : null;
}

export const AiAssistant = {
    canUse: false, // 관리자 또는 관리자가 허용한 유저 (공용 프록시 사용 가능)
    _isLoggedIn: false,
    _mode: 'explain',
    _extractedCode: null,

    init() {
        this.modal = document.getElementById('ai-assistant-modal');
        this.aiButton = document.getElementById('btn-ai-assistant');
        this.keySetup = document.getElementById('ai-key-setup');
        this.requestArea = document.getElementById('ai-request-area');
        this.ownKeyInput = document.getElementById('ai-own-key-input');
        this.saveKeyBtn = document.getElementById('btn-ai-save-key');
        this.changeKeyBtn = document.getElementById('btn-ai-change-key');
        this.instructionInput = document.getElementById('ai-instruction');
        this.submitBtn = document.getElementById('btn-ai-submit');
        this.responseEl = document.getElementById('ai-response');
        this.applyBtn = document.getElementById('btn-ai-apply');
        this._attachEventListeners();
    },

    _attachEventListeners() {
        this.aiButton?.addEventListener('click', () => this.open());
        this.modal?.querySelector('.btn-close-modal')?.addEventListener('click', () => this.close());
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        document.querySelectorAll('.ai-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => this._switchMode(btn.dataset.aiMode));
        });

        this.submitBtn?.addEventListener('click', () => this._submit());
        this.applyBtn?.addEventListener('click', () => this._applyCode());
        this.saveKeyBtn?.addEventListener('click', () => this._saveOwnKey());
        this.changeKeyBtn?.addEventListener('click', () => this._clearOwnKey());
    },

    _ownKey() {
        return localStorage.getItem(OWN_KEY_STORAGE) || '';
    },

    // auth.js의 onAuthStateChange에서 로그인 상태가 바뀔 때마다 호출됨
    async onAuthChange(isAuthenticated) {
        this._isLoggedIn = isAuthenticated;
        if (!isAuthenticated) {
            this.canUse = false;
            this.aiButton?.classList.add('hidden');
            return;
        }

        const email = window.AuthManager?.user?.email;
        if (email === CONFIG.ADMIN_EMAIL) {
            this.canUse = true;
        } else {
            const { data } = await supabase.from('profiles').select('can_use_ai').maybeSingle();
            this.canUse = data?.can_use_ai === true;
        }

        // 로그인한 유저는 누구나 AI 버튼을 볼 수 있음 (관리자 허용 또는 본인 키로 사용 가능)
        this.aiButton?.classList.remove('hidden');
    },

    open() {
        if (!this._isLoggedIn) {
            window.showErrorNotification?.('로그인이 필요합니다.');
            return;
        }
        this.modal?.classList.remove('hidden');
        this._renderAccessState();
    },

    close() {
        this.modal?.classList.add('hidden');
    },

    _renderAccessState() {
        const hasAccess = this.canUse || !!this._ownKey();
        this.keySetup?.classList.toggle('hidden', hasAccess);
        this.requestArea?.classList.toggle('hidden', !hasAccess);
        this.changeKeyBtn?.classList.toggle('hidden', this.canUse || !this._ownKey());
    },

    _saveOwnKey() {
        const key = this.ownKeyInput?.value.trim();
        if (!key) {
            window.showErrorNotification?.('API 키를 입력해주세요.');
            return;
        }
        localStorage.setItem(OWN_KEY_STORAGE, key);
        this.ownKeyInput.value = '';
        window.showSuccessNotification?.('API 키가 저장되었습니다. 이 브라우저에서만 사용됩니다.');
        this._renderAccessState();
    },

    _clearOwnKey() {
        localStorage.removeItem(OWN_KEY_STORAGE);
        this._renderAccessState();
    },

    _switchMode(mode) {
        this._mode = mode;
        document.querySelectorAll('.ai-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.aiMode === mode));
        this.instructionInput?.classList.toggle('hidden', mode === 'explain');
        if (this.submitBtn) this.submitBtn.textContent = MODE_LABELS[mode];
        this.responseEl?.classList.add('hidden');
        this.applyBtn?.classList.add('hidden');
        this._extractedCode = null;
    },

    _currentLanguage() {
        const mode = window.EditorManager?.currentMode;
        return mode === 'unified' ? 'html' : (mode || 'html');
    },

    async _submit() {
        const language = this._currentLanguage();
        const code = window.EditorManager?.code?.[language] || '';
        const instruction = this.instructionInput?.value.trim() || '';

        if (this._mode !== 'explain' && !instruction) {
            window.showErrorNotification?.('요청 내용을 입력해주세요.');
            return;
        }

        this.submitBtn.disabled = true;
        this.submitBtn.textContent = '요청 중...';
        this.responseEl?.classList.remove('hidden');
        if (this.responseEl) this.responseEl.textContent = 'AI가 답변을 생성하고 있습니다...';
        this.applyBtn?.classList.add('hidden');

        const payload = { mode: this._mode, language, code, instruction };

        try {
            const result = this.canUse
                ? await this._requestViaProxy(payload)
                : await this._requestDirect(payload);

            if (this.responseEl) this.responseEl.textContent = result.text;
            this._extractedCode = result.code;
            this.applyBtn?.classList.toggle('hidden', !result.code);
        } catch (error) {
            console.error('AI 요청 실패:', error);
            if (this.responseEl) this.responseEl.textContent = `오류: ${error.message}`;
        } finally {
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = MODE_LABELS[this._mode];
        }
    },

    // 관리자/화이트리스트 유저: 서버 프록시(api/ai-assistant.js) 경유
    async _requestViaProxy(payload) {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/ai-assistant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'AI 요청에 실패했습니다.');
        return data;
    },

    // 일반 유저: 본인이 입력한 API 키로 브라우저에서 Gemini 직접 호출
    async _requestDirect({ mode, language, code, instruction }) {
        const key = this._ownKey();
        if (!key) throw new Error('API 키가 설정되어 있지 않습니다.');

        const prompt = buildPrompt({ mode, language, code, instruction });

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            }
        );

        if (!res.ok) {
            throw new Error(`Gemini 호출에 실패했습니다 (${res.status}). API 키를 확인해주세요.`);
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return { text, code: mode !== 'explain' ? extractCode(text) : null };
    },

    _applyCode() {
        if (!this._extractedCode) return;
        const language = this._currentLanguage();
        const editor = window.EditorManager?.editors?.[language];
        if (!editor) return;

        editor.setValue(this._extractedCode);
        window.showSuccessNotification?.('AI가 생성한 코드가 적용되었습니다.');
        this.close();
    },
};

window.AiAssistant = AiAssistant;

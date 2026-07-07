// api/ai-assistant.js - Gemini API 프록시 (Vercel Edge Function)
// Gemini API 키는 이 서버 코드 안에서만 사용되며 프론트엔드로 절대 노출되지 않음

export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const MAX_CODE_LENGTH = 8000;

async function getUserFromToken(token) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) return null;
    return res.json();
}

async function canUseAi(token, email) {
    if (email === ADMIN_EMAIL) return true;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=can_use_ai`, {
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) return false;
    const rows = await res.json();
    return rows?.[0]?.can_use_ai === true;
}

function buildPrompt({ mode, language, code, instruction }) {
    const trimmedCode = (code || '').slice(0, MAX_CODE_LENGTH);

    if (mode === 'explain') {
        return `다음 ${language} 코드를 한국어로 친절하게 설명해줘.\n\n\`\`\`${language}\n${trimmedCode}\n\`\`\``;
    }
    if (mode === 'edit') {
        return `다음 ${language} 코드를 아래 요청에 맞게 수정해줘. 수정된 전체 코드만 코드블록으로 출력하고, 그 외 설명은 하지 마.\n\n요청: ${instruction}\n\n현재 코드:\n\`\`\`${language}\n${trimmedCode}\n\`\`\``;
    }
    // generate
    return `다음 요청에 맞는 ${language} 코드를 생성해줘. 코드만 코드블록으로 출력하고, 그 외 설명은 하지 마.\n\n요청: ${instruction}`;
}

function extractCode(text) {
    const match = text.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
    return match ? match[1].trim() : null;
}

export default async function handler(request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
        return new Response(JSON.stringify({ error: '로그인이 필요합니다.' }), { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user?.email) {
        return new Response(JSON.stringify({ error: '인증에 실패했습니다.' }), { status: 401 });
    }

    const allowed = await canUseAi(token, user.email);
    if (!allowed) {
        return new Response(JSON.stringify({ error: 'AI 기능 사용 권한이 없습니다. 관리자에게 문의하세요.' }), { status: 403 });
    }

    const body = await request.json();
    const prompt = buildPrompt(body);

    const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
            }),
        }
    );

    if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        return new Response(JSON.stringify({ error: 'AI 응답 생성에 실패했습니다.', detail: errText }), { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const code = body.mode !== 'explain' ? extractCode(text) : null;

    return new Response(JSON.stringify({ text, code }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

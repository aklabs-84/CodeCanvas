// CodeCanvas에서 작성한 코드 결과물을 AIServiceHub 경유로 ClassLog에 제출하는 프록시.
// CODECANVAS_API_KEY는 이 함수(서버) 안에서만 사용되며 클라이언트에는 절대 내려가지 않는다.

async function handler(request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const baseUrl = process.env.AISERVICEHUB_BASE_URL;
    const apiKey = process.env.CODECANVAS_API_KEY;
    if (!baseUrl || !apiKey) {
        return new Response(
            JSON.stringify({ error: 'AISERVICEHUB_BASE_URL / CODECANVAS_API_KEY 환경변수가 설정되지 않았습니다.' }),
            { status: 500 }
        );
    }

    const body = await request.json().catch(() => null);
    const { entryCode, studentId, studentName, title, resultType, linkUrl, textContent } = body || {};
    if (!entryCode || !title || !resultType) {
        return new Response(JSON.stringify({ error: 'entryCode, title, resultType은 필수입니다' }), { status: 400 });
    }

    try {
        const upstream = await fetch(`${baseUrl}/api/classlog/submission`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
            body: JSON.stringify({ entryCode, studentId, studentName, title, resultType, linkUrl, textContent }),
        });
        const data = await upstream.json().catch(() => null);
        return new Response(JSON.stringify(data), { status: upstream.status });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 502 });
    }
}

export default { fetch: handler };

// CodeCanvas에서 작성한 코드 결과물을 AIServiceHub 경유로 ClassLog에 제출하는 프록시.
// CODECANVAS_API_KEY는 이 함수(서버) 안에서만 사용되며 클라이언트에는 절대 내려가지 않는다.
// 받은 body를 그대로 넘기지 않고 허용한 필드만·길이 제한·https 링크만 통과시키며,
// 자세한 오류 내용은 서버 로그에만 남기고 학생 화면에는 일반 문구만 돌려준다.

const RESULT_TYPES = ['link', 'text', 'image', 'file'];
const TEXT_MAX = 20000;
const FILE_DATA_MAX = 5_000_000; // base64 문자 수 (원본 3MB ≈ 4MB 문자)

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const json = (data, status) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

async function handler(request) {
    if (request.method !== 'POST') {
        return json({ error: 'Method not allowed' }, 405);
    }

    const baseUrl = process.env.AISERVICEHUB_BASE_URL;
    const apiKey = process.env.CODECANVAS_API_KEY;
    if (!baseUrl || !apiKey) {
        console.error('submit proxy: AISERVICEHUB_BASE_URL / CODECANVAS_API_KEY 환경변수가 설정되지 않았습니다.');
        return json({ error: '서버 설정이 필요해요' }, 500);
    }

    // 같은 사이트에서 보낸 요청인지 확인 (보조 수단 — 최종 검증은 AIServiceHub 쪽 몫)
    const origin = request.headers.get('origin');
    if (origin) {
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || new URL(request.url).host;
        let originHost = '';
        try { originHost = new URL(origin).host; } catch { /* 잘못된 Origin은 아래에서 거절 */ }
        if (!originHost || originHost !== host) {
            return json({ error: 'Forbidden' }, 403);
        }
    }

    const raw = await request.json().catch(() => null);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return json({ error: 'Invalid body' }, 400);
    }

    // 허용한 필드만 골라서 길이 제한
    const body = {
        entryCode: str(raw.entryCode, 100),
        studentId: str(raw.studentId, 100) || undefined,
        studentName: str(raw.studentName, 100) || undefined,
        title: str(raw.title, 200),
        resultType: raw.resultType,
        linkUrl: str(raw.linkUrl, 2000) || undefined,
        textContent: str(raw.textContent, TEXT_MAX + 1) || undefined,
        fileName: str(raw.fileName, 200) || undefined,
        fileData: str(raw.fileData, FILE_DATA_MAX + 1) || undefined,
    };

    if (!body.entryCode || !body.title) {
        return json({ error: 'entryCode, title은 필수예요' }, 400);
    }
    if (!RESULT_TYPES.includes(body.resultType)) {
        return json({ error: 'resultType은 link, text, image, file 중 하나여야 해요' }, 400);
    }
    // 코드를 말없이 잘라서 보내면 학생 코드가 사라지므로, 넘치면 잘라 보내지 않고 알려준다
    if (body.textContent && body.textContent.length > TEXT_MAX) {
        return json({ error: `코드가 너무 길어요(${TEXT_MAX.toLocaleString('ko-KR')}자 초과). 로그인한 뒤 링크로 제출해 주세요.` }, 413);
    }
    if (body.fileData && body.fileData.length > FILE_DATA_MAX) {
        return json({ error: '파일이 너무 커요. 3MB 이하 파일만 낼 수 있어요.' }, 413);
    }
    if ((body.resultType === 'image' || body.resultType === 'file') && (!body.fileName || !body.fileData)) {
        return json({ error: '파일 이름과 내용이 필요해요' }, 400);
    }
    if (body.resultType === 'link' && !body.linkUrl) {
        return json({ error: '링크 주소가 필요해요' }, 400);
    }
    if (body.resultType === 'text' && !body.textContent) {
        return json({ error: '제출할 내용이 필요해요' }, 400);
    }
    if (body.linkUrl && !/^https:\/\//i.test(body.linkUrl)) {
        return json({ error: '링크는 https:// 로 시작해야 해요' }, 400);
    }

    try {
        const upstream = await fetch(`${baseUrl}/api/classlog/submission`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
            body: JSON.stringify(body),
        });
        const data = await upstream.json().catch(() => ({}));
        return json(data, upstream.status);
    } catch (err) {
        console.error('submit proxy failed', err); // 자세한 내용은 서버 로그에만
        return json({ error: '제출 서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.' }, 502);
    }
}

export default { fetch: handler };

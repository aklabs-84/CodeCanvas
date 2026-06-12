# CodeCanvas Phase 3 개발 계획

> 작성일: 2026-06-12  
> 전제: Phase 1(핵심 버그 수정) + Phase 2(UX 개선) 완료 상태

---

## 배경 및 목표

Phase 1~2를 통해 붙여넣기 자동 분리, 자동 실행, 스니펫 팔레트, 리사이저 정상화 등 기본 안정성을 확보했다.
Phase 3에서는 **차별화 기능** 4가지를 추가하여 단순 에디터를 넘어선 실용 도구로 발전시킨다.

---

## 기능 1 — 디바이스 시뮬레이터

### 개요
미리보기 iframe을 모바일/태블릿/데스크탑 크기로 고정해 반응형 결과를 즉시 확인한다.

### 구현 방법
- 미리보기 헤더에 디바이스 버튼 3개 추가 (`📱 375` / `📟 768` / `🖥 1280` / `전체`)
- `#preview-frame`에 고정 너비/높이를 인라인 스타일로 적용, 부모는 `overflow: hidden; display:flex; justify-content:center`
- 현재 선택된 디바이스를 localStorage에 저장

### 수정 파일
- `index.html` — 디바이스 버튼 추가 (미리보기 헤더)
- `js/preview.js` — `setDevice(size)`, `_loadDevicePreference()` 메서드 추가
- `css/panels.css` — 디바이스 프레임 스타일 (스케일 조정 포함)

### 난이도: 낮음 (순수 CSS/JS, 외부 의존성 없음)

---

## 기능 2 — CDN 라이브러리 검색

### 개요
cdnjs.com API로 라이브러리를 검색해 `<script>` / `<link>` 태그를 에디터에 자동 삽입한다.

### 구현 방법
- 헤더에 "라이브러리 추가" 버튼 → 검색 모달 오픈
- 검색 입력 → `https://api.cdnjs.com/libraries?search={query}&fields=name,version,description,latest` 호출
- 결과 목록에서 선택 → 현재 탭(HTML 우선)에 태그 삽입 (Monaco `executeEdits`)
- script 태그는 `<body>` 끝 위치, CSS link는 `<head>` 위치 자동 판별

### 수정 파일
- `index.html` — CDN 검색 모달, "라이브러리" 버튼
- `js/cdn-search.js` (신규) — `CdnSearchManager` 모듈
- `css/editor.css` — CDN 검색 모달 스타일

### 주의사항
- cdnjs API는 CORS 허용으로 프론트에서 직접 호출 가능 (프록시 불필요)
- 검색 결과 debounce 300ms 적용

### 난이도: 낮음~중간

---

## 기능 3 — Supabase 마이그레이션

### 개요
현재 localStorage + GAS 저장 방식을 Supabase(PostgreSQL + Auth)로 교체한다.
멀티기기 동기화, 실시간 저장, 안전한 인증을 제공한다.

### 현재 구조 (AS-IS)
- `projects.js`: `localStorage` 기반 CRUD + GAS URL로 선택적 클라우드 동기화
- `auth.js`: 자체 해싱 기반 인증 (localStorage 세션)

### 목표 구조 (TO-BE)
- Supabase `projects` 테이블: `id, user_id, title, html, css, js, created_at, updated_at`
- Supabase Auth (이메일/패스워드) → 기존 auth.js 교체
- RLS 정책: `user_id = auth.uid()` (자신의 프로젝트만 접근)
- 오프라인 폴백: localStorage 캐시 유지

### DB 스키마
```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null default '새 프로젝트',
  html text default '',
  css  text default '',
  js   text default '',
  is_public boolean default false,
  shared_id text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table projects enable row level security;

create policy "자신의 프로젝트만" on projects
  using (auth.uid() = user_id);
```

### 수정 파일
- `js/projects.js` — Supabase 클라이언트로 교체 (기존 GAS 로직 제거)
- `js/auth.js` — Supabase Auth로 교체 (signIn/signUp/signOut)
- `index.html` — Supabase CDN 추가
- `js/config.js` (신규) — SUPABASE_URL, SUPABASE_ANON_KEY

### 주의사항
- API 키는 `anon key`만 사용 (RLS로 보호됨)
- 기존 localStorage 프로젝트 마이그레이션 유틸 필요
- 공유(share) 기능: `is_public + shared_id` 컬럼으로 대체

### 난이도: 중간~높음 (Supabase 프로젝트 생성 필요)

---

## 기능 4 — AI 코드 어시스턴트

### 개요
Gemini API를 활용해 현재 에디터 코드를 AI가 설명하거나 수정/생성해주는 기능.

### 핵심 기능
1. **코드 설명** — 현재 탭 코드를 분석해 한국어 설명 출력
2. **코드 수정 요청** — "버튼을 파란색으로 변경해줘" 같은 자연어 입력 → 코드 자동 수정
3. **코드 생성** — 빈 에디터에서 "로그인 폼 만들어줘" → HTML/CSS/JS 생성

### 구현 방법
- 에디터 헤더에 "AI" 버튼 → AI 패널 슬라이드 오픈
- 입력창 + 전송 버튼 + 응답 출력 영역
- API 호출: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **API 키 노출 방지**: Cloudflare Worker 또는 Vercel Edge Function 프록시 경유

### 프록시 구조 (예시 — Cloudflare Worker)
```js
// worker.js
export default {
  async fetch(request) {
    const { prompt } = await request.json();
    const res = await fetch(`https://generativelanguage.googleapis.com/...`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    return new Response(await res.text(), { headers: { 'Content-Type': 'application/json' } });
  }
}
```

### 수정 파일
- `index.html` — AI 패널 UI
- `js/ai-assistant.js` (신규) — `AiAssistant` 모듈
- `css/panels.css` — AI 패널 스타일
- Cloudflare Worker (별도 배포)

### 주의사항
- Gemini API 키는 반드시 서버사이드(프록시)에서만 사용
- 스트리밍 응답 처리 (EventSource 또는 청크 방식)
- 토큰 한도 대비 코드 길이 제한 (8000자 이상은 요약 전달)

### 난이도: 높음 (프록시 서버 배포 필요)

---

## 권장 구현 순서

```
1. 디바이스 시뮬레이터  ← 가장 빠르게 완성 가능, 즉각적 UX 향상
2. CDN 라이브러리 검색  ← API 호출만, 백엔드 불필요
3. Supabase 마이그레이션 ← 기반 인프라 정비, 이후 기능의 토대
4. AI 코드 어시스턴트   ← 프록시 서버 포함, 가장 복잡
```

---

## 현재 코드베이스 연결 포인트

| Phase 3 기능 | 연결 위치 |
|---|---|
| 디바이스 시뮬레이터 | `js/preview.js` `PreviewManager`, `#preview-frame` |
| CDN 검색 | `js/snippets.js` 패턴 참고, `EditorManager.editors[lang]` |
| Supabase | `js/projects.js`, `js/auth.js` 전면 교체 |
| AI 어시스턴트 | `EditorManager.getCode()` / `EditorManager.setCode()` 활용 |

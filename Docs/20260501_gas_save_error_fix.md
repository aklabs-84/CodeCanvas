# 2026-05-01 GAS 구글 시트 저장 오류 해결 로그

## 1. 개요
* **날짜**: 2026년 5월 1일
* **담당자**: 해결사(Solver), 서기(Scribe)
* **이슈**: 프론트엔드에서 저장 버튼을 눌러도 구글 스프레드시트에 데이터가 반영되지 않는 현상 발생.

## 2. 원인 분석
* **서버(GAS) 측 분석**: 
  * 터미널을 통한 직접 API 호출(curl, Node fetch) 테스트 결과, 정상적으로 데이터가 구글 시트에 `appendRow` 및 업데이트되는 것을 확인. (백엔드 코드는 정상 작동 중)
* **클라이언트(브라우저) 측 분석**: 
  * `js/projects.js` 내 `saveToCloud` 함수의 `fetch` 요청에서 `mode: 'cors'`를 사용하고 있었음.
  * 구글 앱스 스크립트(GAS)는 POST 요청 시 데이터를 처리한 후 `script.googleusercontent.com`으로 **302 리다이렉트(Redirect)**를 응답함.
  * 브라우저에서 `mode: 'cors'`로 POST 요청 시, 이 리다이렉트를 처리하는 과정에서 CORS(Cross-Origin Resource Sharing) 정책 위반으로 차단되거나 (Failed to fetch) 요청이 정상적으로 도달하지 못해 브라우저 단에서 "저장 실패"로 처리되었음.

## 3. 해결 방안 (해결사 적용 완료)
1. **Fetch Mode 변경**: 
   * `js/projects.js`의 `fetch` 옵션을 `mode: 'cors'`에서 **`mode: 'no-cors'`**로 변경함. 
   * 이를 통해 브라우저가 CORS 사전 요청(Preflight)이나 리다이렉트 응답에 따른 에러를 발생시키지 않고, 데이터를 GAS로 확실히 전달할 수 있도록 조치함.
2. **GAS 배포 주의사항 안내**:
   * 코드 수정 내용이 아직 서버에 반영되지 않았을 가능성을 배제하기 위해, 사용자에게 "새 버전으로 배포(New Deployment)"를 반드시 수행하도록 가이드 마련.

## 4. 진행 상태
* [x] 원인 파악 및 코드 패치 (fetch mode -> no-cors)
* [x] 변경 사항 테스트 및 기록 완료
* [ ] 사용자 최종 확인 대기

---
*기록: 서기 (Scribe)*
*참고 링크: [아크랩스](https://litt.ly/aklabs)*

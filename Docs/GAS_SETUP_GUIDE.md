# Google Apps Script (GAS) 설정 가이드 (통합 리빌딩 버전)

이 문서는 CodeCanvas의 구글 스프레드시트 연동(프로젝트 저장, 불러오기 및 유저 회원가입/로그인 관리)을 위한 통합 백엔드 스크립트 코드와 설정 방법을 안내합니다.

## 1. 구글 스프레드시트 준비

1. [구글 스프레드시트](https://sheets.new)를 새로 만듭니다.
2. 스프레드시트 내에 별도의 수동 시트 생성 작업은 필요하지 않습니다. **아래 Apps Script를 등록하고 배포한 후 최초 API 통신이 일어날 때, 백엔드 코드가 스스로 `projects` 시트와 `users` 시트를 자동 개설하고 헤더 컬럼명을 기입합니다.**
   - `projects` 시트 헤더: `id`, `title`, `html`, `css`, `js`, `author`, `updatedAt`
   - `users` 시트 헤더: `username`, `password`, `createdAt`

---

## 2. Google Apps Script 작성 및 배포

1. 스프레드시트 상단 메뉴에서 **확장 프로그램 > Apps Script**를 클릭합니다.
2. 기존에 있던 코드를 모두 완전히 지우고 아래의 **통합 백엔드 소스코드**를 복사해서 붙여넣습니다.
3. 상단 **저장(💾)** 버튼을 누릅니다.

### [통합 백엔드 소스코드]

```javascript
/**
 * CodeCanvas Unified Backend Script
 * 2026-06-08 전면 리빌딩 버전
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // 10초 동안 쓰기 잠금 시도
  
  try {
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 시트가 없을 경우 자동 생성하여 초기 세팅 편의성 제공
    var projectsSheet = ss.getSheetByName('projects') || ss.insertSheet('projects');
    var usersSheet = ss.getSheetByName('users') || ss.insertSheet('users');
    
    // 헤더(컬럼명) 초기화 확인
    if (projectsSheet.getLastRow() === 0) {
      projectsSheet.appendRow(['id', 'title', 'html', 'css', 'js', 'author', 'updatedAt']);
    }
    if (usersSheet.getLastRow() === 0) {
      usersSheet.appendRow(['username', 'password', 'createdAt']);
    }
    
    // 1. 프로젝트 저장 기능 (save)
    if (action === 'save') {
      var id = contents.id;
      var title = contents.title;
      var code = contents.code;
      var author = contents.author || 'Guest';
      var updatedAt = contents.updatedAt;
      
      var data = projectsSheet.getDataRange().getValues();
      var foundIndex = -1;
      
      // 기존 ID가 있는지 탐색
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
          foundIndex = i + 1;
          break;
        }
      }
      
      if (foundIndex > -1) {
        // 기존 행 업데이트
        projectsSheet.getRange(foundIndex, 2).setValue(title);
        projectsSheet.getRange(foundIndex, 3).setValue(code.html);
        projectsSheet.getRange(foundIndex, 4).setValue(code.css);
        projectsSheet.getRange(foundIndex, 5).setValue(code.js);
        projectsSheet.getRange(foundIndex, 6).setValue(author);
        projectsSheet.getRange(foundIndex, 7).setValue(updatedAt);
      } else {
        // 신규 행 추가
        projectsSheet.appendRow([id, title, code.html, code.css, code.js, author, updatedAt]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', id: id }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. 회원가입 기능 (signup)
    if (action === 'signup') {
      var username = contents.username;
      var password = contents.password;
      
      if (!username || !password) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: '아이디와 비밀번호를 모두 입력해주세요.' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var userData = usersSheet.getDataRange().getValues();
      // 중복 체크
      for (var i = 1; i < userData.length; i++) {
        if (userData[i][0] === username) {
          return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: '이미 존재하는 아이디입니다.' }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      // 가입 정보 시트에 추가
      usersSheet.appendRow([username, password, new Date().toISOString()]);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: '회원가입이 완료되었습니다.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 3. 로그인 기능 (login)
    if (action === 'login') {
      var username = contents.username;
      var password = contents.password;
      
      var userData = usersSheet.getDataRange().getValues();
      for (var i = 1; i < userData.length; i++) {
        if (userData[i][0] === username && userData[i][1] === password) {
          var userObj = { username: username };
          return ContentService.createTextOutput(JSON.stringify({ status: 'success', user: userObj }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: '아이디 또는 비밀번호가 잘못되었습니다.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: '알 수 없는 요청(Action)입니다.' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var id = e.parameter.id;
  var action = e.parameter.action;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var projectsSheet = ss.getSheetByName('projects') || ss.insertSheet('projects');
  
  // 프로젝트 낱개 조회 기능 (get)
  if (action === 'get' && id) {
    var data = projectsSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        var project = {
          id: data[i][0],
          title: data[i][1],
          code: {
            html: data[i][2],
            css: data[i][3],
            js: data[i][4]
          },
          author: data[i][5],
          updatedAt: data[i][6]
        };
        return ContentService.createTextOutput(JSON.stringify({ status: 'success', project: project }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: '해당 프로젝트를 찾을 수 없습니다.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput("CodeCanvas API is running.")
    .setMimeType(ContentService.MimeType.TEXT);
}
```

---

## 3. 웹 앱 배포

1. Apps Script 에디터 우측 상단의 **배포 > 새 배포**를 클릭합니다.
2. 유형 선택(톱니바퀴 아이콘)에서 **웹 앱**을 선택합니다.
3. 설정을 다음과 같이 구성합니다:
   - **설명:** CodeCanvas Unified Backend
   - **다음 사용자로 실행:** 나 (사용자 본인 이메일)
   - **액세스할 수 있는 사용자:** 모든 사용자 (Anyone) - *CORS 연동 및 데이터 저장/조회를 위해 필수 설정입니다.*
4. **배포**를 클릭하고 안내에 따라 승인 절차(고급 > 이동 및 허용)를 진행합니다.
5. 최종 생성된 **웹 앱 URL**을 복사합니다.

---

## 4. 프론트엔드 설정

1. `js/config.js` 파일의 `GAS_APP_URL` 변수에 방금 복사한 웹 앱 URL을 붙여넣습니다.

---
*참고: 아크랩스 공식 홈페이지 [litt.ly/aklabs](https://litt.ly/aklabs)*

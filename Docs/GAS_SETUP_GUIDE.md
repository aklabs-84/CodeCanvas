# Google Apps Script (GAS) 설정 가이드

이 문서는 CodeCanvas의 구글 스프레드시트 연동을 위한 백엔드 스크립트 코드와 설정 방법을 안내합니다.

## 1. 구글 스프레드시트 준비
1. [구글 스프레드시트](https://sheets.new)를 새로 만듭니다.
2. 첫 번째 행(Header)에 다음 컬럼명을 입력합니다:
   - `id`, `title`, `html`, `css`, `js`, `updatedAt`

## 2. Google Apps Script 작성
1. 스프레드시트 상단 메뉴에서 **확장 프로그램 > Apps Script**를 클릭합니다.
2. 기존 코드를 모두 지우고 아래 코드를 복사해서 붙여넣습니다.

```javascript
/**
 * CodeCanvas Backend Script
 * 2026-04-28 구현
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // 10초 동안 잠금 시도
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action;
    
    if (action === 'save') {
      var id = contents.id;
      var title = contents.title;
      var code = contents.code;
      var updatedAt = contents.updatedAt;
      
      var data = sheet.getDataRange().getValues();
      var foundIndex = -1;
      
      // 기존 ID가 있는지 확인
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
          foundIndex = i + 1;
          break;
        }
      }
      
      if (foundIndex > -1) {
        // 업데이트
        sheet.getRange(foundIndex, 2).setValue(title);
        sheet.getRange(foundIndex, 3).setValue(code.html);
        sheet.getRange(foundIndex, 4).setValue(code.css);
        sheet.getRange(foundIndex, 5).setValue(code.js);
        sheet.getRange(foundIndex, 6).setValue(updatedAt);
      } else {
        // 신규 추가
        sheet.appendRow([id, title, code.html, code.css, code.js, updatedAt]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', id: id }))
        .setMimeType(ContentService.MimeType.JSON);
    }
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
  
  if (action === 'get' && id) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    
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
          updatedAt: data[i][5]
        };
        return ContentService.createTextOutput(JSON.stringify({ status: 'success', project: project }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Project not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput("CodeCanvas API is running.")
    .setMimeType(ContentService.MimeType.TEXT);
}
```

## 3. 웹 앱 배포
1. Apps Script 에디터 우측 상단의 **배포 > 새 배포**를 클릭합니다.
2. 유형 선택에서 **웹 앱**을 선택합니다.
3. 설정을 다음과 같이 변경합니다:
   - **설명:** CodeCanvas Backend
   - **다음 사용자로 실행:** 나 (사용자 본인 이메일)
   - **액세스할 수 있는 사용자:** 모든 사용자 (Anyone) - *중요: 링크 공유를 위해 필수입니다.*
4. **배포**를 클릭하고 승인 절차를 거칩니다.
5. 생성된 **웹 앱 URL**을 복사합니다.

## 4. 프론트엔드 설정
1. `js/config.js` 파일의 `GAS_APP_URL` 변수에 복사한 URL을 붙여넣습니다.

---
*참고: 아크랩스 홈페이지 (https://litt.ly/aklabs)*

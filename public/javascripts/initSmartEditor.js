
var oEditors = [];
nhn.husky.EZCreator.createInIFrame({
  oAppRef: oEditors,
  elPlaceHolder: "ir1",
  sSkinURI: "/javascripts/smartEditor/SmartEditor2Skin.html",
  fCreator: "createSEditor2"
  });

function submitContents(elClickedObj) {
  oEditors.getById["ir1"].exec("UPDATE_CONTENTS_FIELD", []);	// 에디터의 내용이 textarea에 적용됩니다.
  
  //console.log(oEditors.getById["ir1"]);
  // 에디터의 내용에 대한 값 검증은 이곳에서 document.getElementById("ir1").value를 이용해서 처리하면 됩니다.

  //try {
  //  elClickedObj.form.submit();
  //} catch(e) {}
}
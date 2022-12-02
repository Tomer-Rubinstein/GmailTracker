

function genSecret(length){
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/* on install/update, set a secret on the local storage
 * it will be used to generate mid(mail identifier) */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason == "install" || details.reason == "update"){
    chrome.storage.local.set({
      "gmail_utils":{
        "gmail_utils_secret": "yes", // genSecret(32)
        "mails": []
      }
    })
  }
})

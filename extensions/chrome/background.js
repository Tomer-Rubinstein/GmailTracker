

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
    chrome.storage.local.set({"gmail_utils_secret": genSecret(32)})
  }
})

// chrome.action.onClicked.addListener(async (tab) => {
//   const prevState = await chrome.action.getBadgeText({tabId: tab.id})
//   const nextState = (prevState === 'ON') ? 'OFF': 'ON'
  
//   await chrome.action.setBadgeText({
//     tabId: tab.id,
//     text: nextState
//   })

//   if (nextState === 'ON') {
//     await chrome.scripting.insertCSS({
//       files: ["focus-mode.css"],
//       target: {tabId: tab.id}
//     })
//   } else if (nextState === 'OFF') {
//     await chrome.scripting.removeCSS({
//       files: ["focus-mode.css"],
//       target: {tabId: tab.id}
//     })
//   }
// })

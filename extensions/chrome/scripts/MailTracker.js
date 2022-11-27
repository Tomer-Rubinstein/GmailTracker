

// let lastUrl = location.href;
var trackBtnEnabled = false;
var HOST = "https://c667-2a10-8012-19-cb86-3cd3-3179-6294-6207.eu.ngrok.io";

async function HmacSHA256(message, secret) {
  const enc = new TextEncoder("utf-8");
  const algorithm = { name: "HMAC", hash: "SHA-256" };
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    algorithm,
    false, ["sign", "verify"]
  );
  const hashBuffer = await crypto.subtle.sign(
    algorithm.name, 
    key, 
    enc.encode(message)
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(
      b => b.toString(16).padStart(2, '0')
  ).join('');
  return hashHex;
}


async function getMid(){
  // TODO: class name changes everyday dilemma
  // suggestion: ask users for their email

  // const profileDiv = await waitForElm('[class="gb_zf gb_Xa gb_mg gb_f"]');
  // const re_match_email = /\(([^\)]+)\)/
  // const email = profileDiv.firstChild.getAttribute("aria-label").match(re_match_email)[1];

  const email = "myemail@gmail.com"
  const timestamp = Date.now();

  return new Promise((resolve) => {
    chrome.storage.local.get(['gmail_utils'], async (res) => {
      const secret = res['gmail_utils']['gmail_utils_secret']
      const payload = `${email};${timestamp}`
      resolve(await HmacSHA256(payload, secret));
    });
  });
}

/*
sendNewEmail() is responsible for sending a new mid to the webserver.
Invoked when the "send" button is clicked when composing a new gmail.
*/
async function sendNewEmail(){
  if (!trackBtnEnabled) return;

  chrome.storage.local.get(['gmail_utils'], async (res) => {
    const mid = document.getElementById('gmailutils_img').getAttribute("mid");

    // store mid in localstorage
    res['gmail_utils']['mails'].push(mid);
    chrome.storage.local.set(res)

    // post request to DEBUG server
    const xhr = new XMLHttpRequest();
    const url = "http://127.0.0.1:8000/newMail/"; // DEBUG
    xhr.open("POST", url);
    xhr.setRequestHeader('Access-Control-Allow-Origin', '*')
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
    xhr.send(JSON.stringify({
      "mid": mid
    }));
  })
}


async function trackBtnClicked(){
  trackBtnEnabled = !trackBtnEnabled;

  const trackBtn = document.getElementById("gmailutils_trackbtn");
  trackBtn.innerText = (trackBtnEnabled) ? "Track ✔️" : "Track ❌";

  if (trackBtnEnabled) {
    await getMid().then((mid) => {
      // inject <img/> payload to email content
      var imgPayload = document.createElement("img");
      imgPayload.src = HOST + "/read?mid=" + mid;
      imgPayload.setAttribute("mid", mid);
      imgPayload.id = "gmailutils_img";
      imgPayload.style.display = 'none'; // hide broken image icon

      document.getElementById(":ri").appendChild(imgPayload);
    });
  }
  else if ((img = document.getElementById("gmailutils_img")) !== undefined) {
    img.remove();
  }

}



(async function main(){
  // add 'click' event listener to the send button when composing a new gmail.
  const sendBtnDiv = await waitForElm('[class="dC"]');
  sendBtnDiv.firstChild.addEventListener('click', sendNewEmail);

  await waitForElm('[class="gU a0z"]').then((lowerDiv) => {
    var trackBtn = document.createElement("button");
    trackBtn.innerText = "Track ❌"
    trackBtn.id = "gmailutils_trackbtn";
    trackBtn.onclick = trackBtnClicked;
    trackBtn.style = `
      box-shadow: 1px 2px 5px gray;
      border: none; 
      border-radius: 5px; 
      width: 80px; 
      height: 25px;
      font-family: "Century Gothic",Verdana,sans-serif;
      background: #007FFF;
      color: white;
      cursor: pointer;
      margin-right: 5px;
      margin-left: 5px;
    `

    lowerDiv.appendChild(trackBtn);
  });

})();


function waitForElm(attr) {
  return new Promise(resolve => {
    // watch for changes in the DOM tree
    const observer = new MutationObserver(mutations => {
      if (document.querySelector(attr)) {
        // resolve([...document.querySelectorAll(attr)].map(item => item.firstChild));
        resolve(document.querySelector(attr))
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}



// new MutationObserver(async () => {
//   const url = location.href;
//   if (url !== lastUrl && url.endsWith("?compose=new")) {
//     lastUrl = url;
//     if (elm) {
//       elm.forEach((div) => {
//         if (div.id=="ext_read_sign") {
//           hasButton = true;
//         }
//       });
//     }
//     if (!hasButton){
//       await change();
//     }
//   }
// }).observe(document, {subtree: true, childList: true});
// 
// async function change(){
//   elm = await waitForElm('[class="gU a0z"]');

//   elm.forEach((div) => {
//     var p = document.createElement("p");
//     p.innerText = "hey";
//     p.id = "ext_read_sign";
//     p.style.color = "red";
//     div.appendChild(p);
//     return;
//   })
// };






// let lastUrl = location.href;
// let elm;

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


async function sendNewEmail(){
  console.log("[DEBUG] clicked")

  // TODO: class name changes everyday dilemma
  // const profileDiv = await waitForElm('[class="gb_zf gb_Xa gb_mg gb_f"]');
  // const re_match_email = /\(([^\)]+)\)/
  // const email = profileDiv.firstChild.getAttribute("aria-label").match(re_match_email)[1];

  const email = "tomerrub11@gmail.com"
  const timestamp = Date.now();

  chrome.storage.local.get(['gmail_utils_secret'], async (res) => {
    const secret = res['gmail_utils_secret']
    const payload = `${email};${timestamp}`

    console.log(payload, secret)
    const mid = await HmacSHA256(payload, secret)
    console.log(mid)

    const xhr = new XMLHttpRequest();
    const url = "http://127.0.0.1:8000/newMail/"; // DEBUG
    xhr.open("POST", url);
    xhr.setRequestHeader('Access-Control-Allow-Origin', '*')
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
    xhr.send(JSON.stringify({
      "mid": mid
    }));

  })

  // TODO: inject <img src=".../read/:<mid>" alt=" "/> to email

  
}

(async function main(){
  // add 'click' event listener to the send button when composing a new gmail.
  const sendBtnDiv = await waitForElm('[class="dC"]');
  sendBtnDiv.firstChild.addEventListener('click', sendNewEmail);



  // elm = await waitForElm('[class="gU a0z"]');
  // elm.forEach((div) => {
  //   var p = document.createElement("");
  //   p.innerText = "hey";
  //   p.id = "ext_read_sign";
  //   p.style.color = "red";
  //   div.appendChild(p);
  // })

})();




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

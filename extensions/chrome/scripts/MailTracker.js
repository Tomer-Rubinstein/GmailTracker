

var HOST = "https://189d-2a10-8012-d-dcc3-1d33-8c1a-793b-df84.eu.ngrok.io";

(async function main(){
  // get status
  window.addEventListener('popstate', getEmailStatus)

  // add 'click' event listener to the send button when composing a new gmail.
  const sendBtnDiv = await waitForElm('[class="dC"]');
  sendBtnDiv.firstChild.addEventListener('click', sendNewEmail);

  var currentTextArea;
  /* observe for DOM changes and wait for the UI elements: email toolbar & text area
     to appear in the "compose email" dialog. */
  new MutationObserver(async () => {
    await waitForAllElem('[g_editable="true"][role="textbox"][contenteditable="true"]').then((elemList) => {
      currentTextArea = elemList[elemList.length-1];
      if (currentTextArea === undefined) return;

      /* if all email's text area are getting deleted (for instance, CTRL+A & backspace & another backspace)
         will result in the div of the text area to remove EVERY single children instance */
      /* thus, it could remove the <img/> payload even though the trackBtn is enabled.
         so as a solution: listen for those text area changes and add the <img/> if required */
      new MutationObserver((mutations, obs) => {
        obs.disconnect();

        document.querySelectorAll('[id="gmailutils_trackbtn"]').forEach(async (trackBtn) => {
          var correspondingTextArea = document.getElementById(trackBtn.getAttribute("gmailutils_textAreaId"));
          var mid = await getMid();
          if (    correspondingTextArea !== undefined
              &&  correspondingTextArea !== null
              &&  correspondingTextArea.id === currentTextArea.id
              &&  trackBtn.getAttribute("isClicked") === 'true'
              &&  correspondingTextArea.querySelector('[id="gmailutils_img"]') === null    ) {
            /* tracking is enabled but <img/> doesn't appear in the text area of the email,
               so add a new <img/> payload */
            console.log('yessir')
            correspondingTextArea.appendChild(createImgPayload(mid));
          }
        });
      }).observe(currentTextArea, {childList: true, subtree: true});


    }).then(async () => {
      await waitForAllElem('[class="gU a0z"]').then((elemList) => {
        var currentLowerDiv = elemList[elemList.length-1];
        if (currentLowerDiv !== undefined && currentLowerDiv.querySelector('[id="gmailutils_trackbtn"]') === null) {    
          /* appending trackbtn to the lower toolbar of the email compose dialog */
          console.log("creating with: ", currentLowerDiv);
          currentLowerDiv.appendChild(createTrackButton(currentTextArea));
        }
      });
    });
  }).observe(document, {subtree: true, childList: true});

})();


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


function getUserEmail(){
  // TODO: class name changes everyday dilemma
  // suggestion: ask users for their email
  //             or find other ways to parse user email address 

  // const profileDiv = await waitForElm('[class="gb_zf gb_Xa gb_mg gb_f"]');
  // const re_match_email = /\(([^\)]+)\)/
  // const email = profileDiv.firstChild.getAttribute("aria-label").match(re_match_email)[1];
  const email = "myemail@gmail.com"

  return email;
}


async function getMid(){
  const timestamp = Date.now();
  const email = getUserEmail();

  return new Promise((resolve) => {
    chrome.storage.local.get(['gmail_utils'], async (res) => {
      const secret = res['gmail_utils']['gmail_utils_secret'];
      const payload = `${email};${timestamp}`;
      resolve(await HmacSHA256(payload, secret));
    });
  });
}

/* sendNewEmail() is responsible for sending a new mid to the webserver.
Invoked when the "send" button is clicked when composing a new gmail. */
async function sendNewEmail(){
  if (!trackBtnEnabled) return;

  chrome.storage.local.get(['gmail_utils'], async (res) => {
    const mid = document.getElementById('gmailutils_img').getAttribute("mid");

    // store mid in localstorage
    res['gmail_utils']['mails'].push(mid);
    chrome.storage.local.set(res);
    
    console.log("creating " + mid)

    // post new mid to webserver
    fetch(HOST+'/newMail/', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify({"mid": mid})
    })
  })
}



function getEmailStatus(){
  const imgPayload = this.document.querySelector('[id*=gmailutils_img]');
    
  if (imgPayload !== null && location.href.includes("inbox/")) {
    // gmail creates custom url for user content(media & images), so the following
    // parses the mid out of the src attribute of the <img/> payload.
    const mid = imgPayload.getAttribute("src").split("?mid=")[1]
    // get email status from API
    fetch(HOST+'/status', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify({"mid": mid})
    })
    .then(resp => resp.json())
    .then(data => {
      var date = new Date(data.lastOpened * 1000);
      var seenText = document.createElement("p");

      seenText.innerText = `✔️ Last seen at ${date.getHours()}:${date.getMinutes()} (${date.toLocaleDateString("en-GB")})`
      seenText.style.color = "#40826d";

      imgPayload.closest('div').appendChild(seenText);
    });
    
  }
}


function waitForElm(attr) {
  return new Promise(resolve => {
    // watch for changes in the DOM tree
    const observer = new MutationObserver(mutations => {
      if (document.querySelector(attr)) {
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


function waitForAllElem(attr){
  return new Promise(resolve => {
    // watch for changes in the DOM tree
    const observer = new MutationObserver(mutations => {
      if (document.querySelectorAll(attr)) {
        resolve([...document.querySelectorAll(attr)]);
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}


function createTrackButton(currentTextArea){
  /* creating the track button */
  var trackBtn = document.createElement("button");
  trackBtn.innerText = "Track ❌";
  trackBtn.id = `gmailutils_trackbtn`;
  trackBtn.setAttribute("isClicked", 'false');
  trackBtn.setAttribute("gmailutils_textAreaId", currentTextArea.id);
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
  `;

  /* on clicked, append to the CORRESPONDING text area the <img/> payload
     or remove it if clicked again */
  trackBtn.onclick = async () => {
    /* updating the state of the trackbtn (clicked or not) */
    var trackBtnEnabled = (trackBtn.getAttribute("isClicked") === 'true') ? false : true;
    trackBtn.setAttribute("isClicked", trackBtnEnabled);
    trackBtn.innerText = (trackBtnEnabled) ? "Track ✔️" : "Track ❌";
  
    var textArea = document.getElementById(trackBtn.getAttribute("gmailutils_textAreaId"));
    console.log("first: ", trackBtn.getAttribute("gmailutils_textAreaId"))
    if (textArea === null) return;
    console.log("here: ", textArea.id);

    if (trackBtnEnabled) {
      await getMid().then((mid) => {
        // create & append <img/> payload to the CORRESPONDING text area of the email
        var imgPayload = createImgPayload(mid);

        document.getElementById(
          trackBtn.getAttribute("gmailutils_textAreaId")
        ).appendChild(imgPayload);
      });
    } else {
      /* trackBtnEnabled is false so remove the <img/> payload if exists
         if it exists in the corresponding email's text area */
      var imgPayload = textArea.querySelector('[id="gmailutils_img"]');
      imgPayload.remove();
    }
  };

  return trackBtn;
}


function createImgPayload(mid) {
  var imgPayload = document.createElement("img");
  imgPayload.src = HOST + "/read?mid=" + mid;
  imgPayload.setAttribute("mid", mid);
  imgPayload.id = "gmailutils_img";
  imgPayload.style.display = 'none';

  return imgPayload;
}

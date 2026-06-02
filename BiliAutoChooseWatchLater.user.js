// ==UserScript==
// @name         BiliAutoChooseWatchLater
// @version      2026.06.03
// @author       WayneFerdon
// @include        *.bilibili.com*
// @exclude      *live.bilibili.com*
// @exclude      *message.bilibili.com/pages/nav/header_sync*
// @exclude      *www.bilibili.com/correspond*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @grant        GM_setValue
// @grant        GM_getValue
// @downloadURL https://github.com/WayneFerdon/Biliblock/raw/refs/heads/master/BiliAutoChooseWatchLater.user.js
// @updateURL https://github.com/WayneFerdon/Biliblock/raw/refs/heads/master/BiliAutoChooseWatchLater.user.js
// ==/UserScript==

if (window.self !== window.top) return;
startContainerObserver();
function startContainerObserver() {
  let observer = new MutationObserver( (mutations, observer) => mutations.forEach( mutation => {
    const span = Array.from(mutation.addedNodes).find(node => node.querySelector && node.querySelector('.tab-item__title[title="稍后再看"]'));
    if (!span) return;
    observer.disconnect();
    (async ()=>{
      await until(()=>document.querySelector('.tab-item.tab-item--active:first-child'));
      span.click();
    })();
  }));
  observer.observe(document.body, { subtree: true, childList: true });
}

function pauseAsync(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function until(condition, delay){
  let result;
  while (!(result = await condition())) await pauseAsync(delay);
  return result;
}

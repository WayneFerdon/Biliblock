// ==UserScript==
// @name         BiliSubtitle2Console
// @version      2026.05.28.
// @author       WayneFerdon
// @match        https://www.bilibili.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @grant        GM_setValue
// @grant        GM_getValue
// @downloadURL https://github.com/WayneFerdon/Biliblock/raw/refs/heads/master/BiliSubtitle2Console.user.js
// @updateURL https://github.com/WayneFerdon/Biliblock/raw/refs/heads/master/BiliSubtitle2Console.user.js
// ==/UserScript==

if (window.self !== window.top) return;

startContainerObserver();

async function startContainerObserver() {
  let observer = new MutationObserver((mutations, observer) => mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
    const str = gE('.bili-subtitle-x-subtitle-panel-text', node);
    if (str) console.log(str.innerText);
  })));
  let container;
  while (!container) {
    await pauseAsync(100);
    container = gE('.bpx-player-subtitle-wrap');
  }
  observer.observe(container, { childList: true, subtree:true, attribute: true });
}

function gE(ele, mode, parent) { // 获取元素
  if (typeof ele === 'object') return ele;
  if (mode === undefined && parent === undefined) return (isNaN(ele * 1)) ? document.querySelector(ele) : document.getElementById(ele);
  if (mode === 'all') return (parent === undefined) ? document.querySelectorAll(ele) : parent.querySelectorAll(ele);
  if (typeof mode === 'object' && parent === undefined) return mode.querySelector(ele);
}

function pauseAsync(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

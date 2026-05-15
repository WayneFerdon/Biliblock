// ==UserScript==
// @name         BiliAutoChooseWatchLater
// @version      2026.01.29.
// @author       WayneFerdon
// @include        *www.bilibili.com*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @grant        GM_setValue
// @grant        GM_getValue
// @downloadURL https://github.com/WayneFerdon/Biliblock/raw/refs/heads/master/BiliAutoChooseWatchLater.user.js
// @updateURL https://github.com/WayneFerdon/Biliblock/raw/refs/heads/master/BiliAutoChooseWatchLater.user.js
// ==/UserScript==

function gE(ele, mode, parent) { // 获取元素
  if (typeof ele === 'object') return ele;
  if (mode === undefined && parent === undefined) return (isNaN(ele * 1)) ? document.querySelector(ele) : document.getElementById(ele);
  if (mode === 'all') return (parent === undefined) ? document.querySelectorAll(ele) : parent.querySelectorAll(ele);
  if (typeof mode === 'object' && parent === undefined) return mode.querySelector(ele);
}

function cE(name) { // 创建元素
  return document.createElement(name);
}
function pauseAsync(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function startContainerObserver() {
  let observer = new MutationObserver(
    (mutations, observer) => mutations.forEach(
      mutation => {
        Array.from(mutation.addedNodes).map(node => node.querySelector ? gE('.tab-item__title[title="稍后再看"]', node) : undefined).filter(span=>span).forEach(span => {
          span.click()
          observer.disconnect();
        });
      }
    )
  );
  observer.observe(document.body, { subtree: true, childList: true, attribute: true, attributeFilter: ['value', 'title'] });
}
startContainerObserver();

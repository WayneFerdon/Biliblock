// ==UserScript==
// @name         Biliblock
// @namespace    http://tampermonkey.net/
// @description 2024-10-14
// @version      2024-10-14
// @author       WayneFerdon
// @match        https://www.bilibili.com/
// @match        https://www.bilibili.com/?spm_id_from=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @grant        GM_setValue
// @grant        GM_getValue
// @downloadURL https://github.com/WayneFerdon/Biliblock/raw/refs/heads/main/Biliblock.user.js
// @updateURL https://github.com/WayneFerdon/Biliblock/raw/refs/heads/main/Biliblock.user.js
// ==/UserScript==

const blacklist = [
  '.recommended-swipe-core', // 滚动推荐
  '.badge', // 有徽章的卡片：直播, 番剧, 国创等
  '.bili-live-card__info--living__text', // 直播
  '.bili-video-card__info--creative-ad', // 推广
  '.bili-video-card__info--ad', // 广告
]

function gE(ele, mode, parent) { // 获取元素
  if (typeof ele === 'object') return ele;
  if (mode === undefined && parent === undefined) return (isNaN(ele * 1)) ? document.querySelector(ele) : document.getElementById(ele);
  if (mode === 'all') return (parent === undefined) ? document.querySelectorAll(ele) : parent.querySelectorAll(ele);
  if (typeof mode === 'object' && parent === undefined) return mode.querySelector(ele);
}

function cE(name) { // 创建元素
  return document.createElement(name);
}

function onBlock(card) {
  for (let i in blacklist) {
    if (gE(blacklist[i], card)) {
      card.parentNode.removeChild(card);
      return true;
    }
  };
  const cardAuthor = gE('.bili-video-card__info--author', card);
  if (!cardAuthor) return false;
  const name = cardAuthor.title;
  const blockButton = cE('button');
  blockButton.classList.add('blockButton');
  blockButton.onclick = () => {
    console.log(authorBlacklist);
    const index = authorBlacklist.indexOf(name);
    if (index !== -1) {
      authorBlacklist.splice(index, 1);
      blockButton.classList.add('blockButton');
      blockButton.classList.remove('blockButton_blocked');
      GM_setValue('authorBlacklist', authorBlacklist);
      return;
    }
    authorBlacklist.push(name);
    blockButton.classList.add('blockButton_blocked');
    blockButton.classList.remove('blockButton');
    GM_setValue('authorBlacklist', authorBlacklist);
  }
  cardAuthor.parentNode.parentNode.appendChild(blockButton);
  if (!authorCount[name]) authorCount[name] = 0;
  authorCount[name] += 1;
  const alertColor = [
    [4, 'firebrick'],
    [3, 'orange'],
    [2, 'powderblue']
  ]
  const count = authorCount[name];
  for (let [c, color] of alertColor) {
    if (count >= c) {
      gE('.bili-video-card__wrap', card).style.cssText += `background-color: ${color}`;
      break;
    }
  }
  totalCount += 1;
  GM_setValue('authorCount', authorCount);
  GM_setValue('totalCount', totalCount);
  return false;
}

function addKeyListener() {
  function reloadCards() {
    gE('.primary-btn.roll-btn').click();
  }
  function getCard(index) {
    return gE('.container.is-version8>.feed-card', 'all')[index];
  }
  function addWatchLater(index) {
    gE('.bili-watch-later.bili-watch-later--pip', getCard(index)).click()
  }
  function openVideo(index) {
    gE('.bili-video-card__image--link', getCard(index)).click();
  }
  const funcKeyDown = {};
  // const funcKeys = ['Shift', 'Alt', 'Control', 'Meta', 'Enter'];
  const funcKeys = ['Enter'];
  document.addEventListener('keyup', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (funcKeys.indexOf(e.key) === -1) return;
    funcKeyDown[e.key] = false;
  });

  document.addEventListener('keydown', e => {
    if (gE('.center-search__bar is-focus')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (funcKeys.indexOf(e.key) !== -1) {
      funcKeyDown[e.key] = true;
      return;
    }
    const keyCode = e.keyCode;
    const handlers = [
      // numpad 0
      [[96],
       reloadCards],
      // numpad 7,8,9,4,5,6,1,2,3
      [[103, 104, 105, 100, 101, 102, 97, 98, 99],
       funcKeyDown['Enter'] ? openVideo : addWatchLater]
    ]
    for (let [keyCodes, onEvent] of handlers) {
      const index = keyCodes.indexOf(keyCode);
      if (index === -1) continue;
      onEvent(index);
      return;
    }
  }, false);
}

function reformatStyle() {
  const style = cE('style');
  document.head.appendChild(style);
  style.innerHTML = `
        .blockButton{
            width:10px;
            height:10px;
            background-color: blue;
            position: absolute;
            right: 0px;
        }
        .blockButton_blocked{
            width:10px;
            height:10px;
            background-color: red;
            position: absolute;
            right: 0px;
        }
        .container.is-version8 {
            grid-template-columns: repeat(3, 1fr);
        }
        .blockButton:hover{
            background-color: red;
        }
        .blockButton_blocked:hover{
            background-color: blue;
        }
        .feed-card {
            display: unset!important;
        }
    `
}

function onInitCard(card) {
  if (!(card instanceof Element) || card.parentNode !== container) return;
  if (onBlock(card)) return;
  card.style.cssText += 'margin-top: 0px;'
}

function startContainerObserver() {
  let observer = new MutationObserver(
    (mutations, observer) => mutations.forEach(
      mutation => mutation.addedNodes.forEach(node => onInitCard(node))
    )
  );
  Array.from(container.children).forEach(node => onInitCard(node));
  observer.observe(container, { childList: true, attribute: true }); //监听翻译动态内容
}

const container = gE('.container');
let totalCount = GM_getValue('totalCount');
if (!totalCount) totalCount = 0;
let authorCount = GM_getValue('authorCount');
if (!authorCount) authorCount = {};

let authorBlacklist = GM_getValue('authorBlacklist');
if (!authorBlacklist) authorBlacklist = [];
authorBlacklist.forEach(name => blacklist.push(`span[title="${name}"]`));

reformatStyle();
addKeyListener();
startContainerObserver();

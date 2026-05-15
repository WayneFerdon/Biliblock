// ==UserScript==
// @name         Biliblock
// @version      2026.05.15.
// @author       WayneFerdon
// @match        https://www.bilibili.com/
// @match        https://www.bilibili.com/?spm_id_from=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @grant        GM_setValue
// @grant        GM_getValue
// @downloadURL https://github.com/WayneFerdon/Biliblock/raw/refs/heads/master/Biliblock.user.js
// @updateURL https://github.com/WayneFerdon/Biliblock/raw/refs/heads/master/Biliblock.user.js
// ==/UserScript==

const blacklist = [
  '.badge', // 有徽章的卡片：直播, 番剧, 国创等
  '.bili-live-card__info--living__text', // 直播
  '.bili-video-card__stats>.bili-video-card__stats--text', // 广告
  // '.recommended-swipe-core', // 滚动推荐
  // '.bili-video-card__stats>.bili-video-card__stats--icon', // 推广

  // 未加载
  '.bili-video-card__skeleton',
  '.floor-skeleton'
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
      // console.log(card)
      card.parentNode.removeChild(card);
      return true;
    }
  };
  const cardAuthor = gE('.bili-video-card__info--author', card);
  if (!cardAuthor) return false;
  const name = cardAuthor.title;
  const parent = gE('.bili-video-card__wrap', card);

  const blockButton = cE('div');
  const firstChild = parent.firstChild;
  if (firstChild) {
    parent.insertBefore(blockButton, firstChild);
  } else {
    parent.appendChild(blockButton);
  }

  blockButton.classList.add('blockButtonBase');
  blockButton.classList.add('blockButton');
  blockButton.innerText = authorCount[name] ?? 0

  blockButton.onclick = () => {
    const index = authorBlacklist.indexOf(name);
    authorCount[name] = null
    if (index !== -1) {
      authorBlacklist.splice(index, 1);
      blacklist.splice(blacklist.indexOf(`span[title="${name}"]`), 1);
      // console.log(authorBlacklist, blacklist);
      blockButton.classList.add('blockButton');
      blockButton.classList.remove('blockButton_blocked');
      gE('.revert-btn', card).click();
      GM_setValue('authorBlacklist', authorBlacklist);
      return;
    }
    authorBlacklist.push(name);
    blacklist.push(`span[title="${name}"]`);
    blockButton.classList.add('blockButton_blocked');
    blockButton.classList.remove('blockButton');

    const noInterest = getNoInterest(card);
    gE('.bili-video-card__info--no-interest-panel--item:last-child', noInterest).click();
    GM_setValue('authorBlacklist', authorBlacklist);
  }
  if (!authorCount[name]) authorCount[name] = 0;
  authorCount[name] += 1;
  const alertColor = [
    [10, 'hsl(0, 67.9%, 11.6%)'],
    [5, 'hsl(38.8, 80%, 50%)'],
    [2, 'hsl(185.5, 30%, 20%)']
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

function getNoInterest(card) {
  return cardInfos.find(([c,n])=>c===card)[1];
}

function addKeyListener() {
  function reloadCards() {
    if (gE('.container.is-version8>div')) {
      const count = gE('.container.is-version8>div','all').length;
      for(let i=0;i<count;i++) {
        nis(0, false, false);
        del(0);
      }
    }
    gE('.primary-btn.roll-btn').click();
  }
  function getCard(index) {
    return Array.from(gE('.container.is-version8>div','all')).sort((a,b) =>(a.style.order||0)-(b.style.order||0))[index];
  }
  function addWatchLater(index) {
    gE('.bili-watch-later.bili-watch-later--pip', getCard(index)).click()
  }
  function openVideo(index) {
    gE('.bili-video-card__image--link', getCard(index)).click();
  }
  function block(index) {
    const card = getCard(index);
    gE('.blockButtonBase', card).click();
    card.style.order = 100;
  }
  function del(index) {
    if (!gE('.container.is-version8>div')) {
      return;
    }
    const card = getCard(index);
    if (!card) return;
    cardInfos = cardInfos.filter(([c,n])=>c!==card);
    card.parentNode.removeChild(card);
  }
  function nis(index, revert=true, reorder=true) {
    const card = getCard(index);
    if (!card) return;
    if (gE('.bili-video-card__no-interest', card).style.display !== 'none' && gE('.no-interest-title', card)?.innerText === '内容不感兴趣') {
      if (revert) gE('.revert-btn', card).click();
      return;
    }
    const noInterest = getNoInterest(card);
    gE('.bili-video-card__info--no-interest-panel--item:first-child', noInterest).click();
    console.log('nis')
    if (reorder) card.style.order = 100;
  }

  let funcKeyDown = {};
  const funcKeys = [13,110,107, 16,17,18]; // numpad_enter numpad_. numpad_+, shift, crtl, alt
  document.addEventListener('keyup', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (funcKeys.indexOf(e.keyCode) === -1) return;
    funcKeyDown[e.keyCode] = false;
  });

  window.addEventListener('blur', () => {
    console.log('blur')
    funcKeyDown = {};
  });

  document.addEventListener('focusout', () => {
    console.log('focusout')
    funcKeyDown = {};
  });

  document.addEventListener('visibilitychange', () => {
    console.log('visibilitychange')
    funcKeyDown = {};
  });

  window.addEventListener('pagehide', () => {
    console.log('pagehide')
    funcKeyDown = {};
  });


  document.addEventListener('keydown', e => {
    if (gE('.center-search__bar is-focus')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    // console.log(e.keyCode)
    if (e.keyCode === 13) e.preventDefault();
    if (funcKeys.indexOf(e.keyCode) !== -1) {
      funcKeyDown[e.keyCode] = true;
      return;
    }
    const keyCode = e.keyCode;
    const funcs = {
      del: funcKeyDown[107]||funcKeyDown[16],
      watch: funcKeyDown[110]||funcKeyDown[17],
      alt: funcKeyDown[13]||funcKeyDown[18],
    }
    const handlers = [
      // numpad 0
      [[96, 32],
       reloadCards],
      // numpad 7,8,9,4,5,6,1,2,3
      [[103,104,105, 100,101,102, 97,98,99],
       funcs.del ? del : funcs.watch ? funcs.alt ? openVideo : addWatchLater : funcs.alt ? block : nis],
      // 1,2,3,4,5,6,7,8,9,0,-,=
      [[49,50,51,52,53,54,55,56,57,58, 48,189,187],
       funcs.del ? del : funcs.watch ? funcs.alt ? openVideo : addWatchLater : funcs.alt ? block : nis],
      // QWEASDZXC
      [[81,87,69, 65,83,68, 90,88,67],
       funcs.del ? del : funcs.watch ? funcs.alt ? openVideo : addWatchLater : funcs.alt ? block : nis],
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
        .blockButtonBase {
            width: 28px;
            height: 28px;
            position: absolute;
            bottom: 0;
            right: 0;
            border: 1px solid var(--line_light);
            border-radius: 6px;
            z-index: 10;
            filter: opacity(0.75);
            align-content: center;
            text-align: center;
        }
        .blockButton,
        .blockButton_blocked:hover{
            // background-color: #c00!important;
        }
        .blockButton:hover {
            background-color: #242526!important;
            /*background-color: #1E90FF!important;*/
        }
        .blockButton_blocked {
            background-color: #1E90FF!important;
        }
        .container.is-version8 {
            grid-template-columns: repeat(3, 1fr);
        }
        .bili-video-card__info--no-interest {
            transform: scale(1.5);
            top:unset!important;
            bottom: 5px;
		    right: 35px!important;
	    }
	    .bili-video-card__info {
		    display: block!important;
	    }
    `
}

function onInitCard(card) {
  if (!(card instanceof Element) || card.parentNode !== container) return;
  if (onBlock(card)) return;
  card.style.cssText += 'margin-top: 0px;'
  gE('.bili-video-card__info--no-interest', card).dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
  cardInfos.push([card, undefined]);
}

function onInitNoInterest(nis) {
  if (!(nis instanceof Element)) return;
  if (!nis.classList.contains('vui_popover-is-bottom-end')) return;
  const cardInfo = cardInfos[cardInfos.findIndex(([c, n])=>!n)];
  cardInfo[1] = nis;
  const card = cardInfo[0];
  gE('.bili-video-card__info--no-interest', card).dispatchEvent(new MouseEvent('mouseleave', { bubbles: true, cancelable: true }));
}

function startContainerObserver() {
  let observer = new MutationObserver(
    (mutations, observer) => mutations.forEach(
      mutation => mutation.addedNodes.forEach(node => onInitCard(node))
    )
  );
  Array.from(container.children).forEach(node => onInitCard(node));
  observer.observe(container, { childList: true, attribute: true });

  let observer2 = new MutationObserver(
    (mutations, observer) => mutations.forEach(
      mutation => mutation.addedNodes.forEach(node => onInitNoInterest(node))
    )
  );
  observer2.observe(document.body, { childList: true, attribute: true });
}

const container = gE('.container');
let totalCount = GM_getValue('totalCount') ?? 0;
let authorCount = GM_getValue('authorCount') ?? {};
let cardInfos = [];

let authorBlacklist = GM_getValue('authorBlacklist') ?? [];
authorBlacklist.forEach(name => blacklist.push(`span[title="${name}"]`));

reformatStyle();
addKeyListener();
startContainerObserver();

// ==UserScript==
// @name         Biliblock
// @version      2026.06.10
// @author       WayneFerdon
// @match        https://www.bilibili.com/
// @match        https://www.bilibili.com/c*
// @match        https://www.bilibili.com/?spm_id_from=*
// @exclude      *message.bilibili.com/pages/nav/header_sync*
// @exclude      *www.bilibili.com/correspond*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @downloadURL https://github.com/WayneFerdon/Biliblock/raw/refs/heads/master/Biliblock.user.js
// @updateURL https://github.com/WayneFerdon/Biliblock/raw/refs/heads/master/Biliblock.user.js
// ==/UserScript==

if (window.self !== window.top) return;
const blacklist = {
  remove: { method: onRemove, query: [
    '.badge', // 有徽章的卡片：直播, 番剧, 国创等
    '.bili-live-card__info--living__text', // 直播
    // '.recommended-swipe-core', // 滚动推荐
    '.bili-video-card__stats>.bili-video-card__stats--icon', // 推广
    '.bili-video-card__stats>.bili-video-card__stats--text', // 广告

    // 未加载
    '.bili-video-card__skeleton',
    '.floor-skeleton',

    '.vui_carousel', // 分区滚动推荐
  ]},
  author: { method: card => { onNISVideo(card); onNISAuthor(card); }, query: [] },
  noInterest: { method: onNISVideo, query: [
    // '.bili-video-card__info--icon-text', // 大量点赞
  ]},
}

GM_listValues()?.filter(a => GM_getValue(a)?.blocked).forEach(name => blacklist.author.query.push(`span[title="${name}"]`));

Object.defineProperty(Array.prototype, 'remove', { value: function(value) {
  const index = this.indexOf(value);
  if (index !== -1) this.splice(index, 1)
  return this;
}, enumerable: false });
Object.defineProperty(Array.prototype, 'removeAll', { value: function(value) {
  for (let i = this.length - 1; i >= 0; i--) {
    if (this[i] === value) this.splice(i, 1);
  }
  return this;
}, enumerable: false });

let container, cardInfos = [];

reformatStyle();
addKeyListener();
startContainerObserver();

async function startContainerObserver() {
  while (!container || !gE('.feed-card', container)) {
    await pauseAsync(100);
    container = gE('.container,.head-cards,.feed-cards');
  }
  const anchor = gE('.load-more-anchor')
  anchor.parentNode.removeChild(anchor);
  Array.from(container.children).forEach(node => onHandleNISNode(node));
  startNewNodeObserver(document.body)
  startNewNodeObserver(container)

  const topbarBottom = gE('.bili-header__bar').getBoundingClientRect().bottom;
  const targetDocTop = gE('.bili-feed4-layout').getBoundingClientRect().top + window.scrollY;
  const scrollTarget = targetDocTop - topbarBottom;
  window.scrollTo({ top: scrollTarget });
}

function startNewNodeObserver(target) {
  const observer = new MutationObserver((mutations, observer) => mutations.forEach(mutation => mutation.addedNodes.forEach(onHandleNISNode)));
  observer.observe(target, { childList: true });
  return observer;
}

function onHandleNISNode(node) {
  if (!(node instanceof Element)) return;

  if (node.parentNode === container) {
    const card = node;
    const types = getBlockTypes(card);
    onBlock(card);
    const nis = gE('.bili-video-card__info--no-interest', card);
    card.style.cssText += 'margin-top: 0px;'
    if (!nis || types?.has('remove')) {
      onRemove(card, 1000);
    } else {
      cardInfos.push([card, undefined, types]);
      nis?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
    }
    return;
  }
  if (!node.classList.contains('vui_popover-is-bottom-end')) return;
  const cardInfo = cardInfos[cardInfos.findIndex(([c, n, t])=>!n)];
  cardInfo[1] = node;
  const [card, nis, types] = cardInfo;
  gE('.bili-video-card__info--no-interest', card).dispatchEvent(new MouseEvent('mouseleave', { bubbles: true, cancelable: true }));
  if (types?.has('noInterest')) onNISVideo(card);
  if (types?.has('author')) onNISAuthor(card);
}

function getBlockTypes(card) {
  let types;
  for (let type in blacklist) { for (let i in blacklist[type].query){
    if (!gE(blacklist[type].query[i], card)) continue;
    (types??=new Set()).add(type);
  } };
  return types;
}

function onBlock(card) {
  const name = gE('.bili-video-card__info--author', card)?.title;
  if (!name) return;
  const getData = () => GM_getValue(name, {});
  const data = getData();
  const now = new Date().getTime();
  const blockButton = cE('div');
  const parent = gE('.bili-video-card__wrap', card);
  const firstChild = parent.firstChild;
  (firstChild ? parent.insertBefore : parent.appendChild).call(parent, blockButton, firstChild);
  blockButton.classList.add('blockButton');
  if (data.blocked) blockButton.classList.add('blockButton_blocked');
  blockButton.onclick = onclick;
  if (!data.count) data.count = 0;
  if ((!data.blocked) && (data.count <= 5)
      && ((now - data.time??0) > 7*24*60*60*1000))
  {
    data.count = 0;
  }
  data.count += 1;
  data.time = now;
  GM_setValue(name, data);

  blockButton.innerText = data.count;
  const alertColor = [
    [10, 'hsl(0, 67.9%, 11.6%)'],
    [5, 'hsl(38.8, 80%, 50%)'],
    [2, 'hsl(185.5, 30%, 20%)']
  ]
  for (let [c, color] of alertColor) {
    if (data.count >= c) {
      gE('.bili-video-card__wrap', card).style.cssText += `background-color: ${color}`;
      break;
    }
  }

  function onclick () {
    const data = getData();
    data.blocked = data.blocked ? undefined : true;
    GM_setValue(name, data);
    if (!data.blocked) {
      blacklist.author.query.remove(`span[title="${name}"]`);
      blockButton.classList.remove('blockButton_blocked');
      gE('.revert-btn', card).click();
      return;
    }
    blacklist.author.query.push(`span[title="${name}"]`);
    blockButton.classList.add('blockButton_blocked');
    onNISAuthor(card);
  }
}

function getNoInterest(card) {
  return cardInfos.find(([c,n,t])=>c===card)[1];
}

function onNISAuthor(card) {
  gE('.bili-video-card__info--no-interest-panel--item:last-child', getNoInterest(card)).click();
  card.style.order = 200;
}

function onNISVideo(card) {
  gE('.bili-video-card__info--no-interest-panel--item:first-child', getNoInterest(card)).click();
  if (card.style.order === '') card.style.order = 100;
}

function onRemove(card, delay) {
  if (!delay) {
    card.parentNode.removeChild(card);
    return;
  }
  card.style.order = 500;
  card.style.filter = 'opacity(0)';
  card.style.cssText += 'grid-area: unset;'
  setTimeout(()=>{
    card.parentNode?.removeChild(card);
  }, delay);
}

function addKeyListener() {
  function reloadCards(index, reload) {
    if (gE('.container.is-version8>div')) {
      const count = gE('.container.is-version8>div','all').length;
      for(let i=0;i<count;i++) {
        nis(0, false);
        del(0);
      }
    }
    if (reload) gE('.primary-btn.roll-btn').click();
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
    gE('.blockButton', card).click();
    card.style.order = 200;
  }
  function del(index) {
    if (!gE('.container.is-version8>div')) {
      return;
    }
    const card = getCard(index);
    if (!card) return;
    cardInfos = cardInfos.filter(([c,n,t])=>c!==card);
    card.parentNode.removeChild(card);
  }
  function nis(index, revert=true) {
    const card = getCard(index);
    if (!card) return;
    if (gE('.bili-video-card__no-interest', card)?.style.display !== 'none' && gE('.no-interest-title', card)?.innerText === '内容不感兴趣') {
      if (revert) gE('.revert-btn', card).click();
      return;
    }
    onNISVideo(card)
  }

  let funcKeyDown = {};
  const funcKeys = [13,110,107, 16,17,18]; // numpad_enter numpad_. numpad_+, shift, crtl, alt

  document.addEventListener('keyup', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (funcKeys.indexOf(e.keyCode) === -1) return;
    funcKeyDown[e.keyCode] = false;
  });

  window.addEventListener('blur', () => {
    Object.keys(funcKeyDown).forEach( k => { funcKeyDown[k] = undefined; });
  });

  document.addEventListener('keydown', e => {
    if (gE('.center-search__bar is-focus')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
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
      // numpad 0, space
      [[96, 32],
       funcs.alt ? (_) => reloadCards(_, false) : (_)=>reloadCards(_, true)],
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
      e.preventDefault();
      onEvent(index);
      return;
    }
  }, false);
}

function reformatStyle() {
  const style = cE('style');
  document.head.appendChild(style);
  style.innerHTML = `
        .blockButton {
            width: 28px;
            height: 28px;
            position: absolute;
            top: 0;
            right: 0;
            border: 1px solid var(--line_light);
            border-radius: 6px;
            z-index: 10;
            filter: opacity(0.75);
            align-content: center;
            text-align: center;
        }
        .blockButton_blocked:hover {
            background-color: #242526!important;
        }
        .blockButton:not(.blockButton_blocked):hover,
        .blockButton_blocked {
            background-color: #1E90FF!important;
        }
        .bili-video-card__wrap {
            border-radius: 6px;
        }
        .recommended-container_floor-aside {
            display: flex;
            justify-content: center;
        }
        .feed2 {
            min-height: 100vh;
        }
        .container.is-version8 {
            grid-template-columns: repeat(3, 1fr);
            max-width: calc(100vh / 5 / 9 * 16 * 3);
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

function pauseAsync(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function gE(ele, mode, parent) { // 获取元素
  if (typeof ele === 'object') return ele;
  if (mode === undefined && parent === undefined) return (isNaN(ele * 1)) ? document.querySelector(ele) : document.getElementById(ele);
  if (mode === 'all') return (parent === undefined) ? document.querySelectorAll(ele) : parent.querySelectorAll(ele);
  if (typeof mode === 'object' && parent === undefined) return mode.querySelector(ele);
}

function cE(name) { // 创建元素
  return document.createElement(name);
}


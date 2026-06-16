// ==UserScript==
// @name         BiliHotkey
// @version      2026.06.16
// @author       WayneFerdon
// @include        *www.bilibili.com*
// @include         *live.bilibili.com*
// @exclude        https://www.bilibili.com/
// @exclude        https://www.bilibili.com/c*
// @exclude        https://www.bilibili.com/?spm_id_from=*
// @exclude      *message.bilibili.com/pages/nav/header_sync*
// @exclude      *www.bilibili.com/correspond*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @downloadURL https://github.com/WayneFerdon/Biliblock/raw/refs/heads/master/BiliHotkey.user.js
// @updateURL https://github.com/WayneFerdon/Biliblock/raw/refs/heads/master/BiliHotkey.user.js
// ==/UserScript==

if (window.self !== window.top && !window.location.href.match(/live\.bilibili\.com\/blanc\/(\d+)\?liteVersion=true/)) return;
addKeyListener(window.location.href.match(/:\/\/(.*?)\.bilibili\.com/)[1]);
const keyDefinitions = {
  www: {
    81: undefined, // Q
    87: undefined, // W
    69: undefined, // E
    82: undefined, // R
    13: () => gE('.bpx-player-ctrl-full')?.click(), // NumpadEnter
    96: () => gE('.bpx-player-ctrl-play')?.click(), // Numpad0
    90: () => dispatchEvent(gE('.bpx-player-ctrl-playbackrate-result').innerText !== '3.0x' ? 'keydown' : 'keyup', { keyCode: 39, bubbles: true }), // z -> ArrowRight
    97: () => dispatchEvent(gE('.bpx-player-ctrl-playbackrate-result').innerText !== '3.0x' ? 'keydown' : 'keyup', { keyCode: 39, bubbles: true }), // numpad1 -> ArrowRight
    98: () => switchPlayrate(false), // Numpad2
    99: () => switchPlayrate(true), // Numpad3
    101: () => dispatchEvent('keydown', { keyCode: 40, bubbles: true }), // Numpad5 -> ArrowDown
    110: () => gE('.bpx-player-ctrl-web')?.click(), // NumpadDecimal
  },
  live: {
    32: function like () {
      like.prototype.count ??= 0;
      if (!(like.prototype.likeStarted = !like.prototype.likeStarted)) return;
      (async function (){
        const btn = await until(()=>gE('[data-type="dianzan.0.show"]'));
        await until(async () => {
          btn.click();
          like.prototype.count++;
          return !like.prototype.likeStarted || like.prototype.count >= 300;
        }, 1000);
      })();
    }
  }
}

function pauseAsync(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function until(condition, delay){ try {
  let result;
  while (!(result = await condition())) await pauseAsync(delay);
  return result;
} catch (err) { console.error(err); }}

function dispatchEvent(name, data, type=undefined, target=document.body) {
  switch (true) {
    case !!type:
      break;
    case !!name.match(/^key/):
      type = KeyboardEvent;
      break;
    case !!name.match(/^mouse/):
      type = MouseEvent;
      break;
    default:
      break;
  }
  target.dispatchEvent(new type(name, data));
}

function switchPlayrate(increase) {
  const allRate = Array.from(gE('.bpx-player-ctrl-playbackrate-menu>li', 'all'));
  let index = (allRate.findIndex(x=>x===gE('.bpx-player-ctrl-playbackrate-menu-item.bpx-state-active')));
  if (index < 0) return;
  index = (index+allRate.length-(increase?1:-1))%allRate.length;
  allRate[index]?.click();
}

function addKeyListener(page) {
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
    if (gE('.center-search__bar is-focus')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const definitions = keyDefinitions[page];
    if (!definitions || !Object.keys(definitions).includes(`${e.keyCode}`)) return;
    e.preventDefault();
    e.stopPropagation();
    const method = definitions[e.keyCode];
    if (!method) return;
    method();
  }, true);
}

function gE(ele, mode, parent) { // 获取元素
  if (typeof ele === 'object') return ele;
  if (mode === undefined && parent === undefined) return (isNaN(ele * 1)) ? document.querySelector(ele) : document.getElementById(ele);
  if (mode === 'all') return (parent === undefined) ? document.querySelectorAll(ele) : parent.querySelectorAll(ele);
  if (typeof mode === 'object' && parent === undefined) return mode.querySelector(ele);
}

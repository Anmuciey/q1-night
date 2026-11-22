const lampButtons = document.querySelectorAll('[data-lamp][aria-pressed]');
const lampView = byId('lamp-view');
const bedroomLamp = byId('returned-view');
const lampOff = byId('lamp-off');
let chosenLamp = 'left';
let lampFailed = false;
const sideText = {left:'左',right:'右'};
lampButtons.forEach(button => button.addEventListener('click', () => {
  chosenLamp = button.dataset.lamp;
  lampButtons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
  lampView.dataset.lamp = chosenLamp;
  byId('light-status').textContent = sideText[chosenLamp] + '侧床灯亮着';
  if (!lampFailed) {
    const otherSide = chosenLamp === 'left' ? '右' : '左';
    byId('returned-copy').textContent = sideText[chosenLamp] + '侧还亮着。' + otherSide + '侧刚刚被人打开。';
  }
}));

lampOff.addEventListener('click', () => {
  if (lampFailed) return;
  lampFailed = true;
  bedroomLamp.dataset.lamp = chosenLamp === 'left' ? 'right' : 'left';
  byId('returned-status').textContent = '住客端 · 已关闭你选的床灯';
  lampOff.disabled = true;
  setTimeout(() => {
    bedroomLamp.dataset.lamp = 'off';
    const otherSide = chosenLamp === 'left' ? '右' : '左';
    byId('returned-status').textContent = '另一侧 · ' + otherSide + '侧床灯已由床边开关关闭';
    byId('returned-title').textContent = '房间里有人碰了开关。';
    lampOff.textContent = '床灯已离线';
    if (audio?.state === 'running') knock(.12);
  }, 1700);
});

const doorStage = byId('door-stage');
const doorCanvas = byId('door-figure');
const doorContext = doorCanvas.getContext('2d');
const doorAction = byId('door-action');
const doorStatus = byId('door-status');
let doorState = 0;
let doorTimer;

function renderDoor() {
  const width = doorCanvas.width = doorCanvas.clientWidth;
  const height = doorCanvas.height = doorCanvas.clientHeight;
  const close = doorState === 3;
  const size = close ? height*1.56 : height*.68;
  const x = width*(close ? .53 : .62);
  const y = height*(close ? .33 : .42);
  const glow = doorContext.createRadialGradient(x,y,0,x,y,height*.55);
  glow.addColorStop(0,close ? '#541e17' : '#45413162');
  glow.addColorStop(1,'#08040300');
  doorContext.fillStyle = glow;
  doorContext.fillRect(0,0,width,height);
  doorContext.drawImage(mask,x-size*.343,y-size*.48,size*.686,size);
}

function doorSound(volume, delay = 0) {
  if (audio?.state === 'running') knock(volume,delay);
}

doorAction.addEventListener('click', () => {
  doorState++;
  if (doorState === 1) {
    doorAction.disabled = true;
    doorAction.textContent = '正在读卡';
    doorStatus.textContent = '门锁正在核对房卡。';
    doorSound(.1);
    doorTimer = setTimeout(() => {
      doorStage.dataset.state = 'ajar';
      renderDoor();
      byId('door-title').textContent = '门从另一边动了。';
      doorStatus.textContent = '门锁仍显示闭合。门缝里的光被挡住了一截。';
      doorAction.textContent = '贴近门缝';
      doorAction.disabled = false;
      doorAction.focus({preventScroll:true});
      doorSound(.23);
    }, 1450);
  } else if (doorState === 2) {
    doorStage.dataset.state = 'dark';
    byId('door-label').textContent = '217 房 · 门卡已读取';
    byId('door-title').textContent = '灯灭了。';
    doorStatus.textContent = '黑暗里，有人把一张温热的卡塞回你的手里。';
    doorAction.textContent = '打开床灯';
    doorSound(.08,.45);
  } else {
    doorStage.dataset.state = 'inside';
    renderDoor();
    byId('door-label').textContent = '217 房 · 入住';
    byId('door-title').textContent = '欢迎回来。';
    doorStatus.textContent = '本次入住人数　2。';
    doorAction.hidden = true;
    doorAction.nextElementSibling.focus({preventScroll:true});
    doorSound(.32);
    doorSound(.17,.4);
  }
});
addEventListener('resize', () => {
  if (doorState === 1 || doorState === 3) renderDoor();
});

const goBack = doorAction.nextElementSibling;
goBack.addEventListener('click', () => {
  clearTimeout(doorTimer);
  doorState = 0;
  doorStage.dataset.state = 'closed';
  byId('door-label').textContent = '217 房 · 退房';
  byId('door-title').textContent = '房卡还在你手里。';
  doorStatus.textContent = '走廊有灯。刷卡就能出去。';
  doorAction.hidden = false;
  doorAction.disabled = false;
  doorAction.textContent = '刷房卡';
});

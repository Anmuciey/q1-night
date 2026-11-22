const byId = id => document.getElementById(id);
const clamp = value => Math.max(0, Math.min(1, value));
const calm = matchMedia('(prefers-reduced-motion: reduce)');
const hall = byId('hall');
const face = byId('face');
const descent = byId('descent');
let audio;
let replayFrame;
let scrollFrame;

function knock(volume, delay = 0) {
  if (!audio) return;
  const start = audio.currentTime + delay;
  const oscillator = audio.createOscillator();
  const envelope = audio.createGain();
  oscillator.frequency.setValueAtTime(96, start);
  oscillator.frequency.exponentialRampToValueAtTime(37, start + .11);
  envelope.gain.setValueAtTime(volume, start);
  envelope.gain.exponentialRampToValueAtTime(.001, start + .24);
  oscillator.connect(envelope).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + .25);
}

byId('sound').addEventListener('click', async event => {
  const button = event.currentTarget;
  if (!audio) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) {
      button.disabled = true;
      button.textContent = '当前浏览器无法播放环境音';
      return;
    }
    audio = new Context();
  }
  const enabled = button.getAttribute('aria-pressed') !== 'true';
  await (enabled ? audio.resume() : audio.suspend());
  button.setAttribute('aria-pressed', String(enabled));
  button.textContent = enabled ? '关闭环境音' : '开启环境音';
  if (enabled) knock(.08);
});

byId('check-in').addEventListener('click', event => {
  event.currentTarget.hidden = true;
  byId('receipt').textContent = '入住人数　1 · 已分配左侧';
  const link = document.createElement('a');
  link.href = '#record';
  link.className = 'button light';
  link.textContent = '查看 217 房房务记录';
  event.currentTarget.after(link);
  link.focus({preventScroll:true});
});

hall.width = 900;
hall.height = 540;
const corridor = hall.getContext('2d');
function polygon(points, color) {
  corridor.beginPath();
  points.forEach(([x,y]) => corridor.lineTo(x,y));
  corridor.closePath();
  corridor.fillStyle = color;
  corridor.fill();
}

function paintHall(seconds = 0) {
  corridor.fillStyle = '#23291e';
  corridor.fillRect(0,0,900,540);
  polygon([[0,0],[288,147],[288,383],[0,540]], '#171d15');
  polygon([[900,0],[596,147],[596,383],[900,540]], '#373d30');
  polygon([[0,540],[288,383],[596,383],[900,540]], '#292b22');
  polygon([[0,0],[288,147],[596,147],[900,0]], '#171c16');
  corridor.fillStyle = '#121710';
  corridor.fillRect(388,168,103,215);
  corridor.strokeStyle = '#666a54';
  corridor.strokeRect(386,166,107,217);
  corridor.fillStyle = '#727359';
  corridor.fillRect(468,277 + (seconds >= 5 ? 3 : 0),12,3);
  corridor.fillStyle = seconds >= 6 ? '#b39b57' : '#4e5037';
  corridor.fillRect(388,380,103,3);
  polygon([[655,125],[766,65],[766,473],[655,415]], '#1b2119');
  const lamp = corridor.createRadialGradient(442,137,4,442,137,185);
  lamp.addColorStop(0, seconds >= 6 ? '#adab6966' : '#a9ad6444');
  lamp.addColorStop(1,'#b0af6500');
  corridor.fillStyle = lamp;
  corridor.fillRect(200,0,480,320);
  if (seconds >= 6.6 && seconds < 7.7) {
    polygon([[420,382],[428,382],[413,413],[391,413]],'#11160f');
    polygon([[444,382],[452,382],[463,411],[447,411]],'#11160f');
  }
  for (let i = 0; i < 1600; i++) {
    corridor.fillStyle = i % 2 ? '#ffffff0d' : '#00000020';
    corridor.fillRect(Math.random()*900, Math.random()*540, 2, 1);
  }
}

function replay() {
  cancelAnimationFrame(replayFrame);
  let start;
  let previous = -1;
  function step(now) {
    start ??= now;
    const elapsed = Math.min(8,(now-start)/1000);
    const second = Math.floor(elapsed);
    if (second !== previous) {
      previous = second;
      const clock = 54 + second;
      byId('camera-time').textContent = clock < 60 ? '02:16:' + clock : '02:17:0' + (clock - 60);
      byId('signal').textContent = second >= 8 ? '门锁闭合 · 房内活动' : second >= 6 ? '门缝光线变化' : '走廊 · 无活动';
      if (audio?.state === 'running' && [3,6].includes(second)) knock(second === 3 ? .1 : .24);
    }
    paintHall(calm.matches ? second : elapsed);
    if (elapsed < 8) replayFrame = requestAnimationFrame(step);
  }
  replayFrame = requestAnimationFrame(step);
}
paintHall();
byId('replay').addEventListener('click', replay);
new IntersectionObserver(([entry], observer) => {
  if (entry.isIntersecting && !calm.matches) {
    observer.disconnect();
    replay();
  }
}, {threshold:.42}).observe(hall);

const mask = document.createElement('canvas');
mask.width = 440;
mask.height = 640;
const maskContext = mask.getContext('2d');
const pixels = maskContext.createImageData(mask.width, mask.height);
for (let row = 0; row < mask.height; row++) {
  for (let col = 0; col < mask.width; col++) {
    const x = (col - 220) / 172;
    const y = (row - 297) / 259;
    const depth = 1 - (x / (1 - .22*y))**2 - y*y;
    if (depth < 0) continue;
    const side = Math.abs(x);
    const socket = Math.exp(-((side - .40)**2/.032 + (y + .18 + x*.04)**2/.021));
    const nose = Math.exp(-(x*x/.016 + (y - .04)**2/.075));
    const jaw = Math.exp(-(x*x/.074 + (y - .54 + x*x*.3)**2/.095));
    const pupil = Math.exp(-((side - .405)**2/.001 + (y + .18 + x*.04)**2/.0014));
    const tooth = x*x < .033 && y > .375 && y < .43 ? Math.abs(Math.sin(x*67))*39 : 0;
    const value = Math.max(0, (Math.sqrt(depth)*.77-x*.37)*(1-socket*1.7)*(1-jaw*2.0)+nose*.28)*112 + pupil*136 + tooth + Math.random()*17;
    pixels.data.set([value*1.38,value*.88,value*.72,Math.min(255,depth*720)], (row*mask.width + col)*4);
  }
}
maskContext.putImageData(pixels,0,0);

const finalContext = face.getContext('2d');
const beats = [
  ['还有一条记录。','麦克风收录到连续的呼吸。'],
  ['屏住呼吸。','录音里的那一声，还在继续。'],
  ['它离开了床底。','床垫压力：左侧 1，右侧 0。'],
  ['它在你这边。','床垫压力：左侧 2，右侧 0。'],
  ['有人在门口。','房卡读取器亮了。']
];
let lastBeat = -1;
function paintEnding() {
  scrollFrame = 0;
  const height = face.clientHeight;
  const width = face.clientWidth;
  const bounds = descent.getBoundingClientRect();
  if (bounds.top > innerHeight || bounds.bottom < 0) return;
  const progress = clamp(-bounds.top / Math.max(1, bounds.height - height));
  const beat = Math.min(4, Math.floor(progress*5));
  if (beat !== lastBeat) {
    byId('ending-title').textContent = beats[beat][0];
    byId('end-line').textContent = beats[beat][1];
    byId('stamp').textContent = beat >= 4 ? '217 房 · 床灯无响应' : '217 房 · 02:17:03';
    if (beat > lastBeat && beat >= 2 && audio?.state === 'running') {
      knock(.22);
      if (beat === 4) knock(.16,.27);
    }
    lastBeat = beat;
  }
  if (face.width !== width || face.height !== height) {
    face.width = width;
    face.height = height;
  }
  finalContext.clearRect(0,0,width,height);
  const movement = calm.matches ? beat/4 : progress;
  const reveal = clamp((movement-.24)/.76) * .67;
  const scale = height*(.44 + reveal*1.42);
  const center = width*(.68 - reveal*.15);
  const light = finalContext.createRadialGradient(center,height*.44,0,center,height*.44,height*.66);
  light.addColorStop(0,'rgba(118,29,19,' + reveal*.46 + ')');
  light.addColorStop(1,'#08050400');
  finalContext.fillStyle = light;
  finalContext.fillRect(0,0,width,height);
  finalContext.globalAlpha = reveal;
  finalContext.drawImage(mask,center-scale*.343,height*.44-scale*.49,scale*.686,scale);
  finalContext.globalAlpha = 1;
}
function scheduleEnding() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(paintEnding);
}
addEventListener('scroll',scheduleEnding,{passive:true});
addEventListener('resize',scheduleEnding);
scheduleEnding();

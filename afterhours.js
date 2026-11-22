const chrome = document.querySelector('.night-chrome');
const phaseSections = [...document.querySelectorAll('[data-corruption]')];
const phaseLabels = [
  ['入夜','217 房 · 住客 1','退房'],
  ['入夜','217 房 · 入住确认','查看房务'],
  ['房务','217 房 · 人数待核对','查看回放'],
  ['监控','信号中断 · 02:17:02','返回客房'],
  ['入 夜','217 房 · 217 房','探索睡眠空间'],
  ['217','床灯无响应','去门口'],
  ['','门锁 · 房内端','结束体验']
];
const phaseLinks = ['#door','#record','#review','#bedside','#bedside','#door','#top'];
let displayedPhase = -1;
let phaseFrame = 0;

function updatePhase() {
  phaseFrame = 0;
  const trigger = innerHeight * .42;
  let phase = 0;
  for (const section of phaseSections) {
    if (section.getBoundingClientRect().top <= trigger) phase = Number(section.dataset.corruption);
  }
  if (phase === displayedPhase) return;
  displayedPhase = phase;
  document.body.dataset.phase = phase;
  chrome.hidden = phase === 0;
  const [name,status,link] = phaseLabels[phase];
  byId('chrome-name').textContent = name;
  byId('chrome-status').textContent = status;
  byId('chrome-link').textContent = link;
  byId('chrome-link').href = phaseLinks[phase];
}

function queuePhase() {
  if (!phaseFrame) phaseFrame = requestAnimationFrame(updatePhase);
}
addEventListener('scroll',queuePhase,{passive:true});
addEventListener('resize',queuePhase);
queuePhase();

const routeButtons = document.querySelectorAll('[data-route]');
routeButtons.forEach(button => {
  button.setAttribute('aria-pressed','false');
  button.addEventListener('click', () => {
    const route = button.dataset.route;
    routeButtons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    byId('floor-map').dataset.route = route;
    byId('route-result').textContent = route === 'stair'
      ? '楼梯间门牌已重新识别：217 房。'
      : '电梯已抵达。轿厢的地毯与你脚下的是同一块。';
  });
});

const auditButtons = document.querySelectorAll('[data-audit]');
const auditReplies = {
  lock: '门锁记录有效。室内有人握住了把手，持续四秒。',
  bed: '已标记。房务提醒：离开前请勿把脚垂到地面。',
  card: '复核退回。这张卡正在被另一位住客使用。'
};
auditButtons.forEach(button => {
  button.setAttribute('aria-pressed','false');
  button.addEventListener('click', () => {
    auditButtons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    byId('audit-result').textContent = auditReplies[button.dataset.audit];
  });
});

const playback = byId('voice-replay');
const terminal = playback.closest('.voice-terminal');
const voiceClock = byId('voice-clock');
const voiceCaption = byId('voice-caption');
let voiceTimer;
const voiceBeats = [
  [0,'[两声轻响。]'],
  [3,'「前台吗？我在楼下。房里的那个人为什么还在用我的卡？」'],
  [7,'「请不要告诉他我打过电话。」'],
  [10,'[听筒紧贴衣料，声音突然变近。]'],
  [12,'「他刚刚把灯关了。」'],
  [14,'[留言结束。来源：217 房内线。]']
];

function stopVoice() {
  clearInterval(voiceTimer);
  voiceTimer = undefined;
  terminal.dataset.playing = 'false';
  playback.textContent = '重放留言';
}

playback.addEventListener('click', () => {
  if (voiceTimer !== undefined) {
    stopVoice();
    return;
  }
  let elapsed = 0;
  terminal.dataset.playing = 'true';
  playback.textContent = '停止回放';
  function renderVoice() {
    voiceClock.textContent = '00:' + String(elapsed).padStart(2,'0') + ' / 00:14';
    const beat = voiceBeats.find(([second]) => second === elapsed);
    if (beat) voiceCaption.textContent = beat[1];
    if ((elapsed === 0 || elapsed === 10) && audio?.state === 'running') knock(.12);
    if (elapsed === 14) stopVoice();
  }
  renderVoice();
  voiceTimer = setInterval(() => { elapsed++; renderVoice(); },1000);
});

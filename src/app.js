const packetForm = document.querySelector('#packetForm');
const setup = document.querySelector('#setup');
const game = document.querySelector('#game');
const rankingSection = document.querySelector('#rankingSection');
const packetInfo = document.querySelector('#packetInfo');
const currentPlayer = document.querySelector('#currentPlayer');
const drawBtn = document.querySelector('#drawBtn');
const drawResult = document.querySelector('#drawResult');
const ranking = document.querySelector('#ranking');
const demoBtn = document.querySelector('#demoBtn');
const restartBtn = document.querySelector('#restartBtn');

let state = null;

const money = (n) => `¥${n.toFixed(2)}`;

function splitRedPacket(total, count) {
  // 双均值算法（保证每个红包至少 0.01 元）
  const results = [];
  let remain = Math.round(total * 100);

  for (let i = 0; i < count - 1; i += 1) {
    const max = Math.floor((remain / (count - i)) * 2 - 1);
    const value = Math.max(1, Math.floor(Math.random() * max) + 1);
    remain -= value;
    results.push(value / 100);
  }

  results.push(remain / 100);
  return results.sort(() => Math.random() - 0.5);
}

function sanitizePlayers(raw) {
  const unique = new Set();
  raw
    .split(/\n|,|，/g)
    .map((n) => n.trim())
    .filter(Boolean)
    .forEach((name) => unique.add(name.slice(0, 12)));
  return [...unique];
}

function renderRanking(records) {
  ranking.innerHTML = '';
  records
    .sort((a, b) => b.amount - a.amount)
    .forEach((item, i) => {
      const li = document.createElement('li');
      const title = i === 0 ? ' 👑 手气最佳' : '';
      li.textContent = `${item.name}：${money(item.amount)}${title}`;
      ranking.appendChild(li);
    });
}

function finishGame() {
  drawBtn.disabled = true;
  drawResult.textContent = '红包抢完啦，恭喜发财！';
  renderRanking(state.records);
  rankingSection.classList.remove('hidden');
}

function drawPacket() {
  const player = state.players[state.turn];
  const amount = state.packets[state.turn];
  state.records.push({ name: player, amount });

  drawResult.textContent = `${player} 抢到了 ${money(amount)}`;
  state.turn += 1;

  if (state.turn >= state.players.length || state.turn >= state.packets.length) {
    currentPlayer.textContent = '当前：已结束';
    finishGame();
    return;
  }

  currentPlayer.textContent = `当前：${state.players[state.turn]}`;
}

packetForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const greeting = document.querySelector('#greeting').value.trim() || '恭喜发财';
  const totalAmount = Number(document.querySelector('#totalAmount').value);
  const packetCount = Number(document.querySelector('#packetCount').value);
  const players = sanitizePlayers(document.querySelector('#players').value);

  if (!Number.isFinite(totalAmount) || totalAmount < 0.01) {
    alert('红包总额至少 0.01 元');
    return;
  }
  if (!Number.isInteger(packetCount) || packetCount < 1) {
    alert('红包个数至少 1 个');
    return;
  }
  if (players.length < 1) {
    alert('请至少输入 1 位参与者');
    return;
  }

  const realCount = Math.min(packetCount, players.length);
  const packets = splitRedPacket(totalAmount, realCount);

  state = {
    greeting,
    totalAmount,
    packets,
    players: players.slice(0, realCount),
    records: [],
    turn: 0
  };

  packetInfo.textContent = `${greeting}｜总额 ${money(totalAmount)} ｜${realCount} 个红包`;
  currentPlayer.textContent = `当前：${state.players[0]}`;
  drawResult.textContent = '点击“开红包”开始抢';
  drawBtn.disabled = false;

  game.classList.remove('hidden');
  rankingSection.classList.add('hidden');
  setup.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

demoBtn.addEventListener('click', () => {
  document.querySelector('#players').value = '小明\n小红\n阿杰\n乐乐\n可可\n阿星\n阿宁\n小雨';
});

drawBtn.addEventListener('click', () => {
  if (!state) return;
  drawPacket();
});

restartBtn.addEventListener('click', () => {
  if (!state) return;
  const packets = splitRedPacket(state.totalAmount, state.players.length);
  state = { ...state, packets, records: [], turn: 0 };
  currentPlayer.textContent = `当前：${state.players[0]}`;
  drawResult.textContent = '新一轮开始，祝你手气爆棚！';
  drawBtn.disabled = false;
  rankingSection.classList.add('hidden');
});

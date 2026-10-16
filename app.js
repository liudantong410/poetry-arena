/**
 * 诗阵 · 主控制器
 * 屏幕：home / duel(飞花令·接龙) / bomb-menu / lobby(联机大厅) / bomb
 */

const App = {
  currentDifficulty: 'medium',

  // 飞花令 / 接龙
  duelMode: null,
  game: null,
  errorTimer: null,

  // 炸弹
  bombKind: null,          // 'word' | 'poem'
  bombGame: null,          // 单机引擎
  host: null,              // 联机主机
  guest: null,             // 联机客人
  netMode: null,           // 'host' | 'guest' | null
  localSeatId: 'human',
  bombErrorTimer: null,
  lastBombState: null,

  // ====== 实景背景图配置 ======
  // 将自己拍摄的中国山水实景照片放入 bg/ 文件夹，
  // 然后在下面数组中添加文件名（如 'bg/zhangjiajie.jpg'）。
  // 每天随机选一张作为全站背景（各屏统一）。
  // 留空数组则使用内置 SVG 水墨山水背景。
  SCENERY_BG: [],

  init() {
    this.show('screen-home');
    this.bindEvents();
    this.updateStats();
    this.trySceneryBg();
  },

  /** 尝试加载实景照片作为背景；失败则保持 SVG */
  trySceneryBg() {
    if (!this.SCENERY_BG.length) return;
    const seed = new Date().getDate() + new Date().getMonth() * 31;
    const path = this.SCENERY_BG[seed % this.SCENERY_BG.length];
    const img = new Image();
    img.onload = () => {
      document.body.style.backgroundImage = `url("${path}")`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
      // 让半透明卡片更通透以展示背景
      document.documentElement.classList.add('has-scenery');
    };
    img.onerror = () => { /* 图片不存在，保持 SVG 背景 */ };
    img.src = path;
  },

  // ============ 屏幕切换 ============
  show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
  },

  // ============ 事件绑定 ============
  bindEvents() {
    // 首页模式卡
    document.querySelectorAll('.mode-card').forEach(card => {
      card.addEventListener('click', () => {
        const mode = card.dataset.mode;
        if (mode === 'fly-flower' || mode === 'chain' || mode === 'idiom-chain') this.openDuel(mode);
        else if (mode === 'bomb-poem') this.openBombSolo('poem');
        else if (mode === 'bomb-word-menu') this.show('screen-bomb-menu');
        else if (mode === 'daily-challenge') this.openDaily();
      });
    });

    // 难度
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentDifficulty = btn.dataset.diff;
        document.querySelectorAll('.diff-btn').forEach(b =>
          b.classList.toggle('active', b === btn));
      });
    });

    // 飞花令/接龙
    document.getElementById('btn-start').addEventListener('click', () => this.startDuel());
    document.getElementById('btn-submit').addEventListener('click', () => this.duelSubmit());
    document.getElementById('game-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.duelSubmit();
    });
    document.getElementById('btn-pass').addEventListener('click', () => this.game && this.game.playerPass());
    document.getElementById('btn-replay').addEventListener('click', () => {
      document.getElementById('result-modal').classList.remove('active');
      this.startDuel();
    });
    document.getElementById('btn-home').addEventListener('click', () => {
      document.getElementById('result-modal').classList.remove('active');
      this.show('screen-home');
    });
    document.querySelector('.btn-duel-back').addEventListener('click', () => {
      this.cleanupDuel();
      this.show('screen-home');
    });

    // 炸弹菜单
    document.getElementById('btn-bomb-solo').addEventListener('click', () => this.openBombSolo('word'));
    document.getElementById('btn-bomb-host').addEventListener('click', () => this.createRoom());
    document.getElementById('btn-bomb-join').addEventListener('click', () => this.joinRoom());
    document.getElementById('join-code').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.joinRoom();
    });
    document.querySelector('.btn-home-back').addEventListener('click', () => this.show('screen-home'));

    // 大厅
    document.getElementById('btn-lobby-back').addEventListener('click', () => this.leaveLobby());
    document.getElementById('btn-copy-code').addEventListener('click', () => this.copyRoomCode());
    document.getElementById('btn-ai-plus').addEventListener('click', () => this.host && this.host.addAI());
    document.getElementById('btn-ai-minus').addEventListener('click', () => this.host && this.host.removeAI());
    document.getElementById('btn-lobby-start').addEventListener('click', () => this.hostStartGame());

    // 炸弹游戏
    document.getElementById('btn-bomb-back').addEventListener('click', () => this.leaveBomb());
    document.getElementById('btn-bomb-start').addEventListener('click', () => this.startBombSolo());
    document.getElementById('btn-bomb-submit').addEventListener('click', () => this.bombSubmit());
    document.getElementById('bomb-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.bombSubmit();
    });

    // 每日诗词挑战
    document.querySelector('.btn-daily-back').addEventListener('click', () => {
      if (this.dailyGame) this.dailyGame.reset();
      this.show('screen-home');
    });
    document.getElementById('btn-daily-start').addEventListener('click', () => this.startDaily());
    document.getElementById('btn-daily-again').addEventListener('click', () => this.startDaily(true));
    document.getElementById('btn-daily-home').addEventListener('click', () => this.show('screen-home'));

    // 对阵玩法提示（每局 3 次）
    document.getElementById('btn-hint').addEventListener('click', () => this.duelHint());
    document.getElementById('btn-bomb-hint').addEventListener('click', () => this.bombHint());

    // 社区
    document.getElementById('btn-community').addEventListener('click', () => this.openCommunity());
    document.querySelector('.btn-community-back').addEventListener('click', () => this.show('screen-home'));
    document.getElementById('btn-community-post').addEventListener('click', () => this.postCommunity());
  },

  updateStats() {
    const s = DB.getStats();
    const wordCount = Object.values(WORD_BANK).reduce((n, arr) => n + arr.length, 0);
    const el = document.getElementById('db-stats');
    if (el) el.textContent = `诗词库：${s.poems} 首 / ${s.lines} 句 · 炸弹词库：${wordCount} 词 · 成语库：${IdiomDB.getSize()} 条`;
  },

  // ================================================================
  // 飞花令 / 接龙
  // ================================================================
  openDuel(mode) {
    this.duelMode = mode;
    this.cleanupDuel();
    // 不同挑战窗口切换不同山水背景
    const duel = document.getElementById('screen-duel');
    duel.classList.remove('bg-duel', 'bg-duel-fly', 'bg-duel-chain', 'bg-duel-idiom');
    duel.classList.add(
      mode === 'fly-flower' ? 'bg-duel-fly' :
      mode === 'idiom-chain' ? 'bg-duel-idiom' : 'bg-duel-chain');
    this.show('screen-duel');
    const title = document.getElementById('game-title');
    const desc = document.getElementById('game-desc');
    const ffArea = document.getElementById('ff-target-area');
    if (mode === 'fly-flower') {
      title.textContent = '飞花令 · AI 擂台';
      desc.textContent = '与 AI 轮流说出含指定关键字的诗句，接不出者负';
      ffArea.style.display = 'block';
    } else if (mode === 'idiom-chain') {
      title.textContent = '成语接龙 · AI 对战';
      desc.textContent = '顶针格接龙，上句末字即下句首字，接不出者负';
      ffArea.style.display = 'none';
    } else {
      title.textContent = '接龙 · AI 对战';
      desc.textContent = '诗句接龙，上句末字即下句首字，接不出者负';
      ffArea.style.display = 'none';
    }
    document.getElementById('start-area').style.display = 'flex';
  },

  startDuel() {
    document.getElementById('start-area').style.display = 'none';
    document.getElementById('input-area').style.display = 'flex';
    document.getElementById('score-player').textContent = '0';
    document.getElementById('score-ai').textContent = '0';
    document.getElementById('history-list').innerHTML = '';
    document.getElementById('game-input').value = '';
    const hintBtn = document.getElementById('btn-hint');
    hintBtn.textContent = '提示 ×3';
    hintBtn.disabled = false;

    if (this.duelMode === 'fly-flower') {
      this.game = new FlyFlowerGame(this.currentDifficulty);
    } else if (this.duelMode === 'idiom-chain') {
      this.game = new IdiomChainGame(this.currentDifficulty);
    } else {
      this.game = new ChainGame(this.currentDifficulty);
    }
    this.game.onStateChange = s => {
      if (this.duelMode === 'fly-flower') this.renderFlyFlower(s);
      else if (this.duelMode === 'idiom-chain') this.renderIdiomChain(s);
      else this.renderChain(s);
    };
    this.game.onTimerTick = t => this.renderDuelTimer(t);
    this.game.onAIThinking = () => {
      document.getElementById('turn-indicator').innerHTML =
        '<span class="turn-ai">AI 思考中<span class="dots">...</span></span>';
    };
    this.game.onGameOver = (winner, reason, result) => this.showDuelResult(winner, reason, result);
    this.game.start();
  },

  renderFlyFlower(s) {
    document.getElementById('ff-target').textContent = s.targetChar;
    document.getElementById('score-player').textContent = s.playerScore;
    document.getElementById('score-ai').textContent = s.aiScore;
    const turn = document.getElementById('turn-indicator');
    const input = document.getElementById('input-area');
    if (s.currentTurn === 'player' && !s.gameOver) {
      turn.innerHTML = '<span class="turn-player">你的回合</span>';
      input.style.display = 'flex';
      document.getElementById('game-input').focus();
    } else if (!s.gameOver) {
      turn.innerHTML = '<span class="turn-ai">AI 思考中...</span>';
      input.style.display = 'none';
    }
    this.renderDuelHistory(s.history, false);
    document.getElementById('input-hint').textContent = `请输入含"${s.targetChar}"字的诗句`;
  },

  renderChain(s) {
    document.getElementById('score-player').textContent = s.playerScore;
    document.getElementById('score-ai').textContent = s.aiScore;
    const turn = document.getElementById('turn-indicator');
    const input = document.getElementById('input-area');
    if (s.currentTurn === 'player' && !s.gameOver) {
      turn.innerHTML = '<span class="turn-player">你的回合</span>';
      input.style.display = 'flex';
      document.getElementById('game-input').focus();
    } else if (!s.gameOver) {
      turn.innerHTML = '<span class="turn-ai">AI 思考中...</span>';
      input.style.display = 'none';
    }
    this.renderDuelHistory(s.chain, true);
    document.getElementById('input-hint').textContent = s.isFirst
      ? '首回合，请输入任意一句诗'
      : `请输入以"${s.lastChar}"开头的诗句`;
  },

  renderIdiomChain(s) {
    document.getElementById('score-player').textContent = s.playerScore;
    document.getElementById('score-ai').textContent = s.aiScore;
    const turn = document.getElementById('turn-indicator');
    const input = document.getElementById('input-area');
    if (s.currentTurn === 'player' && !s.gameOver) {
      turn.innerHTML = '<span class="turn-player">你的回合</span>';
      input.style.display = 'flex';
      document.getElementById('game-input').focus();
    } else if (!s.gameOver) {
      turn.innerHTML = '<span class="turn-ai">AI 思考中...</span>';
      input.style.display = 'none';
    }
    const box = document.getElementById('history-list');
    box.innerHTML = '';
    s.chain.slice().reverse().forEach(item => {
      const el = document.createElement('div');
      el.className = `history-item ${item.who}`;
      el.innerHTML = `<div class="history-line">${item.line} <span class="chain-char">「${item.lastChar}」→</span></div>`;
      box.appendChild(el);
    });
    document.getElementById('input-hint').textContent = s.isFirst
      ? '首回合，请输入任意一个四字成语'
      : `请输入以"${s.lastChar}"开头的成语`;
  },

  renderDuelHistory(list, isChain) {
    const box = document.getElementById('history-list');
    box.innerHTML = '';
    list.slice().reverse().forEach(item => {
      const el = document.createElement('div');
      el.className = `history-item ${item.who}`;
      const tail = isChain ? ` <span class="chain-char">「${item.lastChar}」→</span>` : '';
      el.innerHTML = `
        <div class="history-line">${item.line}${tail}</div>
        <div class="history-info">
          <span class="history-author">${item.dynasty}·${item.author}</span>
          <span class="history-title">《${item.title}》</span>
          <span class="history-score">+${item.score}</span>
        </div>`;
      box.appendChild(el);
    });
  },

  renderDuelTimer(t) {
    document.getElementById('timer-display').textContent = t + 's';
    const bar = document.getElementById('timer-bar');
    bar.style.width = (t / this.game.timeLimit * 100) + '%';
    bar.classList.toggle('urgent', t <= 3);
  },

  duelSubmit() {
    const input = document.getElementById('game-input');
    const r = this.game.playerSubmit(input.value);
    if (!r.ok) {
      this.showDuelError(r.msg);
    } else {
      input.value = '';
    }
  },

  showDuelError(msg) {
    const el = document.getElementById('error-msg');
    el.textContent = msg;
    el.classList.remove('is-hint');
    el.classList.add('show');
    clearTimeout(this.errorTimer);
    this.errorTimer = setTimeout(() => el.classList.remove('show'), 2500);
  },

  // 提示：从词库给出符合当前约束的句子并填入输入框，每局限 3 次
  duelHint() {
    if (!this.game || this.game.gameOver) return;
    const btn = document.getElementById('btn-hint');
    const h = this.game.hint();
    btn.textContent = this.game.hintsLeft > 0 ? `提示 ×${this.game.hintsLeft}` : '提示用尽';
    if (this.game.hintsLeft <= 0) btn.disabled = true;
    if (!h) {
      this.showDuelError('当前没有可提示的句子了');
      return;
    }
    this.showDuelHint(this.duelMode === 'idiom-chain'
      ? `提示：可以接「${h.line}」`
      : `提示：「${h.line}」——${h.poem.d}·${h.poem.a}《${h.poem.t}》`);
    document.getElementById('game-input').value = h.line;
  },

  showDuelHint(msg) {
    const el = document.getElementById('error-msg');
    el.innerHTML = `<span class="hint-glyph">筆</span>${msg}`;
    el.classList.add('show', 'is-hint');
    clearTimeout(this.errorTimer);
    this.errorTimer = setTimeout(() => el.classList.remove('show', 'is-hint'), 6000);
  },

  showDuelResult(winner, reason, result) {
    document.getElementById('input-area').style.display = 'none';
    document.getElementById('timer-bar').style.width = '0%';
    const title = document.getElementById('result-title');
    title.textContent = winner === 'player' ? '你赢了！' : 'AI 获胜';
    title.className = winner === 'player' ? 'result-win' : 'result-lose';
    document.getElementById('result-reason').textContent = reason;
    document.getElementById('result-score').innerHTML =
      `你：${result.playerScore} 分　|　AI：${result.aiScore} 分`;

    const list = result.history || result.chain || [];
    const seen = new Set();
    const poemsBox = document.getElementById('result-poems');
    if (this.duelMode === 'idiom-chain') {
      poemsBox.innerHTML = '<h4>本局成语链</h4>';
      list.forEach(item => {
        const card = document.createElement('div');
        card.className = 'poem-card';
        card.innerHTML = `<div class="history-line">${item.line} <span class="history-score">+${item.score}</span></div>`;
        poemsBox.appendChild(card);
      });
      document.getElementById('result-modal').classList.add('active');
      return;
    }
    poemsBox.innerHTML = '<h4>本轮涉及诗词（点击展开全诗）</h4>';
    list.forEach(item => {
      if (seen.has(item.title + item.author)) return;
      seen.add(item.title + item.author);
      const poem = DB.getPoemByLine(item.line) || item;
      const card = document.createElement('div');
      card.className = 'poem-card collapsible';
      card.innerHTML = `
        <div class="poem-card-head">
          <span class="poem-card-title">《${poem.t || item.title}》</span>
          <span class="poem-card-author">${poem.d || item.dynasty}·${poem.a || item.author}</span>
          <span class="poem-card-arrow">▸</span>
        </div>
        <div class="poem-card-body">
          <div class="poem-lines">${(poem.lines || []).join('，')}。</div>
          <div class="poem-card-source">${poem.s || item.source || ''}</div>
        </div>`;
      card.querySelector('.poem-card-head').addEventListener('click', () => {
        card.classList.toggle('open');
      });
      poemsBox.appendChild(card);
    });
    document.getElementById('result-modal').classList.add('active');
  },

  cleanupDuel() {
    if (this.game) { this.game.stopTimer(); this.game = null; }
    document.getElementById('input-area').style.display = 'none';
    document.getElementById('result-modal').classList.remove('active');
    const bar = document.getElementById('timer-bar');
    bar.style.width = '0%';
    bar.classList.remove('urgent');
    document.getElementById('history-list').innerHTML = '';
    document.getElementById('start-area').style.display = 'flex';
    document.getElementById('turn-indicator').textContent = '准备开始...';
    document.getElementById('timer-display').textContent = '--';
  },

  // ================================================================
  // 炸弹 · 单机
  // ================================================================
  openBombSolo(kind) {
    this.bombKind = kind;
    this.netMode = null;
    this.localSeatId = 'human';
    this.bombGame = null;
    this.show('screen-bomb');
    document.getElementById('bomb-play').style.display = 'none';
    document.getElementById('bomb-over').style.display = 'none';

    const intro = document.getElementById('bomb-intro');
    intro.style.display = 'block';
    document.getElementById('bomb-title').textContent = kind === 'word' ? '词语炸弹' : '诗词炸弹';
    document.getElementById('bomb-room-label').textContent = '单人挑战';

    const rules = document.getElementById('bomb-intro-rules');
    if (kind === 'word') {
      rules.innerHTML = `
        <div class="bomb-rules-title">玩法</div>
        <p>系统给出拼音首字母（如 <b>BM</b>，即首字声母 <b>B</b> + 次字声母 <b>M</b>，如「保密 bǎomì」「报名 bàomíng」「避免 bìmiǎn」），所有符合的词中藏着<b>唯一一个炸弹词</b>。你和 3 名 AI 围坐轮流说词，安全词被逐个排除——<b>踩中炸弹词者输</b>。AI 同样不知道炸弹是哪个。</p>`;
    } else {
      rules.innerHTML = `
        <div class="bomb-rules-title">玩法</div>
        <p>系统给定一个关键字（如 <b>月</b>），题库中所有含该字的诗句里藏着<b>唯一一句炸弹诗</b>。你和 3 名 AI 轮流说出含该字的诗句，<b>谁说出炸弹句谁炸</b>。名句未必安全，冷门也可能是陷阱。</p>`;
    }
  },

  startBombSolo() {
    const seats = [
      { id: 'human', name: '你', isLocal: true },
      { id: 'ai0', name: AI_NAMES[0], isAI: true },
      { id: 'ai1', name: AI_NAMES[1], isAI: true },
      { id: 'ai2', name: AI_NAMES[2], isAI: true }
    ];
    this.bombGame = new BombGame({
      kind: this.bombKind,
      seats,
      timeLimit: this.bombKind === 'word' ? 30 : this.timeByDifficulty()
    });
    this.bindBombEngine(this.bombGame);
    document.getElementById('bomb-intro').style.display = 'none';
    document.getElementById('bomb-over').style.display = 'none';
    document.getElementById('bomb-play').style.display = 'flex';
    document.getElementById('bomb-history').innerHTML = '';
    const bh = document.getElementById('btn-bomb-hint');
    bh.textContent = '提示 ×3';
    bh.disabled = false;
    bh.style.display = '';
    this.bombGame.start();
  },

  timeByDifficulty() {
    return { easy: 60, medium: 45, hard: 30 }[this.currentDifficulty] || 45;
  },

  bindBombEngine(g) {
    g.onStateChange = (s) => this.renderBomb(s);
    g.onTimerTick = (t) => {
      document.getElementById('bomb-timer-text').textContent = t + 's';
      const bar = document.getElementById('bomb-timer-bar');
      bar.style.width = (t / g.timeLimit * 100) + '%';
      bar.classList.toggle('urgent', t <= 5);
    };
    g.onGameOver = (loserId, s) => this.showBombOver(loserId, s);
  },

  bombSubmit() {
    const input = document.getElementById('bomb-input');
    const val = input.value;
    if (!val.trim()) return;
    let r;
    if (this.netMode === 'host' && this.host) {
      r = this.host.localSubmit(val);
    } else if (this.netMode === 'guest' && this.guest) {
      this.guest.submit(val.trim());
      input.value = '';
      return;
    } else if (this.bombGame) {
      r = this.bombGame.localSubmit(val);
    }
    if (r && !r.ok) this.showBombError(r.msg);
    else if (r) input.value = '';
  },

  showBombError(msg) {
    const el = document.getElementById('bomb-error');
    el.textContent = msg;
    el.classList.remove('is-hint');
    el.classList.add('show');
    clearTimeout(this.bombErrorTimer);
    this.bombErrorTimer = setTimeout(() => el.classList.remove('show'), 2500);
  },

  // 炸弹提示（仅单机）：给出一个确认安全的候选，每局限 3 次
  bombHint() {
    if (this.netMode) return; // 联机时无从得知炸弹，不启用
    const g = this.bombGame;
    if (!g || g.gameOver) return;
    const btn = document.getElementById('btn-bomb-hint');
    const h = g.hint();
    btn.textContent = g.hintsLeft > 0 ? `提示 ×${g.hintsLeft}` : '提示用尽';
    if (g.hintsLeft <= 0) btn.disabled = true;
    if (!h) {
      this.showBombError('当前没有可提示的了');
      return;
    }
    this.showBombHint(g.kind === 'word'
      ? `提示：「${h}」是安全词`
      : `提示：「${h}」不是炸弹句`);
    document.getElementById('bomb-input').value = h;
  },

  showBombHint(msg) {
    const el = document.getElementById('bomb-error');
    el.innerHTML = `<span class="hint-glyph">筆</span>${msg}`;
    el.classList.add('show', 'is-hint');
    clearTimeout(this.bombErrorTimer);
    this.bombErrorTimer = setTimeout(() => el.classList.remove('show', 'is-hint'), 6000);
  },

  // ============ 炸弹状态渲染（单机/联机通用） ============
  renderBomb(s) {
    this.lastBombState = s;
    // 座位
    const seatsBox = document.getElementById('seats-bar');
    seatsBox.innerHTML = '';
    s.seats.forEach((seat, i) => {
      const chip = document.createElement('div');
      let cls = 'seat';
      if (i === s.current && !s.gameOver) cls += ' active';
      if (s.gameOver && seat.id === s.loserId) cls += ' exploded';
      if (seat.id === this.localSeatId) cls += ' me';
      chip.className = cls;
      chip.innerHTML = `
        <span class="seat-name">${seat.id === this.localSeatId ? '你' : seat.name}</span>
        ${seat.isAI ? '<span class="seat-tag">AI</span>' : ''}`;
      seatsBox.appendChild(chip);
    });

    // 提示
    const label = document.getElementById('bomb-cue-label');
    const main = document.getElementById('bomb-cue-main');
    const sub = document.getElementById('bomb-cue-sub');
    if (s.kind === 'word') {
      label.textContent = '首字母';
      main.textContent = s.round.code;
    } else {
      label.textContent = '关键字';
      main.textContent = s.round.char;
    }
    sub.textContent = `候选 ${s.round.total} 个，已排除 ${s.usedCount} 个，剩余 ${s.remain} 个（含 1 个炸弹）`;

    // 回合
    const turn = document.getElementById('bomb-turn');
    const inputArea = document.getElementById('bomb-input-area');
    const currentSeat = s.seats[s.current];
    if (!s.gameOver) {
      const isMyTurn = currentSeat && currentSeat.id === this.localSeatId;
      if (isMyTurn) {
        turn.innerHTML = '<span class="turn-player">轮到你了，小心地雷</span>';
        inputArea.style.display = 'flex';
        document.getElementById('bomb-input').focus();
      } else {
        turn.innerHTML = `<span class="turn-ai">${currentSeat ? currentSeat.name : '?'} 思考中...</span>`;
        inputArea.style.display = 'none';
      }
      document.getElementById('bomb-input-hint').textContent =
        s.kind === 'word'
          ? `说一个首字母为 ${s.round.code} 的词`
          : `说一句含"${s.round.char}"字的诗`;
    } else {
      inputArea.style.display = 'none';
    }

    // 计时
    const isLocalTurn = currentSeat && currentSeat.id === this.localSeatId && !s.gameOver;
    if (isLocalTurn) {
      document.getElementById('bomb-timer-text').textContent = s.timeLeft + 's';
      const bar = document.getElementById('bomb-timer-bar');
      bar.style.width = (s.timeLeft / s.timeLimit * 100) + '%';
      bar.classList.toggle('urgent', s.timeLeft <= 5);
    } else {
      document.getElementById('bomb-timer-text').textContent = '--';
      document.getElementById('bomb-timer-bar').style.width = '0%';
    }

    // 历史（时间线，最新在底）
    const box = document.getElementById('bomb-history');
    box.innerHTML = '';
    s.history.forEach(h => {
      const el = document.createElement('div');
      el.className = 'history-item ' + (h.seatId === this.localSeatId ? 'player' : 'ai');
      let body;
      if (s.kind === 'poem' && h.detail) {
        body = `<div class="history-line">${h.text}</div>
          <div class="history-info">
            <span class="history-author">${h.detail.d}·${h.detail.a}</span>
            <span class="history-title">《${h.detail.t}》</span>
          </div>`;
      } else {
        body = `<div class="history-line">${h.text}</div>`;
      }
      el.innerHTML = `<span class="bomb-speaker">${h.seatId === this.localSeatId ? '你' : h.name}</span> ${body}`;
      box.appendChild(el);
    });
    box.scrollTop = box.scrollHeight;
  },

  showBombOver(loserId, s) {
    const loser = s.seats.find(x => x.id === loserId);
    const over = document.getElementById('bomb-over');
    over.style.display = 'flex';
    document.getElementById('bomb-input-area').style.display = 'none';

    const title = document.getElementById('bomb-over-title');
    const iLose = loserId === this.localSeatId;
    title.textContent = iLose ? '你踩雷了！' : `${loser ? loser.name : '对手'} 踩雷，你幸存！`;
    title.className = iLose ? 'result-lose' : 'result-win';

    const reveal = document.getElementById('bomb-reveal');
    const detail = document.getElementById('bomb-poem-detail');
    if (s.kind === 'word') {
      reveal.innerHTML = `炸弹词是 <b>${s.bombWord}</b><br><span class="bomb-over-sub">首字母 ${s.round.code}</span>`;
      detail.innerHTML = '';
    } else {
      reveal.innerHTML = `炸弹句是 <b>「${s.round.bombLine}」</b>`;
      const p = s.round.bombPoem;
      detail.innerHTML = `
        <div class="bomb-poem-title">《${p.t}》 ${p.d}·${p.a}</div>
        <div class="poem-lines center">${p.lines.join('，')}。</div>
        <div class="poem-card-source">${p.s}</div>`;
    }

    // 按钮
    const actions = document.getElementById('bomb-over-actions');
    actions.innerHTML = '';
    if (this.netMode === 'guest') {
      actions.innerHTML = '<div class="lobby-tip">等待房主开启下一局…</div><button class="btn-secondary" id="btn-bomb-exit2">退出房间</button>';
      document.getElementById('btn-bomb-exit2').addEventListener('click', () => this.leaveBomb());
    } else {
      const again = document.createElement('button');
      again.className = 'btn-primary';
      again.textContent = '再来一局';
      again.addEventListener('click', () => {
        if (this.netMode === 'host' && this.host) {
          this.host.restart();
        } else {
          this.startBombSolo();
        }
      });
      const home = document.createElement('button');
      home.className = 'btn-secondary';
      home.textContent = '返回菜单';
      home.addEventListener('click', () => this.leaveBomb());
      actions.appendChild(again);
      actions.appendChild(home);
    }
  },

  // ================================================================
  // 联机
  // ================================================================
  getName() {
    return (document.getElementById('join-name').value || '').trim() || '诗人';
  },

  async createRoom() {
    const name = this.getName();
    const tip = document.getElementById('lobby-tip');
    tip.textContent = '正在创建房间…';
    this.show('screen-lobby');
    this.setLobbyView('host');

    this.host = new BombHost(name, (event, payload) => this.onHostEvent(event, payload));
    try {
      const code = await this.host.create();
      tip.textContent = '';
      document.getElementById('lobby-code').textContent = code;
    } catch (e) {
      tip.textContent = e.message;
    }
  },

  onHostEvent(event, payload) {
    if (event === 'lobby') {
      this.renderLobby(payload.seats, 'host');
    } else if (event === 'state') {
      this.enterBombPlay('host');
      this.renderBomb(payload);
      if (payload.gameOver) this.showBombOver(payload.loserId, payload);
    }
  },

  async joinRoom() {
    const name = this.getName();
    const code = document.getElementById('join-code').value;
    const tip = document.getElementById('lobby-tip');
    if (!code.trim()) { this.shake('join-code'); return; }

    this.show('screen-lobby');
    this.setLobbyView('guest');
    tip.textContent = '正在加入房间…';

    this.guest = new BombGuest(name, (event, payload) => this.onGuestEvent(event, payload));
    try {
      await this.guest.join(code);
      tip.textContent = '';
    } catch (e) {
      tip.textContent = e.message;
      this.guest = null;
    }
  },

  onGuestEvent(event, payload) {
    if (event === 'lobby') {
      document.getElementById('lobby-code').textContent = payload.roomCode;
      this.renderLobby(payload.seats, 'guest');
    } else if (event === 'state') {
      this.enterBombPlay('guest');
      this.localSeatId = this.guest.myId;
      this.renderBomb(payload);
      if (payload.gameOver) this.showBombOver(payload.loserId, payload);
    } else if (event === 'reject') {
      this.showBombError(payload.msg || '无效的词');
      // 重新开放输入
      const s = this.lastBombState;
      if (s && !s.gameOver) {
        const cur = s.seats[s.current];
        if (cur && cur.id === this.localSeatId) {
          document.getElementById('bomb-input-area').style.display = 'flex';
        }
      }
    } else if (event === 'restart') {
      this.netMode = 'guest';
      this.localSeatId = this.guest.myId;
      this.setLobbyView('guest');
      this.show('screen-lobby');
    } else if (event === 'host-closed') {
      alert('房主已关闭房间');
      this.leaveBomb();
    }
  },

  setLobbyView(role) {
    document.getElementById('lobby-code-box').style.display = role === 'host' ? 'block' : 'none';
    document.getElementById('lobby-wait-box').style.display = role === 'guest' ? 'block' : 'none';
    document.getElementById('host-controls').style.display = role === 'host' ? 'block' : 'none';
    document.getElementById('lobby-players').innerHTML = '';
  },

  renderLobby(seats, role) {
    const box = document.getElementById('lobby-players');
    box.innerHTML = '';
    seats.forEach((s, i) => {
      const el = document.createElement('div');
      el.className = 'lobby-player' + (s.id === 'host' ? ' host' : '') + (s.isAI ? ' ai' : '');
      el.innerHTML = `<span class="lobby-player-name">${s.name}</span>
        ${s.isAI ? '<span class="seat-tag">AI</span>' : ''}
        ${s.id === 'host' ? '<span class="seat-tag host-tag">房主</span>' : ''}`;
      box.appendChild(el);
    });
    if (role === 'host') {
      document.getElementById('ai-count-label').textContent = `AI 玩家：${this.host.aiCount}`;
      const btn = document.getElementById('btn-lobby-start');
      btn.disabled = seats.length < 2;
      btn.textContent = seats.length >= 2 ? '开 始 游 戏' : '开 始（至少 2 人）';
    }
  },

  hostStartGame() {
    if (!this.host) return;
    const ok = this.host.startGame(30);
    if (!ok) return;
    this.netMode = 'host';
    this.localSeatId = 'host';
    this.enterBombPlay('host');
  },

  enterBombPlay(netMode) {
    this.netMode = netMode;
    this.bombKind = 'word';
    this.show('screen-bomb');
    document.getElementById('bomb-title').textContent = '词语炸弹 · 联机';
    document.getElementById('bomb-room-label').textContent =
      (netMode === 'host' ? '房间 ' + this.host.roomCode : '联机房间');
    document.getElementById('bomb-intro').style.display = 'none';
    document.getElementById('bomb-over').style.display = 'none';
    document.getElementById('bomb-play').style.display = 'flex';
    document.getElementById('bomb-history').innerHTML = '';
    document.getElementById('btn-bomb-hint').style.display = 'none'; // 联机无提示
  },

  copyRoomCode() {
    const code = document.getElementById('lobby-code').textContent;
    const text = `来「诗阵」玩词语炸弹！打开 https://liudantong410.github.io/poetry-arena/ ，输入房间号 ${code}`;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('btn-copy-code');
      btn.textContent = '已复制邀请语 ✓';
      setTimeout(() => (btn.textContent = '复制房间号'), 2000);
    }).catch(() => {});
  },

  shake(id) {
    const el = document.getElementById(id);
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 400);
  },

  leaveLobby() {
    if (this.host) { this.host.destroy(); this.host = null; }
    if (this.guest) { this.guest.destroy(); this.guest = null; }
    this.netMode = null;
    this.show('screen-bomb-menu');
  },

  leaveBomb() {
    if (this.bombGame) { this.bombGame.stopTimer(); this.bombGame = null; }
    if (this.netMode === 'host') {
      if (this.host) this.host.destroy();
      this.host = null;
      this.show('screen-home');
    } else if (this.netMode === 'guest') {
      if (this.guest) this.guest.destroy();
      this.guest = null;
      this.show('screen-home');
    } else {
      this.show('screen-home');
    }
    this.netMode = null;
  },

  // ================================================================
  // 每日诗词挑战
  // ================================================================
  dailyGame: null,

  openDaily() {
    this.show('screen-daily');
    document.getElementById('daily-intro').style.display = 'block';
    document.getElementById('daily-scroll').style.display = 'none';
    document.getElementById('daily-quiz').style.display = 'none';
    document.getElementById('daily-reveal').style.display = 'none';
  },

  startDaily(randomMode = false) {
    document.getElementById('daily-intro').style.display = 'none';
    document.getElementById('daily-scroll').style.display = 'block';
    document.getElementById('daily-quiz').style.display = 'none';
    document.getElementById('daily-reveal').style.display = 'none';

    this.dailyGame = new DailyChallenge();
    this.dailyGame.onPhaseChange = s => this.renderDaily(s);
    this.dailyGame.onReveal = r => this.renderDailyReveal(r);
    this.dailyGame.start(randomMode);
  },

  renderDaily(s) {
    if (s.phase === 'scrolling') {
      const el = document.getElementById('daily-scroll-line');
      el.textContent = s.displayLine || '';
    } else if (s.phase === 'quiz') {
      document.getElementById('daily-scroll').style.display = 'none';
      document.getElementById('daily-quiz').style.display = 'block';
      document.getElementById('daily-target-line').textContent = s.targetLine;
      if (!s.options || !s.answers) {
        console.error('[Daily] quiz 状态缺失字段:', { hasOptions: !!s.options, hasAnswers: !!s.answers, phase: s.phase, keys: Object.keys(s) });
        return;
      }
      this.renderDailyOptions('title', s.options.title || [], s.answers.title);
      this.renderDailyOptions('author', s.options.author || [], s.answers.author);
      this.renderDailyOptions('source', s.options.source || [], s.answers.source);
    }
  },

  renderDailyOptions(field, options, selected) {
    const container = document.getElementById(`daily-opts-${field}`);
    container.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'daily-option';
      if (selected === opt) btn.classList.add('selected');
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (this.dailyGame) this.dailyGame.select(field, opt);
      });
      container.appendChild(btn);
    });
  },

  renderDailyReveal(r) {
    document.getElementById('daily-quiz').style.display = 'none';
    document.getElementById('daily-reveal').style.display = 'block';

    const scoreText = ['题目', '作者', '出处'];
    const marks = [r.correct.title, r.correct.author, r.correct.source];
    const html = marks.map((ok, i) =>
      `<span class="daily-mark ${ok ? 'ok' : 'wrong'}">${ok ? '✓' : '✗'} ${scoreText[i]}</span>`
    ).join(' ');
    document.getElementById('daily-score').innerHTML = `答对 ${r.score}/3 · ${html}`;
    document.getElementById('daily-poem-title').textContent = r.poem.t;
    document.getElementById('daily-poem-meta').textContent = `${r.poem.a}（${r.poem.d}）· ${r.poem.type} · ${r.poem.s}`;
    document.getElementById('daily-poem-lines').innerHTML =
      r.poem.lines.map(l => `<div class="daily-line">${l}</div>`).join('');
  },

  // ================================================================
  // 社区（本地留言板 + 公告）
  // ================================================================
  COMMUNITY_KEY: 'poetry-arena-community',

  openCommunity() {
    this.show('screen-community');
    this.renderCommunity();
  },

  loadCommunity() {
    try {
      return JSON.parse(localStorage.getItem(this.COMMUNITY_KEY)) || [];
    } catch (e) {
      return [];
    }
  },

  saveCommunity(list) {
    try {
      localStorage.setItem(this.COMMUNITY_KEY, JSON.stringify(list));
    } catch (e) { /* 存储不可用时静默降级 */ }
  },

  postCommunity() {
    const nameEl = document.getElementById('community-name');
    const textEl = document.getElementById('community-text');
    const text = (textEl.value || '').trim();
    if (!text) { this.shake('community-text'); return; }
    const name = (nameEl.value || '').trim() || '无名诗友';
    const list = this.loadCommunity();
    list.unshift({ name, text, time: Date.now() });
    this.saveCommunity(list.slice(0, 100));
    textEl.value = '';
    this.renderCommunity();
  },

  renderCommunity() {
    const box = document.getElementById('community-messages');
    if (!box) return;
    const list = this.loadCommunity();
    if (list.length === 0) {
      box.innerHTML = '<div class="community-empty">砚台已备好，来做第一位题诗的人吧</div>';
      return;
    }
    box.innerHTML = '';
    list.forEach((m, i) => {
      const el = document.createElement('div');
      el.className = 'community-message';
      const d = new Date(m.time);
      const ts = `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      el.innerHTML = `
        <div class="community-msg-head">
          <span class="community-msg-name">${this.escapeHtml(m.name)}</span>
          <span class="community-msg-time">${ts}</span>
          <button class="community-msg-del" data-idx="${i}" title="删除">✕</button>
        </div>
        <div class="community-msg-text">${this.escapeHtml(m.text)}</div>`;
      box.appendChild(el);
    });
    box.querySelectorAll('.community-msg-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const cur = this.loadCommunity();
        cur.splice(parseInt(btn.dataset.idx, 10), 1);
        this.saveCommunity(cur);
        this.renderCommunity();
      });
    });
  },

  escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());

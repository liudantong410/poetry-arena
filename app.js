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
  duelMaxRounds: 0,        // 0=无尽（一方失败结束）, 5/10=每人 N 句后按总分结算

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
        else if (mode === 'rare-chars') this.openRare();
        else if (mode === 'naming') this.openNaming();
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
    // 局数选择（仅限飞花令/接龙，避免误伤生僻字按钮组）
    document.querySelectorAll('.duel-round-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.duelMaxRounds = parseInt(btn.dataset.rounds, 10);
        document.querySelectorAll('.duel-round-btn').forEach(b =>
          b.classList.toggle('active', b === btn));
      });
    });
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

    // 生僻字 · 设置区
    document.querySelectorAll('.rc-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        this.rareCat = btn.dataset.cat;
        document.querySelectorAll('.rc-cat').forEach(b => b.classList.toggle('active', b === btn));
      });
    });
    document.querySelectorAll('.rc-play-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.rarePlayMode = btn.dataset.play;
        document.querySelectorAll('.rc-play-btn').forEach(b => b.classList.toggle('active', b === btn));
      });
    });
    document.querySelectorAll('.rc-round').forEach(btn => {
      btn.addEventListener('click', () => {
        this.rareRounds = parseInt(btn.dataset.rounds, 10);
        document.querySelectorAll('.rc-round').forEach(b => b.classList.toggle('active', b === btn));
        document.getElementById('rc-mode-tip').style.display = this.rareRounds === 0 ? 'block' : 'none';
      });
    });
    document.getElementById('btn-rare-start').addEventListener('click', () => this.startRare());
    document.getElementById('btn-rare-back').addEventListener('click', () => {
      this.rareGame = null;
      this.show('screen-home');
    });
    // 生僻字 · 游戏区
    document.getElementById('btn-rc-submit').addEventListener('click', () => this.rareSubmitFill());
    document.getElementById('rc-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.rareSubmitFill();
    });
    document.getElementById('btn-rc-hint').addEventListener('click', () => this.rareHint());
    document.getElementById('btn-rc-finish').addEventListener('click', () => {
      if (this.rareGame) { this.rareGame.finish(); this.showRareOver(); }
    });
    document.getElementById('btn-rc-again').addEventListener('click', () => this.startRare());
    document.getElementById('btn-rc-home').addEventListener('click', () => this.show('screen-home'));

    // 我的（积分与账号）
    document.getElementById('btn-me').addEventListener('click', () => this.openMe());
    document.getElementById('btn-me-close').addEventListener('click', () =>
      document.getElementById('me-modal').classList.remove('active'));
    document.getElementById('btn-me-login').addEventListener('click', () => this.meLogin());
    document.getElementById('me-name').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.meLogin();
    });
    document.getElementById('btn-me-logout').addEventListener('click', () => {
      Scores.logout();
      this.renderMe();
      this.updateStats();
    });
  },

  updateStats() {
    const s = DB.getStats();
    BombWords.ensureInit();
    const wordCount = Object.values(BombWords._bank || {}).reduce((n, arr) => n + arr.length, 0);
    const el = document.getElementById('db-stats');
    if (el) el.textContent = `诗词库：${s.poems} 首 / ${s.lines} 句 · 炸弹词库：${wordCount} 词 · 成语库：${IdiomDB.getSize()} 条`;
    this.updateHighs();
  },

  /** 各模式卡显示个人最高分；【我的】按钮显示总积分 */
  updateHighs() {
    document.querySelectorAll('.mode-card').forEach(card => {
      let mode = card.dataset.mode;
      if (mode === 'bomb-word-menu') mode = 'bomb-word';
      const high = Scores.getHigh(mode);
      const info = card.querySelector('.mode-info');
      if (!info) return;
      let line = info.querySelector('.mode-high');
      if (!line) {
        line = document.createElement('div');
        line.className = 'mode-high';
        info.appendChild(line);
      }
      line.textContent = high > 0 ? `我的最高分：${high}` : '';
    });
    const meBtn = document.getElementById('btn-me');
    if (meBtn) {
      const p = Scores.getProfile();
      meBtn.innerHTML = p.name
        ? `我的<span class="me-btn-badge">${p.total} 分</span>`
        : '我的';
    }
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
      title.textContent = '飞花令 · 小诗AI擂台';
      desc.textContent = '与小诗AI轮流说出含指定关键字的诗句，接不出者负';
      ffArea.style.display = 'flex';
      const ffChar = document.getElementById('ff-target');
      ffChar.textContent = '?';
      ffChar.classList.add('is-placeholder');
    } else if (mode === 'idiom-chain') {
      title.textContent = '成语接龙 · 小诗AI对战';
      desc.textContent = '顶针格接龙，上句末字即下句首字，接不出者负';
      ffArea.style.display = 'none';
    } else {
      title.textContent = '接龙 · 小诗AI对战';
      desc.textContent = '诗句接龙，上句末字即下句首字，接不出者负';
      ffArea.style.display = 'none';
    }
    document.getElementById('start-area').style.display = 'flex';
  },

  startDuel() {
    document.getElementById('start-area').style.display = 'none';
    document.getElementById('input-area').style.display = 'flex';
    if (this.duelMode === 'fly-flower') {
      document.getElementById('ff-target-area').style.display = 'flex';
      const ffChar = document.getElementById('ff-target');
      ffChar.textContent = '?';
      ffChar.classList.add('is-placeholder');
    }
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
      // 回合制：玩家出满 N 句（小诗AI 也已逐句回应）后按累计比分结算
      if (this.duelMaxRounds > 0 && !this.game.gameOver && s.currentTurn === 'player') {
        const list = s.history || s.chain || [];
        const playerCount = list.filter(h => h.who === 'player').length;
        if (playerCount >= this.duelMaxRounds) {
          const w = s.playerScore > s.aiScore ? 'player'
            : s.aiScore > s.playerScore ? 'ai' : 'draw';
          this.game.endGame(w,
            `${this.duelMaxRounds} 回合结束 · 你 ${s.playerScore} : ${s.aiScore} 小诗AI`);
        }
      }
    };
    this.game.onTimerTick = t => this.renderDuelTimer(t);
    this.game.onAIThinking = () => {
      document.getElementById('turn-indicator').innerHTML =
        '<span class="turn-ai">小诗AI思考中<span class="dots">...</span></span>';
    };
    this.game.onGameOver = (winner, reason, result) => this.showDuelResult(winner, reason, result);
    this.game.start();
  },

  /** 输入区启用/禁用（AI 思考时仅禁用，不隐藏，保持布局稳定） */
  setInputEnabled(on) {
    const input = document.getElementById('game-input');
    document.getElementById('btn-submit').disabled = !on;
    document.getElementById('btn-hint').disabled = !on || this.game.hintsLeft <= 0;
    document.getElementById('btn-pass').disabled = !on;
    input.disabled = !on;
    document.getElementById('input-area').classList.toggle('is-waiting', !on);
    if (on) input.focus();
  },

  renderFlyFlower(s) {
    const ffChar = document.getElementById('ff-target');
    ffChar.textContent = s.targetChar;
    ffChar.classList.remove('is-placeholder');
    document.getElementById('score-player').textContent = s.playerScore;
    document.getElementById('score-ai').textContent = s.aiScore;
    const turn = document.getElementById('turn-indicator');
    const input = document.getElementById('input-area');
    if (s.currentTurn === 'player' && !s.gameOver) {
      turn.innerHTML = '<span class="turn-player">你的回合</span>';
      input.style.display = 'flex';
      this.setInputEnabled(true);
    } else if (!s.gameOver) {
      turn.innerHTML = '<span class="turn-ai">小诗AI思考中...</span>';
      input.style.display = 'flex';
      this.setInputEnabled(false);
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
      this.setInputEnabled(true);
    } else if (!s.gameOver) {
      turn.innerHTML = '<span class="turn-ai">小诗AI思考中...</span>';
      input.style.display = 'flex';
      this.setInputEnabled(false);
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
      this.setInputEnabled(true);
    } else if (!s.gameOver) {
      turn.innerHTML = '<span class="turn-ai">小诗AI思考中...</span>';
      input.style.display = 'flex';
      this.setInputEnabled(false);
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

  /** 对局结束结算弹窗 */
  showDuelResult(winner, reason, result) {
    document.getElementById('input-area').style.display = 'none';
    document.getElementById('timer-bar').style.width = '0%';
    const title = document.getElementById('result-title');
    title.textContent = winner === 'player' ? '你赢了！' : winner === 'draw' ? '平局！' : '小诗AI获胜';
    title.className = winner === 'player' ? 'result-win' : 'result-lose';
    document.getElementById('result-reason').textContent = reason;
    const rec = Scores.addResult(this.duelMode, result.playerScore);
    this.updateHighs();
    document.getElementById('result-score').innerHTML =
      `你：${result.playerScore} 分　|　小诗AI：${result.aiScore} 分` +
      (rec.isNewHigh && result.playerScore > 0
        ? `<br><span class="result-newhigh">新纪录！个人最高分 ${rec.high} 分</span>` : '');

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
    document.getElementById('timer-display').textContent =
      `限时 ${this.timeByDifficulty()} 秒`;
    document.getElementById('timer-bar').style.width = '100%';
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
        <p>系统给定一个<b>首字</b>（如「一」「天」「龙」），从以该字开头的成语中抽出约 <b>12 个候选</b>，其中暗藏<b>唯一一个炸弹词</b>。你与小诗AI<b>一对一</b>轮流说词，每人限说 <b>5 个</b>——<b>谁说出炸弹词谁输</b>，说完无人踩雷则平局并揭晓炸弹。小诗AI同样不知道炸弹是哪个。</p>`;
    } else {
      rules.innerHTML = `
        <div class="bomb-rules-title">玩法</div>
        <p>系统给定一个关键字（如 <b>月</b>），题库中所有含该字的诗句里藏着<b>唯一一句炸弹诗</b>。你与小诗AI<b>一对一</b>轮流说出含该字的诗句，<b>谁说出炸弹句谁炸</b>。名句未必安全，冷门也可能是陷阱。</p>`;
    }
  },

  startBombSolo() {
    // 单机一对一：你 vs 小诗AI
    const seats = [
      { id: 'human', name: '你', isLocal: true },
      { id: 'ai0', name: AI_NAMES[0], isAI: true }
    ];
    this.bombGame = new BombGame({
      kind: this.bombKind,
      seats,
      timeLimit: this.timeByDifficulty(),
      maxWordsEach: 5
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
        ${seat.isAI ? '<span class="seat-tag">小诗AI</span>' : ''}`;
      seatsBox.appendChild(chip);
    });

    // 提示
    const label = document.getElementById('bomb-cue-label');
    const main = document.getElementById('bomb-cue-main');
    const sub = document.getElementById('bomb-cue-sub');
    if (s.kind === 'word') {
      label.textContent = '首字';
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
          ? `说一个以「${s.round.code}」开头的成语`
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
    if (!loserId) {
      // 平局：无人踩雷
      title.textContent = '平局！炸弹无人踩中';
      title.className = 'result-win';
    } else {
      const iLose = loserId === this.localSeatId;
      title.textContent = iLose ? '你踩雷了！' : `${loser ? loser.name : '对手'} 踩雷，你幸存！`;
      title.className = iLose ? 'result-lose' : 'result-win';
    }

    const reveal = document.getElementById('bomb-reveal');
    const detail = document.getElementById('bomb-poem-detail');
    if (s.kind === 'word') {
      reveal.innerHTML = `炸弹词是 <b>${s.bombWord}</b><br><span class="bomb-over-sub">首字「${s.round.code}」</span>`;
      detail.innerHTML = '';
    } else {
      reveal.innerHTML = `炸弹句是 <b>「${s.round.bombLine}」</b>`;
      const p = s.round.bombPoem;
      detail.innerHTML = `
        <div class="bomb-poem-title">《${p.t}》 ${p.d}·${p.a}</div>
        <div class="poem-lines center">${p.lines.join('，')}。</div>
        <div class="poem-card-source">${p.s}</div>`;
    }

    // 单机积分结算：每说出一个安全词/句 +5，幸存额外 +15
    if (!this.netMode) {
      const myCount = s.history.filter(h => h.seatId === this.localSeatId).length;
      const survived = loserId && loserId !== this.localSeatId;
      const gain = myCount * 5 + (survived ? 15 : 0);
      const rec = Scores.addResult(s.kind === 'word' ? 'bomb-word' : 'bomb-poem', gain);
      this.updateHighs();
      detail.innerHTML += `<div class="rc-over-high">本局积分 +${gain}` +
        (rec.isNewHigh && gain > 0 ? ` · 新纪录！个人最高分 ${rec.high} 分` : '') + '</div>';
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
        ${s.isAI ? '<span class="seat-tag">小诗AI</span>' : ''}
        ${s.id === 'host' ? '<span class="seat-tag host-tag">房主</span>' : ''}`;
      box.appendChild(el);
    });
    if (role === 'host') {
      document.getElementById('ai-count-label').textContent = `小诗AI ×${this.host.aiCount}`;
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

  startDaily(randomMode = true) {
    document.getElementById('daily-intro').style.display = 'none';
    document.getElementById('daily-scroll').style.display = 'block';
    document.getElementById('daily-quiz').style.display = 'none';
    document.getElementById('daily-reveal').style.display = 'none';
    // 清空滚动轨道 + 重置过渡态
    const track = document.getElementById('daily-scroll-track');
    track.innerHTML = '';
    track.style.transform = 'translateY(36px)';
    track.style.transition = 'transform 0.16s linear';
    document.getElementById('daily-scroll-frame').classList.remove('scroll-to-top');
    document.getElementById('daily-quiz').classList.remove('fade-in');
    document.querySelector('#daily-scroll .daily-scroll-label').style.display = '';

    this.dailyGame = new DailyChallenge();
    this.dailyGame.onPhaseChange = s => this.renderDaily(s);
    this.dailyGame.onReveal = r => this.renderDailyReveal(r);
    this.dailyGame.start(randomMode);
  },

  renderDaily(s) {
    if (s.phase === 'scrolling') {
      // 滚动框：逐句入轨，最新一行滑向中缝；final 时定格目标句
      const track = document.getElementById('daily-scroll-track');
      const item = document.createElement('div');
      item.className = 'daily-scroll-item' + (s.final ? ' final' : '');
      item.textContent = s.displayLine || '';
      track.appendChild(item);
      const ROW = 36;  // 与 .daily-scroll-item 行高一致
      const k = track.children.length - 1;
      track.style.transition = s.final ? 'transform .5s ease-out' : 'transform .16s linear';
      track.style.transform = `translateY(${(1 - k) * ROW}px)`;
      // 记录定格时的位移，供答题态上移使用
      if (s.final) {
        this._dailyFinalY = (1 - k) * ROW;
      }
    } else if (s.phase === 'quiz') {
      // 平滑过渡：定格行从中间滑到顶部 + 框缩成一行，定格行持续留存在答题面板顶部
      const frame = document.getElementById('daily-scroll-frame');
      const track = document.getElementById('daily-scroll-track');
      const ROW = 36;
      // track 上移一行，让定格行从中间行滑到顶部行
      track.style.transition = 'transform .6s ease-out';
      track.style.transform = `translateY(${this._dailyFinalY - ROW}px)`;
      // 框高度从 108px 缩到 36px，只露出顶部那行
      frame.classList.add('scroll-to-top');
      // 隐藏"滚动中"标签，定格行落地为答题面板的一部分
      document.querySelector('#daily-scroll .daily-scroll-label').style.display = 'none';
      setTimeout(() => {
        const quiz = document.getElementById('daily-quiz');
        quiz.style.display = 'block';
        quiz.classList.add('fade-in');
        this.renderDailyQuiz(s);
      }, 600);
    } else if (s.phase === 'revealed') {
      document.getElementById('daily-quiz').style.display = 'none';
      document.getElementById('daily-reveal').style.display = 'block';
    }
  },

  renderDailyQuiz(s) {
    document.getElementById('daily-target-line').textContent = s.targetLine;
    if (!s.options || !s.answers) return;
    this.renderDailyOptions('title', s.options.title || [], s.answers.title);
    this.renderDailyOptions('author', s.options.author || [], s.answers.author);
    this.renderDailyOptions('source', s.options.source || [], s.answers.source);
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
    // 每日挑战积分：每答对一项 +5
    const rec = Scores.addResult('daily-challenge', r.score * 5);
    this.updateHighs();
    if (rec.isNewHigh && r.score > 0) {
      document.getElementById('daily-score').innerHTML +=
        ` <span class="result-newhigh">· 新纪录 ${rec.high} 分！</span>`;
    }
    document.getElementById('daily-poem-title').textContent = r.poem.t;
    document.getElementById('daily-poem-meta').textContent = `${r.poem.a}（${r.poem.d}）· ${r.poem.type} · ${r.poem.s}`;
    document.getElementById('daily-poem-lines').innerHTML =
      r.poem.lines.map(l => `<div class="daily-line">${l}</div>`).join('');
  },

  // ================================================================
  // 生僻字
  // ================================================================
  rareCat: 'surname',
  rarePlayMode: 'choice',
  rareRounds: 5,
  rareGame: null,
  rareLocked: false,

  openRare() {
    this.rareGame = null;
    this.show('screen-rare-chars');
    document.getElementById('rc-setup').style.display = 'flex';
    document.getElementById('rc-game').style.display = 'none';
    document.getElementById('rc-over').style.display = 'none';
    document.getElementById('rc-mode-tip').style.display = this.rareRounds === 0 ? 'block' : 'none';
  },

  // ============ 诗情画意起名 ============
  openNaming() {
    this.show('screen-naming');
    this.namingGen = new NameGenerator();
    this.namingPurpose = null;
    this.namingGameType = null;
    this.namingStyleId = null;
    this.namingSourceId = null;
    this.namingLength = null;
    this.namingFormat = null;

    // 1. 用途按钮
    const pRow = document.getElementById('naming-purpose-buttons');
    pRow.innerHTML = NAME_PURPOSES.map(p =>
      `<button class="round-btn" data-purpose="${p.id}">${p.name}</button>`
    ).join('');
    pRow.querySelectorAll('.round-btn').forEach(btn => {
      btn.addEventListener('click', () => this.namingPickPurpose(btn.dataset.purpose));
    });

    // 2. 游戏类型按钮
    const gRow = document.getElementById('naming-gametype-buttons');
    gRow.innerHTML = GAME_TYPES.map(g =>
      `<button class="round-btn" data-gtype="${g.id}">${g.name}</button>`
    ).join('');
    gRow.querySelectorAll('.round-btn').forEach(btn => {
      btn.addEventListener('click', () => this.namingPickGameType(btn.dataset.gtype));
    });

    // 2b. 情侣模式按钮
    this.namingCoupleMode = null;
    const cRow = document.getElementById('naming-couple-buttons');
    cRow.innerHTML = [
      { id: 'match', name: '已有另一半名字' },
      { id: 'pair', name: '还没有，生成一对' }
    ].map(c => `<button class="round-btn" data-cmode="${c.id}">${c.name}</button>`).join('');
    cRow.querySelectorAll('.round-btn').forEach(btn => {
      btn.addEventListener('click', () => this.namingPickCoupleMode(btn.dataset.cmode));
    });
    document.getElementById('btn-couple-match').onclick = () => this.namingCoupleMatchGenerate();
    document.getElementById('naming-partner').onkeydown = (e) => {
      if (e.key === 'Enter') this.namingCoupleMatchGenerate();
    };

    // 3. 风格按钮
    const sRow = document.getElementById('naming-style-buttons');
    sRow.innerHTML = NAME_STYLES.map(s =>
      `<button class="round-btn" data-style="${s.id}">${s.name}</button>`
    ).join('');
    sRow.querySelectorAll('.round-btn').forEach(btn => {
      btn.addEventListener('click', () => this.namingPickStyle(btn.dataset.style));
    });

    // 4. 出处按钮（动态生成）
    // 5. 字数按钮
    const lenRow = document.getElementById('naming-length-buttons');
    lenRow.innerHTML = [1, 2, 3, 4].map(n =>
      `<button class="round-btn" data-len="${n}">${n} 字</button>`
    ).join('');
    lenRow.querySelectorAll('.round-btn').forEach(btn => {
      btn.addEventListener('click', () => this.namingPickLength(parseInt(btn.dataset.len, 10)));
    });

    // 姓氏输入
    document.getElementById('naming-surname').addEventListener('input', (e) => {
      this.namingGen.setSurname(e.target.value);
    });

    // 态切换：只显示用途
    this.namingShowStep('purpose');
    document.getElementById('btn-naming-refresh').onclick = () => {
      if (this.namingPurpose === 'couple') {
        if (this.namingCoupleMode === 'match') this.namingCoupleMatchGenerate();
        else this.namingCouplePairGenerate();
      } else {
        this.namingGenerate();
      }
    };
    document.getElementById('btn-naming-reselect').onclick = () => this.openNaming();
    document.getElementById('btn-naming-back').onclick = () => this.show('screen-home');
  },

  namingShowStep(step) {
    if (step === 'purpose') {
      document.getElementById('naming-setup').style.display = 'flex';
      document.getElementById('naming-result').style.display = 'none';
    }
    // 累积式显示：选过的步骤留存，不消失
    const rank = { purpose: 0, game: 1, baby: 1, couple: 1, gametype: 2, coupleMatch: 2, style: 3, source: 4, length: 5 }[step] ?? 0;
    const show = new Set();
    if (rank >= 1) {
      if (this.namingPurpose === 'game') show.add('ng-gametype-group');
      if (this.namingPurpose === 'baby') show.add('ng-surname-group');
      if (this.namingPurpose === 'couple') show.add('ng-couple-group');
    }
    if (rank >= 2) {
      if (this.namingPurpose === 'couple' && this.namingCoupleMode === 'match') show.add('ng-couple-input-group');
      else if (this.namingPurpose !== 'couple') show.add('ng-style-group');
    }
    if (rank >= 3) show.add('ng-source-group');
    if (rank >= 4) show.add('ng-length-group');
    if (rank >= 5) show.add('ng-format-group');
    ['ng-surname-group','ng-gametype-group','ng-couple-group','ng-couple-input-group','ng-style-group','ng-source-group','ng-length-group','ng-format-group']
      .forEach(id => document.getElementById(id).style.display = show.has(id) ? 'block' : 'none');
    // 滚动到最新显示的组
    const visible = ['ng-surname-group','ng-gametype-group','ng-couple-group','ng-couple-input-group','ng-style-group','ng-source-group','ng-length-group','ng-format-group']
      .map(id => document.getElementById(id))
      .filter(el => el.style.display !== 'none');
    if (visible.length) visible[visible.length - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  namingPickPurpose(purpose) {
    this.namingPurpose = purpose;
    this.namingGen.setPurpose(purpose);
    document.querySelectorAll('#naming-purpose-buttons .round-btn')
      .forEach(b => b.classList.toggle('active', b.dataset.purpose === purpose));

    if (purpose === 'game') {
      this.namingShowStep('game');
    } else if (purpose === 'couple') {
      this.namingShowStep('couple');
    } else {
      this.namingShowStep('baby');
      // 宝宝模式：姓氏输入后自动进入风格
      setTimeout(() => this.namingShowStep('style'), 300);
    }
  },

  namingPickGameType(gtype) {
    this.namingGameType = gtype;
    this.namingGen.setGameType(gtype);
    document.querySelectorAll('#naming-gametype-buttons .round-btn')
      .forEach(b => b.classList.toggle('active', b.dataset.gtype === gtype));
    this.namingShowStep('gametype');
    // 游戏ID模式：选完游戏类型后直接进入风格
    setTimeout(() => this.namingShowStep('style'), 300);
  },

  namingPickStyle(styleId) {
    this.namingStyleId = styleId;
    this.namingGen.setStyle(styleId);
    document.querySelectorAll('#naming-style-buttons .round-btn')
      .forEach(b => b.classList.toggle('active', b.dataset.style === styleId));

    // 渲染出处按钮（按用途排序）
    const srcRow = document.getElementById('naming-source-buttons');
    const sources = NameGenerator.getAvailableSources(this.namingPurpose);
    srcRow.innerHTML = sources.map(s =>
      `<button class="round-btn" data-source="${s.id}">${s.name}</button>`
    ).join('');
    srcRow.querySelectorAll('.round-btn').forEach(btn => {
      btn.addEventListener('click', () => this.namingPickSource(btn.dataset.source));
    });
    document.querySelectorAll('#naming-source-buttons .round-btn').forEach(b => b.classList.remove('active'));

    this.namingShowStep('style');
  },

  namingPickSource(sourceId) {
    this.namingSourceId = sourceId;
    this.namingGen.setSource(sourceId);
    document.querySelectorAll('#naming-source-buttons .round-btn')
      .forEach(b => b.classList.toggle('active', b.dataset.source === sourceId));
    this.namingShowStep('source');
  },

  namingPickLength(len) {
    this.namingLength = len;
    this.namingGen.setLength(len);
    document.querySelectorAll('#naming-length-buttons .round-btn')
      .forEach(b => b.classList.toggle('active', parseInt(b.dataset.len, 10) === len));

    // 渲染格式按钮
    const fmtRow = document.getElementById('naming-format-buttons');
    const formats = NameGenerator.getFormats(len);
    fmtRow.innerHTML = formats.map(f =>
      `<button class="round-btn" data-format="${f.id}" title="${f.example}">${f.label}</button>`
    ).join('');
    fmtRow.querySelectorAll('.round-btn').forEach(btn => {
      btn.addEventListener('click', () => this.namingPickFormat(btn.dataset.format));
    });
    document.querySelectorAll('#naming-format-buttons .round-btn').forEach(b => b.classList.remove('active'));

    this.namingShowStep('length');
  },

  namingPickFormat(fmt) {
    this.namingFormat = fmt;
    this.namingGen.setFormat(fmt);
    document.querySelectorAll('#naming-format-buttons .round-btn')
      .forEach(b => b.classList.toggle('active', b.dataset.format === fmt));
    this.namingGenerate();
  },

  namingPickCoupleMode(mode) {
    this.namingCoupleMode = mode;
    document.querySelectorAll('#naming-couple-buttons .round-btn')
      .forEach(b => b.classList.toggle('active', b.dataset.cmode === mode));
    if (mode === 'match') {
      this.namingShowStep('coupleMatch');
      document.getElementById('naming-partner').focus();
    } else {
      this.namingCouplePairGenerate();
    }
  },

  /* 情侣：生成一对 */
  namingCouplePairGenerate() {
    const results = this.namingGen.generateCouplePairs(6);
    this.namingRenderCouple(results, true,
      results.length ? '情侣网名 · 成对出自同一句诗' : '暂时没有合适的配对，请再试一次');
  },

  /* 情侣：匹配另一半 */
  namingCoupleMatchGenerate() {
    const partner = document.getElementById('naming-partner').value.trim();
    if (!partner) {
      document.getElementById('naming-partner').focus();
      return;
    }
    const results = this.namingGen.matchCoupleName(partner, 12);
    this.namingRenderCouple(results, false,
      results.length
        ? `给「${partner}」匹配的另一半名字 —— 同句提取，有多少给多少`
        : `没有找到与「${partner}」同句的好名字，换个写法试试`);
  },

  /* 情侣结果渲染（复用 .ng-card 样式） */
  namingRenderCouple(results, isPair, tipText) {
    document.getElementById('naming-setup').style.display = 'none';
    document.getElementById('naming-result').style.display = 'flex';
    document.getElementById('naming-result-tip').textContent = tipText;

    const list = document.getElementById('naming-result-list');
    list.innerHTML = results.map(r => {
      const display = isPair ? `${r.nameA} × ${r.nameB}` : r.name;
      const copyText = isPair ? `${r.nameA} / ${r.nameB}` : r.name;
      const from = r.author ? `${r.dynasty ? r.dynasty + '·' : ''}${r.author}《${r.title}》` : r.title;
      return `
      <div class="ng-card">
        <div class="ng-card-main">
          <div class="ng-name">${display}</div>
          <button class="ng-copy" data-name="${copyText}">复制</button>
        </div>
        <div class="ng-from">—— ${from}</div>
        <div class="ng-line">「${r.line}」</div>
      </div>`;
    }).join('');

    list.querySelectorAll('.ng-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const input = document.createElement('input');
        input.value = btn.dataset.name;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(input);
        btn.textContent = ok ? '已复制' : '复制失败';
        setTimeout(() => btn.textContent = '复制', 1200);
      });
    });
  },

  namingGenerate() {
    const results = this.namingGen.generate(6);
    const purposeName = this.namingPurpose === 'baby' ? '宝宝名' : '游戏ID';
    const srcName = (NAME_SOURCES.find(s => s.id === this.namingSourceId) || {}).name || '';
    const fmtLabel = this.namingFormat ? (NAME_FORMATS[this.namingLength] || []).find(f => f.id === this.namingFormat)?.label || '' : '';

    document.getElementById('naming-setup').style.display = 'none';
    document.getElementById('naming-result').style.display = 'flex';
    const tip = document.getElementById('naming-result-tip');
    tip.textContent = results.length
      ? `${purposeName} · ${srcName} · ${this.namingLength}字 · ${fmtLabel} —— 均带出处`
      : '这个组合下暂时没有合适的名字，请换个条件';

    const list = document.getElementById('naming-result-list');
    list.innerHTML = results.map(r => `
      <div class="ng-card">
        <div class="ng-card-main">
          <div class="ng-name">${r.name}</div>
          <button class="ng-copy" data-name="${r.name}">复制</button>
        </div>
        <div class="ng-from">—— ${r.dynasty ? r.dynasty + '·' : ''}${r.author || '佚名'}《${r.title}》</div>
        <div class="ng-line">「${r.line}」</div>
      </div>
    `).join('');

    list.querySelectorAll('.ng-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = btn.dataset.name;
        const input = document.createElement('input');
        input.value = name;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(input);
        btn.textContent = ok ? '已复制' : '复制失败';
        setTimeout(() => btn.textContent = '复制', 1200);
      });
    });
  },

  startRare() {
    this.rareGame = new RareCharsGame(this.rareCat, this.rarePlayMode, this.rareRounds);
    this.rareLocked = false;
    document.getElementById('rc-setup').style.display = 'none';
    document.getElementById('rc-over').style.display = 'none';
    document.getElementById('rc-game').style.display = 'flex';
    const hintBtn = document.getElementById('btn-rc-hint');
    hintBtn.textContent = '提示 ×3';
    hintBtn.disabled = false;
    document.getElementById('btn-rc-finish').style.display = this.rareRounds === 0 ? '' : 'none';
    document.getElementById('rc-input').value = '';
    this.renderRareQuestion();
  },

  renderRareQuestion() {
    const g = this.rareGame;
    if (!g || g.gameOver) return;
    const item = g.current();

    // 进度与得分
    const prog = g.rounds > 0
      ? `第 ${g.answered + 1} / ${g.rounds} 题`
      : `已连对 ${g.correct} 题`;
    document.getElementById('rc-progress').textContent = prog;
    document.getElementById('rc-score').textContent = `得分 ${g.score}`;

    // 题干：考查字高亮
    const wordEl = document.getElementById('rc-word');
    if (item.w === item.t) {
      wordEl.textContent = item.w;
    } else {
      wordEl.innerHTML = this.escapeHtml(item.w).replace(
        this.escapeHtml(item.t),
        `<span class="rc-target">${this.escapeHtml(item.t)}</span>`);
    }
    document.getElementById('rc-qtext').textContent = item.cat === 'surname'
      ? `「${item.t}」作姓氏时的读音是？`
      : `「${item.w}」中「${item.t}」的读音是？`;

    // 反馈清空
    const fb = document.getElementById('rc-feedback');
    fb.textContent = '';
    fb.className = 'rc-feedback';

    // 作答区
    const optsBox = document.getElementById('rc-options');
    const fillRow = document.getElementById('rc-fill-row');
    if (g.playMode === 'choice') {
      optsBox.style.display = 'grid';
      fillRow.style.display = 'none';
      optsBox.innerHTML = '';
      this.shuffleArr(item.opts.slice()).forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'rc-option';
        btn.textContent = opt;
        btn.addEventListener('click', () => this.rareSubmitChoice(opt, btn));
        optsBox.appendChild(btn);
      });
    } else {
      optsBox.style.display = 'none';
      fillRow.style.display = 'flex';
      const input = document.getElementById('rc-input');
      input.value = '';
      input.focus();
    }
    this.rareLocked = false;
  },

  shuffleArr(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  rareSubmitChoice(opt, btn) {
    if (!this.rareGame || this.rareLocked) return;
    this.rareLocked = true;
    const r = this.rareGame.answer(opt);
    // 标记对错
    document.querySelectorAll('.rc-option').forEach(b => {
      b.disabled = true;
      if (b.textContent === r.item.py) b.classList.add('ok');
      else if (b === btn && !r.ok) b.classList.add('wrong');
    });
    this.afterRareAnswer(r);
  },

  rareSubmitFill() {
    if (!this.rareGame || this.rareLocked) return;
    const input = document.getElementById('rc-input');
    const val = (input.value || '').trim();
    if (!val) { this.shake('rc-input'); return; }
    this.rareLocked = true;
    const r = this.rareGame.answer(val);
    this.afterRareAnswer(r);
  },

  afterRareAnswer(r) {
    const g = this.rareGame;
    const fb = document.getElementById('rc-feedback');
    if (r.ok) {
      fb.className = 'rc-feedback ok';
      fb.innerHTML = `✓ 正确，+${g.playMode === 'fill' ? 15 : 10} 分<span class="rc-note">${r.item.note || ''}</span>`;
    } else {
      fb.className = 'rc-feedback wrong';
      fb.innerHTML = `✗ 正确读音：${r.item.py}<span class="rc-note">${r.item.note || ''}</span>`;
    }
    document.getElementById('rc-score').textContent = `得分 ${g.score}`;

    if (r.gameOver) {
      setTimeout(() => this.showRareOver(), 1400);
    } else {
      setTimeout(() => this.renderRareQuestion(), 1400);
    }
  },

  rareHint() {
    const g = this.rareGame;
    if (!g || g.gameOver) return;
    const btn = document.getElementById('btn-rc-hint');
    const h = g.hint();
    btn.textContent = g.hintsLeft > 0 ? `提示 ×${g.hintsLeft}` : '提示用尽';
    if (g.hintsLeft <= 0) btn.disabled = true;
    if (!h) return;
    const fb = document.getElementById('rc-feedback');
    if (h.kind === 'eliminate') {
      document.querySelectorAll('.rc-option').forEach(b => {
        if (h.options.includes(b.textContent)) b.disabled = true;
      });
      fb.className = 'rc-feedback';
      fb.textContent = '提示：已排除两个错误选项';
    } else {
      fb.className = 'rc-feedback';
      fb.textContent = `提示：${h.text}`;
    }
  },

  showRareOver() {
    const g = this.rareGame;
    if (!g) return;
    document.getElementById('rc-game').style.display = 'none';
    document.getElementById('rc-over').style.display = 'flex';

    const rec = Scores.addResult('rare-chars', g.score);
    this.updateHighs();

    const title = document.getElementById('rc-over-title');
    if (g.rounds === 0) {
      title.textContent = g.correct > 0 ? `连对 ${g.correct} 题！` : '挑战结束';
    } else {
      const ratio = g.correct / g.rounds;
      title.textContent = ratio >= 0.8 ? '博闻强识！' : ratio >= 0.5 ? '略有小成' : '再接再厉';
    }
    document.getElementById('rc-over-score').innerHTML =
      `答对 ${g.correct} / ${g.answered} 题 · 得分 ${g.score}`;
    document.getElementById('rc-over-high').textContent =
      rec.isNewHigh && g.score > 0
        ? `新纪录！个人最高分 ${rec.high} 分 · 总积分 ${rec.total}`
        : `个人最高分 ${rec.high} 分 · 总积分 ${rec.total}`;

    // 错题回顾
    const box = document.getElementById('rc-review');
    box.innerHTML = '';
    g.records.forEach(r => {
      const el = document.createElement('div');
      el.className = 'rc-review-item ' + (r.ok ? 'ok' : 'wrong');
      el.innerHTML = `<span class="rc-mark">${r.ok ? '✓' : '✗'}</span>` +
        `<b>${r.item.w}</b>（${r.item.t}）读 <b>${r.item.py}</b>` +
        (r.item.note ? `<div class="rc-review-note">${r.item.note}</div>` : '');
      box.appendChild(el);
    });
  },

  // ================================================================
  // 我的（账号与积分）
  // ================================================================
  openMe() {
    this.renderMe();
    document.getElementById('me-modal').classList.add('active');
  },

  meLogin() {
    const input = document.getElementById('me-name');
    const name = (input.value || '').trim();
    if (!name) { this.shake('me-name'); return; }
    Scores.login(name);
    input.value = '';
    this.renderMe();
    this.updateStats();
  },

  renderMe() {
    const p = Scores.getProfile();
    const logged = !!p.name;
    document.getElementById('me-login').style.display = logged ? 'none' : 'block';
    document.getElementById('me-profile').style.display = logged ? 'flex' : 'none';
    if (logged) {
      document.getElementById('me-avatar').textContent = p.name[0];
      document.getElementById('me-name-show').textContent = p.name;
      document.getElementById('me-total').textContent = p.total;
    } else {
      document.getElementById('me-total-guest').textContent = p.total;
    }
    // 各玩法最高分
    const box = document.getElementById('me-highs-list');
    box.innerHTML = '';
    Object.keys(Scores.MODE_NAMES).forEach(mode => {
      const row = document.createElement('div');
      row.className = 'me-high-row';
      row.innerHTML = `<span>${Scores.MODE_NAMES[mode]}</span><b>${Scores.getHigh(mode)} 分</b>`;
      box.appendChild(row);
    });
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

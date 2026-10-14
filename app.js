/**
 * 诗阵 · 主控制器
 * 负责页面导航、游戏实例管理、UI 更新
 */

const App = {
  currentMode: null,   // null | 'fly-flower' | 'chain'
  currentDifficulty: 'medium',
  game: null,
  timerInterval: null,

  init() {
    this.showHome();
    this.bindEvents();
    this.updateStats();
  },

  // ===== 页面导航 =====
  showHome() {
    this.cleanupGame();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-home').classList.add('active');
    this.currentMode = null;
  },

  showGame(mode) {
    this.cleanupGame();
    this.currentMode = mode;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-game').classList.add('active');

    const gameTitle = document.getElementById('game-title');
    const gameDesc = document.getElementById('game-desc');
    const ffTargetArea = document.getElementById('ff-target-area');
    if (mode === 'fly-flower') {
      gameTitle.textContent = '飞花令 · AI 擂台';
      gameDesc.textContent = '与 AI 轮流说出含指定关键字的诗句，接不出者负';
      if (ffTargetArea) ffTargetArea.style.display = 'block';
    } else if (mode === 'chain') {
      gameTitle.textContent = '接龙 · AI 对战';
      gameDesc.textContent = '诗句接龙，上句末字即下句首字，接不出者负';
      if (ffTargetArea) ffTargetArea.style.display = 'none';
    }
    // 重置开始按钮
    const startArea = document.getElementById('start-area');
    if (startArea) startArea.style.display = 'flex';
    const gameBoard = document.getElementById('game-board') || document.querySelector('.game-board');
  },

  // ===== 难度选择 =====
  selectDifficulty(diff) {
    this.currentDifficulty = diff;
    document.querySelectorAll('.diff-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.diff === diff);
    });
  },

  // ===== 开始游戏 =====
  startGame() {
    // 隐藏开始按钮，显示游戏面板
    const startArea = document.getElementById('start-area');
    if (startArea) startArea.style.display = 'none';
    const inputArea = document.getElementById('input-area');
    if (inputArea) inputArea.style.display = 'flex';

    // 重置 UI
    document.getElementById('score-player').textContent = '0';
    document.getElementById('score-ai').textContent = '0';
    document.getElementById('history-list').innerHTML = '';
    document.getElementById('game-input').value = '';
    document.getElementById('error-msg').classList.remove('show');

    if (this.currentMode === 'fly-flower') {
      this.game = new FlyFlowerGame(this.currentDifficulty);
      this.setupFlyFlowerCallbacks();
      this.game.start();
    } else if (this.currentMode === 'chain') {
      this.game = new ChainGame(this.currentDifficulty);
      this.setupChainCallbacks();
      this.game.start();
    }
  },

  // ===== 飞花令回调 =====
  setupFlyFlowerCallbacks() {
    this.game.onStateChange = (state) => this.updateFlyFlowerUI(state);
    this.game.onTimerTick = (timeLeft) => this.updateTimer(timeLeft);
    this.game.onAIThinking = () => this.showAIThinking();
    this.game.onAIRespond = (line, poem) => this.showAIResponse(line, poem);
    this.game.onGameOver = (winner, reason, result) => this.showResult(winner, reason, result);
  },

  // ===== 接龙回调 =====
  setupChainCallbacks() {
    this.game.onStateChange = (state) => this.updateChainUI(state);
    this.game.onTimerTick = (timeLeft) => this.updateTimer(timeLeft);
    this.game.onAIThinking = () => this.showAIThinking();
    this.game.onAIRespond = (line, poem) => this.showAIResponse(line, poem);
    this.game.onGameOver = (winner, reason, result) => this.showResult(winner, reason, result);
  },

  // ===== UI 更新 =====
  updateFlyFlowerUI(state) {
    // 目标字
    const targetEl = document.getElementById('ff-target');
    if (targetEl) targetEl.textContent = state.targetChar;

    // 比分
    document.getElementById('score-player').textContent = state.playerScore;
    document.getElementById('score-ai').textContent = state.aiScore;

    // 回合指示
    const turnEl = document.getElementById('turn-indicator');
    const inputArea = document.getElementById('input-area');
    if (state.currentTurn === 'player' && !state.gameOver) {
      turnEl.innerHTML = '<span class="turn-player">你的回合</span>';
      inputArea.style.display = 'flex';
      document.getElementById('game-input').focus();
    } else if (state.currentTurn === 'ai' && !state.gameOver) {
      turnEl.innerHTML = '<span class="turn-ai">AI 思考中...</span>';
      inputArea.style.display = 'none';
    }

    // 历史
    this.updateHistory(state.history);

    // 输入提示
    const hintEl = document.getElementById('input-hint');
    if (hintEl) {
      hintEl.textContent = `请输入含"${state.targetChar}"字的诗句`;
    }
  },

  updateChainUI(state) {
    // 比分
    document.getElementById('score-player').textContent = state.playerScore;
    document.getElementById('score-ai').textContent = state.aiScore;

    // 回合指示
    const turnEl = document.getElementById('turn-indicator');
    const inputArea = document.getElementById('input-area');
    if (state.currentTurn === 'player' && !state.gameOver) {
      turnEl.innerHTML = '<span class="turn-player">你的回合</span>';
      inputArea.style.display = 'flex';
      document.getElementById('game-input').focus();
    } else if (state.currentTurn === 'ai' && !state.gameOver) {
      turnEl.innerHTML = '<span class="turn-ai">AI 思考中...</span>';
      inputArea.style.display = 'none';
    }

    // 历史
    this.updateChainHistory(state.chain);

    // 输入提示
    const hintEl = document.getElementById('input-hint');
    if (hintEl) {
      if (state.isFirst) {
        hintEl.textContent = '首回合，请输入任意一句诗';
      } else {
        hintEl.textContent = `请输入以"${state.lastChar}"开头的诗句`;
      }
    }
  },

  updateTimer(timeLeft) {
    const timerEl = document.getElementById('timer-display');
    const timerBar = document.getElementById('timer-bar');
    if (timerEl) timerEl.textContent = timeLeft + 's';
    if (timerBar) {
      const pct = this.game ? (timeLeft / this.game.timeLimit) * 100 : 0;
      timerBar.style.width = pct + '%';
      if (timeLeft <= 3) {
        timerBar.classList.add('urgent');
      } else {
        timerBar.classList.remove('urgent');
      }
    }
  },

  updateHistory(history) {
    const container = document.getElementById('history-list');
    if (!container) return;
    container.innerHTML = '';
    history.slice().reverse().forEach(item => {
      const el = document.createElement('div');
      el.className = `history-item ${item.who}`;
      el.innerHTML = `
        <div class="history-line">${item.line}</div>
        <div class="history-info">
          <span class="history-author">${item.dynasty}·${item.author}</span>
          <span class="history-title">《${item.title}》</span>
          <span class="history-score">+${item.score}</span>
        </div>
      `;
      container.appendChild(el);
    });
    container.scrollTop = 0;
  },

  updateChainHistory(chain) {
    const container = document.getElementById('history-list');
    if (!container) return;
    container.innerHTML = '';
    chain.slice().reverse().forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = `history-item ${item.who}`;
      const connector = idx < chain.length - 1 ? '' : '';
      el.innerHTML = `
        <div class="history-line">${item.line} <span class="chain-char">「${item.lastChar}」→</span></div>
        <div class="history-info">
          <span class="history-author">${item.dynasty}·${item.author}</span>
          <span class="history-title">《${item.title}》</span>
          <span class="history-score">+${item.score}</span>
        </div>
      `;
      container.appendChild(el);
    });
    container.scrollTop = 0;
  },

  showAIThinking() {
    const turnEl = document.getElementById('turn-indicator');
    if (turnEl) {
      turnEl.innerHTML = '<span class="turn-ai">AI 思考中<span class="dots">...</span></span>';
    }
  },

  showAIResponse(line, poem) {
    // 响应会通过 onStateChange 更新历史
    // 这里只做视觉效果
    const turnEl = document.getElementById('turn-indicator');
    if (turnEl) {
      turnEl.innerHTML = '<span class="turn-ai">AI 出句：' + line + '</span>';
    }
  },

  showResult(winner, reason, result) {
    document.getElementById('input-area').style.display = 'none';
    document.getElementById('timer-bar').style.width = '0%';

    const modal = document.getElementById('result-modal');
    const titleEl = document.getElementById('result-title');
    const reasonEl = document.getElementById('result-reason');
    const scoreEl = document.getElementById('result-score');
    const poemsEl = document.getElementById('result-poems');

    if (winner === 'player') {
      titleEl.textContent = '你赢了！';
      titleEl.className = 'result-win';
    } else {
      titleEl.textContent = 'AI 获胜';
      titleEl.className = 'result-lose';
    }

    reasonEl.textContent = reason;
    scoreEl.innerHTML = `你：${result.playerScore} 分　|　AI：${result.aiScore} 分`;

    // 展示使用过的诗
    const poemsSet = new Set();
    const poemCards = [];
    (result.history || result.chain || []).forEach(item => {
      if (!poemsSet.has(item.title)) {
        poemsSet.add(item.title);
        poemCards.push({
          title: item.title,
          author: item.author,
          dynasty: item.dynasty,
          source: item.source
        });
      }
    });

    poemsEl.innerHTML = '<h4>本轮涉及诗词：</h4>';
    poemCards.forEach(p => {
      const card = document.createElement('div');
      card.className = 'poem-card';
      card.innerHTML = `
        <div class="poem-card-title">《${p.title}》</div>
        <div class="poem-card-author">${p.dynasty}·${p.author}</div>
        <div class="poem-card-source">${p.source}</div>
      `;
      poemsEl.appendChild(card);
    });

    modal.classList.add('active');
  },

  // ===== 玩家输入处理 =====
  submitInput() {
    const input = document.getElementById('game-input');
    const val = input.value;
    if (!val.trim()) return;

    const result = this.game.playerSubmit(val);
    if (!result.ok) {
      this.showError(result.msg);
    } else {
      input.value = '';
    }
  },

  showError(msg) {
    const errorEl = document.getElementById('error-msg');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.add('show');
      clearTimeout(this.errorTimer);
      this.errorTimer = setTimeout(() => {
        errorEl.classList.remove('show');
      }, 2500);
    }
  },

  playerPass() {
    if (this.game) this.game.playerPass();
  },

  // ===== 清理 =====
  cleanupGame() {
    if (this.game) {
      this.game.stopTimer();
      this.game = null;
    }
    const inputArea = document.getElementById('input-area');
    if (inputArea) inputArea.style.display = 'none';
    document.getElementById('result-modal').classList.remove('active');
    const timerBar = document.getElementById('timer-bar');
    if (timerBar) {
      timerBar.style.width = '0%';
      timerBar.classList.remove('urgent');
    }
    const historyList = document.getElementById('history-list');
    if (historyList) historyList.innerHTML = '';
    const startArea = document.getElementById('start-area');
    if (startArea) startArea.style.display = 'flex';
    const turnIndicator = document.getElementById('turn-indicator');
    if (turnIndicator) turnIndicator.textContent = '准备开始...';
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) timerDisplay.textContent = '--';
  },

  updateStats() {
    const stats = DB.getStats();
    const el = document.getElementById('db-stats');
    if (el) {
      el.textContent = `题库：${stats.poems} 首 / ${stats.lines} 句 / ${stats.flyChars} 个飞花令字`;
    }
  },

  // ===== 事件绑定 =====
  bindEvents() {
    // 首页按钮
    document.querySelectorAll('.mode-card').forEach(card => {
      card.addEventListener('click', () => {
        const mode = card.dataset.mode;
        this.showGame(mode);
      });
    });

    // 难度选择
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectDifficulty(btn.dataset.diff);
      });
    });

    // 开始游戏
    const startBtn = document.getElementById('btn-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startGame());
    }

    // 返回
    const backBtn = document.getElementById('btn-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.showHome());
    }

    // 提交
    const submitBtn = document.getElementById('btn-submit');
    const gameInput = document.getElementById('game-input');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.submitInput());
    }
    if (gameInput) {
      gameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.submitInput();
      });
    }

    // 放弃
    const passBtn = document.getElementById('btn-pass');
    if (passBtn) {
      passBtn.addEventListener('click', () => this.playerPass());
    }

    // 结果弹窗
    const replayBtn = document.getElementById('btn-replay');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        document.getElementById('result-modal').classList.remove('active');
        this.startGame();
      });
    }
    const homeBtn = document.getElementById('btn-home');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        document.getElementById('result-modal').classList.remove('active');
        this.showHome();
      });
    }
  }
};

// 启动
document.addEventListener('DOMContentLoaded', () => App.init());

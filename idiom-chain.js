/**
 * 成语接龙 · AI 对战
 * 顶针格：上句末字 = 下句首字（严格同字匹配）
 * 玩家与 AI 均从成语库选词，接不出者负
 */

class IdiomChainGame {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
    this.timeLimit = { easy: 60, medium: 45, hard: 30 }[difficulty];
    this.usedIdioms = new Set();
    this.playerScore = 0;
    this.aiScore = 0;
    this.currentTurn = 'player';
    this.chain = [];
    this.hintsLeft = 3; // 每局 3 次提示机会
    this.gameOver = false;
    this.winner = null;
    this.timer = null;
    this.timeLeft = this.timeLimit;
    this.lastChar = null;
    this.onStateChange = null;
    this.onTimerTick = null;
    this.onGameOver = null;
    this.onAIThinking = null;
  }

  start() {
    this.currentTurn = 'player';
    this.lastChar = null;
    this.startTimer();
    this.notify();
  }

  playerSubmit(input) {
    if (this.gameOver || this.currentTurn !== 'player') return { ok: false, msg: '不是你的回合' };

    const text = (input || '').trim().replace(/[，。、？！；：""''（）\s]/g, '');
    if (!text) return { ok: false, msg: '请输入成语' };
    if (text.length !== 4) return { ok: false, msg: '请输入四字成语' };
    if (!/^[\u4e00-\u9fff]{4}$/.test(text)) return { ok: false, msg: '请输入四字成语' };

    if (!IdiomDB.has(text)) return { ok: false, msg: `词库未收录"${text}"，换一个试试` };
    if (this.usedIdioms.has(text)) return { ok: false, msg: '此成语已用过，请换一个' };

    if (this.lastChar !== null && text[0] !== this.lastChar) {
      return { ok: false, msg: `首字需为"${this.lastChar}"，请重新输入` };
    }

    // 有效
    this.usedIdioms.add(text);
    const lastChar = text[text.length - 1];
    const firstChar = text[0];
    this.playerScore += 1;
    this.chain.push({ line: text, who: 'player', firstChar, lastChar, score: 1 });

    this.currentTurn = 'ai';
    this.lastChar = lastChar;
    this.stopTimer();
    this.notify();

    setTimeout(() => this.aiTurn(), 800 + Math.random() * 1500);
    return { ok: true, score: 1, lastChar };
  }

  aiTurn() {
    if (this.gameOver) return;
    if (this.onAIThinking) this.onAIThinking();

    setTimeout(() => {
      const pick = IdiomDB.pickAI(this.difficulty, this.lastChar, this.usedIdioms);

      if (!pick) {
        this.endGame('player', `AI 无法接出以"${this.lastChar}"开头的成语`);
        return;
      }

      this.usedIdioms.add(pick.idiom);
      this.aiScore += 1;
      this.chain.push({
        line: pick.idiom, who: 'ai',
        firstChar: pick.idiom[0], lastChar: pick.lastChar, score: 1
      });

      this.currentTurn = 'player';
      this.lastChar = pick.lastChar;
      this.timeLeft = this.timeLimit;
      this.startTimer();
      this.notify();
    }, 600 + Math.random() * 1200);
  }

  // ===== 计时 =====
  startTimer() {
    this.timeLeft = this.timeLimit;
    this.stopTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.onTimerTick) this.onTimerTick(this.timeLeft);
      if (this.timeLeft <= 0) {
        this.stopTimer();
        if (this.currentTurn === 'player') {
          this.endGame('ai', '时间到，你未能在限定时间内回答');
        }
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  playerPass() {
    if (this.gameOver || this.currentTurn !== 'player') return;
    this.endGame('ai', '你选择了放弃');
  }

  /**
   * 提示：返回一个符合当前接龙约束且未用过的成语；每局限 3 次
   */
  hint() {
    if (this.gameOver || this.currentTurn !== 'player' || this.hintsLeft <= 0) return null;
    let idiom;
    if (this.lastChar === null) {
      // 首回合：任意成语
      IdiomDB.ensureInit();
      const remain = IdiomDB._all.filter(w => !this.usedIdioms.has(w));
      if (remain.length === 0) return null;
      idiom = remain[Math.floor(Math.random() * remain.length)];
    } else {
      const avail = IdiomDB.getAvailableForChar(this.lastChar, this.usedIdioms);
      if (avail.length === 0) return null;
      idiom = avail[Math.floor(Math.random() * avail.length)];
    }
    this.hintsLeft--;
    return { line: idiom };
  }

  endGame(winner, reason) {
    this.gameOver = true;
    this.winner = winner;
    this.stopTimer();
    this.notify();
    if (this.onGameOver) this.onGameOver(winner, reason, this.getResult());
  }

  getResult() {
    return {
      winner: this.winner,
      playerScore: this.playerScore,
      aiScore: this.aiScore,
      rounds: this.chain.length,
      chain: this.chain
    };
  }

  notify() {
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  getState() {
    return {
      currentTurn: this.currentTurn,
      playerScore: this.playerScore,
      aiScore: this.aiScore,
      timeLeft: this.timeLeft,
      timeLimit: this.timeLimit,
      gameOver: this.gameOver,
      winner: this.winner,
      chain: this.chain,
      lastChar: this.lastChar,
      isFirst: this.chain.length === 0
    };
  }
}

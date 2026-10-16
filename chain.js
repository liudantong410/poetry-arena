/**
 * 接龙 · AI 对战
 * 诗句接龙：上句末字 = 下句首字
 * 玩家先出，轮流接续，接不出者负
 */

class ChainGame {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
    this.timeLimit = { easy: 60, medium: 45, hard: 30 }[difficulty];
    this.usedLines = new Set();
    this.playerScore = 0;
    this.aiScore = 0;
    this.currentTurn = 'player';
    this.hintsLeft = 3; // 每局 3 次提示机会
    this.chain = []; // { line, author, dynasty, title, source, who, firstChar, lastChar }
    this.gameOver = false;
    this.winner = null;
    this.timer = null;
    this.timeLeft = this.timeLimit;
    this.onStateChange = null;
    this.onTimerTick = null;
    this.onGameOver = null;
    this.onAIThinking = null;
    this.onAIRespond = null;
    this.lastChar = null; // 当前需要匹配的首字
  }

  /**
   * 开始游戏
   */
  start() {
    this.currentTurn = 'player';
    this.lastChar = null; // 第一回合玩家可自由出句
    this.startTimer();
    this.notify();
    return { turn: this.currentTurn, lastChar: this.lastChar, isFirst: true };
  }

  /**
   * 玩家提交
   */
  playerSubmit(input) {
    if (this.gameOver || this.currentTurn !== 'player') return { ok: false, msg: '不是你的回合' };

    const normalized = input.trim().replace(/[，。、？！；：""''（）\s]/g, '');
    if (!normalized) return { ok: false, msg: '请输入诗句' };

    // 验证是否在数据库中
    const validation = DB.validateLine(normalized);
    if (!validation.valid) return { ok: false, msg: '未在诗词库中找到此句，请确认输入正确' };

    // 检查是否已使用
    if (this.usedLines.has(normalized)) return { ok: false, msg: '此句已用过，请换一句' };

    // 检查首字匹配（非第一回合）
    if (this.lastChar !== null) {
      if (normalized[0] !== this.lastChar) {
        return { ok: false, msg: `首字需为"${this.lastChar}"，请重新输入` };
      }
    }

    // 有效！
    this.usedLines.add(normalized);
    const poem = validation.poem;
    const lastChar = normalized[normalized.length - 1];
    const firstChar = normalized[0];
    const score = this.calculateScore(normalized, poem);
    this.playerScore += score;
    this.chain.push({
      line: normalized,
      author: poem.a,
      dynasty: poem.d,
      title: poem.t,
      source: poem.s,
      who: 'player',
      firstChar,
      lastChar,
      score
    });

    // 切换到 AI 回合
    this.currentTurn = 'ai';
    this.lastChar = lastChar;
    this.stopTimer();
    this.notify();

    // AI 回合
    setTimeout(() => this.aiTurn(), 800 + Math.random() * 1500);

    return { ok: true, score, poem, lastChar };
  }

  /**
   * AI 回合
   */
  aiTurn() {
    if (this.gameOver) return;

    if (this.onAIThinking) this.onAIThinking();

    setTimeout(() => {
      // 查找首字匹配的诗句
      const available = DB.getLinesByFirstChar(this.lastChar)
        .filter(item => !this.usedLines.has(item.line));

      if (available.length === 0) {
        // AI 无法接出，玩家获胜
        this.endGame('player', `AI 无法接出以"${this.lastChar}"开头的诗句`);
        return;
      }

      // AI 策略选择
      const aiLine = this.aiSelect(available);
      this.usedLines.add(aiLine.line);
      const newLastChar = aiLine.line[aiLine.line.length - 1];
      const newFirstChar = aiLine.line[0];
      const score = this.calculateScore(aiLine.line, aiLine.poem);
      this.aiScore += score;
      this.chain.push({
        line: aiLine.line,
        author: aiLine.poem.a,
        dynasty: aiLine.poem.d,
        title: aiLine.poem.t,
        source: aiLine.poem.s,
        who: 'ai',
        firstChar: newFirstChar,
        lastChar: newLastChar,
        score
      });

      if (this.onAIRespond) this.onAIRespond(aiLine.line, aiLine.poem);

      // 切换到玩家回合
      this.currentTurn = 'player';
      this.lastChar = newLastChar;
      this.timeLeft = this.timeLimit;
      this.startTimer();
      this.notify();
    }, 600 + Math.random() * 1200);
  }

  /**
   * AI 选句策略
   * 核心策略：优先选末字罕见的句，让玩家难以接续
   */
  aiSelect(available) {
    const sorted = [...available].sort((a, b) => a.poem.diff - b.poem.diff);
    const startFreq = DB.getStartCharFrequency();
    const endFreq = DB.getEndCharFrequency();

    if (this.difficulty === 'easy') {
      // 简单：优先用名篇，末字常见的句（让玩家容易接）
      const easy = sorted.filter(item => item.poem.diff <= 2);
      const pool = easy.length > 0 ? easy : sorted;
      // 末字频率高的优先（玩家容易接）
      pool.sort((a, b) => {
        const freqA = endFreq[a.line[a.line.length - 1]] || 0;
        const freqB = endFreq[b.line[b.line.length - 1]] || 0;
        return freqB - freqA; // 降序，末字常见的排前面
      });
      return pool[Math.floor(Math.random() * Math.min(pool.length, 5))];
    } else if (this.difficulty === 'medium') {
      // 中等：平衡策略
      const mid = sorted.filter(item => item.poem.diff >= 2);
      const pool = mid.length > 0 ? mid : sorted;
      return pool[Math.floor(Math.random() * Math.min(pool.length, 4))];
    } else {
      // 困难：优先用冷门句，末字罕见的（玩家难接）
      const hard = sorted.filter(item => item.poem.diff >= 3);
      const pool = hard.length > 0 ? hard : sorted;
      // 末字频率低的优先（玩家难接）
      pool.sort((a, b) => {
        const freqA = endFreq[a.line[a.line.length - 1]] || 0;
        const freqB = endFreq[b.line[b.line.length - 1]] || 0;
        return freqA - freqB; // 升序，末字罕见的排前面
      });
      return pool[Math.floor(Math.random() * Math.min(pool.length, 3))];
    }
  }

  /**
   * 计算得分
   */
  calculateScore(line, poem) {
    let base = 1;
    if (poem.diff >= 3) base = 3;
    else if (poem.diff >= 2) base = 2;
    return base;
  }

  /**
   * 计时器
   */
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
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  playerPass() {
    if (this.gameOver || this.currentTurn !== 'player') return;
    this.endGame('ai', '你选择了放弃');
  }

  /**
   * 提示：返回一句符合当前接龙约束且未用过的诗句（优先名篇）
   * 不占用该句，玩家仍可自行输入；每局限 3 次
   */
  hint() {
    if (this.gameOver || this.currentTurn !== 'player' || this.hintsLeft <= 0) return null;
    let available;
    if (this.lastChar === null) {
      // 首回合：任意名篇
      available = DB.getAllLines().filter(item => !this.usedLines.has(item.line));
    } else {
      available = DB.getLinesByFirstChar(this.lastChar)
        .filter(item => !this.usedLines.has(item.line));
    }
    if (available.length === 0) return null;
    const sorted = available.sort((a, b) => a.poem.diff - b.poem.diff);
    const item = sorted[Math.floor(Math.random() * Math.min(sorted.length, 8))];
    this.hintsLeft--;
    return { line: item.line, poem: item.poem };
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
      chain: this.chain,
      poemsUsed: [...new Set(this.chain.map(c => c.title))]
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

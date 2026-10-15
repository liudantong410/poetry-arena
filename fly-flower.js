/**
 * 飞花令 · AI 擂台
 * 玩家与 AI 轮流说出含指定关键字的诗句
 * 重复或超时则判负
 */

class FlyFlowerGame {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
    this.timeLimit = { easy: 60, medium: 45, hard: 30 }[difficulty];
    this.usedLines = new Set();
    this.playerScore = 0;
    this.aiScore = 0;
    this.currentTurn = 'player'; // 'player' | 'ai'
    this.targetChar = '';
    this.gameOver = false;
    this.winner = null;
    this.history = []; // { line, author, dynasty, title, who }
    this.timer = null;
    this.timeLeft = this.timeLimit;
    this.onStateChange = null;
    this.onTimerTick = null;
    this.onGameOver = null;
    this.onAIThinking = null;
    this.onAIRespond = null;
  }

  /**
   * 开始游戏，随机选择关键字
   */
  start() {
    const chars = DB.getFlyFlowerChars();
    // 随机选一个出现 >= 3 次的字
    this.targetChar = chars[Math.floor(Math.random() * Math.min(chars.length, 30))];
    this.currentTurn = 'player';
    this.startTimer();
    this.notify();
    return { targetChar: this.targetChar, turn: this.currentTurn };
  }

  /**
   * 玩家提交一句诗
   */
  playerSubmit(input) {
    if (this.gameOver || this.currentTurn !== 'player') return { ok: false, msg: '不是你的回合' };

    const normalized = input.trim().replace(/[，。、？！；：""''（）\s]/g, '');
    if (!normalized) return { ok: false, msg: '请输入诗句' };
    if (!normalized.includes(this.targetChar)) return { ok: false, msg: `诗句中需含"${this.targetChar}"字` };

    // 验证是否在数据库中
    const validation = DB.validateLine(normalized);
    if (!validation.valid) return { ok: false, msg: '未在诗词库中找到此句，请确认输入正确' };

    // 检查是否已使用
    if (this.usedLines.has(normalized)) return { ok: false, msg: '此句已用过，请换一句' };

    // 有效！
    this.usedLines.add(normalized);
    const poem = validation.poem;
    const score = this.calculateScore(normalized, poem);
    this.playerScore += score;
    this.history.push({
      line: normalized,
      author: poem.a,
      dynasty: poem.d,
      title: poem.t,
      source: poem.s,
      who: 'player',
      score
    });

    // 切换到 AI 回合
    this.currentTurn = 'ai';
    this.stopTimer();
    this.notify();

    // AI 回合
    setTimeout(() => this.aiTurn(), 800 + Math.random() * 1500);

    return { ok: true, score, poem };
  }

  /**
   * AI 回合
   */
  aiTurn() {
    if (this.gameOver) return;

    if (this.onAIThinking) this.onAIThinking();

    setTimeout(() => {
      const available = DB.getLinesByChar(this.targetChar)
        .filter(item => !this.usedLines.has(item.line));

      if (available.length === 0) {
        // AI 无法接出，玩家获胜
        this.endGame('player', 'AI 无法接出诗句');
        return;
      }

      // AI 策略选择
      const aiLine = this.aiSelect(available);
      this.usedLines.add(aiLine.line);
      const score = this.calculateScore(aiLine.line, aiLine.poem);
      this.aiScore += score;
      this.history.push({
        line: aiLine.line,
        author: aiLine.poem.a,
        dynasty: aiLine.poem.d,
        title: aiLine.poem.t,
        source: aiLine.poem.s,
        who: 'ai',
        score
      });

      if (this.onAIRespond) this.onAIRespond(aiLine.line, aiLine.poem);

      // 切换到玩家回合
      this.currentTurn = 'player';
      this.timeLeft = this.timeLimit;
      this.startTimer();
      this.notify();
    }, 600 + Math.random() * 1200);
  }

  /**
   * AI 选句策略
   */
  aiSelect(available) {
    const sorted = [...available].sort((a, b) => a.poem.diff - b.poem.diff);

    if (this.difficulty === 'easy') {
      // 简单：优先用名篇（难度 1-2），随机选
      const easy = sorted.filter(item => item.poem.diff <= 2);
      const pool = easy.length > 0 ? easy : sorted;
      return pool[Math.floor(Math.random() * Math.min(pool.length, 5))];
    } else if (this.difficulty === 'medium') {
      // 中等：难度 2-3，有一定策略性
      const mid = sorted.filter(item => item.poem.diff >= 2 && item.poem.diff <= 3);
      const pool = mid.length > 0 ? mid : sorted;
      return pool[Math.floor(Math.random() * pool.length)];
    } else {
      // 困难：优先用冷门（难度 3+），优先选末字罕见的句
      const hard = sorted.filter(item => item.poem.diff >= 3);
      const pool = hard.length > 0 ? hard : sorted;
      // 按末字频率排序，优先末字罕见的
      const endFreq = DB.getEndCharFrequency();
      pool.sort((a, b) => {
        const freqA = endFreq[a.line[a.line.length - 1]] || 0;
        const freqB = endFreq[b.line[b.line.length - 1]] || 0;
        return freqA - freqB;
      });
      return pool[Math.floor(Math.random() * Math.min(pool.length, 3))];
    }
  }

  /**
   * 计算得分：冷门句得分更高
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

  /**
   * 玩家主动放弃
   */
  playerPass() {
    if (this.gameOver || this.currentTurn !== 'player') return;
    this.endGame('ai', '你选择了放弃');
  }

  /**
   * 结束游戏
   */
  endGame(winner, reason) {
    this.gameOver = true;
    this.winner = winner;
    this.stopTimer();
    this.notify();
    if (this.onGameOver) this.onGameOver(winner, reason, this.getResult());
  }

  /**
   * 获取结果
   */
  getResult() {
    return {
      winner: this.winner,
      playerScore: this.playerScore,
      aiScore: this.aiScore,
      targetChar: this.targetChar,
      rounds: this.history.length,
      history: this.history,
      poemsUsed: [...new Set(this.history.map(h => h.title))]
    };
  }

  /**
   * 通知状态变化
   */
  notify() {
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  getState() {
    return {
      targetChar: this.targetChar,
      currentTurn: this.currentTurn,
      playerScore: this.playerScore,
      aiScore: this.aiScore,
      timeLeft: this.timeLeft,
      timeLimit: this.timeLimit,
      gameOver: this.gameOver,
      winner: this.winner,
      history: this.history,
      usedCount: this.usedLines.size
    };
  }
}

/**
 * 诗阵 · 炸弹玩法引擎
 * 两种玩法：
 *   kind='word' 词语炸弹：给定首字母，轮流说词，踩中唯一炸弹词者负
 *   kind='poem' 诗词炸弹：给定关键字，轮流说含该字诗句，踩中炸弹句者负
 * 两种驱动：
 *   单机：isAI 座位由引擎自动行动
 *   联机主机：hostDriven=true，真人客人通过 injectSubmit 注入行动，引擎负责裁决与广播
 */

class BombGame {
  /**
   * @param {Object} opts
   * @param {'word'|'poem'} opts.kind
   * @param {Array<{id:string,name:string,isAI:boolean,isLocal?:boolean}>} opts.seats
   * @param {number} opts.timeLimit 真人回合秒数
   */
  constructor(opts) {
    this.kind = opts.kind;
    this.seats = opts.seats;
    this.timeLimit = opts.timeLimit || 30;
    this.hostDriven = !!opts.hostDriven;

    this.round = null;          // word: {code,words,bomb}  poem: {char,candidates,bombLine}
    this.usedSet = new Set();
    this.history = [];          // {seatId,name,text,result:'safe'|'bomb'|'unknown'}
    this.current = 0;           // 当前座位下标
    this.hintsLeft = 3;         // 单机模式每局 3 次提示机会（联机不启用）
    this.gameOver = false;
    this.loserId = null;
    this.timeLeft = this.timeLimit;
    this.timer = null;
    this.aiTimer = null;

    this.onStateChange = null;
    this.onTimerTick = null;
    this.onGameOver = null;
    this.onSeatExplode = null;  // (seat) 爆炸动画
  }

  start() {
    if (this.kind === 'word') {
      this.round = BombWords.newRound();
    } else {
      this.round = this.makePoemRound();
    }
    this.current = 0;
    this.beginTurn();
    this.notify();
  }

  /** 诗词炸弹：选一个候选句充足的关键字，随机定炸弹句 */
  makePoemRound() {
    const chars = DB.getFlyFlowerChars();
    const pool = [];
    for (const ch of chars.slice(0, 40)) {
      const raw = DB.getLinesByChar(ch);
      const map = new Map();
      for (const item of raw) {
        if (!map.has(item.line)) map.set(item.line, item);
      }
      if (map.size >= 8) pool.push({ char: ch, candidates: [...map.values()] });
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const bombItem = pick.candidates[Math.floor(Math.random() * pick.candidates.length)];
    return {
      char: pick.char,
      candidates: pick.candidates,
      bombLine: bombItem.line,
      bombPoem: bombItem.poem
    };
  }

  // ===== 回合流转 =====
  beginTurn() {
    if (this.gameOver) return;
    this.stopTimer();
    const seat = this.seats[this.current];

    if (seat.isAI) {
      this.aiTimer = setTimeout(() => this.aiAct(), 1200 + Math.random() * 1600);
    } else {
      this.timeLeft = this.timeLimit;
      this.startTimer();
    }
    this.notify();
  }

  nextTurn() {
    this.current = (this.current + 1) % this.seats.length;
    this.beginTurn();
  }

  // ===== 行动裁决（统一入口） =====
  resolve(seatId, text) {
    if (this.gameOver) return { ok: false, msg: '本局已结束' };
    const seat = this.seats[this.current];
    if (seat.id !== seatId) return { ok: false, msg: '还没轮到你' };

    const value = (text || '').trim();
    if (!value) return { ok: false, msg: '请输入内容' };
    if (this.usedSet.has(value)) return { ok: false, msg: '已经说过了，换一个' };

    let result, detail = null;
    if (this.kind === 'word') {
      result = BombWords.check(value, this.round);
    } else {
      result = this.checkPoem(value);
      if (result !== 'unknown') {
        const hit = this.round.candidates.find(c => c.line === value);
        if (hit) detail = hit.poem;
      }
    }

    if (result === 'unknown') {
      return { ok: false, msg: this.kind === 'word'
        ? `词库未收录"${value}"，换一个试试`
        : `诗词库中未找到含"${this.round.char}"字的这句` };
    }

    this.stopTimer();
    this.usedSet.add(value);
    this.history.push({ seatId, name: seat.name, text: value, result, detail });

    if (result === 'bomb') {
      this.endGame(seatId);
      return { ok: true, result, boom: true };
    }
    // safe → 下一位
    this.notify();
    this.nextTurn();
    return { ok: true, result: 'safe' };
  }

  checkPoem(value) {
    if (!value.includes(this.round.char)) return 'unknown';
    if (value === this.round.bombLine) return 'bomb';
    if (this.round.candidates.some(c => c.line === value)) return 'safe';
    return 'unknown';
  }

  // ===== 本地玩家（单机玩家 / 联机房主） =====
  localSubmit(text) {
    const local = this.seats.find(s => s.isLocal);
    if (!local) return { ok: false, msg: '无本地座位' };
    const r = this.resolve(local.id, text);
    if (!r.ok && this.onStateChange) this.notify(); // 刷新错误提示
    return r;
  }

  /** 主机收到客人提交 */
  injectSubmit(seatId, text) {
    return this.resolve(seatId, text);
  }

  /**
   * 提示（仅单机）：抽一个剩余候选中确认安全的词/句，填给玩家参考
   * 每局限 3 次；联机时 guests 不知道炸弹，不启用
   */
  hint() {
    if (this.gameOver || this.hintsLeft <= 0) return null;
    let pick = null;
    if (this.kind === 'word') {
      const remain = this.round.words.filter(w => !this.usedSet.has(w) && w !== this.round.bomb);
      if (remain.length > 0) pick = remain[Math.floor(Math.random() * remain.length)];
    } else {
      const remain = this.round.candidates.filter(c => !this.usedSet.has(c.line) && c.line !== this.round.bombLine);
      if (remain.length > 0) pick = remain[Math.floor(Math.random() * remain.length)].line;
    }
    if (!pick) return null;
    this.hintsLeft--;
    return pick;
  }

  // ===== AI 行动（AI 同样可能踩雷，公平） =====
  aiAct() {
    if (this.gameOver) return;
    const seat = this.seats[this.current];
    let pick;
    if (this.kind === 'word') {
      pick = BombWords.aiPick(this.round, this.usedSet);
    } else {
      const remain = this.round.candidates.filter(c => !this.usedSet.has(c.line));
      if (remain.length === 0) pick = null;
      else {
        const item = remain[Math.floor(Math.random() * remain.length)];
        pick = { word: item.line, result: item.line === this.round.bombLine ? 'bomb' : 'safe' };
      }
    }
    if (!pick) {
      // 候选耗尽（极端情况）：判 AI 负
      this.stopTimer();
      this.endGame(seat.id);
      return;
    }
    this.usedSet.add(pick.word);
    this.history.push({ seatId: seat.id, name: seat.name, text: pick.word, result: pick.result });
    if (pick.result === 'bomb') {
      this.endGame(seat.id);
      return;
    }
    this.notify();
    this.nextTurn();
  }

  // ===== 计时 =====
  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.onTimerTick) this.onTimerTick(this.timeLeft);
      if (this.timeLeft <= 0) {
        this.stopTimer();
        const seat = this.seats[this.current];
        if (!seat.isAI) {
          // 超时未答：慌乱踩雷，判该位负
          this.history.push({ seatId: seat.id, name: seat.name, text: '（超时未答）', result: 'bomb' });
          this.endGame(seat.id);
        }
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.aiTimer) { clearTimeout(this.aiTimer); this.aiTimer = null; }
  }

  endGame(loserId) {
    this.gameOver = true;
    this.loserId = loserId;
    this.stopTimer();
    this.notify();
    const loser = this.seats.find(s => s.id === loserId);
    if (this.onSeatExplode) this.onSeatExplode(loser);
    if (this.onGameOver) {
      this.onGameOver(loserId, this.getState());
    }
  }

  // ===== 状态快照（联机时整体广播） =====
  getState() {
    return {
      kind: this.kind,
      round: this.kind === 'word'
        ? { code: this.round.code, total: this.round.words.length }
        : { char: this.round.char, total: this.round.candidates.length,
            bombLine: this.gameOver ? this.round.bombLine : null,
            bombPoem: this.gameOver ? this.round.bombPoem : null,
            bomb: this.gameOver ? this.round.bombLine : null },
      bombWord: (this.kind === 'word' && this.gameOver) ? this.round.bomb : null,
      seats: this.seats,
      current: this.current,
      history: this.history,
      usedCount: this.usedSet.size,
      remain: this.kind === 'word'
        ? this.round.words.length - this.usedSet.size
        : this.round.candidates.length - this.usedSet.size,
      timeLeft: this.timeLeft,
      timeLimit: this.timeLimit,
      gameOver: this.gameOver,
      loserId: this.loserId
    };
  }

  notify() {
    if (this.onStateChange) this.onStateChange(this.getState());
  }
}

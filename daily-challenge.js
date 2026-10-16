/**
 * 诗阵 · 每日随机诗词挑战
 * 玩家点击"一键唤醒"，诗词快速滚动随机出一句，
 * 然后依次给出题目、作者、出处的四选项，全部选择后展示全诗。
 * 默认每日固定一题（日期种子），揭晓后可"随机再来"换其他诗篇。
 */

class DailyChallenge {
  constructor() {
    this.poem = null;
    this.targetLine = null;
    this.answers = { title: null, author: null, source: null };
    this.options = { source: [], author: [], title: [] };
    this.phase = 'idle';  // idle | scrolling | quiz | revealed
    this.scrollTimer = null;
    this.onPhaseChange = null;
    this.onReveal = null;
  }

  /** 基于日期生成种子（每日固定） */
  static getSeed() {
    const now = new Date();
    return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  }

  /** 简单种子随机 */
  static seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  /** 从诗词库选一首诗和其中一整句（出句+对句）；randomMode 时每次随机换诗 */
  pickPoem(randomMode = false) {
    const poems = POETRY_DB.filter(p => p.lines.length >= 2);
    let idx;
    if (randomMode) {
      idx = Math.floor(Math.random() * poems.length);
    } else {
      const seed = DailyChallenge.getSeed();
      idx = Math.floor(DailyChallenge.seededRandom(seed) * poems.length);
    }
    this.poem = poems[idx];

    // 选取一整句：两个半句组成一个完整句（如"床前明月光，疑是地上霜"）
    const pairCount = Math.floor(this.poem.lines.length / 2);
    let pairIdx;
    if (randomMode) {
      pairIdx = Math.floor(Math.random() * pairCount);
    } else {
      pairIdx = Math.floor(DailyChallenge.seededRandom(DailyChallenge.getSeed() + 1) * pairCount);
    }
    const i = pairIdx * 2;
    this.targetLine = this.poem.lines[i] + '，' + this.poem.lines[i + 1];
  }

  /** 生成选项：出处 2 选 1（大多数人不知道出处），题目/作者 4 选 1 */
  generateOptions() {
    this.options.title = this.makeOptions(this.poem.t, 't', 3);
    this.options.author = this.makeOptions(this.poem.a, 'a', 3);
    this.options.source = this.makeOptions(this.poem.s, 's', 1);
  }

  /** 从所有诗中取该字段的值，组成 (wrongCount+1) 选 1 */
  makeOptions(correctVal, field, wrongCount = 3) {
    const pool = [...new Set(POETRY_DB.map(p => p[field]))];
    const wrongs = pool.filter(v => v !== correctVal);
    const picks = [];
    const copy = [...wrongs];
    for (let i = 0; i < wrongCount && copy.length > 0; i++) {
      const r = Math.floor(Math.random() * copy.length);
      picks.push(copy.splice(r, 1)[0]);
    }
    while (picks.length < wrongCount) picks.push('（无）');
    const all = [...picks, correctVal];
    for (let i = all.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      [all[i], all[r]] = [all[r], all[i]];
    }
    return all;
  }

  /**
   * 开始：滚动动画 → 展示题目
   * @param {boolean} randomMode true=随机换一首（再来一次），false=每日固定诗
   */
  start(randomMode = false) {
    this.pickPoem(randomMode);
    this.generateOptions();
    this.answers = { title: null, author: null, source: null };
    this.phase = 'scrolling';
    this.notify();
    this.runScroll();
  }

  /** 滚动动画：快速闪过随机诗句，逐步减速后定格 */
  runScroll() {
    const allLines = DB.getAllLines();
    let elapsed = 0;
    const totalDuration = 3000;  // 3 秒
    let interval = 50;

    const tick = () => {
      elapsed += interval;
      // 随机展示一句
      const randomLine = allLines[Math.floor(Math.random() * allLines.length)];
      if (this.onPhaseChange) this.onPhaseChange({ phase: 'scrolling', displayLine: randomLine.line });

      if (elapsed >= totalDuration) {
        // 定格到目标句
        this.phase = 'quiz';
        console.log('[Daily] 转入 quiz 阶段, answers=', this.answers, 'options=', this.options);
        this.notify();
      } else {
        // 减速
        interval = Math.min(interval + 20, 250);
        this.scrollTimer = setTimeout(tick, interval);
      }
    };
    tick();
  }

  /** 玩家选择某项 */
  select(field, value) {
    if (this.phase !== 'quiz') return;
    this.answers[field] = value;
    // 全部选完则直接揭晓，跳过中间的重新渲染
    if (this.answers.source && this.answers.author && this.answers.title) {
      this.reveal();
    } else {
      this.notify();
    }
  }

  /** 揭晓答案 */
  reveal() {
    this.phase = 'revealed';
    const correct = {
      source: this.answers.source === this.poem.s,
      author: this.answers.author === this.poem.a,
      title: this.answers.title === this.poem.t
    };
    const score = (correct.source ? 1 : 0) + (correct.author ? 1 : 0) + (correct.title ? 1 : 0);
    this.notify();
    if (this.onReveal) this.onReveal({
      poem: this.poem,
      targetLine: this.targetLine,
      answers: this.answers,
      correct,
      score
    });
  }

  /** 重置 */
  reset() {
    if (this.scrollTimer) { clearTimeout(this.scrollTimer); this.scrollTimer = null; }
    this.phase = 'idle';
    this.answers = { title: null, author: null, source: null };
  }

  notify() {
    if (this.onPhaseChange) this.onPhaseChange({
      phase: this.phase,
      targetLine: this.targetLine,
      options: this.options,
      answers: this.answers
    });
  }
}

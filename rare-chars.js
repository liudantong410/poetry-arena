/**
 * 诗阵 · 生僻字玩法引擎
 * 类别：surname 姓氏 / daily 日常
 * 玩法：choice 四选一 / fill 填空（输入拼音）
 * 回合：5 / 10 回合制，或无限模式（答错即止的连对挑战）
 */

/** 拼音归一化：声调符号转数字调，ü 统一为 v 再还原，便于比较 */
function normalizePinyin(s) {
  s = (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const m = {
    'ā': 'a1', 'á': 'a2', 'ǎ': 'a3', 'à': 'a4',
    'ē': 'e1', 'é': 'e2', 'ě': 'e3', 'è': 'e4',
    'ī': 'i1', 'í': 'i2', 'ǐ': 'i3', 'ì': 'i4',
    'ō': 'o1', 'ó': 'o2', 'ǒ': 'o3', 'ò': 'o4',
    'ū': 'u1', 'ú': 'u2', 'ǔ': 'u3', 'ù': 'u4',
    'ǖ': 'ü1', 'ǘ': 'ü2', 'ǚ': 'ü3', 'ǜ': 'ü4'
  };
  s = [...s].map(c => m[c] || c).join('');
  return s;
}

/** 构造某条目的可接受答案集合（数字调 + 带调 + 额外读法，含去空格变体） */
function rareAcceptSet(item) {
  const raw = [item.num, item.py].concat(item.acc || []);
  const set = new Set();
  raw.forEach(x => {
    const n = normalizePinyin(x);
    set.add(n);
    set.add(n.replace(/ /g, ''));
  });
  return set;
}

class RareCharsGame {
  /**
   * @param cat 'surname' | 'daily'
   * @param playMode 'choice' | 'fill'
   * @param rounds 0=无限(答错即止) / 5 / 10
   */
  constructor(cat, playMode, rounds) {
    this.cat = cat;
    this.playMode = playMode;
    this.rounds = rounds;
    this.pool = this.shuffle(RARE_CHARS_DB.filter(x => x.cat === cat));
    this.cursor = 0;      // 池内游标
    this.answered = 0;    // 已答题数
    this.score = 0;
    this.correct = 0;
    this.wrong = 0;
    this.hintsLeft = 3;
    this.gameOver = false;
    this.records = [];    // {item, ok}
  }

  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  current() {
    if (this.cursor >= this.pool.length) {
      this.pool = this.shuffle(this.pool);
      this.cursor = 0;
    }
    return this.pool[this.cursor];
  }

  /** 提交答案（choice 传选项拼音，fill 传输入串） */
  answer(val) {
    if (this.gameOver) return null;
    const item = this.current();
    const ok = rareAcceptSet(item).has(normalizePinyin(val));
    this.answered++;
    if (ok) {
      this.correct++;
      this.score += this.playMode === 'fill' ? 15 : 10;
    } else {
      this.wrong++;
    }
    this.records.push({ item, ok });
    this.cursor++;
    // 结束判定：回合制按题数；无限模式答错即止
    if (this.rounds > 0 && this.answered >= this.rounds) this.gameOver = true;
    if (this.rounds === 0 && !ok) this.gameOver = true;
    return { ok, item, gameOver: this.gameOver };
  }

  /** 提前结束（无限模式下玩家主动收兵） */
  finish() {
    this.gameOver = true;
  }

  /**
   * 提示（每局 3 次）
   * choice：返回要排除的错误选项数组（最多 2 个）
   * fill：返回提示文本（不含声调的拼写 + 声调）
   */
  hint() {
    if (this.hintsLeft <= 0 || this.gameOver) return null;
    this.hintsLeft--;
    const item = this.current();
    if (this.playMode === 'choice') {
      const wrongs = this.shuffle(item.opts.filter(o => o !== item.py)).slice(0, 2);
      return { kind: 'eliminate', options: wrongs };
    }
    const tone = item.num.match(/\d/);
    const base = item.num.replace(/[0-9]/g, '').trim();
    return {
      kind: 'fill',
      text: tone
        ? `拼写为「${base}」，第 ${tone[0]} 声`
        : `读作轻声「${base}」`
    };
  }
}

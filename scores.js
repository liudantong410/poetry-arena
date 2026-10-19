/**
 * 诗阵 · 积分与本地账号系统
 * 纯前端实现：昵称即登录，数据保存在 localStorage
 * - 每个玩法的个人最高分
 * - 累计总积分（预留皮肤兑换）
 */
const Scores = {
  PROFILE_KEY: 'poetry-profile',
  HIGH_KEY: 'poetry-highscores',

  // 玩法标识 → 显示名（mode-card 的 data-mode 与此一致，bomb-word-menu 特殊映射）
  MODE_NAMES: {
    'daily-challenge': '每日诗词挑战',
    'fly-flower': '飞花令',
    'chain': '诗词接龙',
    'idiom-chain': '成语接龙',
    'bomb-poem': '诗词炸弹',
    'bomb-word': '词语炸弹',
    'rare-chars': '生僻字'
  },

  // ---------- 账号 ----------
  getProfile() {
    try {
      const p = JSON.parse(localStorage.getItem(this.PROFILE_KEY));
      if (p && typeof p === 'object') return { name: p.name || null, total: p.total || 0 };
    } catch (e) { /* 忽略损坏数据 */ }
    return { name: null, total: 0 };
  },

  saveProfile(p) {
    try { localStorage.setItem(this.PROFILE_KEY, JSON.stringify(p)); } catch (e) { /* 静默 */ }
  },

  /** 昵称即登录；返回是否成功 */
  login(name) {
    name = (name || '').trim();
    if (!name) return false;
    const p = this.getProfile();
    p.name = name.slice(0, 12);
    this.saveProfile(p);
    return true;
  },

  logout() {
    const p = this.getProfile();
    p.name = null; // 保留积分与最高分
    this.saveProfile(p);
  },

  isLoggedIn() {
    return !!this.getProfile().name;
  },

  // ---------- 积分 ----------
  getTotal() {
    return this.getProfile().total;
  },

  // ---------- 最高分 ----------
  getHighs() {
    try {
      const h = JSON.parse(localStorage.getItem(this.HIGH_KEY));
      if (h && typeof h === 'object') return h;
    } catch (e) { /* 忽略 */ }
    return {};
  },

  getHigh(mode) {
    return this.getHighs()[mode] || 0;
  },

  /**
   * 一局结束结算：累计总积分，刷新最高分
   * @returns {{isNewHigh:boolean, high:number, total:number}}
   */
  addResult(mode, score) {
    score = Math.max(0, Math.round(score || 0));
    const highs = this.getHighs();
    const prev = highs[mode] || 0;
    const isNewHigh = score > prev;
    if (isNewHigh) {
      highs[mode] = score;
      try { localStorage.setItem(this.HIGH_KEY, JSON.stringify(highs)); } catch (e) { /* 静默 */ }
    }
    const p = this.getProfile();
    p.total = (p.total || 0) + score;
    this.saveProfile(p);
    return { isNewHigh, high: Math.max(prev, score), total: p.total };
  }
};

/**
 * 诗阵 · 词语炸弹词库（自动构建版）
 * 不手工维护分组，而是在初始化时从 IdiomDB + 手工常用词
 * 按「首字」自动分组，覆盖所有可能的首字
 * 这样永远不会出现"某首字母组没词"的问题
 */

// 手工两字词（非成语，覆盖常用动词/名词），清理去重后仅保留高频
const MANUAL_WORDS = [
  // B
  "报名","避免","表面","部门","保密","百米","笔墨","饱满","标明","病魔","弊端","变幻","辨别","便捷","辩白",
  // C
  "参加","曾经","场景","春季","餐具","拆迁","才华","彩虹","策划","仓储","偿还","场合","车祸","迟钝","出海",
  "窗花","春晖","柴火","绰号","彩绘","传话","春夏","葱花","常识","尝试","长途","长远","长久","长城","长江",
  // D
  "地方","大风","打发","得分","东风","电费","答复","刀法","登分","顶风","豆腐","东方","冬防","督导","动法",
  "道理","独立","到来","登陆","电力","道路","知道","战斗","早点","子弹","主动","值得","转动","增大","招待",
  "阻挡","争渡","账单","站队","折断","字典","阵地","针对","重大","遮挡","诊断","自动","制定","制度","指导",
  // F
  "飞机","放假","分解","房间","风景","附件","反击","发酵","发觉","分级","法警","佛经","泛舟","废旧","分界",
  "分工","放映","防腐","罚金","服役","赴京","富家","浮雕","飞箭","复检","风范","分歧","防具","风机","放下",
  "烦恼","方向","放心","翻译","反应","费用","复印","防御","风云","风月","富裕","飞跃","奋勇","纷扬","非议",
  "繁育","副业","翻越","抚养","发言","法院","非法","放眼","放纵","范文","风衣","飞扬","放映","敷衍","俯仰","丰盈",
  // G
  "过来","各种","公路","规律","管理","隔离","孤立","古老","鼓励","顾虑","画廊","各类","公里","功率","国力",
  // H
  "好像","欢喜","核心","呼吸","后续","海鲜","海选","豪侠","好心","航线","环境","回家","很好","喝茶","会场",
  "好处","火车","花菜","划船","合成","核查","灰尘","红尘","喝彩","回程","胡扯","酣畅","缓存","花茶","换车",
  "何处","虹彩","车厢","航程","耗材","画册","豪城","河池","旱厕","回潮","横穿","烩菜","鸿策","花草","华彩",
  "怀孕","火柴","后来","好了","合理","回来","欢乐","婚礼","洪流","华丽","狐狸","海浪","寒凉","喉咙","活力",
  "花篮","滑落","河流","行列","红利","火力","海蓝","晚会","文化","维护","辉煌","回忆","悔恨","贿赂","回报",
  "浑然","混沌","混淆","混蛋","浑厚","婚配","昏迷","婚姻","昏沉","昏暗","活力","火棒","火把","火盆","火塘","火药",
  // J
  "解决","经济","积极","紧急","奖金","家具","简洁","间接","交警","纠结","拒绝","季节","结局","讲解","竞技",
  "焦急","酒精","将军","尖叫","检查","即将","借鉴","计较","建议","捷径","集结","急救","晋级","集市","讲述",
  "驾驶","结交","戒骄","金鸡","荆江","警戒","间距","界定","佳绩","机器","进去","加强","金钱","尽情","郊区",
  "精确","奖券","节气","军情","交情","禁区","近期","九曲","惊奇","健全","假期","竞赛","金桥","救济","结清",
  "急需","金牌","景气","军区","健康","解气","军旗","绝情","北京","不仅","比较","不论","别具","班级","包机",
  "编辑","边境","悲剧","百家","背景","参加","曾经","场景","春季","餐具","拆迁"
  // K-L-M-N-P-Q-R-S-T-W-X-Y-Z
].sort();

/**
 * 从 IdiomDB 自动构建：按成语首字分组
 * 同时把 MANUAL_WORDS 也按首字归入对应组
 */
const BombWords = {
  _bank: null,     // 完整词库 { 首字: [候选词] }
  _ready: false,

  ensureInit() {
    if (this._ready) return;
    if (typeof IdiomDB !== 'undefined') IdiomDB.ensureInit();

    const bank = {};

    // 1. 直接复用 IdiomDB 按首字分组的 _byFirst（已构建好）
    if (typeof IdiomDB !== 'undefined' && IdiomDB._byFirst) {
      Object.keys(IdiomDB._byFirst).forEach(fc => {
        bank[fc] = [...IdiomDB._byFirst[fc]];
      });
    }

    // 2. 手工两字词也按首字归入对应组
    MANUAL_WORDS.forEach(w => {
      const fc = w[0];
      if (!bank[fc]) bank[fc] = [];
      if (!bank[fc].includes(w)) bank[fc].push(w);
    });

    // 3. 每组去重
    Object.keys(bank).forEach(k => {
      bank[k] = [...new Set(bank[k])];
    });

    this._bank = bank;
    this._ready = true;
    // 调试：输出首字 >=8 个候选的组数
    const active = Object.values(bank).filter(arr => arr.length >= 8);
    const idiomCount = typeof IdiomDB !== 'undefined' ? IdiomDB.getSize() : 0;
    console.log(`[BombWords] 首字组: ${Object.keys(bank).length} 个, 可用组: ${active.length} 个, 成语: ${idiomCount} + 手工词: ${MANUAL_WORDS.length}`);
  },

  /**
   * 随机开一局
   * @returns { code: string, words: string[], bomb: string }
   *   code = 首字（如 "一"）
   *   words = 候选成语数组（>=8 个）
   *   bomb = 从 words 中随机选的炸弹词
   */
  newRound(maxCount = 12) {
    this.ensureInit();
    const keys = Object.keys(this._bank).filter(k => this._bank[k].length >= 8);
    if (keys.length === 0) {
      console.warn('[BombWords] 没有可用的首字组！');
      return null;
    }
    const code = keys[Math.floor(Math.random() * keys.length)];
    // 从候选里随机取 8~maxCount 个作为本局候选，避免一次太多
    const pool = [...this._bank[code]];
    const n = Math.min(pool.length, Math.max(8, maxCount));
    const words = [];
    for (let i = 0; i < n && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      words.push(pool.splice(idx, 1)[0]);
    }
    const bomb = words[Math.floor(Math.random() * words.length)];
    return { code, words, bomb };
  },

  check(input, round) {
    const w = input.trim();
    if (round.bomb === w) return 'bomb';
    if (round.words.includes(w)) return 'safe';
    return 'unknown';
  },

  aiPick(round, usedSet) {
    const remain = round.words.filter(w => !usedSet.has(w));
    if (remain.length === 0) return null;
    const word = remain[Math.floor(Math.random() * remain.length)];
    return { word, result: word === round.bomb ? 'bomb' : 'safe' };
  }
};

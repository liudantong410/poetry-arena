/**
 * 诗阵 · 诗情画意起名（意境版）
 * 支持：游戏ID / 宝宝起名；叠字格式（ABB/AABB/AABC/ABAC/AA/AB…）；同句/上下句截取；
 * 出处：诗经 / 楚辞 / 汉魏六朝 / 唐诗 / 宋词 / 宋诗 / 元明清 / 成语 / 典籍参考（龙生九子、易经、君子九如）
 */

/* ========== 一、风格（气质） ========== */
const NAME_STYLES = [
  {
    id: 'swordsman', name: '古风侠气',
    theme: '剑刀戈马关山塞烽戍旌旗铠刃侠客魂骨血锋酒箫笛骑射征战沙场江湖行舟渡寒霜风尘远道'
  },
  {
    id: 'gentle', name: '温婉诗意',
    theme: '月花雪雨烟柳荷莲梅兰桃杏樱棠春宵红颜柔情思君帘帐罗绮笙歌燕莺眉黛泪妆钗鬓'
  },
  {
    id: 'ethereal', name: '清雅出尘',
    theme: '清雅淡素净洁白霜雪冰玉月云露松竹鹤琴仙烟霞泉石幽谷禅钟苔径闲鹭'
  },
  {
    id: 'heroic', name: '豪迈奔放',
    theme: '天地山河海川岳江漠野长风大鹏万里千仞九霄剑气浩荡斟酒长剑八荒乾坤壮怀'
  },
  {
    id: 'cold', name: '清冷孤高',
    theme: '孤独寒冷雪霜月夜冥幽深远绝空舟笠钓江雪梅鹤寂寥萧疏残照断鸿'
  },
  {
    id: 'lively', name: '灵动俏皮',
    theme: '灵巧莺燕蝶蜂鱼蛙柳桃李春风笑歌童年竹马溪桥纸鸢嬉戏新绿嫩黄'
  }
];

/* ========== 二、用途（先选） ========== */
const NAME_PURPOSES = [
  { id: 'game', name: '起游戏ID', desc: '截取自诗词原句，带出处' },
  { id: 'baby', name: '给宝宝起名', desc: '加姓氏，优先成语 / 易经 / 君子九如 / 龙生九子 / 诗经' }
];

/* ========== 三、游戏类型（只限游戏ID） ========== */
const GAME_TYPES = [
  { id: 'casual',   name: '休闲', theme: '云鹤琴棋风月花鸟鱼虫清闲悠慢静淡素雅' },
  { id: 'farm',     name: '种田', theme: '田禾稻麦桑麻豆薯篱园圃畦阡陌锄耕收穗苗蔬' },
  { id: 'raise',    name: '养成', theme: '兰蕙芝桂玉树琪瑶珍宝玉润抚育仁德' },
  { id: 'compete',  name: '竞技', theme: '剑锋戈马关塞烽戍旌旗鼓角铙枪骑驰骋' },
  { id: 'shooter',  name: '射击', theme: '弓弩箭镞弦风雷火雷弹炮锋刃瞄准' },
  { id: 'rpg',      name: '角色扮演', theme: '江湖侠客仙魔神灵道法术魂魄梦境' },
  { id: 'strategy', name: '策略', theme: '谋策局阵兵车将帅旗鼓筹帷幄乾坤' },
  { id: 'racing',   name: '竞速', theme: '驰逐飞风箭云雷雷电闪电流星' }
];

/* ========== 四、出处（含新增典籍） ========== */
const NAME_SOURCES = [
  { id: 'shijing',  name: '诗经' },
  { id: 'chuci',    name: '楚辞' },
  { id: 'yuefu',    name: '汉魏六朝' },
  { id: 'tangshi',  name: '唐诗' },
  { id: 'songci',   name: '宋词' },
  { id: 'songshi',  name: '宋诗' },
  { id: 'yuanming', name: '元明清' },
  { id: 'idiom',    name: '成语典故' },
  { id: 'dragon9',  name: '龙生九子' },
  { id: 'yijing',   name: '易经' },
  { id: 'jiuru',    name: '诗经·君子九如' }
];

/* ========== 五、叠字格式 ========== */
// pattern 描述名字结构：A=主字(可出现多次), B/C/D=其他字（仅从同一句或上下句取）
const NAME_FORMATS = {
  1: [
    { id: 'A',    label: 'A 式',    example: '梅、鹤、寒' }
  ],
  2: [
    { id: 'AB',   label: 'AB 式',   example: '疏影、凌波' },
    { id: 'AA',   label: 'AA 式',   example: '依依、霏霏' }
  ],
  3: [
    { id: 'ABC',  label: 'ABC 式',  example: '柳如烟' },
    { id: 'ABB',  label: 'ABB 式',  example: '柳依依' },
    { id: 'AAB',  label: 'AAB 式',  example: '依依柳' },
    { id: 'ABA',  label: 'ABA 式',  example: '梅一梅' }
  ],
  4: [
    { id: 'ABCD', label: 'ABCD 式', example: '疏影横斜' },
    { id: 'AABB', label: 'AABB 式', example: '依依霏霏' },
    { id: 'AABC', label: 'AABC 式', example: '依依杨柳' },
    { id: 'ABAC', label: 'ABAC 式', example: '一心一意' }
  ]
};

/* ========== 六、字性判定 ========== */
const IMAGE_CHARS =
  '月日星辰花雪云烟霞雾岚虹霜露风霜雨霖泉溪江海河湖川山岭峰岳岩谷洞石松柏竹梅兰菊荷莲柳桃杏樱枫桐榆梧桐桂棠莲芙蓉芍药菀薇蘅芷蕙茅苔苹萍苇蒲芰茄蕊萼苞蕾' +
  '春宵秋夜夏冬晨昏暮晓夕朝昼暑寒暖凉温冰玉珠璧琳琅琼瑶瑾瑜璇璐翡翠珊瑚琥珀琉璃玛瑙琅玕玳瑁' +
  '光影色香清幽雅淡素净洁白皓皎澄澈碧翠青苍绿紫朱丹赤彤绯绛赭褐缁缃霞绮罗绫缎绡练绢纨缟' +
  '琴瑟笙箫筝笛钟磬鼓琶琵笳铃钹铙箜篌胡笳羌笛剑刀戈戟弓弩箭镞铩铍锏鞭镗槊殳' +
  '舟船帆桨橹棹楫舻舸鹤雁莺燕鸥鹭鹧鸪鸳鸯鸿鹄鹏凤鸾凰孔雀杜鹃鸬鹚' +
  '马驹骅骝骐骥龙麟虎豹狼熊鹿兔猿蝶蜂蝉蛾萤蚕鱼鲲';
const STOP_CHARS = '的了是在有不无我你他她它谁何此其之而于以与且则将乃为所被把让使很太更最也还都又就才只但若如似欲莫勿未曾已们咱俺' +
  '个只条张片块点些每某各另别的得地着过哩嘛呀吧呢啊哦嗯啦哈嘻咦唉嘿诶' +
  '一二三四五六七八九十百千万亿兆零半双自彼此那这哪些诸凡几许多少朝暮昨今明昔古往' +
  '上下左右前后里外中旁侧边间际内底顶头尾末尽头去来回归到过经从向对朝至抵临' +
  '说讲谈论问答看听闻见望观瞧瞅盼顾瞥睹视览读写吟唱颂咏诵' +
  '想思念忆记忘知觉晓懂明暗昏昧醒睡梦眠卧起居坐立行步走跑蹦跳站立躺';

function toCharArr(str) { return Array.from(str); }
const IMAGE_SET = new Set(toCharArr(IMAGE_CHARS));
const STOP_SET  = new Set(toCharArr(STOP_CHARS));

function isGoodChar(ch) {
  return /[\u4e00-\u9fa5]/.test(ch) && !STOP_SET.has(ch);
}

/** 给片段打分：意象字+主题字加分，虚词淘汰 */
function scoreFragment(frag, themeSet) {
  let score = 0;
  const seen = new Set();
  for (const ch of frag) {
    if (!/[\u4e00-\u9fa5]/.test(ch)) return -99;
    if (STOP_SET.has(ch)) return -99;
    seen.add(ch);
    if (IMAGE_SET.has(ch)) score += 2;
    if (themeSet && themeSet.has(ch)) score += 1;
    score += 0.2;
  }
  return score;
}

/* ========== 七、典籍参考库 ========== */
const REFERENCE_NAMES = {
  dragon9: [
    { name: '囚牛', from: '龙生九子·长子', line: '囚牛好音，常蹲琴头' },
    { name: '睚眦', from: '龙生九子·次子', line: '睚眦好杀，常刻刀环' },
    { name: '嘲风', from: '龙生九子·三子', line: '嘲风好险，常立殿角' },
    { name: '蒲牢', from: '龙生九子·四子', line: '蒲牢好鸣，常铸钟钮' },
    { name: '狻猊', from: '龙生九子·五子', line: '狻猊好坐，常倚香炉' },
    { name: '霸下', from: '龙生九子·六子', line: '霸下好负重，常驮碑石' },
    { name: '狴犴', from: '龙生九子·七子', line: '狴犴好讼，常守狱门' },
    { name: '负屃', from: '龙生九子·八子', line: '负屃好文，常盘碑顶' },
    { name: '螭吻', from: '龙生九子·九子', line: '螭吻好吞，常镇屋脊' }
  ],
  yijing: [
    { name: '元亨', from: '易经·乾卦', line: '乾：元，亨，利，贞' },
    { name: '利贞', from: '易经·乾卦', line: '乾：元，亨，利，贞' },
    { name: '潜龙', from: '易经·乾卦', line: '潜龙勿用' },
    { name: '见龙', from: '易经·乾卦', line: '见龙在田，利见大人' },
    { name: '飞龙', from: '易经·乾卦', line: '飞龙在天，利见大人' },
    { name: '亢龙', from: '易经·乾卦', line: '亢龙有悔' },
    { name: '坤厚', from: '易经·坤卦', line: '地势坤，君子以厚德载物' },
    { name: '载物', from: '易经·坤卦', line: '地势坤，君子以厚德载物' },
    { name: '云雷', from: '易经·屯卦', line: '云雷，屯；君子以经纶' },
    { name: '天健', from: '易经·乾卦', line: '天行健，君子以自强不息' },
    { name: '自强', from: '易经·乾卦', line: '天行健，君子以自强不息' }
  ],
  jiuru: [
    { name: '如山', from: '诗经·小雅·天保', line: '如山如阜' },
    { name: '如阜', from: '诗经·小雅·天保', line: '如山如阜' },
    { name: '如冈', from: '诗经·小雅·天保', line: '如冈如陵' },
    { name: '如陵', from: '诗经·小雅·天保', line: '如冈如陵' },
    { name: '如川', from: '诗经·小雅·天保', line: '如川之方至' },
    { name: '如月', from: '诗经·小雅·天保', line: '如月之恒' },
    { name: '如日', from: '诗经·小雅·天保', line: '如日之升' },
    { name: '如南山', from: '诗经·小雅·天保', line: '如南山之寿' },
    { name: '如松柏', from: '诗经·小雅·天保', line: '如松柏之茂' }
  ]
};

/* ========== 八、出处归属判定 ========== */
function sourceOfPoem(p) {
  const s = (p.s || '') + (p.t || '');
  if (/诗经/.test(s)) return 'shijing';
  if (/楚辞|九歌|离骚|九章|天问|招魂/.test(s)) return 'chuci';
  if (['汉', '魏', '晋', '三国', '南北朝'].includes(p.d)) return 'yuefu';
  if (/词/.test(p.type || '') || /词/.test(p.t || '')) return 'songci';
  if (p.d === '唐' && !/曲/.test(p.type || '')) return 'tangshi';
  if (p.d === '宋' && !/词|曲/.test(p.type || '')) return 'songshi';
  if (['元', '明', '清'].includes(p.d)) return 'yuanming';
  return 'other';
}

/* ========== 九、生成器 ========== */
class NameGenerator {
  constructor() {
    this.purpose = null;   // 'game' | 'baby'
    this.surname = '';
    this.gameType = null;  // 游戏类型 id
    this.style = null;
    this.themeSet = new Set();
    this.source = null;
    this.length = 2;
    this.format = null;    // 叠字格式 id
    this.used = new Set();
  }

  setPurpose(purpose) { this.purpose = purpose; this.used.clear(); }
  setSurname(s) { this.surname = (s || '').trim(); }
  setGameType(id) {
    this.gameType = id;
    const g = GAME_TYPES.find(x => x.id === id);
    if (g) this.themeSet = new Set(toCharArr(g.theme));
  }
  setStyle(styleId) {
    this.style = NAME_STYLES.find(s => s.id === styleId) || null;
    if (this.style) this.themeSet = new Set(toCharArr(this.style.theme));
  }
  setSource(sourceId) { this.source = sourceId; this.used.clear(); }
  setLength(len) { this.length = len; }
  setFormat(fmt) { this.format = fmt; }

  /* ---------- 诗句池：按出处 + 主题筛选 ---------- */
  buildLinePool() {
    const pool = [];
    const allPoems = (typeof POETRY_DB !== 'undefined') ? POETRY_DB : [];
    for (const poem of allPoems) {
      if (this.source && sourceOfPoem(poem) !== this.source) continue;
      const lines = poem.lines || [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const chars = toCharArr(line);
        let hit = 0;
        for (const ch of chars) if (this.themeSet.has(ch)) hit++;
        // 记录当前行 + 下一行（上下句）
        const nextLine = i + 1 < lines.length ? lines[i + 1] : null;
        pool.push({ line, nextLine, poem, hit });
      }
    }
    // 主题命中太少则放宽
    if (pool.filter(p => p.hit > 0).length < 8) {
      const fallback = [];
      for (const poem of allPoems) {
        if (this.source && sourceOfPoem(poem) !== this.source) continue;
        for (let i = 0; i < (poem.lines || []).length; i++) {
          fallback.push({
            line: poem.lines[i],
            nextLine: i + 1 < poem.lines.length ? poem.lines[i + 1] : null,
            poem, hit: 0
          });
        }
      }
      return fallback;
    }
    return pool.filter(p => p.hit > 0);
  }

  /* ---------- 从同句/上下句中提取单字候选 ---------- */
  extractCharsFromLine(line) {
    return toCharArr(line).filter(isGoodChar);
  }

  /* ---------- 按格式生成候选 ---------- */
  generateByFormat() {
    const L = this.length;
    const fmt = this.format;
    const pool = this.buildLinePool();
    const out = [];

    for (const { line, nextLine, poem, hit } of pool) {
      const chars = this.extractCharsFromLine(line);
      if (chars.length < 1) continue;

      const candidates = [];
      if (fmt === 'A' && L === 1) {
        // 单字：从句中任取
        for (const ch of chars) candidates.push({ name: ch, line, poem, hit });
      } else if (fmt === 'AB' && L === 2) {
        // AB：同句中任取两字（不挨着也可）
        for (let i = 0; i < chars.length; i++)
          for (let j = i + 1; j < chars.length; j++)
            candidates.push({ name: chars[i] + chars[j], line, poem, hit });
        // 上下句各取一字
        if (nextLine) {
          const nextChars = this.extractCharsFromLine(nextLine);
          for (const c1 of chars)
            for (const c2 of nextChars)
              candidates.push({ name: c1 + c2, line: line + '，' + nextLine, poem, hit });
        }
      } else if (fmt === 'AA' && L === 2) {
        // AA：同句中同一字出现两次
        const cnt = {};
        for (const ch of chars) cnt[ch] = (cnt[ch] || 0) + 1;
        for (const ch of chars) if (cnt[ch] >= 2) candidates.push({ name: ch + ch, line, poem, hit });
      } else if (fmt === 'ABC' && L === 3) {
        for (let i = 0; i < chars.length; i++)
          for (let j = i + 1; j < chars.length; j++)
            for (let k = j + 1; k < chars.length; k++)
              candidates.push({ name: chars[i] + chars[j] + chars[k], line, poem, hit });
      } else if (fmt === 'ABB' && L === 3) {
        const cnt = {};
        for (const ch of chars) cnt[ch] = (cnt[ch] || 0) + 1;
        for (const b of chars) {
          if (cnt[b] >= 2) {
            for (const a of chars) {
              if (a !== b) candidates.push({ name: a + b + b, line, poem, hit });
            }
          }
        }
        // 上下句补足
        if (nextLine) {
          const nextChars = this.extractCharsFromLine(nextLine);
          const cnt2 = {};
          for (const ch of nextChars) cnt2[ch] = (cnt2[ch] || 0) + 1;
          for (const b of nextChars) {
            if (cnt2[b] >= 2) {
              for (const a of chars) candidates.push({ name: a + b + b, line: line + '，' + nextLine, poem, hit });
            }
          }
        }
      } else if (fmt === 'AAB' && L === 3) {
        const cnt = {};
        for (const ch of chars) cnt[ch] = (cnt[ch] || 0) + 1;
        for (const a of chars) {
          if (cnt[a] >= 2) {
            for (const b of chars) {
              if (b !== a) candidates.push({ name: a + a + b, line, poem, hit });
            }
          }
        }
      } else if (fmt === 'ABA' && L === 3) {
        for (const a of chars)
          for (const b of chars)
            if (a !== b) candidates.push({ name: a + b + a, line, poem, hit });
      } else if (fmt === 'ABCD' && L === 4) {
        // 同句中任取4字
        for (let i = 0; i < chars.length; i++)
          for (let j = i + 1; j < chars.length; j++)
            for (let k = j + 1; k < chars.length; k++)
              for (let l = k + 1; l < chars.length; l++)
                candidates.push({ name: chars[i] + chars[j] + chars[k] + chars[l], line, poem, hit });
        // 上下句各取2字
        if (nextLine) {
          const nextChars = this.extractCharsFromLine(nextLine);
          for (let i = 0; i < chars.length; i++)
            for (let j = i + 1; j < chars.length; j++)
              for (let k = 0; k < nextChars.length; k++)
                for (let l = k + 1; l < nextChars.length; l++)
                  candidates.push({
                    name: chars[i] + chars[j] + nextChars[k] + nextChars[l],
                    line: line + '，' + nextLine, poem, hit
                  });
        }
      } else if (fmt === 'AABB' && L === 4) {
        const cnt = {};
        for (const ch of chars) cnt[ch] = (cnt[ch] || 0) + 1;
        const dup = chars.filter(ch => cnt[ch] >= 2);
        if (dup.length >= 2) {
          for (let i = 0; i < dup.length; i++)
            for (let j = i + 1; j < dup.length; j++)
              candidates.push({ name: dup[i] + dup[i] + dup[j] + dup[j], line, poem, hit });
        }
        // 上下句各贡献一个叠字
        if (nextLine) {
          const nextChars = this.extractCharsFromLine(nextLine);
          const cnt2 = {};
          for (const ch of nextChars) cnt2[ch] = (cnt2[ch] || 0) + 1;
          const dup2 = nextChars.filter(ch => cnt2[ch] >= 2);
          for (const a of dup)
            for (const b of dup2)
              if (a !== b) candidates.push({ name: a + a + b + b, line: line + '，' + nextLine, poem, hit });
        }
      } else if (fmt === 'AABC' && L === 4) {
        const cnt = {};
        for (const ch of chars) cnt[ch] = (cnt[ch] || 0) + 1;
        for (const a of chars) {
          if (cnt[a] >= 2) {
            const others = chars.filter(c => c !== a);
            for (let i = 0; i < others.length; i++)
              for (let j = i + 1; j < others.length; j++)
                candidates.push({ name: a + a + others[i] + others[j], line, poem, hit });
          }
        }
      } else if (fmt === 'ABAC' && L === 4) {
        for (const a of chars)
          for (const b of chars)
            for (const c of chars)
              if (a !== b && a !== c && b !== c)
                candidates.push({ name: a + b + a + c, line, poem, hit });
      }

      // 每句最多贡献 3 个高分候选
      candidates.sort((a, b) => {
        const sa = scoreFragment(a.name, this.themeSet) + a.hit * 0.1;
        const sb = scoreFragment(b.name, this.themeSet) + b.hit * 0.1;
        return sb - sa;
      });
      out.push(...candidates.slice(0, 3));
    }
    return out;
  }

  /* ---------- 成语 / 典籍候选 ---------- */
  generateReference() {
    const out = [];
    if (this.source === 'idiom' && typeof IdiomDB !== 'undefined') {
      IdiomDB.ensureInit();
      const all = IdiomDB._all || [];
      for (const idiom of all) {
        if (this.length !== 4 && idiom.length !== this.length) continue;
        if (this.format && !this._matchIdiomFormat(idiom, this.format)) continue;
        const sc = scoreFragment(idiom, this.themeSet);
        if (sc <= 0) continue;
        out.push({ name: idiom, line: '成语', poem: { t: '成语', a: '', d: '' }, hit: 1, score: sc + 2 });
      }
    } else if (this.source && REFERENCE_NAMES[this.source]) {
      const list = REFERENCE_NAMES[this.source];
      for (const item of list) {
        if (this.length && item.name.length !== this.length) continue;
        const sc = scoreFragment(item.name, this.themeSet);
        if (sc <= 0) continue;
        out.push({ name: item.name, line: item.line, poem: { t: item.from, a: '', d: '' }, hit: 1, score: sc + 2 });
      }
    }
    return out;
  }

  _matchIdiomFormat(idiom, fmt) {
    const c = toCharArr(idiom);
    if (fmt === 'AABB') return c[0] === c[1] && c[2] === c[3] && c[0] !== c[2];
    if (fmt === 'AABC') return c[0] === c[1] && c[0] !== c[2] && c[0] !== c[3] && c[2] !== c[3];
    if (fmt === 'ABAC') return c[0] === c[2] && c[0] !== c[1] && c[0] !== c[3] && c[1] !== c[3];
    if (fmt === 'ABCD') return new Set(c).size === 4;
    return true;
  }

  /* ---------- 主生成 ---------- */
  generate(count = 6) {
    let cands = [];
    if (this.source === 'idiom' || REFERENCE_NAMES[this.source]) {
      cands = this.generateReference();
    } else {
      cands = this.generateByFormat();
    }

    // 去重（同名留最高分）
    const byName = new Map();
    for (const c of cands) {
      const key = this.surname ? this.surname + c.name : c.name;
      if (!byName.has(key) || byName.get(key).score < (c.score || 0)) {
        byName.set(key, { ...c, displayName: key });
      }
    }
    let list = Array.from(byName.values());
    list = list.filter(c => !this.used.has(c.displayName));

    // 候选不足则清空历史
    if (list.length < count) {
      this.used.clear();
      list = Array.from(byName.values());
    }

    // 高分 + 随机
    list.sort((a, b) => ((b.score || 0) + Math.random()) - ((a.score || 0) + Math.random()));
    const picked = list.slice(0, count);
    let i = 0;
    while (picked.length < count && list.length > 0) {
      picked.push(list[i % list.length]);
      i++;
    }
    picked.forEach(c => this.used.add(c.displayName));

    return picked.map(c => ({
      name: c.displayName,
      title: c.poem.t,
      author: c.poem.a,
      dynasty: c.poem.d,
      line: c.line
    }));
  }

  /* ---------- 可用出处（带数量） ---------- */
  static getAvailableSources(purpose) {
    const allPoems = (typeof POETRY_DB !== 'undefined') ? POETRY_DB : [];
    const counts = {};
    for (const p of allPoems) {
      const id = sourceOfPoem(p);
      counts[id] = (counts[id] || 0) + 1;
    }
    // 典籍来源固定存在
    counts.idiom = (typeof IdiomDB !== 'undefined' && IdiomDB._all) ? IdiomDB._all.length : 0;
    counts.dragon9 = REFERENCE_NAMES.dragon9.length;
    counts.yijing = REFERENCE_NAMES.yijing.length;
    counts.jiuru = REFERENCE_NAMES.jiuru.length;

    let sources = NAME_SOURCES.filter(s => (counts[s.id] || 0) >= 3);
    if (purpose === 'baby') {
      // 宝宝优先典籍
      const order = ['jiuru', 'dragon9', 'yijing', 'idiom', 'shijing', 'chuci', 'yuefu', 'tangshi', 'songci', 'songshi', 'yuanming'];
      sources.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    }
    return sources;
  }

  static getFormats(len) { return NAME_FORMATS[len] || []; }
}

window.NAME_PURPOSES = NAME_PURPOSES;
window.GAME_TYPES = GAME_TYPES;
window.NAME_STYLES = NAME_STYLES;
window.NAME_SOURCES = NAME_SOURCES;
window.NAME_FORMATS = NAME_FORMATS;
window.REFERENCE_NAMES = REFERENCE_NAMES;
window.NameGenerator = NameGenerator;

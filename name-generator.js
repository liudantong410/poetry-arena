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
  { id: 'baby', name: '给宝宝起名', desc: '加姓氏，优先成语 / 易经 / 君子九如 / 龙生九子 / 诗经' },
  { id: 'couple', name: '情侣网名', desc: '从表达思念爱意的诗句中成对提取' }
];

/* ========== 情侣网名精选对（双向可查） ========== */
const COUPLE_PAIRS = [
  { a: '绵绵', b: '远道', line: '绵绵思远道', from: '汉乐府·饮马长城窟行' },
  { a: '彩凤', b: '灵犀', line: '身无彩凤双飞翼，心有灵犀一点通', from: '唐·李商隐·无题' },
  { a: '金风', b: '玉露', line: '金风玉露一相逢，便胜却人间无数', from: '宋·秦观·鹊桥仙' },
  { a: '朝朝', b: '暮暮', line: '两情若是久长时，又岂在朝朝暮暮', from: '宋·秦观·鹊桥仙' },
  { a: '纤云', b: '飞星', line: '纤云弄巧，飞星传恨', from: '宋·秦观·鹊桥仙' },
  { a: '盈盈', b: '脉脉', line: '盈盈一水间，脉脉不得语', from: '汉·迢迢牵牛星' },
  { a: '牵牛', b: '织女', line: '迢迢牵牛星，皎皎河汉女', from: '汉·迢迢牵牛星' },
  { a: '迢迢', b: '皎皎', line: '迢迢牵牛星，皎皎河汉女', from: '汉·迢迢牵牛星' },
  { a: '南风', b: '西洲', line: '南风知我意，吹梦到西洲', from: '南朝乐府·西洲曲' },
  { a: '如星', b: '如月', line: '愿我如星君如月，夜夜流光相皎洁', from: '宋·范成大·车遥遥篇' },
  { a: '君心', b: '我心', line: '只愿君心似我心，定不负相思意', from: '宋·李之仪·卜算子' },
  { a: '磐石', b: '蒲苇', line: '君当作磐石，妾当作蒲苇', from: '汉乐府·孔雀东南飞' },
  { a: '竹马', b: '青梅', line: '郎骑竹马来，绕床弄青梅', from: '唐·李白·长干行' },
  { a: '比翼', b: '连理', line: '在天愿作比翼鸟，在地愿为连理枝', from: '唐·白居易·长恨歌' },
  { a: '沧海', b: '巫山', line: '曾经沧海难为水，除却巫山不是云', from: '唐·元稹·离思' },
  { a: '锦瑟', b: '华年', line: '锦瑟无端五十弦，一弦一柱思华年', from: '唐·李商隐·锦瑟' },
  { a: '红豆', b: '相思', line: '玲珑骰子安红豆，入骨相思知不知', from: '唐·温庭筠·南歌子词' },
  { a: '双丝', b: '千结', line: '心似双丝网，中有千千结', from: '宋·张先·千秋岁' },
  { a: '星垂', b: '月涌', line: '星垂平野阔，月涌大江流', from: '唐·杜甫·旅夜书怀' },
  { a: '蒹葭', b: '白露', line: '蒹葭苍苍，白露为霜', from: '诗经·秦风·蒹葭' },
  { a: '满月', b: '清辉', line: '思君如满月，夜夜减清辉', from: '唐·张九龄·赋得自君之出矣' },
  { a: '一心', b: '白首', line: '愿得一心人，白头不相离', from: '汉·卓文君·白头吟' },
  { a: '羁鸟', b: '池鱼', line: '羁鸟恋旧林，池鱼思故渊', from: '魏晋·陶渊明·归园田居' },
  { a: '旧林', b: '故渊', line: '羁鸟恋旧林，池鱼思故渊', from: '魏晋·陶渊明·归园田居' },
  { a: '春蚕', b: '蜡炬', line: '春蚕到死丝方尽，蜡炬成灰泪始干', from: '唐·李商隐·无题' },
  { a: '比目', b: '鸳鸯', line: '得成比目何辞死，愿作鸳鸯不羡仙', from: '唐·卢照邻·长安古意' },
  { a: '海内', b: '天涯', line: '海内存知己，天涯若比邻', from: '唐·王勃·送杜少府之任蜀州' },
  { a: '游子', b: '故人', line: '浮云游子意，落日故人情', from: '唐·李白·送友人' },
  { a: '沉舟', b: '病树', line: '沉舟侧畔千帆过，病树前头万木春', from: '唐·刘禹锡·酬乐天扬州初逢席上见赠' },
  /* —— 诗经：对仗双名 —— */
  { a: '天长', b: '地久', line: '天长地久有时尽，此恨绵绵无绝期', from: '唐·白居易·长恨歌' },
  { a: '天涯', b: '地角', line: '天涯地角有穷时，只有相思无尽处', from: '宋·晏殊·玉楼春' },
  { a: '西窗', b: '巴山', line: '何当共剪西窗烛，却话巴山夜雨时', from: '唐·李商隐·夜雨寄北' },
  { a: '红豆', b: '南国', line: '红豆生南国，春来发几枝', from: '唐·王维·相思' },
  { a: '执手', b: '偕老', line: '执子之手，与子偕老', from: '诗经·邶风·击鼓' },
  { a: '琴瑟', b: '静好', line: '琴瑟在御，莫不静好', from: '诗经·郑风·女曰鸡鸣' },
  { a: '子衿', b: '悠悠', line: '青青子衿，悠悠我心', from: '诗经·郑风·子衿' },
  { a: '夭夭', b: '灼灼', line: '桃之夭夭，灼灼其华', from: '诗经·周南·桃夭' },
  { a: '依依', b: '霏霏', line: '昔我往矣，杨柳依依；今我来思，雨雪霏霏', from: '诗经·小雅·采薇' },
  { a: '木桃', b: '琼瑶', line: '投我以木桃，报之以琼瑶', from: '诗经·卫风·木瓜' },
  { a: '雎鸠', b: '河洲', line: '关关雎鸠，在河之洲', from: '诗经·周南·关雎' },
  { a: '淑女', b: '君子', line: '窈窕淑女，君子好逑', from: '诗经·周南·关雎' },
  { a: '伊人', b: '一方', line: '所谓伊人，在水一方', from: '诗经·秦风·蒹葭' },
  { a: '扶苏', b: '荷华', line: '山有扶苏，隰有荷华', from: '诗经·郑风·山有扶苏' },
  { a: '零露', b: '清扬', line: '野有蔓草，零露漙兮；有美一人，清扬婉兮', from: '诗经·郑风·野有蔓草' },
  { a: '鹿鸣', b: '野苹', line: '呦呦鹿鸣，食野之苹', from: '诗经·小雅·鹿鸣' },
  { a: '鼓瑟', b: '吹笙', line: '我有嘉宾，鼓瑟吹笙', from: '诗经·小雅·鹿鸣' },
  { a: '丁丁', b: '嘤嘤', line: '伐木丁丁，鸟鸣嘤嘤', from: '诗经·小雅·伐木' },
  { a: '白驹', b: '空谷', line: '皎皎白驹，在彼空谷', from: '诗经·小雅·白驹' },
  { a: '今夕', b: '良人', line: '今夕何夕，见此良人', from: '诗经·唐风·绸缪' },
  { a: '采萧', b: '三秋', line: '彼采萧兮，一日不见，如三秋兮', from: '诗经·王风·采葛' },
  /* —— 楚辞 / 汉魏六朝 —— */
  { a: '沅芷', b: '澧兰', line: '沅有芷兮澧有兰，思公子兮未敢言', from: '楚辞·九歌·湘夫人' },
  { a: '坠露', b: '落英', line: '朝饮木兰之坠露兮，夕餐秋菊之落英', from: '楚辞·离骚' },
  { a: '芰荷', b: '芙蓉', line: '制芰荷以为衣兮，集芙蓉以为裳', from: '楚辞·离骚' },
  { a: '云衣', b: '霓裳', line: '青云衣兮白霓裳，举长矢兮射天狼', from: '楚辞·九歌·东君' },
  { a: '惊鸿', b: '游龙', line: '翩若惊鸿，婉若游龙', from: '魏晋·曹植·洛神赋' },
  { a: '秋菊', b: '春松', line: '荣曜秋菊，华茂春松', from: '魏晋·曹植·洛神赋' },
  { a: '凌波', b: '罗袜', line: '凌波微步，罗袜生尘', from: '魏晋·曹植·洛神赋' },
  { a: '朝霞', b: '渌波', line: '皎若太阳升朝霞，灼若芙蕖出渌波', from: '魏晋·曹植·洛神赋' },
  { a: '双鲤', b: '尺素', line: '客从远方来，遗我双鲤鱼；呼儿烹鲤鱼，中有尺素书', from: '汉乐府·饮马长城窟行' },
  { a: '胡马', b: '越鸟', line: '胡马依北风，越鸟巢南枝', from: '汉·古诗十九首' },
  { a: '北风', b: '南枝', line: '胡马依北风，越鸟巢南枝', from: '汉·古诗十九首' },
  { a: '冬雷', b: '夏雪', line: '冬雷震震，夏雨雪', from: '汉乐府·上邪' },
  { a: '冰心', b: '玉壶', line: '洛阳亲友如相问，一片冰心在玉壶', from: '唐·王昌龄·芙蓉楼送辛渐' },
  { a: '两小', b: '无猜', line: '同居长干里，两小无嫌猜', from: '唐·李白·长干行' },
  { a: '抱柱', b: '望夫', line: '常存抱柱信，岂上望夫台', from: '唐·李白·长干行' },
  { a: '明月', b: '天涯', line: '海上生明月，天涯共此时', from: '唐·张九龄·望月怀远' },
  { a: '遥夜', b: '相思', line: '情人怨遥夜，竟夕起相思', from: '唐·张九龄·望月怀远' },
  { a: '比肩', b: '连理', line: '愿作远方兽，步步比肩行；愿作深山木，枝枝连理生', from: '唐·白居易·长相思' },
  /* —— 唐宋：对仗双名 —— */
  { a: '锦书', b: '雁字', line: '云中谁寄锦书来，雁字回时，月满西楼', from: '宋·李清照·一剪梅' },
  { a: '眉头', b: '心头', line: '此情无计可消除，才下眉头，却上心头', from: '宋·李清照·一剪梅' },
  { a: '飞花', b: '丝雨', line: '自在飞花轻似梦，无边丝雨细如愁', from: '宋·秦观·浣溪沙' },
  { a: '柔情', b: '佳期', line: '柔情似水，佳期如梦', from: '宋·秦观·鹊桥仙' },
  { a: '楼台', b: '津渡', line: '雾失楼台，月迷津渡', from: '宋·秦观·踏莎行' },
  { a: '驿梅', b: '鱼素', line: '驿寄梅花，鱼传尺素', from: '宋·秦观·踏莎行' },
  { a: '凌波', b: '横塘', line: '凌波不过横塘路', from: '宋·贺铸·青玉案' },
  { a: '烟草', b: '风絮', line: '一川烟草，满城风絮', from: '宋·贺铸·青玉案' },
  { a: '人面', b: '桃花', line: '人面不知何处去，桃花依旧笑春风', from: '唐·崔护·题都城南庄' },
  { a: '落花', b: '微雨', line: '落花人独立，微雨燕双飞', from: '宋·晏几道·临江仙' },
  { a: '明月', b: '彩云', line: '当时明月在，曾照彩云归', from: '宋·晏几道·临江仙' },
  { a: '楼心月', b: '扇底风', line: '舞低杨柳楼心月，歌尽桃花扇底风', from: '宋·晏几道·鹧鸪天' },
  { a: '青鸟', b: '丁香', line: '青鸟不传云外信，丁香空结雨中愁', from: '五代·李璟·摊破浣溪沙' },
  { a: '细雨', b: '小楼', line: '细雨梦回鸡塞远，小楼吹彻玉笙寒', from: '五代·李璟·摊破浣溪沙' },
  { a: '蓬山', b: '青鸟', line: '蓬山此去无多路，青鸟殷勤为探看', from: '唐·李商隐·无题' },
  { a: '云鬓', b: '月光', line: '晓镜但愁云鬓改，夜吟应觉月光寒', from: '唐·李商隐·无题' },
  { a: '蝴蝶', b: '杜鹃', line: '庄生晓梦迷蝴蝶，望帝春心托杜鹃', from: '唐·李商隐·锦瑟' },
  { a: '沧海', b: '蓝田', line: '沧海月明珠有泪，蓝田日暖玉生烟', from: '唐·李商隐·锦瑟' },
  { a: '明珠', b: '暖玉', line: '沧海月明珠有泪，蓝田日暖玉生烟', from: '唐·李商隐·锦瑟' },
  { a: '春花', b: '秋月', line: '春花秋月何时了', from: '五代·李煜·虞美人' },
  { a: '红叶', b: '黄花', line: '红叶黄花秋意晚，千里念行客', from: '宋·晏几道·思远人' },
  { a: '鸿雁', b: '鱼龙', line: '鸿雁长飞光不度，鱼龙潜跃水成文', from: '唐·张若虚·春江花月夜' },
  { a: '春江', b: '海月', line: '春江潮水连海平，海上明月共潮生', from: '唐·张若虚·春江花月夜' },
  { a: '白云', b: '青枫', line: '白云一片去悠悠，青枫浦上不胜愁', from: '唐·张若虚·春江花月夜' },
  { a: '碣石', b: '潇湘', line: '斜月沉沉藏海雾，碣石潇湘无限路', from: '唐·张若虚·春江花月夜' },
  { a: '明月', b: '清泉', line: '明月松间照，清泉石上流', from: '唐·王维·山居秋暝' },
  { a: '新雨', b: '晚秋', line: '空山新雨后，天气晚来秋', from: '唐·王维·山居秋暝' },
  { a: '竹喧', b: '莲动', line: '竹喧归浣女，莲动下渔舟', from: '唐·王维·山居秋暝' },
  { a: '水穷', b: '云起', line: '行到水穷处，坐看云起时', from: '唐·王维·终南别业' },
  { a: '桂花', b: '春山', line: '人闲桂花落，夜静春山空', from: '唐·王维·鸟鸣涧' },
  { a: '山鸟', b: '春涧', line: '月出惊山鸟，时鸣春涧中', from: '唐·王维·鸟鸣涧' },
  { a: '大漠', b: '长河', line: '大漠孤烟直，长河落日圆', from: '唐·王维·使至塞上' },
  { a: '孤烟', b: '落日', line: '大漠孤烟直，长河落日圆', from: '唐·王维·使至塞上' },
  { a: '江流', b: '山色', line: '江流天地外，山色有无中', from: '唐·王维·汉江临泛' },
  { a: '浮云', b: '落日', line: '浮云游子意，落日故人情', from: '唐·李白·送友人' },
  { a: '青山', b: '白水', line: '青山横北郭，白水绕东城', from: '唐·李白·送友人' },
  { a: '平野', b: '大荒', line: '山随平野尽，江入大荒流', from: '唐·李白·渡荆门送别' },
  { a: '天镜', b: '海楼', line: '月下飞天镜，云生结海楼', from: '唐·李白·渡荆门送别' },
  { a: '众鸟', b: '孤云', line: '众鸟高飞尽，孤云独去闲', from: '唐·李白·独坐敬亭山' },
  { a: '飞流', b: '银河', line: '飞流直下三千尺，疑是银河落九天', from: '唐·李白·望庐山瀑布' },
  { a: '早莺', b: '新燕', line: '几处早莺争暖树，谁家新燕啄春泥', from: '唐·白居易·钱塘湖春行' },
  { a: '乱花', b: '浅草', line: '乱花渐欲迷人眼，浅草才能没马蹄', from: '唐·白居易·钱塘湖春行' },
  { a: '黄鹂', b: '白鹭', line: '两个黄鹂鸣翠柳，一行白鹭上青天', from: '唐·杜甫·绝句' },
  { a: '千秋雪', b: '万里船', line: '窗含西岭千秋雪，门泊东吴万里船', from: '唐·杜甫·绝句' },
  { a: '燕子', b: '鸳鸯', line: '泥融飞燕子，沙暖睡鸳鸯', from: '唐·杜甫·绝句二首' },
  { a: '江碧', b: '山青', line: '江碧鸟逾白，山青花欲燃', from: '唐·杜甫·绝句二首' },
  { a: '海日', b: '江春', line: '海日生残夜，江春入旧年', from: '唐·王湾·次北固山下' },
  { a: '野旷', b: '江清', line: '野旷天低树，江清月近人', from: '唐·孟浩然·宿建德江' },
  { a: '千山', b: '万径', line: '千山鸟飞绝，万径人踪灭', from: '唐·柳宗元·江雪' },
  { a: '孤舟', b: '寒江', line: '孤舟蓑笠翁，独钓寒江雪', from: '唐·柳宗元·江雪' },
  { a: '白日', b: '黄河', line: '白日依山尽，黄河入海流', from: '唐·王之涣·登鹳雀楼' },
  { a: '蝉噪', b: '鸟鸣', line: '蝉噪林逾静，鸟鸣山更幽', from: '南朝·王籍·入若耶溪' },
  { a: '余霞', b: '澄江', line: '余霞散成绮，澄江静如练', from: '南朝·谢朓·晚登三山还望京邑' },
  { a: '春草', b: '鸣禽', line: '池塘生春草，园柳变鸣禽', from: '南朝·谢灵运·登池上楼' },
  { a: '细雨', b: '微风', line: '细雨鱼儿出，微风燕子斜', from: '唐·杜甫·水槛遣心' },
  { a: '山月', b: '水风', line: '山月不知心里事，水风空落眼前花', from: '唐·温庭筠·梦江南' },
  { a: '柳梢', b: '黄昏', line: '月上柳梢头，人约黄昏后', from: '宋·欧阳修·生查子' }
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

/* 经典可叠用好字（诗词中常见且语义优美的叠字） */
const REDUP_CHARS = '依霏悠茫萧潺涓袅绵芊茸欣苒菁萋沧泠凛澹澹滟滟绰约婉嫣娉婷窈逸翩跹迢皓皎澄澈煦熹晗曙';
const REDUP_SET = new Set(toCharArr(REDUP_CHARS));

/** 叠字质量判定：必须是意象字 / 经典叠字 / 主题字，避免"寸寸""情情"类生硬组合 */
function isGoodDup(ch, themeSet) {
  return IMAGE_SET.has(ch) || REDUP_SET.has(ch) || (themeSet && themeSet.has(ch));
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

  /* ---------- AABB：同诗内两句各取一个叠字（如"依依霏霏"出自《采薇》） ---------- */
  generateAABB() {
    // 不按主题过滤行（会把"杨柳依依"这类无主题字的叠字句饿死），叠字质量本身已是门槛
    const allPoems = (typeof POETRY_DB !== 'undefined') ? POETRY_DB : [];
    const byPoem = new Map();
    for (const poem of allPoems) {
      if (this.source && sourceOfPoem(poem) !== this.source) continue;
      const entries = [];
      for (const line of (poem.lines || [])) {
        const chars = this.extractCharsFromLine(line);
        const cnt = {};
        for (const ch of chars) cnt[ch] = (cnt[ch] || 0) + 1;
        const dups = [...new Set(chars.filter(ch => cnt[ch] >= 2 && isGoodDup(ch, this.themeSet)))];
        if (dups.length === 0) continue;
        let hit = 0;
        for (const ch of chars) if (this.themeSet.has(ch)) hit++;
        entries.push({ line, dups, hit });
      }
      if (entries.length > 0) byPoem.set(poem, entries);
    }
    const out = [];
    for (const [poem, entries] of byPoem) {
      // 同句双叠字
      for (const e of entries) {
        if (e.dups.length >= 2) {
          for (let i = 0; i < e.dups.length; i++)
            for (let j = i + 1; j < e.dups.length; j++) {
              const name = e.dups[i] + e.dups[i] + e.dups[j] + e.dups[j];
              out.push({ name, line: e.line, poem, hit: e.hit, score: scoreFragment(name, this.themeSet) + e.hit });
            }
        }
      }
      // 同诗跨句各取一个叠字
      for (let i = 0; i < entries.length; i++)
        for (let j = i + 1; j < entries.length; j++)
          for (const a of entries[i].dups)
            for (const b of entries[j].dups) {
              if (a === b) continue;
              const name = a + a + b + b;
              const hit = entries[i].hit + entries[j].hit;
              out.push({
                name,
                line: entries[i].line + '，' + entries[j].line,
                poem, hit, score: scoreFragment(name, this.themeSet) + hit
              });
            }
    }
    return out;
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
        for (const ch of chars) if (cnt[ch] >= 2 && isGoodDup(ch, this.themeSet)) candidates.push({ name: ch + ch, line, poem, hit });
      } else if (fmt === 'ABC' && L === 3) {
        for (let i = 0; i < chars.length; i++)
          for (let j = i + 1; j < chars.length; j++)
            for (let k = j + 1; k < chars.length; k++)
              candidates.push({ name: chars[i] + chars[j] + chars[k], line, poem, hit });
      } else if (fmt === 'ABB' && L === 3) {
        const cnt = {};
        for (const ch of chars) cnt[ch] = (cnt[ch] || 0) + 1;
        for (const b of chars) {
          if (cnt[b] >= 2 && isGoodDup(b, this.themeSet)) {
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
            if (cnt2[b] >= 2 && isGoodDup(b, this.themeSet)) {
              for (const a of chars) candidates.push({ name: a + b + b, line: line + '，' + nextLine, poem, hit });
            }
          }
        }
      } else if (fmt === 'AAB' && L === 3) {
        const cnt = {};
        for (const ch of chars) cnt[ch] = (cnt[ch] || 0) + 1;
        for (const a of chars) {
          if (cnt[a] >= 2 && isGoodDup(a, this.themeSet)) {
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
        const dup = chars.filter(ch => cnt[ch] >= 2 && isGoodDup(ch, this.themeSet));
        if (dup.length >= 2) {
          const uniq = [...new Set(dup)];
          for (let i = 0; i < uniq.length; i++)
            for (let j = i + 1; j < uniq.length; j++) {
              candidates.push({ name: uniq[i] + uniq[i] + uniq[j] + uniq[j], line, poem, hit });
            }
        }
        // 上下句各贡献一个叠字
        if (nextLine) {
          const nextChars = this.extractCharsFromLine(nextLine);
          const cnt2 = {};
          for (const ch of nextChars) cnt2[ch] = (cnt2[ch] || 0) + 1;
          const dup2 = nextChars.filter(ch => cnt2[ch] >= 2 && isGoodDup(ch, this.themeSet));
          for (const a of dup)
            for (const b of dup2)
              if (a !== b) candidates.push({ name: a + a + b + b, line: line + '，' + nextLine, poem, hit });
        }
      } else if (fmt === 'AABC' && L === 4) {
        const cnt = {};
        for (const ch of chars) cnt[ch] = (cnt[ch] || 0) + 1;
        for (const a of chars) {
          if (cnt[a] >= 2 && isGoodDup(a, this.themeSet)) {
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
        // 典籍名字直接给高分，不筛意象字（这些名字本身就很经典）
        out.push({ name: item.name, line: item.line, poem: { t: item.from, a: '', d: '' }, hit: 1, score: 10 + Math.random() });
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
    } else if (this.format === 'AABB') {
      cands = this.generateAABB();
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

  /* ---------- 情侣网名：生成一对（精选对 + 算法成对） ---------- */
  generateCouplePairs(count = 6) {
    const out = [];
    // 1) 精选对
    for (const p of COUPLE_PAIRS) {
      out.push({ nameA: p.a, nameB: p.b, line: p.line, title: p.from, author: '', dynasty: '', score: 20 + Math.random() });
    }
    // 2) 算法成对：同句中两个不重叠的优质片段（不跨诗）
    const allPoems = (typeof POETRY_DB !== 'undefined') ? POETRY_DB : [];
    for (const poem of allPoems) {
      for (const line of (poem.lines || [])) {
        const clean = line.replace(/[，。！？、；：""''（）《》\s]/g, '');
        const chars = toCharArr(clean).filter(isGoodChar);
        if (chars.length < 4 || chars.length > 14) continue;
        // AA + XY 型（如"绵绵思远道"→ 绵绵/远道）
        for (let i = 0; i + 1 < chars.length; i++) {
          if (chars[i] === chars[i + 1] && isGoodDup(chars[i], null)) {
            for (let j = 0; j + 1 < chars.length; j++) {
              if (j >= i - 1 && j <= i + 2) continue; // 不与叠字重叠
              const b = chars[j] + chars[j + 1];
              const sb = scoreFragment(b, null);
              if (sb >= 2.4) out.push({ nameA: chars[i] + chars[i + 1], nameB: b, line, title: poem.t, author: poem.a, dynasty: poem.d, score: sb + 4 });
            }
          }
        }
        // XY + ZW 型（如"金风玉露一相逢"→ 金风/玉露）
        for (let i = 0; i + 1 < chars.length; i++) {
          const a = chars[i] + chars[i + 1];
          const sa = scoreFragment(a, null);
          if (sa < 2.4) continue;
          for (let j = i + 2; j + 1 < chars.length; j++) {
            const b = chars[j] + chars[j + 1];
            const sb = scoreFragment(b, null);
            if (sb < 2.4) continue;
            out.push({ nameA: a, nameB: b, line, title: poem.t, author: poem.a, dynasty: poem.d, score: sa + sb });
          }
        }
      }
    }
    // 去重（无序对）
    const seen = new Set();
    const uniq = [];
    for (const r of out) {
      const key = [r.nameA, r.nameB].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(r);
    }
    uniq.sort((x, y) => ((y.score || 0) + Math.random()) - ((x.score || 0) + Math.random()));
    return uniq.slice(0, count);
  }

  /* ---------- 情侣网名：已有另一半名字，匹配另一半 ---------- */
  matchCoupleName(partner, count = 12) {
    const p = (partner || '').trim();
    if (!p) return [];
    const out = [];
    // 1) 精选对双向匹配
    for (const pair of COUPLE_PAIRS) {
      if (pair.a === p) out.push({ name: pair.b, line: pair.line, title: pair.from, author: '', dynasty: '', score: 20 });
      else if (pair.b === p) out.push({ name: pair.a, line: pair.line, title: pair.from, author: '', dynasty: '', score: 20 });
    }
    // 2) 全诗库：找到含伴侣名的诗句，优先取上下句"同位置对仗"的片段（诗词真正的语义配对）
    const allPoems = (typeof POETRY_DB !== 'undefined') ? POETRY_DB : [];
    const punctRe = /[，。！？、；：""''（）《》\s]/g;
    for (const poem of allPoems) {
      const lines = poem.lines || [];
      for (let i = 0; i < lines.length; i++) {
        const clean = lines[i].replace(punctRe, '');
        const pi = clean.indexOf(p);
        if (pi < 0) continue;
        const pushCand = (name, fromLine, base) => {
          if (!name || name === p) return;
          if (toCharArr(name).some(ch => !isGoodChar(ch))) return;
          const s = scoreFragment(name, null);
          if (s <= -90) return; // 含虚词
          // 非对仗位置的扫描片段必须含意象字，避免"鸟恋旧"类跨词碎片
          if (base < 6 && s < 2) return;
          out.push({ name, line: fromLine, title: poem.t, author: poem.a, dynasty: poem.d, score: base + s });
        };
        // 上下句（对仗句）：同位置最强，其余片段次之
        for (const j of [i - 1, i + 1]) {
          if (j < 0 || j >= lines.length) continue;
          const c2 = lines[j].replace(punctRe, '');
          pushCand(c2.substr(pi, p.length), lines[j], 6); // 对仗位置，如 池鱼↔羁鸟
          for (let len = 2; len <= 3; len++)
            for (let k = 0; k + len <= c2.length; k++)
              pushCand(c2.substr(k, len), lines[j], 2);
          const sc = toCharArr(c2).filter(isGoodChar);
          for (let k = 0; k + 1 < sc.length; k++)
            if (sc[k] === sc[k + 1] && isGoodDup(sc[k], null))
              pushCand(sc[k] + sc[k + 1], lines[j], 3);
        }
        // 同句其余片段（较弱）
        for (const seg of [clean.slice(0, pi), clean.slice(pi + p.length)]) {
          for (let len = 2; len <= 3; len++)
            for (let k = 0; k + len <= seg.length; k++)
              pushCand(seg.substr(k, len), lines[i], 0.5);
          const sc = toCharArr(seg).filter(isGoodChar);
          for (let k = 0; k + 1 < sc.length; k++)
            if (sc[k] === sc[k + 1] && isGoodDup(sc[k], null))
              pushCand(sc[k] + sc[k + 1], lines[i], 1.5);
        }
      }
    }
    // 去重留最高
    const byName = new Map();
    for (const c of out) {
      if (c.name === p) continue;
      if (!byName.has(c.name) || byName.get(c.name).score < c.score) byName.set(c.name, c);
    }
    const list = Array.from(byName.values());
    list.sort((a, b) => ((b.score || 0) + Math.random() * 0.5) - ((a.score || 0) + Math.random() * 0.5));
    return list.slice(0, count);
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

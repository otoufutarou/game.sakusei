export const RACES = [
  { id: "human", name: "人間", multiplier: 1, weight: 51, lifespan: 120 },
  { id: "beastkin", name: "獣人", multiplier: 1, weight: 20, lifespan: 120 },
  { id: "dwarf", name: "ドワーフ", multiplier: 2, weight: 10, lifespan: 240 },
  { id: "demon", name: "魔族", multiplier: 2, weight: 12, lifespan: 240 },
  { id: "elf", name: "エルフ", multiplier: 5, weight: 5, lifespan: 600 },
  { id: "dragon", name: "ドラゴン", multiplier: 10, weight: 1, lifespan: 1200 },
  { id: "vampire", name: "吸血鬼", multiplier: 5, weight: 1, lifespan: 600 },
];

const NATIONS = [
  { id: "kingdom", name: "ルヴェンティル王国", population: 30, native: { human: 75, beastkin: 15, dwarf: 5, demon: 3, elf: 2 }, slaves: true },
  { id: "empire", name: "ヴェルグ帝国", population: 30, native: { human: 65, beastkin: 20, dwarf: 5, demon: 8, elf: 2 }, slaves: true },
  { id: "forest", name: "セレフィア森林国", population: 15, native: { dwarf: 3, demon: 2, elf: 95 }, slaves: false },
  { id: "mountain", name: "グランツ山岳連邦", population: 15, native: { dwarf: 90, demon: 4, elf: 6 }, slaves: false },
  { id: "demon-realm", name: "ザルヴェディア魔族領", population: 10, native: { dwarf: 4, demon: 90, elf: 6 }, slaves: true },
];

const STATUS_OPTIONS = [
  { name: "王族", weight: 0.1 },
  { name: "貴族", weight: 5 },
  { name: "都市平民", weight: 30 },
  { name: "農民・労働者", weight: 45 },
  { name: "奴隷", weight: 15 },
  { name: "無戸籍・流民", weight: 4.9 },
];

const GIVEN_NAMES = {
  human: ["アレン", "ミラ", "ノア", "リナ", "エリオ", "サラ", "ユリウス", "フィア"],
  beastkin: ["レオ", "ナナ", "ガル", "ルゥ", "カイ", "ミーナ", "トア", "リク"],
  dwarf: ["ブラム", "ドーラ", "グラン", "ミーナ", "ボルク", "エッダ", "オルン", "ティナ"],
  demon: ["ゼイン", "リゼ", "ヴァル", "ネラ", "アシュ", "セラ", "ラズ", "メイ"],
  elf: ["エリア", "シル", "リュカ", "フィオ", "セレン", "ルシア", "エルネ", "ティオ"],
  dragon: ["ヴァルガ", "セレネ", "ラグナ", "アウラ", "ゼル", "イグニス"],
  vampire: ["ヴィル", "リリア", "ノクス", "エステル", "レイン", "カミラ"],
};

const GENDERS = ["女性", "男性"];
const HOME_TYPES = ["王都", "地方都市", "農村", "辺境"];
const WORKS = ["家業の手伝い", "農作業", "服飾店の見習い", "職人見習い", "兵士", "商人", "冒険者", "教師"];
const PERSONALITIES = ["穏やか", "好奇心旺盛", "慎重", "負けず嫌い", "思いやり深い", "自由を好む"];
const SURNAMES = ["アステル", "リュネ", "ヴァイス", "カナン", "ベルク", "エルド", "セレス", "ノルン"];
const SITUATIONS = ["平和", "平和", "平和", "不況", "疫病流行", "飢饉", "戦争中"];
const HAIR_COLORS = ["#34271f", "#47312b", "#b58b52", "#8d5947", "#c7c2ae"];
const COAT_COLORS = ["#647d72", "#786984", "#9a6456", "#667995", "#947b4d"];

export const TUNING = Object.freeze({
  routineLogIntervalYears: 0.9,
  decisionMeanYears: 3.2,
  firstDecisionEarliestAge: 13,
  minorIllnessChanceByAge: [
    { until: 12, annualChance: 0.1 },
    { until: 35, annualChance: 0.015 },
    { until: 60, annualChance: 0.04 },
    { until: 120, annualChance: 0.1 },
  ],
  accidentChanceByWork: {
    default: 0.002,
    "家業の手伝い": 0.004,
    "農作業": 0.006,
    "服飾店の見習い": 0.003,
    "職人見習い": 0.006,
    "兵士": 0.025,
    "商人": 0.008,
    "冒険者": 0.055,
    "教師": 0.002,
    "魔術師": 0.006,
  },
  accidentFatality: 0.08,
  illnessFatalityPerYearWhileIll: 0.08,
});

const AGE_DEATH_RATES = [
  { until: 59, rate: 0 },
  { until: 69, rate: 0.001 },
  { until: 79, rate: 0.005 },
  { until: 89, rate: 0.02 },
  { until: 99, rate: 0.05 },
  { until: 109, rate: 0.12 },
  { until: 119, rate: 0.25 },
];

const OCCUPATION_RANKS = [
  { skill: 0, name: "初心者" },
  { skill: 20, name: "見習い" },
  { skill: 40, name: "一人前" },
  { skill: 60, name: "熟練" },
  { skill: 80, name: "達人" },
  { skill: 95, name: "巨匠級" },
];

const defineEvent = (id, category, requirements, text, effect, weight = 1) => ({
  id, category, requirements: { minAge: 0, ...requirements }, text, effect, weight,
});

export const ROUTINE_EVENTS = [
  defineEvent("child-first-book", "幼少期・教育", { minAge: 5, maxAge: 16, oncePerLife: true }, () => "古い絵本を最後まで読み、自分で物語を追えるようになった。", { skill: 1, flag: "learned-to-read" }, 1.2),
  defineEvent("child-school-entry", "幼少期・教育", { minAge: 6, maxAge: 15, oncePerLife: true }, () => "家族に送り出され、読み書きを学ぶための教室へ通い始めた。", { fame: 1, flag: "school-attendance" }),
  defineEvent("child-school-friend", "幼少期・教育", { minAge: 6, maxAge: 17 }, () => "学び舎で隣に座る子と親しくなり、放課後も一緒に過ごすようになった。", { relation: "friend" }),
  defineEvent("child-exam", "幼少期・教育", { minAge: 8, maxAge: 18, requiresFlag: "school-attendance" }, () => "難しい課題を最後まで解き、先生から次の学びを勧められた。", { skill: 2, fame: 1 }),
  defineEvent("child-library", "幼少期・教育", { minAge: 7, maxAge: 19, requiresFlag: "learned-to-read" }, () => "町の書庫で地図や薬草の本を読み、知らない土地への興味が湧いた。", { skill: 2, flag: "library-learner" }),
  defineEvent("child-apprentice-lesson", "幼少期・教育", { minAge: 10, maxAge: 20, occupations: ["まだ幼い子ども", "家業の手伝い"] }, () => "近所の職人が作業を見せてくれ、道具の名前と安全な扱い方を覚えた。", { skill: 2, flag: "craft-curious" }),

  defineEvent("career-first-work", "職業・昇進", { minAge: 13, maxAge: 25, occupations: ["まだ幼い子ども"], oncePerLife: true }, () => "家族の紹介で初めての仕事を得て、見習いとして働き始めた。", { action: "start-work" }),
  defineEvent("career-apprentice-task", "職業・昇進", { minAge: 13, occupations: ["職人見習い", "服飾店の見習い"] }, () => "任された品を期限までに仕上げ、親方から次の工程を教わった。", { skill: 2, gold: 2 }),
  defineEvent("career-harvest", "職業・昇進", { minAge: 13, occupations: ["農作業", "家業の手伝い"] }, () => "豊作の年を迎え、仲間と収穫を終えて賃金と分け前を受け取った。", { gold: 5, skill: 1 }),
  defineEvent("career-mentor", "職業・昇進", { minAge: 18, minimumSkill: 20 }, () => "仕事の経験を買われ、後輩に道具の扱いを教える役目を任された。", { fame: 2, flag: "mentored-worker" }),
  defineEvent("career-promotion", "職業・昇進", { minAge: 18, minimumSkill: 40 }, () => "積み重ねた仕事ぶりが評価され、より大きな責任を伴う役目を得た。", { fame: 3, gold: 4, flag: "promotion-earned" }),
  defineEvent("career-guild-license", "職業・昇進", { minAge: 18, occupations: ["職人見習い", "服飾店の見習い"], minimumSkill: 40 }, () => "組合の技能試験に合格し、独りで仕事を受ける資格を得た。", { skill: 2, fame: 3, flag: "guild-license" }),
  defineEvent("career-new-client", "職業・昇進", { minAge: 18, minimumSkill: 20 }, (life) => `${life.nation.name}の遠方から新しい依頼が届き、仕事の評判が広がった。`, { gold: 6, fame: 1 }),
  defineEvent("career-independent-shop", "職業・昇進", { minAge: 25, occupations: ["職人見習い", "服飾店の見習い"], minimumSkill: 60, minimumGold: 25, oncePerLife: true }, () => "貯金と腕を頼りに小さな工房を借り、自分の看板を掲げた。", { gold: -15, fame: 5, flag: "independent-craftsperson" }),
  defineEvent("career-job-change", "職業・昇進", { minAge: 22, occupations: ["兵士", "冒険者"], oncePerLife: true }, () => "危険の多い任務に区切りをつけ、経験を生かせる別の仕事へ移った。", { action: "career-change", fame: 1 }),
  defineEvent("career-retirement", "職業・昇進", { minAge: 58, minimumSkill: 60, oncePerLife: true }, () => "長年の仕事に一区切りをつけ、後継に道具と顧客を引き継いだ。", { action: "retire", fame: 4 }),

  defineEvent("family-sibling-birth", "家族・人間関係", { minAge: 1, maxAge: 25, oncePerLife: true }, () => "家族に新しい子が生まれ、家の中に小さな泣き声が響いた。", { action: "sibling" }),
  defineEvent("family-parent-illness", "家族・人間関係", { minAge: 8, maxAge: 80 }, () => "親が病に伏せ、家族で看病と家の仕事を分担して支えた。", { relation: "family-support", gold: -2 }),
  defineEvent("family-old-friend", "家族・人間関係", { minAge: 12 }, () => "幼い頃からの友人と久しぶりに会い、互いの近況を語り合った。", { relation: "friend" }),
  defineEvent("family-reconcile", "家族・人間関係", { minAge: 16, requiresFlag: "family-dispute" }, () => "長く続いた家族との行き違いについて話し合い、和解することができた。", { action: "reconcile", fame: 1 }),
  defineEvent("family-inheritance", "家族・人間関係", { minAge: 18, oncePerLife: true }, () => "身内から大切に使っていた道具を譲り受け、家の歴史を聞いた。", { gold: 8, skill: 1, flag: "inherited-tool" }),
  defineEvent("family-care-parent", "家族・人間関係", { minAge: 35, maxAge: 100 }, () => "年老いた親の暮らしを支え、長い年月の恩に少しずつ報いた。", { gold: -3, fame: 2, relation: "family-support" }),
  defineEvent("family-funeral", "家族・人間関係", { minAge: 15, oncePerLife: true }, () => "親しい人との別れを家族や友人と悼み、思い出を分かち合った。", { fame: 1, flag: "remembered-loss" }),
  defineEvent("family-neighbor-help", "家族・人間関係", { minAge: 6 }, (life) => `${life.home}の近所で困っていた人を手伝い、頼れる仲間が増えた。`, { relation: "ally", fame: 1 }),

  defineEvent("love-first-meeting", "恋愛・結婚", { minAge: 16, maxAge: 70, oncePerLife: true }, () => "旅先の市で気の合う相手と出会い、手紙を交わすようになった。", { relation: "romance", flag: "romantic-partner" }),
  defineEvent("love-confession", "恋愛・結婚", { minAge: 18, requiresFlag: "romantic-partner", oncePerLife: true }, () => "互いの気持ちを確かめ合い、これからも会う約束を交わした。", { fame: 1, flag: "committed-relationship" }),
  defineEvent("love-marriage", "恋愛・結婚", { minAge: 18, requiresFlag: "committed-relationship", oncePerLife: true }, () => "大切な人と結婚し、二人で新しい暮らしを始めた。", { action: "marry" }),
  defineEvent("love-first-child", "恋愛・結婚", { minAge: 20, maxAge: 55, requiresFlag: "married", oncePerLife: true }, () => "二人のもとに子が生まれ、新しい家族を迎えた。", { action: "childbirth" }),
  defineEvent("love-family-celebration", "恋愛・結婚", { minAge: 22, requiresFlag: "married" }, () => "家族の節目を祝う小さな集まりを開き、親しい人たちと喜びを分かち合った。", { fame: 1, gold: -2 }),

  defineEvent("wealth-market-profit", "財産・借金", { minAge: 18, minimumGold: 8 }, (life) => `蓄えを生かして${life.nation.name}の市で品を仕入れ、利益を得た。`, { gold: 10, fame: 1 }),
  defineEvent("wealth-bad-harvest", "財産・借金", { minAge: 15, oncePerLife: true }, () => "不作で食料の値が上がり、冬を越すために蓄えを切り崩した。", { gold: -8, flag: "survived-famine" }),
  defineEvent("wealth-loan", "財産・借金", { minAge: 18, maximumGold: 5, oncePerLife: true }, () => "急な出費を賄うため、信頼できる商人から少額を借りた。", { gold: 12, debt: 12, flag: "small-loan" }),
  defineEvent("wealth-repay-debt", "財産・借金", { minAge: 18, minimumGold: 12, requiresFlag: "small-loan", oncePerLife: true }, () => "少しずつ返してきた借金を完済し、帳面から名前を消してもらった。", { gold: -12, debt: -12, action: "clear-loan" }),
  defineEvent("wealth-property", "財産・借金", { minAge: 25, minimumGold: 40, oncePerLife: true }, () => "長年の貯金で小さな家を手に入れ、初めて自分の住所を持った。", { gold: -35, fame: 2, flag: "owns-home" }),

  defineEvent("health-fever", "病気・事故", { minAge: 5, oncePerLife: true }, () => "高熱に倒れたが、家族と町医者の看病で回復した。", { health: "回復中", gold: -2, flag: "survived-fever" }),
  defineEvent("health-work-injury", "病気・事故", { minAge: 13, occupations: ["農作業", "兵士", "冒険者", "職人見習い"] }, () => "仕事中に怪我を負い、しばらく休んでから現場へ戻った。", { health: "療養中", gold: -3, flag: "work-injury" }),
  defineEvent("health-accident-rescue", "病気・事故", { minAge: 10, oncePerLife: true }, () => "移動中の事故から通行人を助け、自分も軽傷を負った。", { health: "回復中", fame: 3, flag: "rescued-traveler" }),
  defineEvent("health-epidemic", "病気・事故", { minAge: 12, oncePerLife: true }, () => "疫病が町に広がるなか、隔離と薬の助けで病を乗り越えた。", { health: "回復中", gold: -4, flag: "survived-epidemic" }),
  defineEvent("health-recovery", "病気・事故", { minAge: 14, healthStates: ["療養中", "回復中"], oncePerLife: true }, () => "十分な休養を取り、体調が戻っていつもの暮らしに復帰した。", { health: "健やか", fame: 1, action: "recover" }),

  defineEvent("magic-first-spark", "魔法・種族固有", { minAge: 6, maxAge: 25, oncePerLife: true }, () => "眠っていた魔力が初めて灯り、指先に小さな光がともった。", { magic: 2, flag: "awakened-magic" }),
  defineEvent("magic-race-training", "魔法・種族固有", { minAge: 12, requiresFlag: "awakened-magic" }, () => "一族に伝わる呼吸法を学び、魔力を安全に操れるようになった。", { magic: 3, skill: 1 }),
  defineEvent("race-beastkin-senses", "魔法・種族固有", { raceIds: ["beastkin"], minAge: 6, oncePerLife: true }, () => "鋭い嗅覚で森道の異変に気づき、旅人を危険から遠ざけた。", { fame: 2, relation: "ally" }),
  defineEvent("race-dwarf-vein", "魔法・種族固有", { raceIds: ["dwarf"], minAge: 18, oncePerLife: true }, () => "山道の岩肌から鉱脈を見つけ、採掘仲間と採掘権を分け合った。", { gold: 12, skill: 2 }),
  defineEvent("race-elf-spirit", "魔法・種族固有", { raceIds: ["elf"], minAge: 13, oncePerLife: true }, () => "森の精霊の光が弱まっていることに気づき、長老と原因を探った。", { magic: 3, fame: 2 }),
  defineEvent("race-demon-control", "魔法・種族固有", { raceIds: ["demon"], minAge: 13, oncePerLife: true }, () => "あふれる魔力で家財を揺らしたが、訓練を重ねて制御を身につけた。", { magic: 4, skill: 1, flag: "controlled-demon-magic" }),
  defineEvent("race-dragon-flight", "魔法・種族固有", { raceIds: ["dragon"], minAge: 6, maxAge: 40, oncePerLife: true }, () => "初めて自分の力だけで飛び、雲の上から広い山並みを見渡した。", { fame: 2, flag: "first-flight" }),
  defineEvent("race-vampire-oath", "魔法・種族固有", { raceIds: ["vampire"], minAge: 18, oncePerLife: true }, () => "夜の眷属を守る誓いを立て、血族の長から一族の印を授かった。", { magic: 2, fame: 2, flag: "vampire-oath" }),

  defineEvent("nation-border-war", "国家・戦争・冒険", { minAge: 18, oncePerLife: true }, (life) => `${life.nation.name}の国境で戦が起き、家族と避難先や物資を確かめた。`, { gold: -5, fame: 1, flag: "lived-through-war" }),
  defineEvent("nation-caravan-escort", "国家・戦争・冒険", { minAge: 16, occupations: ["兵士", "冒険者", "商人"], oncePerLife: true }, () => "危険な街道を行く隊商を護衛し、無事な到着と報酬を得た。", { gold: 10, fame: 3 }),
  defineEvent("nation-council", "国家・戦争・冒険", { nationIds: ["forest"], minAge: 18, oncePerLife: true }, () => "長老会議で森の保護策が決まり、住民の採集と狩りの約束が変わった。", { fame: 2, flag: "forest-covenant" }),
  defineEvent("nation-empire-draft", "国家・戦争・冒険", { nationIds: ["empire"], minAge: 18, occupations: ["兵士", "冒険者", "農作業", "職人見習い"], oncePerLife: true }, () => "帝国の徴兵令が出され、家族や同僚と今後の暮らしを話し合った。", { fame: 1, flag: "empire-draft" }),
  defineEvent("nation-expedition", "国家・戦争・冒険", { minAge: 20, occupations: ["冒険者", "商人", "兵士"], oncePerLife: true }, () => "地図にない遺跡への遠征に加わり、仲間と協力して無事に帰還した。", { gold: 8, fame: 4, flag: "explored-ruins" }),
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const randomItem = (items, random) => items[Math.floor(random() * items.length)];
const rollExponential = (mean, random) => -Math.log(Math.max(Number.EPSILON, 1 - random())) * mean;

export function routineLogMean(life) {
  return TUNING.routineLogIntervalYears;
}

export function isRoutineEventEligible(life, event, age = life.age) {
  const requirements = event.requirements ?? event;
  if (age < (requirements.minAge ?? 0) || age > (requirements.maxAge ?? Infinity)) return false;
  if (requirements.raceIds && !requirements.raceIds.includes(life.race.id)) return false;
  if (requirements.nationIds && !requirements.nationIds.includes(life.nation.id)) return false;
  if (requirements.occupations && !requirements.occupations.includes(life.occupation)) return false;
  if (requirements.minimumGold !== undefined && (life.gold ?? 0) < requirements.minimumGold) return false;
  if (requirements.maximumGold !== undefined && (life.gold ?? 0) > requirements.maximumGold) return false;
  if (requirements.minimumSkill !== undefined && (life.occupationSkill ?? 0) < requirements.minimumSkill) return false;
  if (requirements.requiresFlag && !(life.historyFlags ?? []).includes(requirements.requiresFlag)) return false;
  if (requirements.healthStates && !requirements.healthStates.includes(life.health)) return false;
  const history = life.eventHistory ?? [];
  if (requirements.oncePerLife && history.some((entry) => entry.id === event.id)) return false;
  if ((life.journal ?? []).slice(-20).some((entry) => entry.id === event.id)) return false;
  const lastOccurrence = [...history].reverse().find((entry) => entry.id === event.id);
  if (lastOccurrence && age - lastOccurrence.age < (requirements.cooldownYears ?? 0)) return false;
  return true;
}

function weightedPick(items, getWeight, random) {
  const total = items.reduce((sum, item) => sum + getWeight(item), 0);
  let value = random() * total;
  for (const item of items) {
    value -= getWeight(item);
    if (value < 0) return item;
  }
  return items.at(-1);
}

function pickNation(race, random) {
  const eligible = NATIONS.filter((nation) => (nation.native[race.id] ?? 0) > 0);
  if (eligible.length === 0) return randomItem(NATIONS, random);
  return weightedPick(eligible, (nation) => nation.population * nation.native[race.id], random);
}

function pickStatus(nation, random) {
  const options = STATUS_OPTIONS.filter((status) => status.name !== "奴隷" || nation.slaves);
  return weightedPick(options, (status) => status.weight, random);
}

function birthStory(life) {
  return `あなたは${life.nation.name}の${life.home}に${life.race.name}として生まれた。${life.status.name}の家で、${life.family}暮らしが始まる。`;
}

function createInitialDecisionAge(random) {
  return TUNING.firstDecisionEarliestAge + rollExponential(TUNING.decisionMeanYears, random);
}

export function createLife(random = Math.random) {
  const race = weightedPick(RACES, (item) => item.weight, random);
  const nation = pickNation(race, random);
  const status = pickStatus(nation, random);
  const gender = randomItem(GENDERS, random);
  const home = randomItem(HOME_TYPES, random);
  const firstName = randomItem(GIVEN_NAMES[race.id], random);
  const surname = randomItem(SURNAMES, random);
  const family = randomItem(["慎ましい", "温かな", "裕福な", "質素な", "にぎやかな"], random);
  const homeForStatus = status.name === "王族" || status.name === "貴族" ? "王都" : home;
  const health = "健やか";
  const parents = {
    father: randomItem(["農夫", "兵士", "職人", "商人", "教師", "猟師"], random),
    mother: randomItem(["仕立て屋", "薬師", "農夫", "商人", "教師", "職人"], random),
    gold: Math.floor(status.name === "王族" || status.name === "貴族" ? 80 + random() * 120 : 8 + random() * 35),
    debt: Math.floor(random() * 4),
  };
  const life = {
    name: `${firstName}・${surname}`,
    gender,
    race,
    nation,
    status,
    home: homeForStatus,
    family,
    parents,
    magicPower: randomItem(["弱い", "普通", "強い"], random),
    personality: randomItem(PERSONALITIES, random),
    dexterity: Math.floor(25 + random() * 61),
    appearance: {
      hair: randomItem(HAIR_COLORS, random),
      coat: randomItem(COAT_COLORS, random),
    },
    situation: randomItem(SITUATIONS, random),
    age: 0,
    active: true,
    playing: false,
    started: false,
    speed: 1,
    gold: parents.gold,
    debt: parents.debt,
    magic: 0,
    health,
    fame: 0,
    occupation: "まだ幼い子ども",
    occupationSkill: 0,
    occupationYears: 0,
    occupationRank: "初心者",
    familyCount: 0,
    siblings: 0,
    spouse: null,
    children: [],
    eventCount: 0,
    journal: [],
    eventHistory: [],
    historyFlags: [],
    relationships: [],
    illnessUntil: 0,
    nextLogAt: 0,
    nextDecisionAt: createInitialDecisionAge(random),
    pendingDecision: null,
    deathCause: null,
    deathAge: null,
    maxHumanAge: race.lifespan / race.multiplier,
    randomSeed: random(),
  };
  life.nextLogAt = rollExponential(routineLogMean(life), random);
  appendEvent(life, birthStory(life), "life", "誕生");
  return life;
}

function appendEvent(life, text, kind = "life", label = "人生", id = null) {
  const event = { age: life.age, text, kind, label, id };
  life.journal.push(event);
  life.eventCount += 1;
  if (id) life.eventHistory.push({ id, age: life.age });
  return event;
}

function hasRecentEvent(life, id, cooldownYears) {
  const appearsInRecentJournal = (life.journal ?? []).slice(-20).some((event) => event.id === id);
  return appearsInRecentJournal || (life.eventHistory ?? []).some((event) => event.id === id && life.age - event.age < cooldownYears);
}

export function selectRoutineEvent(life, random = Math.random) {
  const candidates = ROUTINE_EVENTS.filter((event) => isRoutineEventEligible(life, event));
  if (candidates.length === 0) return null;
  const event = weightedPick(candidates, (candidate) => candidate.weight ?? 1, random);
  return {
    id: event.id,
    label: event.category,
    text: typeof event.text === "function" ? event.text(life) : event.text,
    effect: event.effect,
    kind: event.category.includes("国家") || event.category.includes("戦争") ? "world" : "life",
  };
}

function scheduleLog(life, random) {
  life.nextLogAt = life.age + Math.max(0.12, rollExponential(routineLogMean(life), random));
}

function addFlag(life, flag) {
  if (flag && !life.historyFlags.includes(flag)) life.historyFlags.push(flag);
}

function addRelationship(life, type) {
  if (!life.relationships.some((relationship) => relationship.type === type)) {
    life.relationships.push({ type, since: life.age });
  }
}

function applyRoutineEffect(life, event, random) {
  const effect = event.effect ?? {};
  life.gold = Math.max(0, life.gold + (effect.gold ?? 0));
  life.debt = Math.max(0, life.debt + (effect.debt ?? 0));
  life.fame = Math.max(0, life.fame + (effect.fame ?? 0));
  life.occupationSkill = clamp(life.occupationSkill + (effect.skill ?? 0), 0, 100);
  life.magic = clamp((life.magic ?? 0) + (effect.magic ?? 0), 0, 100);
  if (effect.health) {
    life.health = effect.health;
    life.illnessUntil = effect.health === "健やか" ? life.age : life.age + 0.5 + random();
  }
  if (effect.relation) addRelationship(life, effect.relation);
  addFlag(life, effect.flag);

  switch (effect.action) {
    case "start-work":
      changeOccupation(life, pickCareer(life, random));
      life.gold += 4;
      break;
    case "career-change":
      changeOccupation(life, randomItem(["商人", "教師", "職人見習い"], random));
      break;
    case "retire":
      life.retiredOccupation = life.occupation;
      life.occupation = "引退";
      break;
    case "sibling":
      life.siblings += 1;
      life.familyCount += 1;
      break;
    case "marry":
      life.spouse = `${randomItem(GIVEN_NAMES[life.race.id], random)}・${randomItem(SURNAMES, random)}`;
      life.familyCount += 1;
      addRelationship(life, "spouse");
      addFlag(life, "married");
      break;
    case "childbirth": {
      const child = `${randomItem(GIVEN_NAMES[life.race.id], random)}・${randomItem(SURNAMES, random)}`;
      life.children.push(child);
      life.familyCount += 1;
      addFlag(life, `child-${life.children.length}`);
      break;
    }
    case "clear-loan":
      addFlag(life, "loan-repaid");
      break;
    case "reconcile":
      life.historyFlags = life.historyFlags.filter((flag) => flag !== "family-dispute");
      addRelationship(life, "family");
      break;
    case "recover":
      life.health = "健やか";
      break;
    default:
      break;
  }
}

function pickCareer(life, random) {
  const eligible = life.race.id === "dragon"
    ? ["狩りを覚える", "巣の外を探検する", "縄張りを見回る"]
    : WORKS;
  return randomItem(eligible, random);
}

function changeOccupation(life, occupation) {
  if (life.occupation === occupation) return;
  life.occupation = occupation;
  life.occupationSkill = 0;
  life.occupationYears = 0;
  life.occupationRank = OCCUPATION_RANKS[0].name;
}

function advanceOccupation(life, elapsed) {
  if (life.age < 13 || ["まだ幼い子ども", "引退"].includes(life.occupation) || elapsed <= 0) return;
  life.occupationYears += elapsed;
  life.occupationSkill = clamp(life.occupationSkill + elapsed * 1.2, 0, 100);
  const rank = [...OCCUPATION_RANKS].reverse().find((item) => life.occupationSkill >= item.skill);
  if (rank.name === life.occupationRank) return;
  life.occupationRank = rank.name;
  const eventId = `occupation-rank-${life.occupation}-${rank.skill}`;
  appendEvent(life, `${occupationTitle(life)}として${life.occupationRank}の腕前に達し、勤続${Math.floor(life.occupationYears)}年の成果を認められた。`, "life", "仕事の成長", eventId);
}

function occupationTitle(life) {
  if (life.occupation === "職人見習い" || life.occupation === "服飾店の見習い") {
    if (life.occupationSkill >= 95) return "工房主";
    if (life.occupationSkill >= 80) return "親方";
    if (life.occupationSkill >= 60) return "熟練職人";
    if (life.occupationSkill >= 40) return "一人前の職人";
  }
  return life.occupation;
}

const CHOICE_EVENTS = [
  {
    id: "choice-ore-contract", title: "魔鉱石の加工依頼", category: "職業・昇進", weight: 1.3,
    requirements: { minAge: 18, minimumGold: 8, occupations: ["職人見習い", "服飾店の見習い", "一人前の職人", "熟練職人", "親方", "工房主"] },
    copy: "魔鉱石を加工してほしいと依頼が届いた。材料費は8G。腕と器用さを頼りに受けるか、断るか。",
    choices: [{ label: "8Gを払って依頼を受ける", effect: "ore-contract" }, { label: "今回は依頼を断る", effect: "decline-contract" }],
  },
  {
    id: "choice-guild-exam", title: "組合の昇級試験", category: "職業・昇進", weight: 1,
    requirements: { minAge: 18, minimumSkill: 25, occupations: ["職人見習い", "服飾店の見習い"] },
    copy: "組合から技能試験の案内が届いた。受験料を払って資格に挑戦するか、実務経験を積むか。",
    choices: [{ label: "受験料5Gを払い、試験に挑む", effect: "guild-exam" }, { label: "仕事を続けて腕を磨く", effect: "decline-exam" }],
  },
  {
    id: "choice-work-offer", title: "遠方からの仕事の誘い", category: "職業・昇進", weight: 1,
    requirements: { minAge: 20, occupations: ["農作業", "職人見習い", "服飾店の見習い", "兵士", "商人", "冒険者", "教師"] },
    copy: "別の町から、今より条件のよい仕事を紹介された。住み慣れた土地を離れるか、今の勤め先に残るか。",
    choices: [{ label: "新しい職場へ移る", effect: "career" }, { label: "今の仕事を続ける", effect: "steady" }],
  },
  {
    id: "choice-business-loan", title: "商人からの融資", category: "財産・借金", weight: 0.8,
    requirements: { minAge: 18, maximumGold: 18 },
    copy: "商人が仕入れ資金を貸すと申し出た。借金をして商機をつかむか、堅実に働くか。",
    choices: [{ label: "10Gを借りて商いを始める", effect: "borrow-for-trade" }, { label: "借金はせず、今の暮らしを守る", effect: "decline-loan" }],
  },
  {
    id: "choice-household-budget", title: "家計の立て直し", category: "財産・借金", weight: 1,
    requirements: { minAge: 18, maximumGold: 12 },
    copy: "出費がかさんで家計が苦しい。短期の仕事を増やすか、借金を避けて支出を抑えるか。",
    choices: [{ label: "危険な護衛仕事を引き受ける", effect: "risky-contract" }, { label: "買い物を減らして節約する", effect: "save" }],
  },
  {
    id: "choice-romance", title: "大切な人への告白", category: "恋愛・結婚", weight: 0.9,
    requirements: { minAge: 18, requiresFlag: "romantic-partner" },
    copy: "親しくなった相手に気持ちを伝える機会が訪れた。関係を一歩進めるか、今の友情を大切にするか。",
    choices: [{ label: "自分の気持ちを伝える", effect: "commit-romance" }, { label: "焦らず友人として付き合う", effect: "keep-friendship" }],
  },
  {
    id: "choice-family-home", title: "二人の新しい暮らし", category: "家族・人間関係", weight: 0.8,
    requirements: { minAge: 18, requiresFlag: "committed-relationship" },
    copy: "相手と暮らしを共にする話が持ち上がった。結婚して家を構えるか、時期を待つか。",
    choices: [{ label: "結婚して新しい家庭を築く", effect: "marry" }, { label: "もう少し準備を続ける", effect: "wait-to-marry" }],
  },
  {
    id: "choice-medical-care", title: "長引く体調不良", category: "病気・事故", weight: 0.7,
    requirements: { minAge: 16, healthStates: ["療養中", "回復中"] },
    copy: "休んでも体調が戻らない。高価な薬を試すか、仕事を休んで静養を続けるか。",
    choices: [{ label: "薬代6Gを払い、治療を受ける", effect: "medical-treatment" }, { label: "仕事を休み、静養する", effect: "rest" }],
  },
  {
    id: "choice-magic-training", title: "魔法の師との出会い", category: "魔法・種族固有", weight: 0.8,
    requirements: { minAge: 12, requiresFlag: "awakened-magic" },
    copy: "魔法の師が本格的な訓練を勧めている。時間と授業料を使って学ぶか、独学を続けるか。",
    choices: [{ label: "授業料7Gを払い、師に学ぶ", effect: "train-magic" }, { label: "今は独学で練習する", effect: "self-study-magic" }],
  },
  {
    id: "choice-war-service", title: "国境守備隊への招集", category: "国家・戦争・冒険", weight: 0.65,
    requirements: { minAge: 18, nationIds: ["empire", "kingdom"] },
    copy: "国境の緊張が高まり、守備隊から協力を求められた。危険を承知で参加するか、家族と町に残るか。",
    choices: [{ label: "守備隊に加わる", effect: "join-guard" }, { label: "町に残り、家族を支える", effect: "stay-home" }],
  },
  {
    id: "choice-expedition", title: "古代遺跡への遠征", category: "国家・戦争・冒険", weight: 0.75,
    requirements: { minAge: 18, occupations: ["冒険者", "商人", "兵士"] },
    copy: "古代遺跡の調査隊が同行者を探している。危険な遠征へ向かうか、現在の仕事に専念するか。",
    choices: [{ label: "装備代4Gを払い、遠征に参加する", effect: "join-expedition" }, { label: "今回は見送る", effect: "decline-expedition" }],
  },
];

function decisionFor(life, random) {
  const eligibleChoiceEvents = CHOICE_EVENTS.filter((event) => isRoutineEventEligible(life, event));
  if (eligibleChoiceEvents.length > 0 && random() < 0.65) {
    const event = weightedPick(eligibleChoiceEvents, (candidate) => candidate.weight, random);
    return { ...event, id: event.id };
  }
  if (life.race.id === "dragon") {
    const dragonDecisions = [
      {
        title: "巣の外へ",
        copy: "巣の外から新しい匂いがします。どうしますか？",
        choices: [
          { label: "空へ飛び出し、辺りを探る", effect: "explore" },
          { label: "巣の近くで親竜を手伝う", effect: "stay" },
        ],
      },
      {
        title: "縄張りを広げる",
        copy: "近くの山に新しい縄張りを持てそうです。どちらを選びますか？",
        choices: [
          { label: "新しい縄張りを探す", effect: "territory" },
          { label: "今の巣を守る", effect: "hoard" },
        ],
      },
      {
        title: "人影を見つけた",
        copy: "山道を歩く人影が見えました。あなたはどうしますか？",
        choices: [
          { label: "距離を保って様子を見る", effect: "observe" },
          { label: "巣へ戻り、静かに過ごす", effect: "stay" },
        ],
      },
    ];
    return { ...randomItem(dragonDecisions, random), id: `choice-${Math.floor(random() * 1e9)}` };
  }
  const stage = lifeStage(life.age);
  const options = {
    child: {
      title: "家族の手伝い",
      copy: "家の仕事が少し忙しくなりました。あなたは何をして過ごしますか？",
      choices: [
        { label: "できる範囲で手伝う", effect: "help" },
        { label: "外で友人と遊ぶ", effect: "play" },
      ],
    },
    school: {
      title: "これからの学び",
      copy: "読み書きを学ぶ機会がありそうです。家の手伝いも必要ですが、どちらを選びますか？",
      choices: [
        { label: "学びの時間を作る", effect: "study" },
        { label: "家業を手伝う", effect: "work" },
      ],
    },
    youth: {
      title: "進む道",
      copy: "将来について考える時が来ました。興味のある道を選んでみましょう。",
      choices: [
        { label: "仕事の見習いを始める", effect: "apprentice" },
        { label: "学びを続けて備える", effect: "study" },
      ],
    },
    youngAdult: {
      title: "新しい仕事の誘い",
      copy: `知人から仕事の話が届きました。今の暮らしを変える機会かもしれません。`,
      choices: [
        { label: "新しい仕事に挑戦する", effect: "career" },
        { label: "今の仕事を続ける", effect: "steady" },
      ],
    },
    middle: {
      title: "暮らしの選択",
      copy: "少し蓄えができました。これからの暮らしについて考えます。",
      choices: [
        { label: "仕事道具に投資する", effect: "invest" },
        { label: "蓄えを守り、無理をしない", effect: "save" },
      ],
    },
    elder: {
      title: "これからの過ごし方",
      copy: "これまでの人生を振り返り、残された時間をどう過ごすか考えます。",
      choices: [
        { label: "若い人に知恵を伝える", effect: "mentor" },
        { label: "馴染みの場所で穏やかに暮らす", effect: "rest" },
      ],
    },
  };
  return { ...options[stage], id: `choice-${Math.floor(random() * 1e9)}` };
}

export function applyChoice(life, choice, random = Math.random) {
  if (!life.active || !life.pendingDecision) return null;
  const decision = life.pendingDecision;
  const selected = decision.choices.find((item) => item.effect === choice.effect);
  if (!selected) return null;

  let message;
  switch (selected.effect) {
    case "help":
      life.gold += 2;
      message = "家族の手伝いを続け、ささやかなお礼をもらった。";
      break;
    case "explore":
      life.fame += 1;
      message = "巣を離れて飛び、見知らぬ山並みを自分の目で確かめた。";
      break;
    case "stay":
      life.gold += 2;
      message = "巣の近くで過ごし、親竜から生きる知恵を学んだ。";
      break;
    case "territory":
      life.fame += 2;
      message = "新しい山を見回り、自分の縄張りとして守ることにした。";
      break;
    case "hoard":
      life.gold += 5;
      message = "巣に財宝を集め、今ある場所を守ることにした。";
      break;
    case "observe":
      life.fame += 1;
      message = "人影を遠くから観察し、争いを避けて巣へ戻った。";
      break;
    case "play":
      life.fame += 1;
      message = "友人と遊び、近所で顔を覚えてもらった。";
      break;
    case "study":
      life.fame += 1;
      addFlag(life, "continued-education");
      message = "学びを続け、新しい知識を身につけた。";
      break;
    case "work":
      life.gold += 2;
      if (life.occupation !== "まだ幼い子ども") life.occupationSkill = clamp(life.occupationSkill + 2, 0, 100);
      addFlag(life, "helped-family-work");
      message = "家の仕事を手伝い、暮らしを支えた。";
      break;
    case "apprentice":
      changeOccupation(life, pickCareer(life, random));
      message = `${life.occupation}として見習いを始めた。`;
      life.gold += 4;
      break;
    case "career":
      changeOccupation(life, pickCareer(life, random));
      life.gold += 8 + Math.floor(random() * 8);
      life.fame += 1;
      message = `${life.occupation}の仕事を始め、新しい一歩を踏み出した。`;
      break;
    case "steady":
      life.gold += 5;
      message = `${life.occupation}の仕事を続け、少しずつ蓄えを増やした。`;
      break;
    case "invest":
      if (life.gold >= 5) {
        life.gold -= 5;
        life.fame += 2;
        life.occupationSkill = clamp(life.occupationSkill + 5, 0, 100);
        addFlag(life, "invested-in-tools");
        message = "仕事道具を新調した。仕事の幅が広がりそうだ。";
      } else {
        life.gold += 2;
        message = "蓄えが足りず、できる範囲で仕事を続けることにした。";
      }
      break;
    case "save":
      life.gold += 3;
      message = "無理をせず、少しずつ蓄えを守ることにした。";
      break;
    case "mentor":
      life.fame += 2;
      message = "若い人たちに経験を伝え、感謝された。";
      break;
    case "ore-contract": {
      life.gold -= 8;
      const successChance = clamp((life.dexterity + life.occupationSkill) / 160, 0.1, 0.95);
      if (random() < successChance) {
        life.gold += 20;
        life.fame += 5;
        life.occupationSkill = clamp(life.occupationSkill + 3, 0, 100);
        message = "魔鉱石の加工に成功した。報酬20Gを受け取り、職人技能と評判が上がった。";
      } else {
        life.occupationSkill = clamp(life.occupationSkill + 1, 0, 100);
        message = "加工に失敗し材料費を失ったが、難しい鉱石の扱いを学んだ。";
      }
      addFlag(life, "ore-contract-attempted");
      break;
    }
    case "decline-contract":
      message = "魔鉱石の依頼を断り、材料費を使わず普段の仕事を続けた。";
      break;
    case "guild-exam":
      life.gold -= 5;
      if (random() < clamp(life.occupationSkill / 100, 0.15, 0.9)) {
        life.fame += 4;
        life.occupationSkill = clamp(life.occupationSkill + 4, 0, 100);
        message = "組合の技能試験に合格し、資格と仕事仲間からの信頼を得た。";
        addFlag(life, "guild-license");
      } else {
        message = "試験には届かなかった。受験料は失ったが、足りない技術が分かった。";
      }
      break;
    case "decline-exam":
      life.occupationSkill = clamp(life.occupationSkill + 1, 0, 100);
      message = "試験を急がず仕事を続け、実地で経験を積むことにした。";
      break;
    case "borrow-for-trade":
      life.gold += 6;
      life.debt += 10;
      addFlag(life, "small-loan");
      message = "商人から10Gを借りて仕入れに回し、売上の一部を手元に残した。";
      break;
    case "decline-loan":
      addFlag(life, "declined-loan");
      message = "融資を断り、借金をせずにできる範囲の仕事を続けた。";
      break;
    case "risky-contract":
      if (random() < 0.62) {
        life.gold += 12;
        life.fame += 2;
        message = "危険な護衛仕事を無事に終え、報酬と評判を得た。";
      } else {
        life.gold += 2;
        life.health = "療養中";
        life.illnessUntil = life.age + 1;
        message = "護衛中に怪我を負ったが、最低限の報酬を受け取り療養に入った。";
      }
      break;
    case "commit-romance":
      addFlag(life, "committed-relationship");
      life.fame += 1;
      message = "気持ちを伝え、相手も同じ思いだと分かった。二人は将来を約束した。";
      break;
    case "keep-friendship":
      addRelationship(life, "friend");
      message = "告白はせず、相手と変わらない友人関係を続けることにした。";
      break;
    case "marry":
      life.spouse = `${randomItem(GIVEN_NAMES[life.race.id], random)}・${randomItem(SURNAMES, random)}`;
      life.familyCount += 1;
      addFlag(life, "married");
      addRelationship(life, "spouse");
      message = `${life.spouse}と結婚し、二人で新しい家庭を築き始めた。`;
      break;
    case "wait-to-marry":
      life.gold += 1;
      message = "結婚は急がず、暮らしの準備を整えてから改めて考えることにした。";
      break;
    case "medical-treatment":
      life.gold -= 6;
      life.health = "健やか";
      life.illnessUntil = life.age;
      addFlag(life, "received-medical-care");
      message = "薬師の治療を受け、体調が回復して仕事へ戻れるようになった。";
      break;
    case "train-magic":
      life.gold -= 7;
      life.magic = clamp(life.magic + 5, 0, 100);
      life.occupationSkill = clamp(life.occupationSkill + 1, 0, 100);
      addFlag(life, "trained-magic");
      message = "師のもとで魔法を学び、魔力を安全に扱う技術を身につけた。";
      break;
    case "self-study-magic":
      life.magic = clamp(life.magic + 2, 0, 100);
      addFlag(life, "self-studied-magic");
      message = "独学で魔法の練習を続け、少しずつ制御を覚えた。";
      break;
    case "join-guard":
      life.gold += 6;
      life.fame += 3;
      addFlag(life, "served-border-guard");
      message = "国境守備隊に加わり、緊張の続く任務を仲間と果たした。";
      break;
    case "stay-home":
      life.fame += 1;
      addRelationship(life, "family-support");
      message = "町に残り、家族や近所の人たちを支えることにした。";
      break;
    case "join-expedition":
      life.gold -= 4;
      if (random() < clamp(0.45 + life.occupationSkill / 200, 0.45, 0.9)) {
        life.gold += 18;
        life.fame += 4;
        addFlag(life, "explored-ruins");
        message = "遺跡の罠を切り抜け、貴重な品を持ち帰って報酬を得た。";
      } else {
        life.health = "療養中";
        life.illnessUntil = life.age + 1;
        message = "遺跡で負傷して撤退した。治療のためにしばらく仕事を休むことになった。";
      }
      break;
    case "decline-expedition":
      message = "遺跡への遠征を見送り、今の仕事と暮らしを大切にすることにした。";
      break;
    case "rest":
      life.health = "健やか";
      life.illnessUntil = life.age;
      life.fame += 1;
      message = "仕事を休んで静養し、体調を取り戻した。";
      break;
    default:
      message = "穏やかな日々を大切にすることにした。";
  }
  life.gold = Math.max(0, life.gold);
  life.pendingDecision = null;
  life.playing = true;
  appendEvent(life, message, "life", "選択");
  life.nextDecisionAt = life.age + rollExponential(TUNING.decisionMeanYears, random);
  scheduleLog(life, random);
  return message;
}

function annualRateForAge(age, rates) {
  return rates.find((item) => age <= item.until)?.rate ?? 0;
}

function annualIllnessRate(age) {
  return annualRateForAge(age, TUNING.minorIllnessChanceByAge);
}

function deathRate(age) {
  return annualRateForAge(age, AGE_DEATH_RATES);
}

function die(life, cause) {
  life.active = false;
  life.playing = false;
  life.pendingDecision = null;
  life.deathCause = cause;
  life.deathAge = life.age;
  appendEvent(life, `人生の幕が下りた。死因は${cause}だった。`, "death", "最期");
}

function resolveHazards(life, elapsed, random) {
  const age = life.age;
  if (age >= life.maxHumanAge) {
    life.age = life.maxHumanAge;
    die(life, "老衰");
    return;
  }

  // Ordinary death checks follow the provisional order: old age, accident, then illness.
  if (random() < deathRate(age) * elapsed) {
    die(life, "老衰");
    return;
  }

  const accidentRate = TUNING.accidentChanceByWork[life.occupation] ?? TUNING.accidentChanceByWork.default;
  if (!hasRecentEvent(life, "hazard-accident", 8) && random() < accidentRate * elapsed) {
    if (random() < TUNING.accidentFatality) {
      die(life, "事故");
      return;
    }
    life.health = random() < 0.35 ? "療養中" : life.health;
    appendEvent(life, "仕事や移動の途中で事故に遭ったが、命に別状はなかった。", "world", "事故", "hazard-accident");
  }

  if (life.age < life.illnessUntil && random() < TUNING.illnessFatalityPerYearWhileIll * elapsed) {
    die(life, "病気");
    return;
  }

  if (life.age >= life.illnessUntil && !hasRecentEvent(life, "hazard-illness", 10) && random() < annualIllnessRate(age) * elapsed) {
    life.illnessUntil = life.age + 0.2 + random() * 1.1;
    life.health = "体調不良";
    appendEvent(life, "しばらく体調を崩した。休養を取り、家族がそばで看病してくれた。", "world", "病気", "hazard-illness");
  } else if (life.health !== "健やか" && life.age >= life.illnessUntil) {
    life.health = "健やか";
    appendEvent(life, "休養が実り、体調が戻った。", "life", "回復");
  }
}

export function advanceLife(life, humanYears, random = Math.random) {
  if (!life.active || !life.playing || life.pendingDecision || humanYears <= 0) return [];
  let remaining = Math.min(humanYears, 0.25);
  const newEvents = [];

  while (remaining > 0 && life.active && !life.pendingDecision) {
    const nextScheduled = Math.min(life.nextLogAt, life.nextDecisionAt, life.maxHumanAge);
    const elapsed = Math.max(0, Math.min(remaining, nextScheduled - life.age));
    if (elapsed > 0) {
      life.age += elapsed;
      remaining -= elapsed;
      advanceOccupation(life, elapsed);
      resolveHazards(life, elapsed, random);
      if (!life.active) break;
    }

    if (life.age >= life.maxHumanAge) {
      life.age = life.maxHumanAge;
      die(life, "老衰");
      break;
    }
    if (life.age >= life.nextDecisionAt) {
      life.pendingDecision = decisionFor(life, random);
      life.playing = false;
      appendEvent(life, `${life.pendingDecision.title} — ${life.pendingDecision.copy}`, "decision", "決断", life.pendingDecision.id);
      break;
    }
    if (life.age >= life.nextLogAt) {
      const event = selectRoutineEvent(life, random);
      if (event) {
        applyRoutineEffect(life, event, random);
        newEvents.push(appendEvent(life, event.text, event.kind, event.label, event.id));
      }
      scheduleLog(life, random);
      continue;
    }
    if (elapsed === 0) break;
  }
  return newEvents;
}

export function beginDecision(life) {
  if (!life.pendingDecision) return null;
  return life.pendingDecision;
}

export function chooseDecision(life, effect, random = Math.random) {
  return applyChoice(life, { effect }, random);
}

export function actualAge(life) {
  return Math.floor(life.age * life.race.multiplier);
}

export function startNewLife(random = Math.random) {
  return createLife(random);
}

import {
  STAT_KEYS, TALENT_TABLE, currentStats, magicTier, rollAdultBaseline, rollMana, rollTalent, skillName,
} from "./stats.js";

export const RACES = [
  { id: "human", name: "人間", multiplier: 1, weight: 51, lifespan: 120 },
  { id: "beastkin", name: "獣人", multiplier: 1, weight: 20, lifespan: 120 },
  { id: "dwarf", name: "ドワーフ", multiplier: 2, weight: 10, lifespan: 240 },
  { id: "demon", name: "魔族", multiplier: 2, weight: 12, lifespan: 240 },
  { id: "elf", name: "エルフ", multiplier: 5, weight: 5, lifespan: 600 },
  { id: "dragon", name: "ドラゴン", multiplier: 10, weight: 1, lifespan: 1200 },
  { id: "vampire", name: "吸血鬼", multiplier: 5, weight: 1, lifespan: 600 },
];

export const NATIONS = [
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
const SITUATIONS = ["平和", "平和", "平和", "平和", "不況", "疫病流行", "飢饉", "戦争中", "魔物の襲撃"];
const DISEASE_TYPES = [
  { id: "infection", name: "軽い感染症", weight: 50 },
  { id: "pneumonia", name: "肺炎", weight: 15 },
  { id: "tuberculosis", name: "結核", weight: 10 },
  { id: "fracture", name: "骨折", weight: 10 },
  { id: "severeInjury", name: "重い外傷", weight: 10 },
  { id: "advancedCancer", name: "進行がん", weight: 5 },
];
const HAIR_COLORS = ["#34271f", "#47312b", "#b58b52", "#8d5947", "#c7c2ae"];
const COAT_COLORS = ["#647d72", "#786984", "#9a6456", "#667995", "#947b4d"];

export const TUNING = Object.freeze({
  currency: { silverPerLegacyG: 30 },
  homePricesLegacyG: { small: 120, large: 400, estate: 50000 / 30 },
  homeResaleRange: [0.7, 0.9],
  homeRentLegacyG: 0.5,
  scholarshipThresholds: { magic: 60, knight: 70, scholar: 70 },
  scholarshipLivingCostLegacyG: 12,
  scholarshipRepaymentRate: 0.1,
  business: {
    small: { cost: 8, chance: 0.6, revenue: 0.5 },
    medium: { cost: 20, chance: 0.45, revenue: 1.2 },
    large: { cost: 40, chance: 0.3, revenue: 2.5 },
    maximumExpansions: 3,
    skillAdjustmentMax: 0.1,
    minimumChance: 0.2,
    maximumChance: 0.7,
    lossOnFailure: { small: 1, medium: 0.65, large: 0.4 },
  },
  sequelaRecovery: { cost: 40, chance: 0.35 },
  routineLogIntervalYears: 3.4,
  decisionMeanYears: 2.5,
  firstDecisionEarliestAge: 6,
  firstDecisionMeanYears: 1.2,
  firstDecisionLatestAge: 10.5,
  socialMeanYears: 2.6,
  retirementHumanAge: 65,
  promotionSuccessChance: 0.25,
  jobAcceptanceRates: [0.95, 0.8, 0.6, 0.25, 0.05],
  promotionRetryYears: 3,
  ordinaryDebtLimit: 100,
  childDecisionMaxHumanAge: 45,
  childRetryYears: [2, 3],
  annualConceptionChanceByAge: [
    { until: 29, chance: 0.3 },
    { until: 34, chance: 0.22 },
    { until: 39, chance: 0.14 },
    { until: 45, chance: 0.06 },
  ],
  childRaceInheritance: "mother",
  treatmentSuccess: {
    infection: { ordinary: 0.75, magic: 0.95 },
    pneumonia: { ordinary: 0.45, magic: 0.8 },
    tuberculosis: { ordinary: 0.15, magic: 0.65 },
    fracture: { ordinary: 0.65, magic: 0.9 },
    severeInjury: { ordinary: 0.2, magic: 0.65 },
    advancedCancer: { ordinary: 0.02, magic: 0.2 },
  },
  illnessSeverityWeights: [
    { name: "軽症", weight: 60, duration: 0.15 },
    { name: "中等症", weight: 27, duration: 0.4 },
    { name: "重症", weight: 10, duration: 0.8 },
    { name: "危篤", weight: 3, duration: 1 },
  ],
  naturalRecoveryChance: { 軽症: 0.9, 中等症: 0.65, 重症: 0.35, 危篤: 0.15 },
  sequelaRates: { 軽症: 0, 中等症: 0.03, 重症: 0.15, 危篤: 0.35 },
  treatmentCosts: {
    ordinary: { 中等症: 8, 重症: 15, 危篤: 25 },
    magic: { 中等症: 25, 重症: 45, 危篤: 75 },
  },
  minorIllnessChanceByAge: [
    { until: 17, annualChance: 0.04 },
    { until: 49, annualChance: 0.03 },
    { until: 64, annualChance: 0.05 },
    { until: 74, annualChance: 0.08 },
    { until: 84, annualChance: 0.1 },
    { until: 120, annualChance: 0.12 },
  ],
  accidentChanceByWork: {
    default: 0.002,
    "家業の手伝い": 0.004,
    "農作業": 0.006,
    "服飾店の見習い": 0.003,
    "職人見習い": 0.006,
    "鍛冶職人": 0.006,
    "魔術師の弟子": 0.003,
    "剣術の弟子": 0.01,
    "騎士": 0.02,
    "兵士": 0.025,
    "商人": 0.008,
    "冒険者": 0.055,
    "教師": 0.002,
    "魔術師": 0.006,
  },
  accidentFatality: 0.08,
  illnessFatalityPerYearWhileIll: 0.03,
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
  { skill: 100, name: "巨匠級" },
];

const TALENT_FACTORS = Object.freeze({
  苦手: 0.65,
  "やや苦手": 0.85,
  普通: 1,
  得意: 1.25,
  天才: 1.6,
  規格外: 2,
});

const RACE_SKILL_FACTORS = Object.freeze({
  beastkin: { combat: 1.2, hunting: 1.2 },
  dwarf: { smithing: 1.25, finework: 1.25 },
  demon: { magic: 1.2, curse: 1.2 },
  elf: { magic: 1.2, archery: 1.2 },
  dragon: { flight: 1.25, dragon: 1.25 },
  vampire: { stealth: 1.2, charm: 1.2 },
});

const RACE_AGE_MULTIPLIERS = Object.freeze({
  human: 1,
  beastkin: 1,
  demon: 2,
  dwarf: 2,
  elf: 5,
  vampire: 5,
  dragon: 10,
});

const OCCUPATION_SKILLS = Object.freeze({
  "まだ幼い子ども": "general",
  "家業の手伝い": "manual",
  "農作業": "farming",
  "服飾店の見習い": "tailoring",
  "職人見習い": "craft",
  "鍛冶職人": "smithing",
  "兵士": "combat",
  "商人": "trade",
  "冒険者": "adventuring",
  "教師": "teaching",
  "魔術師": "magic",
  "魔術師の弟子": "magic",
  "魔術学院生": "magic",
  "剣術の弟子": "swordsmanship",
  "騎士学院生": "swordsmanship",
  "学術院生": "scholarship",
  "騎士": "swordsmanship",
  "学者": "scholarship",
  "失業中": "general",
  "工房主": "craft",
  "引退": "general",
  "狩りを覚える": "hunting",
  "巣の外を探検する": "flight",
  "縄張りを見回る": "dragon",
});

export const SKILL_IDS_LIST = [...new Set([
  ...Object.values(OCCUPATION_SKILLS),
  "magic", "curse", "smithing", "finework", "hunting", "archery",
  "flight", "dragon", "stealth", "charm", "literacy", "swordsmanship", "scholarship",
])];

const SKILL_GROWTH_BASE = 3.5;
const SKILL_MONTH = 1 / 12;

const defineEvent = (id, category, requirements, text, effect, weight = 1) => ({
  id, category, requirements: { minAge: 0, ...requirements }, text, effect, weight,
});

export const ROUTINE_EVENTS = [
  defineEvent("child-first-book", "幼少期・教育", { minAge: 5, maxAge: 16, oncePerLife: true }, () => "古い絵本を最後まで読み、自分で物語を追えるようになった。", { skill: 1, flag: "learned-to-read" }, 1.2),
  defineEvent("child-playmates", "幼少期・教育", { minAge: 4, maxAge: 12 }, () => "近所の子どもたちと遊び回り、仲間うちで頼られる役を任された。", { fame: 1, relation: "friend" }),
  defineEvent("child-school-friend", "幼少期・教育", { minAge: 6, maxAge: 17 }, () => "学び舎で隣に座る子と親しくなり、放課後も一緒に過ごすようになった。", { relation: "friend" }),
  defineEvent("child-exam", "幼少期・教育", { minAge: 8, maxAge: 18, requiresFlag: "school-attendance", occupations: ["まだ幼い子ども"] }, () => "難しい課題を最後まで解き、先生から次の学びを勧められた。", { skill: 2, fame: 1 }),
  defineEvent("child-library", "幼少期・教育", { minAge: 7, maxAge: 19, requiresFlag: "learned-to-read" }, () => "町の書庫で地図や薬草の本を読み、知らない土地への興味が湧いた。", { skill: 2, flag: "library-learner" }),
  defineEvent("child-apprentice-lesson", "幼少期・教育", { minAge: 10, maxAge: 20, occupations: ["まだ幼い子ども", "家業の手伝い"], oncePerLife: true }, () => "近所の職人が作業を見せてくれ、道具の名前と安全な扱い方を覚えた。", { skill: 2, flag: "craft-curious" }),

  defineEvent("career-first-work", "職業・昇進", { minAge: 13, maxAge: 25, occupations: ["まだ幼い子ども"], oncePerLife: true }, () => "家族の紹介で初めての仕事を得て、見習いとして働き始めた。", { action: "start-work" }),
  defineEvent("career-apprentice-task", "職業・昇進", { minAge: 13, occupations: ["職人見習い", "服飾店の見習い", "鍛冶職人"] }, () => "任された品を期限までに仕上げ、親方から次の工程を教わった。", { skill: 2, gold: 2 }),
  defineEvent("career-harvest", "職業・昇進", { minAge: 13, occupations: ["農作業", "家業の手伝い"] }, () => "豊作の年を迎え、仲間と収穫を終えて賃金と分け前を受け取った。", { gold: 5, skill: 1 }),
  defineEvent("career-mentor", "職業・昇進", { minAge: 18, minimumSkill: 20 }, () => "仕事の経験を買われ、後輩に道具の扱いを教える役目を任された。", { fame: 2, flag: "mentored-worker" }),
  defineEvent("career-promotion", "職業・昇進", { minAge: 18, minimumSkill: 40 }, () => "積み重ねた仕事ぶりが評価され、より大きな責任を伴う役目を得た。", { fame: 3, gold: 4, flag: "promotion-earned" }),
  defineEvent("career-guild-license", "職業・昇進", { minAge: 18, occupations: ["職人見習い", "服飾店の見習い", "鍛冶職人"], minimumSkill: 40 }, () => "組合の技能試験に合格し、独りで仕事を受ける資格を得た。", { skill: 2, fame: 3, flag: "guild-license" }),
  defineEvent("career-new-client", "職業・昇進", { minAge: 18, minimumSkill: 20 }, (life) => `${life.nation.name}の遠方から新しい依頼が届き、仕事の評判が広がった。`, { gold: 6, fame: 1 }),
  defineEvent("career-independent-shop", "職業・昇進", { minAge: 25, occupations: ["職人見習い", "服飾店の見習い", "鍛冶職人"], minimumSkill: 60, minimumGold: 25, oncePerLife: true }, () => "貯金と腕を頼りに小さな工房を借り、自分の看板を掲げた。", { gold: -15, fame: 5, flag: "independent-craftsperson", action: "open-workshop" }),
  defineEvent("career-job-change", "職業・昇進", { minAge: 22, occupations: ["兵士", "冒険者"], oncePerLife: true }, () => "危険の多い任務に区切りをつけ、経験を生かせる別の仕事へ移った。", { action: "career-change", fame: 1 }),
  defineEvent("career-retirement", "職業・昇進", { minAge: 65, minimumSkill: 60, oncePerLife: true }, () => "長年の仕事に一区切りをつけるか、続けるかを考える時期になった。", { flag: "retirement-reminder" }),

  defineEvent("family-sibling-birth", "家族・人間関係", { minAge: 1, maxAge: 25, oncePerLife: true }, () => "家族に新しい子が生まれ、家の中に小さな泣き声が響いた。", { action: "sibling" }),
  defineEvent("family-parent-illness", "家族・人間関係", { minAge: 8, maxAge: 80, custom: (life) => !life.npcs || life.npcs.length === 0 || livingParents(life).length > 0 }, () => "親が病に伏せ、家族で看病と家の仕事を分担して支えた。", { relation: "family-support", gold: -2 }),
  defineEvent("family-old-friend", "家族・人間関係", { minAge: 12 }, () => "幼い頃からの友人と久しぶりに会い、互いの近況を語り合った。", { relation: "friend" }),
  defineEvent("family-reconcile", "家族・人間関係", { minAge: 16, requiresFlag: "family-dispute" }, () => "長く続いた家族との行き違いについて話し合い、和解することができた。", { action: "reconcile", fame: 1 }),
  defineEvent("family-inheritance", "家族・人間関係", { minAge: 18, oncePerLife: true }, () => "身内から大切に使っていた道具を譲り受け、家の歴史を聞いた。", { skill: 1, flag: "inherited-tool" }),
  defineEvent("family-care-parent", "家族・人間関係", { minAge: 35, maxAge: 100, custom: (life) => !life.npcs || life.npcs.length === 0 || livingParents(life).length > 0 }, () => "年老いた親の暮らしを支え、長い年月の恩に少しずつ報いた。", { gold: -3, fame: 2, relation: "family-support" }),
  defineEvent("family-funeral", "家族・人間関係", { minAge: 15, oncePerLife: true }, () => "親しい人との別れを家族や友人と悼み、思い出を分かち合った。", { fame: 1, flag: "remembered-loss" }),
  defineEvent("family-neighbor-help", "家族・人間関係", { minAge: 6 }, (life) => `${life.home}の近所で困っていた人を手伝い、頼れる仲間が増えた。`, { relation: "ally", fame: 1 }),

  defineEvent("love-market-social", "恋愛・結婚", { minAge: 18, maxAge: 70, requiresNotFlag: "married", cooldownYears: 1 }, () => "市の賑わいの中で、人との出会いと再会があった。", { action: "social" }, 1.3),
  defineEvent("love-evening-social", "恋愛・結婚", { minAge: 18, maxAge: 60, cooldownYears: 1 }, () => "仕事のあとの集まりで、人付き合いが広がった。", { action: "social" }, 1),
  defineEvent("love-affection", "恋愛・結婚", { minAge: 18, requiresFlag: "married", cooldownYears: 2 }, (life) => `${life.spouse ?? "配偶者"}と静かな時間を過ごし、互いへの信頼を深めた。`, { action: "harmony-up", flag: "marital-calm" }, 1.2),
  defineEvent("love-quarrel", "恋愛・結婚", { minAge: 18, requiresFlag: "married", cooldownYears: 2 }, (life) => `${life.spouse ?? "配偶者"}と些細なことで言い争い、気まずい日が続いた。`, { action: "harmony-down", flag: "marital-strain" }, 0.9),
  defineEvent("love-family-celebration", "恋愛・結婚", { minAge: 22, requiresFlag: "married" }, () => "家族の節目を祝う小さな集まりを開き、親しい人たちと喜びを分かち合った。", { fame: 1, gold: -2 }),

  defineEvent("wealth-market-profit", "財産・借金", { minAge: 18, minimumGold: 8 }, (life) => `蓄えを生かして${life.nation.name}の市で品を仕入れ、利益を得た。`, { gold: 10, fame: 1 }),
  defineEvent("wealth-bad-harvest", "財産・借金", { minAge: 15, oncePerLife: true }, () => "不作で食料の値が上がり、冬を越すために蓄えを切り崩した。", { gold: -8, flag: "survived-famine" }),
  defineEvent("wealth-loan", "財産・借金", { minAge: 18, maximumGold: 5, oncePerLife: true }, () => "商人から少額融資の申し出があったが、借入は本人が選ぶことにした。", { flag: "loan-offer" }),
  defineEvent("wealth-repay-debt", "財産・借金", { minAge: 18, minimumGold: 12, requiresFlag: "small-loan", oncePerLife: true }, () => "少しずつ返してきた借金を完済し、帳面から名前を消してもらった。", { gold: -12, debt: -12, action: "clear-loan" }),
  defineEvent("wealth-property", "財産・借金", { minAge: 25, minimumGold: 40, oncePerLife: true }, () => "長年の貯金で小さな家を手に入れ、初めて自分の住所を持った。", { gold: -35, fame: 2, flag: "owns-home", action: "buy-home" }),

  defineEvent("health-fever", "病気・事故", { minAge: 5, oncePerLife: true }, () => "高熱に倒れたが、家族と町医者の看病で回復した。", { health: "回復中", gold: -2, flag: "survived-fever" }),
  defineEvent("health-work-injury", "病気・事故", { minAge: 13, occupations: ["農作業", "兵士", "冒険者", "職人見習い", "鍛冶職人"] }, () => "仕事中に怪我を負い、しばらく休んでから現場へ戻った。", { health: "療養中", gold: -3, flag: "work-injury" }),
  defineEvent("health-accident-rescue", "病気・事故", { minAge: 10, oncePerLife: true }, () => "移動中の事故から通行人を助け、自分も軽傷を負った。", { health: "回復中", fame: 3, flag: "rescued-traveler" }),
  defineEvent("health-epidemic", "病気・事故", { minAge: 12, oncePerLife: true }, () => "疫病が町に広がるなか、隔離と薬の助けで病を乗り越えた。", { health: "回復中", gold: -4, flag: "survived-epidemic" }),
  defineEvent("health-recovery", "病気・事故", { minAge: 14, healthStates: ["療養中", "回復中"], oncePerLife: true }, () => "十分な休養を取り、体調が戻っていつもの暮らしに復帰した。", { health: "健やか", fame: 1, action: "recover" }),

  defineEvent("magic-first-spark", "魔法・種族固有", { minAge: 6, maxAge: 25, oncePerLife: true, custom: (life) => life.mana === undefined || life.mana >= 1 }, () => "眠っていた魔力が初めて灯り、指先に小さな光がともった。", { magic: 2, flag: "awakened-magic" }),
  defineEvent("magic-race-training", "魔法・種族固有", { minAge: 12, requiresFlag: "awakened-magic", custom: (life) => life.mana === undefined || life.mana >= 1 }, () => "一族に伝わる呼吸法を学び、魔力を安全に操れるようになった。", { magic: 3, skill: 1 }),
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
  if (!event) return false;
  const requirements = event.requirements ?? event;
  if (age < (requirements.minAge ?? 0) || age > (requirements.maxAge ?? Infinity)) return false;
  if (requirements.raceIds && !requirements.raceIds.includes(life.race.id)) return false;
  if (requirements.excludeRaceIds?.includes(life.race.id)) return false;
  if (requirements.custom && !requirements.custom(life)) return false;
  if (requirements.nationIds && !requirements.nationIds.includes(life.nation.id)) return false;
  if (requirements.occupations && !requirements.occupations.includes(life.occupation)) return false;
  if (requirements.minimumGold !== undefined && (life.gold ?? 0) < requirements.minimumGold) return false;
  if (requirements.maximumGold !== undefined && (life.gold ?? 0) > requirements.maximumGold) return false;
  if (requirements.minimumSkill !== undefined && (life.occupationSkill ?? 0) < requirements.minimumSkill) return false;
  if (requirements.requiresFlag && !(life.historyFlags ?? []).includes(requirements.requiresFlag)) return false;
  if (requirements.requiresNotFlag && (life.historyFlags ?? []).includes(requirements.requiresNotFlag)) return false;
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
  return `あなたは${life.nation.name}の${life.home}に${life.race.name}として生まれた。${life.status?.name}の家で、${life.family}暮らしが始まる。`;
}

function createInitialDecisionAge(random) {
  return Math.min(
    TUNING.firstDecisionLatestAge,
    TUNING.firstDecisionEarliestAge + rollExponential(TUNING.firstDecisionMeanYears, random),
  );
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
  const baseStats = rollAdultBaseline(race.id, random);
  const mana = rollMana(race.id, random);
  const situation = randomItem(SITUATIONS, random);
  const life = {
    saveVersion: SAVE_VERSION,
    name: `${firstName}・${surname}`,
    gender,
    race,
    nation,
    status,
    peerageTitle: status.name === "貴族" ? "貴族家" : null,
    home: homeForStatus,
    family,
    parents,
    baseStats,
    mana,
    magicPower: magicTier(mana),
    personality: randomItem(PERSONALITIES, random),
    dexterity: Math.round(baseStats.dexterity),
    appearance: {
      hair: randomItem(HAIR_COLORS, random),
      coat: randomItem(COAT_COLORS, random),
    },
    situation,
    world: { situation, since: 0, nextChangeAt: rollExponential(5, random) + 3 },
    age: 0,
    active: true,
    playing: false,
    started: false,
    speed: 1,
    gold: 0,
    debt: 0,
    currencySchema: "legacy-G-v1",
    scholarshipBalance: 0,
    ownsHome: false,
    homeType: null,
    homeValue: 0,
    will: { type: "legal", targetId: null, charity: null },
    peerageTitle: null,
    titleSuccession: null,
    skills: Object.fromEntries(SKILL_IDS_LIST.map((skill) => [skill, 0])),
    skillTalents: Object.fromEntries(SKILL_IDS_LIST.map((skill) => [skill, rollTalent(random)])),
    skillPractice: {},
    skillMonthProgress: 0,
    skillHistory: [],
    educationStatus: "未就学",
    school: null,
    mentor: null,
    trainingSkill: null,
    trainingEndsAt: null,
    trainingPlan: null,
    educationHistory: [],
    occupationRole: "まだ幼い子ども",
    promotionNote: "",
    finance: { recent: [], lastMonth: null, monthProgress: 0, totalIncome: 0, totalExpense: 0 },
    childPlan: "unset",
    nextChildAskAt: 0,
    pregnancy: null,
    marriage: null,
    spouseId: null,
    romanticPartnerId: null,
    lastResult: null,
    npcClock: 0,
    nextSocialAt: 13 + rollExponential(1.5, random),
    careerHistory: [],
    npcs: [],
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
    illness: null,
    lastIllnessRecoveryAt: null,
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
  createParents(life, random);
  return life;
}

function appendEvent(life, text, kind = "life", label = "人生", id = null) {
  const event = { age: life.age, text: toSilverText(text), kind, label, id };
  life.journal.push(event);
  life.eventCount += 1;
  if (id) life.eventHistory.push({ id, age: life.age });
  return event;
}

function hasRecentEvent(life, id, cooldownYears) {
  const appearsInRecentJournal = (life.journal ?? []).slice(-20).some((event) => event.id === id);
  return appearsInRecentJournal || (life.eventHistory ?? []).some((event) => event.id === id && life.age - event.age < cooldownYears);
}

export function selectRoutineEvent(life, random = Math.random, eventCatalog = ROUTINE_EVENTS) {
  const candidates = eventCatalog.filter((event) => isRoutineEventEligible(life, event));
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

function ensureSkillState(life) {
  if (!life.skills) {
    life.skills = Object.fromEntries(SKILL_IDS_LIST.map((skill) => [skill, 0]));
    const currentSkill = OCCUPATION_SKILLS[life.occupation] ?? "general";
    life.skills[currentSkill] = life.occupationSkill ?? 0;
  }
  for (const skill of SKILL_IDS_LIST) {
    if (typeof life.skills[skill] !== "number") life.skills[skill] = 0;
  }
  life.skillTalents ??= Object.fromEntries(SKILL_IDS_LIST.map((skill) => [skill, "普通"]));
  life.skillPractice ??= {};
  life.skillHistory ??= [];
  life.skillMonthProgress ??= 0;
  return life.skills;
}

function rankForSkill(skill) {
  return [...OCCUPATION_RANKS].reverse().find((rank) => skill >= rank.skill)?.name ?? "初心者";
}

function syncOccupationSkill(life) {
  const skills = ensureSkillState(life);
  life.occupationSkill = skills[OCCUPATION_SKILLS[life.occupation] ?? "general"] ?? 0;
}

function addSkillPoints(life, skill, amount, source = "出来事") {
  const skills = ensureSkillState(life);
  const before = skills[skill] ?? 0;
  skills[skill] = Math.max(0, before + amount);
  if (skills[skill] !== before) {
    life.skillHistory.push({ skill, age: life.age, from: before, to: skills[skill], source });
    if (life.skillHistory.length > 40) life.skillHistory.splice(0, life.skillHistory.length - 40);
  }
  if (skill === (OCCUPATION_SKILLS[life.occupation] ?? "general")) {
    syncOccupationSkill(life);
    updateOccupationRank(life);
  }
}

function registerNPC(life, random, relationship, occupation) {
  life.npcs ??= [];
  const existing = life.npcs.find((npc) => npc.relationship === relationship && npc.alive);
  if (existing) return existing;
  return createNpc(life, random, {
    relationship, occupation, humanAge: 30 + random() * 20, affinity: 50, firstContact: "出会った",
  });
}

function setSkillPractice(life, skill, activity, learning) {
  life.skillPractice ??= {};
  life.skillPractice[skill] = { activity, learning };
}

export function skillGrowthDelta(skill, activity, talent, race, learning, deltaHumanYears) {
  const level = Math.max(0, skill);
  const talentFactor = typeof talent === "number" ? talent : TALENT_FACTORS[talent] ?? 1;
  return SKILL_GROWTH_BASE * activity * talentFactor * race * learning
    * (1 / (1 + (level / 80) ** 1.5)) * deltaHumanYears;
}

export function skillTier(skill) {
  if (skill >= 100) return "巨匠級";
  if (skill >= 80) return "達人";
  if (skill >= 60) return "熟練";
  if (skill >= 40) return "一人前";
  if (skill >= 20) return "見習い";
  return "初心者";
}

function skillGrowthPlans(life) {
  const plans = new Map();
  const occupationSkill = OCCUPATION_SKILLS[life.occupation];
  if (life.age >= 13 && occupationSkill && !NON_WORKING.includes(life.occupation)) {
    plans.set(occupationSkill, { activity: 1, learning: 1 });
  }
  for (const [skill, practice] of Object.entries(life.skillPractice ?? {})) {
    if (practice.activity > 0) plans.set(skill, practice);
  }
  // One person's time is shared: total activity beyond intensive training (1.3) is scaled down
  // so the same hours are never counted twice.
  const total = [...plans.values()].reduce((sum, plan) => sum + plan.activity, 0);
  if (total > 1.3) {
    for (const [skill, plan] of plans) plans.set(skill, { ...plan, activity: plan.activity * 1.3 / total });
  }
  return plans;
}

function updateOccupationRank(life) {
  syncOccupationSkill(life);
  const rank = rankForSkill(life.occupationSkill);
  if (rank === life.occupationRank) return;
  const previousRank = life.occupationRank;
  life.occupationRank = rank;
  appendEvent(
    life,
    `${occupationTitle(life)}としての技能が${previousRank}から${rank}へ成長した。勤続年数は${Math.floor(life.occupationYears)}年。`,
    "life",
    "技能の成長",
    `occupation-rank-${life.occupation}-${rank}`,
  );
}

export function advanceSkills(life, humanYears) {
  if (humanYears <= 0) return;
  const skills = ensureSkillState(life);
  const accumulatedMonths = (life.skillMonthProgress ?? 0) + humanYears * 12;
  const completeMonths = Math.floor(accumulatedMonths + Number.EPSILON);
  life.skillMonthProgress = accumulatedMonths - completeMonths;
  const plans = skillGrowthPlans(life);
  const raceFactor = RACE_SKILL_FACTORS[life.race?.id] ?? {};
  const ageMultiplier = RACE_AGE_MULTIPLIERS[life.race?.id] ?? life.race?.multiplier ?? 1;

  for (let month = 0; month < completeMonths; month += 1) {
    for (const [skill, plan] of plans) {
      const before = skills[skill] ?? 0;
      const talent = life.skillTalents[skill] ?? "普通";
      const deltaActualYears = SKILL_MONTH * (life.race?.multiplier ?? 1);
      skills[skill] = before + skillGrowthDelta(
        before,
        plan.activity,
        talent,
        raceFactor[skill] ?? 1,
        plan.learning,
        deltaActualYears / ageMultiplier,
      );
    }
  }
  if (completeMonths > 0) {
    updateOccupationRank(life);
    life.skillAnnual ??= { mark: life.age, base: {}, prev: {} };
    if (life.age - life.skillAnnual.mark >= 1) {
      life.skillAnnual = { mark: life.age, prev: life.skillAnnual.base, base: { ...skills } };
    } else if (Object.keys(life.skillAnnual.base).length === 0) {
      life.skillAnnual.base = { ...skills };
    }
  }
}

function addRelationship(life, type) {
  if (!life.relationships.some((relationship) => relationship.type === type)) {
    life.relationships.push({ type, since: life.age });
  }
}

export function applyRoutineEffect(life, event, random = Math.random) {
  const effect = event.effect ?? {};
  life.gold = Math.max(0, life.gold + (effect.gold ?? 0));
  life.debt = Math.max(0, life.debt + (effect.debt ?? 0));
  life.fame = Math.max(0, life.fame + (effect.fame ?? 0));
  if (effect.skill) {
    const skill = event.category === "魔法・種族固有" ? "magic"
      : event.category === "幼少期・教育" ? "literacy"
        : OCCUPATION_SKILLS[life.occupation] ?? "general";
    addSkillPoints(life, skill, effect.skill, event.category);
  }
  if (effect.magic) addSkillPoints(life, "magic", effect.magic * 0.5, event.category);
  if (event.id === "magic-first-spark" && !life.trainingPlan) life.educationStatus = "魔力が目覚めた";
  if (effect.health) {
    life.health = effect.health;
    life.illnessUntil = effect.health === "健やか" ? life.age : life.age + 0.5 + random();
  }
  if (effect.relation) addRelationship(life, effect.relation);
  addFlag(life, effect.flag);

  switch (effect.action) {
    case "start-work":
      changeOccupation(life, pickCareer(life, random), "家族の紹介で就職");
      life.gold += 4;
      break;
    case "career-change":
      changeOccupation(life, randomItem(["商人", "教師", "職人見習い"], random), "職業イベントによる転職");
      break;
    case "retire":
      addFlag(life, "retirement-choice-resolved");
      break;
    case "open-workshop":
      changeOccupation(life, "工房主", "工房を開業");
      life.occupationRank = rankForSkill(life.occupationSkill);
      break;
    case "buy-home":
      life.ownsHome = true;
      break;
    case "sibling":
      life.siblings += 1;
      life.familyCount += 1;
      break;
    case "social":
      socialStep(life, random);
      break;
    case "harmony-up":
      adjustHarmony(life, 8);
      break;
    case "harmony-down":
      adjustHarmony(life, -12);
      addFlag(life, "family-dispute");
      break;
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

function changeOccupation(life, occupation, reason = "就職・転職", restore = false) {
  if (life.occupation === occupation) return;
  ensureSkillState(life);
  const previous = life.occupation;
  life.careerHistory ??= [];
  life.careerRecords ??= {};
  life.careerRecords[previous] = { years: life.occupationYears ?? 0, role: life.occupationRole ?? previous };
  life.careerHistory.push({
    from: previous, to: occupation, age: life.age, reason,
    yearsInPrevious: Math.round((life.occupationYears ?? 0) * 10) / 10,
  });
  life.occupation = occupation;
  const record = restore ? life.careerRecords[occupation] : null;
  life.occupationYears = record?.years ?? 0;
  life.occupationRole = record?.role ?? occupation;
  syncOccupationSkill(life);
  life.occupationRank = rankForSkill(life.occupationSkill);
  updatePromotionNote(life);
}

function advanceOccupation(life, elapsed) {
  if (life.age < 13 || NON_WORKING.includes(life.occupation) || elapsed <= 0) return;
  life.occupationYears += elapsed;
  syncOccupationSkill(life);
}

export function occupationTitle(life) {
  return life.occupationRole ?? life.occupation;
}

function lifeStage(age) {
  if (age < 6) return "child";
  if (age < 13) return "school";
  if (age < 18) return "youth";
  if (age < 35) return "youngAdult";
  if (age < 60) return "middle";
  return "elder";
}

export const SAVE_VERSION = 4;

// Provisional monthly wages in G (base role). 1G is treated as roughly 5,000 yen of buying power in the
// design notes, but realistic wages at that rate do not fit the existing 4–60G choice prices, so these
// are scaled-down placeholder values pending the designer's economy decision.
const OCCUPATION_INCOME = Object.freeze({
  "まだ幼い子ども": 0,
  "家業の手伝い": 0.8,
  "農作業": 3,
  "服飾店の見習い": 2.2,
  "職人見習い": 2.5,
  "鍛冶職人": 2.7,
  "兵士": 3.6,
  "商人": 4.5,
  "冒険者": 3.5,
  "教師": 4.2,
  "魔術師": 5.5,
  "魔術師の弟子": 0,
  "魔術学院生": 0,
  "剣術の弟子": 0,
  "騎士学院生": 0,
  "学術院生": 0,
  "騎士": 6,
  "学者": 5,
  "工房主": 7,
  "失業中": 0.4,
  "引退": 0.8,
  "狩りを覚える": 1.5,
  "巣の外を探検する": 1.5,
  "縄張りを見回る": 1.5,
});

export const CRAFT_OCCUPATIONS = ["職人見習い", "服飾店の見習い", "鍛冶職人"];

const CRAFT_LADDER = [
  { role: "一人前の職人", minSkill: 40, minYears: 3, mult: 1.3 },
  { role: "熟練職人", minSkill: 55, minYears: 7, mult: 1.7 },
  { role: "親方", minSkill: 75, minYears: 13, minGold: 20, mult: 2.2 },
];

const ROLE_LADDERS = Object.freeze({
  "農作業": [
    { role: "熟練農民", minSkill: 40, minYears: 5, mult: 1.3 },
    { role: "農地所有者", minSkill: 60, minYears: 14, minGold: 40, mult: 2 },
  ],
  "職人見習い": CRAFT_LADDER,
  "服飾店の見習い": CRAFT_LADDER,
  "鍛冶職人": CRAFT_LADDER,
  "兵士": [
    { role: "士官", minSkill: 45, minYears: 6, minFame: 3, mult: 1.5 },
    { role: "将軍", minSkill: 80, minYears: 20, minFame: 25, mult: 2.8 },
  ],
  "冒険者": [
    { role: "上位冒険者", minSkill: 40, minYears: 5, mult: 1.5 },
    { role: "伝説級冒険者", minSkill: 80, minYears: 15, minFame: 20, mult: 2.5 },
  ],
  "商人": [
    { role: "大商人", minSkill: 45, minYears: 8, minGold: 60, mult: 1.8 },
    { role: "商会主", minSkill: 70, minYears: 15, minGold: 150, mult: 3 },
  ],
  "教師": [
    { role: "主任教師", minSkill: 45, minYears: 8, mult: 1.4 },
    { role: "学院長", minSkill: 75, minYears: 18, minFame: 8, mult: 2.2 },
  ],
  "魔術師": [
    { role: "熟練魔術師", minSkill: 50, minYears: 6, mult: 1.5 },
    { role: "宮廷魔術師", minSkill: 80, minYears: 15, minFame: 12, mult: 2.4 },
  ],
  "学者": [
    { role: "教授", minSkill: 60, minYears: 10, mult: 1.6 },
  ],
});

const TRAINEE_OCCUPATIONS = ["魔術師の弟子", "魔術学院生", "剣術の弟子", "騎士学院生", "学術院生"];
const NON_WORKING = ["まだ幼い子ども", "引退", "失業中"];

function roleSteps(life) {
  return ROLE_LADDERS[life.occupation] ?? [];
}

function roleMultiplier(life) {
  const step = roleSteps(life).find((item) => item.role === life.occupationRole);
  return step?.mult ?? 1;
}

function missingForStep(life, step) {
  const missing = [];
  const skill = life.occupationSkill ?? 0;
  if (skill < step.minSkill) missing.push(`技能${Math.round(skill)}/${step.minSkill}`);
  if (life.occupationYears < step.minYears) missing.push(`勤続${Math.floor(life.occupationYears)}/${step.minYears}年`);
  if (step.minGold && life.gold < step.minGold) missing.push(`資金${Math.floor(life.gold)}/${step.minGold}G`);
  if (step.minFame && life.fame < step.minFame) missing.push(`名声${Math.floor(life.fame)}/${step.minFame}`);
  return missing;
}

function updatePromotionNote(life) {
  const steps = roleSteps(life);
  if (steps.length === 0) {
    life.promotionNote = NON_WORKING.includes(life.occupation) || TRAINEE_OCCUPATIONS.includes(life.occupation)
      ? "" : "この職業に定まった昇進先はない";
    return;
  }
  const index = steps.findIndex((step) => step.role === life.occupationRole);
  const next = steps[index + 1];
  if (!next) {
    life.promotionNote = "最上位の役職に就いている";
    return;
  }
  const missing = missingForStep(life, next);
  life.promotionNote = missing.length
    ? `次の役職「${next.role}」まで: ${missing.join("、")}`
    : `「${next.role}」への昇進打診を受ける条件を満たした`;
}

function nextPromotionStep(life) {
  const steps = roleSteps(life);
  const index = steps.findIndex((step) => step.role === life.occupationRole);
  const next = steps[index + 1] ?? (index < 0 ? steps[0] : null);
  return next && missingForStep(life, next).length === 0 ? next : null;
}

function updateRole(life) {
  updatePromotionNote(life);
}

// ---------------------------------------------------------------- world state

const WORLD_TABLE = Object.freeze({
  "戦争中": { weight: 3, price: 1.25, income: { "商人": 1.25, "農作業": 0.85, "冒険者": 1.35, "兵士": 1.15 }, defaultIncome: 0.95, npcHazard: 1.5, illness: 1 },
  "疫病流行": { weight: 2, price: 1.1, income: {}, defaultIncome: 0.9, npcHazard: 4, illness: 3 },
  "飢饉": { weight: 1.5, price: 1.6, income: { "農作業": 0.6 }, defaultIncome: 0.9, npcHazard: 2, illness: 1.3 },
  "不況": { weight: 2, price: 1, income: { "商人": 0.7 }, defaultIncome: 0.8, npcHazard: 1, illness: 1 },
  "魔物の襲撃": { weight: 1.5, price: 1.1, income: { "冒険者": 1.5, "農作業": 0.8 }, defaultIncome: 1, npcHazard: 1.3, illness: 1 },
});

export function worldModifiers(life) {
  const entry = WORLD_TABLE[life.world?.situation ?? life.situation];
  if (!entry) return { price: 1, incomeFor: () => 1, npcHazard: 1, illness: 1 };
  return {
    price: entry.price,
    incomeFor: (occupation) => entry.income[occupation] ?? entry.defaultIncome,
    npcHazard: entry.npcHazard,
    illness: entry.illness,
  };
}

const WORLD_TEXT = Object.freeze({
  "戦争中": (life) => `${life.nation.name}を巻き込む戦争が始まった。物価が上がり、各地で兵が集められている。`,
  "疫病流行": () => "疫病が広がり始めた。病に倒れる人が増え、薬や医者の値が上がっている。",
  "飢饉": () => "不作が続き、飢饉が起きた。食料の値が跳ね上がっている。",
  "不況": () => "景気が冷え込み、商いや仕事が減っている。",
  "魔物の襲撃": () => "魔物の群れが人里を襲うようになった。辺境や農村では被害が出ている。",
});

const WORLD_END_TEXT = Object.freeze({
  "戦争中": "戦争が終わり、兵士たちが故郷へ戻り始めた。",
  "疫病流行": "疫病の流行が収まり、町に日常が戻った。",
  "飢饉": "収穫が回復し、食料の値が落ち着いた。",
  "不況": "景気が持ち直し、仕事が戻ってきた。",
  "魔物の襲撃": "魔物の群れは討伐され、街道に平穏が戻った。",
});

function applyWorldOnset(life, situation, random) {
  const impacts = [];
  const adult = life.age >= 18;
  const exempt = ["王族", "貴族", "奴隷"].includes(life.status?.name);
  if (situation === "戦争中") {
    if (life.occupation === "兵士") {
      impacts.push("兵士として戦地へ送られる危険が高まった");
    } else if (adult && life.age < 45 && !exempt && !NON_WORKING.includes(life.occupation)
      && !TRAINEE_OCCUPATIONS.includes(life.occupation) && random() < 0.35) {
      life.draftedFrom = life.occupation;
      changeOccupation(life, "兵士", "戦争による徴兵");
      impacts.push("徴兵され、兵士として働くことになった");
    }
    if (life.occupation === "商人") impacts.push("軍需で商人の取引が増えた");
    if (life.occupation === "冒険者") impacts.push("護衛や討伐の依頼が増えた");
    if (life.occupation === "農作業") impacts.push("食料の徴発で収穫の取り分が減った");
  } else if (situation === "疫病流行") {
    impacts.push("病気にかかりやすくなり、親しい人の安否も気がかりだ");
  } else if (situation === "飢饉") {
    impacts.push("生活費が大きく増えた");
  } else if (situation === "不況") {
    const vulnerable = ["商人", "職人見習い", "服飾店の見習い", "教師", "家業の手伝い"];
    if (vulnerable.includes(life.occupation) && life.age >= 13 && random() < 0.4) {
      life.unemployedFrom = life.occupation;
      changeOccupation(life, "失業中", "不況による解雇");
      impacts.push("不況で職を失った");
    } else if (life.age >= 13) {
      impacts.push("収入が減った");
    }
  } else if (situation === "魔物の襲撃") {
    if (life.occupation === "冒険者") impacts.push("討伐の依頼が増えた");
    if (["辺境", "農村"].includes(life.home)) {
      impacts.push("暮らす地域が襲われる危険が増えた");
      if (random() < 0.3) {
        const loss = Math.min(life.gold, 5);
        if (loss > 0) {
          life.gold -= loss;
          recordGold(life, "魔物の襲撃による被害", -loss);
          impacts.push(`家や畑が荒らされ${loss}Gを失った`);
        }
      }
    }
  }
  return impacts;
}

function advanceWorld(life, random) {
  const world = life.world;
  if (life.age < world.nextChangeAt) return;
  if (world.situation !== "平和") {
    const ended = world.situation;
    world.situation = "平和";
    world.since = life.age;
    world.nextChangeAt = life.age + 3 + rollExponential(7, random);
    life.situation = "平和";
    const notes = [];
    if (ended === "戦争中" && life.draftedFrom && life.occupation === "兵士") {
      changeOccupation(life, life.draftedFrom, "戦争の終結で復員", true);
      notes.push(`徴兵を解かれ、${life.draftedFrom}の仕事へ戻った`);
      life.draftedFrom = null;
    }
    appendEvent(life, `${WORLD_END_TEXT[ended]}${notes.length ? `（${notes.join("、")}）` : ""}`, "world", "世界情勢", `world-end-${ended}-${Math.floor(life.age)}`);
    return;
  }
  const choice = weightedPick(Object.entries(WORLD_TABLE), ([, entry]) => entry.weight, random)[0];
  world.situation = choice;
  world.since = life.age;
  world.nextChangeAt = life.age + 1.5 + rollExponential(2.5, random);
  life.situation = choice;
  const impacts = applyWorldOnset(life, choice, random);
  appendEvent(
    life,
    `${WORLD_TEXT[choice](life)}${impacts.length ? `（あなたへの影響: ${impacts.join("、")}）` : ""}`,
    "world", "世界情勢", `world-start-${choice}-${Math.floor(life.age)}`,
  );
}

// ---------------------------------------------------------------- economy

function recordGold(life, label, amount) {
  if (!amount) return;
  life.finance ??= { recent: [], lastMonth: null, monthProgress: 0, totalIncome: 0, totalExpense: 0 };
  life.finance.recent.push({ age: life.age, label, amount: Math.round(amount * 10) / 10 });
  if (life.finance.recent.length > 16) life.finance.recent.splice(0, life.finance.recent.length - 16);
}

function spouseNpc(life) {
  return life.spouseId ? (life.npcs ?? []).find((npc) => npc.id === life.spouseId && npc.alive) : null;
}

export function livingChildren(life) {
  return (life.children ?? [])
    .map((entry) => (typeof entry === "string" ? (life.npcs ?? []).find((npc) => npc.id === entry) : entry))
    .filter((npc) => npc && npc.alive);
}

export function monthlyBudget(life, random = null) {
  const mods = worldModifiers(life);
  const working = life.age >= 13 && !(life.occupation === "まだ幼い子ども");
  let work = working ? (OCCUPATION_INCOME[life.occupation] ?? 1) * roleMultiplier(life) * (1 + (life.occupationSkill ?? 0) / 200) : 0;
  work *= working ? mods.incomeFor(life.occupation) : 1;
  work += life.businessRevenue ?? 0;
  if (random && life.occupation === "冒険者") work *= 0.4 + 1.2 * random();
  const spouse = spouseNpc(life);
  const spouseWork = spouse ? (OCCUPATION_INCOME[spouse.occupation] ?? 1) * 0.9 * mods.incomeFor(spouse.occupation) : 0;
  const owned = Boolean(life.ownsHome);
  const adult = life.age >= 18;
  const living = (life.age < 15 ? 0 : life.age < 18 ? 0.6 : 1.4) * mods.price;
  const rent = adult && !owned ? TUNING.homeRentLegacyG * mods.price : 0;
  const children = livingChildren(life).filter((npc) => !npc.independent);
  const familyCost = ((spouse ? 0.9 : 0) + children.reduce((sum, npc) => sum + ((npc.humanAge ?? 0) < 15 ? 0.5 : 0.3), 0)) * mods.price;
  const medical = life.health !== "健やか" && life.age >= 15 ? 0.5 * mods.price : 0;
  const interest = life.debt * 0.008;
  const expenses = living + rent + familyCost + medical + interest;
  const income = work + spouseWork;
  const repayment = life.debt > 0 ? Math.min(life.debt, Math.max(0, (income - expenses) * 0.4)) : 0;
  const scholarshipRepayment = (life.scholarshipBalance ?? 0) > 0 && income - expenses - repayment >= income * TUNING.scholarshipRepaymentRate
    ? Math.min(life.scholarshipBalance, income * TUNING.scholarshipRepaymentRate)
    : 0;
  return {
    income: { work, spouse: spouseWork },
    expenses: { living, rent, family: familyCost, medical, interest },
    repayment,
    scholarshipRepayment,
    totalIncome: income,
    totalExpense: expenses,
    net: income - expenses - repayment - scholarshipRepayment,
  };
}

function processMonth(life, random) {
  const budget = monthlyBudget(life, random);
  life.finance ??= { recent: [], lastMonth: null, monthProgress: 0, totalIncome: 0, totalExpense: 0 };
  life.gold += budget.totalIncome - budget.totalExpense;
  if (budget.repayment > 0) {
    life.gold -= budget.repayment;
    life.debt = Math.max(0, life.debt - budget.repayment);
  }
  if (budget.scholarshipRepayment > 0) {
    life.gold -= budget.scholarshipRepayment;
    life.scholarshipBalance = Math.max(0, life.scholarshipBalance - budget.scholarshipRepayment);
  }
  if (life.gold < 0) {
    life.gold = 0;
    life.financialHardship = true;
    if (!hasRecentEvent(life, "finance-shortfall", 3) && life.age >= 15) {
      appendEvent(life, "収入が生活費に届かず、蓄えを使い切った。自動で借金はせず、暮らし向きを見直すことになった。", "life", "家計", "finance-shortfall");
    }
  } else {
    life.financialHardship = false;
  }
  life.finance.totalIncome += budget.totalIncome;
  life.finance.totalExpense += budget.totalExpense + budget.repayment + budget.scholarshipRepayment;
  life.finance.lastMonth = { age: life.age, ...budget };
}

// ---------------------------------------------------------------- NPCs and family

export function raceById(id) {
  return RACES.find((race) => race.id === id) ?? RACES[0];
}

export function npcActualAge(npc) {
  if (npc.humanAge == null) return null;
  return Math.floor(npc.humanAge * raceById(npc.race).multiplier);
}

const SPOUSE_WORK = ["農作業", "商人", "教師", "職人見習い", "服飾店の見習い", "冒険者", "兵士"];

function createNpc(life, random, spec) {
  life.npcs ??= [];
  life.npcSerial = (life.npcSerial ?? life.npcs.length) + 1;
  const raceId = spec.race ?? life.race.id;
  const npc = {
    id: `npc-${life.npcSerial}`,
    name: spec.name ?? `${randomItem(GIVEN_NAMES[raceId] ?? GIVEN_NAMES.human, random)}・${randomItem(SURNAMES, random)}`,
    race: raceId,
    humanAge: spec.humanAge ?? life.age + 3,
    age: 0,
    gender: spec.gender ?? randomItem(GENDERS, random),
    occupation: spec.occupation ?? randomItem(SPOUSE_WORK, random),
    location: spec.location ?? life.home,
    personality: spec.personality ?? randomItem(PERSONALITIES, random),
    wealth: spec.wealth ?? Math.floor(random() * 30),
    debt: spec.debt ?? 0,
    health: "健やか",
    relationship: spec.relationship,
    affinity: spec.affinity ?? 35,
    maritalStatus: spec.maritalStatus ?? "未婚",
    spouseName: null,
    alive: true,
    interactions: 0,
    lastContactAge: life.age,
    history: [{ age: life.age, text: spec.firstContact ?? "知り合った" }],
  };
  npc.age = npcActualAge(npc);
  life.npcs.push(npc);
  return npc;
}

function npcNote(life, npc, text) {
  npc.history ??= [];
  npc.history.push({ age: life.age, text });
  if (npc.history.length > 12) npc.history.splice(0, npc.history.length - 12);
  npc.lastContactAge = life.age;
}

function createParents(life, random) {
  const humanAge = (offset) => 24 + offset * 10;
  createNpc(life, random, {
    relationship: "父", gender: "男性", humanAge: humanAge(random()) - life.age,
    occupation: life.parents.father, affinity: 60, maritalStatus: "既婚", firstContact: "生まれたときから家族",
  });
  createNpc(life, random, {
    relationship: "母", gender: "女性", humanAge: humanAge(random()) - life.age,
    occupation: life.parents.mother, affinity: 60, maritalStatus: "既婚", firstContact: "生まれたときから家族",
  });
}

function livingParents(life) {
  return (life.npcs ?? []).filter((npc) => npc.alive && (npc.relationship === "父" || npc.relationship === "母"));
}

function deathCauseFor(life, npc, random) {
  const race = raceById(npc.race);
  if (npc.humanAge >= (race.lifespan / race.multiplier) * 0.8) return "老衰";
  const situation = life.world?.situation;
  if (situation === "戦争中" && npc.occupation === "兵士") return "戦死";
  if (situation === "疫病流行" && random() < 0.6) return "疫病";
  return random() < 0.7 ? "病気" : "事故";
}

function npcDies(life, npc, random) {
  npc.alive = false;
  npc.health = "故人";
  npc.deathAge = life.age;
  const cause = deathCauseFor(life, npc, random);
  npc.deathCause = cause;
  const link = npc.relationship;
  const id = `npc-death-${npc.id}`;
  if (life.spouseId === npc.id) {
    life.spouse = null;
    life.spouseId = null;
    life.marriage = null;
    life.familyCount = Math.max(0, life.familyCount - 1);
    life.historyFlags = life.historyFlags.filter((flag) => flag !== "married");
    addFlag(life, "widowed");
    life.widowedAt = life.age;
    life.pregnancy = null;
    npc.relationship = "亡き配偶者";
    appendEvent(life, `${npc.name}が${cause}で亡くなった。長く連れ添った相手との死別だった。`, "life", "死別", id);
  } else if (link === "父" || link === "母") {
    appendEvent(life, `${link}の${npc.name}が${cause}で亡くなった。`, "life", "死別", id);
  } else if (link === "子") {
    life.familyCount = Math.max(0, life.familyCount - 1);
    appendEvent(life, `子の${npc.name}が${cause}で亡くなった。`, "life", "死別", id);
  } else if (life.mentor === npc.id) {
    appendEvent(life, `師の${npc.name}が${cause}で亡くなった。`, "life", "死別", id);
    finishTraining(life, random, { early: true });
  } else if (life.romanticPartnerId === npc.id) {
    life.romanticPartnerId = null;
    life.historyFlags = life.historyFlags.filter((flag) => !["romantic-partner", "committed-relationship"].includes(flag));
    appendEvent(life, `親しかった${npc.name}が${cause}で亡くなった。`, "life", "死別", id);
  } else if (npc.affinity >= 55) {
    appendEvent(life, `親しかった${npc.name}が${cause}で亡くなった。`, "life", "死別", id);
  }
}

function growChild(life, npc, random, elapsed) {
  if (!npc.independent) {
    if (npc.humanAge >= 6 && npc.occupation === "幼児") npc.occupation = "学生";
    if (npc.humanAge >= 15 && npc.occupation === "学生") {
      npc.occupation = randomItem(SPOUSE_WORK, random);
      appendEvent(life, `子の${npc.name}が${npc.occupation}として働き始めた。`, "life", "家族", `child-work-${npc.id}`);
    }
    if (npc.humanAge >= 20 && npc.humanAge >= 15 && random() < 0.12 * elapsed) {
      npc.independent = true;
      npc.location = randomItem(HOME_TYPES, random);
      appendEvent(life, `子の${npc.name}が独立し、家を出て自分の暮らしを始めた。`, "life", "家族", `child-independent-${npc.id}`);
    }
  } else if (npc.maritalStatus === "未婚" && npc.humanAge >= 22 && random() < 0.08 * elapsed) {
    npc.maritalStatus = "既婚";
    npc.spouseName = `${randomItem(GIVEN_NAMES[npc.race] ?? GIVEN_NAMES.human, random)}・${randomItem(SURNAMES, random)}`;
    appendEvent(life, `子の${npc.name}が${npc.spouseName}と結婚した。`, "life", "家族", `child-marriage-${npc.id}`);
  }
  const stable = life.gold >= 10 ? 0.15 : -0.1;
  npc.affinity = clamp(npc.affinity + ((random() - 0.5) * 0.6 + stable) * elapsed, 0, 100);
  if (npc.independent && npc.affinity < 20 && !npc.estranged) {
    npc.estranged = true;
    appendEvent(life, `子の${npc.name}とは気持ちの行き違いが続き、疎遠になっている。`, "life", "家族", `child-estranged-${npc.id}`);
  } else if (npc.estranged && npc.affinity > 40) {
    npc.estranged = false;
  }
}

function advanceNpcs(life, elapsed, random) {
  const mods = worldModifiers(life);
  const war = life.world?.situation === "戦争中";
  for (const npc of life.npcs ?? []) {
    if (!npc.alive || npc.humanAge == null) continue;
    npc.humanAge += elapsed;
    npc.age = npcActualAge(npc);
    const race = raceById(npc.race);
    let rate = (npc.humanAge < 5 ? 0.003 : 0.001) + deathRate(npc.humanAge);
    rate *= mods.npcHazard;
    if (war && npc.occupation === "兵士") rate += 0.02;
    if (npc.humanAge >= race.lifespan / race.multiplier || random() < rate * elapsed) {
      npcDies(life, npc, random);
      continue;
    }
    if (npc.relationship === "子") growChild(life, npc, random, elapsed);
  }
}

function marriageCandidates(life) {
  const myAge = life.age;
  return (life.npcs ?? []).filter((npc) => npc.alive && npc.maritalStatus === "未婚" && npc.humanAge != null
    && !["父", "母", "子", "兄弟姉妹"].includes(npc.relationship) && npc.humanAge >= 18 && Math.abs(npc.humanAge - myAge) <= 12
    && !["師匠", "魔術の師匠", "かつての師匠"].includes(npc.relationship));
}

function compatibility(life, npc) {
  return npc.personality === life.personality ? 8 : 0;
}

const MEETING_PLACES = {
  school: ["学び舎", "学院の中庭"],
  work: ["職場", "仕事仲間の集まり"],
  market: ["市場", "広場の祭り"],
  travel: ["旅先の宿", "街道沿いの茶屋"],
  guild: ["ギルド", "酒場"],
  court: ["宮廷の舞踏会", "貴族の茶会"],
};

function meetingPlace(life, random) {
  if (["王族", "貴族"].includes(life.status?.name) && random() < 0.5) return randomItem(MEETING_PLACES.court, random);
  if (life.occupation === "冒険者") return randomItem(MEETING_PLACES.guild, random);
  if (TRAINEE_OCCUPATIONS.includes(life.occupation) || life.age < 18) return randomItem(MEETING_PLACES.school, random);
  if (life.occupation === "商人") return randomItem(MEETING_PLACES.market, random);
  return randomItem([...MEETING_PLACES.work, ...MEETING_PLACES.market, ...MEETING_PLACES.travel], random);
}

function logSocial(life, text, kind, label, id) {
  if (life.journal?.at(-1)?.text === text) return;
  appendEvent(life, text, kind, label, id);
}

function socialStep(life, random) {
  const acquaintances = (life.npcs ?? []).filter((npc) => npc.alive
    && !["父", "母", "子", "亡き配偶者"].includes(npc.relationship) && npc.id !== life.spouseId);
  const meetNew = acquaintances.length < 3 || random() < 0.3;
  if (meetNew && acquaintances.length < 14) {
    const peerAge = Math.max(4, life.age + (random() - 0.5) * 12);
    const npc = createNpc(life, random, {
      relationship: "知人", humanAge: peerAge, race: random() < 0.75 ? life.race.id : undefined,
      maritalStatus: random() < 0.72 ? "未婚" : "既婚", occupation: randomItem(SPOUSE_WORK, random),
      affinity: 25 + Math.floor(random() * 15), firstContact: "出会った",
    });
    const place = meetingPlace(life, random);
    logSocial(life, `${place}で${npc.race === life.race.id ? "" : `${raceById(npc.race).name}の`}${npc.name}（${npc.occupation}）と出会い、言葉を交わした。`, "life", "出会い", `social-meet-${npc.id}`);
    return;
  }
  if (acquaintances.length === 0) return;
  const target = weightedPick(acquaintances, (npc) => 1 + npc.affinity / 40, random);
  const gain = 4 + random() * 6 + compatibility(life, target) / 2 + (life.stats?.charm ? 0 : 0);
  target.affinity = clamp(target.affinity + gain, 0, 100);
  target.interactions += 1;
  npcNote(life, target, "再び会って語り合った");
  const married = Boolean(life.spouseId);
  if (target.relationship === "知人" && target.affinity >= 45) {
    target.relationship = "友人";
    logSocial(life, `${target.name}と何度も会ううち、気心の知れた友人になった。`, "life", "交流", `social-friend-${target.id}`);
    return;
  }
  const available = !married && !life.romanticPartnerId && marriageCandidates(life).includes(target);
  if (available && target.affinity >= 62 && life.age >= 18) {
    life.romanticPartnerId = target.id;
    target.relationship = "恋愛相手";
    addFlag(life, "romantic-partner");
    life.relationships.push({ type: "romance", npcId: target.id, since: life.age });
    logSocial(life, `${target.name}と過ごす時間が増え、友情を超えた特別な気持ちが芽生えた。`, "life", "恋愛", `social-romance-${target.id}`);
    return;
  }
  if (random() < 0.2) {
    const lines = [
      `${target.name}（${target.occupation}）と再会し、近況を語り合った。`,
      `${target.name}に誘われ、仕事の合間に食事を共にした。`,
      `${target.name}から最近の町の噂を聞き、笑い合った。`,
    ];
    logSocial(life, lines[Math.floor(random() * lines.length)], "life", "交流", `social-visit-${target.id}-${Math.floor(life.age)}`);
  }
}

function marryNpc(life, npc, { arranged = false } = {}) {
  npc.maritalStatus = "既婚";
  npc.relationship = "配偶者";
  npc.affinity = clamp(npc.affinity + (arranged ? 5 : 15), 0, 100);
  life.spouse = npc.name;
  life.spouseId = npc.id;
  life.marriage = { since: life.age, harmony: arranged ? 45 : 65, arranged };
  life.familyCount += 1;
  life.romanticPartnerId = null;
  life.historyFlags = life.historyFlags.filter((flag) => !["romantic-partner", "committed-relationship", "widowed", "divorced"].includes(flag));
  addFlag(life, "married");
  addFlag(life, "ever-married");
  addRelationship(life, "spouse");
  life.childPlan = "later";
  life.nextChildAskAt = life.age + 0.5;
  npcNote(life, npc, arranged ? "見合いで結婚した" : "結婚した");
}

function adjustHarmony(life, delta) {
  if (!life.marriage) return;
  life.marriage.harmony = clamp(life.marriage.harmony + delta, 0, 100);
  const spouse = spouseNpc(life);
  if (spouse) spouse.affinity = clamp(spouse.affinity + delta / 2, 0, 100);
}

function divorce(life) {
  const spouse = (life.npcs ?? []).find((npc) => npc.id === life.spouseId);
  if (spouse) {
    spouse.maritalStatus = "離別";
    spouse.relationship = "元配偶者";
    npcNote(life, spouse, "離婚した");
  }
  life.spouse = null;
  life.spouseId = null;
  life.marriage = null;
  life.pregnancy = null;
  life.familyCount = Math.max(0, life.familyCount - 1);
  life.historyFlags = life.historyFlags.filter((flag) => flag !== "married");
  addFlag(life, "divorced");
  life.widowedAt = life.age;
}

function femalePartner(life) {
  if (life.gender === "女性") {
    return { humanAge: life.age, race: life.race.id };
  }
  const spouse = spouseNpc(life);
  return spouse?.gender === "女性" ? { humanAge: spouse.humanAge, race: spouse.race } : null;
}

function fertility(humanAge) {
  return TUNING.annualConceptionChanceByAge.find((entry) => humanAge <= entry.until)?.chance ?? 0;
}

function childRetryDelay(random) {
  const [minimum, maximum] = TUNING.childRetryYears;
  return minimum + random() * (maximum - minimum);
}

function advancePregnancy(life, random, months) {
  if (!life.spouseId) return;
  const spouse = spouseNpc(life);
  if (!spouse) return;
  if (life.pregnancy) {
    if (life.age >= life.pregnancy.dueAt) {
      const pregnancy = life.pregnancy;
      life.pregnancy = null;
      const child = createNpc(life, random, {
        relationship: "子", humanAge: 0, occupation: "幼児", affinity: 75, maritalStatus: "未婚",
        wealth: 0, race: pregnancy.motherRace ?? life.race.id, firstContact: "誕生",
      });
      child.parentId = "protagonist";
      if (life.peerageTitle || life.status?.name === "貴族" || life.status?.name === "王族") {
        child.legalStatus = "貴族";
      }
      child.humanAge = 0;
      child.age = 0;
      life.children.push(child.id);
      child.baseStats = rollAdultBaseline(child.race, random);
      child.mana = rollMana(child.race, random);
      life.familyCount += 1;
      life.childPlan = "later";
      life.nextChildAskAt = life.age + childRetryDelay(random);
      life.tryingSince = null;
      life.tryingUntil = null;
      life.tryingMotherAge = null;
      life.gold = Math.max(0, life.gold - 3);
      recordGold(life, "出産・育児の準備", -3);
      addFlag(life, "has-child");
      appendEvent(life, `${spouse.name}との間に子の${child.name}が生まれた。`, "life", "出産", `childbirth-${child.id}`);
    }
    return;
  }
  if (life.childPlan !== "wants") return;
  const mother = femalePartner(life);
  const attemptStartAge = life.tryingMotherAge ?? mother?.humanAge ?? Infinity;
  if (!mother || attemptStartAge > TUNING.childDecisionMaxHumanAge) {
    life.childPlan = "later";
    life.nextChildAskAt = Infinity;
    return;
  }
  const attemptAge = Math.min(attemptStartAge + life.age - (life.tryingSince ?? life.age), TUNING.childDecisionMaxHumanAge);
  const chance = 1 - (1 - fertility(attemptAge)) ** (1 / 12);
  for (let month = 0; month < months; month += 1) {
    if (random() < chance) {
      life.pregnancy = {
        since: life.age,
        dueAt: life.age + 0.75,
        motherRace: TUNING.childRaceInheritance === "mother" ? mother.race : life.race.id,
      };
      appendEvent(life, `${spouse.name}が子を身ごもったと分かった。`, "life", "家族", `pregnancy-${Math.floor(life.age * 4)}`);
      return;
    }
  }
  if (life.age >= (life.tryingUntil ?? Infinity)) {
    life.childPlan = "later";
    life.nextChildAskAt = life.age + childRetryDelay(random);
    life.tryingSince = null;
    life.tryingUntil = null;
    life.tryingMotherAge = null;
    appendEvent(life, "この一年は子を授からなかった。しばらく後に、改めて話し合うことにした。", "life", "家族", `conception-not-this-year-${Math.floor(life.age)}`);
  }
}

// ---------------------------------------------------------------- education and mentors

function startTraining(life, random, plan) {
  if (life.trainingPlan) finishTraining(life, random, { early: true, silent: true });
  const mentor = plan.mentor ?? null;
  life.trainingPlan = {
    kind: plan.kind, name: plan.name, skill: plan.skill, graduateTo: plan.graduateTo ?? null,
    reason: plan.reason ?? null, mentorName: mentor?.name ?? null, learning: plan.learning,
  };
  life.trainingSkill = plan.skill;
  life.trainingEndsAt = plan.years == null ? null : life.age + plan.years;
  life.educationStatus = plan.status;
  life.school = plan.school ?? null;
  life.mentor = mentor?.id ?? null;
  setSkillPractice(life, plan.skill, plan.activity, plan.learning);
  life.educationHistory ??= [];
  life.educationHistory.push({
    kind: plan.kind, name: plan.name, skill: plan.skill, startAge: life.age, endAge: null,
    mentor: mentor?.name ?? null, learning: plan.learning, outcome: null,
  });
  if (plan.occupation) changeOccupation(life, plan.occupation, plan.occupationReason ?? plan.name);
  if (mentor) {
    life.relationships.push({ type: "mentor", npcId: mentor.id, since: life.age });
    npcNote(life, mentor, `${skillName(plan.skill)}の師となった`);
  }
}

function finishTraining(life, random, { early = false, silent = false } = {}) {
  const plan = life.trainingPlan;
  if (!plan) {
    life.trainingEndsAt = null;
    return;
  }
  if (life.skillPractice) delete life.skillPractice[plan.skill];
  const entry = [...(life.educationHistory ?? [])].reverse().find((item) => item.endAge == null);
  if (entry) {
    entry.endAge = life.age;
    entry.outcome = early ? "中断" : plan.kind === "academy" ? "卒業" : "修了";
  }
  const mentor = (life.npcs ?? []).find((npc) => npc.id === life.mentor);
  if (mentor && mentor.alive) {
    mentor.relationship = "かつての師匠";
    npcNote(life, mentor, "指導を終えた");
  }
  life.educationStatus = early ? "修行を中断" : plan.kind === "academy" ? "学院を卒業" : "修行を修了";
  life.school = null;
  life.mentor = null;
  life.trainingSkill = null;
  life.trainingEndsAt = null;
  life.trainingPlan = null;
  let text;
  if (!early && plan.graduateTo) {
    changeOccupation(life, plan.graduateTo, plan.reason ?? `${plan.name}を終えて就職`);
    text = `${plan.name}を終え、${plan.graduateTo}として歩み始めた。習得した${skillName(plan.skill)}技能は${Math.round(life.skills[plan.skill] ?? 0)}。`;
  } else if (early && TRAINEE_OCCUPATIONS.includes(life.occupation)) {
    changeOccupation(life, "家業の手伝い", "修行の中断により家業へ戻る");
    text = `${plan.name}は途中で打ち切られ、家業を手伝う暮らしに戻った。`;
  } else {
    text = early ? `${plan.name}は途中で終わった。` : `${plan.name}を修了した。習得した${skillName(plan.skill)}技能は${Math.round(life.skills[plan.skill] ?? 0)}。`;
  }
  if (!silent) appendEvent(life, text, "life", "教育", `edu-finish-${plan.kind}-${Math.floor(life.age)}`);
}

// Result of an academy application: tuition, funding route, and any reason it is closed.
function academyFunding(life, kind) {
  const config = {
    magic: { fee: 60, years: ACADEMY_YEARS.magic, threshold: TUNING.scholarshipThresholds.magic, aptitude: life.mana, label: "魔術学院" },
    knight: { fee: 50, years: ACADEMY_YEARS.knight, threshold: TUNING.scholarshipThresholds.knight, aptitude: currentStats(life).combat, label: "騎士学院" },
    scholar: { fee: 40, years: ACADEMY_YEARS.scholar, threshold: TUNING.scholarshipThresholds.scholar, aptitude: currentStats(life).intellect, label: "学術院" },
  }[kind];
  const stats = currentStats(life);
  const status = life.status?.name ?? "平民";
  if (status === "奴隷") return { reason: "奴隷の身分では入学を許されない" };
  if (status === "無戸籍・流民") return { reason: "戸籍がなく入学を認められない" };
  let eligible = true;
  let scholarship = config.aptitude >= config.threshold && life.gold < config.fee;
  if (kind === "magic") {
    eligible = life.mana >= 20;
    if (!eligible) return { reason: `魔力の素質が足りない（必要: 普通以上、あなた: ${magicTier(life.mana)}）` };
  } else if (kind === "knight") {
    eligible = ["王族", "貴族", "都市平民"].includes(status) || stats.combat >= 75;
    if (!eligible) return { reason: "騎士学院は貴族・市民の子、または領主の推薦が必要" };
  }
  if (["王族", "貴族"].includes(status)) return { cost: 0, via: "家が学費を負担", label: config.label };
  if (scholarship) {
    return {
      cost: 0,
      loan: config.fee + config.years * TUNING.scholarshipLivingCostLegacyG,
      via: "適性条件を満たす無利子奨学金貸与",
      label: config.label,
    };
  }
  if (life.gold >= config.fee) return { cost: config.fee, via: "学費を支払う", label: config.label };
  if (status === "農民・労働者" || life.gold < config.fee) {
    return { reason: `学費${config.fee}Gが必要（所持金${Math.floor(life.gold)}G。奨学金・推薦の条件も満たしていない）`, cost: config.fee };
  }
  return { cost: config.fee, via: "学費を支払う", label: config.label };
}

function mentorQuality(random) {
  return random() < 0.12 ? { label: "一流の師匠", learning: 2 } : { label: "良い師匠", learning: 1.4 };
}

const STATUS_BARRED = ["奴隷", "無戸籍・流民"];
const POOR_STATUS = ["奴隷"];
const ACADEMY_YEARS = Object.freeze({ magic: 6, knight: 5, scholar: 6 });

function ruleCost(life, rule) {
  return typeof rule.cost === "function" ? rule.cost(life) : rule.cost ?? 0;
}

const toSilver = (value) => Math.round(value * TUNING.currency.silverPerLegacyG);
const silver = (value) => `${toSilver(value)}銀貨`;
const toSilverText = (text) => String(text).replace(/(-?[\d,]+(?:\.\d+)?)G/g, (_, amount) => silver(Number(amount.replaceAll(",", ""))));
const gold = (value) => silver(value);

function businessChance(life, size) {
  const skill = life.skills?.[life.occupation === "農作業" ? "farming" : "trade"] ?? 0;
  const base = TUNING.business[size].chance;
  const adjustment = clamp((skill - 50) / 50, -1, 1) * TUNING.business.skillAdjustmentMax;
  return clamp(base + adjustment, TUNING.business.minimumChance, TUNING.business.maximumChance);
}

// Cost, availability, and the information shown to the player before choosing.
const CHOICE_RULES = {
  "edu-town-school": {
    cost: 0,
    check: (life) => (STATUS_BARRED.includes(life.status?.name) ? "身分の制限で町の教室に通えない" : null),
    preview: () => ["費用: 無料", "成長する技能: 読み書き", "期間: 人間換算4年間", "環境: 通常の教室（学習環境×1.0）", "メリット: 読み書きの基礎が身につく"],
  },
  "edu-tutor": {
    cost: 12,
    check: (life) => (STATUS_BARRED.includes(life.status?.name) ? "身分の制限で家庭教師を雇えない" : null),
    preview: () => ["費用: 12G", "成長する技能: 読み書き", "期間: 12歳ごろまで", "環境: 良い師匠（学習環境×1.4）", "メリット: 早く確実に学べる", "デメリット: 費用が高い"],
  },
  "edu-family-work": {
    preview: () => ["費用: なし", "成長する技能: 肉体労働・読み書き（独学）", "メリット: 家計を助けられる", "デメリット: 読み書きの習得が遅い"],
  },
  "edu-start-work": {
    check: (life) => (life.age < 10 ? "まだ幼すぎて働けない" : null),
    preview: () => ["費用: なし", "メリット: 早く収入を得られる", "デメリット: 教育を受ける機会を失う", "条件: 10歳以上"],
  },
  "apprentice-magic": {
    cost: 12,
    check: (life) => (STATUS_BARRED.includes(life.status?.name) ? "身分の制限で弟子入りできない"
      : life.mana < 1 ? "魔力の素質がなく、魔術師は弟子に取らない" : null),
    preview: (life) => ["費用: 12G", "成長する技能: 魔術", "期間: 約6年", `素質: 魔力${magicTier(life.mana)}`, "環境: 良い師匠（学習環境×1.4、一流の師なら×2.0）", "メリット: 魔術を習得し、魔術師の道が開ける", "デメリット: 修行中は収入が得られない"],
  },
  "apprentice-sword": {
    cost: 8,
    check: (life) => (STATUS_BARRED.includes(life.status?.name) ? "身分の制限で弟子入りできない" : null),
    preview: () => ["費用: 8G", "成長する技能: 剣術", "期間: 約5年", "環境: 良い師匠（学習環境×1.4）", "メリット: 兵士・騎士への道が開ける", "デメリット: 修行は厳しく、収入が得られない", "危険度: やや高い"],
  },
  "apprentice-craft": {
    cost: 4,
    check: (life) => (life.status?.name === "奴隷" ? "身分の制限で弟子入りできない" : null),
    preview: () => ["費用: 4G", "成長する技能: 鍛冶（ドワーフは適性あり）", "期間: 約4年間は親方の指導", "環境: 良い師匠（学習環境×1.4）", "メリット: 職人としての技が身につく", "デメリット: 見習いの収入は少ない"],
  },
  "apprentice-tailor": {
    cost: 4,
    check: (life) => (life.status?.name === "奴隷" ? "身分の制限で弟子入りできない" : null),
    preview: () => ["費用: 4G", "成長する技能: 裁縫", "期間: 約4年間は親方の指導", "環境: 良い師匠（学習環境×1.4）", "メリット: 服飾職人の技が身につく", "デメリット: 見習いの収入は少ない"],
  },
  "apprentice-family": {
    preview: () => ["費用: なし", "メリット: 家業を継ぐ準備ができる", "デメリット: 外の世界を知る機会が減る"],
  },
  "apprentice-general": {
    preview: () => ["費用: なし", "期間: 人間換算5年間", "良い師匠から職業技能を学ぶ", "見習いとして働きながら技術を身につける"],
  },
  "path-academy": {
    preview: () => ["費用: なし", "入学条件を満たす学院の選考へ進む", "身分・適性・費用によって進学先が限られる"],
  },
  "apprentice-work": {
    preview: () => ["費用: なし", "メリット: すぐに収入を得られる", "デメリット: 師匠や学院での指導は受けられない"],
  },
  "academy-magic": {
    cost: (life) => academyFunding(life, "magic").cost ?? 60,
    check: (life) => academyFunding(life, "magic").reason ?? null,
    preview: (life) => {
      const funding = academyFunding(life, "magic");
      return [`${funding.loan ? `無利子貸与: ${gold(funding.loan)}` : `費用: ${gold(funding.cost ?? 60)}`}（${funding.via ?? "要確認"}）`, "成長する技能: 魔術", `期間: 人間換算${ACADEMY_YEARS.magic}年間`, "環境: 専門学院（学習環境×1.6、集中訓練×1.3）", "メリット: 魔術を体系的に学べる", "デメリット: 在学中は収入がない"];
    },
  },
  "academy-knight": {
    cost: (life) => academyFunding(life, "knight").cost ?? 50,
    check: (life) => academyFunding(life, "knight").reason ?? null,
    preview: (life) => {
      const funding = academyFunding(life, "knight");
      return [`${funding.loan ? `無利子貸与: ${gold(funding.loan)}` : `費用: ${gold(funding.cost ?? 50)}`}（${funding.via ?? "要確認"}）`, "成長する技能: 剣術", `期間: 人間換算${ACADEMY_YEARS.knight}年間`, "環境: 専門学院（学習環境×1.6、集中訓練×1.3）", "メリット: 騎士・士官への道が開ける", "デメリット: 在学中は収入がない"];
    },
  },
  "academy-scholar": {
    cost: (life) => academyFunding(life, "scholar").cost ?? 40,
    check: (life) => academyFunding(life, "scholar").reason ?? null,
    preview: (life) => {
      const funding = academyFunding(life, "scholar");
      return [`${funding.loan ? `無利子貸与: ${gold(funding.loan)}` : `費用: ${gold(funding.cost ?? 40)}`}（${funding.via ?? "要確認"}）`, "成長する技能: 学術", `期間: 人間換算${ACADEMY_YEARS.scholar}年間`, "環境: 専門学院（学習環境×1.6、集中訓練×1.3）", "メリット: 学者・教師の道が開ける", "デメリット: 在学中は収入がない"];
    },
  },
  "academy-skip": { preview: () => ["費用: なし", "学院には進まず、これまでの道を続ける"] },
  "ore-contract": {
    cost: 8,
    preview: (life) => ["費用: 8G（材料費）", "成長する技能: 職人技能", "危険度: 中（器用さと技能で成功率が決まる）", `あなたの器用さ: ${Math.round(life.dexterity ?? 50)}`, "メリット: 成功すれば報酬20Gと評判", "デメリット: 失敗すると材料費を失う"],
  },
  "guild-exam": {
    cost: 5,
    preview: () => ["費用: 5G（受験料）", "合否は現在の技能に左右される", "メリット: 合格すれば資格と評判", "デメリット: 不合格なら受験料は戻らない"],
  },
  "borrow-for-trade": {
    check: (life) => (life.debt + 10 > TUNING.ordinaryDebtLimit ? "通常借入の上限に達している" : null),
    preview: () => ["費用: なし（借金+10G）", "メリット: すぐに6Gが手元に入る", "デメリット: 利息が毎月かかる"],
  },
  "risky-contract": {
    preview: () => ["費用: なし", "危険度: 高い", "メリット: 成功すれば報酬12G", "デメリット: 負傷して療養する可能性"],
  },
  "medical-treatment": {
    cost: 6,
    preview: () => ["費用: 6G", "メリット: 体調が回復する", "デメリット: 費用がかかる"],
  },
  "illness-ordinary-treatment": {
    cost: (life) => TUNING.treatmentCosts.ordinary[life.illness?.severity] ?? 5,
    preview: (life, cost) => [
      `通常医療費: ${gold(cost)}`,
      `病名: ${life.illness?.name ?? "病気"}`,
      `基本成功率: ${Math.round((TUNING.treatmentSuccess[life.illness?.type]?.ordinary ?? 0) * 100)}%`,
      "失敗しても直ちに死亡するわけではなく、療養を続ける。",
    ],
  },
  "illness-magic-treatment": {
    cost: (life) => TUNING.treatmentCosts.magic[life.illness?.severity] ?? 25,
    preview: (life, cost) => [
      `魔法医療費: ${gold(cost)}`,
      `病名: ${life.illness?.name ?? "病気"}`,
      `基本成功率: ${Math.round((TUNING.treatmentSuccess[life.illness?.type]?.magic ?? 0) * 100)}%`,
      "成功率は病気ごとに異なり、老化そのものは治せない。",
    ],
  },
  "illness-home-care": { preview: () => ["費用: なし", "治療を受けず、療養を続ける"] },
  "illness-no-treatment": { preview: () => ["費用: なし", "治療を受けない。自然回復は保証されない"] },
  "sequela-recovery": {
    cost: TUNING.sequelaRecovery.cost,
    check: (life) => (life.sequelae?.some((item) => !item.recoveryAttempted) ? null : "回復を試せる後遺症がない"),
    preview: () => [`費用: ${gold(TUNING.sequelaRecovery.cost)}`, `基本成功率: ${Math.round(TUNING.sequelaRecovery.chance * 100)}%`, "後遺症ごとに一度だけ挑戦できる"],
  },
  "train-magic": {
    cost: 7,
    check: (life) => (life.mana < 1 ? "魔力の素質がない" : null),
    preview: () => ["費用: 7G（授業料）", "成長する技能: 魔術", "期間: 約5年", "環境: 良い師匠（学習環境×1.4）", "メリット: 魔術が体系的に身につく"],
  },
  "self-study-magic": {
    check: (life) => (life.mana < 1 ? "魔力の素質がない" : null),
    preview: () => ["費用: なし", "成長する技能: 魔術", "環境: 独学（学習環境×0.6）", "デメリット: 成長が遅い"],
  },
  "join-guard": { preview: () => ["費用: なし", "危険度: 高い", "メリット: 報酬6Gと名声", "デメリット: 戦いに巻き込まれる危険"] },
  "join-expedition": {
    cost: 4,
    preview: () => ["費用: 4G（装備代）", "危険度: 高い", "メリット: 成功すれば報酬18Gと名声", "デメリット: 負傷して療養する可能性"],
  },
  "commit-romance": {
    preview: (life) => {
      const partner = (life.npcs ?? []).find((npc) => npc.id === life.romanticPartnerId);
      return ["費用: なし", `相手の親密度: ${Math.round(partner?.affinity ?? 0)}`, "成否: 相手の気持ちと事情しだい（断られることもある）"];
    },
  },
  "marry": { preview: () => ["費用: 3G（式と新居の準備）", "メリット: 共働きで家計が助かるが、生活費も増える", "成否: 相手が応じるとは限らない"], cost: 3 },
  "accept-arranged": { preview: () => ["費用: 3G", "相手: 家同士が決めた縁談", "デメリット: 夫婦の信頼は低いところから始まる"], cost: 3 },
  "decline-arranged": { preview: () => ["費用: なし", "家族との関係がぎくしゃくする可能性"] },
  "children-yes": { preview: () => ["費用: なし（出産時に3G、子の生活費が毎月かかる）", "授かるかどうかは時の運", "メリット: 家族が増える"] },
  "children-later": { preview: () => ["費用: なし", "数年後に、もう一度考える機会がある"] },
  "children-never": { preview: () => ["費用: なし", "今後、子供を持つかどうかは尋ねられなくなる"] },
  "divorce": { cost: 6, preview: () => ["費用: 6G（財産分与の手続き）", "配偶者との婚姻が終わる", "子の生活費などは家計に残る"] },
  "mend-marriage": { cost: 3, preview: () => ["費用: 3G", "夫婦関係の改善を目指す", "成果は保証されない"] },
  "buy-home-choice": { cost: 40, preview: () => ["費用: 40G", "メリット: 家賃が軽くなる", "デメリット: 蓄えが大きく減る"] },
  "buy-home-small": { cost: TUNING.homePricesLegacyG.small, preview: () => [`費用: ${gold(TUNING.homePricesLegacyG.small)}`, "家賃が不要になる"] },
  "buy-home-large": { cost: TUNING.homePricesLegacyG.large, preview: () => [`費用: ${gold(TUNING.homePricesLegacyG.large)}`, "家賃が不要になる"] },
  "buy-home-estate": { cost: TUNING.homePricesLegacyG.estate, preview: () => [`費用: ${gold(TUNING.homePricesLegacyG.estate)}`, "家賃が不要になる"] },
  "sell-home": { preview: (life) => [`売却額: ${gold((life.homeValue ?? 0) * ((TUNING.homeResaleRange[0] + TUNING.homeResaleRange[1]) / 2))}程度`, "購入額の70〜90%で売却し、借家に戻る"] },
  "open-shop-choice": {
    cost: 30,
    preview: () => ["費用: 30G", "メリット: 工房主として高い収入を目指せる", "デメリット: 蓄えが減り、経営に責任を負う"],
  },
  "support-family": {
    cost: 10,
    check: (life) => (livingParents(life).length === 0 ? "支援できる親が存命でない" : null),
    preview: () => ["費用: 10G", "メリット: 家族との関係が深まる"],
  },
  "repay-debt": {
    cost: (life) => Math.min(Math.floor(life.gold), Math.ceil(life.debt)),
    check: (life) => (life.debt <= 0 ? "返す借金がない" : null),
    preview: (life, cost) => [`費用: ${gold(cost)}`, `借金残高: ${Math.ceil(life.debt)}G`, "メリット: 毎月の利息が減る"],
  },
  "invest-trade": {
    cost: 15,
    preview: () => ["費用: 15G", "危険度: 中", "メリット: 当たれば大きな利益", "デメリット: 外れると資金を失う"],
  },
  "business-expand:small": { cost: TUNING.business.small.cost, check: (life) => (life.businessExpansionCount >= TUNING.business.maximumExpansions ? "事業拡大は3回まで" : null), preview: (life) => [`費用: ${gold(TUNING.business.small.cost)}`, `成功率: ${Math.round(businessChance(life, "small") * 100)}%（基本60%）`, "失敗時の損失: 投資額全額", `成功時の月収増: ${gold(TUNING.business.small.revenue)}`] },
  "business-expand:medium": { cost: TUNING.business.medium.cost, check: (life) => (life.businessExpansionCount >= TUNING.business.maximumExpansions ? "事業拡大は3回まで" : null), preview: (life) => [`費用: ${gold(TUNING.business.medium.cost)}`, `成功率: ${Math.round(businessChance(life, "medium") * 100)}%（基本45%）`, "失敗時の損失: 投資額の65%", `成功時の月収増: ${gold(TUNING.business.medium.revenue)}`] },
  "business-expand:large": { cost: TUNING.business.large.cost, check: (life) => (life.businessExpansionCount >= TUNING.business.maximumExpansions ? "事業拡大は3回まで" : null), preview: (life) => [`費用: ${gold(TUNING.business.large.cost)}`, `成功率: ${Math.round(businessChance(life, "large") * 100)}%（基本30%）`, "失敗時の損失: 投資額の40%", `成功時の月収増: ${gold(TUNING.business.large.revenue)}`] },
  "buy-gear": {
    cost: 10,
    preview: () => ["費用: 10G", "メリット: 危険な仕事で命を落としにくくなる", "成長する技能: 仕事の技能が少し上がる"],
  },
};

const hasPartner = (life) => (life.npcs ?? []).some((npc) => npc.id === life.romanticPartnerId && npc.alive);
const training = (life) => Boolean(life.trainingPlan);
const academyOptions = (life) => ["magic", "knight", "scholar"].some((kind) => !academyFunding(life, kind).reason);

export const CHOICE_EVENTS = [
  {
    id: "edu-childhood", title: "学びのはじまり", category: "幼少期・教育", weight: 5, priority: true,
    requirements: { minAge: 6, maxAge: 12, oncePerLife: true, excludeRaceIds: ["dragon"], custom: (life) => !training(life) },
    copy: "読み書きを身につける年頃になった。家の事情を考えながら、学び方を決めよう。",
    choices: [
      { label: "町の教室に通う", effect: "edu-town-school" },
      { label: "家庭教師から学ぶ", effect: "edu-tutor" },
      { label: "家業を手伝いながら独学する", effect: "edu-family-work" },
      { label: "教育を受けず、働き始める", effect: "edu-start-work" },
    ],
  },
  {
    id: "edu-apprenticeship", title: "進路を決める", category: "幼少期・教育", weight: 4, priority: true,
    requirements: { minAge: 12, maxAge: 15, oncePerLife: true, excludeRaceIds: ["dragon"], occupations: ["まだ幼い子ども", "家業の手伝い"], custom: (life) => !training(life) },
    copy: "人間換算12〜15歳になった。家業を手伝う、職業見習いに入る、学院を目指す、の三つから進路を選ぶ。",
    choices: [
      { label: "家業を手伝う", effect: "apprentice-family" },
      { label: "職業見習いに入る", effect: "apprentice-general" },
      { label: "学院を目指す", effect: "path-academy" },
    ],
  },
  {
    id: "edu-academy", title: "学院からの案内", category: "幼少期・教育", weight: 3, priority: true,
    requirements: {
      minAge: 14, maxAge: 19, oncePerLife: true, excludeRaceIds: ["dragon"],
      custom: (life) => !training(life) && !STATUS_BARRED.includes(life.status?.name)
        && life.historyFlags?.includes("academy-aspirant"),
    },
    copy: "各地の学院が入学者を募っている。学費や推薦の有無で、入れる学院は変わる。",
    choices: [
      { label: "魔術学院に入学する", effect: "academy-magic" },
      { label: "騎士学院に入学する", effect: "academy-knight" },
      { label: "学術系の学院に入学する", effect: "academy-scholar" },
      { label: "学院には進まない", effect: "academy-skip" },
    ],
  },
  {
    id: "choice-ore-contract", title: "魔鉱石の加工依頼", category: "職業・昇進", weight: 1.3,
    requirements: { minAge: 18, minimumGold: 8, occupations: [...CRAFT_OCCUPATIONS, "工房主"] },
    copy: "魔鉱石を加工してほしいと依頼が届いた。材料費は8G。腕と器用さを頼りに受けるか、断るか。",
    choices: [{ label: "8Gを払って依頼を受ける", effect: "ore-contract" }, { label: "今回は依頼を断る", effect: "decline-contract" }],
  },
  {
    id: "choice-guild-exam", title: "組合の昇級試験", category: "職業・昇進", weight: 1,
    requirements: { minAge: 18, minimumGold: 5, minimumSkill: 25, occupations: CRAFT_OCCUPATIONS, requiresNotFlag: "guild-license" },
    copy: "組合から技能試験の案内が届いた。受験料を払って資格に挑戦するか、実務経験を積むか。",
    choices: [{ label: "受験料5Gを払い、試験に挑む", effect: "guild-exam" }, { label: "仕事を続けて腕を磨く", effect: "decline-exam" }],
  },
  {
    id: "choice-work-offer", title: "遠方からの仕事の誘い", category: "職業・昇進", weight: 1,
    requirements: { minAge: 20, occupations: ["農作業", ...CRAFT_OCCUPATIONS, "兵士", "商人", "冒険者", "教師"] },
    copy: "別の町から求人が届いた。応募条件を満たす仕事を選べるが、採用されるとは限らない。",
    choicesFor: (life) => {
      const literacy = life.skills?.literacy ?? 0;
      const trade = life.skills?.trade ?? 0;
      const academic = life.skills?.scholarship ?? 0;
      const magic = life.skills?.magic ?? 0;
      const offers = [{ tier: 1, job: "農作業", eligible: true }];
      if (literacy >= 10) offers.push({ tier: 2, job: "職人見習い", eligible: true });
      if (trade >= 20 || literacy >= 30) offers.push({ tier: 3, job: "商人", eligible: true });
      if (academic >= 60 && literacy >= 40) offers.push({ tier: 4, job: "教師", eligible: true });
      if (magic >= 80 && life.mana >= 20) offers.push({ tier: 5, job: "魔術師", eligible: true });
      return [
        ...offers.map(({ tier, job }) => ({
          label: `${job}に応募（採用率${Math.round(TUNING.jobAcceptanceRates[tier - 1] * 100)}%）`,
          effect: `job-application:${tier}:${job}`,
        })),
        { label: "今の仕事を続ける", effect: "steady" },
      ];
    },
  },
  {
    id: "choice-business-loan", title: "商人からの融資", category: "財産・借金", weight: 0.8,
    requirements: { minAge: 18, maximumGold: 18, custom: (life) => life.debt + 10 <= TUNING.ordinaryDebtLimit },
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
    id: "choice-repay-debt", title: "借金の返済", category: "財産・借金", weight: 1.2,
    requirements: { minAge: 18, minimumGold: 10, custom: (life) => life.debt >= 5, cooldownYears: 4 },
    copy: "まとまった手持ちができた。借金が利息を生み続けている。",
    choices: [{ label: "手持ちで借金を返す", effect: "repay-debt" }, { label: "返済は毎月の分だけにする", effect: "steady" }],
  },
  {
    id: "choice-buy-home", title: "家を持つ", category: "財産・借金", weight: 0.9,
    requirements: { minAge: 25, minimumGold: TUNING.homePricesLegacyG.small, custom: (life) => !life.ownsHome },
    copy: "貯えに応じた家が売りに出ている。借家を続けるか、家を買うか。",
    choicesFor: (life) => [
      ...(life.gold >= TUNING.homePricesLegacyG.small ? [{ label: `小さな家（${gold(TUNING.homePricesLegacyG.small)}）`, effect: "buy-home-small" }] : []),
      ...(life.gold >= TUNING.homePricesLegacyG.large ? [{ label: `広い家（${gold(TUNING.homePricesLegacyG.large)}）`, effect: "buy-home-large" }] : []),
      ...(life.gold >= TUNING.homePricesLegacyG.estate ? [{ label: `邸宅（${gold(TUNING.homePricesLegacyG.estate)}）`, effect: "buy-home-estate" }] : []),
      { label: "借家のまま蓄えを残す", effect: "save" },
    ],
  },
  {
    id: "choice-sell-home", title: "住まいを売る", category: "財産・借金", weight: 0.4,
    requirements: { minAge: 25, custom: (life) => Boolean(life.ownsHome), cooldownYears: 8 },
    copy: "家の維持費はかからないが、まとまった資金が必要なら売却できる。",
    choices: [{ label: "家を売る", effect: "sell-home" }, { label: "今の家に住み続ける", effect: "steady" }],
  },
  {
    id: "choice-open-shop", title: "自分の工房を開く", category: "職業・昇進", weight: 0.9,
    requirements: { minAge: 25, minimumGold: 30, minimumSkill: 50, occupations: CRAFT_OCCUPATIONS, oncePerLife: true },
    copy: "腕に自信がつき、独立の話が出た。工房を借りるには30Gが要る。",
    choices: [{ label: "30Gで工房を開く", effect: "open-shop-choice" }, { label: "親方のもとで働き続ける", effect: "steady" }],
  },
  {
    id: "choice-retirement", title: "これからの働き方", category: "職業・昇進", weight: 1, priority: true,
    requirements: {
      minAge: TUNING.retirementHumanAge, oncePerLife: true,
      custom: (life) => !NON_WORKING.includes(life.occupation) && !training(life)
        && !life.historyFlags?.includes("retirement-choice-resolved"),
    },
    {
      id: "choice-will", title: "遺言を残す", category: "財産・家族", weight: 0.65,
      requirements: { minAge: 60, cooldownYears: 8 },
      copy: "財産の行き先を決める遺言を無料で作成・変更できる。爵位や領地の継承先は変更できない。",
      choicesFor: (life) => {
        const spouse = spouseNpc(life);
        const children = livingChildren(life);
        const contacts = (life.npcs ?? []).filter((npc) => npc.alive && npc.id !== spouse?.id && !children.some((child) => child.id === npc.id));
        return [
          { label: "通常の相続にする", effect: "will-legal" },
          ...(spouse ? [{ label: `${spouse.name}に全額`, effect: "will-spouse" }] : []),
          ...(children.length ? [
            { label: `${[...children].sort((a, b) => b.humanAge - a.humanAge)[0].name}に全額`, effect: "will-oldest-child" },
            { label: "存命の子供全員に均等", effect: "will-equal-children" },
          ] : []),
          ...contacts.map((npc) => ({ label: `${npc.name}に全額を遺す`, effect: `will-person:${npc.id}` })),
          { label: "教会へ寄付", effect: "will-charity:教会" },
          { label: "慈善団体へ寄付", effect: "will-charity:慈善団体" },
          { label: "国へ寄付", effect: "will-charity:国家" },
        ];
      },
    },
    copy: "人間換算で65歳を迎えた。仕事を退くか、続けるか、別の道へ移るかを選べる。",
    choices: [
      { label: "今の仕事を退く", effect: "retire-now" },
      { label: "今の仕事を続ける", effect: "keep-working" },
      { label: "別の仕事へ移る", effect: "retire-career-change" },
    ],
  },
  {
    id: "choice-promotion-offer", title: "昇進の打診", category: "職業・昇進", weight: 1, priority: true,
    requirements: {
      minAge: 18, cooldownYears: TUNING.promotionRetryYears,
      custom: (life) => Boolean(nextPromotionStep(life)),
    },
    copy: (life) => `「${nextPromotionStep(life)?.role ?? "上位職"}」への昇進選考を受ける条件を満たした。選考に挑むか、今の役職を続けるか決める。`,
    choices: [
      { label: "昇進選考に挑戦する", effect: "promotion-apply" },
      { label: "今回は見送る", effect: "promotion-decline" },
    ],
  },
  {
    id: "choice-invest-trade", title: "商売への投資", category: "財産・借金", weight: 0.9,
    requirements: { minAge: 20, minimumGold: TUNING.business.small.cost, occupations: ["農作業", "商人"], cooldownYears: 4, custom: (life) => (life.businessExpansionCount ?? 0) < TUNING.business.maximumExpansions },
    copy: "事業を広げるための投資話が届いた。規模を大きくするほど必要資金と失敗時の損失も増える。",
    choices: [
      { label: `小規模（${gold(TUNING.business.small.cost)}）`, effect: "business-expand:small" },
      { label: `中規模（${gold(TUNING.business.medium.cost)}）`, effect: "business-expand:medium" },
      { label: `大規模（${gold(TUNING.business.large.cost)}）`, effect: "business-expand:large" },
      { label: "今回は見送る", effect: "steady" },
    ],
  },
  {
    id: "choice-buy-gear", title: "装備を新調する", category: "財産・借金", weight: 0.9,
    requirements: { minAge: 18, minimumGold: 10, occupations: ["兵士", "冒険者"], requiresNotFlag: "good-gear" },
    copy: "武器や防具が傷んできた。新しい装備を整えるか、今あるもので凌ぐか。",
    choices: [{ label: "10Gで装備を整える", effect: "buy-gear" }, { label: "今の装備を使い続ける", effect: "steady" }],
  },
  {
    id: "choice-support-family", title: "家族への仕送り", category: "家族・人間関係", weight: 0.8,
    requirements: { minAge: 22, minimumGold: 10, custom: (life) => livingParents(life).length > 0, cooldownYears: 6 },
    copy: "年老いてきた親の暮らし向きが気になる。支援するか、自分の暮らしを優先するか。",
    choices: [{ label: "10Gを送って支援する", effect: "support-family" }, { label: "今は自分の暮らしを優先する", effect: "save" }],
  },
  {
    id: "choice-romance", title: "大切な人への告白", category: "恋愛・結婚", weight: 1.2, priority: true,
    requirements: { minAge: 18, requiresFlag: "romantic-partner", requiresNotFlag: "committed-relationship", cooldownYears: 3, custom: hasPartner },
    copy: (life) => {
      const partner = (life.npcs ?? []).find((npc) => npc.id === life.romanticPartnerId);
      return `${partner?.name ?? "親しくなった相手"}（${partner?.occupation ?? ""}）に気持ちを伝える機会が訪れた。関係を一歩進めるか、今の友情を大切にするか。`;
    },
    choices: [{ label: "自分の気持ちを伝える", effect: "commit-romance" }, { label: "焦らず友人として付き合う", effect: "keep-friendship" }],
  },
  {
    id: "choice-family-home", title: "二人の新しい暮らし", category: "恋愛・結婚", weight: 1.2, priority: true,
    requirements: { minAge: 18, requiresFlag: "committed-relationship", requiresNotFlag: "married", custom: hasPartner },
    copy: (life) => {
      const partner = (life.npcs ?? []).find((npc) => npc.id === life.romanticPartnerId);
      return `${partner?.name ?? "相手"}と暮らしを共にする話が持ち上がった。結婚して家を構えるか、時期を待つか。`;
    },
    choices: [{ label: "結婚を申し込む", effect: "marry" }, { label: "もう少し準備を続ける", effect: "wait-to-marry" }],
  },
  {
    id: "choice-arranged-marriage", title: "縁談の話", category: "恋愛・結婚", weight: 0.7,
    requirements: {
      minAge: 20, maxAge: 50, requiresNotFlag: "married", cooldownYears: 8,
      custom: (life) => !life.romanticPartnerId && !STATUS_BARRED.includes(life.status?.name)
        && (life.age - (life.widowedAt ?? -99) > 2)
        && (["王族", "貴族"].includes(life.status?.name) || life.age >= 26),
    },
    prepare: (life, random, decision) => {
      const candidate = createNpc(life, random, {
        relationship: "見合い相手", humanAge: life.age + (random() - 0.5) * 8, maritalStatus: "未婚", affinity: 35,
        firstContact: "縁談で引き合わされた",
      });
      decision.npcId = candidate.id;
      decision.copy = `家同士の縁で、${candidate.name}（${raceById(candidate.race).name}・${candidate.age}歳・${candidate.occupation}・${candidate.personality}）との縁談が持ち込まれた。会ったばかりの相手だが、家の事情もある。`;
    },
    copy: "縁談が持ち込まれた。",
    choices: [{ label: "縁談を受け入れ、結婚する", effect: "accept-arranged" }, { label: "縁談を断る", effect: "decline-arranged" }],
  },
  {
    id: "choice-children", title: "子供について", category: "恋愛・結婚", weight: 1, priority: true,
    requirements: {
      minAge: 18, requiresFlag: "married",
      custom: (life) => Boolean(life.spouseId) && life.childPlan !== "none" && life.childPlan !== "wants" && !life.pregnancy
        && life.age >= (life.nextChildAskAt ?? 0)
        && (femalePartner(life)?.humanAge ?? Infinity) <= TUNING.childDecisionMaxHumanAge,
    },
    copy: (life) => `${life.spouse ?? "配偶者"}と、これからの家族について話し合うことになった。子供を持つかどうか、二人の意思で決められる。`,
    choices: [
      { label: "子供を持ちたい", effect: "children-yes" },
      { label: "今はまだいい", effect: "children-later" },
      { label: "子供はもう持たない", effect: "children-never" },
    ],
  },
  {
    id: "choice-marriage-crisis", title: "冷え切った夫婦", category: "恋愛・結婚", weight: 1.5, priority: true,
    requirements: { minAge: 20, requiresFlag: "married", cooldownYears: 5, custom: (life) => Boolean(life.spouseId) && (life.marriage?.harmony ?? 100) < 36 },
    copy: (life) => `${life.spouse ?? "配偶者"}との溝が深まり、夫婦の関係は冷え切っている。このまま続けるか、向き合うか、別れるか。`,
    choices: [{ label: "関係の修復に努める", effect: "mend-marriage" }, { label: "離婚する", effect: "divorce" }, { label: "距離を置いたまま続ける", effect: "endure-marriage" }],
  },
  {
    id: "choice-illness-treatment", title: "病気の治療", category: "病気・事故", weight: 1, priority: true,
    requirements: {
      minAge: 16, healthStates: ["療養中"],
      custom: (life) => life.illness && life.illness.severity !== "軽症",
    },
    copy: (life) => `${life.illness?.name ?? "病気"}（${life.illness?.severity ?? "症状あり"}）の治療をどうするか決める。治療に失敗しても即座に命を落とすわけではない。`,
    choices: [
      { label: "通常医療を受ける", effect: "illness-ordinary-treatment" },
      { label: "高価な魔法医療を受ける", effect: "illness-magic-treatment" },
      { label: "自宅で療養する", effect: "illness-home-care" },
      { label: "治療を受けない", effect: "illness-no-treatment" },
    ],
  },
  {
    id: "choice-sequela-recovery", title: "後遺症の回復を試みる", category: "病気・事故", weight: 0.35,
    requirements: { minAge: 18, cooldownYears: 6, custom: (life) => life.sequelae?.some((item) => !item.recoveryAttempted) },
    copy: "残った後遺症を専門治療で回復できる可能性がある。後遺症ごとに挑戦は一度だけ。",
    choices: [
      { label: "専門治療を受ける", effect: "sequela-recovery" },
      { label: "今の状態を受け入れる", effect: "steady" },
    ],
  },
  {
    id: "choice-magic-training", title: "魔法の師との出会い", category: "魔法・種族固有", weight: 0.8,
    requirements: { minAge: 12, minimumGold: 7, requiresFlag: "awakened-magic", custom: (life) => life.mana >= 1 && !training(life) },
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

export function availableChoiceEvents(life) {
  return CHOICE_EVENTS.filter((event) => isRoutineEventEligible(life, event));
}

function decorateChoice(life, choice) {
  const rule = CHOICE_RULES[choice.effect] ?? CHOICE_RULES[choice.effect.split(":")[0]];
  if (!rule) return { ...choice };
  const cost = ruleCost(life, rule);
  let disabledReason = rule.check?.(life) ?? null;
  if (!disabledReason && cost > life.gold) disabledReason = `所持金が足りない（必要${silver(cost)}／所持${silver(Math.floor(life.gold))}）`;
  return { ...choice, cost, preview: rule.preview?.(life, cost) ?? [], disabledReason };
}

export function choiceAvailability(life, effect) {
  const rule = CHOICE_RULES[effect] ?? CHOICE_RULES[effect.split(":")[0]];
  if (!rule) return { cost: 0, disabledReason: null };
  const cost = ruleCost(life, rule);
  let disabledReason = rule.check?.(life) ?? null;
  if (!disabledReason && cost > life.gold) disabledReason = `所持金が足りない（必要${silver(cost)}／所持${silver(Math.floor(life.gold))}）`;
  return { cost, disabledReason };
}

function buildDecision(life, event, random) {
  const decision = {
    id: event.id,
    title: event.title,
    category: event.category,
    copy: typeof event.copy === "function" ? event.copy(life) : event.copy,
    choices: [],
  };
  event.prepare?.(life, random, decision);
  decision.choices = (event.choicesFor?.(life, decision) ?? event.choices)
    .map((choice) => decorateChoice(life, choice))
    .map((choice) => ({
      ...choice,
      label: toSilverText(choice.label),
      preview: choice.preview.map(toSilverText),
      disabledReason: choice.disabledReason ? toSilverText(choice.disabledReason) : null,
    }));
  decision.copy = toSilverText(decision.copy);
  return decision;
}

function decisionFor(life, random) {
  const eligible = availableChoiceEvents(life);
  const priority = eligible.filter((event) => event.priority);
  const pool = priority.length > 0 ? priority : eligible;
  if (pool.length > 0 && (priority.length > 0 || random() < 0.65)) {
    const event = weightedPick(pool, (candidate) => candidate.weight, random);
    const decision = buildDecision(life, event, random);
    if (decision.choices.some((choice) => !choice.disabledReason)) return decision;
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

function completeIllnessTreatment(life, choice, random) {
  const illness = life.illness;
  const treatment = choice === "illness-magic-treatment" ? "magic" : "ordinary";
  const successRate = TUNING.treatmentSuccess[illness.type]?.[treatment] ?? 0;
  if (random() >= successRate) {
    life.illness.treatmentAttempts = (life.illness.treatmentAttempts ?? 0) + 1;
    life.illnessUntil = Math.max(life.illnessUntil, life.age + 0.25);
    return `${illness.name}の治療は成功しなかった。直ちに命を落とすことはなく、療養を続ける。`;
  }

  const sequelaChance = TUNING.sequelaRates[illness.severity] ?? 0;
  let sequela = null;
  if (random() < sequelaChance) {
    const range = ["重症", "危篤"].includes(illness.severity) ? [16, 30] : [6, 15];
    const loss = range[0] + Math.floor(random() * (range[1] - range[0] + 1));
    life.baseStats ??= rollAdultBaseline(life.race.id, random);
    life.baseStats.body = Math.max(0, life.baseStats.body - loss);
    sequela = `${illness.name}の後遺症で身体能力が${loss}低下した`;
    life.sequelae ??= [];
    life.sequelae.push({ type: "身体能力低下", amount: loss, age: life.age, recoveryAttempted: false });
  }
  life.health = "健やか";
  life.illnessUntil = life.age;
  life.lastIllnessRecoveryAt = life.age;
  life.illness = null;
  return `${illness.name}の治療に成功した。${sequela ?? "後遺症は残らなかった。"}`;
}

export function applyChoice(life, choice, random = Math.random) {
  if (!life.active || !life.pendingDecision) return null;
  const decision = life.pendingDecision;
  const selected = decision.choices.find((item) => item.effect === choice.effect);
  if (!selected) return null;
  const availability = choiceAvailability(life, selected.effect);
  if (availability.disabledReason) return null;

  ensureSkillState(life);
  const before = {
    gold: life.gold,
    debt: life.debt,
    health: life.health,
    fame: life.fame,
    occupation: life.occupation,
    skills: { ...life.skills },
  };
  const notes = [];
  const result = { cost: availability.cost };
  if (availability.cost > 0) {
    life.gold -= availability.cost;
    recordGold(life, selected.label, -availability.cost);
  }
  let message;
  switch (selected.effect.split(":")[0]) {
    case "will-legal":
      life.will = { type: "legal", targetId: null, charity: null };
      message = "財産を通常の相続割合で分ける遺言を残した。";
      break;
    case "will-spouse":
      life.will = { type: "person", targetId: spouseNpc(life)?.id ?? null, charity: null };
      message = "財産を配偶者に遺す遺言を残した。";
      break;
    case "will-oldest-child": {
      const oldest = [...livingChildren(life)].sort((a, b) => b.humanAge - a.humanAge)[0];
      life.will = { type: "person", targetId: oldest?.id ?? null, charity: null };
      message = `${oldest?.name ?? "最年長の子"}に財産を遺す遺言を残した。`;
      break;
    }
    case "will-equal-children":
      life.will = { type: "children-equal", targetId: null, charity: null };
      message = "存命の子供全員に均等に財産を遺す遺言を残した。";
      break;
    case "will-person": {
      const targetId = selected.effect.split(":")[1];
      const target = (life.npcs ?? []).find((npc) => npc.id === targetId && npc.alive);
      life.will = { type: "person", targetId: target?.id ?? null, charity: null };
      message = `${target?.name ?? "指定した知人"}に財産を遺す遺言を残した。`;
      break;
    }
    case "will-charity": {
      const charity = selected.effect.split(":")[1];
      life.will = { type: "charity", targetId: null, charity };
      message = `${charity}への寄付を指定する遺言を残した。`;
      break;
    }
    case "help":
      life.gold += 2;
      message = "家族の手伝いを続け、ささやかなお礼をもらった。";
      break;
    case "retire-now":
      life.retiredOccupation = life.occupation;
      changeOccupation(life, "引退", "65歳の退職選択");
      addFlag(life, "retirement-choice-resolved");
      message = `${life.retiredOccupation}を退き、これからは自分の時間を過ごすことにした。`;
      break;
    case "keep-working":
      addFlag(life, "retirement-choice-resolved");
      message = `${life.occupation}として働き続けることにした。再就職や転職の機会は今後もある。`;
      break;
    case "retire-career-change": {
      const previous = life.occupation;
      const next = randomItem(["農作業", "商人", "教師", "工房主"], random);
      changeOccupation(life, next, "65歳で別の仕事を選択");
      addFlag(life, "retirement-choice-resolved");
      message = `${previous}から${next}へ移り、新しい仕事を始めることにした。`;
      break;
    }
    case "promotion-apply": {
      const step = nextPromotionStep(life);
      if (!step) {
        message = "昇進条件を満たさなくなっており、選考には進めなかった。";
        break;
      }
      const previousRole = occupationTitle(life);
      const previousSalary = monthlyBudget(life).income.work;
      if (random() < TUNING.promotionSuccessChance) {
        life.occupationRole = step.role;
        life.fame += 1;
        updatePromotionNote(life);
        const nextSalary = monthlyBudget(life).income.work;
        message = `${previousRole}から${step.role}へ昇進した。月収は約${previousSalary.toFixed(1)}Gから${nextSalary.toFixed(1)}Gになった。`;
      } else {
        message = `「${step.role}」の選考に届かなかった。資格条件は満たしているため、次の機会に再挑戦できる。`;
      }
      break;
    }
    case "promotion-decline":
      message = "昇進選考は今回は見送り、現在の役職を続けることにした。";
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
      life.educationStatus = "学習継続中";
      if (life.age < 13) life.school ??= { id: "home-study", name: "家庭学習" };
      if (!life.trainingPlan) setSkillPractice(life, "literacy", 0.5, 0.6);
      message = "学びを続け、新しい知識を身につけた。";
      break;
    case "work":
      life.gold += 2;
      addSkillPoints(life, life.occupation === "まだ幼い子ども"
        ? "manual"
        : OCCUPATION_SKILLS[life.occupation] ?? "manual", 2, "家業の手伝い");
      addFlag(life, "helped-family-work");
      message = "家の仕事を手伝い、暮らしを支えた。";
      break;
    case "apprentice":
      changeOccupation(life, pickCareer(life, random), "本人が見習いを選択");
      life.educationStatus = "職人修行中";
      message = `${life.occupation}として見習いを始めた。`;
      life.gold += 4;
      break;
    case "career":
      changeOccupation(life, pickCareer(life, random), "本人が就職・転職を選択");
      life.gold += 8 + Math.floor(random() * 8);
      life.fame += 1;
      message = `${life.occupation}の仕事を始め、新しい一歩を踏み出した。`;
      break;
    case "job-application": {
      const [, tierText, job] = selected.effect.split(":");
      const tier = Number(tierText);
      const rate = TUNING.jobAcceptanceRates[tier - 1];
      const previousJob = life.occupation;
      const previousSalary = monthlyBudget(life).income.work;
      if (random() < rate) {
        changeOccupation(life, job, "求人への応募に採用");
        const nextSalary = monthlyBudget(life).income.work;
        message = `応募が採用され、${previousJob}から${job}へ移った。月収は約${gold(previousSalary)}から${gold(nextSalary)}になった。`;
      } else {
        message = `${job}の選考に落ち、${previousJob}を続けることになった（採用率${Math.round(rate * 100)}%）。`;
      }
      notes.push(`採用判定: 固定${Math.round(rate * 100)}%（能力・推薦による確率加算なし）`);
      break;
    }
    case "steady":
      life.gold += 5;
      message = `${life.occupation}の仕事を続け、少しずつ蓄えを増やした。`;
      break;
    case "invest":
      if (life.gold >= 5) {
        life.gold -= 5;
        life.fame += 2;
        addSkillPoints(life, OCCUPATION_SKILLS[life.occupation] ?? "general", 5, "道具への投資");
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
      const successChance = clamp((life.dexterity + life.occupationSkill) / 160, 0.1, 0.95);
      if (random() < successChance) {
        life.gold += 20;
        life.fame += 5;
        addSkillPoints(life, OCCUPATION_SKILLS[life.occupation] ?? "general", 3, "魔鉱石の加工");
        message = "魔鉱石の加工に成功した。報酬20Gを受け取り、職人技能と評判が上がった。";
      } else {
        addSkillPoints(life, OCCUPATION_SKILLS[life.occupation] ?? "general", 1, "加工の失敗から学習");
        message = "加工に失敗し材料費を失ったが、難しい鉱石の扱いを学んだ。";
      }
      addFlag(life, "ore-contract-attempted");
      break;
    }
    case "decline-contract":
      message = "魔鉱石の依頼を断り、材料費を使わず普段の仕事を続けた。";
      break;
    case "guild-exam":
      if (random() < clamp(life.occupationSkill / 100, 0.15, 0.9)) {
        life.fame += 4;
        addSkillPoints(life, OCCUPATION_SKILLS[life.occupation] ?? "general", 4, "組合試験");
        message = "組合の技能試験に合格し、資格と仕事仲間からの信頼を得た。";
        addFlag(life, "guild-license");
      } else {
        message = "試験には届かなかった。受験料は失ったが、足りない技術が分かった。";
      }
      break;
    case "decline-exam":
      addSkillPoints(life, OCCUPATION_SKILLS[life.occupation] ?? "general", 1, "実務経験");
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
    case "commit-romance": {
      const partner = life.npcs?.find((npc) => npc.id === life.romanticPartnerId);
      const chance = partner
        ? clamp(0.25 + partner.affinity / 150 + (currentStats(life).charm - 50) / 250 + compatibility(life, partner) / 100, 0.15, 0.92)
        : 1;
      if (partner && random() >= chance) {
        partner.affinity = clamp(partner.affinity - 15, 0, 100);
        partner.relationship = "友人";
        life.romanticPartnerId = null;
        life.historyFlags = life.historyFlags.filter((flag) => flag !== "romantic-partner");
        npcNote(life, partner, "告白を受け入れなかった");
        message = `${partner.name}に気持ちを伝えたが、相手には別の事情と思いがあり、今は友人でいようと言われた。`;
      } else {
        addFlag(life, "committed-relationship");
        if (partner) {
          partner.affinity = clamp(partner.affinity + 20, 0, 100);
          npcNote(life, partner, "交際を始めた");
        }
        life.fame += 1;
        message = `${partner?.name ?? "相手"}に気持ちを伝え、相手も同じ思いだと分かった。二人は交際を始めた。`;
      }
      break;
    }
    case "keep-friendship":
      addRelationship(life, "friend");
      message = "告白はせず、相手と変わらない友人関係を続けることにした。";
      break;
    case "marry": {
      let partner = life.npcs?.find((npc) => npc.id === life.romanticPartnerId);
      partner ??= createNpc(life, random, {
        relationship: "恋愛相手", humanAge: life.age + (random() - 0.5) * 6, maritalStatus: "未婚", affinity: 70,
      });
      const accepts = random() < clamp(0.4 + partner.affinity / 120, 0.3, 0.95);
      if (accepts) {
        marryNpc(life, partner);
        message = `${partner.name}に結婚を申し込み、受け入れられた。二人で新しい家庭を築き始めた。`;
        notes.push(`配偶者: ${partner.name}（${partner.occupation}）`, "共働きで家計に収入が加わり、生活費も増える");
      } else {
        life.gold += availability.cost;
        recordGold(life, "結婚の準備費用の返却", availability.cost);
        partner.affinity = clamp(partner.affinity - 10, 0, 100);
        message = `${partner.name}に結婚を申し込んだが、今は返事を待ってほしいと言われた。`;
      }
      break;
    }
    case "accept-arranged": {
      const partner = life.npcs?.find((npc) => npc.id === decision.npcId);
      if (partner) {
        marryNpc(life, partner, { arranged: true });
        message = `家同士の縁談を受け入れ、${partner.name}と結婚した。愛情はこれから育てていくことになる。`;
        notes.push(`配偶者: ${partner.name}（${partner.occupation}）`, "夫婦の信頼は低いところから始まる");
      } else {
        message = "縁談は立ち消えになった。";
      }
      break;
    }
    case "decline-arranged": {
      const partner = life.npcs?.find((npc) => npc.id === decision.npcId);
      if (partner) partner.relationship = "知人";
      if (random() < 0.4) {
        addFlag(life, "family-dispute");
        message = "縁談を断り、家族との間に気まずい空気が流れた。";
      } else {
        message = "縁談を丁重に断り、家族も事情を理解してくれた。";
      }
      break;
    }
    case "children-yes":
      life.childPlan = "wants";
      life.tryingSince = life.age;
      life.tryingUntil = life.age + 1;
      life.tryingMotherAge = femalePartner(life)?.humanAge ?? null;
      message = "二人でこの一年、子供を迎えたいと決めた。授かるかどうかは年齢などに応じた確率で決まる。";
      break;
    case "children-later":
      life.childPlan = "later";
      life.nextChildAskAt = life.age + childRetryDelay(random);
      message = "子供のことは、今はまだ考えないことにした。数年後に改めて話し合う。";
      break;
    case "children-never":
      life.childPlan = "none";
      message = "二人で話し合い、これからも子供は持たないと決めた。";
      break;
    case "mend-marriage":
      adjustHarmony(life, random() < 0.7 ? 25 : 8);
      message = "時間をかけて話し合い、夫婦の関係を立て直そうと努めた。";
      break;
    case "endure-marriage":
      if (life.marriage) life.marriage.harmony = Math.max(life.marriage.harmony, 28);
      message = "距離を置いたまま、夫婦としての暮らしを続けることにした。";
      break;
    case "divorce": {
      const share = Math.floor(life.gold * 0.4);
      life.gold -= share;
      if (share) recordGold(life, "財産分与", -share);
      const name = life.spouse;
      divorce(life);
      message = `${name}との婚姻を終え、財産を分けて別々の道を歩むことになった。`;
      break;
    }
    case "wait-to-marry":
      life.gold += 1;
      message = "結婚は急がず、暮らしの準備を整えてから改めて考えることにした。";
      break;
    case "medical-treatment":
      life.health = "健やか";
      life.illnessUntil = life.age;
      addFlag(life, "received-medical-care");
      message = "薬師の治療を受け、体調が回復して仕事へ戻れるようになった。";
      break;
    case "illness-ordinary-treatment":
    case "illness-magic-treatment": {
      const treatment = selected.effect === "illness-magic-treatment" ? "magic" : "ordinary";
      const successRate = TUNING.treatmentSuccess[life.illness?.type]?.[treatment] ?? 0;
      message = completeIllnessTreatment(life, selected.effect, random);
      notes.push(`基本成功率: ${Math.round(successRate * 100)}%（失敗しても即死ではない）`);
      break;
    }
    case "sequela-recovery": {
      const sequela = life.sequelae?.find((item) => !item.recoveryAttempted);
      if (!sequela) {
        message = "回復を試せる後遺症がなくなっていた。";
      } else {
        sequela.recoveryAttempted = true;
        if (random() < TUNING.sequelaRecovery.chance) {
          life.baseStats.body = Math.min(150, life.baseStats.body + sequela.amount);
          sequela.recovered = true;
          message = "専門治療が成功し、後遺症による身体能力の低下が回復した。";
        } else {
          message = "専門治療を受けたが、後遺症は回復しなかった。再挑戦はできない。";
        }
      }
      break;
    }
    case "illness-home-care":
      if (life.illness) life.illness.homeCare = true;
      life.illnessUntil = Math.max(life.illnessUntil ?? 0, life.age + 0.25);
      message = `${life.illness?.name ?? "病気"}の治療は受けず、自宅で療養することにした。`;
      break;
    case "illness-no-treatment":
      if (life.illness) life.illness.noTreatment = true;
      message = `${life.illness?.name ?? "病気"}の治療を受けず、経過を見守ることにした。`;
      break;
    case "train-magic": {
      addSkillPoints(life, "magic", 1, "師匠との初回訓練");
      const mentor = registerNPC(life, random, "魔術の師匠", "魔術師");
      const quality = mentorQuality(random);
      startTraining(life, random, {
        kind: "mentor", name: `${mentor.name}の魔術指導`, skill: "magic", activity: 0.5,
        learning: quality.learning, years: 5, mentor, status: "魔術修行中",
      });
      addFlag(life, "trained-magic");
      message = "師のもとで魔法を学び、魔力を安全に扱う技術を身につけた。";
      notes.push(`新しい師匠: ${mentor.name}（${quality.label}）`, "魔術技能が成長対象になった");
      break;
    }
    case "self-study-magic":
      life.trainingSkill = "magic";
      life.educationStatus = "魔術を独学中";
      setSkillPractice(life, "magic", 0.5, 0.6);
      addSkillPoints(life, "magic", 1, "魔術の独学");
      addFlag(life, "self-studied-magic");
      message = "独学で魔法の練習を続け、少しずつ制御を覚えた。";
      notes.push("魔術技能が成長対象になった（独学: 学習環境×0.6）");
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
    case "edu-town-school":
      startTraining(life, random, {
        kind: "school", name: "町の教室での学び", skill: "literacy", activity: 0.5, learning: 1,
        years: 4, status: "町の教室に在籍中", school: { id: "local-school", name: "町の教室" },
      });
      addFlag(life, "school-attendance");
      message = "町の教室に通い、読み書きを学び始めた。";
      notes.push("在籍: 町の教室", "読み書きが成長対象になった（学習環境×1.0）");
      break;
    case "edu-tutor": {
      const mentor = createNpc(life, random, {
        relationship: "家庭教師", humanAge: 30 + random() * 20, occupation: "教師", affinity: 50, firstContact: "家庭教師として来てくれた",
      });
      startTraining(life, random, {
        kind: "mentor", name: `${mentor.name}の家庭教育`, skill: "literacy", activity: 0.5, learning: 1.4,
        years: Math.max(1, 12 - life.age), mentor, status: "家庭教師から学習中",
      });
      addFlag(life, "school-attendance");
      message = `家庭教師の${mentor.name}から、読み書きを学び始めた。`;
      notes.push(`師匠: ${mentor.name}`, "読み書きが成長対象になった（良い師匠: 学習環境×1.4）");
      break;
    }
    case "edu-family-work":
      changeOccupation(life, "家業の手伝い", "家庭の事情で家業を手伝う");
      life.educationStatus = "家業を手伝いながら独学";
      setSkillPractice(life, "literacy", 0.15, 0.6);
      addSkillPoints(life, "manual", 1, "家業の手伝い");
      message = "家の仕事を手伝いながら、合間に独学で読み書きを覚えることにした。";
      notes.push("職業: 家業の手伝い", "読み書きは独学（学習環境×0.6）");
      break;
    case "edu-start-work":
      changeOccupation(life, pickCareer(life, random), "教育を受けず働き始めた");
      life.educationStatus = "教育を受けずに就労";
      message = `教育は受けず、${life.occupation}として働き始めた。`;
      break;
    case "apprentice-magic":
    case "apprentice-sword": {
      const magicPath = selected.effect === "apprentice-magic";
      const mentor = createNpc(life, random, {
        relationship: magicPath ? "魔術の師匠" : "剣術の師匠", humanAge: 35 + random() * 20,
        occupation: magicPath ? "魔術師" : "兵士", affinity: 50, firstContact: "弟子入りを認めてくれた",
      });
      const quality = mentorQuality(random);
      startTraining(life, random, {
        kind: "mentor", name: `${mentor.name}への弟子入り`, skill: magicPath ? "magic" : "swordsmanship",
        activity: 1, learning: quality.learning, years: magicPath ? 6 : 5,
        graduateTo: magicPath ? "魔術師" : "兵士",
        reason: magicPath ? "魔術修行を修了し魔術師として独立" : "剣術修行を修了し兵士になった",
        mentor, status: magicPath ? "魔術師に弟子入り中" : "剣術の師匠に弟子入り中",
        occupation: magicPath ? "魔術師の弟子" : "剣術の弟子", occupationReason: magicPath ? "魔術師へ弟子入り" : "剣術の師匠へ弟子入り",
      });
      message = `${mentor.name}への弟子入りが認められた。`;
      notes.push(`新しい師匠: ${mentor.name}（${quality.label}）`, `${magicPath ? "魔術" : "剣術"}修行を開始（学習環境×${quality.learning}）`, `職業: ${life.occupation}`);
      break;
    }
    case "apprentice-craft":
    case "apprentice-tailor": {
      const smith = selected.effect === "apprentice-craft";
      const mentor = createNpc(life, random, {
        relationship: smith ? "鍛冶の親方" : "服飾の親方", humanAge: 35 + random() * 25,
        occupation: smith ? "鍛冶職人" : "服飾店の見習い", affinity: 50, firstContact: "見習いを受け入れてくれた",
      });
      const quality = mentorQuality(random);
      startTraining(life, random, {
        kind: "mentor", name: `${mentor.name}のもとでの見習い`, skill: smith ? "smithing" : "tailoring", activity: 1,
        learning: quality.learning, years: 4, mentor, status: smith ? "鍛冶の親方に弟子入り中" : "服飾の親方に弟子入り中",
        occupation: smith ? "鍛冶職人" : "服飾店の見習い", occupationReason: smith ? "鍛冶職人へ弟子入り" : "服飾店へ見習いに入る",
      });
      message = `${mentor.name}の工房で見習いとして働き始めた。`;
      notes.push(`新しい師匠: ${mentor.name}（${quality.label}）`, `${smith ? "鍛冶" : "裁縫"}の修行を開始（学習環境×${quality.learning}）`, `職業: ${life.occupation}`);
      break;
    }
    case "apprentice-family":
      changeOccupation(life, "家業の手伝い", "家業を継ぐ準備");
      life.educationStatus = "家業を継ぐ準備";
      message = "家業を手伝いながら、いずれ継ぐための仕事を覚え始めた。";
      break;
    case "apprentice-general": {
      const occupation = randomItem(["職人見習い", "服飾店の見習い", "鍛冶職人"], random);
      const skill = OCCUPATION_SKILLS[occupation];
      const mentor = createNpc(life, random, {
        relationship: "職業の師匠", humanAge: 35 + random() * 25,
        occupation, affinity: 50, firstContact: "職業見習いとして受け入れた",
      });
      const quality = mentorQuality(random);
      startTraining(life, random, {
        kind: "apprenticeship", name: `${mentor.name}のもとでの${occupation}`,
        skill, activity: 1, learning: quality.learning, years: 5, mentor,
        status: `${occupation}として修業中`, occupation, occupationReason: "職業見習いを選択",
      });
      message = `${mentor.name}のもとで${occupation}として働きながら、技術を学ぶことにした。`;
      notes.push(`修業期間: 人間換算5年間`, `学習環境×${quality.learning}`);
      break;
    }
    case "apprentice-work":
      changeOccupation(life, pickCareer(life, random), "弟子入りせず働き始めた");
      life.educationStatus = "就労";
      message = `弟子入りせず、${life.occupation}として働き始めた。`;
      break;
    case "academy-magic":
    case "academy-knight":
    case "academy-scholar": {
      const kind = selected.effect.slice("academy-".length);
      const funding = academyFunding(life, kind === "scholar" ? "scholar" : kind);
      const info = {
        magic: { name: "魔術学院", skill: "magic", student: "魔術学院生", job: "魔術師" },
        knight: { name: "騎士学院", skill: "swordsmanship", student: "騎士学院生", job: ["王族", "貴族"].includes(life.status?.name) ? "騎士" : "兵士" },
        scholar: { name: "学術院", skill: "scholarship", student: "学術院生", job: "学者" },
      }[kind];
      startTraining(life, random, {
        kind: "academy", name: info.name, skill: info.skill, activity: 1.3, learning: 1.6, years: ACADEMY_YEARS[kind],
        graduateTo: info.job, reason: `${info.name}を卒業して就職`, status: `${info.name}に在籍中`,
        school: { id: `academy-${kind}`, name: info.name }, occupation: info.student, occupationReason: `${info.name}に入学`,
      });
      addFlag(life, "academy-enrolled");
      life.historyFlags = life.historyFlags.filter((flag) => flag !== "academy-aspirant");
      message = `${info.name}への入学が認められた。`;
      if (funding.loan) {
        life.scholarshipBalance = (life.scholarshipBalance ?? 0) + funding.loan;
        notes.push(`奨学金残高: ${gold(life.scholarshipBalance)}（無利子、収入の10%を返済）`);
      }
      notes.push(`入学の経路: ${funding.via}`, `在籍: ${info.name}`, `学習環境: 専門学院×1.6、集中的な専門訓練×1.3`);
      break;
    }
    case "academy-skip":
      life.historyFlags = life.historyFlags.filter((flag) => flag !== "academy-aspirant");
      message = "学院には進まず、これまでの道を歩み続けることにした。";
      break;
    case "path-academy":
      addFlag(life, "academy-aspirant");
      message = "学院進学を目指し、入学条件を満たす学校の案内を待つことにした。";
      break;
    case "buy-home-choice":
      life.ownsHome = true;
      life.homeType = "small";
      life.homeValue = TUNING.homePricesLegacyG.small;
      addFlag(life, "owns-home");
      message = "貯えで小さな家を買い、自分の家を持った。";
      notes.push("毎月の家賃が軽くなった");
      break;
    case "buy-home-small":
    case "buy-home-large":
    case "buy-home-estate": {
      const type = selected.effect.slice("buy-home-".length);
      life.ownsHome = true;
      life.homeType = type;
      life.homeValue = TUNING.homePricesLegacyG[type];
      addFlag(life, "owns-home");
      message = `${type === "small" ? "小さな家" : type === "large" ? "広い家" : "邸宅"}を購入した。`;
      notes.push("家賃は不要。住宅価格は相続財産に含まれる");
      break;
    }
    case "sell-home": {
      const [minimum, maximum] = TUNING.homeResaleRange;
      const proceeds = (life.homeValue ?? 0) * (minimum + random() * (maximum - minimum));
      life.gold += proceeds;
      recordGold(life, "住宅の売却", proceeds);
      life.ownsHome = false;
      life.homeType = null;
      life.homeValue = 0;
      life.historyFlags = life.historyFlags.filter((flag) => flag !== "owns-home");
      message = "住宅を売却し、借家に戻った。";
      notes.push(`売却額: ${gold(proceeds)}（購入額の70〜90%）`);
      break;
    }
    case "open-shop-choice":
      changeOccupation(life, "工房主", "独立して工房を開いた");
      life.fame += 3;
      message = "自分の工房を開き、工房主として独立した。";
      break;
    case "support-family": {
      const parent = livingParents(life)[0];
      if (parent) {
        parent.affinity = clamp(parent.affinity + 15, 0, 100);
        npcNote(life, parent, "仕送りを受け取った");
      }
      life.fame += 1;
      message = `${parent?.name ?? "家族"}へ仕送りをし、感謝された。`;
      break;
    }
    case "repay-debt":
      life.debt = Math.max(0, life.debt - availability.cost);
      message = "手持ちで借金を返し、毎月の利息の負担が軽くなった。";
      break;
    case "business-expand": {
      const size = selected.effect.split(":")[1];
      const terms = TUNING.business[size];
      const chance = businessChance(life, size);
      life.businessExpansionCount = (life.businessExpansionCount ?? 0) + 1;
      if (random() < chance) {
        life.businessRevenue = (life.businessRevenue ?? 0) + terms.revenue;
        life.fame += 1;
        addSkillPoints(life, life.occupation === "農作業" ? "farming" : "trade", 2, "事業拡大の成功");
        message = `事業拡大に成功し、毎月の収入が${gold(terms.revenue)}増えた。`;
      } else {
        const loss = terms.cost * TUNING.business.lossOnFailure[size];
        life.gold += terms.cost - loss;
        recordGold(life, "事業拡大の失敗時返金", terms.cost - loss);
        message = `事業拡大に失敗し、投資額の${Math.round(TUNING.business.lossOnFailure[size] * 100)}%を失った。`;
      }
      break;
    }
    case "buy-gear":
      addFlag(life, "good-gear");
      addSkillPoints(life, OCCUPATION_SKILLS[life.occupation] ?? "general", 2, "装備の新調");
      message = "新しい装備を整え、危険な仕事でも身を守りやすくなった。";
      break;
    default:
      message = "穏やかな日々を大切にすることにした。";
  }
  life.gold = Math.max(0, life.gold);
  const changes = [];
  const goldDelta = Math.round((life.gold - before.gold) * 10) / 10;
  if (goldDelta) changes.push(`所持金${goldDelta > 0 ? "+" : ""}${goldDelta}G`);
  const debtDelta = Math.round((life.debt - before.debt) * 10) / 10;
  if (debtDelta) changes.push(`借金${debtDelta > 0 ? "+" : ""}${debtDelta}G`);
  const fameDelta = life.fame - before.fame;
  if (fameDelta) changes.push(`名声${fameDelta > 0 ? "+" : ""}${fameDelta}`);
  if (life.health !== before.health) changes.push(`健康${before.health}→${life.health}`);
  if (life.occupation !== before.occupation) changes.push(`職業${before.occupation}→${life.occupation}`);
  for (const [skill, level] of Object.entries(life.skills)) {
    const delta = level - (before.skills[skill] ?? 0);
    if (Math.abs(delta) > 1e-9) changes.push(`${skillName(skill)}技能+${delta.toFixed(1)}`);
  }
  const detail = [...changes, ...notes];
  life.lastResult = {
    title: decision.title,
    choice: toSilverText(selected.label),
    message: toSilverText(message),
    details: detail.map(toSilverText),
    age: life.age,
  };
  if (changes.length) message = `${message}（${changes.join("、")}）`;
  life.pendingDecision = null;
  life.playing = true;
  appendEvent(life, message, "life", "選択", `${decision.id}-result`);
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

function settleInheritance(life) {
  if (life.inheritanceSettled) return life.inheritance ?? [];
  life.inheritanceSettled = true;
  const estate = Math.max(0, life.gold + (life.homeValue ?? 0) - Math.max(0, life.debt));
  life.inheritanceEstate = estate;
  life.debtSettledAtDeath = life.debt;
  life.debt = 0;
  life.gold = 0;
  life.homeValue = 0;
  life.ownsHome = false;
  transferPeerage(life);

  const spouse = spouseNpc(life);
  const children = livingChildren(life).sort((left, right) => (right.humanAge ?? 0) - (left.humanAge ?? 0));
  const slots = [];
  const will = life.will ?? { type: "legal" };
  if (will.type === "charity" && will.charity) {
    life.inheritanceTo = will.charity;
  } else if (will.type === "person") {
    const target = (life.npcs ?? []).find((npc) => npc.id === will.targetId && npc.alive);
    if (target) slots.push({ heirs: [target], weight: 1 });
  } else if (will.type === "children-equal" && children.length) {
    slots.push({ heirs: children, weight: 1 });
  }
  if (!slots.length && will.type !== "charity") {
    if (spouse) slots.push({ heirs: [spouse], weight: 1 });
    if (children.length) {
      slots.push({ heirs: [children[0]], weight: 1 });
      if (children.length > 1) slots.push({ heirs: children.slice(1), weight: 1 });
    }
  }
  const totalWeight = slots.reduce((sum, slot) => sum + slot.weight, 0);
  const distributions = [];
  let remaining = estate;
  slots.forEach((slot, index) => {
    const slotAmount = index === slots.length - 1 ? remaining : estate * slot.weight / totalWeight;
    const share = slotAmount / slot.heirs.length;
    slot.heirs.forEach((heir, heirIndex) => {
      const lastHeir = index === slots.length - 1 && heirIndex === slot.heirs.length - 1;
      const amount = lastHeir ? remaining : share;
      distributions.push({ id: heir.id, name: heir.name, amount });
      heir.wealth = (heir.wealth ?? 0) + amount;
      remaining -= amount;
    });
  });
  life.inheritance = distributions;
  if (distributions.length) life.inheritanceTo = null;
  else life.inheritanceTo ??= "国庫";
  return distributions;
}

function transferPeerage(life) {
  if (!life.peerageTitle) return;
  const children = livingChildren(life).sort((a, b) => (b.humanAge ?? 0) - (a.humanAge ?? 0));
  const heir = children[0] ?? null;
  if (heir) {
    heir.peerageTitle = life.peerageTitle;
    heir.legalStatus = "貴族";
    life.titleSuccession = { heirId: heir.id, heirName: heir.name, title: life.peerageTitle };
  } else {
    life.titleSuccession = { heirId: null, heirName: null, title: life.peerageTitle, destination: "君主" };
  }
}

function die(life, cause) {
  life.active = false;
  life.playing = false;
  life.pendingDecision = null;
  life.deathCause = cause;
  life.deathAge = life.age;
  const heirs = settleInheritance(life);
  const detail = heirs.length
    ? ` 相続財産${silver(life.inheritanceEstate)}を${heirs.map((heir) => `${heir.name}へ${silver(heir.amount)}`).join("、")}分けた。`
    : ` 借金を清算した後の財産は${life.inheritanceTo}へ帰属した。`;
  const titleDetail = life.titleSuccession
    ? life.titleSuccession.heirName
      ? ` 爵位「${life.titleSuccession.title}」は${life.titleSuccession.heirName}が継承した。`
      : ` 爵位「${life.titleSuccession.title}」は君主に返還された。`
    : "";
  appendEvent(life, `人生の幕が下りた。死因は${cause}だった。${detail}${titleDetail}`, "death", "最期");
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

  const situation = life.world?.situation ?? life.situation;
  if (situation === "戦争中" && life.occupation === "兵士" && random() < 0.02 * elapsed) {
    die(life, "戦死");
    return;
  }
  if (situation === "魔物の襲撃") {
    const exposure = life.occupation === "冒険者" ? 0.015 : ["辺境", "農村"].includes(life.home) ? 0.004 : 0;
    if (random() < exposure * elapsed) {
      die(life, "魔物の襲撃");
      return;
    }
  }

  const accidentRate = TUNING.accidentChanceByWork[life.occupation] ?? TUNING.accidentChanceByWork.default;
  if (!hasRecentEvent(life, "hazard-accident", 8) && random() < accidentRate * elapsed) {
    const fatality = TUNING.accidentFatality * (life.historyFlags?.includes("good-gear") ? 0.6 : 1);
    if (random() < fatality) {
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

  const recoveredRecently = life.lastIllnessRecoveryAt != null && age - life.lastIllnessRecoveryAt < 2;
  if (life.age >= life.illnessUntil && !life.illness
    && random() < annualIllnessRate(age) * (recoveredRecently ? 0.5 : 1) * worldModifiers(life).illness * elapsed) {
    const disease = weightedPick(DISEASE_TYPES, (item) => item.weight, random);
    const severity = weightedPick(TUNING.illnessSeverityWeights, (item) => item.weight, random);
    life.illness = { type: disease.id, name: disease.name, severity: severity.name, since: age, duration: severity.duration };
    life.illnessUntil = age + severity.duration;
    life.health = "療養中";
    const decision = severity.name === "軽症" ? "休養を取り、症状は落ち着いている。" : "治療を受けるか、療養を続けるか決める必要がある。";
    appendEvent(life, `${disease.name}（${severity.name}）を発症した。${decision}`, "world", "病気", `hazard-illness-${Math.floor(age)}`);
  } else if (life.illness && life.age >= life.illnessUntil) {
    const recoveryChance = TUNING.naturalRecoveryChance[life.illness.severity] ?? 0;
    if (random() < recoveryChance) {
      const recoveredDisease = life.illness.name;
      life.illness = null;
      life.health = "健やか";
      life.lastIllnessRecoveryAt = life.age;
      appendEvent(life, `${recoveredDisease}から回復し、体調が戻った。`, "life", "回復");
    } else {
      const severityIndex = TUNING.illnessSeverityWeights.findIndex((item) => item.name === life.illness.severity);
      life.illness.severity = TUNING.illnessSeverityWeights[Math.min(severityIndex + 1, TUNING.illnessSeverityWeights.length - 1)].name;
      life.illnessUntil = life.age + 0.5;
      appendEvent(life, `${life.illness.name}の症状が続き、病状が重くなった。治療が必要になっている。`, "life", "病状の悪化", `illness-worsening-${Math.floor(age)}`);
    }
  } else if (life.health !== "健やか" && life.age >= life.illnessUntil) {
    life.health = "健やか";
    life.lastIllnessRecoveryAt = life.age;
    appendEvent(life, "休養が実り、体調が戻った。", "life", "回復");
  }
}

function monthlyUpdate(life, random) {
  processMonth(life, random);
  const working = life.age >= 13 && !NON_WORKING.includes(life.occupation) && !TRAINEE_OCCUPATIONS.includes(life.occupation);
  if (working) updateRole(life, random);
  advancePregnancy(life, random, 1);
  if (life.marriage) {
    const strain = life.gold < 3 && life.debt > 5 ? -0.35 : 0;
    const settle = (55 - life.marriage.harmony) * 0.006;
    adjustHarmony(life, strain + settle + (random() - 0.5) * 2.6);
  }
  if (life.occupation === "失業中") {
    const chance = life.world?.situation === "不況" ? 0.02 : 0.1;
    if (random() < chance) {
      const previous = life.unemployedFrom ?? "家業の手伝い";
      life.unemployedFrom = null;
      changeOccupation(life, previous, "再就職", true);
      appendEvent(life, `新しい勤め口が見つかり、${previous}として再び働き始めた。`, "life", "再就職", `reemployed-${Math.floor(life.age)}`);
    }
  }
}

export function advanceLife(life, humanYears, random = Math.random) {
  if (!life.active || !life.playing || life.pendingDecision || humanYears <= 0) return [];
  let remaining = Math.min(humanYears, 0.25);
  const newEvents = [];

  while (remaining > 0 && life.active && !life.pendingDecision) {
    const nextScheduled = Math.min(
      life.nextLogAt, life.nextDecisionAt, life.nextSocialAt ?? Infinity, life.maxHumanAge,
      life.trainingEndsAt ?? Infinity, life.world?.nextChangeAt ?? Infinity,
    );
    const elapsed = Math.max(0, Math.min(remaining, nextScheduled - life.age));
    if (Number.isNaN(elapsed)) break;
    if (elapsed > 0) {
      life.age += elapsed;
      remaining -= elapsed;
      advanceOccupation(life, elapsed);
      advanceSkills(life, elapsed);
      advanceNpcs(life, elapsed, random);
      life.finance ??= { recent: [], lastMonth: null, monthProgress: 0, totalIncome: 0, totalExpense: 0 };
      life.finance.monthProgress += elapsed * 12;
      while (life.finance.monthProgress >= 1) {
        life.finance.monthProgress -= 1;
        monthlyUpdate(life, random);
      }
      resolveHazards(life, elapsed, random);
      if (!life.active) break;
    }

    if (life.age >= life.maxHumanAge) {
      life.age = life.maxHumanAge;
      die(life, "老衰");
      break;
    }
    if (life.world && life.age >= life.world.nextChangeAt) advanceWorld(life, random);
    if (life.trainingEndsAt != null && life.age >= life.trainingEndsAt) finishTraining(life, random);
    if (life.nextSocialAt !== undefined && life.age >= life.nextSocialAt) {
      if (life.age >= 14 && life.race.id !== "dragon") socialStep(life, random);
      life.nextSocialAt = life.age + Math.max(0.3, rollExponential(TUNING.socialMeanYears, random));
      continue;
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
        const goldBefore = life.gold;
        applyRoutineEffect(life, event, random);
        const delta = life.gold - goldBefore;
        if (delta) recordGold(life, event.label, delta);
        if (event.effect?.action !== "social") newEvents.push(appendEvent(life, event.text, event.kind, event.label, event.id));
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

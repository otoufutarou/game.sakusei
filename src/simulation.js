import {
  STAT_KEYS, TALENT_TABLE, currentStats, magicTier, rollAdultBaseline, rollMana, rollTalent, skillName,
} from "./stats.js";
import { generatePersonName, NAME_CULTURES } from "./names.js";

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

const GENDERS = ["女性", "男性"];
const HOME_TYPES = ["王都", "地方都市", "農村", "辺境"];
const PERSONALITIES = ["穏やか", "好奇心旺盛", "慎重", "負けず嫌い", "思いやり深い", "自由を好む"];
const SITUATIONS = ["平和", "平和", "平和", "平和", "不況", "疫病流行", "飢饉", "戦争中", "魔物の襲撃"];
const DISEASE_TYPES = [
  { id: "infection", name: "軽い感染症", weight: 50 },
  { id: "pneumonia", name: "肺炎", weight: 15 },
  { id: "tuberculosis", name: "結核", weight: 10 },
  { id: "fracture", name: "骨折", weight: 10 },
  { id: "severeInjury", name: "重い外傷", weight: 10 },
  { id: "trauma", name: "精神的トラウマ", weight: 0 },
  { id: "advancedCancer", name: "進行がん", weight: 5 },
];
const HAIR_COLORS = ["#34271f", "#47312b", "#b58b52", "#8d5947", "#c7c2ae"];
const COAT_COLORS = ["#647d72", "#786984", "#9a6456", "#667995", "#947b4d"];

export const TUNING = Object.freeze({
  homePricesLegacyG: { small: 120, large: 400, estate: 50000 / 30 },
  homeResaleRange: [0.7, 0.9],
  homeRentLegacyG: 0.7,
  adultLivingCostLegacyG: 1.9,
  youthLivingCostLegacyG: 0.8,
  lifestyleCostLegacyG: 0.12,
  lifestyleCostRoleGrowth: 0.6,
  discretionarySpendingRate: 0.7,
  highIncomeSpendingThreshold: 1,
  highIncomeSpendingRate: 0.15,
  youthHouseholdContributionRate: 0.9,
  decisionCooldownYears: 8,
  dungeonOfferAges: [22, 48],
  homeUpkeepLegacyG: { small: 0.15, large: 0.5, estate: 2 },
  petUpkeepLegacyG: 0.1,
  wageMultiplier: 0.8,
  occupationSkillActivity: 0.6,
  occupationSkillPayDivisor: 400,
  scholarshipThresholds: { magic: 60, knight: 70, scholar: 70 },
  scholarshipLivingCostLegacyG: 12,
  scholarshipRepaymentRate: 0.1,
  business: {
    small: { cost: 8, chance: 0.6, revenue: 0.25 },
    medium: { cost: 20, chance: 0.45, revenue: 0.6 },
    large: { cost: 40, chance: 0.3, revenue: 1.2 },
    maximumExpansions: 3,
    skillAdjustmentMax: 0.1,
    minimumChance: 0.2,
    maximumChance: 0.7,
    lossOnFailure: { small: 1, medium: 0.65, large: 0.4 },
  },
  sequelaRecovery: { cost: 40, chance: 0.35 },
  routineLogIntervalYears: 1.3,
  decisionMeanYears: 2.5,
  firstDecisionEarliestAge: 6,
  firstDecisionMeanYears: 1.2,
  firstDecisionLatestAge: 10.5,
  socialMeanYears: 5.2,
  retirementHumanAge: 65,
  promotionSuccessChance: 0.25,
  promotionRetryYears: 3,
  ordinaryDebtLimit: 100,
  childDecisionMaxHumanAge: 45,
  childRetryYears: [2, 3],
  annualConceptionChanceByAge: [
    { until: 29, chance: 0.9 },
    { until: 34, chance: 0.9 },
    { until: 39, chance: 0.9 },
    { until: 45, chance: 0.9 },
  ],
  childRaceInheritance: "mother",
  treatmentSuccess: {
    infection: { ordinary: 0.75, magic: 0.95 },
    pneumonia: { ordinary: 0.45, magic: 0.8 },
    tuberculosis: { ordinary: 0.15, magic: 0.65 },
    fracture: { ordinary: 0.65, magic: 0.9 },
    severeInjury: { ordinary: 0.2, magic: 0.65 },
    trauma: { ordinary: 0.6, magic: 0.85 },
    advancedCancer: { ordinary: 0.02, magic: 0.2 },
  },
  injuryReviewYears: 2,
  participationFatality: 0.12,
  participationInjuryChance: 0.45,
  clericTraumaChance: 0.3,
  demonKingDurationYears: 6,
  illnessSeverityWeights: [
    { name: "軽症", weight: 60, duration: 0.15 },
    { name: "中等症", weight: 27, duration: 0.4 },
    { name: "重症", weight: 10, duration: 0.8 },
    { name: "危篤", weight: 3, duration: 1 },
  ],
  naturalRecoveryChance: { 軽症: 0.9, 中等症: 0.65, 重症: 0.35, 危篤: 0.15 },
  sequelaRates: { 軽症: 0, 中等症: 0.03, 重症: 0.15, 危篤: 0.35 },
  treatmentCosts: {
    ordinary: { 中等症: 5, 重症: 5, 危篤: 5 },
    magic: { 中等症: 20, 重症: 20, 危篤: 20 },
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
    "聖職者": 0.002,
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
  "聖職者": "faith",
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
  "flight", "dragon", "stealth", "charm", "literacy", "swordsmanship", "scholarship", "faith",
])];

// Practising a skill slowly raises the base ability it depends on, so the status bars move during play.
const SKILL_STAT_LINKS = Object.freeze({
  manual: "body", farming: "body", combat: "combat", swordsmanship: "combat", adventuring: "combat",
  smithing: "dexterity", craft: "dexterity", tailoring: "dexterity", finework: "dexterity",
  literacy: "intellect", scholarship: "intellect", teaching: "intellect", trade: "intellect",
});
const STAT_GROWTH_RATE = 0.3;
const STAT_GROWTH_CAP = 200;
const SKILL_GROWTH_BASE = 3.5;
const SKILL_MONTH = 1 / 12;

const friendNpc = (life) => (life.npcs ?? []).find((npc) => npc.alive && npc.relationship === "友人");

const defineEvent = (id, category, requirements, text, effect, weight = 1) => ({
  id, category, requirements: { minAge: 0, ...requirements }, text, effect, weight,
});

export const ROUTINE_EVENTS = [
  defineEvent("child-first-book", "幼少期・教育", { minAge: 5, maxAge: 16, oncePerLife: true }, () => "古い絵本を最後まで読み、物語の結末を知った。", { flag: "learned-to-read" }, 1.2),
  defineEvent("child-playmates", "幼少期・教育", { minAge: 4, maxAge: 12 }, () => "近所の子どもたちと遊び回り、仲間うちで頼られる役を任された。", { fame: 1, relation: "friend" }),
  defineEvent("child-school-friend", "幼少期・教育", { minAge: 6, maxAge: 17 }, () => "学び舎で隣に座る子と親しくなり、放課後も一緒に過ごすようになった。", { relation: "friend" }),
  defineEvent("child-exam", "幼少期・教育", { minAge: 8, maxAge: 18, requiresFlag: "school-attendance", occupations: ["まだ幼い子ども", "家業の手伝い"] }, () => "難しい課題に取り組み、先生から次の学びを勧められた。", { fame: 1 }),
  defineEvent("child-library", "幼少期・教育", { minAge: 7, maxAge: 19, requiresFlag: "learned-to-read" }, () => "町の書庫で地図や薬草の本を眺め、知らない土地への興味が湧いた。", { flag: "library-learner" }),
  defineEvent("child-apprentice-lesson", "幼少期・教育", { minAge: 10, maxAge: 20, occupations: ["まだ幼い子ども", "家業の手伝い"], oncePerLife: true }, () => "近所の職人が作業を見せ、道具の名前と安全な扱い方を説明してくれた。", { flag: "craft-curious" }),

  defineEvent("career-apprentice-task", "職業・昇進", { minAge: 13, occupations: ["職人見習い", "服飾店の見習い", "鍛冶職人"] }, () => "任された品を期限までに仕上げ、親方から次の工程を教わった。", { gold: 1 }),
  defineEvent("career-harvest", "職業・昇進", { minAge: 13, occupations: ["農作業", "家業の手伝い"] }, () => "豊作の年を迎え、仲間と収穫を終えて賃金と分け前を受け取った。", { gold: 3 }),
  defineEvent("career-mentor", "職業・昇進", { minAge: 18, minimumSkill: 20 }, () => "仕事の経験を買われ、後輩に道具の扱いを教える役目を任された。", { fame: 2, flag: "mentored-worker" }),
  defineEvent("career-promotion", "職業・昇進", { minAge: 18, minimumSkill: 40 }, () => "積み重ねた仕事ぶりが評価され、より大きな責任を伴う役目を得た。", { fame: 3, gold: 2, flag: "promotion-earned" }),
  defineEvent("career-guild-license", "職業・昇進", { minAge: 18, occupations: ["職人見習い", "服飾店の見習い", "鍛冶職人"], minimumSkill: 40 }, () => "組合の技能試験に合格し、独りで仕事を受ける資格を得た。", { fame: 3, flag: "guild-license" }),
  defineEvent("career-new-client", "職業・昇進", { minAge: 18, minimumSkill: 20 }, (life) => `${life.nation.name}の遠方から新しい依頼が届き、仕事の評判が広がった。`, { gold: 3, fame: 1 }),
  defineEvent("career-retirement", "職業・昇進", { minAge: 65, minimumSkill: 60, oncePerLife: true }, () => "長年の仕事に一区切りをつけるか、続けるかを考える時期になった。", { flag: "retirement-reminder" }),

  defineEvent("family-sibling-birth", "家族・人間関係", { minAge: 1, maxAge: 25, oncePerLife: true }, () => "家族に新しい子が生まれ、家の中に小さな泣き声が響いた。", { action: "sibling" }),
  defineEvent("family-parent-illness", "家族・人間関係", { minAge: 8, maxAge: 80, custom: (life) => !life.npcs || life.npcs.length === 0 || livingParents(life).length > 0 }, () => "親が病に伏せ、家族で看病と家の仕事を分担して支えた。", { relation: "family-support", gold: -2 }),
  defineEvent("family-old-friend", "家族・人間関係", { minAge: 12 }, () => "幼い頃からの友人と久しぶりに会い、互いの近況を語り合った。", { relation: "friend" }),
  defineEvent("family-reconcile", "家族・人間関係", { minAge: 16, requiresFlag: "family-dispute" }, () => "長く続いた家族との行き違いについて話し合い、和解することができた。", { action: "reconcile", fame: 1 }),
  defineEvent("family-inheritance", "家族・人間関係", { minAge: 18, oncePerLife: true }, () => "身内から大切に使っていた道具を譲り受け、家の歴史を聞いた。", { flag: "inherited-tool" }),
  defineEvent("family-care-parent", "家族・人間関係", { minAge: 35, maxAge: 100, custom: (life) => !life.npcs || life.npcs.length === 0 || livingParents(life).length > 0 }, () => "年老いた親の暮らしを支え、長い年月の恩に少しずつ報いた。", { gold: -3, fame: 2, relation: "family-support" }),
  defineEvent("family-funeral", "家族・人間関係", { minAge: 15, oncePerLife: true }, () => "親しい人との別れを家族や友人と悼み、思い出を分かち合った。", { fame: 1, flag: "remembered-loss" }),
  defineEvent("family-neighbor-help", "家族・人間関係", { minAge: 6 }, (life) => `${life.home}の近所で困っていた人を手伝い、頼れる仲間が増えた。`, { relation: "ally", fame: 1 }),

  defineEvent("love-market-social", "恋愛・結婚", { minAge: 18, maxAge: 70, requiresNotFlag: "married", cooldownYears: 1 }, () => "市の賑わいの中で、人との出会いと再会があった。", { action: "social" }, 1.3),
  defineEvent("love-evening-social", "恋愛・結婚", { minAge: 18, maxAge: 60, cooldownYears: 1 }, () => "仕事のあとの集まりで、人付き合いが広がった。", { action: "social" }, 1),
  defineEvent("love-affection", "恋愛・結婚", { minAge: 18, requiresFlag: "married", cooldownYears: 2 }, (life) => `${life.spouse ?? "配偶者"}と静かな時間を過ごし、互いへの信頼を深めた。`, { action: "harmony-up", flag: "marital-calm" }, 1.2),
  defineEvent("love-quarrel", "恋愛・結婚", { minAge: 18, requiresFlag: "married", cooldownYears: 2 }, (life) => `${life.spouse ?? "配偶者"}と些細なことで言い争い、気まずい日が続いた。`, { action: "harmony-down", flag: "marital-strain" }, 0.9),
  defineEvent("love-family-celebration", "恋愛・結婚", { minAge: 22, requiresFlag: "married" }, () => "家族の節目を祝う小さな集まりを開き、親しい人たちと喜びを分かち合った。", { fame: 1, gold: -2 }),

  defineEvent("wealth-market-profit", "財産・借金", { minAge: 18, minimumGold: 8 }, (life) => `蓄えを生かして${life.nation.name}の市で品を仕入れ、利益を得た。`, { gold: 2, fame: 1 }),
  defineEvent("wealth-guild-board", "財産・借金", { minAge: 18, maximumGold: 5, oncePerLife: true }, () => "ギルドの掲示板には、職業を問わず受けられる薬草採集の依頼が並んでいた。借金をせずに働く道もある。", { flag: "found-guild-board" }),
  defineEvent("wealth-bad-harvest", "財産・借金", { minAge: 15, oncePerLife: true }, () => "不作で食料の値が上がり、冬を越すために蓄えを切り崩した。", { gold: -8, flag: "survived-famine" }),
  defineEvent("wealth-repay-debt", "財産・借金", { minAge: 18, minimumGold: 12, requiresFlag: "small-loan", oncePerLife: true }, () => "少しずつ返してきた借金を完済し、帳面から名前を消してもらった。", { gold: -12, debt: -12, action: "clear-loan" }),
  defineEvent("wealth-property", "財産・借金", { minAge: 25, minimumGold: TUNING.homePricesLegacyG.small, oncePerLife: true }, () => "長年の貯金で小さな家を相場どおりの価格で手に入れ、初めて自分の住所を持った。", { gold: -TUNING.homePricesLegacyG.small, fame: 2, flag: "owns-home", action: "buy-home" }),

  defineEvent("health-fever", "病気・事故", { minAge: 5, oncePerLife: true }, () => "高熱に倒れたが、家族と町医者の看病で回復した。", { health: "回復中", gold: -2, flag: "survived-fever" }),
  defineEvent("health-work-injury", "病気・事故", { minAge: 13, occupations: ["農作業", "兵士", "冒険者", "職人見習い", "鍛冶職人"] }, () => "仕事中に怪我を負い、しばらく休んでから現場へ戻った。", { health: "療養中", gold: -3, flag: "work-injury" }),
  defineEvent("health-accident-rescue", "病気・事故", { minAge: 10, oncePerLife: true }, () => "移動中の事故から通行人を助け、自分も軽傷を負った。", { health: "回復中", fame: 3, flag: "rescued-traveler" }),
  defineEvent("health-epidemic", "病気・事故", { minAge: 12, oncePerLife: true }, () => "疫病が町に広がるなか、隔離と薬の助けで病を乗り越えた。", { health: "回復中", gold: -4, flag: "survived-epidemic" }),
  defineEvent("health-recovery", "病気・事故", { minAge: 14, healthStates: ["療養中", "回復中"], oncePerLife: true }, () => "十分な休養を取り、体調が戻っていつもの暮らしに復帰した。", { health: "健やか", fame: 1, action: "recover" }),

  defineEvent("magic-first-spark", "魔法・種族固有", { minAge: 6, maxAge: 25, oncePerLife: true, custom: (life) => life.mana === undefined || life.mana >= 1 }, () => "眠っていた魔力の存在に気づき、指先に小さな光がともった。", { flag: "awakened-magic" }),
  defineEvent("magic-race-training", "魔法・種族固有", { minAge: 12, requiresFlag: "awakened-magic", custom: (life) => life.mana === undefined || life.mana >= 1 }, () => "一族に伝わる呼吸法を教わり、魔力の扱い方を知った。", { flag: "magic-breathing-learned" }),
  defineEvent("race-beastkin-senses", "魔法・種族固有", { raceIds: ["beastkin"], minAge: 6, oncePerLife: true }, () => "鋭い嗅覚で森道の異変に気づき、旅人を危険から遠ざけた。", { fame: 2, relation: "ally" }),
  defineEvent("race-dwarf-vein", "魔法・種族固有", { raceIds: ["dwarf"], minAge: 18, oncePerLife: true }, () => "山道の岩肌から鉱脈を見つけ、採掘仲間と採掘権を分け合った。", { gold: 12 }),
  defineEvent("race-elf-spirit", "魔法・種族固有", { raceIds: ["elf"], minAge: 13, oncePerLife: true }, () => "森の精霊の光が弱まっていることに気づき、長老と原因を探った。", { fame: 2 }),
  defineEvent("race-demon-control", "魔法・種族固有", { raceIds: ["demon"], minAge: 13, oncePerLife: true }, () => "あふれる魔力で家財を揺らした後、家族から魔力の制御法を教わった。", { flag: "controlled-demon-magic" }),
  defineEvent("race-dragon-flight", "魔法・種族固有", { raceIds: ["dragon"], minAge: 6, maxAge: 40, oncePerLife: true }, () => "初めて自分の力だけで飛び、雲の上から広い山並みを見渡した。", { fame: 2, flag: "first-flight" }),
  defineEvent("race-vampire-oath", "魔法・種族固有", { raceIds: ["vampire"], minAge: 18, oncePerLife: true }, () => "夜の眷属を守る誓いを立て、血族の長から一族の印を授かった。", { fame: 2, flag: "vampire-oath" }),

  defineEvent("nation-border-war", "国家・戦争・冒険", { minAge: 18, oncePerLife: true }, (life) => `${life.nation.name}の国境で戦が起き、家族と避難先や物資を確かめた。`, { gold: -5, fame: 1, flag: "lived-through-war" }),
  defineEvent("nation-caravan-escort", "国家・戦争・冒険", { minAge: 16, occupations: ["兵士", "冒険者", "商人"], oncePerLife: true }, () => "危険な街道を行く隊商を護衛し、無事な到着と報酬を得た。", { gold: 10, fame: 3 }),
  defineEvent("nation-council", "国家・戦争・冒険", { nationIds: ["forest"], minAge: 18, oncePerLife: true }, () => "長老会議で森の保護策が決まり、住民の採集と狩りの約束が変わった。", { fame: 2, flag: "forest-covenant" }),
  defineEvent("nation-empire-draft", "国家・戦争・冒険", { nationIds: ["empire"], minAge: 18, occupations: ["兵士", "冒険者", "農作業", "職人見習い"], oncePerLife: true }, () => "帝国の徴兵令が出され、家族や同僚と今後の暮らしを話し合った。", { fame: 1, flag: "empire-draft" }),
  defineEvent("nation-expedition", "国家・戦争・冒険", { minAge: 20, occupations: ["冒険者", "商人", "兵士"], oncePerLife: true }, () => "地図にない遺跡への遠征に加わり、仲間と協力して無事に帰還した。", { gold: 8, fame: 4, flag: "explored-ruins" }),
  defineEvent("baby-first-words", "幼少期・日常", { minAge: 1, maxAge: 3, oncePerLife: true, excludeRaceIds: ["dragon"] }, () => "初めて言葉を口にして、家族みんなが笑顔になった。", { happy: 3 }, 2),
  defineEvent("child-sibling-fight", "幼少期・日常", { minAge: 4, maxAge: 12, oncePerLife: true, custom: (life) => (life.siblings ?? 0) > 0 }, () => "兄弟とはじめて大喧嘩をして、親に二人そろって叱られた。", { happy: -2 }, 2),
  defineEvent("child-sibling-play", "幼少期・日常", { minAge: 3, maxAge: 13, cooldownYears: 2, custom: (life) => (life.siblings ?? 0) > 0 }, () => "兄弟と日が暮れるまで遊び、泥だらけで帰って笑われた。", { happy: 2 }),
  defineEvent("child-fire-magic", "幼少期・日常", { minAge: 6, maxAge: 11, oncePerLife: true, custom: (life) => life.mana !== undefined && life.mana >= 1 }, () => "親に内緒で火の魔法を使ってみたところ、見つかってこっぴどく怒られた。", { fame: 0, happy: -1 }, 2),
  defineEvent("child-slime-play", "幼少期・日常", { minAge: 6, maxAge: 9, oncePerLife: true, excludeRaceIds: ["dragon"] }, () => "友達と一緒にスライムを棒でつついて遊んだ。", { relation: "friend", happy: 2 }, 2),
  defineEvent("child-sword-practice", "幼少期・日常", { minAge: 6, maxAge: 10, oncePerLife: true, excludeRaceIds: ["dragon"] }, () => "父親と木の棒で剣の練習をしてみた。思ったより腕が重かった。", { happy: 2 }, 2),
  defineEvent("child-monster-tale", "幼少期・日常", { minAge: 5, maxAge: 11, oncePerLife: true, excludeRaceIds: ["dragon"] }, () => "モンスターの話を聞いて、その日の夜はなかなか眠れなかった。", { happy: -1 }, 2),
  defineEvent("child-night-stars", "幼少期・日常", { minAge: 5, maxAge: 14, oncePerLife: true }, () => "夜空いっぱいの星を見上げ、あの向こうには何があるのだろうと考えた。", { happy: 1 }),
  defineEvent("child-stray-animal", "幼少期・日常", { minAge: 5, maxAge: 13, oncePerLife: true, excludeRaceIds: ["dragon"] }, () => "道端で見つけた迷子の子猫にこっそり食べ物を分けてやった。", { happy: 2 }),
  defineEvent("child-festival", "幼少期・日常", { minAge: 4, maxAge: 15, cooldownYears: 2, excludeRaceIds: ["dragon"] }, (life) => `${life.home}の祭りで、屋台の甘い菓子を握りしめて歩き回った。`, { happy: 3 }),
  defineEvent("child-chores", "幼少期・日常", { minAge: 5, maxAge: 13, cooldownYears: 2, excludeRaceIds: ["dragon"] }, () => "水汲みの手伝いを任され、初めて一人でやり遂げた。", { happy: 1 }),
  defineEvent("child-scolded", "幼少期・日常", { minAge: 5, maxAge: 13, cooldownYears: 3, excludeRaceIds: ["dragon"] }, () => "いたずらが見つかって、夕食の前に長々と説教をされた。", { happy: -1 }),
  defineEvent("child-winter-night", "幼少期・日常", { minAge: 3, maxAge: 12, cooldownYears: 3, excludeRaceIds: ["dragon"] }, () => "寒い夜、家族と暖炉を囲んで古い昔話を聞かせてもらった。", { happy: 2 }),
  defineEvent("child-lost-in-town", "幼少期・日常", { minAge: 4, maxAge: 10, oncePerLife: true, excludeRaceIds: ["dragon"] }, () => "市場で迷子になり、泣きそうなところを見知らぬ人が親のもとへ連れていってくれた。", { happy: -1 }),

  defineEvent("adult-noble-scandal", "噂・日常", { minAge: 18, cooldownYears: 3 }, () => "行商人の噂では、都会の貴族にスキャンダルがあったらしい。", { happy: 1 }),
  defineEvent("adult-dungeon-talk", "噂・日常", { minAge: 18, cooldownYears: 3, custom: (life) => Boolean(friendNpc(life)) }, (life) => `友人の${friendNpc(life)?.name ?? "友"}と、新しく見つかったダンジョンの話で盛り上がった。`, { happy: 2 }),
  defineEvent("adult-dragon-rumor", "噂・日常", { minAge: 16, cooldownYears: 4, excludeRaceIds: ["dragon"] }, () => "遠くの村にドラゴンが現れたらしい。恐ろしくて、その日はなかなか寝付けなかった。", { happy: -1 }),
  defineEvent("adult-bard-song", "噂・日常", { minAge: 14, cooldownYears: 3, excludeRaceIds: ["dragon"] }, () => "旅の吟遊詩人が広場で歌い、遠い国の英雄の話に聞き入った。", { happy: 2 }),
  defineEvent("adult-tax-collector", "噂・日常", { minAge: 18, cooldownYears: 4 }, () => "徴税官が村を訪れ、今年の税の話で皆が顔をしかめていた。", { happy: -1 }),
  defineEvent("adult-harvest-feast", "噂・日常", { minAge: 16, cooldownYears: 2, excludeRaceIds: ["dragon"] }, (life) => `${life.home}の収穫祭で、皆と飲み食いして一年の労をねぎらった。`, { happy: 3 }),
  defineEvent("adult-new-year", "噂・日常", { minAge: 16, cooldownYears: 2, excludeRaceIds: ["dragon"] }, () => "新年を迎え、これから一年の無事を静かに祈った。", { happy: 1 }),
  defineEvent("adult-travel-merchant", "噂・日常", { minAge: 16, cooldownYears: 3, excludeRaceIds: ["dragon"] }, () => "珍しい品を積んだ旅の商人が町に立ち寄り、人だかりができていた。", { happy: 1 }),
  defineEvent("adult-bad-weather", "噂・日常", { minAge: 16, cooldownYears: 3, excludeRaceIds: ["dragon"] }, () => "長雨が続き、屋根の修理や仕事の遅れに追われた。", { happy: -1 }),
  defineEvent("adult-old-letter", "噂・日常", { minAge: 20, cooldownYears: 5, excludeRaceIds: ["dragon"] }, () => "故郷から便りが届き、懐かしい顔ぶれの近況を知った。", { happy: 2 }),

  defineEvent("married-anniversary", "家族・人間関係", { minAge: 19, requiresFlag: "married", cooldownYears: 3, custom: (life) => Boolean(life.marriage) && (life.age - life.marriage.since) * life.race.multiplier >= 1 }, (life) => `配偶者の${life.spouse ?? "あの人"}と結婚して${Math.floor((life.age - life.marriage.since) * life.race.multiplier)}年が経った。`, { happy: 3 }),
  defineEvent("child-first-words", "家族・人間関係", { minAge: 1, custom: (life) => livingChildren(life).some((npc) => npc.humanAge >= 0.5 && npc.humanAge <= 3) }, (life) => `子の${livingChildren(life).find((npc) => npc.humanAge >= 0.5 && npc.humanAge <= 3)?.name}が初めて言葉を話した。`, { happy: 6 }, 3),
  defineEvent("child-first-steps", "家族・人間関係", { minAge: 1, custom: (life) => livingChildren(life).some((npc) => npc.humanAge >= 0.3 && npc.humanAge <= 2.5) }, (life) => `子の${livingChildren(life).find((npc) => npc.humanAge >= 0.3 && npc.humanAge <= 2.5)?.name}がよちよちと歩き始め、思わず手を差し伸べた。`, { happy: 5 }, 3),
  defineEvent("child-starts-school", "家族・人間関係", { minAge: 6, custom: (life) => livingChildren(life).some((npc) => npc.humanAge >= 5.5 && npc.humanAge <= 8) }, (life) => `子の${livingChildren(life).find((npc) => npc.humanAge >= 5.5 && npc.humanAge <= 8)?.name}が新しい服で学び舎へ通い始めた。`, { happy: 3 }, 2),
  defineEvent("child-helps-home", "家族・人間関係", { minAge: 8, cooldownYears: 3, custom: (life) => livingChildren(life).some((npc) => npc.humanAge >= 7 && npc.humanAge <= 14) }, (life) => `子の${livingChildren(life).find((npc) => npc.humanAge >= 7 && npc.humanAge <= 14)?.name}が家の手伝いを買って出て、少し頼もしくなった。`, { happy: 3 }),
  defineEvent("child-growing-up", "家族・人間関係", { minAge: 10, cooldownYears: 3, custom: (life) => livingChildren(life).some((npc) => npc.humanAge >= 3 && npc.humanAge <= 15) }, (life) => `子の${livingChildren(life).find((npc) => npc.humanAge >= 3 && npc.humanAge <= 15)?.name}の背が伸び、去年の服がもう着られなくなっていた。`, { happy: 2 }),
  defineEvent("parent-teaching", "家族・人間関係", { minAge: 10, maxAge: 40, cooldownYears: 3, custom: (life) => livingParents(life).length > 0 }, () => "親から昔の仕事の話を聞き、少し大人になった気がした。", { happy: 1 }),

  defineEvent("elder-aching-joints", "老年期", { minAge: 55, cooldownYears: 3 }, () => "足腰の痛む日々が増えた。", { happy: -2 }, 2),
  defineEvent("elder-memories", "老年期", { minAge: 60, cooldownYears: 3 }, () => "ふと昔の友人たちの顔を思い出し、窓の外を長く眺めていた。", { happy: 1 }, 2),
  defineEvent("elder-slow-morning", "老年期", { minAge: 60, cooldownYears: 3 }, () => "朝の目覚めが早くなり、静かな庭で茶を飲む時間が好きになった。", { happy: 2 }),
  defineEvent("elder-young-visitor", "老年期", { minAge: 55, cooldownYears: 4, custom: (life) => livingChildren(life).length > 0 }, () => "子や孫のような若者たちが訪ねてきて、昔話をせがまれた。", { happy: 3 }),
  defineEvent("elder-eyesight", "老年期", { minAge: 65, cooldownYears: 5 }, () => "細かい文字が読みにくくなり、灯りを近づけるようになった。", { happy: -1 }),
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
  const cooldownYears = typeof requirements.cooldownYears === "function"
    ? requirements.cooldownYears(life) : requirements.cooldownYears ?? 0;
  if (lastOccurrence && age - lastOccurrence.age < cooldownYears) return false;
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

const INFANCY_EVENTS = [
  { age: 0.5, text: (life) => `この世界には人間や獣人、エルフなどが暮らしている。あなたは${life.race.name}として生を受けた。${life.race.name}の最高寿命は${life.race.lifespan}歳、成人は${18 * life.race.multiplier}歳だ。` },
  { age: 1, text: (life) => `あなたの身分は${life.status.name}。${life.status.name === "奴隷" ? "自由が制限される身分の家に生まれた。" : life.status.name === "無戸籍・流民" ? "公的な戸籍を持たず、暮らしの基盤を探す家に生まれた。" : ["王族", "貴族"].includes(life.status.name) ? "家の名と責任を受け継ぐことを期待される家に生まれた。" : "日々の仕事で生計を立てる家に生まれた。"}父は${life.parents.father}、母は${life.parents.mother}として家の暮らしを支えている。` },
  { age: 2, text: (life) => life.race.id === "dragon" ? "親竜に見守られ、巣の中で翼を広げる練習を始めた。" : `${life.home}の家で、初めて自分の足で歩き、家族の呼び名を覚えた。` },
  { age: 3, text: (life) => `${life.nation.name}には魔術や魔物が存在する。家族から外の世界の話を聞き、安全な場所と近づいてはいけない場所を少しずつ覚えた。` },
];

function nextInfancyEvent(life) {
  if (life.age > 3) return null;
  return INFANCY_EVENTS.find((event) => event.age > (life.childhoodContextThrough ?? life.age));
}

function createInitialDecisionAge(random) {
  return Math.min(
    TUNING.firstDecisionLatestAge,
    TUNING.firstDecisionEarliestAge + rollExponential(TUNING.firstDecisionMeanYears, random),
  );
}

export function createLife(random = Math.random) {
  const race = weightedPick(RACES, (item) => item.weight, random);
  const initialOccupation = race.id === "dragon" ? "まだ幼い子ども" : "家業の手伝い";
  const nation = pickNation(race, random);
  const status = pickStatus(nation, random);
  const gender = randomItem(GENDERS, random);
  const home = randomItem(HOME_TYPES, random);
  const birthName = generatePersonName(random, gender);
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
    name: birthName.name,
    familySurname: birthName.surname,
    nameCulture: birthName.culture,
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
    childhoodContextThrough: 0,
    dungeonOffers: 0,
    nextDungeonAt: TUNING.dungeonOfferAges[0],
    educationStatus: "未就学",
    school: null,
    mentor: null,
    trainingSkill: null,
    trainingEndsAt: null,
    trainingPlan: null,
    educationHistory: [],
    occupationRole: initialOccupation,
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
    nextSocialAt: 13 + rollExponential(3, random),
    demonKingRiseAt: 47.5,
    demonKingStarted: false,
    demonKingActive: false,
    demonKingDefeated: false,
    careerHistory: [],
    npcs: [],
    health,
    fame: 0,
    occupation: initialOccupation,
    occupationSkill: 0,
    occupationYears: 0,
    occupationRank: "初心者",
    graduationPending: false,
    graduationSkill: null,
    familyCount: 0,
    siblings: 0,
    spouse: null,
    children: [],
    eventCount: 0,
    journal: [],
    eventHistory: [],
    historyFlags: [],
    happiness: 50,
    spendHistory: {},
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
  life.journal ??= [];
  life.eventHistory ??= [];
  const event = { age: life.age, text: asText(text), kind, label, id };
  life.journal.push(event);
  life.eventCount += 1;
  if (id) life.eventHistory.push({ id, age: life.age });
  const place = ["農村", "辺境"].includes(life.home) ? "村" : "町";
  const milestones = [
    [25, `名声が25を超えた。あなたは周囲の人気者だ。${place}のみんなに頼りにされている。`],
    [50, `名声が50を超えた。あなたは${place}一番の人気者だ。子供たちはあなたに憧れている。`],
    [100, "名声が100に到達した。あなたの名前は伝説として歴史に刻まれた。"],
  ];
  for (const [threshold, message] of milestones) {
    const milestoneId = `fame-milestone-${threshold}`;
    if ((life.fame ?? 0) < threshold || (life.eventHistory ?? []).some((entry) => entry.id === milestoneId)) continue;
    life.journal.push({ age: life.age, text: message, kind: "life", label: "名声", id: milestoneId });
    life.eventHistory.push({ id: milestoneId, age: life.age });
    life.eventCount += 1;
  }
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

function raiseLinkedStat(life, skill, gained) {
  if (gained <= 0) return;
  if ((skill === "magic" || skill === "faith") && life.mana > 0) life.mana = Math.min(STAT_GROWTH_CAP, life.mana + gained * STAT_GROWTH_RATE);
  const linked = SKILL_STAT_LINKS[skill];
  if (linked && life.baseStats) {
    life.baseStats[linked] = Math.min(STAT_GROWTH_CAP, (life.baseStats[linked] ?? 50) + gained * STAT_GROWTH_RATE);
  }
}

function addSkillPoints(life, skill, amount, source = "出来事") {
  const skills = ensureSkillState(life);
  const before = skills[skill] ?? 0;
  skills[skill] = Math.max(0, before + amount);
  raiseLinkedStat(life, skill, skills[skill] - before);
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
  for (const [skill, practice] of Object.entries(life.skillPractice ?? {})) {
    if (practice.activity > 0) plans.set(skill, practice);
  }
  const occupationSkill = OCCUPATION_SKILLS[life.occupation];
  if (life.age >= 13 && !NON_WORKING.includes(life.occupation) && occupationSkill) {
    const practice = plans.get(occupationSkill);
    plans.set(occupationSkill, {
      activity: TUNING.occupationSkillActivity + (practice?.activity ?? 0),
      learning: practice?.learning ?? 1,
    });
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
  const plans = skillGrowthPlans(life);
  if (plans.size === 0) return;
  const skills = ensureSkillState(life);
  const accumulatedMonths = (life.skillMonthProgress ?? 0) + humanYears * 12;
  const completeMonths = Math.floor(accumulatedMonths + Number.EPSILON);
  life.skillMonthProgress = accumulatedMonths - completeMonths;
  const raceFactor = RACE_SKILL_FACTORS[life.race?.id] ?? {};
  const ageMultiplier = RACE_AGE_MULTIPLIERS[life.race?.id] ?? life.race?.multiplier ?? 1;

  for (let month = 0; month < completeMonths; month += 1) {
    for (const [skill, plan] of plans) {
      const before = skills[skill] ?? 0;
      const talent = life.skillTalents[skill] ?? "普通";
      const deltaActualYears = SKILL_MONTH * (life.race?.multiplier ?? 1);
      const gained = skillGrowthDelta(
        before,
        plan.activity,
        talent,
        raceFactor[skill] ?? 1,
        plan.learning,
        deltaActualYears / ageMultiplier,
      );
      skills[skill] = before + gained;
      raiseLinkedStat(life, skill, gained);
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
  if (effect.happy) adjustHappiness(life, effect.happy);
  if (event.id === "magic-first-spark" && !life.trainingPlan) life.educationStatus = "魔力が目覚めた";
  if (effect.health) {
    life.health = effect.health;
    life.illnessUntil = effect.health === "健やか" ? life.age : life.age + 0.5 + random();
  }
  if (effect.relation) addRelationship(life, effect.relation);
  addFlag(life, effect.flag);

  switch (effect.action) {
    case "retire":
      addFlag(life, "retirement-choice-resolved");
      break;
    case "buy-home":
      life.ownsHome = true;
      life.homeType = "small";
      life.homeValue = TUNING.homePricesLegacyG.small;
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

function changeOccupation(life, occupation, reason = "就職・転職") {
  if (life.occupation === occupation) return;
  ensureSkillState(life);
  const previous = life.occupation;
  const previousSkill = OCCUPATION_SKILLS[previous] ?? "general";
  const nextSkill = OCCUPATION_SKILLS[occupation] ?? "general";
  if (previousSkill !== nextSkill && !TRAINEE_OCCUPATIONS.includes(occupation)) {
    life.skills[nextSkill] = 0;
  }
  life.careerHistory ??= [];
  life.careerRecords ??= {};
  life.careerRecords[previous] = { years: life.occupationYears ?? 0, role: life.occupationRole ?? previous };
  life.careerHistory.push({
    from: previous, to: occupation, age: life.age, reason,
    yearsInPrevious: Math.round((life.occupationYears ?? 0) * 10) / 10,
  });
  life.nextCareerReviewAt = null;
  life.occupation = occupation;
  life.occupationYears = 0;
  life.occupationRole = occupation;
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

export function occupationSkillName(life) {
  return skillName(OCCUPATION_SKILLS[life.occupation] ?? "general");
}

function lifeStage(age) {
  if (age < 6) return "child";
  if (age < 13) return "school";
  if (age < 18) return "youth";
  if (age < 35) return "youngAdult";
  if (age < 60) return "middle";
  return "elder";
}

export const SAVE_VERSION = 5;

// Provisional monthly wages in G (base role). 1G is treated as roughly 5,000 yen of buying power in the
// design notes, but realistic wages at that rate do not fit the existing 4–60G choice prices, so these
// are scaled-down placeholder values pending the designer's economy decision.
const OCCUPATION_INCOME = Object.freeze({
  "まだ幼い子ども": 0,
  "家業の手伝い": 1.5,
  "農作業": 3.5,
  "服飾店の見習い": 3.4,
  "職人見習い": 3.5,
  "鍛冶職人": 3.8,
  "兵士": 3.7,
  "商人": 3.7,
  "冒険者": 3.7,
  "教師": 3.8,
  "魔術師": 4.4,
  "聖職者": 3.0,
  "魔術師の弟子": 0,
  "魔術学院生": 0,
  "剣術の弟子": 0,
  "騎士学院生": 0,
  "学術院生": 0,
  "騎士": 4.6,
  "学者": 4.4,
  "工房主": 4.6,
  "失業中": 0.4,
  "引退": 0.8,
  "隣家の手伝い": 2.5,
  "狩りを覚える": 1.5,
  "巣の外を探検する": 1.5,
  "縄張りを見回る": 1.5,
});

export const CRAFT_OCCUPATIONS = ["職人見習い", "服飾店の見習い", "鍛冶職人"];

const CRAFT_LADDER = [
  { role: "一人前の職人", minSkill: 40, minYears: 3, mult: 1.2 },
  { role: "熟練職人", minSkill: 55, minYears: 7, mult: 1.45 },
  { role: "親方", minSkill: 75, minYears: 13, minGold: 20, mult: 1.8 },
];

const ROLE_LADDERS = Object.freeze({
  "農作業": [
    { role: "熟練農民", minSkill: 40, minYears: 5, mult: 1.2 },
    { role: "農地所有者", minSkill: 60, minYears: 14, minGold: 40, mult: 1.6 },
  ],
  "職人見習い": CRAFT_LADDER,
  "服飾店の見習い": CRAFT_LADDER,
  "鍛冶職人": CRAFT_LADDER,
  "兵士": [
    { role: "士官", minSkill: 45, minYears: 6, minFame: 3, mult: 1.35 },
    { role: "将軍", minSkill: 80, minYears: 20, minFame: 25, mult: 2.2 },
  ],
  "冒険者": [
    { role: "上位冒険者", minSkill: 40, minYears: 5, mult: 1.35 },
    { role: "伝説級冒険者", minSkill: 80, minYears: 15, minFame: 20, mult: 2 },
  ],
  "商人": [
    { role: "大商人", minSkill: 45, minYears: 8, minGold: 60, mult: 1.5 },
    { role: "商会主", minSkill: 70, minYears: 15, minGold: 150, mult: 2.4 },
  ],
  "教師": [
    { role: "主任教師", minSkill: 45, minYears: 8, mult: 1.25 },
    { role: "学院長", minSkill: 75, minYears: 18, minFame: 8, mult: 1.8 },
  ],
  "魔術師": [
    { role: "熟練魔術師", minSkill: 50, minYears: 6, mult: 1.35 },
    { role: "宮廷魔術師", minSkill: 80, minYears: 15, minFame: 12, mult: 2 },
  ],
  "学者": [
    { role: "教授", minSkill: 60, minYears: 10, mult: 1.45 },
  ],
  "聖職者": [
    { role: "司祭", minSkill: 0, minYears: 8, mult: 2.4 },
  ],
});

const TRAINEE_OCCUPATIONS = ["魔術師の弟子", "魔術学院生", "剣術の弟子", "騎士学院生", "学術院生"];
const NON_WORKING = ["まだ幼い子ども", "引退", "失業中", "隣家の手伝い"];

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
  "戦争中": { weight: 3, price: 1.25, income: { "商人": 1.05, "農作業": 0.85, "冒険者": 1.1, "兵士": 1.05 }, defaultIncome: 0.95, npcHazard: 1.5, illness: 1 },
  "疫病流行": { weight: 2, price: 1.1, income: {}, defaultIncome: 0.9, npcHazard: 4, illness: 3 },
  "飢饉": { weight: 1.5, price: 1.8, income: { "農作業": 0.4 }, defaultIncome: 0.9, npcHazard: 2, illness: 1.3 },
  "不況": { weight: 2, price: 1.15, income: { "商人": 0.5 }, defaultIncome: 0.8, npcHazard: 1, illness: 1 },
  "魔王君臨": { weight: 0, price: 1.25, income: { "農作業": 0.4, "商人": 0.65 }, defaultIncome: 0.8, npcHazard: 1.2, illness: 1.2 },
  "魔物の襲撃": { weight: 1.5, price: 1.1, income: { "冒険者": 1.1, "農作業": 0.8 }, defaultIncome: 1, npcHazard: 1.3, illness: 1 },
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
  "魔王君臨": () => "北に魔王が君臨したようだ。魔王が倒されるまでの間、経済は不況、農業は不作に陥る。",
  "魔物の襲撃": () => "魔物の群れが人里を襲うようになった。辺境や農村では被害が出ている。",
});

const WORLD_END_TEXT = Object.freeze({
  "戦争中": "戦争が終わり、兵士たちが故郷へ戻り始めた。",
  "疫病流行": "疫病の流行が収まり、町に日常が戻った。",
  "飢饉": "収穫が回復し、食料の値が落ち着いた。",
  "不況": "景気が持ち直し、仕事が戻ってきた。",
  "魔王君臨": "魔王が討伐され、景気と農業が少しずつ回復し始めた。",
  "魔物の襲撃": "魔物の群れは討伐され、街道に平穏が戻った。",
});

function applyWorldOnset(life, situation, random) {
  const impacts = [];
  if (situation === "疫病流行") {
    impacts.push("病気にかかりやすくなり、親しい人の安否も気がかりだ");
  } else if (situation === "飢饉") {
    impacts.push("生活費が大きく増えた");
  } else if (situation === "不況") {
    if (life.age >= 13) impacts.push("不況で仕事の賃金が下がっている");
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
    if (ended === "魔王君臨") {
      life.demonKingActive = false;
      life.demonKingDefeated = true;
    }
    appendEvent(life, WORLD_END_TEXT[ended], "world", "世界情勢", `world-end-${ended}-${Math.floor(life.age)}`);
    return;
  }
  const choice = weightedPick(
    Object.entries(WORLD_TABLE).filter(([situation]) => situation !== "魔王君臨"),
    ([, entry]) => entry.weight,
    random,
  )[0];
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

function childNeeding(life, predicate) {
  return livingChildren(life).find(predicate) ?? null;
}

function pendingNamingChild(life) {
  return childNeeding(life, (npc) => npc.nameDecided === false);
}

export function monthlyBudget(life, random = null) {
  const mods = worldModifiers(life);
  const working = life.age >= 13 && !(life.occupation === "まだ幼い子ども");
  let work = working ? (OCCUPATION_INCOME[life.occupation] ?? 1) * roleMultiplier(life)
    * (1 + Math.min(100, life.occupationSkill ?? 0) / TUNING.occupationSkillPayDivisor) * TUNING.wageMultiplier : 0;
  if (life.occupation === (life.businessOccupation ?? "商人")) work += life.businessRevenue ?? 0;
  work *= working ? mods.incomeFor(life.occupation) : 1;
  if (random && life.occupation === "冒険者") work *= 0.4 + 1.2 * random();
  const spouse = spouseNpc(life);
  const spouseWork = spouse ? (OCCUPATION_INCOME[spouse.occupation] ?? 1) * 0.9 * TUNING.wageMultiplier * mods.incomeFor(spouse.occupation) : 0;
  const owned = Boolean(life.ownsHome);
  const adult = life.age >= 18;
  const living = (life.age < 15 ? 0 : life.age < 18 ? TUNING.youthLivingCostLegacyG : TUNING.adultLivingCostLegacyG) * mods.price;
  const rent = adult && !owned ? TUNING.homeRentLegacyG * mods.price : 0;
  const children = livingChildren(life).filter((npc) => !npc.independent);
  const familyCost = ((spouse ? TUNING.adultLivingCostLegacyG : 0) + children.reduce((sum, npc) => sum + ((npc.humanAge ?? 0) < 15 ? 0.5 : 0.3), 0)) * mods.price;
  const medical = life.health !== "健やか" && life.age >= 15 ? 0.5 * mods.price : 0;
  const interest = life.debt * 0.008;
  const baseLifestyle = adult
    ? TUNING.lifestyleCostLegacyG * (1 + TUNING.lifestyleCostRoleGrowth * (roleMultiplier(life) - 1)) * mods.price
    : 0;
  const upkeep = ((owned ? TUNING.homeUpkeepLegacyG[life.homeType ?? "small"] ?? 0 : 0)
    + ((life.historyFlags ?? []).includes("has-pet") ? TUNING.petUpkeepLegacyG : 0)) * mods.price;
  const income = work + spouseWork;
  const household = !adult ? Math.max(0, income - living - familyCost - medical - interest - upkeep)
    * TUNING.youthHouseholdContributionRate : 0;
  // Higher household income also funds taxes, social obligations and everyday spending.
  const basicExpenses = living + rent + familyCost + medical + interest + baseLifestyle + upkeep + household;
  const repayment = life.debt > 0 ? Math.min(life.debt, Math.max(0, (income - basicExpenses) * 0.4)) : 0;
  const scholarshipRepayment = (life.scholarshipBalance ?? 0) > 0 && income - basicExpenses - repayment >= income * TUNING.scholarshipRepaymentRate
    ? Math.min(life.scholarshipBalance, income * TUNING.scholarshipRepaymentRate)
    : 0;
  const disposable = Math.max(0, income - basicExpenses - repayment - scholarshipRepayment);
  const discretionary = adult ? disposable * TUNING.discretionarySpendingRate
    + Math.max(0, disposable - TUNING.highIncomeSpendingThreshold) * TUNING.highIncomeSpendingRate : 0;
  const lifestyle = baseLifestyle + household + discretionary;
  const expenses = living + rent + familyCost + medical + interest + lifestyle + upkeep;
  return {
    income: { work, spouse: spouseWork },
    expenses: { living, rent, family: familyCost, medical, interest, lifestyle, upkeep },
    repayment,
    scholarshipRepayment,
    totalIncome: income,
    totalExpense: expenses,
    net: income - expenses - repayment - scholarshipRepayment,
  };
}

const CAREER_REVIEW_YEARS = [5, 10];
const nextReviewGap = (random) => CAREER_REVIEW_YEARS[0] + random() * (CAREER_REVIEW_YEARS[1] - CAREER_REVIEW_YEARS[0]);
const FIRST_CAREER_MIN_AGE = 13;
const FIRST_CAREER_FALLBACK_AGE = 15;
const FIRST_CAREER_MAX_AGE = 25;

const CAREER_CATALOG = Object.freeze([
  { occupation: "家業の手伝い", skill: "manual", minimum: 0, minAge: 10, description: "家の仕事を支える" },
  { occupation: "農作業", skill: "farming", minimum: 0, minAge: 10, description: "畑や牧場で働く" },
  { occupation: "職人見習い", skill: "craft", minimum: 0, minAge: 10, description: "職人の工房で働く" },
  { occupation: "服飾店の見習い", skill: "tailoring", minimum: 0, minAge: 10, description: "服飾店で技術を学ぶ" },
  { occupation: "鍛冶職人", skill: "smithing", minimum: 5, minAge: 12, description: "鍛冶場で働く" },
  { occupation: "兵士", skill: "combat", minimum: 5, minAge: 13, description: "町や街道を守る" },
  { occupation: "商人", skill: "trade", minimum: 5, minAge: 13, description: "品物を仕入れ販売する" },
  { occupation: "冒険者", skill: "adventuring", minimum: 5, minAge: 15, description: "依頼や探索を行う" },
  { occupation: "魔術師", skill: "magic", minimum: 5, minAge: 18, mana: 20, description: "魔術を使い人々を助ける" },
  { occupation: "教師", skill: "teaching", minimum: 5, minAge: 18, literacy: 5, description: "学び舎で教える" },
  { occupation: "学者", skill: "scholarship", minimum: 5, minAge: 18, literacy: 5, description: "知識を研究する" },
  { occupation: "騎士", skill: "swordsmanship", minimum: 5, minAge: 18, knight: true, description: "騎士団に仕える" },
  { occupation: "聖職者", skill: "faith", minimum: 0, minAge: 18, mana: 20, description: "教会に仕え、祈りと奉仕で人々を支える" },
]);

function careerQualified(life, career) {
  const skill = life.skills?.[career.skill] ?? 0;
  if (life.age < career.minAge || skill < career.minimum) return false;
  if (career.mana && life.mana < career.mana) return false;
  if (career.literacy && (life.skills?.literacy ?? 0) < career.literacy) return false;
  if (career.knight && !["王族", "貴族"].includes(life.status?.name) && currentStats(life).combat < 75) return false;
  return true;
}

export function availableCareerOptions(life, { occupations, excludeCurrent = true } = {}) {
  return CAREER_CATALOG.filter((career) => (!occupations || occupations.includes(career.occupation))
    && (!excludeCurrent || career.occupation !== life.occupation)
    && careerQualified(life, career));
}

function careerPreview(life, career, firstCareer = false) {
  const sameSkill = (OCCUPATION_SKILLS[life.occupation] ?? "general") === career.skill;
  const salaryLife = {
    ...life,
    age: Math.max(life.age, 13),
    occupation: career.occupation,
    occupationRole: career.occupation,
    occupationSkill: sameSkill ? life.skills?.[career.skill] ?? 0 : 0,
  };
  const salary = monthlyBudget(salaryLife).income.work;
  const situation = life.world?.situation ?? life.situation;
  const situationLabel = situation && !["平和", "平穏"].includes(situation) ? `（${situation}）` : "";
  const skill = Math.round(life.skills?.[career.skill] ?? 0);
  return [
    `月給${situationLabel}: 約${salary.toFixed(1)}G`,
    `必要技能: ${skillName(career.skill)}${firstCareer ? "（未経験でも応募可）" : `${career.minimum}+`}（現在${skill}）・${career.description}。${sameSkill ? "同じ技能なので職業技能を引き継げて有利" : "技能が変わるため職業技能は0から開始"}`,
  ];
}

const CAREER_FAMILIES = Object.freeze([
  ["職人見習い", "服飾店の見習い", "鍛冶職人", "工房主"],
  ["兵士", "冒険者", "騎士"],
  ["教師", "学者"],
  ["農作業", "家業の手伝い"],
  ["商人"],
  ["魔術師"],
  ["聖職者"],
]);

const sameCareerFamily = (a, b) => CAREER_FAMILIES.some((family) => family.includes(a) && family.includes(b));

// Explains what a job change might mean, based on the pay difference and whether the work is related.
function careerChangeNote(life, career, salary, currentSalary) {
  const related = OCCUPATION_SKILLS[life.occupation] === career.skill;
  if (related && salary > currentSalary * 1.05) return "同系統の上位の職のポストが空いている。今の仕事内容が活かせる";
  if (related) return "同系統の職場から声がかかった。今の経験が活かせる";
  if (salary > currentSalary * 1.05) return "賃金アップが見込める。ただし新しい仕事を一から覚える必要がある";
  if (salary < currentSalary * 0.95) return "賃金は下がるかもしれないが、新しい暮らしを始められる";
  return "賃金は今とあまり変わらない。気分を変える機会になる";
}

function careerReviewChoices(life) {
  const currentSalary = monthlyBudget(life).income.work;
  const options = availableCareerOptions(life).map((career) => {
    const preview = careerPreview(life, career);
    const salary = monthlyBudget({
      ...life, age: Math.max(life.age, 13), occupation: career.occupation, occupationRole: career.occupation,
      occupationSkill: OCCUPATION_SKILLS[life.occupation] === career.skill ? life.skills?.[career.skill] ?? 0 : 0,
    }).income.work;
    return { career, preview, salary, score: salary + (sameCareerFamily(life.occupation, career.occupation) ? 0.5 : 0) };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
  return options.map(({ career, preview, salary }) => ({
    label: `${career.occupation}に移る`,
    effect: `career-change:${career.occupation}`,
    preview: [...preview, `メリット: ${careerChangeNote(life, career, salary, currentSalary)}`],
  }));
}

// Jobs offered after schooling, chosen by the child's abilities rather than their age.
function firstCareerOptions(life) {
  const stats = currentStats(life);
  const physical = (stats.combat + stats.body) / 2;
  const candidates = [
    { occupation: "兵士", score: physical, gate: physical >= 55 },
    { occupation: "冒険者", score: physical - 3 + (stats.luck - 50) * 0.1, gate: physical >= 58 && life.age >= 15 },
    { occupation: "鍛冶職人", score: (stats.dexterity + stats.body) / 2, gate: stats.dexterity >= 60 && stats.body >= 50 },
    { occupation: "職人見習い", score: stats.dexterity, gate: true },
    { occupation: "服飾店の見習い", score: stats.dexterity * 0.9 + stats.charm * 0.1 - 2, gate: true },
    { occupation: "商人", score: (stats.intellect + stats.charm) / 2 - 2, gate: true },
    { occupation: "農作業", score: 47, gate: true },
  ];
  return candidates.filter((item) => item.gate && life.age >= CAREER_CATALOG.find((career) => career.occupation === item.occupation).minAge).sort((a, b) => b.score - a.score).slice(0, 3)
    .map((item) => CAREER_CATALOG.find((career) => career.occupation === item.occupation));
}

function firstCareerChoices(life) {
  const choices = firstCareerOptions(life).map((career) => ({
    label: `${career.occupation}として働く`,
    effect: `career-first:${career.occupation}`,
    preview: careerPreview(life, career, true),
  }));
  if (!STATUS_BARRED.includes(life.status?.name) && !hasFlag(life, "academy-declined") && !hasFlag(life, "academy-enrolled")) {
    choices.push({ label: "学院を目指す", effect: "path-academy", preview: ["費用: 入学後に確認", "適性・学費に合う学院を探す"] });
  }
  choices.push({ label: "家業の手伝いを続ける", effect: "career-first-family", preview: ["月給: 約1G台", "家の仕事を続けながら、機会を待つ"] });
  return choices;
}

// Marks the moment a young person has to decide what to do next, and keeps the decision timing in step.
function updateCareerCrossroads(life) {
  if (life.race?.id === "dragon" || life.occupation !== "家業の手伝い" || life.trainingPlan) return;
  if (hasFlag(life, "first-career-done") || hasFlag(life, "academy-aspirant")) return;
  if (!life.careerCrossroads && life.age >= FIRST_CAREER_FALLBACK_AGE && life.age <= FIRST_CAREER_MAX_AGE) life.careerCrossroads = true;
  if (life.careerCrossroads && life.crossroadsPulled !== true) {
    life.crossroadsPulled = true;
    life.nextDecisionAt = Math.min(life.nextDecisionAt, Math.max(life.age, FIRST_CAREER_MIN_AGE));
  }
}

// Schedules the periodic "want to try another job?" prompt, roughly every 5-10 human years.
function updateCareerReview(life, random) {
  if (life.age < 18 || life.age >= TUNING.retirementHumanAge) return;
  if (NON_WORKING.includes(life.occupation) || TRAINEE_OCCUPATIONS.includes(life.occupation) || life.trainingPlan) return;
  if (life.nextCareerReviewAt == null) life.nextCareerReviewAt = life.age + nextReviewGap(random);
  if (life.age >= life.nextCareerReviewAt && life.reviewPulledFor !== life.nextCareerReviewAt) {
    life.reviewPulledFor = life.nextCareerReviewAt;
    life.nextDecisionAt = Math.min(life.nextDecisionAt, life.age);
  }
}

function careerChoices(life, { occupations, effect = "career-start", excludeCurrent = true } = {}) {
  return availableCareerOptions(life, { occupations, excludeCurrent }).map((career) => ({
    label: `${career.occupation}を選ぶ`,
    effect: `${effect}:${career.occupation}`,
    preview: careerPreview(life, career),
  }));
}

function processMonth(life, random) {
  const budget = monthlyBudget(life, random);
  life.finance ??= { recent: [], lastMonth: null, monthProgress: 0, totalIncome: 0, totalExpense: 0 };
  const previousGold = life.gold;
  let borrowedThisMonth = 0;
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
    const shortfall = -life.gold;
    borrowedThisMonth = Math.min(shortfall, Math.max(0, TUNING.ordinaryDebtLimit - (life.debt ?? 0)));
    if (borrowedThisMonth > 0) {
      life.debt = (life.debt ?? 0) + borrowedThisMonth;
      recordGold(life, "生活費の借入", borrowedThisMonth);
    }
    life.gold = 0;
    life.financialHardship = true;
  } else {
    life.financialHardship = false;
  }
  adjustHappiness(life, ((life.financialHardship ? 35 : 55) - (life.happiness ?? 50)) * 0.03);
  life.finance.totalIncome += budget.totalIncome;
  life.finance.totalExpense += budget.totalExpense + budget.repayment + budget.scholarshipRepayment;
  life.finance.lastMonth = { age: life.age, ...budget };
  const expenseLogDue = life.finance.lastExpenseLogAt == null || life.age - life.finance.lastExpenseLogAt >= 1;
  if (budget.net < -0.1 && (previousGold > life.gold || borrowedThisMonth > 0 || life.financialHardship)
    && life.age >= 15 && expenseLogDue) {
    const expenses = [
      ["生活費", budget.expenses.living],
      ["家賃", budget.expenses.rent],
      ["家族の生活費", budget.expenses.family],
      ["医療費", budget.expenses.medical],
      ["借金の利息・返済", budget.expenses.interest + budget.repayment],
      ["交際費・その他", budget.expenses.lifestyle],
      ["住居・ペットの維持費", budget.expenses.upkeep],
    ].filter(([, amount]) => amount > 0.05).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const factors = {
      "不況": "不況で収入が減った",
      "飢饉": "飢饉で食料や生活費が上がった",
      "魔王君臨": "魔王の影響で不況と不作が続いている",
      "疫病流行": "疫病で物価が上がっている",
      "戦争中": "戦争で物価が上がっている",
    };
    const causes = expenses.map(([label]) => label);
    if (factors[life.world?.situation]) causes.push(factors[life.world.situation]);
    const cashLoss = Math.min(previousGold, -budget.net);
    if (cashLoss > 0) recordGold(life, causes.join("・") || "家計の支出", -cashLoss);
    appendEvent(
      life,
      `人間換算${Math.floor(life.age)}年目は収入より支出が${gold(-budget.net)}多く、所持金が減った。主な要因: ${causes.join("、") || "毎月の家計"}。${borrowedThisMonth > 0 ? `${gold(borrowedThisMonth)}を借り入れた。` : life.debt >= TUNING.ordinaryDebtLimit ? "借入上限に達しており、これ以上は借りられない。" : ""}`,
      "life", "家計", `finance-expense-${Math.floor(life.age)}`,
    );
    life.finance.lastExpenseLogAt = life.age;
  }
  if (life.gold === 0 && life.financialHardship && life.age >= 15
    && !hasRecentEvent(life, "finance-shortfall", 3)) {
    appendEvent(
      life,
      life.debt >= TUNING.ordinaryDebtLimit
        ? `生活費が足りず、所持金と借入枠を使い切った（借金${gold(life.debt)}）。`
        : `生活費が足りず、所持金を使い切った。借入枠が残っている場合は家計の不足分を借り入れる。`,
      "life", "家計", "finance-shortfall",
    );
  }
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

function lifeNameCulture(life) {
  return NAME_CULTURES.find((culture) => culture.id === life.nameCulture) ?? null;
}

function familySurname(life) {
  return life.familySurname ?? life.name?.split("・").at(-1) ?? null;
}

function namesAlreadyUsed(life) {
  return new Set([
    life.name,
    ...(life.npcs ?? []).flatMap((npc) => [npc.name, npc.spouseName]),
  ].filter(Boolean));
}

function createNpc(life, random, spec) {
  life.npcs ??= [];
  life.npcSerial = (life.npcSerial ?? life.npcs.length) + 1;
  const raceId = spec.race ?? life.race.id;
  const nameRolls = [random(), random()];
  const gender = spec.gender ?? randomItem(GENDERS, random);
  let rollIndex = 0;
  const personName = generatePersonName(() => nameRolls[rollIndex++], gender, {
    usedNames: namesAlreadyUsed(life),
    surname: spec.surname ?? (spec.relationship === "子" ? familySurname(life) : null),
    culture: NAME_CULTURES.find((culture) => culture.id === spec.nameCulture) ?? null,
  });
  const npc = {
    id: `npc-${life.npcSerial}`,
    name: spec.name ?? personName.name,
    surname: spec.surname ?? personName.surname,
    nameCulture: spec.nameCulture ?? personName.culture,
    race: raceId,
    humanAge: spec.humanAge ?? life.age + 3,
    age: 0,
    gender,
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
    surname: life.familySurname, nameCulture: life.nameCulture,
    occupation: life.parents.father, affinity: 60, maritalStatus: "既婚", firstContact: "生まれたときから家族",
  });
  createNpc(life, random, {
    relationship: "母", gender: "女性", humanAge: humanAge(random()) - life.age,
    surname: life.familySurname, nameCulture: life.nameCulture,
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
      npc.occupation = randomItem(npc.education === "学院" ? ["教師", "魔術師", "騎士"] : SPOUSE_WORK, random);
      appendEvent(life, `子の${npc.name}が${npc.occupation}として働き始めた。`, "life", "家族", `child-work-${npc.id}`);
    }
    if (npc.humanAge >= 20 && npc.humanAge >= 15 && random() < 0.12 * elapsed) {
      npc.independent = true;
      npc.location = randomItem(HOME_TYPES, random);
      appendEvent(life, `子の${npc.name}が独立し、家を出て自分の暮らしを始めた。`, "life", "家族", `child-independent-${npc.id}`);
    }
  } else if (npc.maritalStatus === "未婚" && npc.humanAge >= 22 && random() < 0.08 * elapsed) {
    npc.maritalStatus = "既婚";
    npc.spouseName = generatePersonName(random, npc.gender === "女性" ? "男性" : "女性", {
      usedNames: namesAlreadyUsed(life),
    }).name;
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
  life.childDecisionOffered = false;
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
        surname: familySurname(life), nameCulture: life.nameCulture,
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
      child.nameDecided = false;
      adjustHappiness(life, 8);
      appendEvent(life, `${spouse.name}との間に子が生まれた。名前を考えることになった。`, "life", "出産", `childbirth-${child.id}`);
      life.nextDecisionAt = life.age;
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
    life.tryingSince = life.age;
    life.tryingUntil = life.age + 1;
    life.tryingMotherAge = mother.humanAge;
    appendEvent(life, "この年は子供を授からなかった。来年も引き続き子供を授かるために試みることにした。", "life", "家族", `conception-not-this-year-${Math.floor(life.age)}`);
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
    life.graduationPending = true;
    life.graduationSkill = plan.skill;
    life.nextDecisionAt = life.age;
    text = `${plan.name}を修了した。習得した${skillName(plan.skill)}技能は${Math.round(life.skills[plan.skill] ?? 0)}。進路を選ぼう。`;
  } else if (!early && plan.kind === "school" && life.occupation === "家業の手伝い") {
    life.careerCrossroads = true;
    life.nextDecisionAt = Math.max(life.age, FIRST_CAREER_MIN_AGE);
    text = `町の学校を卒業した。読み書き技能は${Math.round(life.skills.literacy ?? 0)}。今後の進路をどうするか考える時が来た。`;
  } else if (!early && plan.kind === "mentor" && !plan.graduateTo && life.occupation === "家業の手伝い") {
    life.careerCrossroads = true;
    life.nextDecisionAt = Math.max(life.age, FIRST_CAREER_MIN_AGE);
    text = `${plan.name}を修了した。読み書き技能は${Math.round(life.skills.literacy ?? 0)}。今後の進路をどうするか考える時が来た。`;
  } else {
    text = early
      ? `${plan.name}は途中で終わった。今後の進路は自分で決める。`
      : `${plan.name}を修了した。習得した${skillName(plan.skill)}技能は${Math.round(life.skills[plan.skill] ?? 0)}。`;
  }
  if (!silent) appendEvent(life, text, "life", "教育", `edu-finish-${plan.kind}-${Math.floor(life.age)}`);
}

const PAYER = Object.freeze({ PLAYER: "player", PARENTS: "parents" });

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
  if (["王族", "貴族"].includes(status)) return { cost: 0, payer: PAYER.PLAYER, via: "家が学費を負担", label: config.label };
  if ((life.parents?.gold ?? 0) >= config.fee) {
    return { cost: config.fee, payer: PAYER.PARENTS, via: "親の財産から学費を負担", label: config.label };
  }
  if (scholarship) {
    return {
      cost: 0,
      payer: PAYER.PLAYER,
      loan: config.fee + config.years * TUNING.scholarshipLivingCostLegacyG,
      via: "適性条件を満たす無利子奨学金貸与",
      label: config.label,
    };
  }
  if (life.gold >= config.fee) return { cost: config.fee, payer: PAYER.PLAYER, via: "学費を支払う", label: config.label };
  if (status === "農民・労働者" || life.gold < config.fee) {
    return { reason: `学費${config.fee}Gが必要（所持金${Math.floor(life.gold)}G。奨学金・推薦の条件も満たしていない）`, cost: config.fee, payer: PAYER.PLAYER };
  }
  return { cost: config.fee, payer: PAYER.PLAYER, via: "学費を支払う", label: config.label };
}

function mentorQuality(random) {
  return random() < 0.12 ? { label: "一流の師匠", learning: 2 } : { label: "良い師匠", learning: 1.4 };
}

const STATUS_BARRED = ["奴隷", "無戸籍・流民"];
const POOR_STATUS = ["奴隷"];
const ACADEMY_YEARS = Object.freeze({ magic: 6, knight: 5, scholar: 6 });
const EDUCATION = Object.freeze({ primaryTuition: 4, tutorTuition: 12, primaryYears: 4 });

function ruleCost(life, rule) {
  return typeof rule.cost === "function" ? rule.cost(life) : rule.cost ?? 0;
}

function rulePayer(life, rule) {
  return (typeof rule.payer === "function" ? rule.payer(life) : rule.payer) ?? PAYER.PLAYER;
}

function availableFunds(life, payer) {
  return payer === PAYER.PARENTS ? life.parents?.gold ?? 0 : life.gold ?? 0;
}

const goldFormatter = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 2 });
export const formatGold = (value) => `${goldFormatter.format(Number(value) || 0)}G`;
const gold = formatGold;
const asText = (text) => String(text);

function insufficientFundsReason(life, cost, payer, allowBorrow = false) {
  const funds = availableFunds(life, payer);
  if (cost <= funds) return null;
  if (allowBorrow && payer === PAYER.PLAYER
    && (life.debt ?? 0) + cost - funds <= TUNING.ordinaryDebtLimit) return null;
  return payer === PAYER.PARENTS
    ? `親の財産が足りない（必要${gold(cost)}／所持${gold(Math.floor(funds))}）`
    : allowBorrow && payer === PAYER.PLAYER
      ? `所持金と借入枠が足りない（必要${gold(cost)}／所持${gold(Math.floor(funds))}・借金残高${gold(life.debt ?? 0)}）`
      : `所持金が足りない（必要${gold(cost)}／所持${gold(Math.floor(funds))}）`;
}

function businessChance(life, size) {
  const skill = life.skills?.[life.occupation === "農作業" ? "farming" : "trade"] ?? 0;
  const base = TUNING.business[size].chance;
  const adjustment = clamp((skill - 50) / 50, -1, 1) * TUNING.business.skillAdjustmentMax;
  return clamp(base + adjustment, TUNING.business.minimumChance, TUNING.business.maximumChance);
}

function oreContractChance(life) {
  return clamp(0.2 + (life.occupationSkill ?? 0) / 125, 0.2, 0.95);
}

// Cost, availability, and the information shown to the player before choosing.
const CHILDHOOD_CHOICE_REWARDS = Object.freeze({
  studyLiteracy: 2,
  workGold: 2,
  workSkill: 2,
  mentorTeaching: 3,
  mentorFame: 2,
});

const steadyPreview = (detail, cost = "費用: なし") => [cost, detail];

const CHOICE_RULES = {
  "child-school-town": { cost: 6, preview: () => ["費用: 6G", "メリット: 基礎をしっかり学べる、親子の絆が深まる"] },
  "child-school-academy": { cost: 50, preview: () => ["費用: 50G", "メリット: 将来の仕事の選択肢が広がる、親子の絆が深まる", "デメリット: 家計への負担が大きい"] },
  "child-school-work": { preview: () => ["費用: なし", "メリット: 家計の助けになる", "デメリット: 子は少し不満に思うかもしれない"] },
  "child-wedding-big": { cost: 30, preview: () => ["費用: 30G", "メリット: 子が大いに喜ぶ、名声+1、幸福度+4"] },
  "child-wedding-small": { cost: 8, preview: () => ["費用: 8G", "メリット: 子が感謝する、幸福度+2"] },
  "child-wedding-none": { preview: () => ["費用: なし", "デメリット: 子はやや寂しく思う"] },
  "child-home-full": { cost: 80, preview: () => ["費用: 80G", "メリット: 子が持ち家を得る、親子の絆が深まる、名声+1"] },
  "child-home-part": { cost: 30, preview: () => ["費用: 30G", "メリット: 子が感謝する"] },
  "child-home-none": { preview: () => ["費用: なし", "デメリット: 子はやや距離を置くかもしれない"] },
  study: {
    preview: () => ["費用: なし", `メリット: 読み書き技能+${CHILDHOOD_CHOICE_REWARDS.studyLiteracy}、学習を継続`, "デメリット: 家業の手伝いによる収入・技能は得られない"],
  },
  work: {
    preview: () => ["費用: なし", `メリット: 所持金+${CHILDHOOD_CHOICE_REWARDS.workGold}G、仕事の技能+${CHILDHOOD_CHOICE_REWARDS.workSkill}`, "デメリット: 読み書きの学習は進まない"],
  },
  "work-mentor-training": {
    cost: 5,
    preview: (life) => [`費用: 5G`, `メリット: ${skillName(OCCUPATION_SKILLS[life.occupation] ?? "general")}技能+4`, "その道の玄人から仕事のコツを学ぶ"],
  },
  steady: {
    preview: () => ["費用: なし", "今の暮らしを続ける"],
  },
  mentor: {
    preview: () => ["費用: なし", `メリット: 指導技能+${CHILDHOOD_CHOICE_REWARDS.mentorTeaching}、名声+${CHILDHOOD_CHOICE_REWARDS.mentorFame}`, "デメリット: 所持金や職業技能は増えない"],
  },
  rest: {
    preview: () => ["費用: なし", "メリット: 家族との関係を支え、病気でなければ体調を整える", "デメリット: 技能・収入・名声は増えない"],
  },
  "edu-town-school": {
    check: (life) => (STATUS_BARRED.includes(life.status?.name) ? "身分の制限で町の教室に通えない" : null),
    cost: EDUCATION.primaryTuition,
    payer: PAYER.PARENTS,
    preview: (life, cost) => [`費用: 親の財産から${cost}G`, `メリット: 読み書きの基礎を${EDUCATION.primaryYears}年間学ぶ／デメリット: 家族の蓄えを使う`],
  },
  "edu-tutor": {
    cost: EDUCATION.tutorTuition,
    payer: PAYER.PARENTS,
    check: (life) => (STATUS_BARRED.includes(life.status?.name) ? "身分の制限で家庭教師を雇えない" : null),
    preview: (life, cost) => [`費用: 親の財産から${gold(cost)}`, "メリット: より速く学べる／デメリット: 家族の蓄えを多く使う"],
  },
  "edu-family-work": {
    preview: () => ["費用: なし", "成長する技能: 肉体労働・読み書き（独学）", "メリット: 家計を助けられる", "デメリット: 読み書きの習得が遅い"],
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
  "path-academy": {
    preview: () => ["費用: なし", "入学条件を満たす学院の選考へ進む", "身分・適性・費用によって進学先が限られる"],
  },
  "academy-magic": {
    cost: (life) => academyFunding(life, "magic").cost ?? 60,
    payer: (life) => academyFunding(life, "magic").payer ?? PAYER.PLAYER,
    check: (life) => academyFunding(life, "magic").reason ?? null,
    preview: (life) => {
      const funding = academyFunding(life, "magic");
      return [`${funding.loan ? `無利子貸与: ${gold(funding.loan)}` : `費用: ${gold(funding.cost ?? 60)}`}（${funding.via ?? "要確認"}）`, "成長する技能: 魔術", `期間: 人間換算${ACADEMY_YEARS.magic}年間`, "環境: 専門学院（学習環境×1.6、集中訓練×1.3）", "メリット: 魔術を体系的に学べる", "デメリット: 在学中は収入がない"];
    },
  },
  "academy-knight": {
    cost: (life) => academyFunding(life, "knight").cost ?? 50,
    payer: (life) => academyFunding(life, "knight").payer ?? PAYER.PLAYER,
    check: (life) => academyFunding(life, "knight").reason ?? null,
    preview: (life) => {
      const funding = academyFunding(life, "knight");
      return [`${funding.loan ? `無利子貸与: ${gold(funding.loan)}` : `費用: ${gold(funding.cost ?? 50)}`}（${funding.via ?? "要確認"}）`, "成長する技能: 剣術", `期間: 人間換算${ACADEMY_YEARS.knight}年間`, "環境: 専門学院（学習環境×1.6、集中訓練×1.3）", "メリット: 騎士・士官への道が開ける", "デメリット: 在学中は収入がない"];
    },
  },
  "academy-scholar": {
    cost: (life) => academyFunding(life, "scholar").cost ?? 40,
    payer: (life) => academyFunding(life, "scholar").payer ?? PAYER.PLAYER,
    check: (life) => academyFunding(life, "scholar").reason ?? null,
    preview: (life) => {
      const funding = academyFunding(life, "scholar");
      return [`${funding.loan ? `無利子貸与: ${gold(funding.loan)}` : `費用: ${gold(funding.cost ?? 40)}`}（${funding.via ?? "要確認"}）`, "成長する技能: 学術", `期間: 人間換算${ACADEMY_YEARS.scholar}年間`, "環境: 専門学院（学習環境×1.6、集中訓練×1.3）", "メリット: 学者・教師の道が開ける", "デメリット: 在学中は収入がない"];
    },
  },
  "academy-skip": { preview: () => ["費用: なし", "学院には進まず、これまでの道を続ける"] },
  "ore-contract": {
    cost: 8,
    preview: (life) => ["費用: 8G（材料費）", `成功率: ${Math.round(oreContractChance(life) * 100)}%（職業技能で決まる）`, "メリット: 成功すれば報酬20Gと評判", "デメリット: 失敗すると材料費を失う"],
  },
  "guild-exam": {
    cost: 5,
    preview: () => ["費用: 5G（受験料）", "合否は現在の技能に左右される", "メリット: 合格すれば資格と評判", "デメリット: 不合格なら受験料は戻らない"],
  },
  "gather-herbs": { preview: () => ["費用: なし", "メリット: ギルドの薬草採集で報酬3G。借金・転職なし"] },
  "dungeon-enter": { preview: () => ["費用: なし", "危険度: 70%で+1G、10%で+50G、5%で−20G、15%で−5G（手持ち不足でも借金なし）"] },
  "borrow-for-trade": { check: () => "商人からの融資は廃止された" },
  "risky-contract": {
    preview: () => ["費用: なし", "危険度: 高い", "メリット: 成功すれば報酬12G", "デメリット: 負傷して療養する可能性"],
  },
  "medical-treatment": {
    cost: 6,
    preview: () => ["費用: 6G", "メリット: 体調が回復する", "デメリット: 費用がかかる"],
  },
  "illness-ordinary-treatment": {
    allowBorrow: true,
    cost: (life) => TUNING.treatmentCosts.ordinary[life.illness?.severity] ?? 5,
    preview: (life, cost) => [
      `費用: ${gold(cost)}（不足分は借入）`,
      `病名: ${life.illness?.name ?? "病気"}`,
      `基本成功率: ${Math.round((TUNING.treatmentSuccess[life.illness?.type]?.ordinary ?? 0) * 100)}%`,
      "町医者の治療。失敗しても直ちに死亡せず、療養を続ける。",
    ],
  },
  "illness-magic-treatment": {
    allowBorrow: true,
    cost: (life) => TUNING.treatmentCosts.magic[life.illness?.severity] ?? 25,
    preview: (life, cost) => [
      `費用: ${gold(cost)}（不足分は借入）`,
      `病名: ${life.illness?.name ?? "病気"}`,
      `基本成功率: ${Math.round((TUNING.treatmentSuccess[life.illness?.type]?.magic ?? 0) * 100)}%`,
      "聖職者の治療。成功率は病気ごとに異なり、老化そのものは治せない。",
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
    id: "choice-name-child", title: "子どもの名前", category: "家族・人間関係", weight: 10, priority: true,
    requirements: { minAge: 0, custom: (life) => Boolean(pendingNamingChild(life)) },
    copy: "新しい命が生まれた。この子に、どんな名前を贈ろう。",
    prepare: (life, random, decision) => {
      const child = pendingNamingChild(life);
      decision.childId = child.id;
      const used = [...namesAlreadyUsed(life)];
      const culture = NAME_CULTURES.find((item) => item.id === life.nameCulture) ?? null;
      decision.candidates = [];
      for (let i = 0; i < 3; i += 1) {
        const candidate = generatePersonName(random, child.gender, { usedNames: used, surname: familySurname(life), culture }).name;
        used.push(candidate);
        decision.candidates.push(candidate);
      }
    },
    choicesFor: (life, decision) => decision.candidates.map((name) => ({ label: `「${name}」と名付ける`, effect: `name-child:${name}` })),
  },
  {
    id: "choice-child-school", title: "子の進学", category: "家族・人間関係", weight: 6, priority: true,
    requirements: { minAge: 12, custom: (life) => Boolean(childNeeding(life, (npc) => npc.humanAge >= 11 && npc.humanAge <= 16 && !npc.independent && !npc.schoolDecided)) },
    prepare: (life, random, decision) => {
      const child = childNeeding(life, (npc) => npc.humanAge >= 11 && npc.humanAge <= 16 && !npc.independent && !npc.schoolDecided);
      decision.childId = child.id;
      decision.id = `choice-child-school-${child.id}`;
      decision.copy = `子の${child.name}が進学を希望している。どこに通わせるか決めよう。`;
    },
    copy: "子が進学を希望している。",
    choices: [
      { label: "町の学び舎に通わせる", effect: "child-school-town" },
      { label: "学院に通わせる", effect: "child-school-academy" },
      { label: "家の仕事を手伝ってもらう", effect: "child-school-work" },
    ],
  },
  {
    id: "choice-child-wedding", title: "子の結婚", category: "家族・人間関係", weight: 6, priority: true,
    requirements: { minAge: 30, custom: (life) => Boolean(childNeeding(life, (npc) => npc.maritalStatus === "既婚" && !npc.weddingDecided)) },
    prepare: (life, random, decision) => {
      const child = childNeeding(life, (npc) => npc.maritalStatus === "既婚" && !npc.weddingDecided);
      decision.childId = child.id;
      decision.id = `choice-child-wedding-${child.id}`;
      decision.copy = `子の${child.name}が${child.spouseName ?? "大切な人"}と結婚する。結婚の費用を出すか決めよう。`;
    },
    copy: "子が結婚する。",
    choices: [
      { label: "盛大な式の費用を出す", effect: "child-wedding-big" },
      { label: "ささやかな祝い金を渡す", effect: "child-wedding-small" },
      { label: "気持ちだけ贈る", effect: "child-wedding-none" },
    ],
  },
  {
    id: "choice-child-home", title: "子の家", category: "家族・人間関係", weight: 5, priority: true,
    requirements: { minAge: 35, custom: (life) => Boolean(childNeeding(life, (npc) => npc.independent && npc.humanAge >= 24 && !npc.homeDecided)) },
    prepare: (life, random, decision) => {
      const child = childNeeding(life, (npc) => npc.independent && npc.humanAge >= 24 && !npc.homeDecided);
      decision.childId = child.id;
      decision.id = `choice-child-home-${child.id}`;
      decision.copy = `子の${child.name}が家を買おうとしている。資金を援助するか決めよう。`;
    },
    copy: "子が家を買おうとしている。",
    choices: [
      { label: "頭金を大きく援助する", effect: "child-home-full" },
      { label: "少しだけ援助する", effect: "child-home-part" },
      { label: "自分の力でやらせる", effect: "child-home-none" },
    ],
  },
  {
    id: "edu-childhood", title: "学びのはじまり", category: "幼少期・教育", weight: 5, priority: true,
    requirements: { minAge: 6, maxAge: 12, oncePerLife: true, excludeRaceIds: ["dragon"], custom: (life) => !training(life) },
    copy: "読み書きを身につける年頃になった。家の事情を考えながら、学び方を決めよう。",
    choicesFor: (life) => [
      { label: "町の教室に通う", effect: "edu-town-school" },
      { label: "家庭教師から学ぶ", effect: "edu-tutor" },
      { label: "家業を手伝いながら独学する", effect: "edu-family-work" },
    ],
  },
  {
    id: "choice-first-career", title: "進路を決める", category: "幼少期・教育", weight: 4, priority: true,
    requirements: {
      minAge: FIRST_CAREER_MIN_AGE, maxAge: FIRST_CAREER_MAX_AGE, excludeRaceIds: ["dragon"], occupations: ["家業の手伝い"],
      custom: (life) => !training(life) && life.careerCrossroads === true
        && !hasFlag(life, "first-career-done") && !hasFlag(life, "academy-aspirant"),
    },
    prepare: (life, random, decision) => {
      decision.id = hasFlag(life, "academy-declined") ? "choice-first-career-retry" : "choice-first-career-start";
    },
    copy: (life) => `${life.educationStatus === "学習継続中" || life.educationHistory?.length ? "学びを終え、" : ""}今後の進路をどうするか決める時が来た。体力や才能に合った道を選ぼう。`,
    choicesFor: (life) => firstCareerChoices(life),
  },
  {
    id: "edu-academy", title: "学院からの案内", category: "幼少期・教育", weight: 3, priority: true,
    requirements: {
      minAge: 12, oncePerLife: true, excludeRaceIds: ["dragon"],
      custom: (life) => !training(life) && !STATUS_BARRED.includes(life.status?.name)
        && life.historyFlags?.includes("academy-aspirant"),
    },
    copy: "各地の学院が入学者を募っている。学費や推薦の有無で、入れる学院は変わる。進学を見送る場合は、別の進路を選び直せる。",
    choices: [
      { label: "魔術学院に入学する", effect: "academy-magic" },
      { label: "騎士学院に入学する", effect: "academy-knight" },
      { label: "学術系の学院に入学する", effect: "academy-scholar" },
      { label: "学院には進まない", effect: "academy-skip" },
    ],
  },
  {
    id: "choice-career-graduation", title: "卒業後の進路", category: "職業・昇進", weight: 10, priority: true,
    requirements: { custom: (life) => life.graduationPending === true },
    copy: "学院・修行を終えた。適性に合う職業の月給と必要技能を比べて、進路を選ぼう。",
    choicesFor: (life) => {
      const jobsBySkill = {
        magic: ["魔術師", "教師", "学者", "商人", "農作業", "家業の手伝い"],
        swordsmanship: ["騎士", "兵士", "冒険者", "農作業", "家業の手伝い"],
        scholarship: ["学者", "教師", "商人", "農作業", "家業の手伝い"],
        craft: ["職人見習い", "鍛冶職人", "服飾店の見習い", "商人", "農作業"],
        smithing: ["鍛冶職人", "職人見習い", "商人", "農作業"],
        tailoring: ["服飾店の見習い", "職人見習い", "商人", "農作業"],
      };
      const occupations = jobsBySkill[life.graduationSkill] ?? ["教師", "商人", "職人見習い", "農作業", "家業の手伝い"];
      return [
        ...careerChoices(life, { occupations, effect: "career-graduate", excludeCurrent: false }),
        { label: "今は働かず、進路を保留する", effect: "graduate-defer", preview: ["月給: なし", "就職先は後の選択で決める"] },
      ];
    },
  },
  {
    id: "choice-ore-contract", title: "魔鉱石の加工依頼", category: "職業・昇進", weight: 1.3,
    requirements: { minAge: 18, minimumGold: 8, occupations: [...CRAFT_OCCUPATIONS, "工房主"] },
    copy: "魔鉱石を加工してほしいと依頼が届いた。材料費は8G。職業技能を頼りに受けるか、断るか。",
    choices: [{ label: "8Gを払って依頼を受ける", effect: "ore-contract" }, { label: "今回は依頼を断る", effect: "decline-contract" }],
  },
  {
    id: "choice-guild-exam", title: "組合の昇級試験", category: "職業・昇進", weight: 1,
    requirements: { minAge: 18, minimumGold: 5, minimumSkill: 25, occupations: CRAFT_OCCUPATIONS, requiresNotFlag: "guild-license" },
    copy: "組合から技能試験の案内が届いた。受験料を払って資格に挑戦するか、実務経験を積むか。",
    choices: [{ label: "受験料5Gを払い、試験に挑む", effect: "guild-exam" }, { label: "仕事を続けて腕を磨く", effect: "decline-exam" }],
  },
  {
    id: "choice-work-offer", title: "今の仕事に飽きてきた", category: "職業・昇進", weight: 6, priority: true,
    requirements: {
      minAge: 18, cooldownYears: 1,
      custom: (life) => !TRAINEE_OCCUPATIONS.includes(life.occupation) && !life.trainingPlan
        && life.age < TUNING.retirementHumanAge && life.occupation !== "引退"
        && (life.occupation === "失業中" || (life.nextCareerReviewAt != null && life.age >= life.nextCareerReviewAt))
        && availableCareerOptions(life).length > 0,
    },
    prepare: (life, random) => {
      life.nextCareerReviewAt = life.age + nextReviewGap(random);
    },
    copy: (life) => (life.occupation === "失業中"
      ? "働き口を探していると、いくつか声がかかった。今のあなたにできる仕事から選べる。"
      : "今の仕事に飽きてきた。別の仕事をしてみる？ 今のあなたにできる仕事の候補が見つかった。"),
    choicesFor: (life) => [
      ...careerReviewChoices(life),
      { label: "今の仕事を続ける", effect: "steady", preview: ["月給: 現在の職業を継続", "転職せず、今の仕事に取り組む"] },
    ],
  },
  {
    id: "choice-church-calling", title: "教会からの勧誘", category: "職業・昇進", weight: 1.2,
    requirements: {
      minAge: 18, maxAge: 45, oncePerLife: true, excludeRaceIds: ["dragon"],
      custom: (life) => life.mana >= 20 && !training(life) && !STATUS_BARRED.includes(life.status?.name)
        && !["聖職者", "引退", "魔術学院生", "魔術師の弟子"].includes(life.occupation),
    },
    copy: "あなたには聖職者の才能があるようだ。教会から勧誘を受けた。教会の一員になり、聖職者を目指す？",
    choices: [
      { label: "教会の一員になる", effect: "church-join", preview: ["月給: 少なめ（見習いの頃は質素な暮らし）", "メリット: 勤続を重ねれば司祭になれ、給与が大きく上がる"] },
      { label: "丁重に断る", effect: "steady", preview: ["費用: なし", "今の暮らしを続ける"] },
    ],
  },
  {
    id: "choice-work-mentor", title: "仕事の腕を磨く", category: "職業・昇進", weight: 0.7,
    requirements: {
      minAge: 13, minimumGold: 5, cooldownYears: 3,
      custom: (life) => !NON_WORKING.includes(life.occupation) && !TRAINEE_OCCUPATIONS.includes(life.occupation)
        && !training(life) && life.occupationSkill < 20,
    },
    copy: "仕事の腕を磨くため、その道の玄人に話を聞く機会が訪れた。費用を払って学ぶか、今の仕事を続けるか。",
    choices: [
      { label: "5Gを払い、玄人から話を聞く", effect: "work-mentor-training" },
      { label: "今の仕事を続ける", effect: "steady", preview: steadyPreview("今の技能と働き方を維持する") },
    ],
  },
  {
    id: "choice-guild-herbs", title: "ギルドの薬草採集依頼", category: "財産・借金", weight: 1.5,
    requirements: { minAge: 18, maximumGold: 5, cooldownYears: 3 },
    copy: "手持ちが心細い。ギルドの掲示板に、安全な野原で薬草を集める依頼が貼り出されていた。職業を問わず参加できる。",
    choices: [{ label: "薬草を集めて報酬3Gを受け取る", effect: "gather-herbs" }, { label: "今回は見送る", effect: "steady" }],
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
    choices: [{ label: "手持ちで借金を返す", effect: "repay-debt" }, { label: "返済は毎月の分だけにする", effect: "steady", preview: steadyPreview("決まった月々の返済を続ける", "追加費用: なし") }],
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
    copy: "家には毎月維持費がかかる。まとまった資金が必要なら売却できる。",
    choices: [{ label: "家を売る", effect: "sell-home" }, { label: "今の家に住み続ける", effect: "steady", preview: steadyPreview("家を売らず、住み続ける") }],
  },
  {
    id: "choice-open-shop", title: "自分の工房を開く", category: "職業・昇進", weight: 0.9,
    requirements: { minAge: 25, minimumGold: 30, minimumSkill: 50, occupations: CRAFT_OCCUPATIONS, oncePerLife: true },
    copy: "腕に自信がつき、独立の話が出た。工房を借りるには30Gが要る。",
    choices: [{ label: "30Gで工房を開く", effect: "open-shop-choice" }, { label: "親方のもとで働き続ける", effect: "steady", preview: steadyPreview("親方のもとで働き続ける") }],
  },
  {
    id: "choice-retirement", title: "これからの働き方", category: "職業・昇進", weight: 1, priority: true,
    requirements: {
      minAge: TUNING.retirementHumanAge, oncePerLife: true,
      custom: (life) => !NON_WORKING.includes(life.occupation) && !training(life)
        && !life.historyFlags?.includes("retirement-choice-resolved"),
    },
    copy: "人間換算で65歳を迎えた。仕事を退くか、続けるか、別の道へ移るかを選べる。",
    choicesFor: (life) => [
      { label: "今の仕事を退く", effect: "retire-now" },
      { label: "今の仕事を続ける", effect: "keep-working" },
      ...careerChoices(life, { effect: "career-change" }),
    ],
  },
  {
    id: "choice-will", title: "遺言を残す", category: "財産・家族", weight: 0.65,
    requirements: { minAge: 60, cooldownYears: 8 },
    copy: "財産の行き先を決める遺言を無料で作成・変更できる。爵位や領地の継承先は変更できない。",
    choicesFor: (life) => {
      const spouse = spouseNpc(life);
      const children = livingChildren(life);
      const contacts = (life.npcs ?? []).filter((npc) => npc.alive && npc.id !== spouse?.id
        && npc.relationship !== "友人" && !children.some((child) => child.id === npc.id));
      const friends = (life.npcs ?? []).filter((npc) => npc.alive && npc.relationship === "友人");
      return [
        { label: "通常の相続にする", effect: "will-legal" },
        ...(spouse ? [{ label: `${spouse.name}に全額`, effect: "will-spouse" }] : []),
        ...(children.length ? [
          { label: `${[...children].sort((a, b) => b.humanAge - a.humanAge)[0].name}に全額`, effect: "will-oldest-child" },
          { label: "存命の子供全員に均等", effect: "will-equal-children" },
        ] : []),
        ...(friends.length ? [{ label: "友人に均等に分配", effect: "will-friends-equal" }] : []),
        ...contacts.map((npc) => ({ label: `${npc.name}に全額を遺す`, effect: `will-person:${npc.id}` })),
        { label: "教会へ寄付", effect: "will-charity:教会" },
        { label: "慈善団体へ寄付", effect: "will-charity:慈善団体" },
        { label: "国へ寄付", effect: "will-charity:国家" },
      ];
    },
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
      { label: "今回は見送る", effect: "steady", preview: steadyPreview("投資を見送り、現在の商売を続ける") },
    ],
  },
  {
    id: "choice-buy-gear", title: "装備を新調する", category: "財産・借金", weight: 0.9,
    requirements: { minAge: 18, minimumGold: 10, occupations: ["兵士", "冒険者"], requiresNotFlag: "good-gear" },
    copy: "武器や防具が傷んできた。新しい装備を整えるか、今あるもので凌ぐか。",
    choices: [{ label: "10Gで装備を整える", effect: "buy-gear" }, { label: "今の装備を使い続ける", effect: "steady", preview: steadyPreview("今の装備を使い続ける") }],
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
    copy: (life) => `${life.spouse ?? "配偶者"}と、そろそろ子供を迎えるか話し合うことになった。${livingChildren(life).length ? "次の子供を持つか" : "一人目の子供を持つか"}、二人で決められる。`,
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
      minAge: 0, healthStates: ["療養中"],
      custom: (life) => life.illness && life.illness.severity !== "軽症",
    },
    copy: (life) => `${life.illness?.name ?? "病気・怪我"}（${life.illness?.severity ?? "症状あり"}）の治療をどうするか決める。治療しない場合、年間約${Math.round(TUNING.illnessFatalityPerYearWhileIll * 100)}%の確率で命を落とす可能性がある。`,
    choices: [
      { label: "町医者の治療を受ける（5G）", effect: "illness-ordinary-treatment" },
      { label: "聖職者の治療を受ける（20G）", effect: "illness-magic-treatment" },
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
      { label: "今の状態を受け入れる", effect: "steady", preview: steadyPreview("後遺症を受け入れ、治療はしない") },
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
    id: "choice-demon-king", title: "魔王討伐への招集", category: "国家・戦争・冒険", weight: 10, priority: true,
    requirements: {
      minAge: 45, maxAge: 50, oncePerLife: true,
      occupations: ["兵士", "冒険者", "魔術師"],
      custom: (life) => life.demonKingActive === true,
    },
    copy: "魔王討伐に向けて兵士が招集されている。あなたには参加資格がある。",
    choices: [
      {
        label: "討伐に参加する（名声+20・賞金+200G）",
        effect: "demon-king-join",
        preview: ["費用: なし", "メリット: 名声+20、賞金+200G", "危険度: 怪我や死亡の可能性"],
      },
      { label: "参加しない", effect: "demon-king-decline", preview: ["費用: なし", "何も得られない"] },
    ],
  },
  {
    id: "choice-demon-relief", title: "傷ついた兵士への慰問", category: "国家・戦争・冒険", weight: 10, priority: true,
    requirements: {
      minAge: 45, maxAge: 50, oncePerLife: true, occupations: ["聖職者"],
      custom: (life) => life.demonKingActive === true,
    },
    copy: "魔王討伐で傷ついた兵士に慰問を行いますか？",
    choices: [
      {
        label: "慰問を行う（名声+30・報酬+50G）",
        effect: "demon-relief",
        preview: ["費用: なし", "メリット: 名声+30、報酬+50G", "危険度: 病気や精神的トラウマの可能性"],
      },
      { label: "行わない", effect: "demon-relief-decline", preview: ["費用: なし", "何も得られない"] },
    ],
  },
  {
    id: "choice-dungeon", title: "ダンジョンへの誘い", category: "国家・戦争・冒険", weight: 8, priority: true,
    requirements: { minAge: 18, custom: (life) => (life.dungeonOffers ?? 0) < 2 && life.age >= (life.nextDungeonAt ?? TUNING.dungeonOfferAges[0]) },
    copy: "近くのダンジョンを探索する機会が訪れた。宝もあるが、魔物に襲われて出費がかさむ危険もある。",
    prepare: (life, random, decision) => {
      decision.id = `choice-dungeon-${(life.dungeonOffers ?? 0) + 1}`;
    },
    choices: [{ label: "ダンジョンに行く", effect: "dungeon-enter" }, { label: "探索を見送る", effect: "dungeon-decline", preview: ["費用: なし", "危険を避け、今の暮らしを続ける"] }],
  },
  {
    id: "choice-expedition", title: "古代遺跡への遠征", category: "国家・戦争・冒険", weight: 0.75,
    requirements: { minAge: 18, occupations: ["冒険者", "商人", "兵士"] },
    copy: "古代遺跡の調査隊が同行者を探している。危険な遠征へ向かうか、現在の仕事に専念するか。",
    choices: [{ label: "装備代4Gを払い、遠征に参加する", effect: "join-expedition" }, { label: "今回は見送る", effect: "decline-expedition" }],
  },
];

export function availableChoiceEvents(life) {
  return CHOICE_EVENTS.filter((event) => isRoutineEventEligible(life, event)
    && (event.priority || !(life.eventHistory ?? []).some((entry) => entry.id === event.id
      && life.age - entry.age < (event.requirements.cooldownYears ?? TUNING.decisionCooldownYears))));
}

const CHOICE_PREVIEW_COST_PREFIXES = ["費用", "授業料", "通常医療費", "魔法医療費", "受験料", "無利子貸与"];
const CHOICE_PREVIEW_DETAIL_PREFIXES = ["メリット", "成長する技能", "月給", "必要技能", "基本成功率", "成功率", "危険度", "売却額", "期間", "条件", "入学条件"];

export function compactChoicePreview(preview) {
  const lines = (preview ?? []).filter(Boolean);
  if (lines.length <= 2) return lines;
  const hasPrefix = (line, prefixes) => prefixes.some((prefix) => line.startsWith(`${prefix}:`));
  const cost = lines.find((line) => hasPrefix(line, CHOICE_PREVIEW_COST_PREFIXES));
  const details = lines.filter((line) => hasPrefix(line, CHOICE_PREVIEW_DETAIL_PREFIXES) && line !== cost).slice(0, 2);
  const downside = lines.find((line) => line.startsWith("デメリット:"));
  const primary = cost ?? lines[0];
  const selectedDetails = details.filter((line) => line !== primary);
  if (downside && downside !== primary && selectedDetails.length < 2) selectedDetails.push(downside.replace(/^デメリット:\s*/, "注意: "));
  if (selectedDetails.length === 0) {
    const other = lines.find((line) => line !== primary);
    if (other) selectedDetails.push(other);
  }
  return [primary, selectedDetails.join("／")].filter(Boolean);
}

export function decorateChoice(life, choice) {
  const rule = CHOICE_RULES[choice.effect] ?? CHOICE_RULES[choice.effect.split(":")[0]];
  if (!rule) return { ...choice, preview: compactChoicePreview(choice.preview) };
  const cost = ruleCost(life, rule);
  const payer = rulePayer(life, rule);
  const disabledReason = rule.check?.(life) ?? insufficientFundsReason(life, cost, payer, rule.allowBorrow);
  const preview = choice.preview?.length ? choice.preview : rule.preview?.(life, cost);
  return { ...choice, cost, payer, preview: compactChoicePreview(preview), disabledReason };
}

export function choiceAvailability(life, effect) {
  const rule = CHOICE_RULES[effect] ?? CHOICE_RULES[effect.split(":")[0]];
  if (!rule) return { cost: 0, disabledReason: null };
  const cost = ruleCost(life, rule);
  const payer = rulePayer(life, rule);
  const disabledReason = rule.check?.(life) ?? insufficientFundsReason(life, cost, payer, rule.allowBorrow);
  return { cost, payer, disabledReason };
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
      label: asText(choice.label),
      preview: compactChoicePreview(choice.preview).map(asText),
      disabledReason: choice.disabledReason ? asText(choice.disabledReason) : null,
    }));
  decision.copy = asText(decision.copy);
  return decision;
}

function decisionFor(life, random) {
  const eligible = availableChoiceEvents(life);
  const firstChildChoice = eligible.find((event) => event.id === "choice-children" && life.childDecisionOffered !== true);
  if (firstChildChoice) return buildDecision(life, firstChildChoice, random);
  const demonKingChoice = eligible.find((event) => ["choice-demon-king", "choice-demon-relief"].includes(event.id));
  if (demonKingChoice) return buildDecision(life, demonKingChoice, random);
  const priority = eligible.filter((event) => event.priority);
  const urgent = priority.filter((event) => event.id !== "choice-dungeon");
  const pool = urgent.length > 0 ? urgent : priority.length > 0 ? priority : eligible;
  if (pool.length > 0) {
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
    const candidates = dragonDecisions.map((decision, index) => ({ ...decision, id: `choice-dragon-${index}` }))
      .filter((decision) => !hasRecentEvent(life, decision.id, TUNING.decisionCooldownYears));
    return candidates.length ? randomItem(candidates, random) : null;
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
    youth: {
      title: "進む道",
      copy: "将来について考える時が来ました。興味のある道を選んでみましょう。",
      choices: [
        { label: "5Gを払い、玄人から仕事のコツを学ぶ", effect: "work-mentor-training" },
        { label: "学びを続けて備える", effect: "study" },
      ],
    },
    youngAdult: {
      title: "仕事との向き合い方",
      copy: "今の職業を続けるか、仕事の技能を磨くかを決めましょう。",
      choices: [
        { label: "5Gを払い、玄人から仕事のコツを学ぶ", effect: "work-mentor-training" },
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
  const fallback = options[stage];
  if (!fallback) return null;
  if (fallback.choices[0].effect === "work-mentor-training"
    && ((life.occupationSkill ?? 0) >= 20 || NON_WORKING.includes(life.occupation)
      || hasRecentEvent(life, "choice-work-mentor", TUNING.decisionCooldownYears))) return null;
  const id = `choice-fallback-${stage}`;
  if (hasRecentEvent(life, id, TUNING.decisionCooldownYears)
    || (stage === "elder" && (life.eventHistory ?? []).some((event) => event.id === id))) return null;
  return {
    ...fallback,
    id,
    choices: fallback.choices.map((choice) => {
      const decorated = decorateChoice(life, choice);
      return {
        ...decorated,
        label: asText(decorated.label),
        preview: compactChoicePreview(decorated.preview).map(asText),
      };
    }),
  };
}

function completeIllnessTreatment(life, choice, random) {
  const illness = life.illness;
  const treatment = choice === "illness-magic-treatment" ? "magic" : "ordinary";
  const successRate = TUNING.treatmentSuccess[illness.type]?.[treatment] ?? 0;
  if (random() >= successRate) {
    life.illness.treatmentAttempts = (life.illness.treatmentAttempts ?? 0) + 1;
    life.illnessUntil = Math.max(life.illnessUntil, life.age + illnessReviewInterval(illness));
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

function illnessReviewInterval(illness) {
  return ["fracture", "severeInjury"].includes(illness?.type) ? TUNING.injuryReviewYears : 0.5;
}

export function applyChoice(life, choice, random = Math.random) {
  if (!life.active || !life.pendingDecision) return null;
  const decision = life.pendingDecision;
  let selected = decision.choices.find((item) => item.effect === choice.effect);
  if (!selected) return null;
  const availability = choiceAvailability(life, selected.effect);
  if (availability.disabledReason) return null;

  ensureSkillState(life);
  const illnessBeforeChoice = life.illness;
  const before = {
    gold: life.gold,
    parentGold: life.parents?.gold ?? 0,
    debt: life.debt,
    health: life.health,
    fame: life.fame,
    occupation: life.occupation,
    skills: { ...life.skills },
  };
  const notes = [];
  const result = { cost: availability.cost };
  if (availability.cost > 0) {
    if (availability.payer === PAYER.PARENTS) {
      life.parents.gold -= availability.cost;
      notes.push(`親の財産から${gold(availability.cost)}を支払った`);
    } else {
      const paid = Math.min(Math.max(0, life.gold), availability.cost);
      life.gold -= paid;
      recordGold(life, selected.label, -paid);
      const borrowed = availability.cost - paid;
      if (borrowed > 0) {
        life.debt = (life.debt ?? 0) + borrowed;
        recordGold(life, `${selected.label}の借入`, borrowed);
        notes.push(`不足分${gold(borrowed)}を借り入れた`);
      }
    }
  }
  let message;
  const effectType = selected.effect.split(":")[0];
  if (effectType === "dungeon-enter" || effectType === "dungeon-decline") {
    life.dungeonOffers = (life.dungeonOffers ?? 0) + 1;
    life.nextDungeonAt = life.dungeonOffers < 2 ? Math.max(TUNING.dungeonOfferAges[1], life.age + 15) : Infinity;
  }
  switch (effectType) {
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
    case "will-friends-equal":
      life.will = { type: "friends-equal", targetId: null, charity: null };
      message = "存命の友人に均等に財産を遺す遺言を残した。";
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
    case "name-child": {
      const child = (life.npcs ?? []).find((npc) => npc.id === decision.childId);
      const given = selected.effect.slice("name-child:".length).trim().slice(0, 12);
      if (child && given) {
        child.name = given.includes("・") ? given : `${given}・${child.surname ?? familySurname(life)}`;
        child.nameDecided = true;
        npcNote(life, child, "名前をつけてもらった");
        addFlag(life, "named-child");
        adjustHappiness(life, 5);
        message = `生まれた子に「${child.name}」と名付けた。健やかな成長を祈った。`;
      } else {
        message = "名前はまだ決まらなかった。";
      }
      break;
    }
    case "child-school-town":
    case "child-school-academy":
    case "child-school-work": {
      const child = (life.npcs ?? []).find((npc) => npc.id === decision.childId);
      if (child) {
        child.schoolDecided = true;
        child.education = { "child-school-town": "町の学び舎", "child-school-academy": "学院", "child-school-work": "家業" }[effectType];
        child.affinity = clamp((child.affinity ?? 50) + { "child-school-town": 8, "child-school-academy": 10, "child-school-work": -3 }[effectType], 0, 100);
        npcNote(life, child, `進学: ${child.education}`);
      }
      message = effectType === "child-school-work"
        ? `${child?.name ?? "子"}には進学させず、家の仕事を手伝ってもらうことにした。`
        : `${child?.name ?? "子"}を${child?.education}に通わせることにした。`;
      break;
    }
    case "child-wedding-big":
    case "child-wedding-small":
    case "child-wedding-none": {
      const child = (life.npcs ?? []).find((npc) => npc.id === decision.childId);
      if (child) {
        child.weddingDecided = true;
        child.affinity = clamp((child.affinity ?? 50) + { "child-wedding-big": 12, "child-wedding-small": 6, "child-wedding-none": -6 }[effectType], 0, 100);
        npcNote(life, child, "結婚の祝いを受けた");
      }
      if (effectType === "child-wedding-big") { life.fame += 1; adjustHappiness(life, 4); }
      if (effectType === "child-wedding-small") adjustHappiness(life, 2);
      message = effectType === "child-wedding-none"
        ? `${child?.name ?? "子"}の結婚を、言葉だけで祝った。`
        : `${child?.name ?? "子"}の結婚を祝い、費用を援助した。`;
      break;
    }
    case "child-home-full":
    case "child-home-part":
    case "child-home-none": {
      const child = (life.npcs ?? []).find((npc) => npc.id === decision.childId);
      if (child) {
        child.homeDecided = true;
        child.affinity = clamp((child.affinity ?? 50) + { "child-home-full": 15, "child-home-part": 8, "child-home-none": -4 }[effectType], 0, 100);
        if (effectType !== "child-home-none") child.ownsHome = true;
        npcNote(life, child, "家を買う際の援助について話した");
      }
      if (effectType === "child-home-full") life.fame += 1;
      message = effectType === "child-home-none"
        ? `${child?.name ?? "子"}には自分の力で家を探してもらうことにした。`
        : `${child?.name ?? "子"}の家の購入資金を援助した。`;
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
      addSkillPoints(life, "literacy", CHILDHOOD_CHOICE_REWARDS.studyLiteracy, "学びの時間");
      addFlag(life, "continued-education");
      life.educationStatus = "学習継続中";
      if (life.age < 13) life.school ??= { id: "home-study", name: "家庭学習" };
      message = "学びを続け、新しい知識を身につけた。";
      break;
    case "work":
      life.gold += CHILDHOOD_CHOICE_REWARDS.workGold;
      addSkillPoints(life, life.occupation === "まだ幼い子ども"
        ? "manual"
        : OCCUPATION_SKILLS[life.occupation] ?? "manual", CHILDHOOD_CHOICE_REWARDS.workSkill, "家業の手伝い");
      addFlag(life, "helped-family-work");
      message = "家の仕事を手伝い、暮らしを支えた。";
      break;
    case "career-start":
    case "career-change":
    case "career-graduate": {
      const [, job] = selected.effect.split(":");
      const career = CAREER_CATALOG.find((item) => item.occupation === job);
      if (!career || !careerQualified(life, career)) {
        message = "必要な適性や技能を満たしていないため、その職業には就けなかった。";
        break;
      }
      if (effectType !== "career-graduate" && job === life.occupation) {
        message = `すでに${job}として働いているため、転職は行わなかった。`;
        break;
      }
      const previousJob = life.occupation;
      const previousSalary = monthlyBudget(life).income.work;
      changeOccupation(life, job, effectType === "career-start" ? "本人が初めての仕事を選択"
        : effectType === "career-graduate" ? "卒業後の職業を選択" : "本人が転職先を選択");
      life.graduationPending = false;
      life.graduationSkill = null;
      life.educationStatus = "就労";
      if (effectType === "career-change" && life.age >= TUNING.retirementHumanAge) {
        addFlag(life, "retirement-choice-resolved");
      }
      const nextSalary = monthlyBudget(life).income.work;
      message = `${job}を選び、${previousJob}から移った。月給は約${previousSalary.toFixed(1)}Gから${nextSalary.toFixed(1)}Gになった。`;
      break;
    }
    case "career-first": {
      const [, job] = selected.effect.split(":");
      const career = CAREER_CATALOG.find((item) => item.occupation === job);
      if (!career || life.age < FIRST_CAREER_MIN_AGE || !firstCareerOptions(life).some((item) => item.occupation === job)) {
        message = "その職業にはまだ就けなかった。";
        break;
      }
      changeOccupation(life, job, "学びを終え、最初の仕事を選択");
      addFlag(life, "first-career-done");
      life.careerCrossroads = false;
      life.educationStatus = "就労";
      message = `${job}として働き始めた。月給は約${monthlyBudget(life).income.work.toFixed(1)}G。`;
      break;
    }
    case "career-first-family":
      addFlag(life, "first-career-done");
      life.careerCrossroads = false;
      life.educationStatus = "就労";
      message = "家業の手伝いを続け、家の仕事を支えることにした。";
      break;
    case "church-join":
      changeOccupation(life, "聖職者", "教会の勧誘を受けて入信");
      addFlag(life, "joined-church");
      life.educationStatus = "就労";
      message = "教会の一員となり、聖職者としての修行を始めた。勤続を重ねれば司祭に昇れる。";
      break;
    case "graduate-defer":
      changeOccupation(life, "失業中", "卒業後の進路を保留");
      life.graduationPending = false;
      life.graduationSkill = null;
      life.educationStatus = "就職先を探している";
      message = "すぐには就職せず、進路を考える時間を取ることにした。";
      break;
    case "work-mentor-training":
      addSkillPoints(life, OCCUPATION_SKILLS[life.occupation] ?? "general", 4, "玄人の助言");
      message = `その道の玄人に5Gを払い、${occupationTitle(life)}の仕事のコツを学んだ。`;
      break;
    case "steady":
      message = `${life.occupation}の仕事と今の暮らしを続けることにした。`;
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
      life.gold += 1;
      message = "出費を見直し、わずかな蓄えを残すことにした。";
      break;
    case "mentor":
      addSkillPoints(life, "teaching", CHILDHOOD_CHOICE_REWARDS.mentorTeaching, "若者への指導");
      life.fame += CHILDHOOD_CHOICE_REWARDS.mentorFame;
      message = "若い人たちに経験を伝え、感謝された。";
      break;
    case "ore-contract": {
      const successChance = oreContractChance(life);
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
    case "gather-herbs":
      life.gold += 3;
      recordGold(life, "ギルドの薬草採集", 3);
      message = "ギルドの依頼で野原の薬草を集め、報酬3Gを受け取った。借金をせずに家計を助けられた。";
      break;
    case "dungeon-enter": {
      const goldBefore = life.gold;
      const roll = random();
      if (roll < 0.7) {
        life.gold += 1;
        message = "スライムを倒した。1Gを得た。";
      } else if (roll < 0.8) {
        life.gold += 50;
        message = "宝箱を見つけた！50Gの大金をゲットした！";
      } else {
        const loss = Math.min(life.gold, roll < 0.85 ? 20 : 5);
        life.gold -= loss;
        message = roll < 0.85
          ? `フレイムドラゴンに出会った。一目散に逃げたので、持ち物を落としてしまった。${gold(loss)}を失った。`
          : `ゴブリンに襲われて怪我をした。治療に${gold(loss)}かかった。`;
        if (loss < (roll < 0.85 ? 20 : 5)) message += "手持ちの範囲で精算し、借金はしなかった。";
      }
      recordGold(life, "ダンジョン探索", life.gold - goldBefore);
      break;
    }
    case "dungeon-decline":
      message = "ダンジョンには向かわず、危険を避けて日常を続けた。";
      break;
    case "demon-king-join":
      life.gold += 200;
      life.fame += 20;
      recordGold(life, "魔王討伐の賞金", 200);
      defeatDemonKing(life, random);
      life.demonKingHazardPending = true;
      message = "討伐隊に加わり、魔王を倒した。賞金を受け取り、名声が高まった。";
      break;
    case "demon-king-decline":
      message = "魔王討伐への参加を見送り、今の暮らしを続けることにした。";
      break;
    case "demon-relief":
      life.gold += 50;
      life.fame += 30;
      recordGold(life, "兵士慰問の報酬", 50);
      if (random() < TUNING.clericTraumaChance) {
        startIllness(life, "trauma", "中等症", "傷ついた兵士を慰問し、精神的トラウマを負った。");
        message = "傷ついた兵士を慰問し、報酬と名声を得た。兵士の苦しみに触れ、精神的トラウマを負った。";
      } else {
        message = "傷ついた兵士を慰問し、報酬と名声を得た。";
      }
      break;
    case "demon-relief-decline":
      message = "兵士への慰問を見送った。";
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
      life.childDecisionOffered = true;
      life.tryingSince = life.age;
      life.tryingUntil = life.age + 1;
      life.tryingMotherAge = femalePartner(life)?.humanAge ?? null;
      message = "二人でこの一年、子供を迎えたいと決めた。授かるかどうかは年齢などに応じた確率で決まる。";
      break;
    case "children-later":
      life.childPlan = "later";
      life.childDecisionOffered = true;
      life.nextChildAskAt = life.age + childRetryDelay(random);
      message = "子供のことは、今はまだ考えないことにした。数年後に改めて話し合う。";
      break;
    case "children-never":
      life.childPlan = "none";
      life.childDecisionOffered = true;
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
      life.illnessUntil = Math.max(life.illnessUntil ?? 0, life.age + illnessReviewInterval(life.illness));
      message = `${life.illness?.name ?? "病気"}の治療は受けず、自宅で療養することにした。`;
      break;
    case "illness-no-treatment":
      if (life.illness) life.illness.noTreatment = true;
      if (life.illness) life.illnessUntil = Math.max(life.illnessUntil ?? 0, life.age + illnessReviewInterval(life.illness));
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
      if (!life.illness) {
        life.health = "健やか";
        life.illnessUntil = life.age;
      }
      addRelationship(life, "family-support");
      message = "馴染みの場所で静養し、家族や身近な人とのつながりを確かめた。";
      break;
    case "edu-town-school":
      startTraining(life, random, {
        kind: "school", name: "町の教室での学び", skill: "literacy", activity: 0.5, learning: 1,
        years: EDUCATION.primaryYears, status: "町の教室に在籍中", school: { id: "local-school", name: "町の教室" },
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
      addFlag(life, "academy-declined");
      if (life.occupation === "家業の手伝い") {
        life.careerCrossroads = true;
        life.crossroadsPulled = false;
      }
      message = "学院には進まず、これまでの道を歩み続けることにした。";
      break;
    case "path-academy":
      addFlag(life, "academy-aspirant");
      life.careerCrossroads = false;
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
        if (life.businessOccupation && life.businessOccupation !== life.occupation) life.businessRevenue = 0;
        life.businessOccupation = life.occupation;
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
  const parentGoldDelta = Math.round(((life.parents?.gold ?? 0) - before.parentGold) * 10) / 10;
  if (parentGoldDelta) changes.push(`親の財産${parentGoldDelta > 0 ? "+" : ""}${parentGoldDelta}G`);
  const debtDelta = Math.round((life.debt - before.debt) * 10) / 10;
  if (debtDelta) changes.push(`借金${debtDelta > 0 ? "+" : ""}${debtDelta}G`);
  const fameDelta = life.fame - before.fame;
  if (fameDelta) changes.push(`名声${fameDelta > 0 ? "+" : ""}${fameDelta}`);
  if (life.health !== before.health) changes.push(`健康${before.health}→${life.health}`);
  if (life.occupation !== before.occupation) changes.push(`職業${before.occupation}→${life.occupation}`);
  for (const [skill, level] of Object.entries(life.skills)) {
    const delta = level - (before.skills[skill] ?? 0);
    if (Math.abs(delta) > 1e-9) changes.push(`${skillName(skill)}技能${delta > 0 ? "+" : ""}${delta.toFixed(1)}`);
  }
  const detail = [...changes, ...notes];
  life.lastResult = {
    title: decision.title,
    choice: asText(selected.label),
    message: asText(message),
    details: detail.map(asText),
    age: life.age,
  };
  if (changes.length) message = `${message}（${changes.join("、")}）`;
  life.pendingDecision = null;
  life.playing = true;
  appendEvent(life, message, "life", "選択", `${decision.id}-result`);
  const mother = femalePartner(life);
  const firstChildDecisionAt = life.spouseId && life.childPlan === "later" && life.childDecisionOffered !== true
    && mother && mother.humanAge <= TUNING.childDecisionMaxHumanAge
    ? Math.max(life.age, life.nextChildAskAt ?? life.age)
    : Infinity;
  life.nextDecisionAt = Number.isFinite(firstChildDecisionAt)
    ? firstChildDecisionAt
    : life.age + rollExponential(TUNING.decisionMeanYears, random);
  if (life.illness && life.illness !== illnessBeforeChoice && life.illness.severity !== "軽症") {
    life.nextDecisionAt = Math.min(life.nextDecisionAt, life.age);
  }
  if (life.occupation === "家業の手伝い" && life.careerCrossroads && !hasFlag(life, "first-career-done")) {
    life.nextDecisionAt = Math.min(life.nextDecisionAt, life.age + 0.05);
  }
  if (hasFlag(life, "academy-aspirant") && !life.trainingPlan) life.nextDecisionAt = Math.min(life.nextDecisionAt, life.age + 0.05);
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

function raiseDemonKing(life) {
  life.demonKingStarted = true;
  life.demonKingActive = true;
  life.demonKingRiseAt = Infinity;
  life.world ??= { situation: "平和", since: life.age, nextChangeAt: life.age + 6 };
  life.world.situation = "魔王君臨";
  life.world.since = life.age;
  life.world.nextChangeAt = life.age + TUNING.demonKingDurationYears;
  life.situation = "魔王君臨";
  appendEvent(life, WORLD_TEXT["魔王君臨"](life), "world", "世界情勢", "demon-king-rise");
  life.nextDecisionAt = Math.min(life.nextDecisionAt ?? Infinity, life.age);
}

function defeatDemonKing(life, random) {
  life.demonKingActive = false;
  life.demonKingDefeated = true;
  life.world ??= { situation: "平和", since: life.age, nextChangeAt: life.age + 6 };
  life.world.situation = "平和";
  life.world.since = life.age;
  life.world.nextChangeAt = life.age + 3 + rollExponential(7, random);
  life.situation = "平和";
  appendEvent(life, WORLD_END_TEXT["魔王君臨"], "world", "世界情勢", `world-end-demon-king-${Math.floor(life.age)}`);
}

function startIllness(life, type, severity, text) {
  const disease = DISEASE_TYPES.find((item) => item.id === type);
  if (!disease) return;
  const duration = TUNING.illnessSeverityWeights.find((item) => item.name === severity)?.duration ?? 0.4;
  life.illness = { type, name: disease.name, severity, since: life.age, duration };
  life.illnessUntil = life.age + duration;
  life.health = "療養中";
  appendEvent(
    life,
    `${text ?? `${disease.name}（${severity}）を発症した。`} 未治療時の年間致死率は約${Math.round(TUNING.illnessFatalityPerYearWhileIll * 100)}%。`,
    "world",
    type === "trauma" ? "精神的な不調" : "病気・怪我",
    `hazard-illness-${Math.floor(life.age * 4)}-${type}`,
  );
  if (severity !== "軽症") life.nextDecisionAt = Math.min(life.nextDecisionAt ?? Infinity, life.age);
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
  } else if (will.type === "friends-equal") {
    const friends = (life.npcs ?? []).filter((npc) => npc.alive && npc.relationship === "友人");
    if (friends.length) slots.push({ heirs: friends, weight: 1 });
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
  const children = (life.children ?? [])
    .map((entry) => typeof entry === "string" ? (life.npcs ?? []).find((npc) => npc.id === entry) : entry)
    .filter(Boolean)
    .sort((a, b) => (b.humanAge ?? 0) - (a.humanAge ?? 0));
  const findLivingDescendant = (ancestor, seen = new Set()) => {
    if (!ancestor || seen.has(ancestor.id)) return null;
    seen.add(ancestor.id);
    if (ancestor.alive) return ancestor;
    const descendants = (life.npcs ?? [])
      .filter((npc) => npc.parentId === ancestor.id)
      .sort((a, b) => (b.humanAge ?? 0) - (a.humanAge ?? 0));
    for (const descendant of descendants) {
      const heir = findLivingDescendant(descendant, seen);
      if (heir) return heir;
    }
    return null;
  };
  const heir = children.map((child) => findLivingDescendant(child)).find(Boolean) ?? null;
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
  const detail = life.will?.type === "friends-equal"
    ? ` 相続財産${gold(life.inheritanceEstate)}を存命の友人に均等に分けた。`
    : heirs.length
    ? ` 相続財産${gold(life.inheritanceEstate)}を${heirs.map((heir) => `${heir.name}へ${gold(heir.amount)}`).join("、")}分けた。`
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

  if (life.demonKingHazardPending) {
    life.demonKingHazardPending = false;
    if (random() < TUNING.participationFatality) {
      die(life, "魔王討伐戦");
      return;
    }
    if (random() < TUNING.participationInjuryChance) {
      const injury = random() < 0.5 ? "fracture" : "severeInjury";
      startIllness(life, injury, "重症", "魔王討伐で大きな怪我を負った。");
    }
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
    if (random() < 0.35) {
      startIllness(life, random() < 0.5 ? "fracture" : "severeInjury", "中等症", "仕事や移動の途中で事故に遭い、怪我を負った。");
      (life.eventHistory ??= []).push({ id: "hazard-accident", age: life.age });
    } else {
      appendEvent(life, "仕事や移動の途中で事故に遭ったが、命に別状はなかった。", "world", "事故", "hazard-accident");
    }
  }

  if (life.age < life.illnessUntil && random() < TUNING.illnessFatalityPerYearWhileIll * elapsed) {
    die(life, "病気");
    return;
  }

  const recoveredRecently = life.lastIllnessRecoveryAt != null && age - life.lastIllnessRecoveryAt < 2;
  if (life.age >= life.illnessUntil && !life.illness
    && random() < annualIllnessRate(age) * (recoveredRecently ? 0.5 : 1) * worldModifiers(life).illness * elapsed) {
    const disease = weightedPick(DISEASE_TYPES.filter((item) => item.weight > 0), (item) => item.weight, random);
    const severity = weightedPick(TUNING.illnessSeverityWeights, (item) => item.weight, random);
    startIllness(
      life,
      disease.id,
      severity.name,
      `${disease.name}（${severity.name}）を発症した。${severity.name === "軽症" ? "休養を取り、症状は落ち着いている。" : "治療を受けるか、療養を続けるか決める必要がある。"}`,
    );
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
      life.illnessUntil = life.age + illnessReviewInterval(life.illness);
      const injury = ["fracture", "severeInjury"].includes(life.illness.type);
      const trauma = life.illness.type === "trauma";
      appendEvent(
        life,
        injury
          ? `以前負った怪我が悪化した。借金をしてでも治療を受けますか？未治療時の年間致死率は約${Math.round(TUNING.illnessFatalityPerYearWhileIll * 100)}%。`
          : trauma
            ? `精神的トラウマの症状が悪化した。治療を受けますか？未治療時の年間致死率は約${Math.round(TUNING.illnessFatalityPerYearWhileIll * 100)}%。`
            : `${life.illness.name}の症状が続き、病状が重くなった。治療が必要になっている。`,
        "life", "病状の悪化", `illness-worsening-${Math.floor(age)}`,
      );
      if (life.illness.severity !== "軽症") life.nextDecisionAt = Math.min(life.nextDecisionAt ?? Infinity, life.age);
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
}

// ---------------------------------------------------------------- free spending ("お金を使う")

const adjustHappiness = (life, delta) => {
  life.happiness = clamp((life.happiness ?? 50) + delta, 0, 100);
};

const hasFlag = (life, flag) => (life.historyFlags ?? []).includes(flag);
const youngestChild = (life) => [...livingChildren(life)].sort((a, b) => (a.humanAge ?? 0) - (b.humanAge ?? 0))[0] ?? null;

export const SPEND_OPTIONS = Object.freeze([
  {
    id: "family-trip", label: "家族旅行に行く", cost: 8, cooldownYears: 2,
    check: (life) => (spouseNpc(life) || livingChildren(life).length ? null : "一緒に出かける家族がいない"),
    effects: "幸福度+12、家族との関係が良くなる",
    apply: (life) => {
      adjustHappiness(life, 12);
      if (life.marriage) adjustHarmony(life, 6);
      for (const child of livingChildren(life)) child.affinity = clamp((child.affinity ?? 50) + 5, 0, 100);
      return "家族みんなで旅に出て、見知らぬ町で思い出をつくった。";
    },
  },
  {
    id: "buy-books", label: "参考書を買う", cost: 5, cooldownYears: 1,
    check: (life) => (life.age < 6 ? "まだ本を読める年ではない" : null),
    effects: "仕事の技能+1.5、読み書き+1",
    apply: (life) => {
      addSkillPoints(life, OCCUPATION_SKILLS[life.occupation] ?? "general", 1.5, "参考書");
      addSkillPoints(life, "literacy", 1, "参考書");
      adjustHappiness(life, 2);
      return "新しい参考書を買い、夜ごとに少しずつ読み進めた。";
    },
  },
  {
    id: "repair-home", label: "家を修復する", cost: 6, cooldownYears: 3,
    check: (life) => (!life.ownsHome ? "持ち家がない" : (life.homeRepairs ?? 0) >= 3 ? "これ以上修復する必要がない" : null),
    effects: "住居評価額+10%（最大3回）、幸福度+5",
    apply: (life) => {
      life.homeRepairs = (life.homeRepairs ?? 0) + 1;
      life.homeValue = (life.homeValue ?? 0) * 1.1;
      adjustHappiness(life, 5);
      return "傷んだ屋根や壁を直し、家が見違えるように整った。";
    },
  },
  {
    id: "keep-pet", label: "ペットを飼う", cost: 10, oncePerLife: true,
    check: (life) => (life.age < 10 ? "まだ世話を任せられない" : hasFlag(life, "has-pet") ? "すでにペットを飼っている" : null),
    effects: `幸福度+10、毎月の世話代${TUNING.petUpkeepLegacyG}G`,
    apply: (life) => {
      addFlag(life, "has-pet");
      adjustHappiness(life, 10);
      return "小さな相棒を家に迎えた。賑やかな毎日が始まった。";
    },
  },
  {
    id: "hot-spring", label: "温泉で療養する", cost: 12, cooldownYears: 2,
    check: (life) => (life.age < 15 ? "子どもには必要ない" : null),
    effects: "不調なら回復、幸福度+6",
    apply: (life) => {
      if (["療養中", "回復中"].includes(life.health)) { life.health = "健やか"; life.illnessUntil = life.age; }
      adjustHappiness(life, 6);
      return "湯治場でゆっくり過ごし、体も心もほぐれた。";
    },
  },
  {
    id: "party", label: "友人を招いて宴を開く", cost: 4, cooldownYears: 1,
    check: (life) => (life.age < 14 ? "まだ宴を開く年ではない" : null),
    effects: "幸福度+6、友人が増える、名声+1",
    apply: (life) => {
      addRelationship(life, "friend");
      life.fame += 1;
      adjustHappiness(life, 6);
      return "友人たちを招いて宴を開き、夜更けまで笑い合った。";
    },
  },
  {
    id: "spouse-gift", label: "配偶者に贈り物をする", cost: 6, cooldownYears: 1,
    check: (life) => (life.marriage ? null : "配偶者がいない"),
    effects: "夫婦仲が良くなる、幸福度+4",
    apply: (life) => {
      adjustHarmony(life, 10);
      adjustHappiness(life, 4);
      return `${life.spouse ?? "配偶者"}に心のこもった贈り物を選び、喜んでもらえた。`;
    },
  },
  {
    id: "new-gear", label: "道具や装備を新調する", cost: 14, cooldownYears: 4,
    check: (life) => (life.age < 13 ? "まだ必要ない" : null),
    effects: "仕事の技能+2、危険な仕事で身を守りやすい",
    apply: (life) => {
      addFlag(life, "good-gear");
      addSkillPoints(life, OCCUPATION_SKILLS[life.occupation] ?? "general", 2, "道具の新調");
      return "新しい道具を揃え、仕事の手際が良くなった。";
    },
  },
  {
    id: "temple-donation", label: "神殿へ寄付する", cost: 10, cooldownYears: 2,
    check: (life) => (life.age < 15 ? "まだ寄付できる年ではない" : null),
    effects: "名声+2、幸福度+3",
    apply: (life) => {
      life.fame += 2;
      adjustHappiness(life, 3);
      return "神殿に寄付をし、人々から感謝された。";
    },
  },
  {
    id: "child-gift", label: "子どもに贈り物をする", cost: 5, cooldownYears: 1,
    check: (life) => (youngestChild(life) ? null : "子どもがいない"),
    effects: "子の親愛+10、幸福度+5",
    apply: (life) => {
      const child = youngestChild(life);
      child.affinity = clamp((child.affinity ?? 50) + 10, 0, 100);
      adjustHappiness(life, 5);
      return `${child.name}に贈り物をすると、満面の笑みを見せてくれた。`;
    },
  },
]);

function spendCost(life, option) {
  return Math.round(option.cost * worldModifiers(life).price * 10) / 10;
}

function spendUnavailableReason(life, option) {
  if (!life.active || !life.started) return "今は選べない";
  if (life.pendingDecision) return "先に選択を済ませる必要がある";
  const reason = option.check?.(life);
  if (reason) return reason;
  const last = life.spendHistory?.[option.id];
  if (option.cooldownYears && last !== undefined && life.age - last < option.cooldownYears) return "最近すでに行った";
  const cost = spendCost(life, option);
  if ((life.gold ?? 0) < cost) return `所持金が足りない（必要${gold(cost)}／所持${gold(Math.floor(life.gold ?? 0))}）`;
  return null;
}

export function spendOptions(life) {
  return SPEND_OPTIONS.map((option) => {
    const cost = spendCost(life, option);
    return {
      id: option.id,
      label: option.label,
      cost,
      preview: [`費用: ${gold(cost)}`, `効果: ${option.effects}`],
      disabledReason: spendUnavailableReason(life, option),
    };
  });
}

export function spendMoney(life, id) {
  const option = SPEND_OPTIONS.find((item) => item.id === id);
  if (!option || spendUnavailableReason(life, option)) return null;
  const cost = spendCost(life, option);
  const before = { gold: life.gold, fame: life.fame, health: life.health, happiness: life.happiness ?? 50, skills: { ...ensureSkillState(life) } };
  life.gold -= cost;
  recordGold(life, option.label, -cost);
  life.spendHistory ??= {};
  life.spendHistory[id] = life.age;
  const message = option.apply(life);
  const details = [`所持金-${cost}G`];
  if (life.fame !== before.fame) details.push(`名声+${life.fame - before.fame}`);
  if (life.health !== before.health) details.push(`健康${before.health}→${life.health}`);
  const happy = Math.round((life.happiness ?? 50) - before.happiness);
  if (happy) details.push(`幸福度${happy > 0 ? "+" : ""}${happy}`);
  for (const [skill, level] of Object.entries(life.skills)) {
    const delta = level - (before.skills[skill] ?? 0);
    if (Math.abs(delta) > 1e-9) details.push(`${skillName(skill)}技能+${delta.toFixed(1)}`);
  }
  life.lastResult = { title: "お金を使う", choice: option.label, message, details, age: life.age };
  appendEvent(life, `${message}（${details.join("、")}）`, "life", "出費", `spend-${id}`);
  return life.lastResult;
}

export function advanceLife(life, humanYears, random = Math.random) {
  if (!life.active || !life.playing || life.pendingDecision || humanYears <= 0) return [];
  let remaining = Math.min(humanYears, 0.25);
  const newEvents = [];

  while (remaining > 0 && life.active && !life.pendingDecision) {
    const nextScheduled = Math.min(
      life.nextLogAt, life.nextDecisionAt, life.nextSocialAt ?? Infinity, life.maxHumanAge,
      life.trainingEndsAt ?? Infinity, life.world?.nextChangeAt ?? Infinity,
      nextInfancyEvent(life)?.age ?? Infinity, life.demonKingRiseAt ?? Infinity,
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
    if (!life.demonKingStarted && life.age >= (life.demonKingRiseAt ?? Infinity)) raiseDemonKing(life);
    if (life.trainingEndsAt != null && life.age >= life.trainingEndsAt) finishTraining(life, random);
    updateCareerCrossroads(life);
    updateCareerReview(life, random);
    const infancy = nextInfancyEvent(life);
    if (infancy && life.age >= infancy.age) {
      appendEvent(life, infancy.text(life), "life", "幼少期", `infancy-${infancy.age}`);
      life.childhoodContextThrough = infancy.age;
    }
    if ((life.dungeonOffers ?? 0) < 2 && life.age >= (life.nextDungeonAt ?? TUNING.dungeonOfferAges[0])) {
      life.nextDecisionAt = Math.min(life.nextDecisionAt, life.age);
    }
    if (life.nextSocialAt !== undefined && life.age >= life.nextSocialAt) {
      if (life.age >= 14 && life.race.id !== "dragon") socialStep(life, random);
      life.nextSocialAt = life.age + Math.max(0.3, rollExponential(TUNING.socialMeanYears, random));
      continue;
    }
    if (life.age >= life.nextDecisionAt) {
      life.pendingDecision = decisionFor(life, random);
      if (!life.pendingDecision) {
        life.nextDecisionAt = life.age + Math.max(0.1, rollExponential(TUNING.decisionMeanYears, random));
        if (remaining <= 0) break;
        continue;
      }
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

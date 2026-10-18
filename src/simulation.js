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
  routineLogIntervalYears: 1,
  decisionMeanYears: 4,
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

export const ROUTINE_EVENTS = [
  { id: "market-season", category: "日常生活", minAge: 6, cooldownYears: 6, text: (life) => `${life.home}の市で季節の品が並び、近所の人とささやかな話を交わした。` },
  { id: "community-help", category: "日常生活", minAge: 6, cooldownYears: 7, text: () => "近所の人たちと力を合わせ、嵐で傷んだ共同井戸を直した。" },
  { id: "old-friend", category: "友情・人間関係", minAge: 13, cooldownYears: 10, text: () => "昔からの友人と久しぶりに会い、互いの近況を語り合った。" },
  { id: "local-festival", category: "日常生活", minAge: 6, cooldownYears: 8, text: () => "町の祭りを手伝い、普段は話さない人とも笑顔を交わした。" },
  { id: "seasonal-work", category: "仕事・昇進", minAge: 13, cooldownYears: 6, occupations: ["農作業", "家業の手伝い"], text: () => "季節の収穫を手伝い、仕事仲間と分け合う食事を楽しんだ。" },
  { id: "craft-order", category: "仕事・昇進", minAge: 13, cooldownYears: 8, occupations: ["職人見習い", "服飾店の見習い"], text: () => "少し難しい注文を任され、仕上げた品を親方に認められた。" },
  { id: "trade-opportunity", category: "財産・借金", minAge: 18, cooldownYears: 9, minimumGold: 20, text: (life) => `蓄えを生かして${life.nation.name}の市で品を仕入れ、少し利益を得た。` },
  { id: "workplace-mentor", category: "仕事・昇進", minAge: 18, cooldownYears: 8, minimumSkill: 20, text: () => "仕事の経験を買われ、後輩に道具の扱いを教える機会を得た。" },
  { id: "skilled-work", category: "仕事・昇進", minAge: 18, cooldownYears: 10, minimumSkill: 60, text: () => "長年磨いた技が評判となり、遠方からも仕事の依頼が届いた。" },
  { id: "healing-rest", category: "病気・事故", minAge: 18, cooldownYears: 12, text: () => "疲れが重なって体調を崩したが、仕事を休んで療養し、回復した。" },
  { id: "human-mage", category: "魔法・魔物", raceIds: ["human"], minAge: 6, cooldownYears: 10, text: () => "魔力の気配に気づいた町の魔術師から、簡単な術を教わる機会を得た。" },
  { id: "beastkin-senses", category: "種族固有", raceIds: ["beastkin"], minAge: 6, cooldownYears: 8, text: () => "鋭い嗅覚で森道の異変に気づき、通りかかった旅人を危険から遠ざけた。" },
  { id: "beastkin-hunt", category: "種族固有", raceIds: ["beastkin"], minAge: 13, cooldownYears: 10, text: () => "狩りで身軽さを発揮し、村の食卓に新鮮な獲物を持ち帰った。" },
  { id: "dwarf-forge", category: "種族固有", raceIds: ["dwarf"], minAge: 13, cooldownYears: 9, text: () => "鍛冶場で初めて熱した金属を扱い、氏族の職人から手際を褒められた。" },
  { id: "dwarf-vein", category: "種族固有", raceIds: ["dwarf"], minAge: 18, cooldownYears: 12, text: () => "山道の岩肌から新しい鉱脈の兆しを見つけ、採掘仲間に知らせた。" },
  { id: "demon-horns", category: "種族固有", raceIds: ["demon"], minAge: 6, maxAge: 24, cooldownYears: 10, text: () => "角の先に魔力が宿り、淡い光が灯った。家族は一族の成長を祝った。" },
  { id: "demon-magic", category: "種族固有", raceIds: ["demon"], minAge: 13, cooldownYears: 10, text: () => "魔力が思いがけずあふれて家財を揺らしたが、家族と練習して制御を覚えた。" },
  { id: "demon-recruit", category: "種族固有", raceIds: ["demon"], nationIds: ["empire", "demon-realm"], minAge: 18, cooldownYears: 14, text: () => "軍の魔術部隊から勧誘を受け、自分の力をどこで生かすか考えた。" },
  { id: "elf-spirit", category: "種族固有", raceIds: ["elf"], minAge: 13, cooldownYears: 12, text: () => "森の精霊の光が弱まっていることに気づき、長老と原因を探った。" },
  { id: "elf-reunion", category: "種族固有", raceIds: ["elf"], minAge: 30, cooldownYears: 18, text: () => "数十年ぶりに幼なじみと再会し、変わらない森と移ろった人の世について話した。" },
  { id: "dragon-flight", category: "種族固有", raceIds: ["dragon"], minAge: 6, maxAge: 40, cooldownYears: 12, text: () => "初めて自分の力だけで高く飛び、雲の上から広い山並みを見渡した。" },
  { id: "dragon-hoard", category: "種族固有", raceIds: ["dragon"], minAge: 18, cooldownYears: 15, text: () => "巣を訪れた冒険者を追い返し、守り抜いた財宝を奥深くへ移した。" },
  { id: "vampire-suspicion", category: "種族固有", raceIds: ["vampire"], minAge: 18, cooldownYears: 14, text: () => "夜にしか姿を見せないことを怪しまれたが、信頼する隣人には事情を打ち明けた。" },
  { id: "vampire-retainer", category: "種族固有", raceIds: ["vampire"], minAge: 30, cooldownYears: 18, text: () => "長く仕えてきた眷属が自分の道を望み、互いの未来について話し合った。" },
  { id: "kingdom-tax", category: "国家・法律", nationIds: ["kingdom"], minAge: 18, cooldownYears: 12, text: () => "領主の徴税が見直され、村人たちは新しい負担について相談した。" },
  { id: "kingdom-court", category: "戦争・政治", nationIds: ["kingdom"], minAge: 18, cooldownYears: 15, text: () => "貴族の失脚が町の噂になり、王都の仕事や取引にも変化が広がった。" },
  { id: "empire-draft", category: "国家・法律", nationIds: ["empire"], minAge: 18, cooldownYears: 12, text: () => "帝国の徴兵令が出され、家族や同僚と今後の暮らしを話し合った。" },
  { id: "empire-supply", category: "戦争・政治", nationIds: ["empire"], minAge: 18, cooldownYears: 12, text: () => "軍需品の注文が増え、町の工房や商店に臨時の仕事が舞い込んだ。" },
  { id: "forest-council", category: "国家・法律", nationIds: ["forest"], minAge: 18, cooldownYears: 12, text: () => "長老会議で森の保護が決まり、住民は採集や狩りの約束を見直した。" },
  { id: "mountain-guild", category: "国家・法律", nationIds: ["mountain"], minAge: 13, cooldownYears: 10, text: () => "職人組合の競技会に参加し、氏族を越えた腕比べで刺激を受けた。" },
  { id: "demon-rivalry", category: "戦争・政治", nationIds: ["demon-realm"], minAge: 18, cooldownYears: 12, text: () => "領主同士の権力争いが仕事にも影を落とし、周囲は立場を慎重に選んだ。" },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const randomItem = (items, random) => items[Math.floor(random() * items.length)];
const rollExponential = (mean, random) => -Math.log(Math.max(Number.EPSILON, 1 - random())) * mean;

export function routineLogMean(life) {
  return TUNING.routineLogIntervalYears * life.race.multiplier;
}

export function isRoutineEventEligible(life, event, age = life.age) {
  const requirements = event.requirements ?? event;
  if (age < (requirements.minAge ?? 0) || age > (requirements.maxAge ?? Infinity)) return false;
  if (requirements.raceIds && !requirements.raceIds.includes(life.race.id)) return false;
  if (requirements.nationIds && !requirements.nationIds.includes(life.nation.id)) return false;
  if (requirements.occupations && !requirements.occupations.includes(life.occupation)) return false;
  if (requirements.minimumGold !== undefined && life.gold < requirements.minimumGold) return false;
  if (requirements.minimumSkill !== undefined && life.occupationSkill < requirements.minimumSkill) return false;
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
  const family = life.family;
  return `あなたは${life.nation.name}の${life.home}にある${family}家庭に生まれた。${life.status.name}として、あなたの物語が始まる。`;
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
  const life = {
    name: `${firstName}・${surname}`,
    gender,
    race,
    nation,
    status,
    home: homeForStatus,
    family,
    personality: randomItem(PERSONALITIES, random),
    appearance: {
      hair: randomItem(HAIR_COLORS, random),
      coat: randomItem(COAT_COLORS, random),
    },
    situation: randomItem(SITUATIONS, random),
    age: 0,
    active: true,
    playing: true,
    speed: 1,
    gold: Math.floor(5 + random() * 16),
    health,
    fame: 0,
    occupation: "まだ幼い子ども",
    familyCount: 0,
    eventCount: 0,
    journal: [],
    relationships: [],
    illnessUntil: 0,
    nextLogAt: rollExponential(1 / TUNING.logEventsPerHumanYear, random),
    nextDecisionAt: createInitialDecisionAge(random),
    pendingDecision: null,
    deathCause: null,
    deathAge: null,
    maxHumanAge: race.lifespan / race.multiplier,
    randomSeed: random(),
  };
  appendEvent(life, birthStory(life), "life", "誕生");
  return life;
}

function appendEvent(life, text, kind = "life", label = "人生") {
  const event = { age: life.age, text, kind, label };
  life.journal.push(event);
  life.eventCount += 1;
  return event;
}

function lifeStage(age) {
  if (age < 6) return "child";
  if (age < 13) return "school";
  if (age < 18) return "youth";
  if (age < 36) return "youngAdult";
  if (age < 61) return "middle";
  return "elder";
}

function ordinaryEvent(life, random) {
  if (life.race.id === "dragon") {
    const dragonEvents = [
      ["竜の暮らし", "山の風を受け、翼を広げて巣の周りを飛んだ。"],
      ["狩り", "山あいで獲物を見つけ、今日の糧を得た。"],
      ["縄張り", "遠くから別の竜の咆哮が聞こえ、互いの縄張りを確かめた。"],
      ["財宝", "洞窟の奥に小さな宝石を見つけ、巣へ持ち帰った。"],
    ];
    const [label, text] = randomItem(dragonEvents, random);
    return { label, text, kind: "life" };
  }
  const stage = lifeStage(life.age);
  const eventOptions = {
    child: [
      ["家族と過ごす", `家族と小さな食卓を囲んだ。${life.personality}なあなたは、みんなの話に耳を傾けた。`],
      ["成長", "少しずつ言葉を覚え、身の回りの世界が広がっていく。"],
      ["暮らし", `${life.home}の市場は朝からにぎわい、家族と買い物に出かけた。`],
    ],
    school: [
      ["学び", "近所の読み書き教室で、新しい文字をいくつか覚えた。"],
      ["友人", "同じ年頃の子と知り合い、帰り道を一緒に歩いた。"],
      ["家族", "家の手伝いをして、家族から感謝された。"],
    ],
    youth: [
      ["成長", "得意なことが少しずつ見えてきて、将来を考えるようになった。"],
      ["人間関係", "友人と将来について語り合い、互いの夢を応援した。"],
      ["暮らし", `${life.home}で新しい仕事の噂を耳にした。`],
    ],
    youngAdult: [
      ["仕事", `${life.occupation}として経験を重ね、周囲から頼られることが増えた。`],
      ["人間関係", "昔からの友人と再会し、近況を語り合った。"],
      ["暮らし", `${life.home}の通りに新しい店が開き、町が少し活気づいた。`],
      ["世界", worldUpdate(life)],
    ],
    middle: [
      ["仕事", `${life.occupation}の仕事に慣れ、若い人に経験を伝える機会が増えた。`],
      ["家族", "家族と過ごす時間を大切にしながら、日々の仕事を続けた。"],
      ["世界", worldUpdate(life)],
    ],
    elder: [
      ["人生", "長い年月で得た知恵を、近くに住む若者へ伝えた。"],
      ["旧友", "懐かしい友人を訪ね、若い頃の思い出を語り合った。"],
      ["暮らし", "無理をせず、馴染みの場所でゆっくりと日々を過ごした。"],
    ],
  };
  const [label, text] = randomItem(eventOptions[stage], random);
  return { label, text, kind: label === "世界" ? "world" : "life" };
}

function worldUpdate(life) {
  const updates = {
    平和: `${life.nation.name}では大きな争いもなく、穏やかな日々が続いている。`,
    不況: `${life.nation.name}では商いが細り、仕事を探す人の姿が増えてきた。`,
    疫病流行: `${life.nation.name}では疫病への警戒が続き、人々は医師の助言に耳を傾けている。`,
    飢饉: `${life.nation.name}では食料が不足し、市場の値段も上がっている。`,
    戦争中: `${life.nation.name}では戦が続き、町にも戦地の知らせが届いている。`,
  };
  return updates[life.situation] ?? updates["平和"];
}

function scheduleLog(life, random) {
  life.nextLogAt = life.age + rollExponential(1 / TUNING.logEventsPerHumanYear, random);
}

function pickCareer(life, random) {
  const eligible = life.race.id === "dragon"
    ? ["狩りを覚える", "巣の外を探検する", "縄張りを見回る"]
    : WORKS;
  return randomItem(eligible, random);
}

function decisionFor(life, random) {
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
      message = "学びを続け、新しい知識を身につけた。";
      break;
    case "work":
      life.gold += 2;
      message = "家の仕事を手伝い、暮らしを支えた。";
      break;
    case "apprentice":
      life.occupation = pickCareer(life, random);
      message = `${life.occupation}として見習いを始めた。`;
      life.gold += 4;
      break;
    case "career":
      life.occupation = pickCareer(life, random);
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
  if (random() < accidentRate * elapsed) {
    if (random() < TUNING.accidentFatality) {
      die(life, "事故");
      return;
    }
    life.health = random() < 0.35 ? "療養中" : life.health;
    appendEvent(life, "仕事や移動の途中で事故に遭ったが、命に別状はなかった。", "world", "事故");
  }

  if (life.age < life.illnessUntil && random() < TUNING.illnessFatalityPerYearWhileIll * elapsed) {
    die(life, "病気");
    return;
  }

  if (life.age >= life.illnessUntil && random() < annualIllnessRate(age) * elapsed) {
    life.illnessUntil = life.age + 0.2 + random() * 1.1;
    life.health = "体調不良";
    appendEvent(life, "しばらく体調を崩した。休養を取り、家族がそばで看病してくれた。", "world", "病気");
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
      appendEvent(life, `${life.pendingDecision.title} — ${life.pendingDecision.copy}`, "decision", "決断");
      break;
    }
    if (life.age >= life.nextLogAt) {
      const event = ordinaryEvent(life, random);
      newEvents.push(appendEvent(life, event.text, event.kind, event.label));
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

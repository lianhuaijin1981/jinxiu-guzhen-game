// ===== 锦绣古镇 v2.0 核心配置 =====
// 严格按《核心玩法设计说明书》+《建筑+道具详细设计说明书》执行

export interface GameItem {
  itemId: string;
  itemName: string;
  level: number;
  icon: string;
  desc: string;
  color: string;
  glowColor: string;
}

export interface ComposeRule {
  from: string;
  to: string;
}

export interface Building {
  id: string;
  name: string;
  streetId: string;
  streetName: string;
  level: number;
  maxLevel: number;
  status: 'locked' | 'unlocked' | 'upgrading';
  unlockCost: { coin: number; material: number } | null;
  upgradeCost: { coin: number; material: number } | null;
  offlineReward: { coin: number; items: { id: string; count: number }[] };
  specialEffect?: string;
  desc: string;
  visualLevel: number; // 1简陋 3精致 5传世
}

export interface Street {
  id: string;
  name: string;
  unlockCondition: string;
  buildings: string[];
}

export interface Order {
  id: string;
  itemId: string;
  itemCount: number;
  rewardCoin: number;
  rewardMaterial: number;
  timeLeft: number;
  status: 'active' | 'completed';
}

export interface DailyTask {
  id: string;
  title: string;
  target: number;
  current: number;
  rewardCoin: number;
  rewardMaterial: number;
  completed: boolean;
}

export interface SignInReward {
  day: number;
  coin: number;
  material: number;
  special?: string;
}

// ===== 道具配置（4档通用 + 建材） =====
export const ITEMS: Record<string, GameItem> = {
  // 一档：普通道具
  'pottery': { itemId: 'pottery', itemName: '陶罐', level: 1, icon: '🏺', desc: '土黄色陶罐，古镇最常见的基础风物', color: '#d4a574', glowColor: 'rgba(212,165,116,0.3)' },
  // 二档：精良道具
  'umbrella': { itemId: 'umbrella', itemName: '油纸伞', level: 2, icon: '☂️', desc: '竹骨油纸伞面，浅棕墨画竹梅', color: '#c9a96e', glowColor: 'rgba(201,169,110,0.4)' },
  // 三档：珍稀道具
  'fan': { itemId: 'fan', itemName: '折扇', level: 3, icon: '🪭', desc: '竹骨扇面墨画山水花鸟', color: '#e8d5a3', glowColor: 'rgba(232,213,163,0.5)' },
  'embroidery': { itemId: 'embroidery', itemName: '刺绣', level: 3, icon: '🧵', desc: '绸缎刺绣牡丹喜鹊，红粉绿流苏', color: '#d47274', glowColor: 'rgba(212,114,116,0.5)' },
  // 四档：传世道具
  'jade': { itemId: 'jade', itemName: '玉佩', level: 4, icon: '💎', desc: '淡绿色圆形玉佩，雕龙凤祥云', color: '#7ecfa8', glowColor: 'rgba(126,207,168,0.6)' },
  // 建材
  'mat1': { itemId: 'mat1', itemName: '初级建材', level: 0, icon: '🧱', desc: '灰色砖块，表面粗糙', color: '#999', glowColor: 'rgba(153,153,153,0.2)' },
  'mat2': { itemId: 'mat2', itemName: '中级建材', level: 0, icon: '🪨', desc: '青色砖块，表面光滑有纹路', color: '#6a9e8a', glowColor: 'rgba(106,158,138,0.2)' },
  'mat3': { itemId: 'mat3', itemName: '高级建材', level: 0, icon: '✨', desc: '鎏金砖块，表面雕花光泽耀眼', color: '#d4a843', glowColor: 'rgba(212,168,67,0.3)' },
};

// ===== 合成规则（2个低阶→1个高阶） =====
export const COMPOSE_RULES: ComposeRule[] = [
  { from: 'pottery', to: 'umbrella' },
  { from: 'umbrella', to: 'fan' },
  { from: 'umbrella', to: 'embroidery' },
  { from: 'fan', to: 'jade' },
  { from: 'embroidery', to: 'jade' },
];

// 获取合成目标
export function getComposeTarget(itemId: string): string | null {
  const rule = COMPOSE_RULES.find(r => r.from === itemId);
  return rule ? rule.to : null;
}

// 获取道具等级名称
export function getLevelName(level: number): string {
  const names: Record<number, string> = { 1: '普通', 2: '精良', 3: '珍稀', 4: '传世' };
  return names[level] || '未知';
}

// ===== 街区配置 =====
export const STREETS: Street[] = [
  { id: 's1', name: '市井街', unlockCondition: '初始解锁', buildings: ['residence', 'shop', 'teahouse', 'station'] },
  { id: 's2', name: '风雅巷', unlockCondition: '市井街所有建筑达3级', buildings: ['study', 'embroideryWorkshop', 'artStudio', 'chessClub'] },
];

// ===== 建筑配置（市井街 + 风雅巷） =====
export function createBuildings(): Building[] {
  return [
    // === 市井街 ===
    {
      id: 'residence', name: '民居', streetId: 's1', streetName: '市井街',
      level: 0, maxLevel: 5, status: 'locked',
      unlockCost: { coin: 500, material: 3 },
      upgradeCost: { coin: 2000, material: 8 },
      offlineReward: { coin: 80, items: [{ id: 'pottery', count: 1 }] },
      desc: '古镇基础建筑，产出陶罐和金币',
      visualLevel: 1,
    },
    {
      id: 'shop', name: '杂货铺', streetId: 's1', streetName: '市井街',
      level: 0, maxLevel: 5, status: 'locked',
      unlockCost: { coin: 1500, material: 5 },
      upgradeCost: { coin: 3000, material: 10 },
      offlineReward: { coin: 100, items: [{ id: 'umbrella', count: 1 }] },
      desc: '产出油纸伞和金币',
      visualLevel: 1,
    },
    {
      id: 'teahouse', name: '茶馆', streetId: 's1', streetName: '市井街',
      level: 0, maxLevel: 5, status: 'locked',
      unlockCost: { coin: 2500, material: 6 },
      upgradeCost: { coin: 4000, material: 0 },
      offlineReward: { coin: 120, items: [{ id: 'mat1', count: 1 }] },
      desc: '产出初级建材和金币',
      visualLevel: 1,
    },
    {
      id: 'station', name: '驿站', streetId: 's1', streetName: '市井街',
      level: 0, maxLevel: 5, status: 'locked',
      unlockCost: { coin: 3000, material: 7 },
      upgradeCost: { coin: 5000, material: 0 },
      offlineReward: { coin: 0, items: [] },
      specialEffect: '缩短订单刷新时间',
      desc: '加快订单刷新速度',
      visualLevel: 1,
    },
    // === 风雅巷 ===
    {
      id: 'study', name: '书斋', streetId: 's2', streetName: '风雅巷',
      level: 0, maxLevel: 5, status: 'locked',
      unlockCost: { coin: 4000, material: 0 },
      upgradeCost: { coin: 6000, material: 0 },
      offlineReward: { coin: 180, items: [{ id: 'fan', count: 1 }] },
      desc: '产出折扇和金币',
      visualLevel: 1,
    },
    {
      id: 'embroideryWorkshop', name: '绣坊', streetId: 's2', streetName: '风雅巷',
      level: 0, maxLevel: 5, status: 'locked',
      unlockCost: { coin: 4500, material: 0 },
      upgradeCost: { coin: 6500, material: 0 },
      offlineReward: { coin: 200, items: [{ id: 'embroidery', count: 1 }] },
      desc: '产出刺绣和金币',
      visualLevel: 1,
    },
    {
      id: 'artStudio', name: '画院', streetId: 's2', streetName: '风雅巷',
      level: 0, maxLevel: 5, status: 'locked',
      unlockCost: { coin: 5000, material: 0 },
      upgradeCost: { coin: 7000, material: 0 },
      offlineReward: { coin: 0, items: [{ id: 'mat2', count: 1 }] },
      specialEffect: '图鉴奖励提升10%',
      desc: '产出中级建材，提升图鉴奖励',
      visualLevel: 1,
    },
    {
      id: 'chessClub', name: '棋社', streetId: 's2', streetName: '风雅巷',
      level: 0, maxLevel: 5, status: 'locked',
      unlockCost: { coin: 5500, material: 0 },
      upgradeCost: { coin: 7500, material: 0 },
      offlineReward: { coin: 0, items: [] },
      specialEffect: '每日任务奖励提升10%',
      desc: '提升每日任务奖励',
      visualLevel: 1,
    },
  ];
}

// ===== 订单模板 =====
export function generateOrders(): Order[] {
  const orderTemplates = [
    { itemId: 'pottery', count: 3, coin: 200, mat: 2 },
    { itemId: 'pottery', count: 5, coin: 300, mat: 2 },
    { itemId: 'umbrella', count: 2, coin: 500, mat: 3 },
    { itemId: 'umbrella', count: 3, coin: 700, mat: 3 },
    { itemId: 'fan', count: 1, coin: 1000, mat: 3 },
    { itemId: 'embroidery', count: 1, coin: 1000, mat: 3 },
    { itemId: 'jade', count: 1, coin: 2500, mat: 1 },
  ];
  return orderTemplates.map((t, i) => ({
    id: `order_${i}`,
    itemId: t.itemId,
    itemCount: t.count,
    rewardCoin: t.coin,
    rewardMaterial: t.mat,
    timeLeft: 1800 - i * 200,
    status: 'active' as const,
  }));
}

// ===== 每日任务 =====
export function createDailyTasks(): DailyTask[] {
  return [
    { id: 'task_compose', title: '完成3次合成', target: 3, current: 0, rewardCoin: 300, rewardMaterial: 3, completed: false },
    { id: 'task_order', title: '交付2笔订单', target: 2, current: 0, rewardCoin: 500, rewardMaterial: 5, completed: false },
    { id: 'task_build', title: '解锁1个建筑', target: 1, current: 0, rewardCoin: 800, rewardMaterial: 5, completed: false },
  ];
}

// ===== 七日签到奖励 =====
export const SIGN_IN_REWARDS: SignInReward[] = [
  { day: 1, coin: 500, material: 3 },
  { day: 2, coin: 800, material: 5 },
  { day: 3, coin: 1200, material: 8, special: '稀有油纸伞×1' },
  { day: 4, coin: 1500, material: 10 },
  { day: 5, coin: 2000, material: 12 },
  { day: 6, coin: 2500, material: 15 },
  { day: 7, coin: 5000, material: 20, special: '限定古镇皮肤' },
];

// ===== 合成特效配置 =====
export const COMPOSE_EFFECTS: Record<number, { text: string; particles: number; color: string; scale: number }> = {
  1: { text: '合成成功', particles: 6, color: '#d4a574', scale: 1.0 },
  2: { text: '合成精良油纸伞', particles: 10, color: '#c9a96e', scale: 1.1 },
  3: { text: '合成珍稀道具', particles: 16, color: '#e8d5a3', scale: 1.2 },
  4: { text: '合成传世玉佩！', particles: 24, color: '#7ecfa8', scale: 1.4 },
};

// ===== 初始玩家数据 =====
export const INITIAL_PLAYER = {
  coin: 1000,
  material: 10,
  townLevel: 1,
  composeCount: 0,
  orderCount: 0,
  lastOfflineTime: Date.now(),
  signInDay: 0,
  signInToday: false,
  tasksCompleted: 0,
};

// ===== 游戏核心类型定义 =====

export interface GameItem {
  itemId: string;
  itemName: string;
  itemLevel: number;
  itemType: number;
  sceneId: number;
  icon: string;
  desc: string;
  isCanCompose: boolean;
}

export interface ComposeRecipe {
  composeId: number;
  sourceItem1: string;
  sourceItem2: string;
  targetItem: string;
  costEnergy: number;
  sceneId: number;
}

export interface GameScene {
  sceneId: number;
  sceneName: string;
  spotId: number;
  spotName: string;
  unlockPrestige: number;
  repairStage: number;
  repairCostCoin: number[];
  repairCostItem: string;
  repairReward: string;
  sceneRes: string;
}

export interface GameOrder {
  orderId: number;
  orderType: number;
  sceneId: number;
  spotId: number;
  needItem: string;
  rewardCoin: number;
  rewardSilver: number;
  rewardPrestige: number;
  isUnlock: boolean;
}

export interface NPC {
  npcId: number;
  npcName: string;
  historyName: string;
  sceneId: number;
  spotId: number;
  npcRes: string;
  dialogue: string;
  orderId: string;
}

export interface UserData {
  energy: number;
  maxEnergy: number;
  coin: number;
  silver: number;
  prestige: number;
  unlockScene: number[];
  curSceneId: number;
}

export interface BoardCell {
  row: number;
  col: number;
  item: GameItem | null;
}

export interface Generator {
  sceneId: number;
  baseItems: string[];
  cooldown: number;
  lastGenerate: number;
}

export type GameTab = 'board' | 'scene' | 'order' | 'collection' | 'shop';

export interface GameState {
  user: UserData;
  board: (GameItem | null)[][];
  currentScene: number;
  selectedCell: { row: number; col: number } | null;
  generators: Generator[];
  orders: GameOrder[];
  npcs: NPC[];
  dialogues: string[];
}

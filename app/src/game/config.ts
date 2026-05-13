// ===== 游戏配置加载器 =====
import type { GameItem, ComposeRecipe, GameScene, GameOrder, NPC } from './types';

// 内嵌配置数据（直接来自配置表）
export const ITEMS: GameItem[] = [
  // 江南古镇
  { itemId:'101', itemName:'蚕茧', itemLevel:1, itemType:1, sceneId:1, icon:'🌿', desc:'江南桑蚕产出的洁白蚕茧', isCanCompose:true },
  { itemId:'102', itemName:'生丝', itemLevel:1, itemType:1, sceneId:1, icon:'🧵', desc:'蚕茧缫丝后的原始丝线', isCanCompose:true },
  { itemId:'103', itemName:'蚕丝线', itemLevel:1, itemType:1, sceneId:1, icon:'🎀', desc:'精练上色后的彩色丝线', isCanCompose:true },
  { itemId:'104', itemName:'素缎', itemLevel:2, itemType:2, sceneId:1, icon:'🧣', desc:'平纹织造的基础缎面', isCanCompose:true },
  { itemId:'105', itemName:'绫罗', itemLevel:2, itemType:2, sceneId:1, icon:'👘', desc:'斜地起花的丝织物', isCanCompose:true },
  { itemId:'106', itemName:'刺绣帕', itemLevel:2, itemType:2, sceneId:1, icon:'🪡', desc:'手工刺绣的丝帕', isCanCompose:true },
  { itemId:'107', itemName:'织锦', itemLevel:3, itemType:2, sceneId:1, icon:'🎨', desc:'多重纬线交织的华丽锦缎', isCanCompose:true },
  { itemId:'108', itemName:'云锦段', itemLevel:3, itemType:2, sceneId:1, icon:'🌈', desc:'江南织造局传承的云锦技法', isCanCompose:true },
  // 泰山
  { itemId:'201', itemName:'泰山石', itemLevel:1, itemType:1, sceneId:2, icon:'🪨', desc:'泰山脚下采集的花岗岩', isCanCompose:true },
  { itemId:'202', itemName:'松枝', itemLevel:1, itemType:1, sceneId:2, icon:'🌲', desc:'泰山古松的翠绿枝桠', isCanCompose:true },
  { itemId:'203', itemName:'柏叶', itemLevel:1, itemType:1, sceneId:2, icon:'🍃', desc:'岱庙古柏的叶片', isCanCompose:true },
  { itemId:'204', itemName:'石碑拓片', itemLevel:2, itemType:2, sceneId:2, icon:'📜', desc:'泰山碑刻的拓印残片', isCanCompose:true },
  { itemId:'205', itemName:'松烟墨', itemLevel:2, itemType:2, sceneId:2, icon:'⚫', desc:'古松燃烧取烟制成的墨', isCanCompose:true },
  { itemId:'206', itemName:'石牌坊构件', itemLevel:2, itemType:2, sceneId:2, icon:'⛩️', desc:'石坊的雕刻构件', isCanCompose:true },
  { itemId:'207', itemName:'封禅玉册', itemLevel:3, itemType:2, sceneId:2, icon:'📿', desc:'古代帝王封禅泰山的玉册', isCanCompose:true },
  { itemId:'208', itemName:'岱庙瓦当', itemLevel:3, itemType:2, sceneId:2, icon:'🏯', desc:'岱庙殿宇的琉璃瓦当', isCanCompose:true },
  // 西湖
  { itemId:'301', itemName:'龙井茶叶', itemLevel:1, itemType:1, sceneId:3, icon:'🍵', desc:'西湖龙井鲜叶', isCanCompose:true },
  { itemId:'302', itemName:'荷瓣', itemLevel:1, itemType:1, sceneId:3, icon:'🌸', desc:'西湖荷花的花瓣', isCanCompose:true },
  { itemId:'303', itemName:'柳枝条', itemLevel:1, itemType:1, sceneId:3, icon:'🌿', desc:'苏堤垂柳的枝条', isCanCompose:true },
  { itemId:'304', itemName:'茶饼', itemLevel:2, itemType:2, sceneId:3, icon:'🫖', desc:'炒制压制的龙井茶饼', isCanCompose:true },
  { itemId:'305', itemName:'刺绣扇面', itemLevel:2, itemType:2, sceneId:3, icon:'🪭', desc:'苏绣工艺的团扇扇面', isCanCompose:true },
  { itemId:'306', itemName:'荷藕', itemLevel:2, itemType:2, sceneId:3, icon:'🪷', desc:'西湖莲藕', isCanCompose:true },
  { itemId:'307', itemName:'龙井贡茶', itemLevel:3, itemType:2, sceneId:3, icon:'🏆', desc:'进贡皇家的顶级龙井', isCanCompose:true },
  { itemId:'308', itemName:'苏锦绣屏', itemLevel:3, itemType:2, sceneId:3, icon:'🖼️', desc:'双面苏绣屏风', isCanCompose:true },
];

export const COMPOSE_RECIPES: ComposeRecipe[] = [
  { composeId:1, sourceItem1:'101', sourceItem2:'101', targetItem:'104', costEnergy:1, sceneId:1 },
  { composeId:2, sourceItem1:'102', sourceItem2:'102', targetItem:'105', costEnergy:1, sceneId:1 },
  { composeId:3, sourceItem1:'103', sourceItem2:'103', targetItem:'106', costEnergy:1, sceneId:1 },
  { composeId:4, sourceItem1:'104', sourceItem2:'104', targetItem:'107', costEnergy:1, sceneId:1 },
  { composeId:5, sourceItem1:'105', sourceItem2:'105', targetItem:'108', costEnergy:1, sceneId:1 },
  { composeId:10, sourceItem1:'201', sourceItem2:'201', targetItem:'204', costEnergy:1, sceneId:2 },
  { composeId:11, sourceItem1:'202', sourceItem2:'202', targetItem:'205', costEnergy:1, sceneId:2 },
  { composeId:12, sourceItem1:'203', sourceItem2:'203', targetItem:'206', costEnergy:1, sceneId:2 },
  { composeId:13, sourceItem1:'204', sourceItem2:'204', targetItem:'207', costEnergy:1, sceneId:2 },
  { composeId:14, sourceItem1:'205', sourceItem2:'205', targetItem:'208', costEnergy:1, sceneId:2 },
  { composeId:20, sourceItem1:'301', sourceItem2:'301', targetItem:'304', costEnergy:1, sceneId:3 },
  { composeId:21, sourceItem1:'302', sourceItem2:'302', targetItem:'305', costEnergy:1, sceneId:3 },
  { composeId:22, sourceItem1:'303', sourceItem2:'303', targetItem:'306', costEnergy:1, sceneId:3 },
  { composeId:23, sourceItem1:'304', sourceItem2:'304', targetItem:'307', costEnergy:1, sceneId:3 },
  { composeId:24, sourceItem1:'305', sourceItem2:'305', targetItem:'308', costEnergy:1, sceneId:3 },
];

export const SCENES: GameScene[] = [
  { sceneId:1, sceneName:'江南古镇', spotId:0, spotName:'绣坊总基地', unlockPrestige:0, repairStage:2, repairCostCoin:[300,500], repairCostItem:'104:2,105:2', repairReward:'111:1,109:1', sceneRes:'/assets/scenes/scene_jiangnan.jpg' },
  { sceneId:2, sceneName:'泰山', spotId:1, spotName:'岱宗坊', unlockPrestige:100, repairStage:3, repairCostCoin:[500,700,1000], repairCostItem:'204:3,205:3,207:2', repairReward:'211:1,209:1', sceneRes:'/assets/scenes/scene_taishan.jpg' },
  { sceneId:2, sceneName:'泰山', spotId:2, spotName:'岱庙', unlockPrestige:100, repairStage:3, repairCostCoin:[500,700,1000], repairCostItem:'204:3,205:3,207:2', repairReward:'211:1,210:1', sceneRes:'/assets/scenes/scene_taishan.jpg' },
  { sceneId:3, sceneName:'西湖', spotId:1, spotName:'断桥', unlockPrestige:300, repairStage:3, repairCostCoin:[500,800,1200], repairCostItem:'304:3,305:3,307:2', repairReward:'311:1,309:1', sceneRes:'/assets/scenes/scene_xihu.jpg' },
  { sceneId:3, sceneName:'西湖', spotId:2, spotName:'苏堤', unlockPrestige:300, repairStage:3, repairCostCoin:[500,800,1200], repairCostItem:'304:3,306:3,308:2', repairReward:'311:1,310:1', sceneRes:'/assets/scenes/scene_xihu.jpg' },
  { sceneId:4, sceneName:'长安古城', spotId:1, spotName:'大雁塔', unlockPrestige:600, repairStage:3, repairCostCoin:[800,1000,1500], repairCostItem:'404:2,405:3,407:2', repairReward:'411:1,409:1', sceneRes:'/assets/scenes/scene_changan.jpg' },
  { sceneId:5, sceneName:'万里长城', spotId:1, spotName:'山海关', unlockPrestige:1000, repairStage:3, repairCostCoin:[800,1200,1500], repairCostItem:'504:2,505:3,507:2', repairReward:'511:1,509:1', sceneRes:'/assets/scenes/scene_greatwall.jpg' },
  { sceneId:6, sceneName:'黄山', spotId:1, spotName:'迎客松', unlockPrestige:1500, repairStage:3, repairCostCoin:[800,1200,1500], repairCostItem:'604:2,605:3,607:2', repairReward:'611:1,609:1', sceneRes:'/assets/scenes/scene_huangshan.jpg' },
  { sceneId:7, sceneName:'青城山', spotId:1, spotName:'天师洞', unlockPrestige:1500, repairStage:3, repairCostCoin:[1000,1500,2000], repairCostItem:'704:2,705:3,707:2', repairReward:'711:1,709:1', sceneRes:'/assets/scenes/scene_qingcheng.jpg' },
];

export const ORDERS: GameOrder[] = [
  { orderId:1001, orderType:1, sceneId:1, spotId:1, needItem:'107:2', rewardCoin:2000, rewardSilver:0, rewardPrestige:50, isUnlock:true },
  { orderId:1002, orderType:1, sceneId:1, spotId:2, needItem:'104:3,105:3', rewardCoin:3000, rewardSilver:0, rewardPrestige:80, isUnlock:true },
  { orderId:2001, orderType:2, sceneId:1, spotId:1, needItem:'101:5,102:5', rewardCoin:300, rewardSilver:0, rewardPrestige:10, isUnlock:false },
  { orderId:2002, orderType:2, sceneId:1, spotId:2, needItem:'103:3,104:2', rewardCoin:500, rewardSilver:0, rewardPrestige:15, isUnlock:false },
  { orderId:3001, orderType:3, sceneId:2, spotId:1, needItem:'207:2,208:1', rewardCoin:3000, rewardSilver:30, rewardPrestige:50, isUnlock:false },
];

export const NPCS: NPC[] = [
  { npcId:1, npcName:'孔伋', historyName:'子思', sceneId:2, spotId:2, npcRes:'npc_kongji.png', dialogue:'儒家之道，在于传承文脉。姑娘此来泰山，可是为寻访封禅之礼？', orderId:'3001,3002' },
  { npcId:3, npcName:'苏轼', historyName:'苏东坡', sceneId:3, spotId:2, npcRes:'npc_sushi.png', dialogue:'欲把西湖比西子，淡妆浓抹总相宜。姑娘可懂这西湖之美？', orderId:'3003,3004' },
  { npcId:5, npcName:'李白', historyName:'诗仙', sceneId:4, spotId:3, npcRes:'npc_libai.png', dialogue:'黄河之水天上来，奔流到海不复回。姑娘可愿同饮一杯？', orderId:'3005,3006' },
  { npcId:8, npcName:'戚继光', historyName:'戚将军', sceneId:5, spotId:1, npcRes:'npc_qijiguang.png', dialogue:'保家卫国，乃男儿本分。长城之上，不容外敌踏足！', orderId:'3007' },
  { npcId:9, npcName:'张道陵', historyName:'张天师', sceneId:7, spotId:1, npcRes:'npc_zhangdaoling.png', dialogue:'道法自然，心静则明。姑娘可愿入我道门，修身养性？', orderId:'3009' },
];

export const SCENE_BG: Record<number, string> = {
  1: '/assets/scenes/scene_jiangnan.jpg',
  2: '/assets/scenes/scene_taishan.jpg',
  3: '/assets/scenes/scene_xihu.jpg',
  4: '/assets/scenes/scene_changan.jpg',
  5: '/assets/scenes/scene_greatwall.jpg',
  6: '/assets/scenes/scene_huangshan.jpg',
  7: '/assets/scenes/scene_qingcheng.jpg',
};

export const PRESTIGE_LEVELS = [0, 100, 300, 600, 1000, 1500];

export function getItemsByScene(sceneId: number): GameItem[] {
  return ITEMS.filter(i => i.sceneId === sceneId && i.itemLevel === 1);
}

export function findComposeRecipe(item1: string, item2: string, sceneId: number): ComposeRecipe | undefined {
  return COMPOSE_RECIPES.find(r => 
    r.sceneId === sceneId && 
    ((r.sourceItem1 === item1 && r.sourceItem2 === item2) ||
     (r.sourceItem1 === item2 && r.sourceItem2 === item1))
  );
}

export function getSceneName(sceneId: number): string {
  const names: Record<number, string> = {
    1: '江南古镇', 2: '泰山', 3: '西湖', 4: '长安古城',
    5: '万里长城', 6: '黄山', 7: '青城山',
  };
  return names[sceneId] || '未知';
}

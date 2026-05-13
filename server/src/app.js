/**
 * 锦绣古镇：汉服织造录 - 后端API服务
 * Node.js + Express
 */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ===== 内存数据库（模拟MySQL）=====
const DB = {
  users: new Map(),
  items: new Map(),
  orders: new Map(),
  scenes: new Map(),
  collections: new Map(),
};

// 游戏配置数据
const GAME_CONFIG = {
  energy: { max: 50, recoverTime: 180 },
  prestigeLevels: [0, 100, 300, 600, 1000, 1500],
};

// 中间件：签名验证
const verifySign = (req, res, next) => {
  const { token, sign, timestamp } = req.headers;
  if (!token || !timestamp) {
    return res.status(400).json({ code: 1001, msg: '参数错误', data: {} });
  }
  // 简化验证逻辑
  next();
};

// ===== API 1: 用户登录 =====
app.post('/api/user/login', (req, res) => {
  const { code, openId } = req.body;
  const userId = 'U' + Date.now();
  const token = crypto.randomBytes(32).toString('hex');
  
  const userData = {
    userId,
    token,
    userName: '沈绾',
    level: 1,
    energy: 50,
    coin: 1000,
    silver: 100,
    prestige: 0,
    maxEnergy: 50,
    unlockScene: [1],
    curSceneId: 1,
    createTime: new Date().toISOString(),
  };
  
  DB.users.set(token, userData);
  
  // 初始化背包
  if (!DB.items.has(userId)) {
    DB.items.set(userId, {});
  }
  
  res.json({ code: 0, msg: '登录成功', data: { userId, token, userName: '沈绾', level: 1, createTime: userData.createTime } });
});

// ===== API 2: 获取用户基础数据 =====
app.post('/api/user/getBaseData', verifySign, (req, res) => {
  const token = req.headers.token;
  const user = DB.users.get(token);
  if (!user) return res.json({ code: 1002, msg: 'token无效', data: {} });
  
  res.json({
    code: 0,
    msg: '获取成功',
    data: {
      energy: user.energy,
      coin: user.coin,
      silver: user.silver,
      prestige: user.prestige,
      unlockScene: user.unlockScene,
      curSceneId: user.curSceneId,
    }
  });
});

// ===== API 3: 合成道具 =====
app.post('/api/item/compose', verifySign, (req, res) => {
  const { itemId1, itemId2, sceneId } = req.body;
  const token = req.headers.token;
  const user = DB.users.get(token);
  if (!user) return res.json({ code: 1002, msg: 'token无效', data: {} });
  
  if (user.energy < 1) return res.json({ code: 1006, msg: '心力不足', data: {} });
  
  user.energy -= 1;
  // 合成奖励少量铜钱
  user.coin += 50;
  
  res.json({
    code: 0,
    msg: '合成成功',
    data: {
      newItemId: itemId1.replace(/\d$/, c => parseInt(c) + 1),
      energy: user.energy,
      coin: user.coin,
    }
  });
});

// ===== API 4: 订单交付 =====
app.post('/api/order/deliver', verifySign, (req, res) => {
  const { orderId, itemIds } = req.body;
  const token = req.headers.token;
  const user = DB.users.get(token);
  if (!user) return res.json({ code: 1002, msg: 'token无效', data: {} });
  
  // 计算奖励（根据订单ID）
  const orderType = Math.floor(orderId / 1000);
  let coin = 500, silver = 0, prestige = 20;
  
  if (orderType === 1) { coin = 3000; silver = 10; prestige = 50; }
  else if (orderType === 2) { coin = 500; silver = 0; prestige = 15; }
  else if (orderType === 3) { coin = 3000; silver = 30; prestige = 50; }
  
  user.coin += coin;
  user.silver += silver;
  user.prestige += prestige;
  
  // 检查场景解锁
  const isUnlockScene = user.prestige >= 100 && !user.unlockScene.includes(2) ? 1 : 0;
  if (isUnlockScene) user.unlockScene.push(2);
  
  res.json({
    code: 0,
    msg: '交付成功',
    data: { coin: user.coin, silver: user.silver, prestige: user.prestige, isUnlockScene }
  });
});

// ===== API 5: 场景修缮 =====
app.post('/api/scene/repair', verifySign, (req, res) => {
  const { sceneId, spotId, stage } = req.body;
  const token = req.headers.token;
  const user = DB.users.get(token);
  if (!user) return res.json({ code: 1002, msg: 'token无效', data: {} });
  
  const costCoin = 500;
  if (user.coin < costCoin) return res.json({ code: 1006, msg: '铜钱不足', data: {} });
  
  user.coin -= costCoin;
  const repairRate = Math.min(100, (stage / 3) * 100);
  const isFinish = stage >= 3 ? 1 : 0;
  
  if (isFinish) {
    user.prestige += 30;
  }
  
  res.json({
    code: 0,
    msg: '修缮成功',
    data: { repairRate, coin: user.coin, isFinish }
  });
});

// ===== API 6: 心力领取 =====
app.post('/api/user/getEnergy', verifySign, (req, res) => {
  const { type } = req.body;
  const token = req.headers.token;
  const user = DB.users.get(token);
  if (!user) return res.json({ code: 1002, msg: 'token无效', data: {} });
  
  const add = type === 1 ? 20 : 30;
  user.energy = Math.min(user.maxEnergy, user.energy + add);
  
  res.json({ code: 0, msg: '领取成功', data: { energy: user.energy } });
});

// ===== API 7: 获取图鉴数据 =====
app.post('/api/collection/getCollectionData', verifySign, (req, res) => {
  const token = req.headers.token;
  const user = DB.users.get(token);
  if (!user) return res.json({ code: 1002, msg: 'token无效', data: {} });
  
  const collection = DB.collections.get(user.userId) || { scene: [], item: [], suit: [], npc: [] };
  res.json({
    code: 0,
    msg: '获取成功',
    data: {
      sceneCollection: collection.scene || [],
      itemCollection: collection.item || [],
      suitCollection: collection.suit || [],
      npcCollection: collection.npc || [],
    }
  });
});

// ===== API 8: 广告激励回调 =====
app.post('/api/adv/callback', verifySign, (req, res) => {
  const { advId, advType, orderId } = req.body;
  const token = req.headers.token;
  const user = DB.users.get(token);
  if (!user) return res.json({ code: 1002, msg: 'token无效', data: {} });
  
  res.json({ code: 0, msg: '奖励发放成功', data: {} });
});

// ===== 配置表接口 =====
app.get('/api/config/:name', (req, res) => {
  const configName = req.params.name;
  try {
    const config = require(`../../config/json/${configName}.json`);
    res.json({ code: 0, msg: 'success', data: config });
  } catch(e) {
    res.json({ code: 1001, msg: '配置不存在', data: {} });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎮 锦绣古镇后端服务运行在端口 ${PORT}`);
});

module.exports = app;

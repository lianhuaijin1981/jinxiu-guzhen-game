import { ITEMS, getComposeTarget, createBuildings, generateOrders, createDailyTasks, SIGN_IN_REWARDS, INITIAL_PLAYER } from './config';
import type { Building, Order, DailyTask, GameItem, SignInReward } from './config';

export interface Cell {
  row: number;
  col: number;
  item: GameItem | null;
}

export interface OfflineReward {
  coin: number;
  pottery: number;
  umbrella: number;
  fan: number;
  embroidery: number;
  jade: number;
  material1: number;
  material2: number;
  hours: number;
}

export class GameEngine {
  board: (GameItem | null)[][];
  rows = 6;
  cols = 5;
  
  // 资源
  coin: number;
  material: number;
  townLevel: number;
  
  // 统计
  composeCount: number;
  orderCount: number;
  buildCount: number;
  
  // 系统数据
  buildings: Building[];
  orders: Order[];
  dailyTasks: DailyTask[];
  signInDay: number;
  signInToday: boolean;
  
  // 状态
  currentStreet: string;
  selectedCell: { row: number; col: number } | null = null;
  lastOfflineTime: number;
  showGuide: boolean;
  guideStep: number;
  
  // 离线收益
  offlineReward: OfflineReward | null = null;
  
  // 事件回调
  onUpdate: (() => void) | null = null;
  onComposeEffect: ((row: number, col: number, level: number) => void) | null = null;
  onOfflineReward: ((reward: OfflineReward) => void) | null = null;
  
  // 生成器
  private genTimer: ReturnType<typeof setInterval> | null = null;
  private orderTimer: ReturnType<typeof setInterval> | null = null;
  
  constructor() {
    this.coin = INITIAL_PLAYER.coin;
    this.material = INITIAL_PLAYER.material;
    this.townLevel = INITIAL_PLAYER.townLevel;
    this.composeCount = 0;
    this.orderCount = 0;
    this.buildCount = 0;
    this.currentStreet = 's1';
    this.lastOfflineTime = Date.now();
    this.showGuide = true;
    this.guideStep = 0;
    this.signInDay = 0;
    this.signInToday = false;
    this.offlineReward = null;
    
    this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
    this.buildings = createBuildings();
    this.orders = generateOrders();
    this.dailyTasks = createDailyTasks();
    
    // 初始化：民居默认解锁（新手引导第一步）
    const residence = this.buildings.find(b => b.id === 'residence')!;
    residence.status = 'unlocked';
    residence.level = 1;
    residence.visualLevel = 1;
    
    this.initBoard();
    this.startTimers();
    
    // 计算离线收益
    this.calcOfflineReward();
  }

  // ===== 棋盘初始化 =====
  initBoard() {
    // 填充基础陶罐
    const pottery = ITEMS['pottery'];
    let count = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (Math.random() > 0.25) {
          this.board[r][c] = { ...pottery };
          count++;
        }
      }
    }
    // 确保至少有5个道具（新手引导需要）
    while (count < 5) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      if (!this.board[r][c]) {
        this.board[r][c] = { ...pottery };
        count++;
      }
    }
  }

  // ===== 定时器 =====
  startTimers() {
    // 生成器：每30秒自动刷新基础道具
    this.genTimer = setInterval(() => {
      this.autoGenerateItem();
    }, 30000);
    
    // 订单刷新：每60秒检查
    this.orderTimer = setInterval(() => {
      this.refreshOrders();
    }, 60000);
  }

  stopTimers() {
    if (this.genTimer) clearInterval(this.genTimer);
    if (this.orderTimer) clearInterval(this.orderTimer);
  }

  // ===== 自动生成道具 =====
  autoGenerateItem() {
    // 根据已解锁建筑决定产出
    const pottery = ITEMS['pottery'];
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.board[r][c]) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0) {
      const pos = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.board[pos.r][pos.c] = { ...pottery };
      this.onUpdate?.();
    }
  }

  // ===== 棋盘操作 =====
  selectCell(row: number, col: number): { success: boolean; targetRow?: number; targetCol?: number; newLevel?: number } {
    const cell = this.board[row][col];
    if (!cell) {
      this.selectedCell = null;
      return { success: false };
    }

    if (this.selectedCell) {
      const { row: sr, col: sc } = this.selectedCell;
      // 取消选中
      if (sr === row && sc === col) {
        this.selectedCell = null;
        return { success: false };
      }
      const source = this.board[sr][sc];
      const target = this.board[row][col];
      
      if (source && target && source.itemId === target.itemId) {
        // 执行合成
        const targetItemId = getComposeTarget(source.itemId);
        if (targetItemId && ITEMS[targetItemId]) {
          const newItem = { ...ITEMS[targetItemId] };
          this.board[row][col] = newItem;
          this.board[sr][sc] = null;
          this.selectedCell = null;
          this.composeCount++;
          
          // 合成奖励
          this.coin += 50;
          
          // 更新任务
          const task = this.dailyTasks.find(t => t.id === 'task_compose');
          if (task && !task.completed) {
            task.current++;
            if (task.current >= task.target) {
              task.completed = true;
              this.coin += task.rewardCoin;
              this.material += task.rewardMaterial;
            }
          }
          
          this.onUpdate?.();
          this.onComposeEffect?.(row, col, newItem.level);
          return { success: true, targetRow: row, targetCol: col, newLevel: newItem.level };
        }
      }
      
      // 不同类，切换选中
      this.selectedCell = { row, col };
      return { success: false };
    } else {
      this.selectedCell = { row, col };
      return { success: false };
    }
  }

  // ===== 交付订单 =====
  deliverOrder(orderId: string): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (!order || order.status !== 'active') return false;
    
    // 检查道具数量
    const itemCount = this.countItemOnBoard(order.itemId);
    if (itemCount < order.itemCount) return false;
    
    // 扣除道具
    let need = order.itemCount;
    for (let r = 0; r < this.rows && need > 0; r++) {
      for (let c = 0; c < this.cols && need > 0; c++) {
        if (this.board[r][c]?.itemId === order.itemId) {
          this.board[r][c] = null;
          need--;
        }
      }
    }
    
    // 发放奖励
    this.coin += order.rewardCoin;
    this.material += order.rewardMaterial;
    order.status = 'completed';
    this.orderCount++;
    
    // 更新任务
    const task = this.dailyTasks.find(t => t.id === 'task_order');
    if (task && !task.completed) {
      task.current++;
      if (task.current >= task.target) {
        task.completed = true;
        this.coin += task.rewardCoin;
        this.material += task.rewardMaterial;
      }
    }
    
    // 刷新一个完成的新订单
    setTimeout(() => {
      const newOrder = this.generateSingleOrder();
      const idx = this.orders.findIndex(o => o.id === orderId);
      if (idx >= 0) this.orders[idx] = newOrder;
      this.onUpdate?.();
    }, 2000);
    
    this.onUpdate?.();
    return true;
  }

  countItemOnBoard(itemId: string): number {
    let count = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c]?.itemId === itemId) count++;
      }
    }
    return count;
  }

  generateSingleOrder(): Order {
    const templates = [
      { itemId: 'pottery', count: 3, coin: 200, mat: 2 },
      { itemId: 'pottery', count: 5, coin: 300, mat: 2 },
      { itemId: 'umbrella', count: 2, coin: 500, mat: 3 },
      { itemId: 'umbrella', count: 3, coin: 700, mat: 3 },
      { itemId: 'fan', count: 1, coin: 1000, mat: 3 },
      { itemId: 'embroidery', count: 1, coin: 1000, mat: 3 },
      { itemId: 'jade', count: 1, coin: 2500, mat: 1 },
    ];
    const t = templates[Math.floor(Math.random() * templates.length)];
    return {
      id: `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      itemId: t.itemId,
      itemCount: t.count,
      rewardCoin: t.coin,
      rewardMaterial: t.mat,
      timeLeft: 1800,
      status: 'active',
    };
  }

  refreshOrders() {
    // 刷新已完成的订单
    this.orders = this.orders.map(o => {
      if (o.status === 'completed') return this.generateSingleOrder();
      return o;
    });
    this.onUpdate?.();
  }

  // ===== 建筑系统 =====
  unlockBuilding(buildingId: string): boolean {
    const building = this.buildings.find(b => b.id === buildingId);
    if (!building || building.status !== 'locked' || !building.unlockCost) return false;
    
    if (this.coin < building.unlockCost.coin || this.material < building.unlockCost.material) {
      return false;
    }
    
    this.coin -= building.unlockCost.coin;
    this.material -= building.unlockCost.material;
    building.status = 'unlocked';
    building.level = 1;
    building.visualLevel = 1;
    this.buildCount++;
    
    // 更新建筑离线收益（1级）
    this.updateBuildingReward(building);
    
    // 更新任务
    const task = this.dailyTasks.find(t => t.id === 'task_build');
    if (task && !task.completed) {
      task.current++;
      if (task.current >= task.target) {
        task.completed = true;
        this.coin += task.rewardCoin;
        this.material += task.rewardMaterial;
      }
    }
    
    // 检查小镇升级
    this.checkTownLevel();
    
    this.onUpdate?.();
    return true;
  }

  upgradeBuilding(buildingId: string): boolean {
    const building = this.buildings.find(b => b.id === buildingId);
    if (!building || building.status !== 'unlocked') return false;
    if (building.level >= building.maxLevel) return false;
    
    const cost = this.getUpgradeCost(building);
    if (this.coin < cost.coin || this.material < cost.material) return false;
    
    this.coin -= cost.coin;
    this.material -= cost.material;
    building.level += 2; // 1→3→5
    building.visualLevel = building.level;
    
    // 更新离线收益
    this.updateBuildingReward(building);
    this.checkTownLevel();
    this.onUpdate?.();
    return true;
  }

  getUpgradeCost(building: Building): { coin: number; material: number } {
    const costs: Record<number, { coin: number; material: number }> = {
      1: { coin: building.upgradeCost?.coin || 2000, material: building.upgradeCost?.material || 8 },
      3: { coin: (building.upgradeCost?.coin || 2000) * 2 + 1000, material: (building.upgradeCost?.material || 8) + 3 },
    };
    return costs[building.level] || costs[1];
  }

  updateBuildingReward(building: Building) {
    const level = building.level;
    const multipliers: Record<number, number> = { 1: 1, 3: 1.8, 5: 3 };
    const m = multipliers[level] || 1;
    
    switch (building.id) {
      case 'residence':
        building.offlineReward = { coin: Math.floor(80 * m), items: [{ id: 'pottery', count: level >= 5 ? 3 : level >= 3 ? 2 : 1 }] };
        break;
      case 'shop':
        building.offlineReward = { coin: Math.floor(100 * m), items: [{ id: 'umbrella', count: level >= 5 ? 3 : level >= 3 ? 2 : 1 }] };
        break;
      case 'teahouse':
        building.offlineReward = { coin: Math.floor(120 * m), items: [{ id: 'mat1', count: level >= 5 ? 1 : 0 }, { id: level >= 5 ? 'mat2' : 'mat1', count: level >= 5 ? 2 : level >= 3 ? 2 : 1 }] };
        break;
      case 'station':
        building.specialEffect = `订单刷新缩短至${level >= 5 ? 5 : level >= 3 ? 10 : 15}分钟`;
        break;
      case 'study':
        building.offlineReward = { coin: Math.floor(180 * m), items: [{ id: 'fan', count: level >= 5 ? 3 : level >= 3 ? 2 : 1 }] };
        break;
      case 'embroideryWorkshop':
        building.offlineReward = { coin: Math.floor(200 * m), items: [{ id: 'embroidery', count: level >= 5 ? 3 : level >= 3 ? 2 : 1 }] };
        break;
      case 'artStudio':
        building.specialEffect = `图鉴奖励提升${level >= 5 ? 30 : level >= 3 ? 20 : 10}%`;
        building.offlineReward = { coin: 0, items: [{ id: 'mat2', count: level >= 5 ? 3 : level >= 3 ? 2 : 1 }, ...(level >= 5 ? [{ id: 'mat3', count: 1 }] : [])] };
        break;
      case 'chessClub':
        building.specialEffect = `每日任务奖励提升${level >= 5 ? 30 : level >= 3 ? 20 : 10}%`;
        break;
    }
  }

  checkTownLevel() {
    const unlocked = this.buildings.filter(b => b.status === 'unlocked');
    if (unlocked.length >= 4 && this.townLevel < 2) this.townLevel = 2;
    if (unlocked.length >= 6 && this.townLevel < 3) this.townLevel = 3;
    if (unlocked.length >= 8 && this.townLevel < 4) this.townLevel = 4;
    
    // 解锁风雅巷（市井街全3级）
    const s1Buildings = this.buildings.filter(b => b.streetId === 's1');
    const s1All3 = s1Buildings.every(b => b.level >= 3);
    if (s1All3) {
      this.buildings.filter(b => b.streetId === 's2').forEach(b => {
        if (b.status === 'locked') b.status = 'unlocked';
      });
    }
  }

  // ===== 离线收益计算 =====
  calcOfflineReward(): OfflineReward | null {
    const now = Date.now();
    const diff = now - this.lastOfflineTime;
    const hours = Math.min(8, diff / 3600000); // 最多8小时
    
    if (hours < 0.1) return null; // 离线少于6分钟不算
    
    const reward: OfflineReward = {
      coin: 0, pottery: 0, umbrella: 0, fan: 0, embroidery: 0, jade: 0,
      material1: 0, material2: 0, hours: Math.floor(hours * 10) / 10,
    };
    
    this.buildings.filter(b => b.status === 'unlocked').forEach(b => {
      const r = b.offlineReward;
      reward.coin += Math.floor(r.coin * hours);
      r.items.forEach(item => {
        switch (item.id) {
          case 'pottery': reward.pottery += item.count * Math.floor(hours); break;
          case 'umbrella': reward.umbrella += item.count * Math.floor(hours); break;
          case 'fan': reward.fan += item.count * Math.floor(hours); break;
          case 'embroidery': reward.embroidery += item.count * Math.floor(hours); break;
          case 'jade': reward.jade += item.count * Math.floor(hours); break;
          case 'mat1': reward.material1 += item.count * Math.floor(hours); break;
          case 'mat2': reward.material2 += item.count * Math.floor(hours); break;
        }
      });
    });
    
    this.offlineReward = reward;
    return reward;
  }

  claimOfflineReward(double = false) {
    if (!this.offlineReward) return;
    const m = double ? 2 : 1;
    this.coin += this.offlineReward.coin * m;
    this.material += (this.offlineReward.material1 + this.offlineReward.material2) * m;
    
    // 道具放入棋盘
    const itemsToPlace = [
      { id: 'pottery', count: this.offlineReward.pottery },
      { id: 'umbrella', count: this.offlineReward.umbrella },
      { id: 'fan', count: this.offlineReward.fan },
      { id: 'embroidery', count: this.offlineReward.embroidery },
      { id: 'jade', count: this.offlineReward.jade },
    ];
    
    for (const item of itemsToPlace) {
      for (let i = 0; i < item.count * m; i++) {
        this.placeItemRandom(item.id);
      }
    }
    
    this.offlineReward = null;
    this.lastOfflineTime = Date.now();
    this.onUpdate?.();
  }

  placeItemRandom(itemId: string) {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.board[r][c]) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0 && ITEMS[itemId]) {
      const pos = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.board[pos.r][pos.c] = { ...ITEMS[itemId] };
    }
  }

  // ===== 签到系统 =====
  signIn(): SignInReward | null {
    if (this.signInToday) return null;
    this.signInToday = true;
    this.signInDay = (this.signInDay + 1) % 7;
    if (this.signInDay === 0) this.signInDay = 7;
    
    const reward = SIGN_IN_REWARDS[this.signInDay - 1];
    this.coin += reward.coin;
    this.material += reward.material;
    this.onUpdate?.();
    return reward;
  }

  // ===== 新手引导 =====
  advanceGuide() {
    this.guideStep++;
    if (this.guideStep > 4) {
      this.showGuide = false;
    }
    this.onUpdate?.();
  }

  // ===== 清理 =====
  destroy() {
    this.stopTimers();
  }
}

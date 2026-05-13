import { ITEMS, SCENE_BG, getItemsByScene, findComposeRecipe, PRESTIGE_LEVELS } from './config';
import type { GameItem, UserData } from './types';

export interface Cell {
  row: number;
  col: number;
  item: GameItem | null;
}

export class GameEngine {
  board: (GameItem | null)[][];
  rows = 6;
  cols = 5;
  user: UserData;
  currentScene: number;
  selectedCell: { row: number; col: number } | null = null;
  onUpdate: (() => void) | null = null;
  generators: { lastGen: number; cooldown: number }[] = [];
  
  constructor() {
    this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
    this.user = {
      energy: 50, maxEnergy: 50, coin: 1000, silver: 100,
      prestige: 0, unlockScene: [1], curSceneId: 1,
    };
    this.currentScene = 1;
    this.initBoard();
  }

  initBoard() {
    const items = getItemsByScene(this.currentScene);
    // 填充基础素材
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (Math.random() > 0.3) {
          this.board[r][c] = items[Math.floor(Math.random() * items.length)];
        }
      }
    }
    this.generators = [
      { lastGen: Date.now(), cooldown: 5000 },
      { lastGen: Date.now(), cooldown: 8000 },
    ];
  }

  getCell(row: number, col: number): GameItem | null {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.board[row][col];
  }

  selectCell(row: number, col: number): boolean {
    const cell = this.board[row][col];
    if (!cell) {
      this.selectedCell = null;
      return false;
    }
    // 如果已选中，尝试合成
    if (this.selectedCell) {
      const { row: sr, col: sc } = this.selectedCell;
      if (sr === row && sc === col) {
        this.selectedCell = null;
        return false;
      }
      const source = this.board[sr][sc];
      const target = this.board[row][col];
      if (source && target && source.itemId === target.itemId) {
        // 执行合成
        const recipe = findComposeRecipe(source.itemId, target.itemId, this.currentScene);
        if (recipe && this.user.energy >= recipe.costEnergy) {
          this.user.energy -= recipe.costEnergy;
          this.user.coin += 50;
          const newItem = ITEMS.find(i => i.itemId === recipe.targetItem);
          if (newItem) {
            this.board[row][col] = { ...newItem };
            this.board[sr][sc] = null;
            this.selectedCell = null;
            this.checkUnlock();
            this.onUpdate?.();
            return true;
          }
        }
      }
      this.selectedCell = { row, col };
      return false;
    } else {
      this.selectedCell = { row, col };
      return false;
    }
  }

  generateItem() {
    const items = getItemsByScene(this.currentScene);
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.board[r][c]) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0) {
      const pos = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.board[pos.r][pos.c] = items[Math.floor(Math.random() * items.length)];
    }
  }

  deliverOrder(_orderId: number) {
    this.user.coin += 500;
    this.user.prestige += 20;
    this.checkUnlock();
    this.onUpdate?.();
  }

  repairScene(_sceneId: number, stage: number) {
    const costs = [300, 500, 800];
    const cost = costs[stage - 1] || 300;
    if (this.user.coin >= cost) {
      this.user.coin -= cost;
      this.user.prestige += 30;
      this.checkUnlock();
      this.onUpdate?.();
      return true;
    }
    return false;
  }

  getEnergy(type: number) {
    const add = type === 1 ? 20 : 30;
    this.user.energy = Math.min(this.user.maxEnergy, this.user.energy + add);
    this.onUpdate?.();
  }

  checkUnlock() {
    for (let i = 1; i < PRESTIGE_LEVELS.length; i++) {
      if (this.user.prestige >= PRESTIGE_LEVELS[i] && !this.user.unlockScene.includes(i + 1)) {
        this.user.unlockScene.push(i + 1);
      }
    }
  }

  switchScene(sceneId: number) {
    if (this.user.unlockScene.includes(sceneId)) {
      this.currentScene = sceneId;
      this.user.curSceneId = sceneId;
      this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
      this.initBoard();
      this.selectedCell = null;
      this.onUpdate?.();
    }
  }

  getSceneBg(): string {
    return SCENE_BG[this.currentScene] || SCENE_BG[1];
  }

  recoverEnergy() {
    if (this.user.energy < this.user.maxEnergy) {
      this.user.energy = Math.min(this.user.maxEnergy, this.user.energy + 1);
      this.onUpdate?.();
    }
  }
}

import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

// ===== 游戏数据 =====
const SCENES = [
  { id: 1, name: '江南古镇', color: '#7ecfa8', desc: '白墙黛瓦，小桥流水，丝绸之源', unlock: 0, bg: '/assets/scenes/scene_jiangnan.jpg' },
  { id: 2, name: '泰山', color: '#c9a96e', desc: '五岳独尊，封禅之地', unlock: 100, bg: '/assets/scenes/scene_taishan.jpg' },
  { id: 3, name: '西湖', color: '#6a9eb8', desc: '欲把西湖比西子', unlock: 300, bg: '/assets/scenes/scene_xihu.jpg' },
  { id: 4, name: '长安', color: '#d4574a', desc: '大唐盛世，万国来朝', unlock: 600, bg: '/assets/scenes/scene_changan.jpg' },
  { id: 5, name: '长城', color: '#8b7355', desc: '万里雄关，气吞山河', unlock: 1000, bg: '/assets/scenes/scene_greatwall.jpg' },
  { id: 6, name: '黄山', color: '#4a6741', desc: '奇松云海，天下无山', unlock: 1500, bg: '/assets/scenes/scene_huangshan.jpg' },
  { id: 7, name: '青城山', color: '#5a7a6a', desc: '道法自然，幽甲天下', unlock: 1500, bg: '/assets/scenes/scene_qingcheng.jpg' },
];

const ITEMS: Record<string, { name: string; emoji: string; level: number; color: string; desc: string }> = {
  pottery: { name: '陶罐', emoji: '🏺', level: 1, color: '#d4a574', desc: '最基础的容器' },
  umbrella: { name: '油纸伞', emoji: '☂️', level: 2, color: '#c9a96e', desc: '精良雨具' },
  fan: { name: '折扇', emoji: '🪭', level: 3, color: '#e8d5a3', desc: '珍稀雅物' },
  embroidery: { name: '刺绣', emoji: '🧵', level: 3, color: '#d47274', desc: '珍稀绣品' },
  jade: { name: '玉佩', emoji: '💎', level: 4, color: '#7ecfa8', desc: '传世珍宝' },
};

const COMPOSE_MAP: Record<string, string> = {
  pottery: 'umbrella',
  umbrella: 'fan',
};

const NPCS = [
  { id: 1, name: '苏轼', title: '诗仙', scene: 3, emoji: '📜', dialogue: '欲把西湖比西子，淡妆浓抹总相宜。姑娘可懂这西湖之美？' },
  { id: 2, name: '李白', title: '酒仙', scene: 4, emoji: '🍶', dialogue: '长安一片月，万户捣衣声。来，同饮此杯！' },
  { id: 3, name: '戚继光', title: '将军', scene: 5, emoji: '⚔️', dialogue: '保家卫国，乃男儿本分！姑娘也来守这万里长城？' },
];

const QUESTS = [
  { id: 1, title: '初入绣坊', desc: '完成第一次合成', target: 'compose', count: 1, reward: 'coin:200' },
  { id: 2, title: '丝绸初学者', desc: '合成3个油纸伞', target: 'compose_item', item: 'umbrella', count: 3, reward: 'coin:500' },
  { id: 3, title: '江南故人', desc: '收集江南图鉴残卷', target: 'scene_progress', scene: 1, count: 1, reward: 'prestige:50' },
  { id: 4, title: '交付首单', desc: '完成一次订单交付', target: 'order', count: 1, reward: 'coin:300' },
  { id: 5, title: '寻访泰山', desc: '声望达到100解锁泰山', target: 'prestige', count: 100, reward: 'unlock:2' },
  { id: 6, title: '珍稀之物', desc: '合成1个折扇', target: 'compose_item', item: 'fan', count: 1, reward: 'coin:1000' },
  { id: 7, title: '修缮古镇', desc: '完成一处景点修缮', target: 'repair', count: 1, reward: 'coin:500' },
  { id: 8, title: '传世珍宝', desc: '合成1个玉佩', target: 'compose_item', item: 'jade', count: 1, reward: 'coin:3000' },
];

const STORY_LINES = [
  { speaker: '旁白', text: '大周年间，江南织坊少女沈绾在整理祖母遗物时，发现了一卷残缺的古画...', emoji: '📜' },
  { speaker: '沈绾', text: '这是...《山河锦绣图》？传说中记载了华夏七大胜景的传世之作！', emoji: '👘' },
  { speaker: '旁白', text: '可惜图卷已碎成七片，散落在大好河山的各个角落。', emoji: '💨' },
  { speaker: '沈绾', text: '我要走遍这万里山河，收集所有残卷，复原这幅锦绣图！', emoji: '✨' },
  { speaker: '系统', text: '【主线任务】点击两个相同的陶罐进行合成，开始你的旅程吧！', emoji: '🎯' },
];

// ===== 游戏引擎 =====
class GameEngine {
  board: (string | null)[][] = Array(6).fill(null).map(() => Array(5).fill(null));
  coin = 500;
  prestige = 0;
  composeCount = 0;
  orderCount = 0;
  repairCount = 0;
  currentScene = 1;
  selected: { r: number; c: number } | null = null;
  sceneProgress: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  unlockedScenes = [1];
  questProgress: Record<string, number> = {};
  completedQuests: number[] = [];
  orders = this.genOrders();
  onUpdate?: () => void;

  constructor() {
    this.fillBoard();
  }

  fillBoard() {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 5; c++) {
        if (Math.random() > 0.3) this.board[r][c] = 'pottery';
      }
    }
  }

  genOrders() {
    return [
      { id: 1, item: 'pottery', need: 3, coin: 200, done: false },
      { id: 2, item: 'umbrella', need: 2, coin: 500, done: false },
      { id: 3, item: 'pottery', need: 5, coin: 350, done: false },
      { id: 4, item: 'fan', need: 1, coin: 1200, done: false },
    ];
  }

  clickCell(r: number, c: number): { type: string; data?: any } | null {
    const item = this.board[r][c];
    if (!item) { this.selected = null; return { type: 'deselect' }; }

    if (this.selected) {
      const { r: sr, c: sc } = this.selected;
      if (sr === r && sc === c) { this.selected = null; return { type: 'deselect' }; }
      const src = this.board[sr][sc];
      if (src && src === item && COMPOSE_MAP[src]) {
        const target = COMPOSE_MAP[src];
        this.board[r][c] = target;
        this.board[sr][sc] = null;
        this.selected = null;
        this.coin += 50;
        this.composeCount++;
        this.updateQuest('compose', 1);
        this.updateQuest('compose_item', 1, target);
        this.checkUnlockScene();
        this.onUpdate?.();
        return { type: 'compose', data: { r, c, item: target, level: ITEMS[target].level } };
      }
      this.selected = { r, c };
      return { type: 'select' };
    }
    this.selected = { r, c };
    return { type: 'select' };
  }

  countItem(id: string) {
    let n = 0;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) if (this.board[r][c] === id) n++;
    return n;
  }

  deliverOrder(oid: number) {
    const o = this.orders.find(x => x.id === oid);
    if (!o || o.done) return false;
    if (this.countItem(o.item) < o.need) return false;
    let rem = o.need;
    for (let r = 0; r < 6 && rem > 0; r++) {
      for (let c = 0; c < 5 && rem > 0; c++) {
        if (this.board[r][c] === o.item) { this.board[r][c] = null; rem--; }
      }
    }
    this.coin += o.coin;
    this.prestige += 10;
    o.done = true;
    this.orderCount++;
    this.updateQuest('order', 1);
    this.updateQuest('prestige', 10);
    this.checkUnlockScene();
    // refresh order
    setTimeout(() => {
      const templates = [
        { item: 'pottery', need: 3, coin: 200 },
        { item: 'umbrella', need: 2, coin: 500 },
        { item: 'fan', need: 1, coin: 1200 },
        { item: 'embroidery', need: 1, coin: 1200 },
        { item: 'jade', need: 1, coin: 3000 },
      ];
      const t = templates[Math.floor(Math.random() * templates.length)];
      const idx = this.orders.findIndex(x => x.id === oid);
      if (idx >= 0) this.orders[idx] = { id: Date.now(), ...t, done: false };
      this.onUpdate?.();
    }, 1000);
    this.onUpdate?.();
    return true;
  }

  repairScene(sid: number) {
    if (this.sceneProgress[sid] >= 3) return false;
    const costs = [200, 500, 1000];
    const cost = costs[this.sceneProgress[sid]];
    if (this.coin < cost) return false;
    this.coin -= cost;
    this.sceneProgress[sid]++;
    this.prestige += 30;
    this.repairCount++;
    this.updateQuest('repair', 1);
    this.updateQuest('prestige', 30);
    this.updateQuest('scene_progress', 1, null, sid);
    this.checkUnlockScene();
    this.onUpdate?.();
    return true;
  }

  checkUnlockScene() {
    for (const s of SCENES) {
      if (!this.unlockedScenes.includes(s.id) && this.prestige >= s.unlock) {
        this.unlockedScenes.push(s.id);
      }
    }
  }

  updateQuest(target: string, amount: number, item?: string | null, scene?: number) {
    for (const q of QUESTS) {
      if (this.completedQuests.includes(q.id)) continue;
      if (q.target === target) {
        if (target === 'compose_item' && q.item && q.item !== item) continue;
        if (target === 'scene_progress' && q.scene && q.scene !== scene) continue;
        const qid = String(q.id);
        this.questProgress[qid] = (this.questProgress[qid] || 0) + amount;
        if (this.questProgress[qid] >= q.count) {
          this.completedQuests.push(q.id);
          // give reward
          const [rtype, rval] = q.reward.split(':');
          if (rtype === 'coin') this.coin += parseInt(rval);
          if (rtype === 'prestige') this.prestige += parseInt(rval);
          if (rtype === 'unlock') this.unlockedScenes.push(parseInt(rval));
        }
      }
    }
  }

  get currentQuest() {
    return QUESTS.find(q => !this.completedQuests.includes(q.id));
  }

  get questProgressPercent() {
    const q = this.currentQuest;
    if (!q) return 100;
    const cur = this.questProgress[String(q.id)] || 0;
    return Math.min(100, Math.floor((cur / q.count) * 100));
  }
}

// ===== 主组件 =====
export default function App() {
  const [game] = useState(() => new GameEngine());
  const [, setTick] = useState(0);
  const [screen, setScreen] = useState<'title' | 'story' | 'game'>('title');
  const [storyIdx, setStoryIdx] = useState(0);
  const [tab, setTab] = useState<'board' | 'scene' | 'npc' | 'order' | 'scroll'>('board');
  const [composeFx, setComposeFx] = useState<{ r: number; c: number; level: number } | null>(null);
  const [toast, setToast] = useState('');
  const [showNpc, setShowNpc] = useState<number | null>(null);
  const [showQuestComplete, setShowQuestComplete] = useState<number | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    game.onUpdate = refresh;
    const interval = setInterval(() => {
      // auto generate pottery every 15s
      const empty: { r: number; c: number }[] = [];
      for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) if (!game.board[r][c]) empty.push({ r, c });
      if (empty.length > 0) {
        const pos = empty[Math.floor(Math.random() * empty.length)];
        game.board[pos.r][pos.c] = 'pottery';
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [game, refresh]);

  const showMsg = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  };

  const handleCell = (r: number, c: number) => {
    if (composeFx) return;
    const result = game.clickCell(r, c);
    if (result?.type === 'compose') {
      const { r: rr, c: cc, level } = result.data;
      setComposeFx({ r: rr, c: cc, level });
      setTimeout(() => setComposeFx(null), 900);
      const names: Record<number, string> = { 1: '陶罐', 2: '油纸伞', 3: '折扇', 4: '玉佩' };
      showMsg(`✨ 合成${names[level] || '成功'}！+50金币`);
      // check quest completion
      const justCompleted = QUESTS.find(q => game.completedQuests.includes(q.id) && !game.questProgress[String(q.id) + '_shown']);
      if (justCompleted) {
        game.questProgress[String(justCompleted.id) + '_shown'] = 1;
        setShowQuestComplete(justCompleted.id);
      }
    }
    refresh();
  };

  const handleOrder = (oid: number) => {
    if (game.deliverOrder(oid)) {
      showMsg(`📜 订单完成！+金币 +声望`);
    } else {
      showMsg('❌ 道具不足');
    }
    refresh();
  };

  const handleRepair = (sid: number) => {
    if (game.repairScene(sid)) {
      showMsg(`🔨 修缮完成！+30声望`);
    } else {
      showMsg('❌ 金币不足');
    }
    refresh();
  };

  const handleStart = () => setScreen('story');
  const handleStoryNext = () => {
    if (storyIdx < STORY_LINES.length - 1) setStoryIdx(storyIdx + 1);
    else setScreen('game');
  };
  const handleStorySkip = () => setScreen('game');

  // ===== 标题画面 =====
  if (screen === 'title') {
    return (
      <div className="title-screen">
        <div className="title-bg" style={{ backgroundImage: 'url(/assets/title_bg.jpg)' }} />
        <div className="title-overlay" />
        <div className="title-content">
          <h1 className="title-text">锦绣古镇</h1>
          <p className="title-sub">汉服时代</p>
          <p className="title-desc">收集山河残卷 · 复原锦绣图</p>
          <button className="title-btn" onClick={handleStart}>
            <span>✨ 开始旅程</span>
          </button>
          <p className="title-version">v3.0 大好河山版</p>
        </div>
      </div>
    );
  }

  // ===== 剧情画面 =====
  if (screen === 'story') {
    const line = STORY_LINES[storyIdx];
    return (
      <div className="story-screen">
        <div className="story-bg" style={{ backgroundImage: 'url(/assets/scenes/scene_jiangnan.jpg)' }} />
        <div className="story-overlay" />
        <div className="story-content">
          <div className="story-avatar">{line.emoji}</div>
          <div className="story-dialogue">
            <p className="story-speaker">{line.speaker}</p>
            <p className="story-text">{line.text}</p>
          </div>
          <div className="story-buttons">
            <button className="story-btn-next" onClick={handleStoryNext}>
              {storyIdx < STORY_LINES.length - 1 ? '继续 ▶' : '开始游戏 ▶'}
            </button>
            <button className="story-btn-skip" onClick={handleStorySkip}>跳过</button>
          </div>
          <div className="story-dots">
            {STORY_LINES.map((_, i) => (
              <span key={i} className={`story-dot ${i === storyIdx ? 'active' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== 主游戏画面 =====
  const cq = game.currentQuest;
  const scene = SCENES.find(s => s.id === game.currentScene)!;

  return (
    <div className="game-v3">
      {/* 顶部栏 */}
      <div className="top-bar">
        <div className="res-item"><span className="res-emoji">🪙</span><span>{game.coin}</span></div>
        <div className="res-item"><span className="res-emoji">⭐</span><span>{game.prestige}</span></div>
        <div className="res-item scene-badge" style={{ background: scene.color + '22', color: scene.color }}>
          <span>📍{scene.name}</span>
        </div>
      </div>

      {/* 主线任务追踪 */}
      {cq && (
        <div className="quest-tracker" onClick={() => setTab('scroll')}>
          <span className="quest-label">🎯 主线</span>
          <span className="quest-title">{cq.title}</span>
          <div className="quest-bar"><div className="quest-fill" style={{ width: `${game.questProgressPercent}%` }} /></div>
        </div>
      )}

      {/* 内容区 */}
      <div className="main-content">
        {/* 合成棋盘 */}
        {tab === 'board' && (
          <div className="board-panel">
            <div className="game-board-v3">
              {game.board.map((row, ri) => (
                <div key={ri} className="board-row-v3">
                  {row.map((cell, ci) => {
                    const isSel = game.selected?.r === ri && game.selected?.c === ci;
                    const isFx = composeFx?.r === ri && composeFx?.c === ci;
                    const item = cell ? ITEMS[cell] : null;
                    return (
                      <div
                        key={ci}
                        className={`cell-v3 ${isSel ? 'selected' : ''} ${isFx ? `fx-lv${item?.level || 1}` : ''} ${!item ? 'empty' : ''}`}
                        onClick={() => handleCell(ri, ci)}
                      >
                        {item && (
                          <>
                            <span className="cell-emoji-v3" style={{ color: item.color }}>{item.emoji}</span>
                            {isFx && (
                              <div className="fx-burst">
                                {Array.from({ length: 8 }).map((_, i) => (
                                  <span key={i} className="fx-particle" style={{
                                    '--angle': `${i * 45}deg`, '--color': item.color,
                                  } as React.CSSProperties} />
                                ))}
                                <span className="fx-text">合成{item.name}!</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="board-hint">
              {game.selected ? '🔵 再点一个相同的道具合成' : '👆 点击选中道具，点击同类合成'}
            </p>
          </div>
        )}

        {/* 场景地图 */}
        {tab === 'scene' && (
          <div className="scene-panel">
            <h3 className="panel-title">🗺️ 大好河山</h3>
            <div className="scene-map">
              {SCENES.map((s, i) => {
                const unlocked = game.unlockedScenes.includes(s.id);
                const progress = game.sceneProgress[s.id] || 0;
                return (
                  <div key={s.id} className={`scene-node ${unlocked ? '' : 'locked'} ${game.currentScene === s.id ? 'current' : ''}`} style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="scene-icon" style={{ background: unlocked ? s.color + '33' : '#ddd', borderColor: unlocked ? s.color : '#ccc' }}>
                      {unlocked ? ['🌿', '⛰️', '🌊', '🏮', '🏯', '🌲', '🎋'][i] : '🔒'}
                    </div>
                    <span className="scene-name">{s.name}</span>
                    {unlocked && (
                      <div className="scene-repair">
                        <div className="repair-bar"><div className="repair-fill" style={{ width: `${(progress / 3) * 100}%` }} /></div>
                        <span>{progress}/3</span>
                        {progress < 3 && (
                          <button className="repair-btn" onClick={() => handleRepair(s.id)}>
                            修缮 {[200, 500, 1000][progress]}💰
                          </button>
                        )}
                        {progress >= 3 && <span className="repaired">✅</span>}
                      </div>
                    )}
                    {!unlocked && <span className="unlock-req">需{ s.unlock}声望</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NPC */}
        {tab === 'npc' && (
          <div className="npc-panel">
            <h3 className="panel-title">👥 历史名人</h3>
            <div className="npc-list-v3">
              {NPCS.map(npc => (
                <div key={npc.id} className="npc-card-v3" onClick={() => setShowNpc(npc.id)}>
                  <span className="npc-emoji">{npc.emoji}</span>
                  <div className="npc-info-v3">
                    <span className="npc-name-v3">{npc.name}</span>
                    <span className="npc-title-v3">{npc.title}</span>
                  </div>
                  <span className="npc-scene-tag">{SCENES.find(s => s.id === npc.scene)?.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 订单 */}
        {tab === 'order' && (
          <div className="order-panel">
            <h3 className="panel-title">📜 客商订单</h3>
            <div className="order-list-v3">
              {game.orders.map(o => {
                const item = ITEMS[o.item];
                const have = game.countItem(o.item);
                return (
                  <div key={o.id} className={`order-card-v3 ${o.done ? 'done' : ''}`}>
                    <div className="order-info-v3">
                      <span style={{ color: item.color, fontSize: 24 }}>{item.emoji}</span>
                      <div>
                        <span className="order-name-v3">{item.name} ×{o.need}</span>
                        <span className="order-have">已有 {have}/{o.need}</span>
                      </div>
                    </div>
                    <div className="order-reward-v3">
                      <span>🪙 {o.coin}</span>
                    </div>
                    {!o.done ? (
                      <button className={`order-btn ${have >= o.need ? '' : 'disabled'}`} onClick={() => handleOrder(o.id)}>
                        {have >= o.need ? '交付' : `缺${o.need - have}`}
                      </button>
                    ) : <span className="order-done">✅</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 山河图卷 */}
        {tab === 'scroll' && (
          <div className="scroll-panel">
            <h3 className="panel-title">📜 山河锦绣图</h3>
            <div className="scroll-display">
              <img src="/assets/scroll_fragment.png" alt="山河图" className="scroll-img" />
              <div className="scroll-progress">
                <p>收集进度: {game.completedQuests.length}/{ QUESTS.length}</p>
                <div className="scroll-bar"><div className="scroll-fill" style={{ width: `${(game.completedQuests.length / QUESTS.length) * 100}%` }} /></div>
              </div>
            </div>
            <div className="quest-list">
              {QUESTS.map(q => {
                const done = game.completedQuests.includes(q.id);
                const progress = game.questProgress[String(q.id)] || 0;
                return (
                  <div key={q.id} className={`quest-item ${done ? 'done' : ''}`}>
                    <span className="quest-check">{done ? '✅' : '⭕'}</span>
                    <div className="quest-detail">
                      <span className="quest-name">{q.title}</span>
                      <span className="quest-desc">{q.desc}</span>
                      {!done && (
                        <div className="quest-mini-bar"><div className="quest-mini-fill" style={{ width: `${Math.min(100, (progress / q.count) * 100)}%` }} /></div>
                      )}
                    </div>
                    <span className="quest-reward">{q.reward}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <div className="bottom-nav-v3">
        <button className={`nav-btn-v3 ${tab === 'board' ? 'active' : ''}`} onClick={() => setTab('board')}>
          <span className="nav-icon">🧩</span><span className="nav-label">合成</span>
        </button>
        <button className={`nav-btn-v3 ${tab === 'scene' ? 'active' : ''}`} onClick={() => setTab('scene')}>
          <span className="nav-icon">🗺️</span><span className="nav-label">山河</span>
        </button>
        <button className={`nav-btn-v3 ${tab === 'order' ? 'active' : ''}`} onClick={() => setTab('order')}>
          <span className="nav-icon">📜</span><span className="nav-label">订单</span>
          {game.orders.some(o => !o.done && game.countItem(o.item) >= o.need) && <span className="nav-dot" />}
        </button>
        <button className={`nav-btn-v3 ${tab === 'npc' ? 'active' : ''}`} onClick={() => setTab('npc')}>
          <span className="nav-icon">👥</span><span className="nav-label">名人</span>
        </button>
        <button className={`nav-btn-v3 ${tab === 'scroll' ? 'active' : ''}`} onClick={() => setTab('scroll')}>
          <span className="nav-icon">📜</span><span className="nav-label">图卷</span>
          {game.completedQuests.length > 0 && <span className="nav-badge">{game.completedQuests.length}</span>}
        </button>
      </div>

      {/* NPC弹窗 */}
      {showNpc && (() => {
        const npc = NPCS.find(n => n.id === showNpc)!;
        return (
          <div className="modal-v3" onClick={() => setShowNpc(null)}>
            <div className="modal-box-v3 npc-dialogue" onClick={e => e.stopPropagation()}>
              <button className="modal-close-v3" onClick={() => setShowNpc(null)}>✕</button>
              <div className="npc-avatar-big">{npc.emoji}</div>
              <h4>{npc.name} · {npc.title}</h4>
              <p className="npc-text">"{npc.dialogue}"</p>
              <button className="btn-primary-v3" onClick={() => setShowNpc(null)}>告辞</button>
            </div>
          </div>
        );
      })()}

      {/* 任务完成弹窗 */}
      {showQuestComplete && (() => {
        const q = QUESTS.find(x => x.id === showQuestComplete)!;
        return (
          <div className="modal-v3">
            <div className="modal-box-v3 quest-complete">
              <div className="complete-star">⭐</div>
              <h3>任务完成！</h3>
              <p>{q.title}</p>
              <p className="complete-reward">奖励: {q.reward}</p>
              <button className="btn-primary-v3" onClick={() => setShowQuestComplete(null)}>收下</button>
            </div>
          </div>
        );
      })()}

      {/* Toast */}
      {toast && <div className="toast-v3">{toast}</div>}
    </div>
  );
}

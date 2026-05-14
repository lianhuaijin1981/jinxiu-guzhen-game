import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

// ==========================================
// 锦绣古镇 v5.0 — 严格GDD闭环
// 绣坊基地 ↔ 游历合成 ↔ 完成返回
// ==========================================

const SCENES = [
  { id: 1, name: '江南古镇', sub: '绣坊总基地', color: '#7ecfa8', prestige: 0,    items: ['silk-cocoon','raw-silk','silk-thread','plain-satin','brocade'] },
  { id: 2, name: '泰山',     sub: '五岳独尊',   color: '#c9a96e', prestige: 100,  items: ['stone','pine','rubbing','ink','jade-book'] },
  { id: 3, name: '西湖',     sub: '西子湖畔',   color: '#6a9eb8', prestige: 300,  items: ['tea','petal','willow','cake','fan'] },
];

// 道具定义
const ALL_ITEMS: Record<string, { name: string; emoji: string; level: number; color: string }> = {
  // 江南
  'silk-cocoon':  { name: '蚕茧', emoji: '🌿', level: 1, color: '#d4c4a8' },
  'raw-silk':     { name: '生丝', emoji: '🧵', level: 2, color: '#e8dcc8' },
  'silk-thread':  { name: '蚕丝线', emoji: '🎀', level: 3, color: '#c9a96e' },
  'plain-satin':  { name: '素缎', emoji: '🧣', level: 4, color: '#d4b87a' },
  'brocade':      { name: '织锦', emoji: '🏮', level: 5, color: '#b87333' },
  // 泰山
  'stone':        { name: '泰山石', emoji: '🪨', level: 1, color: '#999' },
  'pine':         { name: '松枝', emoji: '🌲', level: 2, color: '#6a8a5a' },
  'rubbing':      { name: '拓片', emoji: '📜', level: 3, color: '#c9a96e' },
  'ink':          { name: '松烟墨', emoji: '⚫', level: 4, color: '#555' },
  'jade-book':    { name: '封禅玉册', emoji: '📿', level: 5, color: '#7ecfa8' },
  // 西湖
  'tea':          { name: '龙井茶叶', emoji: '🍵', level: 1, color: '#7ecfa8' },
  'petal':        { name: '荷瓣', emoji: '🌸', level: 2, color: '#e8a0c8' },
  'willow':       { name: '柳枝', emoji: '🌿', level: 3, color: '#6a9e5a' },
  'cake':         { name: '茶饼', emoji: '🫖', level: 4, color: '#c9a96e' },
  'fan':          { name: '刺绣扇面', emoji: '🪭', level: 5, color: '#d47274' },
};

// 合成链：每场景5级
const COMPOSE: Record<string, Record<string, string>> = {
  1: { 'silk-cocoon': 'raw-silk', 'raw-silk': 'silk-thread', 'silk-thread': 'plain-satin', 'plain-satin': 'brocade' },
  2: { 'stone': 'pine', 'pine': 'rubbing', 'rubbing': 'ink', 'ink': 'jade-book' },
  3: { 'tea': 'petal', 'petal': 'willow', 'willow': 'cake', 'cake': 'fan' },
};

// 剧情
const STORY = [
  { spk: '旁白',  txt: '大靖王朝年间，华夏大地山川秀美、文脉昌盛。世间存有一卷《山河锦绣图》，绘遍全国名山大川、非遗织造技艺与地域人文。', img: null },
  { spk: '旁白',  txt: '后历经战乱，古卷散落各地，山河文脉日渐凋零。', img: null },
  { spk: '旁白',  txt: '大靖历三百二十七年，江南汉服织造世家传人沈绾，因家族变故归乡。祖母临终前，将一只檀木匣子交到她手中……', img: '/assets/characters/shenwan_guibi.png' },
  { spk: '沈绾',   txt: '（打开木匣）这是……《山河锦绣图》？！可为何如此残破？', img: '/assets/characters/shenwan_guibi.png' },
  { spk: '沈绾',   txt: '祖母曾言，此图记载华夏七大胜景的织造秘法。如今图卷碎裂，各地文脉将彻底断绝……', img: '/assets/characters/shenwan_guibi.png' },
  { spk: '沈绾',   txt: '我沈绾在此立誓：走遍万里山河，收集七处残卷，复原锦绣图，传承华夏织造文脉！重启古镇绣坊，开启游历之路！', img: '/assets/characters/shenwan_guibi.png' },
];

// NPC
const NPCS = [
  { id: 1, name: '孔伋',   title: '子思',     scene: 2, dialogue: '儒家之道，在于传承文脉。姑娘此来泰山，可是为寻访封禅之礼？' },
  { id: 2, name: '苏轼',   title: '东坡居士', scene: 3, dialogue: '欲把西湖比西子，淡妆浓抹总相宜。姑娘可懂这西湖之美？' },
];

// ==========================================
// 引擎
// ==========================================
class Engine {
  // 绣坊基地状态
  coin = 500; silver = 30; prestige = 0; energy = 50; maxEnergy = 50;
  sceneRepair: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  unlockedScenes = [1];
  scrollPieces: Record<number, number> = { 1: 0, 2: 0, 3: 0 }; // 每个场景的图鉴残卷收集
  totalComposes = 0;

  // 游历状态（小游戏内）
  inTravel = false;
  travelScene = 1;
  board: (string | null)[][] = Array(6).fill(null).map(() => Array(5).fill(null));
  selected: { r: number; c: number } | null = null;
  travelTarget = { item: '', count: 0, collected: 0 }; // 游历目标
  travelOrdersCompleted = 0;
  onUpdate?: () => void;

  // 定时器
  private _timer: ReturnType<typeof setInterval> | null = null;

  constructor() { this.resetBoard(1); }

  // 开始游历某场景
  startTravel(sceneId: number) {
    if (!this.unlockedScenes.includes(sceneId)) return false;
    this.inTravel = true;
    this.travelScene = sceneId;
    this.travelOrdersCompleted = 0;
    // 设置游历目标：收集场景最高阶道具
    const topItem = SCENES.find(s => s.id === sceneId)!.items[4];
    this.travelTarget = { item: topItem, count: 2, collected: 0 };
    this.resetBoard(sceneId);
    this._timer = setInterval(() => this.autoGen(), 12000);
    return true;
  }

  // 结束游历，返回绣坊
  endTravel() {
    this.inTravel = false;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this.selected = null;
  }

  resetBoard(sceneId: number) {
    const baseItem = SCENES.find(s => s.id === sceneId)!.items[0];
    this.board = Array(6).fill(null).map(() => Array(5).fill(null));
    for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) if (Math.random() > 0.3) this.board[r][c] = baseItem;
  }

  autoGen() {
    if (!this.inTravel) return;
    const baseItem = SCENES.find(s => s.id === this.travelScene)!.items[0];
    const empty: { r: number; c: number }[] = [];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) if (!this.board[r][c]) empty.push({ r, c });
    if (empty.length > 0) { const p = empty[Math.floor(Math.random() * empty.length)]; this.board[p.r][p.c] = baseItem; }
  }

  click(r: number, c: number): { ok: boolean; fx?: { r: number; c: number; lv: number }; questDone?: boolean } {
    if (!this.inTravel) return { ok: false };
    const item = this.board[r][c];
    if (!item) { this.selected = null; return { ok: false }; }
    if (this.energy < 1) { this.selected = null; return { ok: false }; }

    if (this.selected) {
      const { r: sr, c: sc } = this.selected;
      if (sr === r && sc === c) { this.selected = null; return { ok: false }; }
      const src = this.board[sr][sc];
      const chain = COMPOSE[this.travelScene];
      if (src && src === item && chain && chain[src]) {
        const target = chain[src];
        this.board[r][c] = target;
        this.board[sr][sc] = null;
        this.selected = null;
        this.energy--;
        this.coin += 30;
        this.totalComposes++;
        // 检查是否达成游历目标
        if (target === this.travelTarget.item) {
          this.travelTarget.collected++;
        }
        const questDone = this.checkTravelComplete();
        this.onUpdate?.();
        return { ok: true, fx: { r, c, lv: ALL_ITEMS[target].level }, questDone };
      }
      this.selected = { r, c };
      return { ok: false };
    }
    this.selected = { r, c };
    return { ok: false };
  }

  // 检查游历是否完成
  checkTravelComplete(): boolean {
    // 目标1：收集指定数量最高阶道具
    if (this.travelTarget.collected >= this.travelTarget.count) return true;
    // 目标2：或完成3笔订单
    if (this.travelOrdersCompleted >= 3) return true;
    return false;
  }

  count(item: string) {
    let n = 0;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) if (this.board[r][c] === item) n++;
    return n;
  }

  // 完成游历 - 获得奖励
  completeTravel() {
    const sid = this.travelScene;
    this.scrollPieces[sid] = Math.min(3, (this.scrollPieces[sid] || 0) + 1);
    this.prestige += 30;
    this.coin += 200;
    // 检查场景修缮解锁
    if (this.scrollPieces[sid] >= 1 && this.sceneRepair[sid] < 1) this.sceneRepair[sid] = 1;
    // 检查新场景解锁
    for (const s of SCENES) {
      if (!this.unlockedScenes.includes(s.id) && this.prestige >= s.prestige) {
        this.unlockedScenes.push(s.id);
      }
    }
    this.endTravel();
    this.onUpdate?.();
  }

  // 绣坊：修缮场景
  repair(sceneId: number): boolean {
    const cur = this.sceneRepair[sceneId] || 0;
    if (cur >= 3) return false;
    const costs = [100, 300, 800];
    if (this.coin < costs[cur]) return false;
    this.coin -= costs[cur];
    this.sceneRepair[sceneId] = cur + 1;
    this.prestige += 20;
    this.onUpdate?.();
    return true;
  }

  // 绣坊：NPC对话解锁
  getNpcForScene(sceneId: number) {
    return NPCS.filter(n => n.scene === sceneId);
  }

  recoverEnergy() {
    if (this.energy < this.maxEnergy) { this.energy++; this.onUpdate?.(); }
  }

  getSceneItem(sceneId: number, level: number) {
    return ALL_ITEMS[SCENES.find(s => s.id === sceneId)!.items[level - 1]];
  }
}

// ==========================================
// 主组件
// ==========================================
type Screen = 'title' | 'story' | 'game';
type GameView = 'home' | 'scroll'; // 绣坊基地的视图

export default function App() {
  const [g] = useState(() => new Engine());
  const [, setT] = useState(0);
  const [screen, setScreen] = useState<Screen>('title');
  const [si, setSi] = useState(0); // story index
  const [view, setView] = useState<GameView>('home'); // 绣坊基地视图
  const [fx, setFx] = useState<{ r: number; c: number; lv: number } | null>(null);
  const [toast, setToast] = useState('');
  const [showComplete, setShowComplete] = useState(false); // 游历完成弹窗
  const [npcDlg, setNpcDlg] = useState<number | null>(null);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const r = useCallback(() => setT(t => t + 1), []);

  useEffect(() => { g.onUpdate = r; const iv = setInterval(() => g.recoverEnergy(), 3000); return () => clearInterval(iv); }, [g, r]);

  const msg = (m: string) => { setToast(m); if (tRef.current) clearTimeout(tRef.current); tRef.current = setTimeout(() => setToast(''), 2500); };

  const onCell = (row: number, col: number) => {
    if (fx) return;
    const res = g.click(row, col);
    r();
    if (res.ok && res.fx) {
      setFx(res.fx);
      setTimeout(() => setFx(null), 800);
      const it = ALL_ITEMS[Object.keys(ALL_ITEMS).find(k => ALL_ITEMS[k].level === res.fx!.lv)!];
      msg(`✨ 合成${it?.name || '成功'}！+30铜钱 -1心力`);
      if (res.questDone) { setTimeout(() => setShowComplete(true), 500); }
    }
  };

  // 开始游历
  const startTravel = (sid: number) => {
    if (g.startTravel(sid)) {
      msg(`🗺️ 进入${SCENES.find(s => s.id === sid)!.name}，完成游历目标收集图鉴残卷！`);
      r();
    } else { msg('🔒 场景未解锁'); }
  };

  // 完成游历
  const completeTravel = () => {
    const sid = g.travelScene;
    g.completeTravel();
    setShowComplete(false);
    msg(`🎉 ${SCENES.find(s => s.id === sid)!.name}游历完成！获得图鉴残卷×1 +200铜钱 +30声望`);
    r();
  };

  // 提前退出游历（无奖励）
  const quitTravel = () => {
    g.endTravel();
    msg('已返回绣坊（提前退出无奖励）');
    r();
  };

  const scene = SCENES.find(s => s.id === g.travelScene)!;

  // ============ 标题 ============
  if (screen === 'title') return (
    <div className="v5-title">
      <div className="v5-title-bg" style={{ backgroundImage: 'url(/assets/scenes/scene_jiangnan.jpg)' }} />
      <div className="v5-title-ov" />
      <div className="v5-title-ct">
        <img src="/assets/characters/shenwan_guibi.png" className="v5-title-char" alt="沈绾" />
        <h1>锦绣古镇</h1>
        <p className="v5-sub">汉服织造录</p>
        <p className="v5-slogan">织汉服锦绣 · 游万里山河 · 承华夏文脉</p>
        <button className="v5-start" onClick={() => setScreen('story')}>✦ 开启旅程</button>
      </div>
    </div>
  );

  // ============ 剧情 ============
  if (screen === 'story') {
    const line = STORY[si];
    return (
      <div className="v5-story">
        <div className="v5-s-bg" style={{ backgroundImage: 'url(/assets/scenes/zhuangxiu_main.jpg)' }} />
        <div className="v5-s-ov" />
        <div className="v5-s-ct">
          {line.img && <img src={line.img} className="v5-s-char" alt="" />}
          <div className="v5-s-box">
            <p className="v5-s-name">{line.spk}</p>
            <p className="v5-s-txt">{line.txt}</p>
          </div>
          <div className="v5-s-btns">
            <button onClick={() => si < STORY.length - 1 ? setSi(si + 1) : setScreen('game')}>{si < STORY.length - 1 ? '▶ 继续' : '▶ 进入绣坊'}</button>
            <button className="skip" onClick={() => setScreen('game')}>跳过</button>
          </div>
          <div className="v5-dots">{STORY.map((_, i) => <span key={i} className={i === si ? 'on' : ''} />)}</div>
        </div>
      </div>
    );
  }

  // ============ 主游戏 ============
  return (
    <div className="v5-game">
      {/* 顶部资源栏 */}
      <div className="v5-top">
        <div className="v5-res">
          <span>❤️ {g.energy}/{g.maxEnergy}</span>
          <span>🪙 {g.coin}</span>
          <span>💎 {g.silver}</span>
          <span>⭐ {g.prestige}</span>
        </div>
        {!g.inTravel && (
          <div className="v5-scene-badge" style={{ background: '#7ecfa822', color: '#7ecfa8' }}>🏘️ 沈氏绣坊</div>
        )}
        {g.inTravel && (
          <div className="v5-scene-badge" style={{ background: scene.color + '22', color: scene.color }}>🗺️ 游历·{scene.name}</div>
        )}
      </div>

      {/* ====== 游历中：合成小游戏 ====== */}
      {g.inTravel && (
        <div className="v5-travel">
          {/* 游历目标 */}
          <div className="v5-target">
            <span className="v5-target-label">🎯 游历目标</span>
            <span>收集 {ALL_ITEMS[g.travelTarget.item]?.name || ''} {g.travelTarget.collected}/{g.travelTarget.count}</span>
            <div className="v5-target-bar"><div className="v5-target-fill" style={{ width: `${Math.min(100, (g.travelTarget.collected / g.travelTarget.count) * 100)}%` }} /></div>
          </div>

          {/* 场景背景+棋盘 */}
          <div className="v5-board-wrap" style={{ backgroundImage: `url(${scene.id === 1 ? '/assets/scenes/zhuangxiu_main.jpg' : scene.id === 2 ? '/assets/scenes/scene_taishan.jpg' : '/assets/scenes/scene_xihu.jpg'})` }}>
            <div className="v5-board-ov" />
            <div className="v5-board">
              {g.board.map((row, ri) => (
                <div key={ri} className="v5-row">
                  {row.map((cell, ci) => {
                    const sel = g.selected?.r === ri && g.selected?.c === ci;
                    const isFx = fx?.r === ri && fx?.c === ci;
                    const it = cell ? ALL_ITEMS[cell] : null;
                    return (
                      <div key={ci} className={`v5-cell ${sel ? 'sel' : ''} ${isFx ? `fx${it?.level || 1}` : ''} ${!it ? 'empty' : ''}`}
                        onClick={() => onCell(ri, ci)}>
                        {it && <><span className="v5-emoji" style={{ color: it.color }}>{it.emoji}</span>
                          {isFx && <div className="v5-burst">
                            {Array.from({ length: 8 }).map((_, i) => (
                              <span key={i} className="v5-ptcl" style={{ '--a': `${i * 45}deg`, '--c': it.color } as React.CSSProperties} />
                            ))}
                            <span className="v5-fxtxt">合成{it.name}!</span>
                          </div>}</>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <p className="v5-hint">
            {g.selected ? '🔵 再点一个相同的道具合成' : '👆 点击选中道具，再点同类合成（-1心力）'}
          </p>

          {/* 退出按钮 */}
          <button className="v5-quit" onClick={quitTravel}>↩ 返回绣坊</button>
        </div>
      )}

      {/* ====== 绣坊基地 ====== */}
      {!g.inTravel && (
        <div className="v5-home">
          {view === 'home' && (
            <>
              {/* 绣坊全景 */}
              <div className="v5-zhuangxiu">
                <img src="/assets/scenes/zhuangxiu_main.jpg" alt="绣坊" />
                <div className="v5-zx-ov" />
                <div className="v5-zx-label">
                  <span className="zx-name">🏘️ 沈氏绣坊</span>
                  <span className="zx-desc">苏南水乡 · 多层沿河而建</span>
                </div>
                {/* 绣坊功能入口 */}
                <div className="v5-zx-buttons">
                  <button className="v5-zx-btn main" onClick={() => { setView('scroll'); }}>📜 山河图卷</button>
                </div>
              </div>

              {/* 游历入口：场景选择 */}
              <div className="v5-travel-section">
                <h4 className="v5-section-title">🗺️ 大好河山 · 点击场景开始游历</h4>
                <div className="v5-scene-list">
                  {SCENES.map(s => {
                    const unlocked = g.unlockedScenes.includes(s.id);
                    const repair = g.sceneRepair[s.id] || 0;
                    const pieces = g.scrollPieces[s.id] || 0;
                    const stages = ['🏚️破败', '🔨修缮', '🔨修缮', '✨完工'];
                    return (
                      <div key={s.id} className={`v5-scene-card ${!unlocked ? 'locked' : ''}`}>
                        <div className="v5-sc-top" style={{ background: s.color + '18' }}>
                          <span className="v5-sc-emoji">{s.id === 1 ? '🏘️' : s.id === 2 ? '⛰️' : '🌊'}</span>
                          <div className="v5-sc-info">
                            <span className="v5-sc-name" style={{ color: s.color }}>{s.name}</span>
                            <span className="v5-sc-sub">{s.sub}</span>
                          </div>
                          <div className="v5-sc-status">
                            <span className="v5-sc-stage">{stages[Math.min(3, repair)]}</span>
                            <span className="v5-sc-pieces">📜 {pieces}/3</span>
                          </div>
                        </div>
                        {unlocked ? (
                          <div className="v5-sc-actions">
                            {pieces < 3 && (
                              <button className="v5-sc-go" style={{ background: s.color }} onClick={() => startTravel(s.id)}>
                                🗺️ 开始游历（收集图鉴残卷）
                              </button>
                            )}
                            {repair < 3 && pieces >= 1 && (
                              <button className="v5-sc-repair" onClick={() => g.repair(s.id) ? msg(`🔨 ${s.name}修缮+1！`) : msg('❌ 铜钱不足')}>
                                🔨 修缮({[100, 300, 800][repair]}🪙)
                              </button>
                            )}
                            {pieces >= 3 && repair >= 3 && <span className="v5-sc-done">✨ 已完工</span>}
                          </div>
                        ) : (
                          <span className="v5-sc-lock">🔒 需{s.prestige}声望解锁</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NPC */}
              <div className="v5-npc-section">
                <h4 className="v5-section-title">👥 历史名人</h4>
                {NPCS.map(npc => (
                  <div key={npc.id} className="v5-npc-card" onClick={() => setNpcDlg(npc.id)}>
                    <span className="v5-npc-emoji">{npc.scene === 2 ? '⛰️' : '🌊'}</span>
                    <div>
                      <span className="v5-npc-name">{npc.name} · {npc.title}</span>
                      <span className="v5-npc-loc">{SCENES.find(s => s.id === npc.scene)?.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {view === 'scroll' && (
            <div className="v5-scroll-view">
              <h4 className="v5-section-title">📜 山河锦绣图 · 收集进度</h4>
              <div className="v5-scroll-main">
                <img src="/assets/scenes/zhuangxiu_main.jpg" className="v5-scroll-img" alt="山河图" />
                <p className="v5-scroll-total">
                  已收集 {Object.values(g.scrollPieces).reduce((a, b) => a + b, 0)}/9 张残卷
                </p>
                <div className="v5-scroll-bar"><div className="v5-scroll-fill" style={{ width: `${(Object.values(g.scrollPieces).reduce((a, b) => a + b, 0) / 9) * 100}%` }} /></div>
              </div>
              {SCENES.map(s => (
                <div key={s.id} className="v5-scroll-item">
                  <span style={{ color: s.color }}>{s.name}</span>
                  <div className="v5-scroll-pieces">
                    {[1, 2, 3].map(i => (
                      <span key={i} className={i <= (g.scrollPieces[s.id] || 0) ? 'has' : ''}>
                        {i <= (g.scrollPieces[s.id] || 0) ? '📜' : '📄'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <button className="v5-back" onClick={() => setView('home')}>↩ 返回绣坊</button>
            </div>
          )}
        </div>
      )}

      {/* 游历完成弹窗 */}
      {showComplete && (
        <div className="v5-modal">
          <div className="v5-modal-box">
            <div className="v5-star">⭐</div>
            <h3>游历完成！</h3>
            <p>你已完成{scene.name}的游历目标</p>
            <div className="v5-rewards">
              <span>📜 图鉴残卷 ×1</span>
              <span>🪙 铜钱 +200</span>
              <span>⭐ 声望 +30</span>
            </div>
            <button className="v5-modal-btn" onClick={completeTravel}>🏘️ 返回绣坊</button>
          </div>
        </div>
      )}

      {/* NPC弹窗 */}
      {npcDlg && (
        <div className="v5-modal" onClick={() => setNpcDlg(null)}>
          <div className="v5-modal-box" onClick={e => e.stopPropagation()}>
            <button className="v5-close" onClick={() => setNpcDlg(null)}>✕</button>
            <h4>{NPCS.find(n => n.id === npcDlg)?.name} · {NPCS.find(n => n.id === npcDlg)?.title}</h4>
            <p className="v5-dlg-txt">「{NPCS.find(n => n.id === npcDlg)?.dialogue}」</p>
            <button className="v5-modal-btn" onClick={() => setNpcDlg(null)}>告辞</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="v5-toast">{toast}</div>}
    </div>
  );
}

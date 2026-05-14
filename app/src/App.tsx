import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

// ============================================================
// 严格按GDD执行：《锦绣古镇：汉服织造录》v4.0
// 大靖王朝世界观 / 沈绾归乡→发现山河图→立志复原
// ============================================================

// ---- 7大场景（GDD第四章） ----
const SCENES = [
  { id: 1, name: '江南古镇', sub: '绣坊总基地',   color: '#7ecfa8', prestige: 0,    bg: '/assets/scenes/zhuangxiu_main.jpg', desc: '苏南水乡，沈绾家族绣坊所在' },
  { id: 2, name: '泰山',     sub: '五岳独尊',     color: '#c9a96e', prestige: 100,  bg: '/assets/scenes/scene_taishan.jpg',  desc: '齐鲁大地，封禅之地' },
  { id: 3, name: '西湖',     sub: '西子湖畔',     color: '#6a9eb8', prestige: 300,  bg: '/assets/scenes/scene_xihu.jpg',     desc: '欲把西湖比西子' },
  { id: 4, name: '长安',     sub: '大唐盛世',     color: '#d4574a', prestige: 600,  bg: '/assets/scenes/scene_changan.jpg',  desc: '万国来朝，锦绣长安' },
  { id: 5, name: '万里长城', sub: '雄关万里',     color: '#8b7355', prestige: 1000, bg: '/assets/scenes/scene_greatwall.jpg',desc: '气吞山河，万里雄关' },
  { id: 6, name: '黄山',     sub: '奇松云海',     color: '#4a6741', prestige: 1500, bg: '/assets/scenes/scene_huangshan.jpg',desc: '天下无山，观止矣' },
  { id: 7, name: '青城山',   sub: '道法自然',     color: '#5a7a6a', prestige: 1500, bg: '/assets/scenes/scene_qingcheng.jpg',desc: '幽甲天下，道法自然' },
];

// ---- 江南古镇道具合成链（GDD：每场景独立专属链） ----
const ITEMS: Record<string, { name: string; emoji: string; level: number; color: string }> = {
  'silk-cocoon':  { name: '蚕茧', emoji: '🌿', level: 1, color: '#d4c4a8' },
  'raw-silk':     { name: '生丝', emoji: '🧵', level: 2, color: '#e8dcc8' },
  'silk-thread':  { name: '蚕丝线', emoji: '🎀', level: 3, color: '#c9a96e' },
  'plain-satin':  { name: '素缎', emoji: '🧣', level: 4, color: '#d4b87a' },
  'brocade':      { name: '织锦', emoji: '🏮', level: 5, color: '#b87333' },
};

// 严格Merge-2：同级合成
const COMPOSE_MAP: Record<string, string> = {
  'silk-cocoon': 'raw-silk',
  'raw-silk': 'silk-thread',
  'silk-thread': 'plain-satin',
  'plain-satin': 'brocade',
};

// ---- 剧情（GDD第二章：启程篇严格原文） ----
const STORY = [
  { bg: '/assets/scenes/scene_jiangnan.jpg', text: '大靖王朝年间，华夏大地山川秀美、文脉昌盛。',                                                     name: '旁白', img: null },
  { bg: '/assets/scenes/scene_jiangnan.jpg', text: '世间存有一卷《山河锦绣图》，绘遍全国名山大川、非遗织造技艺与地域人文。',               name: '旁白', img: null },
  { bg: '/assets/scenes/scene_jiangnan.jpg', text: '后历经战乱，古卷散落各地，山河文脉日渐凋零。',                                                         name: '旁白', img: null },
  { bg: '/assets/scenes/scene_jiangnan.jpg', text: '大靖历三百二十七年，江南汉服织造世家传人沈绾，因家族变故归乡。',                         name: '旁白', img: '/assets/characters/shenwan_guibi.png' },
  { bg: '/assets/scenes/zhuangxiu_main.jpg',  text: '祖母临终前，将一只檀木匣子交到她手中……',                                                             name: '旁白', img: '/assets/characters/shenwan_guibi.png' },
  { bg: '/assets/scenes/zhuangxiu_main.jpg',  text: '（打开木匣）这是……《山河锦绣图》？！可为何如此残破？',                                               name: '沈绾', img: '/assets/characters/shenwan_guibi.png' },
  { bg: '/assets/scenes/zhuangxiu_main.jpg',  text: '祖母曾言，此图记载华夏七大胜景的织造秘法。如今图卷碎裂，各地文脉将彻底断绝……',       name: '沈绾', img: '/assets/characters/shenwan_guibi.png' },
  { bg: '/assets/scenes/zhuangxiu_main.jpg',  text: '我沈绾在此立誓：走遍万里山河，收集七处残卷，复原锦绣图，传承华夏织造文脉！',         name: '沈绾', img: '/assets/characters/shenwan_guibi.png' },
  { bg: '/assets/scenes/zhuangxiu_main.jpg',  text: '重启古镇绣坊，从江南启程，开启游历之路！',                                                             name: '沈绾', img: '/assets/characters/shenwan_guibi.png' },
  { bg: '/assets/scenes/zhuangxiu_main.jpg',  text: '【教学】点击选中一个蚕茧，再点击另一个蚕茧，合成更高阶的道具。',                         name: '系统', img: null },
];

// ---- NPC（GDD第五章严格设定） ----
const NPCS: Record<number, { name: string; title: string; dialogue: string; img: string }> = {
  1: { name: '孔伋',    title: '子思', dialogue: '儒家之道，在于传承文脉。姑娘此来泰山，可是为寻访封禅之礼？',       img: '/assets/characters/npc_kongji.png' },
  2: { name: '鲁班',    title: '公输班', dialogue: '技艺之道，在于精益求精。这岱庙修缮，需得用心。',                 img: '/assets/characters/npc_luban.png' },
  3: { name: '苏轼',    title: '东坡居士', dialogue: '欲把西湖比西子，淡妆浓抹总相宜。姑娘可懂这西湖之美？',         img: '/assets/characters/npc_sushi.png' },
  4: { name: '李白',    title: '诗仙', dialogue: '黄河之水天上来，奔流到海不复回。姑娘可愿同饮一杯？',             img: '/assets/characters/npc_libai.png' },
  5: { name: '杨玉环',  title: '贵妃', dialogue: '云想衣裳花想容，春风拂槛露华浓。织造之美，本宫最懂。',           img: '/assets/characters/npc_yangyuhuan.png' },
  6: { name: '戚继光',  title: '戚将军', dialogue: '保家卫国，乃男儿本分。长城之上，不容外敌踏足！',                 img: '/assets/characters/npc_qijiguang.png' },
  7: { name: '张道陵',  title: '张天师', dialogue: '道法自然，心静则明。姑娘可愿入我道门，修身养性？',               img: '/assets/characters/npc_zhangdaoling.png' },
};

// ============================================================
// 游戏引擎（严格按GDD第三章）
// ============================================================
class Engine {
  board: (string | null)[][];
  rows = 6;
  cols = 5;
  energy = 50;
  maxEnergy = 50;
  coin = 500;
  silver = 30;
  prestige = 0;
  currentScene = 1;
  selected: { r: number; c: number } | null = null;
  sceneRepair: Record<number, number> = {};
  unlockedScenes = [1];
  orders: { id: number; item: string; need: number; reward: number; done: boolean }[] = [];
  dialoguesUnlocked: number[] = [];
  onUpdate?: () => void;

  constructor() {
    this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
    this.fillBoard();
    this.orders = this.genOrders();
    this.dialoguesUnlocked = [1];
    // 自动恢复心力
    setInterval(() => this.recoverEnergy(), 3000);
    // 自动产出
    setInterval(() => this.autoGenerate(), 15000);
  }

  fillBoard() {
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (Math.random() > 0.3) this.board[r][c] = 'silk-cocoon';
  }

  autoGenerate() {
    const empty: { r: number; c: number }[] = [];
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (!this.board[r][c]) empty.push({ r, c });
    if (empty.length > 0) {
      const p = empty[Math.floor(Math.random() * empty.length)];
      this.board[p.r][p.c] = 'silk-cocoon';
      this.onUpdate?.();
    }
  }

  recoverEnergy() {
    if (this.energy < this.maxEnergy) { this.energy++; this.onUpdate?.(); }
  }

  clickCell(r: number, c: number): { ok: boolean; fx?: { r: number; c: number; lv: number } } {
    const item = this.board[r][c];
    if (!item) { this.selected = null; return { ok: false }; }
    if (this.energy < 1) { this.selected = null; return { ok: false }; }

    if (this.selected) {
      const { r: sr, c: sc } = this.selected;
      if (sr === r && sc === c) { this.selected = null; return { ok: false }; }
      const src = this.board[sr][sc];
      // 严格Merge-2：同等级同类道具合成
      if (src && src === item && COMPOSE_MAP[src]) {
        const target = COMPOSE_MAP[src];
        this.board[r][c] = target;
        this.board[sr][sc] = null;
        this.selected = null;
        this.energy--;
        this.coin += 30;
        this.prestige += 2;
        this.checkUnlock();
        this.onUpdate?.();
        return { ok: true, fx: { r, c, lv: ITEMS[target].level } };
      }
      this.selected = { r, c };
      return { ok: false };
    }
    this.selected = { r, c };
    return { ok: false };
  }

  count(id: string) {
    let n = 0;
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (this.board[r][c] === id) n++;
    return n;
  }

  deliverOrder(oid: number) {
    const o = this.orders.find(x => x.id === oid);
    if (!o || o.done) return false;
    if (this.count(o.item) < o.need) return false;
    let rem = o.need;
    for (let r = 0; r < this.rows && rem > 0; r++)
      for (let c = 0; c < this.cols && rem > 0; c++)
        if (this.board[r][c] === o.item) { this.board[r][c] = null; rem--; }
    this.coin += o.reward;
    this.prestige += 15;
    o.done = true;
    this.checkUnlock();
    // 刷新订单
    setTimeout(() => { o.done = false; o.item = this.randItem(); o.need = [3, 2, 1][Math.floor(Math.random() * 3)]; o.reward = Math.floor(Math.random() * 500) + 200; this.onUpdate?.(); }, 2000);
    this.onUpdate?.();
    return true;
  }

  randItem() {
    const keys = Object.keys(ITEMS);
    return keys[Math.floor(Math.random() * keys.length)];
  }

  genOrders() {
    return [
      { id: 1, item: 'silk-cocoon', need: 5, reward: 200, done: false },
      { id: 2, item: 'raw-silk',    need: 3, reward: 500, done: false },
      { id: 3, item: 'silk-thread', need: 2, reward: 800, done: false },
      { id: 4, item: 'plain-satin', need: 1, reward: 1500, done: false },
    ];
  }

  // 修缮：破败→修缮→完工（GDD严格三阶段）
  repairScene(sid: number) {
    const cur = this.sceneRepair[sid] || 0;
    if (cur >= 3) return false;
    const costs = [100, 300, 800];
    if (this.coin < costs[cur]) return false;
    this.coin -= costs[cur];
    this.sceneRepair[sid] = cur + 1;
    this.prestige += 20;
    this.checkUnlock();
    this.onUpdate?.();
    return true;
  }

  checkUnlock() {
    for (const s of SCENES) {
      if (!this.unlockedScenes.includes(s.id) && this.prestige >= s.prestige) {
        this.unlockedScenes.push(s.id);
      }
    }
  }

  getEnergy(type: number) {
    const add = type === 1 ? 20 : 30;
    this.energy = Math.min(this.maxEnergy, this.energy + add);
    this.onUpdate?.();
  }
}

// ============================================================
// 主组件
// ============================================================
type Screen = 'title' | 'story' | 'game';
type Tab = 'home' | 'scene' | 'order' | 'scroll';

export default function App() {
  const [game] = useState(() => new Engine());
  const [, setTick] = useState(0);
  const [screen, setScreen] = useState<Screen>('title');
  const [storyIdx, setStoryIdx] = useState(0);
  const [tab, setTab] = useState<Tab>('home');
  const [fx, setFx] = useState<{ r: number; c: number; lv: number } | null>(null);
  const [toast, setToast] = useState('');
  const [npcDlg, setNpcDlg] = useState<number | null>(null);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => { game.onUpdate = refresh; }, [game, refresh]);

  const msg = (m: string) => {
    setToast(m);
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setToast(''), 2500);
  };

  const onCell = (r: number, c: number) => {
    if (fx) return;
    const res = game.clickCell(r, c);
    refresh();
    if (res.ok && res.fx) {
      setFx(res.fx);
      setTimeout(() => setFx(null), 800);
      const item = ITEMS[Object.keys(ITEMS).find(k => ITEMS[k].level === res.fx!.lv)!];
      msg(`✨ 合成${item?.name || '成功'}！+30铜钱 +2声望`);
    }
  };

  const scene = SCENES.find(s => s.id === game.currentScene)!;

  // ========== 标题画面 ==========
  if (screen === 'title') return (
    <div className="title-screen-v4">
      <div className="title-bg" style={{ backgroundImage: `url(${scene.bg})` }} />
      <div className="title-overlay-v4" />
      <div className="title-content-v4">
        <img src="/assets/characters/shenwan_guibi.png" className="title-shenwan" alt="沈绾" />
        <h1 className="title-text-v4">锦绣古镇</h1>
        <p className="title-sub-v4">汉服织造录</p>
        <p className="title-slogan">织汉服锦绣 · 游万里山河 · 承华夏文脉</p>
        <button className="title-btn-v4" onClick={() => setScreen('story')}>✦ 开启旅程</button>
        <p className="title-ver">大靖王朝 · 山河文旅版</p>
      </div>
    </div>
  );

  // ========== 剧情画面 ==========
  if (screen === 'story') {
    const line = STORY[storyIdx];
    return (
      <div className="story-screen-v4">
        <div className="story-bg" style={{ backgroundImage: `url(${line.bg})` }} />
        <div className="story-overlay-v4" />
        <div className="story-content-v4">
          {line.img && <img src={line.img} className="story-char" alt={line.name} />}
          <div className="story-box">
            <p className="story-name">{line.name}</p>
            <p className="story-txt">{line.text}</p>
          </div>
          <div className="story-btns">
            <button className="story-next" onClick={() => storyIdx < STORY.length - 1 ? setStoryIdx(storyIdx + 1) : setScreen('game')}>
              {storyIdx < STORY.length - 1 ? '▶ 继续' : '▶ 进入绣坊'}
            </button>
            <button className="story-skip" onClick={() => setScreen('game')}>跳过剧情</button>
          </div>
          <div className="story-dots">{STORY.map((_, i) => <span key={i} className={i === storyIdx ? 'on' : ''} />)}</div>
        </div>
      </div>
    );
  }

  // ========== 主游戏 ==========
  return (
    <div className="game-v4">
      {/* 顶部资源栏 */}
      <div className="top-bar-v4">
        <div className="res-group">
          <span className="res">❤️ {game.energy}/{game.maxEnergy}</span>
          <span className="res">🪙 {game.coin}</span>
          <span className="res">💎 {game.silver}</span>
          <span className="res">⭐ {game.prestige}</span>
        </div>
        <button className="energy-btn" onClick={() => { game.getEnergy(1); msg('❤️ 心力已恢复'); }}>+</button>
      </div>

      {/* 场景标题 */}
      <div className="scene-bar" style={{ background: scene.color + '18', borderColor: scene.color + '40' }}>
        <span style={{ color: scene.color }}>📍 {scene.name} · {scene.sub}</span>
      </div>

      {/* 内容区 */}
      <div className="content-v4">

        {/* 绣坊主页 */}
        {tab === 'home' && (
          <div className="home-panel">
            {/* 周庄绣坊全景 */}
            <div className="zhuangxiu-view">
              <img src="/assets/scenes/zhuangxiu_main.jpg" className="zhuangxiu-img" alt="绣坊" />
              <div className="zhuangxiu-overlay" />
              <div className="zhuangxiu-label">
                <span className="zx-name">🏘️ 沈氏绣坊</span>
                <span className="zx-desc">苏南水乡 · 多层沿河而建</span>
              </div>
            </div>

            {/* 合成棋盘 */}
            <div className="board-wrap">
              <div className="board-v4">
                {game.board.map((row, ri) => (
                  <div key={ri} className="board-row-v4">
                    {row.map((cell, ci) => {
                      const sel = game.selected?.r === ri && game.selected?.c === ci;
                      const isFx = fx?.r === ri && fx?.c === ci;
                      const it = cell ? ITEMS[cell] : null;
                      return (
                        <div key={ci} className={`cell-v4 ${sel ? 'sel' : ''} ${isFx ? `fx${it?.level || 1}` : ''} ${!it ? 'empty' : ''}`}
                          onClick={() => onCell(ri, ci)}>
                          {it && <><span className="cell-emoji-v4" style={{ color: it.color }}>{it.emoji}</span>
                            {isFx && <div className="burst">{Array.from({ length: 8 }).map((_, i) => (
                              <span key={i} className="ptcl" style={{ '--a': `${i * 45}deg`, '--c': it.color } as React.CSSProperties} />
                            ))}<span className="fx-txt">合成{it.name}!</span></div>}</>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <p className="hint-v4">{game.selected ? '🔵 点击相同道具进行Merge-2合成' : '👆 点击选中道具，再点同类合成（消耗1心力）'}</p>
          </div>
        )}

        {/* 场景修缮 */}
        {tab === 'scene' && (
          <div className="scene-panel-v4">
            <h3 className="panel-h3">🗺️ 大好河山 · 修缮图鉴</h3>
            {SCENES.map((s) => {
              const unlocked = game.unlockedScenes.includes(s.id);
              const repair = game.sceneRepair[s.id] || 0;
              const stages = ['🏚️ 破败', '🔨 修缮中', '✨ 完工'];
              return (
                <div key={s.id} className={`scene-card-v4 ${!unlocked ? 'locked' : ''} ${game.currentScene === s.id ? 'current' : ''}`}>
                  <img src={s.bg} className="sc-thumb" alt={s.name} />
                  <div className="sc-info">
                    <span className="sc-name" style={{ color: s.color }}>{s.name}</span>
                    <span className="sc-sub">{s.sub} · {s.desc}</span>
                    {unlocked ? (
                      <>
                        <div className="sc-stage">{stages[Math.min(2, repair)]} {repair >= 3 ? '✅' : `(${repair}/3)`}</div>
                        {repair < 3 && (
                          <button className="repair-btn" onClick={() => game.repairScene(s.id) ? msg(`🔨 ${s.name} 修缮进度+1！`) : msg('❌ 铜钱不足')}>
                            修缮 ({[100, 300, 800][repair]}🪙)
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="sc-lock">🔒 需{ s.prestige}声望</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 订单 */}
        {tab === 'order' && (
          <div className="order-panel-v4">
            <h3 className="panel-h3">📜 客商订单</h3>
            {game.orders.map(o => {
              const it = ITEMS[o.item];
              const have = game.count(o.item);
              return (
                <div key={o.id} className={`order-card-v4 ${o.done ? 'done' : ''}`}>
                  <span style={{ color: it.color, fontSize: 28 }}>{it.emoji}</span>
                  <div className="oc-info">
                    <span className="oc-name">{it.name} × {o.need}</span>
                    <span className="oc-have">已有 {have}/{o.need}</span>
                  </div>
                  <span className="oc-reward">🪙 {o.reward}</span>
                  {!o.done ? (
                    <button className={`oc-btn ${have >= o.need ? '' : 'dis'}`} onClick={() => game.deliverOrder(o.id) ? msg(`📜 订单交付！+${o.reward}铜钱`) : msg('❌ 道具不足')}>
                      {have >= o.need ? '交付' : `缺${o.need - have}`}
                    </button>
                  ) : <span className="oc-done">✅</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* 图鉴 */}
        {tab === 'scroll' && (
          <div className="scroll-panel-v4">
            <h3 className="panel-h3">📜 山河锦绣图</h3>
            <div className="scroll-display-v4">
              <img src="/assets/scenes/zhuangxiu_main.jpg" className="scroll-img-v4" alt="山河图" />
              <div className="scroll-progress-v4">
                <p>收集进度：{game.unlockedScenes.length}/7 处胜景</p>
                <div className="scroll-bar"><div className="scroll-fill" style={{ width: `${(game.unlockedScenes.length / 7) * 100}%` }} /></div>
              </div>
            </div>
            <div className="item-gallery">
              <h4>🧵 织造图鉴</h4>
              <div className="gallery-grid">
                {Object.entries(ITEMS).map(([k, v]) => (
                  <div key={k} className="gallery-item">
                    <span style={{ color: v.color, fontSize: 32 }}>{v.emoji}</span>
                    <span className="gi-name">{v.name}</span>
                    <span className="gi-lv">Lv.{v.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NPC对话弹窗 */}
      {npcDlg && NPCS[npcDlg] && (
        <div className="dlg-overlay" onClick={() => setNpcDlg(null)}>
          <div className="dlg-box" onClick={e => e.stopPropagation()}>
            <button className="dlg-close" onClick={() => setNpcDlg(null)}>✕</button>
            <img src={NPCS[npcDlg].img} className="dlg-img" alt={NPCS[npcDlg].name} />
            <h4>{NPCS[npcDlg].name} · {NPCS[npcDlg].title}</h4>
            <p className="dlg-txt">「{NPCS[npcDlg].dialogue}」</p>
            <button className="dlg-btn" onClick={() => setNpcDlg(null)}>告辞</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast-v4">{toast}</div>}

      {/* 底部导航 */}
      <div className="nav-v4">
        <button className={tab === 'home' ? 'on' : ''} onClick={() => setTab('home')}><span>🏘️</span><label>绣坊</label></button>
        <button className={tab === 'scene' ? 'on' : ''} onClick={() => setTab('scene')}><span>🗺️</span><label>山河</label></button>
        <button className={tab === 'order' ? 'on' : ''} onClick={() => setTab('order')}><span>📜</span><label>订单</label>{game.orders.some(o => !o.done && game.count(o.item) >= o.need) && <b className="dot" />}</button>
        <button className={tab === 'scroll' ? 'on' : ''} onClick={() => setTab('scroll')}><span>📜</span><label>图鉴</label></button>
      </div>
    </div>
  );
}

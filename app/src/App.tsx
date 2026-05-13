import { useState, useEffect, useCallback, useRef } from 'react';
import { GameEngine } from './game/GameEngine';
import { SCENES, ORDERS, NPCS } from './game/config';
import { Heart, Coins, Gem, Star, MapPin, Package, BookOpen, ChevronRight, X } from 'lucide-react';
import './App.css';

const SCENE_NAMES = ['', '江南古镇', '泰山', '西湖', '长安古城', '万里长城', '黄山', '青城山'];

export default function App() {
  const [game] = useState(() => new GameEngine());
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<'game' | 'scene' | 'order' | 'collection' | 'npc'>('game');
  const [showDialog, setShowDialog] = useState(false);
  const [dialogText, setDialogText] = useState('');
  const [showComposeEffect, setShowComposeEffect] = useState<{r:number,c:number} | null>(null);
  const [message, setMessage] = useState('');
  const boardRef = useRef<HTMLDivElement>(null);
  const energyTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const genTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    game.onUpdate = refresh;
    // 能量恢复定时器
    energyTimerRef.current = setInterval(() => {
      game.recoverEnergy();
    }, 3000);
    // 生成器定时器
    genTimerRef.current = setInterval(() => {
      game.generateItem();
      refresh();
    }, 6000);
    return () => {
      clearInterval(energyTimerRef.current);
      clearInterval(genTimerRef.current);
    };
  }, [game, refresh]);

  const handleCellClick = (row: number, col: number) => {
    const result = game.selectCell(row, col);
    refresh();
    if (result) {
      setShowComposeEffect({ r: row, c: col });
      setTimeout(() => setShowComposeEffect(null), 500);
      showMessage('合成成功！');
    }
  };

  const handleOrderDeliver = (orderId: number) => {
    game.deliverOrder(orderId);
    showMessage('订单交付成功！');
  };

  // 修缮功能 - 在场景页面中使用
  const _handleRepair = (sceneId: number, stage: number) => {
    if (game.repairScene(sceneId, stage)) {
      showMessage('修缮成功！');
    } else {
      showMessage('铜钱不足！');
    }
  };
  void _handleRepair;

  const handleGetEnergy = (type: number) => {
    game.getEnergy(type);
    showMessage(type === 1 ? '观看广告，心力+20' : '购买成功，心力+30');
  };

  const handleSceneSwitch = (sceneId: number) => {
    if (!game.user.unlockScene.includes(sceneId)) {
      showMessage('场景未解锁，需达到指定声望');
      return;
    }
    game.switchScene(sceneId);
    setActiveTab('game');
    showMessage(`已切换至${SCENE_NAMES[sceneId]}`);
  };

  const handleNpcClick = (npc: typeof NPCS[0]) => {
    setDialogText(npc.dialogue);
    setShowDialog(true);
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
  };

  const sceneBg = game.getSceneBg();

  return (
    <div className="game-container">
      {/* 顶部资源栏 */}
      <div className="resource-bar">
        <div className="res-item">
          <Heart className="res-icon heart" size={18} />
          <span>{game.user.energy}/{game.user.maxEnergy}</span>
          <button className="btn-plus" onClick={() => handleGetEnergy(1)}>+</button>
        </div>
        <div className="res-item">
          <Coins className="res-icon coin" size={18} />
          <span>{game.user.coin}</span>
        </div>
        <div className="res-item">
          <Gem className="res-icon silver" size={18} />
          <span>{game.user.silver}</span>
        </div>
        <div className="res-item">
          <Star className="res-icon prestige" size={18} />
          <span>{game.user.prestige}</span>
        </div>
      </div>

      {/* 主游戏区 */}
      {activeTab === 'game' && (
        <div className="game-board-area">
          {/* 场景标题 */}
          <div className="scene-title-bar">
            <MapPin size={16} />
            <span>{SCENE_NAMES[game.currentScene]}</span>
            <span className="scene-tag">绣坊</span>
          </div>

          {/* 场景背景 */}
          <div className="scene-bg-wrapper">
            <img src={sceneBg} alt="scene" className="scene-bg-img" />
            <div className="scene-overlay" />
          </div>

          {/* 棋盘 */}
          <div className="board-wrapper" ref={boardRef}>
            <div className="game-board">
              {game.board.map((row, ri) => (
                <div key={ri} className="board-row">
                  {row.map((cell, ci) => (
                    <div
                      key={`${ri}-${ci}`}
                      className={`board-cell ${
                        game.selectedCell?.row === ri && game.selectedCell?.col === ci ? 'selected' : ''
                      } ${showComposeEffect?.r === ri && showComposeEffect?.c === ci ? 'compose-effect' : ''}`}
                      onClick={() => handleCellClick(ri, ci)}
                    >
                      {cell ? (
                        <div className="cell-content">
                          <span className="cell-emoji">{cell.icon}</span>
                          <span className="cell-level">Lv.{cell.itemLevel}</span>
                        </div>
                      ) : (
                        <div className="cell-empty" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 操作提示 */}
          <div className="game-hint">
            {!game.selectedCell ? '点击选择道具，再点击相同道具合成' : '已选择，点击相同道具合成'}
          </div>
        </div>
      )}

      {/* 场景页 */}
      {activeTab === 'scene' && (
        <div className="tab-content">
          <h2 className="tab-title">🏔️ 山河游历</h2>
          <div className="scene-list">
            {[1,2,3,4,5,6,7].map(sid => {
              const unlocked = game.user.unlockScene.includes(sid);
              const isCurrent = game.currentScene === sid;
              const sceneConfig = SCENES.find(s => s.sceneId === sid);
              return (
                <div key={sid} className={`scene-card ${unlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`}>
                  <div className="scene-card-bg">
                    <img src={`/assets/scenes/scene_${['','jiangnan','taishan','xihu','changan','greatwall','huangshan','qingcheng'][sid]}.jpg`} alt="" />
                  </div>
                  <div className="scene-card-info">
                    <h3>{SCENE_NAMES[sid]}</h3>
                    <p>解锁声望: {sceneConfig?.unlockPrestige || 0}</p>
                    {unlocked ? (
                      <button className="btn-enter" onClick={() => handleSceneSwitch(sid)}>
                        {isCurrent ? '当前场景' : '进入场景'}
                      </button>
                    ) : (
                      <span className="lock-text">🔒 未解锁</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 订单页 */}
      {activeTab === 'order' && (
        <div className="tab-content">
          <h2 className="tab-title">📜 订单任务</h2>
          <div className="order-tabs">
            <button className="order-tab active">全部</button>
            <button className="order-tab">主线</button>
            <button className="order-tab">日常</button>
          </div>
          <div className="order-list">
            {ORDERS.filter(o => o.sceneId === game.currentScene || o.orderType === 1).map(order => (
              <div key={order.orderId} className="order-card">
                <div className="order-header">
                  <span className={`order-type-badge type-${order.orderType}`}>
                    {order.orderType === 1 ? '主线' : order.orderType === 2 ? '日常' : '名人'}
                  </span>
                  <span className="order-scene">{SCENE_NAMES[order.sceneId]}</span>
                </div>
                <div className="order-require">需求: {order.needItem}</div>
                <div className="order-rewards">
                  <span><Coins size={12} /> {order.rewardCoin}</span>
                  <span><Gem size={12} /> {order.rewardSilver}</span>
                  <span><Star size={12} /> +{order.rewardPrestige}</span>
                </div>
                <button className="btn-deliver" onClick={() => handleOrderDeliver(order.orderId)}>
                  交付
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NPC页 */}
      {activeTab === 'npc' && (
        <div className="tab-content">
          <h2 className="tab-title">👥 历史名人</h2>
          <div className="npc-list">
            {NPCS.map(npc => (
              <div key={npc.npcId} className="npc-card" onClick={() => handleNpcClick(npc)}>
                <img src={`/assets/characters/${npc.npcRes}`} alt={npc.npcName} className="npc-img" />
                <div className="npc-info">
                  <h3>{npc.npcName}</h3>
                  <p className="npc-title">{npc.historyName}</p>
                  <p className="npc-scene">📍 {SCENE_NAMES[npc.sceneId]} · {npc.spotId === 1 ? '岱宗坊' : npc.spotId === 2 ? '岱庙' : npc.spotId === 3 ? '南天门' : '景点'}</p>
                </div>
                <ChevronRight size={20} className="npc-arrow" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 图鉴页 */}
      {activeTab === 'collection' && (
        <div className="tab-content">
          <h2 className="tab-title">📖 山河图鉴</h2>
          <div className="collection-tabs">
            <button className="collection-tab active">景观</button>
            <button className="collection-tab">非遗</button>
            <button className="collection-tab">汉服</button>
            <button className="collection-tab">名人</button>
          </div>
          <div className="collection-grid">
            {game.user.unlockScene.map(sid => (
              <div key={sid} className="collection-card">
                <img src={`/assets/scenes/scene_${['','jiangnan','taishan','xihu','changan','greatwall','huangshan','qingcheng'][sid]}.jpg`} alt="" />
                <span>{SCENE_NAMES[sid]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <div className="bottom-nav">
        <button className={`nav-btn ${activeTab === 'game' ? 'active' : ''}`} onClick={() => setActiveTab('game')}>
          <Package size={22} />
          <span>绣坊</span>
        </button>
        <button className={`nav-btn ${activeTab === 'scene' ? 'active' : ''}`} onClick={() => setActiveTab('scene')}>
          <MapPin size={22} />
          <span>游历</span>
        </button>
        <button className={`nav-btn ${activeTab === 'order' ? 'active' : ''}`} onClick={() => setActiveTab('order')}>
          <BookOpen size={22} />
          <span>订单</span>
        </button>
        <button className={`nav-btn ${activeTab === 'collection' ? 'active' : ''}`} onClick={() => setActiveTab('collection')}>
          <Star size={22} />
          <span>图鉴</span>
        </button>
        <button className={`nav-btn ${activeTab === 'npc' ? 'active' : ''}`} onClick={() => setActiveTab('npc')}>
          <Heart size={22} />
          <span>名人</span>
        </button>
      </div>

      {/* 对话框 */}
      {showDialog && (
        <div className="dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="dialog-box" onClick={e => e.stopPropagation()}>
            <button className="dialog-close" onClick={() => setShowDialog(false)}><X size={20} /></button>
            <p className="dialog-text">{dialogText}</p>
            <button className="dialog-btn" onClick={() => setShowDialog(false)}>继续</button>
          </div>
        </div>
      )}

      {/* 消息提示 */}
      {message && (
        <div className="toast-message">{message}</div>
      )}
    </div>
  );
}

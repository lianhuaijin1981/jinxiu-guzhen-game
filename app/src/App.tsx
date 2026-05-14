import { useState, useEffect, useCallback, useRef } from 'react';
import { GameEngine } from './game/GameEngine';
import { ITEMS, STREETS, SIGN_IN_REWARDS, COMPOSE_EFFECTS, getLevelName } from './game/config';
import type { OfflineReward } from './game/GameEngine';
import {
  Coins, Package, BookOpen, Star, Home, Calendar,
  X, Clock, TrendingUp, CheckCircle,
  Lock, Unlock, ArrowUp, Zap, Award
} from 'lucide-react';
import './App.css';

type Tab = 'game' | 'building' | 'order' | 'task' | 'collection';

export default function App() {
  const [game] = useState(() => new GameEngine());
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('game');
  const [composeEffect, setComposeEffect] = useState<{ r: number; c: number; level: number } | null>(null);
  const [message, setMessage] = useState('');
  const [showOfflineReward, setShowOfflineReward] = useState(false);
  const [offlineReward, setOfflineReward] = useState<OfflineReward | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInReward, setSignInReward] = useState<{ day: number; coin: number; material: number; special?: string } | null>(null);
  // showGuide/guideStep managed by game engine directly
  const [showBuildingDetail, setShowBuildingDetail] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    game.onUpdate = refresh;
    game.onComposeEffect = (r, c, level) => {
      setComposeEffect({ r, c, level });
      setTimeout(() => setComposeEffect(null), 800);
    };
    
    // 检查离线收益
    const reward = game.calcOfflineReward();
    if (reward && reward.hours > 0.1) {
      setOfflineReward(reward);
      setShowOfflineReward(true);
    }
    
    return () => { game.destroy(); };
  }, [game, refresh]);

  const showToast = (msg: string) => {
    setMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setMessage(''), 2000);
  };

  // ===== 棋盘点击 =====
  const handleCellClick = (row: number, col: number) => {
    if (composeEffect) return;
    const result = game.selectCell(row, col);
    refresh();
    if (result.success && result.newLevel) {
      const effect = COMPOSE_EFFECTS[result.newLevel];
      showToast(`${effect?.text || '合成成功'}！+50金币`);
      if (game.guideStep === 0) game.advanceGuide();
    }
  };

  // ===== 交付订单 =====
  const handleDeliverOrder = (orderId: string) => {
    if (game.deliverOrder(orderId)) {
      showToast(`订单交付成功！+金币 +建材`);
      if (game.guideStep === 2) game.advanceGuide();
    } else {
      showToast('道具数量不足，无法交付');
    }
  };

  // ===== 解锁/升级建筑 =====
  const handleUnlockBuilding = (id: string) => {
    if (game.unlockBuilding(id)) {
      showToast('建筑解锁成功！');
      if (game.guideStep === 1) game.advanceGuide();
    } else {
      showToast('资源不足，无法解锁');
    }
    setShowBuildingDetail(null);
  };

  const handleUpgradeBuilding = (id: string) => {
    if (game.upgradeBuilding(id)) {
      showToast('建筑升级成功！收益提升');
    } else {
      showToast('资源不足，无法升级');
    }
    setShowBuildingDetail(null);
  };

  // ===== 离线收益 =====
  const handleClaimOffline = (double: boolean) => {
    game.claimOfflineReward(double);
    setShowOfflineReward(false);
    showToast(double ? '离线收益双倍领取！' : '离线收益已领取！');
    refresh();
  };

  // ===== 签到 =====
  const handleSignIn = () => {
    const reward = game.signIn();
    if (reward) {
      setSignInReward(reward);
      setShowSignIn(true);
    } else {
      showToast('今日已签到');
    }
  };

  // ===== 新手引导 =====
  const handleGuideNext = () => {
    game.advanceGuide();
    // guide state synced via game engine + refresh
    refresh();
  };

  const guideTexts = [
    '点击棋盘上的两个相同道具，合成更高级的风物！',
    '点击「建造」解锁古镇建筑，建筑会持续产出离线收益！',
    '完成订单任务，获取金币和建材奖励！',
    '每天签到和完成任务，领取丰厚奖励！',
  ];

  // ===== 获取建筑状态 =====
  const getBuildingInfo = (id: string) => {
    return game.buildings.find(b => b.id === id)!;
  };

  // ===== 渲染 =====
  return (
    <div className="game-container">
      {/* 顶部资源栏 */}
      <div className="resource-bar">
        <div className="res-left">
          <div className="res-item"><Coins size={16} className="res-icon coin" /><span>{game.coin}</span></div>
          <div className="res-item"><Package size={16} className="res-icon mat" /><span>{game.material}</span></div>
        </div>
        <div className="res-center">
          <span className="town-level">🏘️ 古镇 Lv.{game.townLevel}</span>
        </div>
        <div className="res-right">
          <button className="icon-btn" onClick={handleSignIn} title="签到">
            <Calendar size={18} />
            {!game.signInToday && <span className="dot" />}
          </button>
        </div>
      </div>

      {/* ===== 主游戏区：合成棋盘 ===== */}
      {activeTab === 'game' && (
        <div className="tab-content game-tab">
          {/* 新手引导 */}
          {game.showGuide && (
            <div className="guide-overlay">
              <div className="guide-box">
                <p>{guideTexts[game.guideStep] || guideTexts[0]}</p>
                <button onClick={handleGuideNext}>
                  {game.guideStep >= 3 ? '开始游戏' : '下一步'}
                </button>
              </div>
            </div>
          )}

          {/* 合成棋盘 */}
          <div className="board-area">
            <div className="game-board">
              {game.board.map((row, ri) => (
                <div key={ri} className="board-row">
                  {row.map((cell, ci) => {
                    const isSelected = game.selectedCell?.row === ri && game.selectedCell?.col === ci;
                    const isEffect = composeEffect?.r === ri && composeEffect?.c === ci;
                    const item = cell;
                    return (
                      <div
                        key={`${ri}-${ci}`}
                        className={`board-cell ${isSelected ? 'selected' : ''} ${isEffect ? `effect-lv${item?.level || 1}` : ''} ${!item ? 'empty' : ''}`}
                        onClick={() => handleCellClick(ri, ci)}
                      >
                        {item ? (
                          <>
                            <span className="cell-emoji" style={{ color: item.color }}>
                              {item.icon}
                            </span>
                            <span className="cell-level">{getLevelName(item.level)}</span>
                            {isEffect && (
                              <div className="compose-burst">
                                {Array.from({ length: COMPOSE_EFFECTS[item.level]?.particles || 8 }).map((_, i) => (
                                  <span key={i} className="particle" style={{
                                    '--angle': `${(360 / (COMPOSE_EFFECTS[item.level]?.particles || 8)) * i}deg`,
                                    '--color': item.color,
                                  } as React.CSSProperties} />
                                ))}
                                <span className="compose-text">
                                  {COMPOSE_EFFECTS[item.level]?.text || '合成成功'}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="cell-placeholder" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* 快捷操作栏 */}
          <div className="quick-actions">
            <div className="hint-text">
              {game.selectedCell
                ? '再点击一个相同的道具进行合成'
                : '点击选中道具，再点同类道具合成'}
            </div>
          </div>
        </div>
      )}

      {/* ===== 建造页面 ===== */}
      {activeTab === 'building' && (
        <div className="tab-content">
          <h2 className="tab-title">🏘️ 古镇建造</h2>
          {STREETS.map(street => {
            const sBuildings = game.buildings.filter(b => b.streetId === street.id);
            const allUnlocked = sBuildings.every(b => b.status !== 'locked');
            return (
              <div key={street.id} className="street-section">
                <div className="street-header">
                  <h3>{street.name}</h3>
                  <span className="street-status">
                    {street.id === 's2' && !allUnlocked ? '🔒 需市井街全3级' : ''}
                  </span>
                </div>
                <div className="building-grid">
                  {sBuildings.map(b => (
                    <div
                      key={b.id}
                      className={`building-card ${b.status} visual-${b.visualLevel}`}
                      onClick={() => b.status !== 'locked' ? setShowBuildingDetail(b.id) : null}
                    >
                      <div className="building-icon">
                        {b.status === 'locked' ? <Lock size={24} /> :
                         b.visualLevel >= 5 ? '🏯' : b.visualLevel >= 3 ? '🏠' : '🛖'}
                      </div>
                      <div className="building-name">{b.name}</div>
                      <div className="building-level">{b.status === 'unlocked' ? `${b.level}级` : '未解锁'}</div>
                      {b.status === 'unlocked' && (
                        <div className="building-reward">
                          <Coins size={10} /> {b.offlineReward.coin}/h
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== 订单页面 ===== */}
      {activeTab === 'order' && (
        <div className="tab-content">
          <h2 className="tab-title">📜 客商订单</h2>
          <div className="order-list">
            {game.orders.map(order => {
              const item = ITEMS[order.itemId];
              const hasEnough = game.countItemOnBoard(order.itemId) >= order.itemCount;
              return (
                <div key={order.id} className={`order-card ${order.status === 'completed' ? 'completed' : ''}`}>
                  <div className="order-item">
                    <span className="order-icon" style={{ color: item?.color }}>{item?.icon}</span>
                    <span className="order-name">{item?.itemName} × {order.itemCount}</span>
                  </div>
                  <div className="order-rewards">
                    <span><Coins size={12} /> {order.rewardCoin}</span>
                    <span><Package size={12} /> {order.rewardMaterial}</span>
                  </div>
                  {order.status === 'active' ? (
                    <button
                      className={`btn-deliver ${hasEnough ? '' : 'disabled'}`}
                      onClick={() => hasEnough && handleDeliverOrder(order.id)}
                    >
                      {hasEnough ? '交付' : `缺${order.itemCount - game.countItemOnBoard(order.itemId)}个`}
                    </button>
                  ) : (
                    <span className="order-done">已完成</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== 任务页面 ===== */}
      {activeTab === 'task' && (
        <div className="tab-content">
          <h2 className="tab-title">📋 每日任务</h2>
          <div className="task-list">
            {game.dailyTasks.map(task => (
              <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
                <div className="task-info">
                  <div className="task-title">{task.title}</div>
                  <div className="task-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(100, (task.current / task.target) * 100)}%` }} />
                    </div>
                    <span>{task.current}/{task.target}</span>
                  </div>
                </div>
                <div className="task-reward">
                  <span><Coins size={12} /> {task.rewardCoin}</span>
                  <span><Package size={12} /> {task.rewardMaterial}</span>
                </div>
                {task.completed && <CheckCircle size={20} className="task-done-icon" />}
              </div>
            ))}
          </div>

          <h2 className="tab-title" style={{ marginTop: 24 }}>📖 风物图鉴</h2>
          <div className="collection-grid">
            {Object.values(ITEMS).filter(i => i.level > 0).map(item => {
              const discovered = game.composeCount > 0; // 简化：只要有合成记录就显示
              return (
                <div key={item.itemId} className={`collection-item ${discovered ? 'discovered' : 'undiscovered'}`}>
                  <span className="collection-icon" style={{ color: discovered ? item.color : '#ccc' }}>
                    {discovered ? item.icon : '?'}
                  </span>
                  <span className="collection-name">{discovered ? item.itemName : '???'}</span>
                  <span className="collection-level">{discovered ? getLevelName(item.level) : '未解锁'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== 图鉴/设置页面 ===== */}
      {activeTab === 'collection' && (
        <div className="tab-content">
          <h2 className="tab-title">🏆 成就统计</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <Zap size={24} className="stat-icon" />
              <span className="stat-value">{game.composeCount}</span>
              <span className="stat-label">合成次数</span>
            </div>
            <div className="stat-card">
              <BookOpen size={24} className="stat-icon" />
              <span className="stat-value">{game.orderCount}</span>
              <span className="stat-label">完成订单</span>
            </div>
            <div className="stat-card">
              <Home size={24} className="stat-icon" />
              <span className="stat-value">{game.buildCount}</span>
              <span className="stat-label">解锁建筑</span>
            </div>
            <div className="stat-card">
              <TrendingUp size={24} className="stat-icon" />
              <span className="stat-value">{game.townLevel}</span>
              <span className="stat-label">古镇等级</span>
            </div>
          </div>

          <h2 className="tab-title" style={{ marginTop: 24 }}>🏘️ 建筑图鉴</h2>
          <div className="collection-grid">
            {game.buildings.map(b => (
              <div key={b.id} className={`collection-item ${b.status !== 'locked' ? 'discovered' : 'undiscovered'}`}>
                <span className="collection-icon">
                  {b.status !== 'locked'
                    ? (b.visualLevel >= 5 ? '🏯' : b.visualLevel >= 3 ? '🏠' : '🛖')
                    : '🔒'}
                </span>
                <span className="collection-name">{b.status !== 'locked' ? b.name : '???'}</span>
                <span className="collection-level">
                  {b.status !== 'locked' ? `${b.streetName} · ${b.level}级` : '未解锁'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== 底部导航 ===== */}
      <div className="bottom-nav">
        <button className={`nav-btn ${activeTab === 'game' ? 'active' : ''}`} onClick={() => setActiveTab('game')}>
          <Zap size={22} />
          <span>合成</span>
        </button>
        <button className={`nav-btn ${activeTab === 'building' ? 'active' : ''}`} onClick={() => setActiveTab('building')}>
          <Home size={22} />
          <span>建造</span>
        </button>
        <button className={`nav-btn ${activeTab === 'order' ? 'active' : ''}`} onClick={() => setActiveTab('order')}>
          <BookOpen size={22} />
          <span>订单</span>
        </button>
        <button className={`nav-btn ${activeTab === 'task' ? 'active' : ''}`} onClick={() => setActiveTab('task')}>
          <Award size={22} />
          <span>任务</span>
        </button>
        <button className={`nav-btn ${activeTab === 'collection' ? 'active' : ''}`} onClick={() => setActiveTab('collection')}>
          <Star size={22} />
          <span>成就</span>
        </button>
      </div>

      {/* ===== 离线收益弹窗 ===== */}
      {showOfflineReward && offlineReward && (
        <div className="modal-overlay">
          <div className="modal-box offline-box">
            <h3>🌙 离线收益</h3>
            <p className="offline-time">离线 {offlineReward.hours.toFixed(1)} 小时</p>
            <div className="offline-rewards">
              <div className="offline-reward-item"><Coins size={16} /> +{offlineReward.coin} 金币</div>
              {offlineReward.pottery > 0 && <div className="offline-reward-item">🏺 +{offlineReward.pottery} 陶罐</div>}
              {offlineReward.umbrella > 0 && <div className="offline-reward-item">☂️ +{offlineReward.umbrella} 油纸伞</div>}
              {offlineReward.fan > 0 && <div className="offline-reward-item">🪭 +{offlineReward.fan} 折扇</div>}
              {offlineReward.embroidery > 0 && <div className="offline-reward-item">🧵 +{offlineReward.embroidery} 刺绣</div>}
              {offlineReward.material1 > 0 && <div className="offline-reward-item">🧱 +{offlineReward.material1} 初级建材</div>}
              {offlineReward.material2 > 0 && <div className="offline-reward-item">🪨 +{offlineReward.material2} 中级建材</div>}
            </div>
            <div className="offline-buttons">
              <button className="btn-normal" onClick={() => handleClaimOffline(false)}>
                领取
              </button>
              <button className="btn-ad" onClick={() => handleClaimOffline(true)}>
                📺 看广告 ×2领取
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 签到弹窗 ===== */}
      {showSignIn && signInReward && (
        <div className="modal-overlay">
          <div className="modal-box signin-box">
            <button className="modal-close" onClick={() => setShowSignIn(false)}><X size={20} /></button>
            <h3>📅 第{game.signInDay}天签到</h3>
            <div className="signin-rewards">
              <div className="signin-item"><Coins size={20} /> +{signInReward.coin} 金币</div>
              <div className="signin-item"><Package size={20} /> +{signInReward.material} 建材</div>
              {signInReward.special && <div className="signin-special">🎁 {signInReward.special}</div>}
            </div>
            <button className="btn-primary" onClick={() => setShowSignIn(false)}>收下</button>
            
            <div className="signin-calendar">
              {SIGN_IN_REWARDS.map((r, i) => (
                <div key={i} className={`calendar-day ${i + 1 === game.signInDay ? 'today' : ''} ${i + 1 < game.signInDay ? 'past' : ''}`}>
                  <span className="day-num">{i + 1}天</span>
                  <span className="day-reward"><Coins size={10} />{r.coin}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== 建筑详情弹窗 ===== */}
      {showBuildingDetail && (() => {
        const b = getBuildingInfo(showBuildingDetail);
        const canUpgrade = b.level < b.maxLevel;
        const upCost = b.level > 0 ? game.getUpgradeCost(b) : null;
        return (
          <div className="modal-overlay" onClick={() => setShowBuildingDetail(null)}>
            <div className="modal-box building-box" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowBuildingDetail(null)}><X size={20} /></button>
              <h3>{b.visualLevel >= 5 ? '🏯' : b.visualLevel >= 3 ? '🏠' : '🛖'} {b.name}</h3>
              <p className="building-desc">{b.desc}</p>
              <p className="building-street">📍 {b.streetName} · 等级 {b.level}/{b.maxLevel}</p>
              
              {b.offlineReward.coin > 0 && (
                <div className="building-offline">
                  <Clock size={14} /> 离线收益: {b.offlineReward.coin}金币/h
                  {b.offlineReward.items.map((item, i) => (
                    <span key={i}> +{item.count}{ITEMS[item.id]?.icon}</span>
                  ))}
                </div>
              )}
              {b.specialEffect && <p className="building-special">✨ {b.specialEffect}</p>}
              
              <div className="building-actions">
                {b.status === 'locked' && b.unlockCost && (
                  <button
                    className={`btn-primary ${game.coin < b.unlockCost.coin || game.material < b.unlockCost.material ? 'disabled' : ''}`}
                    onClick={() => handleUnlockBuilding(b.id)}
                  >
                    <Unlock size={14} /> 解锁 ({b.unlockCost.coin}💰 {b.unlockCost.material}🧱)
                  </button>
                )}
                {b.status === 'unlocked' && canUpgrade && upCost && (
                  <button
                    className={`btn-primary ${game.coin < upCost.coin || game.material < upCost.material ? 'disabled' : ''}`}
                    onClick={() => handleUpgradeBuilding(b.id)}
                  >
                    <ArrowUp size={14} /> 升级 ({upCost.coin}💰 {upCost.material}🧱)
                  </button>
                )}
                {b.status === 'unlocked' && !canUpgrade && (
                  <span className="max-level">🏆 已满级</span>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== Toast消息 ===== */}
      {message && <div className="toast-message">{message}</div>}
    </div>
  );
}

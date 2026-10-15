/**
 * 诗阵 · 词语炸弹联机模块（PeerJS / WebRTC P2P）
 * 房主浏览器即主机：掌握炸弹词、运行 BombGame、广播状态
 * 客人：加入房间、发送词语、接收状态
 * 依赖：PeerJS（index.html 中从 CDN 引入）
 */

const ROOM_PREFIX = 'shizhen-bomb-';

function genRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混字符
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/* ============ 主机（房主） ============ */
class BombHost {
  constructor(hostName, onEvent) {
    this.hostName = hostName;
    this.onEvent = onEvent; // (event, payload) => void
    this.peer = null;
    this.roomCode = '';
    this.guests = [];   // {id, name, conn, online}
    this.aiCount = 0;
    this.game = null;
  }

  create() {
    return new Promise((resolve, reject) => {
      if (typeof Peer === 'undefined') {
        reject(new Error('联机组件未加载，请检查网络后刷新'));
        return;
      }
      const tryCreate = () => {
        const code = genRoomCode();
        const peer = new Peer(ROOM_PREFIX + code, { debug: 1 });
        let settled = false;

        peer.on('open', () => {
          if (settled) return;
          settled = true;
          this.peer = peer;
          this.roomCode = code;
          this.bindGuestConnections();
          resolve(code);
        });
        peer.on('error', (err) => {
          // 房间号冲突时换号重试
          if (!settled && (err.type === 'unavailable-id' || err.type === 'id-unavailable')) {
            tryCreate();
          } else if (!settled) {
            settled = true;
            reject(new Error('无法连接信令服务器，请检查网络：' + err.type));
          } else {
            this.onEvent('net-error', err);
          }
        });
      };
      tryCreate();
    });
  }

  bindGuestConnections() {
    this.peer.on('connection', (conn) => {
      conn.on('open', () => {
        conn.on('data', (data) => this.onGuestMessage(conn, data));
        conn.on('close', () => this.onGuestLeave(conn));
      });
      conn.on('error', () => this.onGuestLeave(conn));
    });
  }

  onGuestMessage(conn, msg) {
    if (!msg || !msg.type) return;
    if (msg.type === 'hello') {
      // 同名加序号
      let name = String(msg.name || '玩家').slice(0, 8);
      const exists = new Set([this.hostName, ...this.guests.map(g => g.name)]);
      let n = 2;
      while (exists.has(name)) { name = name + n; n++; }
      this.guests.push({ id: conn.peer, name, conn, online: true });
      this.broadcastLobby();
    } else if (msg.type === 'submit') {
      if (this.game && !this.game.gameOver) {
        const r = this.game.injectSubmit(conn.peer, String(msg.text || ''));
        if (!r.ok) {
          try { conn.send({ type: 'reject', msg: r.msg }); } catch (e) {}
        }
      }
    }
  }

  onGuestLeave(conn) {
    const g = this.guests.find(x => x.conn === conn);
    if (g) g.online = false;
    // 大厅阶段直接移除；游戏中保留座位，其回合超时会判负
    if (!this.game) {
      this.guests = this.guests.filter(x => x.conn !== conn);
      this.broadcastLobby();
    } else {
      this.broadcastState();
    }
  }

  addAI() {
    if (this.aiCount >= 6) return;
    this.aiCount++;
    this.broadcastLobby();
  }

  removeAI() {
    if (this.aiCount > 0) this.aiCount--;
    this.broadcastLobby();
  }

  lobbySeats() {
    const seats = [{ id: 'host', name: this.hostName, isLocal: true }];
    for (const g of this.guests) seats.push({ id: g.id, name: g.name, online: g.online });
    for (let i = 0; i < this.aiCount; i++) {
      seats.push({ id: 'ai' + i, name: AI_NAMES[i] || ('AI' + (i + 1)), isAI: true });
    }
    return seats;
  }

  broadcastLobby() {
    this.emit('lobby', { roomCode: this.roomCode, seats: this.lobbySeats() });
    this.broadcast({ type: 'lobby', roomCode: this.roomCode, seats: this.lobbySeats() });
  }

  /** 房主开始游戏 */
  startGame(timeLimit = 30) {
    if (this.lobbySeats().length < 2) return false;
    const seats = this.lobbySeats().map(s => ({
      id: s.id, name: s.name, isAI: !!s.isAI,
      isLocal: s.id === 'host'
    }));
    this.game = new BombGame({ kind: 'word', seats, timeLimit, hostDriven: true });
    this.game.onStateChange = (state) => {
      this.emit('state', state);
      this.broadcastState();
    };
    this.game.onGameOver = () => {
      this.broadcastState();
    };
    this.game.start();
    return true;
  }

  localSubmit(text) {
    if (this.game) this.game.localSubmit(text);
  }

  broadcastState() {
    if (!this.game) return;
    this.broadcast({ type: 'state', state: this.game.getState() });
  }

  restart() {
    this.game = null;
    this.broadcast({ type: 'restart' });
    this.broadcastLobby();
  }

  broadcast(msg) {
    for (const g of this.guests) {
      if (g.conn && g.conn.open) {
        try { g.conn.send(msg); } catch (e) {}
      }
    }
  }

  emit(type, payload) {
    if (this.onEvent) this.onEvent(type, payload);
  }

  destroy() {
    try { this.broadcast({ type: 'host-closed' }); } catch (e) {}
    if (this.peer) this.peer.destroy();
    this.peer = null;
  }
}

/* ============ 客人（加入者） ============ */
class BombGuest {
  constructor(playerName, onEvent) {
    this.playerName = playerName;
    this.onEvent = onEvent;
    this.peer = null;
    this.conn = null;
    this.myId = null;
  }

  join(roomCode) {
    return new Promise((resolve, reject) => {
      if (typeof Peer === 'undefined') {
        reject(new Error('联机组件未加载，请检查网络后刷新'));
        return;
      }
      const code = String(roomCode).toUpperCase().trim();
      if (code.length !== 4) { reject(new Error('房间号为 4 位')); return; }

      const peer = new Peer({ debug: 1 });
      const timer = setTimeout(() => {
        peer.destroy();
        reject(new Error('连接超时，请确认房间号正确且房主在线'));
      }, 15000);

      peer.on('open', (id) => {
        this.myId = id;
        const conn = peer.connect(ROOM_PREFIX + code, { reliable: true });
        this.conn = conn;

        conn.on('open', () => {
          clearTimeout(timer);
          conn.send({ type: 'hello', name: this.playerName });
          resolve();
        });
        conn.on('data', (data) => this.onMessage(data));
        conn.on('close', () => this.onEvent('host-closed', {}));
        conn.on('error', () => {
          clearTimeout(timer);
          reject(new Error('无法加入房间'));
        });
      });
      peer.on('error', (err) => {
        clearTimeout(timer);
        if (err.type === 'peer-unavailable') {
          reject(new Error('房间不存在或房主已关闭'));
        } else {
          reject(new Error('网络错误：' + err.type));
        }
      });
      this.peer = peer;
    });
  }

  onMessage(msg) {
    if (!msg || !msg.type) return;
    if (msg.type === 'lobby') this.onEvent('lobby', msg);
    else if (msg.type === 'state') this.onEvent('state', msg.state);
    else if (msg.type === 'restart') this.onEvent('restart', {});
    else if (msg.type === 'reject') this.onEvent('reject', msg);
    else if (msg.type === 'host-closed') this.onEvent('host-closed', {});
  }

  submit(text) {
    if (this.conn && this.conn.open) this.conn.send({ type: 'submit', text });
  }

  destroy() {
    if (this.peer) this.peer.destroy();
    this.peer = null;
  }
}

/** AI 玩家名字（诗词味） */
const AI_NAMES = ["子衿", "采葛", "蒹葭", "木兮", "白露", "青衿"];

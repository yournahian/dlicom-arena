import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;
const TICK_RATE = 30; // 30Hz authoritative loop
const TICK_INTERVAL = 1000 / TICK_RATE;

// Serve public directory
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/health', (req, res) => res.json({ status: 'healthy', version: '2.5.0' }));
app.get('/healthz', (req, res) => res.status(200).send('OK'));

// Helper random room code generator (e.g. "CBR7")
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Bot Name Pool
const BOT_NAMES = [
  'VoxelGhost', 'CyberNova', 'GlitchBite', 'ApexDrone', 'ByteRipper',
  'PulsePhantom', 'VectorZero', 'ShadowBot', 'TitanCore', 'ChronoUnit',
  'AeroStrike', 'HexViper', 'NeonReaper', 'Spectre9', 'LaserUnit'
];

// Mascot AI Bots for Battle Royale 10-Combatant Roster
const BR_BOT_NAMES = [
  'Bot_Alpha', 'Bot_Bravo', 'Bot_Charlie', 'Bot_Delta', 'Bot_Echo',
  'Bot_Foxtrot', 'Bot_Golf', 'Bot_Hotel', 'Bot_India', 'Bot_Juliet'
];

// Weapon Definitions (5 Distinct Weapons)
const WEAPONS = {
  ar: { name: 'Pulse Blaster', damage: 22, headMult: 2.0, fireRateMs: 100, magSize: 30, maxAmmo: 120, reloadMs: 1400, spread: 0.02 },
  shotgun: { name: 'Voxel Shotgun', damage: 11, pellets: 8, headMult: 1.5, fireRateMs: 750, magSize: 6, maxAmmo: 36, reloadMs: 1800, spread: 0.08 },
  sniper: { name: 'Cyber Sniper', damage: 90, headMult: 2.0, fireRateMs: 1200, magSize: 5, maxAmmo: 20, reloadMs: 2200, spread: 0.003 },
  smg: { name: 'Neon SMG', damage: 14, headMult: 2.0, fireRateMs: 63, magSize: 35, maxAmmo: 140, reloadMs: 1200, spread: 0.035 },
  pistol: { name: 'Plasma Pistol', damage: 28, headMult: 2.0, fireRateMs: 180, magSize: 12, maxAmmo: 60, reloadMs: 1100, spread: 0.015 }
};

function createDefaultAmmo() {
  return {
    ar: { mag: WEAPONS.ar.magSize, reserve: WEAPONS.ar.maxAmmo },
    shotgun: { mag: WEAPONS.shotgun.magSize, reserve: WEAPONS.shotgun.maxAmmo },
    sniper: { mag: WEAPONS.sniper.magSize, reserve: WEAPONS.sniper.maxAmmo },
    smg: { mag: WEAPONS.smg.magSize, reserve: WEAPONS.smg.maxAmmo },
    pistol: { mag: WEAPONS.pistol.magSize, reserve: WEAPONS.pistol.maxAmmo }
  };
}

// Medic & Healing Items Specs
const MEDIC_ITEMS = {
  bandage: { name: 'Nanite Bandage', useTimeMs: 2000, healHp: 20, maxCapHp: 75, maxCarry: 5 },
  medkit: { name: 'Cyber Medkit', useTimeMs: 4000, fullHeal: true, maxCarry: 3 },
  shield_battery: { name: 'Shield Battery', useTimeMs: 2500, shieldAp: 50, maxCarry: 3 }
};

// Power-up spawn templates (Health, Ammo, Speed, and Armor Vest)
const POWERUP_TEMPLATES = [
  { id: 'hp_center', type: 'health', x: 0, y: 4.2, z: 0, respawnSec: 16 },
  { id: 'hp_south', type: 'health', x: 0, y: 1.0, z: -32, respawnSec: 16 },
  { id: 'armor_north', type: 'armor', x: 0, y: 1.0, z: 32, respawnSec: 20 },
  { id: 'ammo_east', type: 'ammo', x: 26, y: 1.0, z: 0, respawnSec: 12 },
  { id: 'ammo_west', type: 'ammo', x: -26, y: 1.0, z: 0, respawnSec: 12 },
  { id: 'speed_ne', type: 'speed', x: 22, y: 1.0, z: 22, respawnSec: 20 },
  { id: 'speed_sw', type: 'speed', x: -22, y: 1.0, z: -22, respawnSec: 20 }
];

// Jump-pads configuration
const JUMP_PADS = [
  { id: 'jp_north', x: 0, y: 0.0, z: 24, boostY: 18, boostX: 0, boostZ: -14 },
  { id: 'jp_south', x: 0, y: 0.0, z: -24, boostY: 18, boostX: 0, boostZ: 14 },
  { id: 'jp_east', x: 24, y: 0.0, z: 0, boostY: 18, boostX: -14, boostZ: 0 },
  { id: 'jp_west', x: -24, y: 0.0, z: 0, boostY: 18, boostX: 14, boostZ: 0 }
];

// Spawn Points
const SPAWN_POINTS = {
  tdm: {
    blue: [
      { x: -26, y: 0.0, z: 24 }, { x: -22, y: 0.0, z: 26 },
      { x: -30, y: 0.0, z: 20 }, { x: -24, y: 0.0, z: 30 }
    ],
    red: [
      { x: 26, y: 0.0, z: -24 }, { x: 22, y: 0.0, z: -26 },
      { x: 30, y: 0.0, z: -20 }, { x: 24, y: 0.0, z: -30 }
    ]
  },
  br: [
    { x: -30, y: 0.0, z: -30 }, { x: 30, y: 0.0, z: -30 },
    { x: -30, y: 0.0, z: 30 },  { x: 30, y: 0.0, z: 30 },
    { x: 0, y: 0.0, z: -36 },    { x: 0, y: 0.0, z: 36 },
    { x: -36, y: 0.0, z: 0 },    { x: 36, y: 0.0, z: 0 },
    { x: -16, y: 0.0, z: -16 },  { x: 16, y: 0.0, z: 16 }
  ]
};

// Ground Height Query for Cyber Arena (Floor, Platforms & Ramps per Map)
function getArenaGroundHeight(x, z, currentY = 0, mapId = 'warehouse') {
  let groundY = 0.0;
  if (mapId === 'vault') {
    // Central core platform bounds: x in [-10.5, 10.5], z in [-10.5, 10.5] at y = 2.5
    if (x >= -10.5 && x <= 10.5 && z >= -10.5 && z <= 10.5) {
      if (currentY >= 1.8 || currentY === undefined) groundY = 2.5;
    }
    // High quantum bridge at y = 5.5
    if (Math.abs(z) <= 3.0 && Math.abs(x) <= 26) {
      if (currentY >= 4.0 || currentY === undefined) groundY = 5.5;
    }
  } else if (mapId === 'rooftops') {
    // Helipad bounds: x in [-11.2, 11.2], z in [-11.2, 11.2] at y = 3.2
    if (x >= -11.2 && x <= 11.2 && z >= -11.2 && z <= 11.2) {
      if (currentY >= 2.0 || currentY === undefined) groundY = 3.2;
    }
    // Skybridge bounds at y = 5.2
    if ((Math.abs(x) <= 2.6 && Math.abs(z) <= 18) || (Math.abs(z) <= 2.6 && Math.abs(x) <= 18)) {
      if (currentY >= 4.0 || currentY === undefined) groundY = 5.2;
    }
  } else {
    // Warehouse: Central elevated catwalk platform (y = 4.0 surface, bounds x in [-16.2, 16.2], z in [-7.2, 7.2])
    if (x >= -16.2 && x <= 16.2 && z >= -7.2 && z <= 7.2) {
      if (currentY >= 2.8 || currentY === undefined) {
        groundY = 4.0;
      }
    }
    // North Ramp (from z = 16.5 at ground y = 0 to z = 5.5 at catwalk y = 4.0)
    if (x >= -3.2 && x <= 3.2 && z >= 5.5 && z <= 16.5) {
      const rampY = ((16.5 - z) / 11.0) * 4.0;
      groundY = Math.max(groundY, rampY);
    }
    // South Ramp (from z = -16.5 at ground y = 0 to z = -5.5 at catwalk y = 4.0)
    if (x >= -3.2 && x <= 3.2 && z >= -16.5 && z <= -5.5) {
      const rampY = ((z - (-16.5)) / 11.0) * 4.0;
      groundY = Math.max(groundY, rampY);
    }
  }
  return groundY;
}

// Procedural Interactive Ground Loot Generator for Battle Royale (Floors, Containers, Catwalks)
function generateGroundLoot(mapId = 'warehouse') {
  const lootList = [];
  const coords = [
    { x: 0, z: 0 },
    { x: -10, z: -10 }, { x: 10, z: 10 },
    { x: -12, z: 12 },  { x: 12, z: -12 },
    { x: -22, z: 0 },   { x: 22, z: 0 },
    { x: 0, z: -22 },   { x: 0, z: 22 },
    { x: -28, z: -26 }, { x: 28, z: 26 },
    { x: -26, z: 28 },  { x: 26, z: -28 },
    { x: -18, z: -14 }, { x: 18, z: 14 },
    { x: -6, z: 18 }
  ]; // Exactly 16 scattered loot positions
  const itemDefs = [
    { type: 'weapon', weaponType: 'ar', name: 'Pulse Blaster' },
    { type: 'weapon', weaponType: 'shotgun', name: 'Voxel Shotgun' },
    { type: 'weapon', weaponType: 'sniper', name: 'Cyber Sniper' },
    { type: 'weapon', weaponType: 'smg', name: 'Neon SMG' },
    { type: 'ammo', name: 'Ammo Crate (+60 Ammo)' },
    { type: 'medkit', name: 'Cyber Medkit (+100 HP)' },
    { type: 'armor', name: 'Armor Vest (+50 AP)' }
  ];

  coords.forEach((c, idx) => {
    const item = itemDefs[idx % itemDefs.length];
    const groundY = getArenaGroundHeight(c.x, c.z, 0, mapId);
    lootList.push({
      id: `loot_${idx}_${Date.now()}`,
      x: c.x,
      y: Number((groundY + 0.45).toFixed(2)),
      z: c.z,
      type: item.type,
      weaponType: item.weaponType || null,
      name: item.name
    });
  });
  return lootList;
}

// Solid Map Obstacles for Bot Navigation, Collision Avoidance, and Ballistic Line-of-Sight Occlusion
const SERVER_OBSTACLE_BOXES = {
  warehouse: [
    // Shipping containers: { x: -18, z: -14, w: 6, d: 12 }, { x: 18, z: 14, w: 6, d: 12 }, etc.
    { minX: -21.6, maxX: -14.4, minZ: -20.6, maxZ: -7.4 },
    { minX: 14.4, maxX: 21.6, minZ: 7.4, maxZ: 20.6 },
    { minX: -25.6, maxX: -18.4, minZ: 9.4, maxZ: 22.6 },
    { minX: 18.4, maxX: 25.6, minZ: -22.6, maxZ: -9.4 },
    // Server towers: { x: ±28, z: ±28, w: 4, d: 4 }
    { minX: -30.6, maxX: -25.4, minZ: -30.6, maxZ: -25.4 },
    { minX: 25.4, maxX: 30.6, minZ: -30.6, maxZ: -25.4 },
    { minX: -30.6, maxX: -25.4, minZ: 25.4, maxZ: 30.6 },
    { minX: 25.4, maxX: 30.6, minZ: 25.4, maxZ: 30.6 },
    // Central Catwalk Solid Core Platform (Blocks shots across warehouse center)
    { minX: -16.5, maxX: 16.5, minZ: -7.5, maxZ: 7.5 }
  ],
  vault: [
    // Central Dais & Quantum Reactor Core (Blocks shots across vault center)
    { minX: -11.0, maxX: 11.0, minZ: -11.0, maxZ: 11.0 },
    // 8 Server monoliths
    { minX: -20.6, maxX: -15.4, minZ: -22.6, maxZ: -13.4 },
    { minX: 15.4, maxX: 20.6, minZ: 13.4, maxZ: 22.6 },
    { minX: -20.6, maxX: -15.4, minZ: 13.4, maxZ: 22.6 },
    { minX: 15.4, maxX: 20.6, minZ: -22.6, maxZ: -13.4 },
    { minX: -30.6, maxX: -25.4, minZ: -5.6, maxZ: 5.6 },
    { minX: 25.4, maxX: 30.6, minZ: -5.6, maxZ: 5.6 },
    { minX: -5.6, maxX: 5.6, minZ: -30.6, maxZ: -25.4 },
    { minX: -5.6, maxX: 5.6, minZ: 25.4, maxZ: 30.6 },
    // 4 Energy containment towers: { x: ±7, z: ±7, w: 1.8, d: 1.8 }
    { minX: -8.2, maxX: -5.8, minZ: -8.2, maxZ: -5.8 },
    { minX: 5.8, maxX: 8.2, minZ: -8.2, maxZ: -5.8 },
    { minX: -8.2, maxX: -5.8, minZ: 5.8, maxZ: 8.2 },
    { minX: 5.8, maxX: 8.2, minZ: 5.8, maxZ: 8.2 }
  ],
  rooftops: [
    // Twin penthouse towers
    { minX: -8.5, maxX: 8.5, minZ: -34.5, maxZ: -21.5 },
    { minX: -8.5, maxX: 8.5, minZ: 21.5, maxZ: 34.5 },
    // Central Helipad Base Structure
    { minX: -12.0, maxX: 12.0, minZ: -12.0, maxZ: 12.0 },
    // HVAC chiller duct units
    { minX: -19.0, maxX: -13.0, minZ: -16.0, maxZ: -8.0 },
    { minX: 13.0, maxX: 19.0, minZ: 8.0, maxZ: 16.0 },
    { minX: -20.0, maxX: -12.0, minZ: 9.0, maxZ: 15.0 },
    { minX: 12.0, maxX: 20.0, minZ: -15.0, maxZ: -9.0 },
    { minX: -27.5, maxX: -20.5, minZ: -2.5, maxZ: 2.5 },
    { minX: 20.5, maxX: 27.5, minZ: -2.5, maxZ: 2.5 },
    // Crane mast
    { minX: -25.5, maxX: -22.5, minZ: -25.5, maxZ: -22.5 }
  ]
};

function checkBotObstacleCollision(x, z, r = 0.6, mapId = 'warehouse') {
  const boxes = SERVER_OBSTACLE_BOXES[mapId] || SERVER_OBSTACLE_BOXES.warehouse;
  for (const b of boxes) {
    if (x + r > b.minX && x - r < b.maxX && z + r > b.minZ && z - r < b.maxZ) {
      return true;
    }
  }
  return false;
}

// 2D Ray-AABB intersection test for ballistic line-of-sight occlusion
function checkLineOfSight(x1, z1, x2, z2, mapId = 'warehouse') {
  const boxes = SERVER_OBSTACLE_BOXES[mapId] || SERVER_OBSTACLE_BOXES.warehouse;
  const dx = x2 - x1;
  const dz = z2 - z1;

  for (const b of boxes) {
    let tmin = 0;
    let tmax = 1;

    if (Math.abs(dx) > 1e-6) {
      let t1 = (b.minX - x1) / dx;
      let t2 = (b.maxX - x1) / dx;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    } else if (x1 < b.minX || x1 > b.maxX) {
      continue;
    }

    if (Math.abs(dz) > 1e-6) {
      let t1 = (b.minZ - z1) / dz;
      let t2 = (b.maxZ - z1) / dz;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    } else if (z1 < b.minZ || z1 > b.maxZ) {
      continue;
    }

    // Intersects obstacle: Line of sight blocked!
    return false;
  }
  return true;
}

// Rooms Registry
const rooms = new Map();

class GameRoom {
  constructor(options) {
    this.id = options.id;
    this.name = options.name || `Arena ${this.id}`;
    this.mode = options.mode || 'tdm'; // 'tdm' or 'br'
    this.mapId = options.mapId || 'warehouse'; // 'warehouse', 'vault', 'rooftops'
    this.password = options.password || '';
    this.isPublic = !this.password;
    this.fillBots = options.fillBots !== undefined ? options.fillBots : true;
    this.status = 'staging'; // 'staging', 'in_progress', 'ended'
    this.hostId = options.hostId;
    this.createdAt = Date.now();

    // Combatant entities: map of socket.id or botId -> Entity
    this.players = new Map();
    this.bots = new Map();

    // Mode-specific game state
    this.maxPlayers = this.mode === 'tdm' ? 8 : 10;
    this.teamScores = { blue: 0, red: 0 };
    this.tdmTargetKills = 40;
    this.matchDurationSec = 300; // 5:00
    this.timeRemainingSec = this.matchDurationSec;
    this.winner = null;
    this.matchStartTime = 0;

    // Battle Royale State Machine: LOBBY_WAITING -> COUNTDOWN -> AIRDROP_DROP -> ACTIVE_COMBAT -> MATCH_OVER
    this.brState = 'LOBBY_WAITING';
    this.brCountdownSec = 15;
    this.brCountdownTimer = 0;
    this.airdropElapsed = 0;

    // Battle Royale Dynamic Safe Zone (The Blue Zone)
    this.safeZone = {
      currentCenter: { x: 0, z: 0 },
      currentRadius: 100, // Starts covering full map
      targetCenter: { x: 0, z: 0 },
      targetRadius: 100,
      shrinkSpeed: 0, // units per second
      phase: 0, // 3 Total Shrink Phases
      phaseTimer: 40, // Seconds before shrinking begins
      isShrinking: false,
      shrinkDuration: 25,
      shrinkElapsed: 0,
      startRadius: 100,
      startCenter: { x: 0, z: 0 },
      dps: 4
    };
    this.storm = this.safeZone; // Compatibility alias

    // Power-ups, Ground Loot, and Loot Crates
    this.powerUps = POWERUP_TEMPLATES.map(p => ({
      ...p,
      isAvailable: true,
      respawnTimer: 0
    }));
    this.groundLoot = new Map(); // id -> { id, x, y, z, type, weaponType, name }
    this.lootCrates = new Map(); // id -> { id, x, y, z, type, createdAt }
    this.killFeed = [];

    // Start 30Hz authoritative loop for this room
    this.gameLoopInterval = null;
    this.lastTickTime = Date.now();
  }

  startLoop() {
    if (this.gameLoopInterval) return;
    this.lastTickTime = Date.now();
    this.gameLoopInterval = setInterval(() => this.tick(), TICK_INTERVAL);
  }

  stopLoop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
  }

  getStagingInfo() {
    const playerList = [];
    for (const [id, p] of this.players) {
      playerList.push({
        id,
        name: p.name,
        isHost: id === this.hostId,
        team: p.team,
        isReady: p.isReady,
        isBot: false
      });
    }

    // Include bots in staging if fillBots is ON
    if (this.status === 'staging' && this.fillBots) {
      const neededBots = this.calculateNeededBots(playerList.length);
      for (let i = 0; i < neededBots; i++) {
        const team = this.mode === 'tdm' ? (i % 2 === 0 ? 'blue' : 'red') : 'ffa';
        playerList.push({
          id: `bot_preview_${i}`,
          name: BOT_NAMES[i % BOT_NAMES.length],
          isHost: false,
          team,
          isReady: true,
          isBot: true
        });
      }
    }

    return {
      roomId: this.id,
      name: this.name,
      mode: this.mode,
      mapId: this.mapId,
      hasPassword: !!this.password,
      fillBots: this.fillBots,
      status: this.status,
      hostId: this.hostId,
      maxPlayers: this.maxPlayers,
      players: playerList
    };
  }

  calculateNeededBots(realPlayerCount) {
    if (!this.fillBots) return 0;
    const target = this.mode === 'tdm' ? 8 : 10;
    return Math.max(0, target - realPlayerCount);
  }

  addPlayer(socket, name, preferredTeam) {
    let team = 'ffa';
    if (this.mode === 'tdm') {
      if (preferredTeam === 'blue' || preferredTeam === 'red') {
        team = preferredTeam;
      } else {
        // Balance teams
        let blueCount = 0;
        let redCount = 0;
        for (const [, p] of this.players) {
          if (p.team === 'blue') blueCount++;
          if (p.team === 'red') redCount++;
        }
        team = blueCount <= redCount ? 'blue' : 'red';
      }
    }

    const spawn = this.getSpawnPoint(team);

    const player = {
      id: socket.id,
      name: name || 'CyberPilot',
      team,
      isBot: false,
      isReady: true,
      x: spawn.x,
      y: spawn.y,
      z: spawn.z,
      yaw: 0,
      pitch: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      health: 100,
      maxHealth: 100,
      armor: 0,
      maxArmor: 100,
      weapon: 'ar',
      ammo: createDefaultAmmo(),
      medic: {
        bandage: 2,
        medkit: 1,
        shield_battery: 1
      },
      isHealing: false,
      healItem: null,
      healEnd: 0,
      isReloading: false,
      reloadEnd: 0,
      isInvulnerable: true,
      invulnerableUntil: Date.now() + 3000,
      isAlive: true,
      respawnAt: 0,
      speedBoostUntil: 0,
      kills: 0,
      deaths: 0,
      damageDealt: 0,
      score: 0,
      isSpectating: false,
      spectateTarget: null
    };

    this.players.set(socket.id, player);
    socket.join(this.id);

    // If game already in progress and fillBots was active, replace a bot of same team
    if (this.status === 'in_progress' && this.bots.size > 0) {
      for (const [bId, bot] of this.bots) {
        if (this.mode === 'br' || bot.team === team) {
          this.bots.delete(bId);
          break;
        }
      }
    }

    return player;
  }

  removePlayer(socketId) {
    const wasHost = this.hostId === socketId;
    this.players.delete(socketId);

    // Assign new host if previous host left
    if (wasHost && this.players.size > 0) {
      const nextHostId = this.players.keys().next().value;
      this.hostId = nextHostId;
    }

    // In Battle Royale, check if only 1 player/bot remains
    if (this.status === 'in_progress' && this.mode === 'br') {
      this.checkBRVictoryCondition();
    }
  }

  getSpawnPoint(team) {
    if (this.mode === 'tdm') {
      const list = SPAWN_POINTS.tdm[team] || SPAWN_POINTS.tdm.blue;
      const pt = list[Math.floor(Math.random() * list.length)];
      return {
        x: pt.x + (Math.random() - 0.5) * 2,
        y: pt.y,
        z: pt.z + (Math.random() - 0.5) * 2
      };
    } else {
      // BR random spawn around perimeter: start high in the sky (45m) for terminal velocity drop
      const pt = SPAWN_POINTS.br[Math.floor(Math.random() * SPAWN_POINTS.br.length)];
      return {
        x: pt.x + (Math.random() - 0.5) * 3,
        y: 45.0,
        z: pt.z + (Math.random() - 0.5) * 3
      };
    }
  }

  startBRCountdown() {
    if (this.brState !== 'LOBBY_WAITING' && this.brState !== 'staging') return;
    this.brState = 'BR_STAGING';
    this.brCountdownSec = 10; // Exactly 10s Pre-Match Countdown per Phase 1
    this.brCountdownTimer = 0;
    this.startLoop();
    io.to(this.id).emit('brCountdown', {
      seconds: this.brCountdownSec,
      currentPlayers: this.players.size,
      maxPlayers: 10
    });
    io.to(this.id).emit('brCountdownStart', {
      seconds: this.brCountdownSec,
      currentPlayers: this.players.size,
      maxPlayers: 10
    });
  }

  launchBRMatch() {
    this.status = 'in_progress';
    this.brState = 'BR_SPAWNING';
    this.matchStartTime = Date.now();
    this.airdropElapsed = 0;
    this.timeRemainingSec = this.matchDurationSec;
    this.winner = null;
    this.killFeed = [];
    this.lootCrates.clear();
    this.groundLoot.clear();

    // 1. Procedural Ground Loot Generation (Exactly 16 interactive items across crates and floors)
    const groundItems = generateGroundLoot(this.mapId);
    for (const item of groundItems) {
      this.groundLoot.set(item.id, item);
    }

    // 2. Guarantee Exactly 10 Combatants: Populates all remaining slots with Mascot Bots
    this.bots.clear();
    const realPlayerCount = this.players.size;
    const neededBots = Math.max(0, 10 - realPlayerCount);

    const brSpawns = SPAWN_POINTS.br || [
      { x: -30, y: 0.0, z: -30 }, { x: 30, y: 0.0, z: -30 },
      { x: -30, y: 0.0, z: 30 },  { x: 30, y: 0.0, z: 30 },
      { x: 0, y: 0.0, z: -36 },    { x: 0, y: 0.0, z: 36 },
      { x: -36, y: 0.0, z: 0 },    { x: 36, y: 0.0, z: 0 },
      { x: -16, y: 0.0, z: -16 },  { x: 16, y: 0.0, z: 16 }
    ];

    let spawnIdx = 0;

    // 3. Reset Human Players: Spawn suspended 35m in air with Plasma Pistol (12 rounds) & 100 HP
    for (const [, p] of this.players) {
      const sp = brSpawns[spawnIdx % brSpawns.length];
      spawnIdx++;
      const jitterX = (Math.random() - 0.5) * 3;
      const jitterZ = (Math.random() - 0.5) * 3;
      p.x = Number((sp.x + jitterX).toFixed(2));
      p.y = 35.0; // Suspended 35m in the air
      p.z = Number((sp.z + jitterZ).toFixed(2));
      p.vx = 0;
      p.vy = -10.0; // Parachute / Jetpack Descent: -10m/s
      p.vz = 0;
      p.isGrounded = false;
      p.health = 100;
      p.maxHealth = 100;
      p.armor = 0;
      p.maxArmor = 100;
      p.weapon = 'pistol';
      p.ammo = {
        pistol: { mag: 12, reserve: 0 },
        ar: { mag: 0, reserve: 0 },
        shotgun: { mag: 0, reserve: 0 },
        sniper: { mag: 0, reserve: 0 },
        smg: { mag: 0, reserve: 0 }
      };
      p.medic = { bandage: 0, medkit: 0, shield_battery: 0 };
      p.isHealing = false;
      p.healItem = null;
      p.isAlive = true;
      p.isSpectating = false;
      p.isInvulnerable = false;
      p.invulnerableUntil = 0;
      p.kills = 0;
      p.deaths = 0;
      p.damageDealt = 0;
      p.score = 0;
      p.rank = 0;
      p.timeSurvived = 0;
    }

    for (let i = 0; i < neededBots; i++) {
      const bId = `bot_${i + 1}`;
      const botName = BR_BOT_NAMES[i % BR_BOT_NAMES.length] || `Bot_${i + 1}`;
      const sp = brSpawns[spawnIdx % brSpawns.length];
      spawnIdx++;
      const jitterX = (Math.random() - 0.5) * 3;
      const jitterZ = (Math.random() - 0.5) * 3;
      const rx = sp.x + jitterX;
      const rz = sp.z + jitterZ;

      this.bots.set(bId, {
        id: bId,
        name: botName,
        team: 'ffa',
        isBot: true,
        x: Number(rx.toFixed(2)),
        y: 35.0, // Suspended 35m high in the air
        z: Number(rz.toFixed(2)),
        vx: 0,
        vy: -10.0, // Parachute / Jetpack Descent: -10m/s
        vz: 0,
        isGrounded: false,
        yaw: Math.random() * Math.PI * 2,
        pitch: 0,
        health: 100,
        maxHealth: 100,
        armor: 0,
        maxArmor: 100,
        weapon: 'pistol',
        ammo: {
          pistol: { mag: 12, reserve: 0 },
          ar: { mag: 0, reserve: 0 },
          shotgun: { mag: 0, reserve: 0 },
          sniper: { mag: 0, reserve: 0 },
          smg: { mag: 0, reserve: 0 }
        },
        medic: { bandage: 0, medkit: 0, shield_battery: 0 },
        isAlive: true,
        respawnAt: 0,
        isInvulnerable: false,
        invulnerableUntil: 0,
        speedBoostUntil: 0,
        kills: 0,
        deaths: 0,
        damageDealt: 0,
        targetId: null,
        nextDecisionTime: Date.now() + 1000,
        nextShootTime: Date.now() + 1500,
        moveDirection: { x: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 2 },
        isShooting: false
      });
    }

    // 4. Initialize Safe Zone matching specifications:
    // Phase 1: Starts at Radius 90. Waits 30s -> Shrinks to Radius 50 over 20s. 5 DPS.
    this.safeZone = {
      currentCenter: { x: 0, z: 0 },
      currentRadius: 90,
      targetCenter: { x: 0, z: 0 },
      targetRadius: 90,
      shrinkSpeed: 0,
      phase: 1,
      phaseTimer: 30, // 30s wait before Phase 1 shrinking
      isShrinking: false,
      shrinkDuration: 20, // 20s shrink duration
      shrinkElapsed: 0,
      startRadius: 90,
      startCenter: { x: 0, z: 0 },
      dps: 5
    };
    this.storm = this.safeZone;

    this.startLoop();

    // Broadcast state transitions & matchStarted
    io.to(this.id).emit('brStateChanged', {
      state: 'BR_SPAWNING',
      duration: 3.0
    });

    for (const [pId, p] of this.players) {
      const sock = io.sockets.sockets.get(pId);
      if (sock) {
        sock.emit('matchStarted', {
          roomId: this.id,
          mode: 'br',
          mapId: this.mapId,
          brState: 'BR_SPAWNING',
          timeRemaining: this.matchDurationSec,
          aliveCount: this.countAliveCombatants(),
          safeZone: this.safeZone,
          spawn: { x: p.x, y: p.y, z: p.z, team: p.team },
          groundLoot: [...this.groundLoot.values()],
          lootCrates: []
        });
      }
    }
  }

  startMatch() {
    if (this.mode === 'br') {
      this.launchBRMatch();
      return;
    }

    this.status = 'in_progress';
    this.timeRemainingSec = this.matchDurationSec;
    this.teamScores = { blue: 0, red: 0 };
    this.winner = null;
    this.killFeed = [];
    this.lootCrates.clear();

    // Reset players for TDM
    for (const [, p] of this.players) {
      const sp = this.getSpawnPoint(p.team);
      p.x = sp.x;
      p.y = sp.y;
      p.z = sp.z;
      p.health = p.maxHealth;
      p.armor = 0;
      p.isAlive = true;
      p.isSpectating = false;
      p.isInvulnerable = true;
      p.invulnerableUntil = Date.now() + 3000;
      p.kills = 0;
      p.deaths = 0;
      p.score = 0;
      p.ammo = createDefaultAmmo();
      p.medic = { bandage: 2, medkit: 1, shield_battery: 1 };
      p.isHealing = false;
      p.healItem = null;
      p.healEnd = 0;
    }

    // Spawn Smart Bots if fillBots is true for TDM
    this.bots.clear();
    if (this.fillBots) {
      const neededBots = this.calculateNeededBots(this.players.size);
      let blueBotCount = 0;
      let redBotCount = 0;

      let pBlue = 0, pRed = 0;
      for (const [, p] of this.players) {
        if (p.team === 'blue') pBlue++;
        else pRed++;
      }
      blueBotCount = Math.max(0, 4 - pBlue);
      redBotCount = Math.max(0, 4 - pRed);

      const totalBots = blueBotCount + redBotCount;

      for (let i = 0; i < totalBots; i++) {
        const bTeam = i < blueBotCount ? 'blue' : 'red';
        const bId = `bot_${Date.now()}_${i}`;
        const sp = this.getSpawnPoint(bTeam);
        const weaponKeys = ['ar', 'shotgun', 'sniper', 'smg', 'pistol'];
        const weapon = weaponKeys[i % weaponKeys.length];

        this.bots.set(bId, {
          id: bId,
          name: BOT_NAMES[i % BOT_NAMES.length],
          team: bTeam,
          isBot: true,
          x: sp.x,
          y: sp.y,
          z: sp.z,
          vx: 0,
          vy: 0,
          vz: 0,
          isGrounded: true,
          yaw: Math.random() * Math.PI * 2,
          pitch: 0,
          health: 100,
          maxHealth: 100,
          armor: 0,
          weapon,
          isAlive: true,
          respawnAt: 0,
          isInvulnerable: true,
          invulnerableUntil: Date.now() + 3000,
          speedBoostUntil: 0,
          kills: 0,
          deaths: 0,
          targetId: null,
          nextDecisionTime: Date.now() + Math.random() * 800,
          nextShootTime: Date.now() + 1000 + Math.random() * 800,
          moveDirection: { x: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 2 },
          isShooting: false
        });
      }
    }

    this.startLoop();

    // Broadcast match started to room for TDM
    for (const [pId, p] of this.players) {
      const sock = io.sockets.sockets.get(pId);
      if (sock) {
        sock.emit('matchStarted', {
          roomId: this.id,
          mode: this.mode,
          mapId: this.mapId,
          timeRemaining: this.timeRemainingSec,
          targetKills: this.tdmTargetKills,
          storm: null,
          spawn: { x: p.x, y: p.y, z: p.z, team: p.team }
        });
      }
    }
  }

  tick() {
    // 0. Battle Royale Pre-Match Countdown in Staging (Phase 1)
    if (this.status === 'staging' && this.mode === 'br' && (this.brState === 'COUNTDOWN' || this.brState === 'BR_STAGING')) {
      const now = Date.now();
      const dt = (now - this.lastTickTime) / 1000;
      this.lastTickTime = now;
      this.brCountdownTimer = (this.brCountdownTimer || 0) + dt;
      if (this.brCountdownTimer >= 1.0) {
        this.brCountdownTimer -= 1.0;
        this.brCountdownSec--;
        io.to(this.id).emit('brCountdown', {
          seconds: Math.max(0, this.brCountdownSec),
          currentPlayers: this.players.size,
          maxPlayers: 10
        });
        io.to(this.id).emit('brCountdownTick', {
          seconds: Math.max(0, this.brCountdownSec),
          currentPlayers: this.players.size,
          maxPlayers: 10
        });
        if (this.brCountdownSec <= 0) {
          this.launchBRMatch();
        }
      }
      return;
    }

    if (this.status !== 'in_progress') return;

    const now = Date.now();
    const dt = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    // 1. Timer countdown (1s clock tick)
    this.timeTickCounter = (this.timeTickCounter || 0) + dt;
    if (this.timeTickCounter >= 1.0) {
      this.timeTickCounter -= 1.0;
      if (this.mode === 'tdm') {
        this.timeRemainingSec = Math.max(0, this.timeRemainingSec - 1);
        if (this.timeRemainingSec <= 0) {
          this.endMatchByTime();
          return;
        }
      }
    }

    // 2. Battle Royale Lifecycle
    if (this.mode === 'br') {
      if (this.brState === 'AIRDROP_DROP' || this.brState === 'BR_SPAWNING') {
        this.updateAirdropDrop(dt);
      } else if (this.brState === 'ACTIVE_COMBAT' || this.brState === 'BR_ACTIVE') {
        this.updateSafeZone(dt);
      }
    }

    // 3. Update Respawns (for TDM)
    if (this.mode === 'tdm') {
      this.updateRespawns(now);
    }

    // 4. Update Active Healing Processes
    this.updateHealing(now);

    // 5. Update Bot AI
    this.updateBots(dt, now);

    // 6. Update Power-ups and Proximity Checks
    this.updatePowerUps(dt, now);

    // 7. Update Loot Crates (BR)
    this.updateLootCrates(now);

    // 8. Check Jump-Pads
    this.checkJumpPads();

    // 9. Broadcast Game State Snapshot to room
    this.broadcastSnapshot();
  }

  updateAirdropDrop(dt) {
    this.airdropElapsed = (this.airdropElapsed || 0) + dt;
    let allLanded = true;

    // Phase 2: For 3 seconds, all entities descend at -10m/s
    const allEntities = [...this.players.values(), ...this.bots.values()];
    for (const ent of allEntities) {
      const gh = getArenaGroundHeight(ent.x, ent.z, ent.y, this.mapId);
      if (ent.y > gh) {
        ent.y = Math.max(gh, ent.y - 10.0 * dt);
        if (ent.y > gh + 0.3) {
          allLanded = false;
        }
      }
    }

    // When entities reach ground level (y <= 1.0m) or 3.0s elapsed, transition to BR_ACTIVE
    if (allLanded || this.airdropElapsed >= 3.0) {
      this.brState = 'BR_ACTIVE';
      for (const ent of allEntities) {
        const gh = getArenaGroundHeight(ent.x, ent.z, ent.y, this.mapId);
        ent.y = gh;
        ent.vy = 0;
        ent.isGrounded = true;
      }
      io.to(this.id).emit('brStateChanged', {
        state: 'BR_ACTIVE',
        safeZone: this.safeZone
      });
    }
  }

  updateSafeZone(dt) {
    const sz = this.safeZone;

    if (!sz.isShrinking) {
      sz.phaseTimer -= dt;
      if (sz.phaseTimer <= 0) {
        // Start shrinking to next phase target according to exact timeline:
        sz.isShrinking = true;
        sz.shrinkElapsed = 0;
        sz.startRadius = sz.currentRadius;
        sz.startCenter = { ...sz.currentCenter };

        if (sz.phase === 1) {
          // Phase 1: Waits 30s -> Shrinks to Radius 50 over 20s
          sz.targetRadius = 50;
          sz.shrinkDuration = 20;
          const angle = Math.random() * Math.PI * 2;
          const shift = Math.random() * 12;
          sz.targetCenter = {
            x: Number((Math.cos(angle) * shift).toFixed(2)),
            z: Number((Math.sin(angle) * shift).toFixed(2))
          };
          sz.dps = 5;
        } else if (sz.phase === 2) {
          // Phase 2: Waits 20s -> Shrinks to Radius 25 over 15s
          sz.targetRadius = 25;
          sz.shrinkDuration = 15;
          const angle = Math.random() * Math.PI * 2;
          const shift = Math.random() * 8;
          sz.targetCenter = {
            x: Number((sz.currentCenter.x + Math.cos(angle) * shift).toFixed(2)),
            z: Number((sz.currentCenter.z + Math.sin(angle) * shift).toFixed(2))
          };
          sz.dps = 5;
        } else {
          // Phase 3: Waits 15s -> Shrinks to Radius 5 over 10s
          sz.targetRadius = 5;
          sz.shrinkDuration = 10;
          sz.targetCenter = { ...sz.currentCenter };
          sz.dps = 5;
        }

        sz.shrinkSpeed = (sz.startRadius - sz.targetRadius) / sz.shrinkDuration;

        io.to(this.id).emit('brZoneUpdate', {
          center: sz.currentCenter,
          radius: sz.currentRadius,
          phase: sz.phase,
          isShrinking: true,
          targetCenter: sz.targetCenter,
          targetRadius: sz.targetRadius,
          duration: sz.shrinkDuration,
          dps: sz.dps
        });
        io.to(this.id).emit('safeZoneShrinkStart', {
          phase: sz.phase,
          startRadius: sz.startRadius,
          targetRadius: sz.targetRadius,
          startCenter: sz.startCenter,
          targetCenter: sz.targetCenter,
          duration: sz.shrinkDuration,
          dps: sz.dps
        });
      }
    } else {
      // Shrinking in progress
      sz.shrinkElapsed += dt;
      const progress = Math.min(1.0, sz.shrinkElapsed / sz.shrinkDuration);
      sz.currentRadius = sz.startRadius + (sz.targetRadius - sz.startRadius) * progress;
      sz.currentCenter.x = sz.startCenter.x + (sz.targetCenter.x - sz.startCenter.x) * progress;
      sz.currentCenter.z = sz.startCenter.z + (sz.targetCenter.z - sz.startCenter.z) * progress;

      // Broadcast zone update periodically (every 0.2s)
      this.zoneUpdateTimer = (this.zoneUpdateTimer || 0) + dt;
      if (this.zoneUpdateTimer >= 0.2) {
        this.zoneUpdateTimer = 0;
        io.to(this.id).emit('brZoneUpdate', {
          center: sz.currentCenter,
          radius: sz.currentRadius,
          phase: sz.phase,
          isShrinking: true,
          dps: sz.dps
        });
      }

      if (progress >= 1.0) {
        sz.currentRadius = sz.targetRadius;
        sz.currentCenter = { ...sz.targetCenter };
        sz.isShrinking = false;
        sz.phase++;

        if (sz.phase === 2) {
          sz.phaseTimer = 20; // Phase 2: Waits 20s
        } else if (sz.phase === 3) {
          sz.phaseTimer = 15; // Phase 3: Waits 15s
        } else {
          sz.phaseTimer = 9999;
        }

        io.to(this.id).emit('brZoneUpdate', {
          center: sz.currentCenter,
          radius: sz.currentRadius,
          phase: sz.phase,
          isShrinking: false,
          dps: sz.dps
        });
        io.to(this.id).emit('safeZonePhaseUpdated', {
          phase: sz.phase,
          radius: sz.currentRadius,
          center: sz.currentCenter,
          nextWaitSec: sz.phaseTimer,
          dps: sz.dps
        });
      }
    }

    // Apply safe zone damage ticks every 1 second (5 DMG/sec)
    this.safeZoneDamageTimer = (this.safeZoneDamageTimer || 0) + dt;
    if (this.safeZoneDamageTimer >= 1.0) {
      this.safeZoneDamageTimer -= 1.0;
      this.applySafeZoneDamage();
    }
  }

  applySafeZoneDamage() {
    const sz = this.safeZone;
    const allEntities = [...this.players.values(), ...this.bots.values()];

    for (const ent of allEntities) {
      if (!ent.isAlive) continue;
      const dx = ent.x - sz.currentCenter.x;
      const dz = ent.z - sz.currentCenter.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > sz.currentRadius) {
        const damage = 5; // 5 DMG/sec
        ent.health = Math.max(0, ent.health - damage);

        if (!ent.isBot) {
          const sock = io.sockets.sockets.get(ent.id);
          if (sock) {
            sock.emit('damageTaken', {
              damage,
              currentHealth: ent.health,
              currentArmor: ent.armor || 0,
              inStorm: true,
              sourceX: sz.currentCenter.x,
              sourceZ: sz.currentCenter.z
            });
            sock.emit('stormDamageTaken', {
              damage,
              currentHealth: ent.health,
              radius: sz.currentRadius,
              center: sz.currentCenter
            });
          }
        }

        if (ent.health <= 0) {
          this.handleEntityDeath(ent, null, 'Glitch Storm');
        }
      }
    }
  }

  handlePlayerDeath(victim, killer, weaponName) {
    return this.handleEntityDeath(victim, killer, weaponName);
  }

  updateRespawns(now) {
    for (const [, p] of this.players) {
      if (!p.isAlive && p.respawnAt > 0 && now >= p.respawnAt) {
        const sp = this.getSpawnPoint(p.team);
        p.x = sp.x;
        p.y = sp.y;
        p.z = sp.z;
        p.health = p.maxHealth;
        p.armor = 0;
        p.isAlive = true;
        p.respawnAt = 0;
        p.isInvulnerable = true;
        p.invulnerableUntil = now + 3000;
        p.isHealing = false;
        p.healItem = null;
        p.ammo = createDefaultAmmo();

        io.to(this.id).emit('playerRespawned', {
          id: p.id,
          x: p.x,
          y: p.y,
          z: p.z,
          team: p.team,
          health: p.health,
          armor: p.armor
        });
      }
    }

    for (const [, b] of this.bots) {
      if (!b.isAlive && b.respawnAt > 0 && now >= b.respawnAt) {
        const sp = this.getSpawnPoint(b.team);
        b.x = sp.x;
        b.y = sp.y;
        b.z = sp.z;
        b.health = b.maxHealth;
        b.armor = 0;
        b.isAlive = true;
        b.respawnAt = 0;
        b.isInvulnerable = true;
        b.invulnerableUntil = now + 3000;

        io.to(this.id).emit('playerRespawned', {
          id: b.id,
          x: b.x,
          y: b.y,
          z: b.z,
          team: b.team
        });
      }
    }
  }

  updateHealing(now) {
    for (const [, p] of this.players) {
      if (p.isAlive && p.isHealing && now >= p.healEnd) {
        const itemKey = p.healItem;
        const itemDef = MEDIC_ITEMS[itemKey];
        p.isHealing = false;
        p.healItem = null;

        if (itemDef) {
          let healedHp = 0;
          let addedShield = 0;

          if (itemKey === 'bandage') {
            // Restore 20 HP up to 75 HP max
            if (p.health < 75) {
              const prev = p.health;
              p.health = Math.min(75, p.health + 20);
              healedHp = p.health - prev;
            }
          } else if (itemKey === 'medkit') {
            // Fully restores 100% HP (to 100 HP)
            const prev = p.health;
            p.health = p.maxHealth;
            healedHp = p.health - prev;
          } else if (itemKey === 'shield_battery') {
            // Restores 50 Shield AP
            const prev = p.armor;
            p.armor = Math.min(p.maxArmor, p.armor + 50);
            addedShield = p.armor - prev;
          }

          const s = io.sockets.sockets.get(p.id);
          if (s) {
            s.emit('healCompleted', {
              item: itemKey,
              health: p.health,
              armor: p.armor,
              medic: p.medic,
              healedHp,
              addedShield
            });
          }
        }
      }
    }
  }

  updateBots(dt, now) {
    const allCombatants = [...this.players.values(), ...this.bots.values()];

    for (const [, bot] of this.bots) {
      if (!bot.isAlive) continue;

      // 1. AI Decision Making: Pick target
      if (now >= bot.nextDecisionTime) {
        bot.nextDecisionTime = now + 600 + Math.random() * 800;

        // Find closest enemy combatant
        let closestTarget = null;
        let minDist = 999;

        for (const other of allCombatants) {
          if (other.id === bot.id || !other.isAlive) continue;
          if (this.mode === 'tdm' && other.team === bot.team) continue;

          const dx = other.x - bot.x;
          const dz = other.z - bot.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < minDist) {
            minDist = dist;
            closestTarget = other;
          }
        }

        bot.targetId = closestTarget ? closestTarget.id : null;

        // If in BR, prioritize zone awareness & ground looting
        if (this.mode === 'br') {
          const sz = this.safeZone;
          const dxCenter = sz.currentCenter.x - bot.x;
          const dzCenter = sz.currentCenter.z - bot.z;
          const distFromCenter = Math.sqrt(dxCenter * dxCenter + dzCenter * dzCenter);

          if (distFromCenter > sz.currentRadius * 0.85) {
            // Zone Awareness: override combat pathfinding and force running directly toward safe zone center
            const angle = Math.atan2(dxCenter, dzCenter);
            bot.moveDirection = { x: Math.sin(angle), z: Math.cos(angle) };
            bot.targetId = null;
          } else if (bot.weapon === 'pistol' && this.groundLoot.size > 0) {
            // Looting Behavior: at match start, bots navigate toward nearest ground loot
            let closestLoot = null;
            let minLootDist = 999;
            for (const [, loot] of this.groundLoot) {
              const ldx = loot.x - bot.x;
              const ldz = loot.z - bot.z;
              const ldist = Math.sqrt(ldx * ldx + ldz * ldz);
              if (ldist < minLootDist) {
                minLootDist = ldist;
                closestLoot = loot;
              }
            }
            if (closestLoot && minLootDist < 35) {
              if (minLootDist < 2.2) {
                if (closestLoot.type === 'weapon') bot.weapon = closestLoot.weaponType;
                else if (closestLoot.type === 'armor') bot.armor = Math.min(100, bot.armor + 50);
                this.groundLoot.delete(closestLoot.id);
                io.to(this.id).emit('groundLootRemoved', { id: closestLoot.id, pickerId: bot.id });
              } else {
                const lAngle = Math.atan2(closestLoot.x - bot.x, closestLoot.z - bot.z);
                bot.moveDirection = { x: Math.sin(lAngle), z: Math.cos(lAngle) };
              }
            }
          }
        }
      }

      // 2. Movement & Aiming toward target
      let target = null;
      if (bot.targetId) {
        target = this.players.get(bot.targetId) || this.bots.get(bot.targetId);
        if (target && !target.isAlive) target = null;
      }

      const speed = (now < bot.speedBoostUntil) ? 14.0 : 9.5;

      if (target) {
        const dx = target.x - bot.x;
        const dz = target.z - bot.z;
        const dy = (target.y + 1.2) - (bot.y + 1.2);
        const dist = Math.sqrt(dx * dx + dz * dz);
        bot.yaw = Math.atan2(dx, dz);
        bot.pitch = -Math.atan2(dy, Math.max(0.1, dist));

        // Strafe & advance/retreat with axis-separated obstacle collision & avoidance
        let moveX = 0;
        let moveZ = 0;
        if (dist > 18) {
          moveX = Math.sin(bot.yaw) * speed * dt;
          moveZ = Math.cos(bot.yaw) * speed * dt;
        } else if (dist < 7) {
          moveX = -Math.sin(bot.yaw) * (speed * 0.7) * dt;
          moveZ = -Math.cos(bot.yaw) * (speed * 0.7) * dt;
        } else {
          // Circle strafe
          const strafeAngle = bot.yaw + Math.PI / 2;
          moveX = Math.sin(strafeAngle) * (speed * 0.6) * dt;
          moveZ = Math.cos(strafeAngle) * (speed * 0.6) * dt;
        }

        const nextX = bot.x + moveX;
        if (!checkBotObstacleCollision(nextX, bot.z, 0.6, this.mapId) && Math.abs(nextX) <= 37.4) {
          bot.x = nextX;
        } else {
          // Step around obstacle along perpendicular axis
          bot.z += (Math.random() < 0.5 ? 1 : -1) * speed * 0.5 * dt;
        }

        const nextZ = bot.z + moveZ;
        if (!checkBotObstacleCollision(bot.x, nextZ, 0.6, this.mapId) && Math.abs(nextZ) <= 37.4) {
          bot.z = nextZ;
        } else {
          // Step around obstacle along perpendicular axis
          bot.x += (Math.random() < 0.5 ? 1 : -1) * speed * 0.5 * dt;
        }

        bot.x = Math.max(-37.4, Math.min(37.4, bot.x));
        bot.z = Math.max(-37.4, Math.min(37.4, bot.z));

        // 3. Bot Shooting (strictly requires direct line of sight)
        if (now >= bot.nextShootTime && dist < 32) {
          const w = WEAPONS[bot.weapon] || WEAPONS.ar;
          bot.nextShootTime = now + (w.fireRateMs * (1.2 + Math.random() * 0.8));

          // Occlusion Raycast Check: Bots CANNOT shoot through solid walls or containers
          const hasLOS = checkLineOfSight(bot.x, bot.z, target.x, target.z, this.mapId);

          if (hasLOS) {
            // Accuracy chance based on distance
            const hitChance = Math.max(0.3, 0.75 - dist * 0.015);
            const isHit = Math.random() < hitChance;

            if (isHit && target.isAlive) {
              const isHead = Math.random() < 0.25;
              const dmg = Math.round(w.damage * (isHead ? w.headMult : 1.0));
              this.applyDamage(target, dmg, bot, isHead);
            }

            // Emit gunshot laser visual for clients
            io.to(this.id).emit('botShotFired', {
              botId: bot.id,
              origin: { x: bot.x, y: bot.y + 1.2, z: bot.z },
              targetPos: { x: target.x, y: target.y + 1.2, z: target.z },
              weapon: bot.weapon,
              isHit
            });
          }
        }
      } else {
        // Idle wander with 90-degree deflection on obstacle collision
        const candX = bot.x + bot.moveDirection.x * speed * 0.5 * dt;
        const candZ = bot.z + bot.moveDirection.z * speed * 0.5 * dt;
        if (checkBotObstacleCollision(candX, candZ, 0.6, this.mapId) || Math.abs(candX) > 36 || Math.abs(candZ) > 36) {
          const oldDirX = bot.moveDirection.x;
          bot.moveDirection.x = -bot.moveDirection.z;
          bot.moveDirection.z = oldDirX;
          bot.yaw = Math.atan2(bot.moveDirection.x, bot.moveDirection.z);
        } else {
          bot.x = candX;
          bot.z = candZ;
          bot.yaw = Math.atan2(bot.moveDirection.x, bot.moveDirection.z);
        }
      }

      // 4. Gravity & Ground Physics for Bots
      if (bot.vx) {
        bot.x += bot.vx * dt;
        bot.vx *= Math.max(0, 1 - dt * 2.5);
        if (Math.abs(bot.vx) < 0.05) bot.vx = 0;
      }
      if (bot.vz) {
        bot.z += bot.vz * dt;
        bot.vz *= Math.max(0, 1 - dt * 2.5);
        if (Math.abs(bot.vz) < 0.05) bot.vz = 0;
      }

      // Vertical gravity
      bot.vy = (bot.vy || 0) - 26.0 * dt;
      bot.y += bot.vy * dt;

      // Floor & Elevated Catwalk & Ramp collision
      const groundFloor = getArenaGroundHeight(bot.x, bot.z, bot.y, this.mapId);
      if (bot.y <= groundFloor) {
        bot.y = groundFloor;
        bot.vy = 0;
        bot.isGrounded = true;
      } else {
        bot.isGrounded = false;
      }
    }
  }

  updatePowerUps(dt, now) {
    const allCombatants = [...this.players.values(), ...this.bots.values()];

    for (const pu of this.powerUps) {
      if (!pu.isAvailable) {
        pu.respawnTimer -= dt;
        if (pu.respawnTimer <= 0) {
          pu.isAvailable = true;
          io.to(this.id).emit('powerUpRespawned', { id: pu.id });
        }
        continue;
      }

      // Check proximity
      for (const ent of allCombatants) {
        if (!ent.isAlive) continue;
        const dx = ent.x - pu.x;
        const dz = ent.z - pu.z;
        const dy = Math.abs(ent.y - pu.y);

        if (dx * dx + dz * dz < 4.0 && dy < 2.5) {
          // Pickup power-up
          let consumed = false;
          if (pu.type === 'health') {
            if (ent.health < ent.maxHealth) {
              ent.health = Math.min(ent.maxHealth, ent.health + 40);
              consumed = true;
            }
          } else if (pu.type === 'armor') {
            if (ent.armor < ent.maxArmor) {
              ent.armor = Math.min(ent.maxArmor, ent.armor + 50);
              consumed = true;
            }
          } else if (pu.type === 'ammo') {
            if (!ent.isBot) {
              ent.ammo = createDefaultAmmo();
            }
            consumed = true;
          } else if (pu.type === 'speed') {
            ent.speedBoostUntil = now + 8000;
            consumed = true;
          }

          if (consumed) {
            pu.isAvailable = false;
            pu.respawnTimer = pu.respawnSec;

            io.to(this.id).emit('powerUpCollected', {
              id: pu.id,
              collectorId: ent.id,
              type: pu.type
            });

            if (!ent.isBot) {
              const socket = io.sockets.sockets.get(ent.id);
              if (socket) {
                socket.emit('powerUpGranted', {
                  type: pu.type,
                  health: ent.health,
                  armor: ent.armor,
                  ammo: ent.ammo,
                  durationMs: pu.type === 'speed' ? 8000 : 0
                });
              }
            }
            break;
          }
        }
      }
    }
  }

  updateLootCrates(now) {
    if (this.lootCrates.size === 0) return;
    const allCombatants = [...this.players.values(), ...this.bots.values()];

    for (const [cId, crate] of this.lootCrates) {
      for (const ent of allCombatants) {
        if (!ent.isAlive) continue;
        const dx = ent.x - crate.x;
        const dz = ent.z - crate.z;
        if (dx * dx + dz * dz < 3.2) {
          // Loot crate picked up!
          ent.health = Math.min(ent.maxHealth, ent.health + 50);
          ent.armor = Math.min(ent.maxArmor, ent.armor + 50);
          if (!ent.isBot) {
            ent.ammo = createDefaultAmmo();
            if (crate.unusedMedic && ent.medic) {
              ent.medic.bandage = Math.min(5, ent.medic.bandage + (crate.unusedMedic.bandage || 1));
              ent.medic.medkit = Math.min(3, ent.medic.medkit + (crate.unusedMedic.medkit || 1));
              ent.medic.shield_battery = Math.min(3, ent.medic.shield_battery + (crate.unusedMedic.shield_battery || 1));
            }
            const s = io.sockets.sockets.get(ent.id);
            if (s) {
              s.emit('lootCrateCollected', {
                health: ent.health,
                armor: ent.armor,
                ammo: ent.ammo,
                medic: ent.medic
              });
            }
          }

          this.lootCrates.delete(cId);
          io.to(this.id).emit('lootCrateRemoved', { id: cId, pickerId: ent.id });
          break;
        }
      }
    }
  }

  handleGroundLootPickup(player, lootId) {
    if (!player || !player.isAlive) return;
    const item = this.groundLoot.get(lootId);
    if (!item) return;

    const dx = player.x - item.x;
    const dz = player.z - item.z;
    if (dx * dx + dz * dz > 16.0) return;

    if (item.type === 'weapon') {
      player.weapon = item.weaponType;
      const w = WEAPONS[item.weaponType];
      if (w) {
        player.ammo[item.weaponType] = {
          mag: w.magSize,
          reserve: w.maxAmmo
        };
      }
    } else if (item.type === 'ammo') {
      for (const wKey of Object.keys(player.ammo)) {
        player.ammo[wKey].reserve = Math.min(WEAPONS[wKey].maxAmmo * 2, player.ammo[wKey].reserve + 60);
      }
    } else if (item.type === 'medkit') {
      player.health = 100;
      if (player.medic) player.medic.medkit = Math.min(3, (player.medic.medkit || 0) + 1);
    } else if (item.type === 'armor') {
      player.armor = Math.min(100, player.armor + 50);
    }

    this.groundLoot.delete(lootId);
    io.to(this.id).emit('groundLootRemoved', { id: lootId, pickerId: player.id });

    const s = io.sockets.sockets.get(player.id);
    if (s) {
      s.emit('lootItemCollected', {
        itemType: item.type,
        weaponType: item.weaponType,
        name: item.name,
        health: player.health,
        armor: player.armor,
        ammo: player.ammo,
        medic: player.medic,
        currentWeapon: player.weapon
      });
    }
  }

  handleManualPickup(player, requestedId) {
    if (!player || !player.isAlive) return;

    // 1. Check ground loot within 3.5m
    for (const [lId, item] of this.groundLoot) {
      if (requestedId && lId !== requestedId) continue;
      const dx = player.x - item.x;
      const dz = player.z - item.z;
      if (dx * dx + dz * dz < 12.25) {
        this.handleGroundLootPickup(player, lId);
        return;
      }
    }

    // 2. Check loot crates within 3.5m
    for (const [cId, crate] of this.lootCrates) {
      if (requestedId && cId !== requestedId) continue;
      const dx = player.x - crate.x;
      const dz = player.z - crate.z;
      if (dx * dx + dz * dz < 12.25) {
        player.health = Math.min(player.maxHealth, player.health + 50);
        player.armor = Math.min(player.maxArmor, player.armor + 50);
        player.ammo = createDefaultAmmo();
        if (crate.unusedMedic && player.medic) {
          player.medic.bandage = Math.min(5, player.medic.bandage + (crate.unusedMedic.bandage || 1));
          player.medic.medkit = Math.min(3, player.medic.medkit + (crate.unusedMedic.medkit || 1));
          player.medic.shield_battery = Math.min(3, player.medic.shield_battery + (crate.unusedMedic.shield_battery || 1));
        }
        const s = io.sockets.sockets.get(player.id);
        if (s) {
          s.emit('lootCrateCollected', {
            health: player.health,
            armor: player.armor,
            ammo: player.ammo,
            medic: player.medic
          });
        }
        this.lootCrates.delete(cId);
        io.to(this.id).emit('lootCrateRemoved', { id: cId, pickerId: player.id });
        return;
      }
    }

    // Check power-up stations within 3.5m
    for (const pu of this.powerUps) {
      if (!pu.isAvailable) continue;
      if (requestedId && pu.id !== requestedId) continue;
      const dx = player.x - pu.x;
      const dz = player.z - pu.z;
      const dy = Math.abs(player.y - pu.y);
      if (dx * dx + dz * dz < 12.25 && dy < 3.0) {
        let consumed = false;
        if (pu.type === 'health') {
          if (player.health < player.maxHealth) {
            player.health = Math.min(player.maxHealth, player.health + 40);
            consumed = true;
          }
        } else if (pu.type === 'armor') {
          if (player.armor < player.maxArmor) {
            player.armor = Math.min(player.maxArmor, player.armor + 50);
            consumed = true;
          }
        } else if (pu.type === 'ammo') {
          player.ammo = createDefaultAmmo();
          consumed = true;
        } else if (pu.type === 'speed') {
          player.speedBoostUntil = Date.now() + 8000;
          consumed = true;
        }

        if (consumed) {
          pu.isAvailable = false;
          pu.respawnTimer = pu.respawnSec;
          io.to(this.id).emit('powerUpCollected', { id: pu.id, collectorId: player.id, type: pu.type });
          const s = io.sockets.sockets.get(player.id);
          if (s) {
            s.emit('powerUpGranted', {
              type: pu.type,
              health: player.health,
              armor: player.armor,
              ammo: player.ammo,
              durationMs: pu.type === 'speed' ? 8000 : 0
            });
          }
          return;
        }
      }
    }
  }

  checkJumpPads() {
    for (const jp of JUMP_PADS) {
      // 1. Bots jump physics (launch in air with realistic trajectory)
      for (const [, bot] of this.bots) {
        if (!bot.isAlive) continue;
        const dx = bot.x - jp.x;
        const dz = bot.z - jp.z;
        if (dx * dx + dz * dz < 3.8 && Math.abs(bot.y - jp.y) < 1.8 && bot.isGrounded) {
          bot.vy = jp.boostY;
          bot.vx = jp.boostX;
          bot.vz = jp.boostZ;
          bot.isGrounded = false;
          io.to(this.id).emit('jumpPadTriggered', {
            id: jp.id,
            entityId: bot.id,
            boostY: jp.boostY,
            boostX: jp.boostX,
            boostZ: jp.boostZ
          });
        }
      }

      // 2. Real players (notify clients without forcing corrupt Y coordinates)
      for (const [, p] of this.players) {
        if (!p.isAlive) continue;
        const dx = p.x - jp.x;
        const dz = p.z - jp.z;
        if (dx * dx + dz * dz < 3.2 && Math.abs(p.y - jp.y) < 1.6) {
          io.to(this.id).emit('jumpPadTriggered', {
            id: jp.id,
            entityId: p.id,
            boostY: jp.boostY,
            boostX: jp.boostX,
            boostZ: jp.boostZ
          });
        }
      }
    }
  }

  applyDamage(victim, damage, attacker, isHeadshot) {
    if (!victim.isAlive) return;
    if (Date.now() < victim.invulnerableUntil) return;

    // Absorb with armor first if present
    let remainingDmg = damage;
    if (victim.armor > 0) {
      const absorbed = Math.min(victim.armor, Math.round(damage * 0.5));
      victim.armor -= absorbed;
      remainingDmg -= absorbed;
    }

    victim.health = Math.max(0, victim.health - remainingDmg);

    // Cancel healing if damaged
    if (victim.isHealing) {
      victim.isHealing = false;
      victim.healItem = null;
      if (!victim.isBot) {
        const vSocket = io.sockets.sockets.get(victim.id);
        if (vSocket) vSocket.emit('healCancelled', { reason: 'Took damage' });
      }
    }

    // Notify victim with attacker position for directional damage indicator
    if (!victim.isBot) {
      const vSocket = io.sockets.sockets.get(victim.id);
      if (vSocket) {
        vSocket.emit('damageTaken', {
          attackerId: attacker.id,
          attackerName: attacker.name,
          attackerPos: { x: attacker.x, y: attacker.y, z: attacker.z },
          damage,
          remainingHealth: victim.health,
          remainingArmor: victim.armor,
          isHeadshot
        });
      }
    }

    // Notify attacker (hitmarker)
    if (!attacker.isBot) {
      const aSocket = io.sockets.sockets.get(attacker.id);
      if (aSocket) {
        aSocket.emit('hitmarker', {
          damage,
          isHeadshot,
          victimId: victim.id,
          victimHealth: victim.health
        });
      }
    }

    // Check Death
    if (victim.health <= 0) {
      this.handleEntityDeath(victim, attacker, attacker.weapon);
    }
  }

  handleEntityDeath(victim, killer, weaponName) {
    victim.isAlive = false;
    victim.isHealing = false;
    victim.healItem = null;
    victim.deaths++;

    const killerName = killer ? killer.name : 'The Arena';
    const killerTeam = killer ? killer.team : 'none';
    const killerWeapon = killer ? (WEAPONS[killer.weapon]?.name || killer.weapon || weaponName) : (weaponName || 'Pulse Blaster');

    if (killer) {
      killer.kills++;
      killer.score += 100;
    }

    // Add to kill feed
    const killRecord = {
      killer: killerName,
      killerTeam,
      victim: victim.name,
      victimTeam: victim.team,
      weapon: killerWeapon,
      time: Date.now()
    };
    this.killFeed.unshift(killRecord);
    if (this.killFeed.length > 8) this.killFeed.pop();

    io.to(this.id).emit('killFeedEvent', killRecord);

    // Drop 3D dark-metal Loot Crate with glowing cyan edges at exact (x, 0.5, z)
    if (this.mode === 'br') {
      const crateId = `crate_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const crate = {
        id: crateId,
        x: Number(victim.x.toFixed(2)),
        y: 0.5,
        z: Number(victim.z.toFixed(2)),
        ammo: 30,
        medkit: 1,
        createdAt: Date.now()
      };
      this.lootCrates.set(crateId, crate);
      io.to(this.id).emit('lootCrateSpawned', crate);
    }

    // Mode-specific handling
    if (this.mode === 'tdm') {
      if (killer && killer.team && (killer.team === 'blue' || killer.team === 'red')) {
        this.teamScores[killer.team]++;
      }
      victim.respawnAt = Date.now() + 3000;

      io.to(this.id).emit('playerEliminated', {
        victimId: victim.id,
        victimName: victim.name,
        killerId: killer ? killer.id : null,
        killerName: killerName,
        killerWeapon: killerWeapon,
        scores: this.teamScores,
        respawnSec: 3
      });

      // Check TDM Target Kills
      if (this.teamScores.blue >= this.tdmTargetKills || this.teamScores.red >= this.tdmTargetKills) {
        this.endTDM();
      }
    } else if (this.mode === 'br') {
      // Permadeath in BR
      const remainingAlive = this.countAliveCombatants();
      victim.rank = remainingAlive + 1;
      victim.timeSurvived = Math.round((Date.now() - (this.matchStartTime || Date.now())) / 1000);

      // Broadcast brPlayerEliminated per Phase 3 specifications
      io.to(this.id).emit('brPlayerEliminated', {
        victim: { id: victim.id, name: victim.name, isBot: !!victim.isBot },
        killer: killer ? { id: killer.id, name: killerName, isBot: !!killer.isBot } : null,
        aliveCount: remainingAlive,
        rank: victim.rank
      });

      io.to(this.id).emit('playerEliminated', {
        victimId: victim.id,
        victimName: victim.name,
        killerId: killer ? killer.id : null,
        killerName: killerName,
        killerWeapon: killerWeapon,
        permadeath: true,
        remainingAlive,
        rank: victim.rank
      });

      if (!victim.isBot) {
        victim.isSpectating = true;
        const vSocket = io.sockets.sockets.get(victim.id);
        if (vSocket) {
          const nextTarget = this.getNextSpectateTarget(victim.id);
          vSocket.emit('enterSpectatorMode', {
            rank: victim.rank,
            totalPlayers: 10,
            spectatingId: nextTarget ? nextTarget.id : null,
            spectatingName: nextTarget ? nextTarget.name : 'Unknown'
          });
        }
      }

      this.checkBRVictoryCondition();
    }
  }

  countAliveCombatants() {
    let count = 0;
    for (const [, p] of this.players) if (p.isAlive) count++;
    for (const [, b] of this.bots) if (b.isAlive) count++;
    return count;
  }

  getNextSpectateTarget(currentEntityId) {
    for (const [, p] of this.players) {
      if (p.isAlive && p.id !== currentEntityId) return p;
    }
    for (const [, b] of this.bots) {
      if (b.isAlive && b.id !== currentEntityId) return b;
    }
    return null;
  }

  checkBRVictoryCondition() {
    if (this.status !== 'in_progress') return;
    const alivePlayers = [...this.players.values()].filter(p => p.isAlive);
    const aliveBots = [...this.bots.values()].filter(b => b.isAlive);
    const totalAlive = alivePlayers.length + aliveBots.length;

    if (totalAlive <= 1) {
      this.brState = 'MATCH_OVER';
      const winner = alivePlayers[0] || aliveBots[0] || null;
      this.endBR(winner);
    }
  }

  endTDM() {
    this.status = 'ended';
    this.stopLoop();
    let winningTeam = 'tie';
    if (this.teamScores.blue > this.teamScores.red) winningTeam = 'blue';
    else if (this.teamScores.red > this.teamScores.blue) winningTeam = 'red';

    io.to(this.id).emit('matchEnded', {
      mode: 'tdm',
      winningTeam,
      scores: this.teamScores,
      leaderboard: this.generateLeaderboard()
    });
  }

  endMatchByTime() {
    if (this.mode === 'tdm') {
      this.endTDM();
    } else {
      this.checkBRVictoryCondition();
    }
  }

  endBR(winner) {
    this.status = 'ended';
    this.brState = 'MATCH_OVER';
    this.stopLoop();

    const matchDuration = Math.round((Date.now() - (this.matchStartTime || Date.now())) / 1000);

    // Broadcast brGameOver as requested
    io.to(this.id).emit('brGameOver', {
      winner: winner ? { id: winner.id, name: winner.name, isBot: !!winner.isBot } : null,
      stats: {
        totalCombatants: 10,
        duration: matchDuration
      }
    });

    for (const [pId, p] of this.players) {
      const sock = io.sockets.sockets.get(pId);
      if (sock) {
        const isWinner = winner && winner.id === p.id;
        sock.emit('matchEnded', {
          mode: 'br',
          winner: winner ? { id: winner.id, name: winner.name, isBot: !!winner.isBot } : null,
          isLocalWinner: isWinner,
          playerStats: {
            kills: p.kills || 0,
            damageDealt: p.damageDealt || 0,
            timeSurvived: isWinner ? matchDuration : Math.min(matchDuration, p.timeSurvived || matchDuration),
            rank: isWinner ? 1 : (p.rank || 2)
          },
          leaderboard: this.generateLeaderboard()
        });
      }
    }
  }

  generateLeaderboard() {
    const list = [...this.players.values(), ...this.bots.values()];
    list.sort((a, b) => (b.kills || 0) - (a.kills || 0) || ((b.score ?? 0) - (a.score ?? 0)));
    return list.map(e => ({
      id: e.id,
      name: e.name,
      team: e.team,
      isBot: e.isBot,
      kills: e.kills || 0,
      deaths: e.deaths || 0,
      score: (e.score != null) ? e.score : ((e.kills || 0) * 100)
    }));
  }

  broadcastSnapshot() {
    const playersArr = [];
    for (const [, p] of this.players) {
      playersArr.push({
        id: p.id,
        name: p.name,
        team: p.team,
        isBot: false,
        isAlive: p.isAlive,
        isInvulnerable: Date.now() < p.invulnerableUntil,
        x: Number(p.x.toFixed(2)),
        y: Number(p.y.toFixed(2)),
        z: Number(p.z.toFixed(2)),
        yaw: Number(p.yaw.toFixed(2)),
        pitch: Number(p.pitch.toFixed(2)),
        health: p.health,
        maxHealth: p.maxHealth,
        armor: p.armor,
        weapon: p.weapon,
        medic: p.medic,
        isHealing: p.isHealing,
        speedBoost: Date.now() < p.speedBoostUntil
      });
    }

    const botsArr = [];
    for (const [, b] of this.bots) {
      botsArr.push({
        id: b.id,
        name: b.name,
        team: b.team,
        isBot: true,
        isAlive: b.isAlive,
        isInvulnerable: Date.now() < b.invulnerableUntil,
        x: Number(b.x.toFixed(2)),
        y: Number(b.y.toFixed(2)),
        z: Number(b.z.toFixed(2)),
        yaw: Number(b.yaw.toFixed(2)),
        pitch: Number((b.pitch || 0).toFixed(2)),
        health: b.health,
        maxHealth: b.maxHealth,
        armor: b.armor,
        weapon: b.weapon,
        speedBoost: Date.now() < b.speedBoostUntil
      });
    }

    const snapshot = {
      t: Date.now(),
      players: playersArr,
      bots: botsArr,
      scores: this.teamScores,
      timeRemaining: this.timeRemainingSec,
      aliveCount: this.countAliveCombatants(),
      safeZone: this.mode === 'br' ? {
        center: this.safeZone.currentCenter,
        radius: Number(this.safeZone.currentRadius.toFixed(2)),
        targetCenter: this.safeZone.targetCenter,
        targetRadius: this.safeZone.targetRadius,
        phase: this.safeZone.phase,
        timer: Math.max(0, Math.ceil(this.safeZone.phaseTimer)),
        isShrinking: this.safeZone.isShrinking,
        dps: this.safeZone.dps
      } : null,
      storm: this.mode === 'br' ? {
        radius: Number(this.safeZone.currentRadius.toFixed(2)),
        center: this.safeZone.currentCenter,
        phase: this.safeZone.phase,
        timer: Math.max(0, Math.ceil(this.safeZone.phaseTimer)),
        isShrinking: this.safeZone.isShrinking,
        dps: this.safeZone.dps
      } : null,
      brState: this.mode === 'br' ? this.brState : null,
      groundLoot: this.mode === 'br' ? [...this.groundLoot.values()] : []
    };

    io.to(this.id).emit('gameStateSnapshot', snapshot);
  }
}

// -------------------------------------------------------------
// Socket.io Connection & Event Handling
// -------------------------------------------------------------
io.on('connection', (socket) => {
  let currentRoomId = null;

  // 1. Get Rooms List for Lobby Browser
  socket.on('getRoomsList', (callback) => {
    const list = [];
    for (const [id, r] of rooms) {
      list.push({
        id,
        name: r.name,
        mode: r.mode,
        mapId: r.mapId,
        hasPassword: !!r.password,
        status: r.status,
        playerCount: r.players.size,
        maxPlayers: r.maxPlayers,
        fillBots: r.fillBots
      });
    }
    if (typeof callback === 'function') callback(list);
    else socket.emit('roomsListResponse', list);
  });

  // 2. Create Custom Room
  socket.on('createRoom', (data, callback) => {
    let code = generateRoomCode();
    while (rooms.has(code)) {
      code = generateRoomCode();
    }

    const newRoom = new GameRoom({
      id: code,
      name: data.name?.trim() || `CYBER-${code}`,
      mode: data.mode === 'br' ? 'br' : 'tdm',
      mapId: (['warehouse', 'vault', 'rooftops'].includes(data.mapId) ? data.mapId : 'warehouse'),
      password: data.password?.trim() || '',
      fillBots: data.fillBots !== undefined ? data.fillBots : true,
      hostId: socket.id
    });

    rooms.set(code, newRoom);
    currentRoomId = code;

    const player = newRoom.addPlayer(socket, data.playerName, data.preferredTeam);

    const stagingInfo = newRoom.getStagingInfo();
    io.emit('roomListUpdated'); // Notify public browser

    if (typeof callback === 'function') {
      callback({ success: true, room: stagingInfo, selfPlayer: player });
    } else {
      socket.emit('roomJoined', { success: true, room: stagingInfo, selfPlayer: player });
    }
  });

  // 3. Join Room
  socket.on('joinRoom', (data, callback) => {
    const code = (data.roomId || '').toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      const err = { success: false, message: 'Room not found. Check room code.' };
      if (typeof callback === 'function') return callback(err);
      return socket.emit('roomError', err);
    }

    if (room.password && room.password !== (data.password || '').trim()) {
      const err = { success: false, message: 'Incorrect room password.' };
      if (typeof callback === 'function') return callback(err);
      return socket.emit('roomError', err);
    }

    if (room.players.size >= room.maxPlayers) {
      const err = { success: false, message: 'Room is already full.' };
      if (typeof callback === 'function') return callback(err);
      return socket.emit('roomError', err);
    }

    currentRoomId = code;
    const player = room.addPlayer(socket, data.playerName, data.preferredTeam);

    const stagingInfo = room.getStagingInfo();
    io.to(code).emit('stagingUpdated', stagingInfo);
    io.emit('roomListUpdated');

    const res = { success: true, room: stagingInfo, selfPlayer: player };
    if (typeof callback === 'function') callback(res);
    else socket.emit('roomJoined', res);

    // If game is in progress, send matchStarted immediately to join in-flight
    if (room.status === 'in_progress') {
      socket.emit('matchStarted', {
        roomId: room.id,
        mode: room.mode,
        mapId: room.mapId,
        timeRemaining: room.timeRemainingSec,
        targetKills: room.tdmTargetKills,
        storm: room.mode === 'br' ? room.storm : null,
        powerUps: room.powerUps,
        lootCrates: [...room.lootCrates.values()]
      });
    }
  });

  // 4. Quick Play (Matchmaking)
  socket.on('quickPlay', (data, callback) => {
    const requestedMode = data.mode || 'tdm';
    const requestedMap = (['warehouse', 'vault', 'rooftops'].includes(data.mapId) ? data.mapId : null);
    let matchedRoom = null;

    // Find available public room with space that matches mode and requested map
    for (const [, r] of rooms) {
      if (!r.password && r.mode === requestedMode && (!requestedMap || r.mapId === requestedMap) && r.players.size < r.maxPlayers) {
        matchedRoom = r;
        break;
      }
    }

    if (matchedRoom) {
      currentRoomId = matchedRoom.id;
      const player = matchedRoom.addPlayer(socket, data.playerName);
      const stagingInfo = matchedRoom.getStagingInfo();
      io.to(matchedRoom.id).emit('stagingUpdated', stagingInfo);

      const res = { success: true, room: stagingInfo, selfPlayer: player };
      if (typeof callback === 'function') callback(res);
      else socket.emit('roomJoined', res);

      if (matchedRoom.mode === 'br' && matchedRoom.brState === 'LOBBY_WAITING') {
        matchedRoom.startBRCountdown();
      }

      if (matchedRoom.status === 'in_progress') {
        socket.emit('matchStarted', {
          roomId: matchedRoom.id,
          mode: matchedRoom.mode,
          mapId: matchedRoom.mapId,
          brState: matchedRoom.brState,
          timeRemaining: matchedRoom.timeRemainingSec,
          targetKills: matchedRoom.tdmTargetKills,
          aliveCount: matchedRoom.countAliveCombatants(),
          safeZone: matchedRoom.mode === 'br' ? matchedRoom.safeZone : null,
          storm: matchedRoom.mode === 'br' ? matchedRoom.safeZone : null,
          spawn: { x: player.x, y: player.y, z: player.z, team: player.team },
          groundLoot: matchedRoom.mode === 'br' ? [...matchedRoom.groundLoot.values()] : [],
          powerUps: matchedRoom.powerUps,
          lootCrates: [...matchedRoom.lootCrates.values()]
        });
      }
    } else {
      // Auto-create room for quick player
      let code = generateRoomCode();
      const chosenMap = (['warehouse', 'vault', 'rooftops'].includes(data.mapId) ? data.mapId : 'warehouse');
      const newRoom = new GameRoom({
        id: code,
        name: `Cyber Arena ${code}`,
        mode: requestedMode,
        mapId: chosenMap,
        password: '',
        fillBots: true,
        hostId: socket.id
      });
      rooms.set(code, newRoom);
      currentRoomId = code;

      const player = newRoom.addPlayer(socket, data.playerName);
      const stagingInfo = newRoom.getStagingInfo();

      const res = { success: true, room: stagingInfo, selfPlayer: player };
      if (typeof callback === 'function') callback(res);
      else socket.emit('roomJoined', res);

      if (requestedMode === 'br') {
        newRoom.startBRCountdown();
      }
    }
  });

  // 5. Switch Team (TDM)
  socket.on('switchTeam', (data) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || room.mode !== 'tdm') return;
    const player = room.players.get(socket.id);
    if (!player) return;

    player.team = data.team === 'red' ? 'red' : 'blue';
    const sp = room.getSpawnPoint(player.team);
    player.x = sp.x;
    player.y = sp.y;
    player.z = sp.z;

    io.to(room.id).emit('stagingUpdated', room.getStagingInfo());
  });

  // 6. Toggle Fill Bots (Host only)
  socket.on('toggleFillBots', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || room.hostId !== socket.id) return;
    room.fillBots = !room.fillBots;
    io.to(room.id).emit('stagingUpdated', room.getStagingInfo());
  });

  // 6b. Select Map (Host only)
  socket.on('selectMap', (data) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || room.hostId !== socket.id) return;
    if (data && ['warehouse', 'vault', 'rooftops'].includes(data.mapId)) {
      room.mapId = data.mapId;
      io.to(room.id).emit('stagingUpdated', room.getStagingInfo());
    }
  });

  // 7. Start Match (Host only)
  socket.on('startMatch', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;
    if (room.hostId !== socket.id && room.players.size > 1) return;
    room.startMatch();
  });

  // 8. Player Movement Input
  socket.on('playerInput', (data) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || room.status !== 'in_progress') return;
    const player = room.players.get(socket.id);
    if (!player || !player.isAlive) return;

    if (data.x !== undefined && data.y !== undefined && data.z !== undefined) {
      player.x = Number(data.x);
      player.y = Number(data.y);
      player.z = Number(data.z);
    }
    if (data.yaw !== undefined) player.yaw = Number(data.yaw);
    if (data.pitch !== undefined) player.pitch = Number(data.pitch);
  });

  // 9. Weapon Firing & Raycast Hit Validation
  socket.on('fireWeapon', (data) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || room.status !== 'in_progress') return;
    const player = room.players.get(socket.id);
    if (!player || !player.isAlive) return;

    // Firing cancels ongoing healing application
    if (player.isHealing) {
      player.isHealing = false;
      player.healItem = null;
      socket.emit('healCancelled', { reason: 'Firing weapon cancelled medic item' });
    }

    const wDef = WEAPONS[data.weapon] || WEAPONS.ar;
    player.weapon = data.weapon;

    // Broadcast tracer beam to everyone in room
    socket.to(room.id).emit('playerShotFired', {
      shooterId: player.id,
      weapon: player.weapon,
      origin: data.origin,
      direction: data.direction,
      targetPoint: data.targetPoint
    });

    // Authoritative Hit Check
    if (data.hitEntityId) {
      const victim = room.players.get(data.hitEntityId) || room.bots.get(data.hitEntityId);
      if (victim && victim.isAlive) {
        // Prevent friendly fire in TDM
        if (room.mode === 'tdm' && victim.team === player.team) return;

        // Authoritative Line of Sight check: cannot shoot through solid map walls
        if (!checkLineOfSight(player.x, player.z, victim.x, victim.z, room.mapId)) return;

        const isHead = !!data.isHeadshot;
        let dmg = 0;
        if (data.weapon === 'shotgun') {
          const pelletsHit = Math.max(1, Math.min(8, Number(data.pelletHits) || 1));
          dmg = Math.round(wDef.damage * pelletsHit * (isHead ? wDef.headMult : 1.0));
        } else {
          dmg = Math.round(wDef.damage * (isHead ? wDef.headMult : 1.0));
        }
        room.applyDamage(victim, dmg, player, isHead);
      }
    }
  });

  // 10. Switch Weapon
  socket.on('switchWeapon', (data) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (player && WEAPONS[data.weapon]) {
      // Switching weapon cancels healing
      if (player.isHealing) {
        player.isHealing = false;
        player.healItem = null;
        socket.emit('healCancelled', { reason: 'Switched weapon' });
      }
      player.weapon = data.weapon;
    }
  });

  // 10b. Use Medic / Healing Item
  socket.on('startHealing', (data) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || room.status !== 'in_progress') return;
    const player = room.players.get(socket.id);
    if (!player || !player.isAlive) return;

    const itemKey = data.item;
    const itemDef = MEDIC_ITEMS[itemKey];
    if (!itemDef) return;

    // Check inventory
    if (!player.medic || (player.medic[itemKey] || 0) <= 0) {
      socket.emit('healFailed', { reason: 'No items remaining' });
      return;
    }

    // Check requirements
    if (itemKey === 'bandage' && player.health >= 75) {
      socket.emit('healFailed', { reason: 'Health already at or above 75 HP' });
      return;
    }
    if (itemKey === 'medkit' && player.health >= 100) {
      socket.emit('healFailed', { reason: 'Health already full' });
      return;
    }
    if (itemKey === 'shield_battery' && player.armor >= 100) {
      socket.emit('healFailed', { reason: 'Shield already fully charged' });
      return;
    }

    // Consume 1 item immediately
    player.medic[itemKey]--;
    player.isHealing = true;
    player.healItem = itemKey;
    player.healEnd = Date.now() + itemDef.useTimeMs;

    socket.emit('healStarted', {
      item: itemKey,
      itemName: itemDef.name,
      durationMs: itemDef.useTimeMs,
      medic: player.medic
    });
  });

  socket.on('cancelHealing', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (player && player.isHealing) {
      player.isHealing = false;
      player.healItem = null;
      socket.emit('healCancelled', { reason: 'Cancelled by player' });
    }
  });

  socket.on('pickupLoot', (data) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || room.status !== 'in_progress') return;
    const player = room.players.get(socket.id);
    if (!player || !player.isAlive) return;
    room.handleManualPickup(player, data ? data.id : null);
  });

  socket.on('pickupGroundLoot', (data) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || room.status !== 'in_progress') return;
    const player = room.players.get(socket.id);
    if (!player || !player.isAlive) return;
    if (data && data.id) {
      room.handleGroundLootPickup(player, data.id);
    }
  });

  // 11. Spectate Next Target (BR)
  socket.on('cycleSpectate', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || room.mode !== 'br') return;
    const player = room.players.get(socket.id);
    if (!player || !player.isSpectating) return;

    const nextTarget = room.getNextSpectateTarget(player.spectateTarget);
    if (nextTarget) {
      player.spectateTarget = nextTarget.id;
      socket.emit('enterSpectatorMode', {
        spectatingId: nextTarget.id,
        spectatingName: nextTarget.name
      });
    }
  });

  // 12. Return to Lobby / Leave Room / Leave Match
  const handleLeave = () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (room) {
      socket.leave(room.id);
      room.removePlayer(socket.id);
      if (room.players.size === 0) {
        room.stopLoop();
        rooms.delete(room.id);
      } else {
        io.to(room.id).emit('stagingUpdated', room.getStagingInfo());
      }
      io.emit('roomListUpdated');
    }
    currentRoomId = null;
    socket.emit('leftRoom');
    socket.emit('matchLeft');
  };

  socket.on('leaveRoom', handleLeave);
  socket.on('leaveMatch', handleLeave);

  // 13. Disconnect
  socket.on('disconnect', () => {
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.removePlayer(socket.id);
        if (room.players.size === 0) {
          room.stopLoop();
          rooms.delete(room.id);
        } else {
          io.to(room.id).emit('stagingUpdated', room.getStagingInfo());
        }
        io.emit('roomListUpdated');
      }
    }
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Dlicom Arena: Cyber Warfare] Server running on port ${PORT}`);
});

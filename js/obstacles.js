/**
 * Arcade Multi-Lane Traffic Manager & Procedural Formations
 * Guarantees 100% solvable paths + Wings & Orbs power-ups.
 */

const VEHICLE_COLORS = [
  { body: '#e2e8f0', roof: '#cbd5e1', accent: '#94a3b8' }, // Silver
  { body: '#1e293b', roof: '#0f172a', accent: '#334155' }, // Midnight Slate
  { body: '#0284c7', roof: '#0369a1', accent: '#075985' }, // Cyber Blue
  { body: '#e11d48', roof: '#be123c', accent: '#9f1239' }, // Neon Crimson
  { body: '#059669', roof: '#047857', accent: '#065f46' }, // Emerald
  { body: '#d97706', roof: '#b45309', accent: '#92400e' }, // Amber
  { body: '#7c3aed', roof: '#6d28d9', accent: '#5b21b6' }, // Royal Violet
  { body: '#ffffff', roof: '#f1f5f9', accent: '#e2e8f0' }, // Pure White
];

class ObstacleManager {
  constructor() {
    this.obstacles = [];
    this.collectibles = []; // Energy Orbs & Wings
    this.spawnTimer = 0;
    this.spawnInterval = 1.15;
    this.passedCount = 0;
    this.nearMissCount = 0;
    this.collectedOrbs = 0;
    this.collectedWings = 0;

    // Road definition
    this.road = {
      x: 0,
      y: 0,
      width: 520,
      height: 800,
      laneCount: 5,
      laneWidth: 104,
      laneCenters: [],
      stripeOffset: 0
    };

    this.waveIndex = 0;
    this.lastSafeLanes = [2];
    this.wingSpawnTimer = 0;
    this.wingSpawnInterval = 18; // spawn wings every ~18 seconds
  }

  reset() {
    this.obstacles = [];
    this.collectibles = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.15;
    this.passedCount = 0;
    this.nearMissCount = 0;
    this.collectedOrbs = 0;
    this.collectedWings = 0;
    this.waveIndex = 0;
    this.lastSafeLanes = [2];
    this.wingSpawnTimer = 0;
  }

  updateRoadGeometry(canvasWidth, canvasHeight) {
    const maxWidth = Math.min(canvasWidth * 0.95, 660);
    const minWidth = Math.min(canvasWidth * 0.96, 390);
    
    this.road.width = Math.max(minWidth, Math.min(maxWidth, canvasWidth * 0.7));
    this.road.height = canvasHeight;
    this.road.x = (canvasWidth - this.road.width) / 2;
    this.road.y = 0;
    this.road.laneWidth = this.road.width / this.road.laneCount;

    this.road.laneCenters = [];
    for (let i = 0; i < this.road.laneCount; i++) {
      this.road.laneCenters.push(this.road.x + this.road.laneWidth * (i + 0.5));
    }
  }

  getLaneX(laneIndex) {
    const idx = Math.max(0, Math.min(this.road.laneCount - 1, laneIndex));
    return this.road.laneCenters[idx] || (this.road.x + this.road.laneWidth * (idx + 0.5));
  }

  update(dt, playerSpeed, player) {
    this.road.stripeOffset = (this.road.stripeOffset + playerSpeed * dt * 0.9) % 60;

    // Dynamic wave spawner
    this.spawnTimer += dt;
    this.wingSpawnTimer += dt;

    const currentInterval = Math.max(0.75, this.spawnInterval - (playerSpeed - 90) * 0.003);

    if (this.spawnTimer >= currentInterval) {
      this.spawnTimer = 0;
      this.spawnPatternWave(playerSpeed);
    }

    // Update Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      const relativeSpeed = (playerSpeed - obs.speed) * 4.5;
      obs.y += relativeSpeed * dt;

      if (obs.isDrifting && obs.driftTimer > 0) {
        obs.driftTimer -= dt;
        obs.x += obs.driftDir * dt * 25;
      }

      if (!obs.hasPassed && obs.y > player.y + player.height / 2) {
        obs.hasPassed = true;
        this.passedCount++;
      }

      // Near-miss check (only when not flying or airborne)
      if (!obs.nearMissTriggered && !obs.hasCrashed && !player.isDead) {
        const dx = Math.abs(player.x - obs.x);
        const dy = Math.abs(player.y - obs.y);
        const nearX = (player.width + obs.width) * 0.5 + 20;
        const nearY = (player.height + obs.height) * 0.5 + 24;

        if (dx < nearX && dy < nearY && !player.isInAir() && !player.isFlying) {
          obs.nearMissTriggered = true;
          this.nearMissCount++;

          if (window.gameInstance) {
            window.gameInstance.registerNearMiss(obs.x, obs.y);
          }
        }
      }

      if (obs.y > this.road.height + 250 || obs.y < -600) {
        this.obstacles.splice(i, 1);
      }
    }

    // Update Collectibles (Orbs & Wings)
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      item.y += playerSpeed * 4.5 * dt;
      item.rotation += dt * 3;
      item.hoverTime = (item.hoverTime || 0) + dt * 4;

      // Collection detection
      const dx = Math.abs(player.x - item.x);
      const dy = Math.abs(player.y - item.y);

      if (dx < 36 && dy < 48 && !player.isDead) {
        if (item.type === 'wings') {
          // Collect Wings Power-Up!
          this.collectedWings++;
          player.activateFlight(5.5);

          if (window.soundEngine) window.soundEngine.playWingPickup();
          if (window.particleSystem) {
            window.particleSystem.createWingsPickup(item.x, item.y);
            window.particleSystem.addFloatingText(item.x, item.y - 25, 'WINGS DEPLOYED! FLY!', '#fbbf24', 18);
          }
          if (window.gameInstance) {
            window.gameInstance.onWingsPickedUp();
          }
        } else {
          // Collect Energy Orb
          this.collectedOrbs++;
          player.reduceJumpCooldown(1.5);

          if (window.soundEngine) window.soundEngine.playTokenPickup();
          if (window.particleSystem) {
            window.particleSystem.createOrbCollect(item.x, item.y);
            window.particleSystem.addFloatingText(item.x, item.y - 20, '+100 ORB', '#f59e0b', 14);
          }
          if (window.gameInstance) {
            window.gameInstance.addScore(100);
            window.gameInstance.updateTokenCount(this.collectedOrbs);
          }
        }

        this.collectibles.splice(i, 1);
        continue;
      }

      if (item.y > this.road.height + 120) {
        this.collectibles.splice(i, 1);
      }
    }
  }

  spawnPatternWave(playerSpeed) {
    this.waveIndex++;
    const patternType = this.waveIndex % 5;
    
    const prevSafe = this.lastSafeLanes[0] || 2;
    let safeLane = prevSafe;

    const step = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1);
    safeLane = Math.max(0, Math.min(4, prevSafe + step));
    this.lastSafeLanes = [safeLane];

    const secondSafeLane = safeLane <= 2 ? safeLane + 2 : safeLane - 2;

    const lanesToBlock = [0, 1, 2, 3, 4].filter(
      l => l !== safeLane && (Math.random() < 0.65 ? l !== secondSafeLane : true)
    );

    for (const lane of lanesToBlock) {
      const isBlocked = this.obstacles.some(
        o => o.lane === lane && o.y < 100 && o.y > -260
      );
      if (!isBlocked) {
        this.createObstacle(lane, playerSpeed, patternType);
      }
    }

    // Check if time to spawn Wings Power-Up
    if (this.wingSpawnTimer >= this.wingSpawnInterval) {
      this.wingSpawnTimer = 0;
      this.spawnWings(safeLane);
    } else if (Math.random() < 0.75) {
      this.spawnOrb(safeLane);
    }
  }

  createObstacle(lane, playerSpeed, patternType) {
    const rand = Math.random();
    let type = 'sedan';
    let width = this.road.laneWidth * 0.62;
    let height = 66;
    let speed = 35 + Math.random() * 25;

    if (rand < 0.42) {
      type = 'sedan';
      height = 64 + Math.random() * 8;
      speed = 42 + Math.random() * 32;
    } else if (rand < 0.70) {
      type = 'bus';
      height = 135 + Math.random() * 20;
      width = this.road.laneWidth * 0.7;
      speed = 28 + Math.random() * 18;
    } else if (rand < 0.88) {
      type = 'truck';
      height = 105 + Math.random() * 15;
      width = this.road.laneWidth * 0.66;
      speed = 32 + Math.random() * 22;
    } else {
      type = 'barrier';
      height = 36;
      width = this.road.laneWidth * 0.72;
      speed = 0;
    }

    const palette = VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)];
    const x = this.getLaneX(lane);
    const y = -height - 60 - Math.random() * 30;

    this.obstacles.push({
      lane: lane,
      x: x,
      y: y,
      width: width,
      height: height,
      type: type,
      speed: speed,
      palette: palette,
      hasPassed: false,
      nearMissTriggered: false,
      hasCrashed: false,
      isDrifting: Math.random() < 0.15,
      driftDir: Math.random() < 0.5 ? -1 : 1,
      driftTimer: 1.5
    });
  }

  spawnOrb(lane) {
    const x = this.getLaneX(lane);
    const y = -60 - Math.random() * 40;

    this.collectibles.push({
      type: 'orb',
      lane: lane,
      x: x,
      y: y,
      size: 14,
      rotation: 0,
      hoverTime: 0
    });
  }

  spawnWings(lane) {
    const x = this.getLaneX(lane);
    const y = -70;

    this.collectibles.push({
      type: 'wings',
      lane: lane,
      x: x,
      y: y,
      size: 20,
      rotation: 0,
      hoverTime: 0
    });
  }

  renderRoad(ctx) {
    const r = this.road;

    ctx.save();

    // Road Base
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(r.x, 0, r.width, r.height);

    // Shoulders
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(r.x - 14, 0, 14, r.height);
    ctx.fillRect(r.x + r.width, 0, 14, r.height);

    // Neon Edge Glow
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
    ctx.shadowBlur = 8;
    ctx.fillRect(r.x, 0, 3, r.height);
    ctx.fillRect(r.x + r.width - 3, 0, 3, r.height);
    ctx.shadowBlur = 0;

    // Dashed Lane Separators
    const stripeLen = 34;
    const gapLen = 26;
    const totalCycle = stripeLen + gapLen;
    const offset = this.road.stripeOffset % totalCycle;

    ctx.fillStyle = '#cbd5e1';

    for (let l = 1; l < r.laneCount; l++) {
      const lineX = r.x + l * r.laneWidth;
      for (let y = -totalCycle + offset; y < r.height + totalCycle; y += totalCycle) {
        ctx.fillRect(lineX - 1.5, y, 3, stripeLen);
      }
    }

    ctx.restore();
  }

  renderCollectibles(ctx) {
    ctx.save();

    for (const item of this.collectibles) {
      if (item.type === 'wings') {
        this.renderWingsPickup(ctx, item);
      } else {
        this.renderOrbPickup(ctx, item);
      }
    }

    ctx.restore();
  }

  renderOrbPickup(ctx, orb) {
    ctx.save();
    ctx.translate(orb.x, orb.y);
    ctx.rotate(orb.rotation);

    const pulse = 1 + Math.sin(orb.hoverTime) * 0.15;
    ctx.strokeStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(0, -orb.size * pulse);
    ctx.lineTo(orb.size * pulse, 0);
    ctx.lineTo(0, orb.size * pulse);
    ctx.lineTo(-orb.size * pulse, 0);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 0, orb.size * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderWingsPickup(ctx, wings) {
    const hoverY = Math.sin(wings.hoverTime) * 6;
    const flap = Math.sin(wings.hoverTime * 1.5) * 0.25;

    ctx.save();
    ctx.translate(wings.x, wings.y + hoverY);

    // Glowing Halo Ring
    ctx.strokeStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 16;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -14, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Central Power Core
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Left Wing
    ctx.save();
    ctx.rotate(flap);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.quadraticCurveTo(-18, -12, -32, -4);
    ctx.quadraticCurveTo(-24, 6, -14, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Right Wing
    ctx.save();
    ctx.rotate(-flap);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(18, -12, 32, -4);
    ctx.quadraticCurveTo(24, 6, 14, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  renderObstacles(ctx) {
    ctx.save();
    for (const obs of this.obstacles) {
      if (obs.type === 'barrier') {
        this.renderBarrier(ctx, obs);
      } else if (obs.type === 'bus') {
        this.renderBus(ctx, obs);
      } else if (obs.type === 'truck') {
        this.renderTruck(ctx, obs);
      } else {
        this.renderSedan(ctx, obs);
      }
    }
    ctx.restore();
  }

  renderSedan(ctx, obs) {
    const { x, y, width, height, palette } = obs;
    const halfW = width / 2;
    const halfH = height / 2;

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.roundRect(-halfW + 2, -halfH + 4, width - 4, height, 10);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW - 2, -halfH + 10, 4, 14);
    ctx.fillRect(halfW - 2, -halfH + 10, 4, 14);
    ctx.fillRect(-halfW - 2, halfH - 24, 4, 14);
    ctx.fillRect(halfW - 2, halfH - 24, 4, 14);

    ctx.fillStyle = palette.body;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, width, height, 10);
    ctx.fill();

    ctx.fillStyle = palette.roof;
    ctx.beginPath();
    ctx.roundRect(-halfW + 4, -halfH + 14, width - 8, height - 28, 6);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-halfW + 6, -halfH + 16, width - 12, 10, 3);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(-halfW + 6, halfH - 26, width - 12, 8, 3);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 4;
    ctx.fillRect(-halfW + 5, halfH - 3, 7, 3);
    ctx.fillRect(halfW - 12, halfH - 3, 7, 3);

    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 5;
    ctx.fillRect(-halfW + 5, -halfH, 7, 3);
    ctx.fillRect(halfW - 12, -halfH, 7, 3);

    ctx.restore();
  }

  renderBus(ctx, obs) {
    const { x, y, width, height, palette } = obs;
    const halfW = width / 2;
    const halfH = height / 2;

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    ctx.beginPath();
    ctx.roundRect(-halfW + 2, -halfH + 5, width - 4, height, 8);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW - 2, -halfH + 16, 4, 16);
    ctx.fillRect(halfW - 2, -halfH + 16, 4, 16);
    ctx.fillRect(-halfW - 2, halfH - 42, 4, 16);
    ctx.fillRect(halfW - 2, halfH - 42, 4, 16);
    ctx.fillRect(-halfW - 2, halfH - 22, 4, 16);
    ctx.fillRect(halfW - 2, halfH - 22, 4, 16);

    ctx.fillStyle = palette.body;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, width, height, 8);
    ctx.fill();

    ctx.fillStyle = palette.roof;
    ctx.beginPath();
    ctx.roundRect(-halfW + 4, -halfH + 8, width - 8, height - 16, 5);
    ctx.fill();

    ctx.fillStyle = palette.accent;
    ctx.fillRect(-halfW + 10, -halfH + 24, width - 20, 14);
    ctx.fillRect(-halfW + 10, halfH - 38, width - 20, 14);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-halfW + 5, halfH - 12, width - 10, 8, 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-halfW + 4, halfH - 2, 8, 2.5);
    ctx.fillRect(halfW - 12, halfH - 2, 8, 2.5);

    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6;
    ctx.fillRect(-halfW + 4, -halfH, 8, 2.5);
    ctx.fillRect(halfW - 12, -halfH, 8, 2.5);

    ctx.restore();
  }

  renderTruck(ctx, obs) {
    const { x, y, width, height, palette } = obs;
    const halfW = width / 2;
    const halfH = height / 2;

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    ctx.beginPath();
    ctx.roundRect(-halfW + 2, -halfH + 5, width - 4, height, 6);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW - 2, -halfH + 12, 4, 16);
    ctx.fillRect(halfW - 2, -halfH + 12, 4, 16);
    ctx.fillRect(-halfW - 2, halfH - 28, 4, 16);
    ctx.fillRect(halfW - 2, halfH - 28, 4, 16);

    ctx.fillStyle = palette.body;
    ctx.beginPath();
    ctx.roundRect(-halfW, halfH - 30, width, 30, [0, 0, 8, 8]);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW + 5, halfH - 14, width - 10, 8);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-halfW + 2, -halfH, width - 4, height - 34, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-halfW + 4, halfH - 2, 7, 2);
    ctx.fillRect(halfW - 11, halfH - 2, 7, 2);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-halfW + 4, -halfH, 7, 2);
    ctx.fillRect(halfW - 11, -halfH, 7, 2);

    ctx.restore();
  }

  renderBarrier(ctx, obs) {
    const { x, y, width, height } = obs;
    const halfW = width / 2;
    const halfH = height / 2;

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(-halfW + 2, -halfH + 4, width - 4, height);

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-halfW, -halfH, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(-halfW, -halfH, width, height);
    ctx.clip();

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-halfW, -halfH, width, height);

    ctx.fillStyle = '#ffffff';
    const stripeW = 12;
    for (let sx = -halfW - height; sx < halfW + height; sx += stripeW * 2) {
      ctx.beginPath();
      ctx.moveTo(sx, -halfH);
      ctx.lineTo(sx + stripeW, -halfH);
      ctx.lineTo(sx + stripeW + height, halfH);
      ctx.lineTo(sx + height, halfH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    const blink = Math.sin(Date.now() * 0.008) > 0;
    ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(-halfW + 8, -halfH + 4, 3.5, 0, Math.PI * 2);
    ctx.arc(halfW - 8, -halfH + 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

window.ObstacleManager = ObstacleManager;

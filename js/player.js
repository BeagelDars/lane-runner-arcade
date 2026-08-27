/**
 * Player Car Entity, Custom Skin Renderers & Bobik The Dog Car
 */

const CAR_SKINS = {
  apex: {
    id: 'apex',
    name: 'Apex Cobalt',
    rarity: 'COMMON',
    rarityClass: 'rarity-common',
    price: 0,
    desc: 'Precision engineered cobalt cyber sports chassis.'
  },
  phantom: {
    id: 'phantom',
    name: 'Neon Phantom',
    rarity: 'RARE',
    rarityClass: 'rarity-rare',
    price: 50,
    desc: 'Matte carbon racer with toxic emerald neon underglow.'
  },
  solar: {
    id: 'solar',
    name: 'Solar Flare',
    rarity: 'EPIC',
    rarityClass: 'rarity-epic',
    price: 120,
    desc: 'Hypercar forged in molten amber with golden flame exhausts.'
  },
  cybertruck: {
    id: 'cybertruck',
    name: 'Cyber Truck',
    rarity: 'CYBER',
    rarityClass: 'rarity-cyber',
    price: 220,
    desc: 'Angular stainless steel beast with ultra-wide laser lightbar.'
  },
  bobik: {
    id: 'bobik',
    name: 'Bobik The Dog',
    rarity: 'LEGENDARY',
    rarityClass: 'rarity-legendary',
    price: 450,
    desc: 'The legendary puppy car! Floppy flapping ears, wagging tail & woof barks!'
  }
};

class PlayerCar {
  constructor(roadManager) {
    this.road = roadManager;
    this.currentLane = 2;
    this.targetLane = 2;

    this.x = 0;
    this.y = 0;
    this.width = 44;
    this.height = 76;

    // Smooth Diagonal Steering Physics
    this.vx = 0;
    this.maxLateralSpeed = 270;
    this.lateralAccel = 1100;
    this.tilt = 0;
    this.wheelSteerAngle = 0;

    // Jump Physics
    this.isJumping = false;
    this.jumpTimer = 0;
    this.jumpDuration = 1.35;
    this.z = 0;
    this.jumpCooldownTimer = 0;
    this.jumpCooldownDuration = 9.5;

    // Wings & Flight Power-Up
    this.isFlying = false;
    this.flightTimer = 0;
    this.flightDuration = 5.5;
    this.wingDeployProgress = 0;
    this.warningBeepPlayed = false;

    // Equipped Skin
    this.currentSkin = localStorage.getItem('lane_runner_equipped_skin') || 'apex';

    this.isDead = false;
  }

  reset() {
    this.currentLane = 2;
    this.targetLane = 2;
    this.x = this.road.getLaneX(2);
    this.vx = 0;
    this.tilt = 0;
    this.wheelSteerAngle = 0;

    this.isJumping = false;
    this.jumpTimer = 0;
    this.z = 0;
    this.jumpCooldownTimer = 0;

    this.isFlying = false;
    this.flightTimer = 0;
    this.wingDeployProgress = 0;
    this.warningBeepPlayed = false;

    this.isDead = false;
  }

  setSkin(skinId) {
    if (CAR_SKINS[skinId]) {
      this.currentSkin = skinId;
      localStorage.setItem('lane_runner_equipped_skin', skinId);
    }
  }

  activateFlight(duration = 5.5) {
    this.isFlying = true;
    this.flightTimer = duration;
    this.flightDuration = duration;
    this.warningBeepPlayed = false;

    if (this.currentSkin === 'bobik' && window.soundEngine) {
      window.soundEngine.playDogBark();
    }
  }

  reduceJumpCooldown(seconds) {
    if (this.jumpCooldownTimer > 0) {
      this.jumpCooldownTimer = Math.max(0, this.jumpCooldownTimer - seconds);
      if (this.jumpCooldownTimer === 0 && window.soundEngine) {
        window.soundEngine.playJumpReady();
      }
    }
  }

  update(dt, canvasHeight) {
    this.y = canvasHeight - 140;
    if (this.isDead) return;

    // 1. Lateral Steering Physics
    const targetX = this.road.getLaneX(this.targetLane);
    const dx = targetX - this.x;
    const dist = Math.abs(dx);

    if (dist > 0.5) {
      const speedCap = this.isFlying ? this.maxLateralSpeed * 1.25 : this.maxLateralSpeed;
      const desiredSpeed = Math.min(speedCap, Math.sqrt(2 * this.lateralAccel * dist) * 0.85);
      const targetVx = Math.sign(dx) * desiredSpeed;

      const dv = targetVx - this.vx;
      const step = Math.sign(dv) * Math.min(Math.abs(dv), this.lateralAccel * dt);
      this.vx += step;
      this.x += this.vx * dt;

      if (Math.abs(targetX - this.x) < 1.0 && Math.abs(this.vx) < 30) {
        this.x = targetX;
        this.vx = 0;
      }
    } else {
      this.x = targetX;
      this.vx = 0;
    }

    // 2. Dynamic Chassis Tilt & Wheel Angles
    const normalizedVx = this.vx / this.maxLateralSpeed;
    const targetTilt = normalizedVx * 0.18;
    this.tilt += (targetTilt - this.tilt) * Math.min(1, dt * 12);

    const targetWheelAngle = Math.max(-0.35, Math.min(0.35, (dx / (this.road.road.laneWidth || 95)) * 0.45));
    this.wheelSteerAngle += (targetWheelAngle - this.wheelSteerAngle) * Math.min(1, dt * 16);

    // 3. Flight Mode Physics & Wing Deployment
    if (this.isFlying) {
      this.flightTimer -= dt;
      this.wingDeployProgress = Math.min(1, this.wingDeployProgress + dt * 4);
      this.z += (1.15 - this.z) * Math.min(1, dt * 6);

      if (this.flightTimer <= 1.5 && !this.warningBeepPlayed) {
        this.warningBeepPlayed = true;
        if (window.soundEngine) window.soundEngine.playFlightWarning();
      }

      if (window.particleSystem && Math.random() < 0.8) {
        const wingSpan = 45 * this.wingDeployProgress;
        window.particleSystem.createWingVortex(this.x - wingSpan, this.x + wingSpan, this.y);
      }

      if (this.flightTimer <= 0) {
        this.isFlying = false;
        if (window.soundEngine) window.soundEngine.playLanding();
        if (window.particleSystem) window.particleSystem.createLandingPuff(this.x, this.y);
        if (window.gameInstance) window.gameInstance.triggerCameraShake(3, 0.2);
      }
    } else {
      this.wingDeployProgress = Math.max(0, this.wingDeployProgress - dt * 3);

      if (this.isJumping) {
        this.jumpTimer += dt;
        const t = this.jumpTimer / this.jumpDuration;

        if (t >= 1) {
          this.isJumping = false;
          this.z = 0;
          this.jumpTimer = 0;
          this.jumpCooldownTimer = this.jumpCooldownDuration;

          if (window.soundEngine) window.soundEngine.playLanding();
          if (window.particleSystem) window.particleSystem.createLandingPuff(this.x, this.y);
          if (window.gameInstance) window.gameInstance.triggerCameraShake(4.5, 0.22);
        } else {
          this.z = 4 * t * (1 - t);
        }
      } else {
        this.z += (0 - this.z) * Math.min(1, dt * 10);
      }

      if (this.jumpCooldownTimer > 0) {
        const prevCooldown = this.jumpCooldownTimer;
        this.jumpCooldownTimer = Math.max(0, this.jumpCooldownTimer - dt);

        if (prevCooldown > 0 && this.jumpCooldownTimer === 0) {
          if (window.soundEngine) window.soundEngine.playJumpReady();
          if (window.particleSystem) {
            window.particleSystem.addFloatingText(this.x, this.y - 30, 'OVERDRIVE READY', '#38bdf8', 14);
          }
        }
      }
    }

    // 4. Exhaust Particles
    if (window.particleSystem && Math.random() < 0.65) {
      const isBoosting = this.isInAir() || this.isFlying;
      window.particleSystem.createExhaust(this.x - 12, this.y + this.height / 2 - 4, isBoosting);
      window.particleSystem.createExhaust(this.x + 12, this.y + this.height / 2 - 4, isBoosting);
    }
  }

  moveLeft() {
    if (this.isDead) return false;
    if (this.targetLane > 0) {
      this.targetLane--;
      if (window.soundEngine) window.soundEngine.playLaneShift();
      return true;
    }
    return false;
  }

  moveRight() {
    if (this.isDead) return false;
    if (this.targetLane < this.road.road.laneCount - 1) {
      this.targetLane++;
      if (window.soundEngine) window.soundEngine.playLaneShift();
      return true;
    }
    return false;
  }

  setLane(laneIndex) {
    if (this.isDead) return false;
    const clamped = Math.max(0, Math.min(this.road.road.laneCount - 1, laneIndex));
    if (clamped !== this.targetLane) {
      this.targetLane = clamped;
      if (window.soundEngine) window.soundEngine.playLaneShift();
      return true;
    }
    return false;
  }

  jump() {
    if (this.isDead || this.isJumping || this.isFlying || this.jumpCooldownTimer > 0) return false;

    this.isJumping = true;
    this.jumpTimer = 0;
    this.z = 0.05;

    if (this.currentSkin === 'bobik' && window.soundEngine) {
      window.soundEngine.playDogBark();
    } else if (window.soundEngine) {
      window.soundEngine.playJump();
    }

    if (window.particleSystem) window.particleSystem.createJumpRing(this.x, this.y);
    if (window.gameInstance) {
      window.gameInstance.triggerCameraShake(3, 0.18);
      window.gameInstance.showArcadeBanner(this.currentSkin === 'bobik' ? 'BOBIK SUPER JUMP! WOOF!' : 'SUPER JUMP!');
    }

    return true;
  }

  isInAir() {
    return this.isFlying || (this.isJumping && this.z > 0.22);
  }

  getJumpProgress() {
    if (this.isJumping) return 0;
    if (this.jumpCooldownTimer <= 0) return 1;
    return 1 - (this.jumpCooldownTimer / this.jumpCooldownDuration);
  }

  render(ctx) {
    if (this.isDead) return;

    const scale = 1 + this.z * 0.38;
    const shadowScale = Math.max(0.32, 1 - this.z * 0.45);
    const shadowOffsetY = 12 + this.z * 26;
    const halfW = this.width / 2;
    const halfH = this.height / 2;

    ctx.save();

    // 1. Headlight Glow Beams
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tilt);

    const beamColor = this.currentSkin === 'phantom' ? 'rgba(16, 185, 129, 0.45)' :
                      this.currentSkin === 'solar' ? 'rgba(245, 158, 11, 0.45)' :
                      this.currentSkin === 'bobik' ? 'rgba(251, 191, 36, 0.45)' : 'rgba(56, 189, 248, 0.45)';

    const lightGrad = ctx.createLinearGradient(0, -halfH, 0, -halfH - 180);
    lightGrad.addColorStop(0, beamColor);
    lightGrad.addColorStop(0.3, beamColor.replace('0.45', '0.2'));
    lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.moveTo(-14, -halfH);
    ctx.lineTo(-42, -halfH - 180);
    ctx.lineTo(42, -halfH - 180);
    ctx.lineTo(14, -halfH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Ground Shadow
    ctx.fillStyle = `rgba(0, 0, 0, ${0.18 * (1 - this.z * 0.4)})`;
    ctx.beginPath();
    ctx.roundRect(
      this.x - (halfW - 2) * shadowScale,
      this.y - (halfH - 4) * shadowScale + shadowOffsetY,
      (this.width - 4) * shadowScale,
      this.height * shadowScale,
      8 * shadowScale
    );
    ctx.fill();

    // 3. Elevated Car Body
    ctx.translate(this.x, this.y - this.z * 46);
    ctx.rotate(this.tilt);
    ctx.scale(scale, scale);

    // Render Cyber Wings if Deployed
    if (this.wingDeployProgress > 0.01) {
      this.renderCyberWings(ctx, halfW, halfH);
    }

    // Render Specific Equipped Skin
    this.renderSkinBody(ctx, this.currentSkin, halfW, halfH);

    ctx.restore();
  }

  renderSkinBody(ctx, skinId, halfW, halfH) {
    if (skinId === 'bobik') {
      this.renderBobikCar(ctx, halfW, halfH);
    } else if (skinId === 'phantom') {
      this.renderPhantomCar(ctx, halfW, halfH);
    } else if (skinId === 'solar') {
      this.renderSolarCar(ctx, halfW, halfH);
    } else if (skinId === 'cybertruck') {
      this.renderCyberTruck(ctx, halfW, halfH);
    } else {
      this.renderApexCar(ctx, halfW, halfH);
    }
  }

  // --- 1. APEX COBALT (DEFAULT) ---
  renderApexCar(ctx, halfW, halfH) {
    // Wheels
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW - 2.5, halfH - 27, 4.5, 15);
    ctx.fillRect(halfW - 2, halfH - 27, 4.5, 15);

    ctx.save();
    ctx.translate(-halfW - 0.5, -halfH + 19);
    ctx.rotate(this.wheelSteerAngle);
    ctx.fillRect(-2, -7.5, 4.5, 15);
    ctx.restore();

    ctx.save();
    ctx.translate(halfW + 0.5, -halfH + 19);
    ctx.rotate(this.wheelSteerAngle);
    ctx.fillRect(-2, -7.5, 4.5, 15);
    ctx.restore();

    // Body
    const bodyGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
    bodyGrad.addColorStop(0, '#0284c7');
    bodyGrad.addColorStop(0.5, '#2563eb');
    bodyGrad.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, this.width, this.height, 12);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = '#1e40af';
    ctx.beginPath();
    ctx.roundRect(-halfW + 8, -halfH + 6, this.width - 16, 12, 4);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-halfW + 5, -halfH + 20, this.width - 10, this.height - 36, 7);
    ctx.fill();

    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.beginPath();
    ctx.roundRect(-halfW + 7, -halfH + 22, (this.width - 14) * 0.45, this.height - 40, 4);
    ctx.fill();

    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-halfW + 4, halfH - 6, this.width - 8, 4.5);

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fillRect(-halfW + 5, -halfH + 1, 7, 3);
    ctx.fillRect(halfW - 12, -halfH + 1, 7, 3);

    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.fillRect(-halfW + 5, halfH - 3, 8, 3);
    ctx.fillRect(halfW - 13, halfH - 3, 8, 3);
  }

  // --- 2. NEON PHANTOM (EMERALD) ---
  renderPhantomCar(ctx, halfW, halfH) {
    ctx.fillStyle = '#022c22';
    ctx.fillRect(-halfW - 2.5, halfH - 27, 4.5, 15);
    ctx.fillRect(halfW - 2, halfH - 27, 4.5, 15);

    ctx.save();
    ctx.translate(-halfW - 0.5, -halfH + 19);
    ctx.rotate(this.wheelSteerAngle);
    ctx.fillRect(-2, -7.5, 4.5, 15);
    ctx.restore();

    ctx.save();
    ctx.translate(halfW + 0.5, -halfH + 19);
    ctx.rotate(this.wheelSteerAngle);
    ctx.fillRect(-2, -7.5, 4.5, 15);
    ctx.restore();

    // Body
    const bodyGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
    bodyGrad.addColorStop(0, '#064e3b');
    bodyGrad.addColorStop(0.5, '#047857');
    bodyGrad.addColorStop(1, '#065f46');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, this.width, this.height, 12);
    ctx.fill();

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = '#022c22';
    ctx.beginPath();
    ctx.roundRect(-halfW + 5, -halfH + 18, this.width - 10, this.height - 34, 6);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 12;
    ctx.fillRect(-halfW + 4, -halfH + 2, 8, 3);
    ctx.fillRect(halfW - 12, -halfH + 2, 8, 3);

    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 10;
    ctx.fillRect(-halfW + 4, halfH - 3, 8, 3);
    ctx.fillRect(halfW - 12, halfH - 3, 8, 3);
  }

  // --- 3. SOLAR FLARE (MOLTEN HYPERCAR) ---
  renderSolarCar(ctx, halfW, halfH) {
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-halfW - 2.5, halfH - 27, 4.5, 15);
    ctx.fillRect(halfW - 2, halfH - 27, 4.5, 15);

    ctx.save();
    ctx.translate(-halfW - 0.5, -halfH + 19);
    ctx.rotate(this.wheelSteerAngle);
    ctx.fillRect(-2, -7.5, 4.5, 15);
    ctx.restore();

    ctx.save();
    ctx.translate(halfW + 0.5, -halfH + 19);
    ctx.rotate(this.wheelSteerAngle);
    ctx.fillRect(-2, -7.5, 4.5, 15);
    ctx.restore();

    const bodyGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
    bodyGrad.addColorStop(0, '#f59e0b');
    bodyGrad.addColorStop(0.5, '#ea580c');
    bodyGrad.addColorStop(1, '#be123c');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, this.width, this.height, 12);
    ctx.fill();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-halfW + 6, -halfH + 20, this.width - 12, this.height - 38, 6);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 14;
    ctx.fillRect(-halfW + 4, -halfH + 2, 8, 3);
    ctx.fillRect(halfW - 12, -halfH + 2, 8, 3);

    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.fillRect(-halfW + 4, halfH - 3, 9, 3.5);
    ctx.fillRect(halfW - 13, halfH - 3, 9, 3.5);
  }

  // --- 4. CYBER TRUCK (STAINLESS STEEL) ---
  renderCyberTruck(ctx, halfW, halfH) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW - 3, halfH - 28, 5, 16);
    ctx.fillRect(halfW - 2, halfH - 28, 5, 16);

    ctx.save();
    ctx.translate(-halfW - 0.5, -halfH + 19);
    ctx.rotate(this.wheelSteerAngle);
    ctx.fillRect(-2, -7.5, 5, 16);
    ctx.restore();

    ctx.save();
    ctx.translate(halfW + 0.5, -halfH + 19);
    ctx.rotate(this.wheelSteerAngle);
    ctx.fillRect(-2, -7.5, 5, 16);
    ctx.restore();

    // Angular Polygon Body
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(-halfW + 4, -halfH);
    ctx.lineTo(halfW - 4, -halfH);
    ctx.lineTo(halfW + 2, -halfH + 22);
    ctx.lineTo(halfW, halfH);
    ctx.lineTo(-halfW, halfH);
    ctx.lineTo(-halfW - 2, -halfH + 22);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Triangular Roof
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-halfW + 6, -halfH + 18);
    ctx.lineTo(halfW - 6, -halfH + 18);
    ctx.lineTo(halfW - 2, halfH - 22);
    ctx.lineTo(-halfW + 2, halfH - 22);
    ctx.closePath();
    ctx.fill();

    // Full-width front laser light bar
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.fillRect(-halfW + 3, -halfH + 1, this.width - 6, 3);

    // Full-width rear red bar
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.fillRect(-halfW + 2, halfH - 3, this.width - 4, 3);
  }

  // --- 5. BOBIK THE DOG CAR (LEGENDARY) ---
  renderBobikCar(ctx, halfW, halfH) {
    const earWiggle = Math.sin(Date.now() * 0.015) * 0.2 + (this.tilt * 1.5);
    const tailWag = Math.sin(Date.now() * 0.02) * 0.45;

    // Paws / Wheels
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-halfW - 2, halfH - 25, 4, 14);
    ctx.fillRect(halfW - 2, halfH - 25, 4, 14);

    ctx.save();
    ctx.translate(-halfW - 0.5, -halfH + 19);
    ctx.rotate(this.wheelSteerAngle);
    ctx.fillRect(-2, -7, 4, 14);
    ctx.restore();

    ctx.save();
    ctx.translate(halfW + 0.5, -halfH + 19);
    ctx.rotate(this.wheelSteerAngle);
    ctx.fillRect(-2, -7, 4, 14);
    ctx.restore();

    // Fur Body (Golden Shiba puppy chassis)
    const furGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
    furGrad.addColorStop(0, '#f59e0b');
    furGrad.addColorStop(0.6, '#d97706');
    furGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = furGrad;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, this.width, this.height, 14);
    ctx.fill();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // White puppy belly patch on roof
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.roundRect(-halfW + 7, -halfH + 22, this.width - 14, this.height - 40, 8);
    ctx.fill();

    // Red Collar with Gold Tag
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-halfW + 2, -halfH + 12, this.width - 4, 5);

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -halfH + 15, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Left Floppy Ear (bounces with wind & turn)
    ctx.save();
    ctx.translate(-halfW + 2, -halfH + 10);
    ctx.rotate(-0.3 + earWiggle);
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.ellipse(-8, 6, 8, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(-8, 6, 4, 9, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right Floppy Ear
    ctx.save();
    ctx.translate(halfW - 2, -halfH + 10);
    ctx.rotate(0.3 - earWiggle);
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.ellipse(8, 6, 8, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(8, 6, 4, 9, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Cute Puppy Eyes (Headlights with sparkle)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-halfW + 9, -halfH + 5, 4.5, 0, Math.PI * 2);
    ctx.arc(halfW - 9, -halfH + 5, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye Sparkle
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(-halfW + 8, -halfH + 4, 1.8, 0, Math.PI * 2);
    ctx.arc(halfW - 10, -halfH + 4, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Black Puppy Snout / Nose
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, -halfH + 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Pink Puppy Tongue sticking out!
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.roundRect(-2.5, -halfH + 3, 5, 6, 2);
    ctx.fill();

    // Wagging Dog Tail on Rear
    ctx.save();
    ctx.translate(0, halfH - 2);
    ctx.rotate(tailWag);
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.quadraticCurveTo(0, 14, 4, 20);
    ctx.quadraticCurveTo(0, 14, 3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Taillights
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fillRect(-halfW + 5, halfH - 3, 6, 3);
    ctx.fillRect(halfW - 11, halfH - 3, 6, 3);
  }

  renderCyberWings(ctx, halfW, halfH) {
    const progress = this.wingDeployProgress;
    const flap = Math.sin(Date.now() * 0.012) * 0.18;
    const isFlashing = this.flightTimer <= 1.5 && Math.floor(Date.now() / 150) % 2 === 0;
    const wingColor = isFlashing ? 'rgba(239, 68, 68, 0.9)' : 'rgba(56, 189, 248, 0.9)';
    const glowColor = isFlashing ? '#ef4444' : '#fbbf24';

    ctx.save();

    ctx.save();
    ctx.translate(-halfW + 4, 2);
    ctx.scale(progress, progress);
    ctx.rotate(flap);

    ctx.fillStyle = wingColor;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.quadraticCurveTo(-26, -18, -48, -6);
    ctx.quadraticCurveTo(-38, 14, -20, 16);
    ctx.quadraticCurveTo(-10, 10, 0, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-10, -4); ctx.lineTo(-38, -6);
    ctx.moveTo(-8, 2); ctx.lineTo(-30, 6);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(halfW - 4, 2);
    ctx.scale(progress, progress);
    ctx.rotate(-flap);

    ctx.fillStyle = wingColor;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.quadraticCurveTo(26, -18, 48, -6);
    ctx.quadraticCurveTo(38, 14, 20, 16);
    ctx.quadraticCurveTo(10, 10, 0, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(10, -4); ctx.lineTo(38, -6);
    ctx.moveTo(8, 2); ctx.lineTo(30, 6);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }
}

window.CAR_SKINS = CAR_SKINS;
window.PlayerCar = PlayerCar;

/**
 * Lane Runner Arcade - Main Game Controller, Item Shop & Garage
 */

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Core Systems
    this.obstacles = new ObstacleManager();
    this.player = new PlayerCar(this.obstacles);
    this.particles = window.particleSystem;
    this.sound = window.soundEngine;

    // Game State
    this.state = 'MENU';
    this.lastTime = 0;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('lane_runner_highscore') || '0', 10);
    this.distance = 0;
    this.speed = 100;
    this.baseSpeed = 100;
    this.maxSpeed = 185;

    // Currency & Shop
    this.totalOrbs = parseInt(localStorage.getItem('lane_runner_total_orbs') || '60', 10); // starting bonus 60 orbs
    this.unlockedSkins = JSON.parse(localStorage.getItem('lane_runner_unlocked_skins') || '["apex"]');
    this.selectedShopSkin = this.player.currentSkin || 'apex';

    // Combo System
    this.combo = 1;
    this.maxCombo = 1;
    this.comboTimer = 0;
    this.comboDuration = 3.2;

    // Camera FX
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;

    // DOM References
    this.hud = document.getElementById('hud');
    this.scoreDisplay = document.getElementById('score-display');
    this.speedDisplay = document.getElementById('speed-display');
    this.tokenDisplay = document.getElementById('token-display');
    this.comboBadge = document.getElementById('combo-badge');

    this.hudJumpCard = document.getElementById('hud-jump-card');
    this.jumpProgressFill = document.getElementById('jump-progress-fill');
    this.jumpStatusText = document.getElementById('jump-status-text');

    this.hudFlightCard = document.getElementById('hud-flight-card');
    this.flightProgressFill = document.getElementById('flight-progress-fill');
    this.flightTimeText = document.getElementById('flight-time-text');

    this.arcadeBanner = document.getElementById('arcade-banner');
    this.arcadeBannerText = document.getElementById('arcade-banner-text');

    this.startScreen = document.getElementById('start-screen');
    this.pauseScreen = document.getElementById('pause-screen');
    this.gameoverScreen = document.getElementById('gameover-screen');
    this.shopScreen = document.getElementById('shop-screen');

    this.btnStart = document.getElementById('btn-start');
    this.btnPause = document.getElementById('btn-pause');
    this.btnResume = document.getElementById('btn-resume');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnRestartFromPause = document.getElementById('btn-restart-from-pause');
    this.btnAudio = document.getElementById('btn-audio');
    this.btnMusic = document.getElementById('btn-music');

    this.btnOpenShopMenu = document.getElementById('btn-open-shop-menu');
    this.btnOpenShopGo = document.getElementById('btn-open-shop-go');
    this.btnCloseShop = document.getElementById('btn-close-shop');
    this.btnEquipBuy = document.getElementById('btn-equip-buy');

    this.iconSoundOn = document.getElementById('icon-sound-on');
    this.iconSoundOff = document.getElementById('icon-sound-off');
    this.iconMusicOn = document.getElementById('icon-music-on');
    this.iconMusicOff = document.getElementById('icon-music-off');
    this.iconPause = document.getElementById('icon-pause');
    this.iconPlay = document.getElementById('icon-play');

    this.startHighScoreVal = document.getElementById('start-high-score-val');
    this.startOrbsVal = document.getElementById('start-orbs-val');
    this.finalScoreVal = document.getElementById('final-score');
    this.goBestScoreVal = document.getElementById('go-best-score');
    this.goOrbsVal = document.getElementById('go-orbs');
    this.goWingsVal = document.getElementById('go-wings');
    this.goMaxComboVal = document.getElementById('go-maxcombo');
    this.newHighScoreBadge = document.getElementById('new-high-score-badge');
    this.devicePillText = document.getElementById('device-pill-text');

    this.shopWalletVal = document.getElementById('shop-wallet-val');
    this.skinsGrid = document.getElementById('skins-grid');
    this.previewSkinName = document.getElementById('preview-skin-name');
    this.previewSkinRarity = document.getElementById('preview-skin-rarity');
    this.previewCanvas = document.getElementById('skin-preview-canvas');
    this.previewCtx = this.previewCanvas ? this.previewCanvas.getContext('2d') : null;

    this.touchLeft = document.getElementById('touch-left');
    this.touchRight = document.getElementById('touch-right');
    this.touchJump = document.getElementById('touch-jump');

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.bannerTimeout = null;

    this.init();
  }

  init() {
    window.gameInstance = this;

    this.detectDevice();
    this.updateAudioIcons();
    this.updateWalletUI();

    if (this.startHighScoreVal) {
      this.startHighScoreVal.textContent = this.highScore.toLocaleString();
    }

    this.setupEventListeners();
    this.initShop();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    requestAnimationFrame((t) => this.loop(t));
  }

  detectDevice() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const width = window.innerWidth;

    let deviceName = 'PC / Laptop Mode';
    if (isTouch && width < 768) {
      deviceName = 'Mobile Device';
    } else if (isTouch && width <= 1024) {
      deviceName = 'Touch Laptop';
    } else if (width > 1440) {
      deviceName = 'Desktop PC (Wide)';
    }

    if (this.devicePillText) {
      this.devicePillText.textContent = deviceName;
    }
  }

  updateAudioIcons() {
    if (this.sound.sfxMuted) {
      this.iconSoundOn.classList.add('hidden');
      this.iconSoundOff.classList.remove('hidden');
    } else {
      this.iconSoundOn.classList.remove('hidden');
      this.iconSoundOff.classList.add('hidden');
    }

    if (this.sound.musicMuted) {
      this.iconMusicOn.classList.add('hidden');
      this.iconMusicOff.classList.remove('hidden');
    } else {
      this.iconMusicOn.classList.remove('hidden');
      this.iconMusicOff.classList.add('hidden');
    }
  }

  updateWalletUI() {
    if (this.startOrbsVal) this.startOrbsVal.textContent = `◆ ${this.totalOrbs.toLocaleString()}`;
    if (this.shopWalletVal) this.shopWalletVal.textContent = this.totalOrbs.toLocaleString();
    localStorage.setItem('lane_runner_total_orbs', this.totalOrbs.toString());
  }

  resizeCanvas() {
    const viewport = document.getElementById('game-viewport');
    const width = viewport.clientWidth || window.innerWidth;
    const height = viewport.clientHeight || window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;

    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    this.canvasLogicalWidth = width;
    this.canvasLogicalHeight = height;

    this.obstacles.updateRoadGeometry(width, height);
    this.player.x = this.obstacles.getLaneX(this.player.targetLane);
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (this.state === 'MENU') {
        if (e.code === 'Space' || e.code === 'Enter') this.startGame();
        return;
      }

      if (this.state === 'GAMEOVER') {
        if (e.code === 'Space' || e.code === 'KeyR' || e.code === 'Enter') this.restartGame();
        return;
      }

      if (this.state === 'PLAYING') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          this.player.moveLeft();
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this.player.moveRight();
        } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          this.player.jump();
        } else if (e.code === 'KeyP' || e.code === 'Escape') {
          this.togglePause();
        } else if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(e.code)) {
          const lane = parseInt(e.code.replace('Digit', ''), 10) - 1;
          this.player.setLane(lane);
        }
        return;
      }

      if (this.state === 'PAUSED') {
        if (e.code === 'KeyP' || e.code === 'Escape' || e.code === 'Space') {
          this.togglePause();
        }
      }
    });

    if (this.btnStart) this.btnStart.addEventListener('click', () => { this.sound.playClick(); this.startGame(); });
    if (this.btnPause) this.btnPause.addEventListener('click', () => { this.sound.playClick(); this.togglePause(); });
    if (this.btnResume) this.btnResume.addEventListener('click', () => { this.sound.playClick(); this.togglePause(); });
    if (this.btnRestart) this.btnRestart.addEventListener('click', () => { this.sound.playClick(); this.restartGame(); });
    if (this.btnRestartFromPause) this.btnRestartFromPause.addEventListener('click', () => { this.sound.playClick(); this.restartGame(); });

    if (this.btnAudio) this.btnAudio.addEventListener('click', () => {
      this.sound.init();
      this.sound.toggleSfx();
      this.updateAudioIcons();
    });

    if (this.btnMusic) this.btnMusic.addEventListener('click', () => {
      this.sound.init();
      this.sound.toggleMusic();
      this.updateAudioIcons();
    });

    // Shop Open / Close Buttons
    if (this.btnOpenShopMenu) {
      this.btnOpenShopMenu.addEventListener('click', () => {
        this.sound.playClick();
        this.openShop('MENU');
      });
    }
    if (this.btnOpenShopGo) {
      this.btnOpenShopGo.addEventListener('click', () => {
        this.sound.playClick();
        this.openShop('GAMEOVER');
      });
    }
    if (this.btnCloseShop) {
      this.btnCloseShop.addEventListener('click', () => {
        this.sound.playClick();
        this.closeShop();
      });
    }
    if (this.btnEquipBuy) {
      this.btnEquipBuy.addEventListener('click', () => {
        this.handleShopAction();
      });
    }

    if (this.touchLeft) this.touchLeft.addEventListener('pointerdown', (e) => { e.preventDefault(); if (this.state === 'PLAYING') this.player.moveLeft(); });
    if (this.touchRight) this.touchRight.addEventListener('pointerdown', (e) => { e.preventDefault(); if (this.state === 'PLAYING') this.player.moveRight(); });
    if (this.touchJump) this.touchJump.addEventListener('pointerdown', (e) => { e.preventDefault(); if (this.state === 'PLAYING') this.player.jump(); });

    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      this.touchStartX = clickX;
      this.touchStartY = clickY;

      if (this.state === 'PLAYING') {
        const road = this.obstacles.road;
        if (clickX >= road.x && clickX <= road.x + road.width) {
          const laneIdx = Math.floor((clickX - road.x) / road.laneWidth);
          if (laneIdx >= 0 && laneIdx < road.laneCount) {
            this.player.setLane(laneIdx);
          }
        }
      }
    });

    this.canvas.addEventListener('pointerup', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;
      const dx = endX - this.touchStartX;
      const dy = endY - this.touchStartY;

      if (this.state === 'PLAYING') {
        if (dy < -40 && Math.abs(dy) > Math.abs(dx)) {
          this.player.jump();
        } else if (dx < -35) {
          this.player.moveLeft();
        } else if (dx > 35) {
          this.player.moveRight();
        }
      }
    });
  }

  // --- GARAGE ITEM SHOP SYSTEM ---
  initShop() {
    this.selectedShopSkin = this.player.currentSkin || 'apex';
    this.renderShopGrid();
    this.updatePreviewStage();
  }

  openShop(fromState) {
    this.previousState = fromState || this.state;
    this.state = 'SHOP';
    this.updateWalletUI();
    this.renderShopGrid();
    this.updatePreviewStage();

    if (this.startScreen) this.startScreen.classList.remove('active');
    if (this.gameoverScreen) this.gameoverScreen.classList.remove('active');
    if (this.shopScreen) {
      this.shopScreen.classList.remove('hidden');
      this.shopScreen.classList.add('active');
    }
  }

  closeShop() {
    if (this.shopScreen) {
      this.shopScreen.classList.remove('active');
      this.shopScreen.classList.add('hidden');
    }

    if (this.previousState === 'GAMEOVER') {
      if (this.gameoverScreen) this.gameoverScreen.classList.add('active');
      this.state = 'GAMEOVER';
    } else {
      if (this.startScreen) this.startScreen.classList.add('active');
      this.state = 'MENU';
    }
  }

  renderShopGrid() {
    if (!this.skinsGrid) return;
    this.skinsGrid.innerHTML = '';

    const skins = Object.values(window.CAR_SKINS);

    skins.forEach((skin) => {
      const isUnlocked = this.unlockedSkins.includes(skin.id);
      const isEquipped = this.player.currentSkin === skin.id;
      const isSelected = this.selectedShopSkin === skin.id;

      const card = document.createElement('div');
      card.className = `skin-card ${isSelected ? 'selected' : ''} ${isEquipped ? 'equipped-active' : ''}`;
      
      let statusHtml = '';
      if (isEquipped) {
        statusHtml = `<span class="skin-card-status unlocked">EQUIPPED</span>`;
      } else if (isUnlocked) {
        statusHtml = `<span class="skin-card-status unlocked">UNLOCKED</span>`;
      } else {
        statusHtml = `<span class="skin-card-status price">◆ ${skin.price}</span>`;
      }

      card.innerHTML = `
        <span class="skin-card-badge ${skin.rarityClass}">${skin.rarity}</span>
        <span class="skin-card-name">${skin.name}</span>
        ${statusHtml}
      `;

      card.addEventListener('click', () => {
        this.sound.playClick();
        this.selectedShopSkin = skin.id;
        this.renderShopGrid();
        this.updatePreviewStage();
      });

      this.skinsGrid.appendChild(card);
    });

    this.updateShopActionButton();
  }

  updateShopActionButton() {
    if (!this.btnEquipBuy) return;
    const skin = window.CAR_SKINS[this.selectedShopSkin];
    const isUnlocked = this.unlockedSkins.includes(this.selectedShopSkin);
    const isEquipped = this.player.currentSkin === this.selectedShopSkin;

    if (isEquipped) {
      this.btnEquipBuy.textContent = 'EQUIPPED';
      this.btnEquipBuy.disabled = true;
      this.btnEquipBuy.style.opacity = '0.6';
    } else if (isUnlocked) {
      this.btnEquipBuy.textContent = 'EQUIP SKIN';
      this.btnEquipBuy.disabled = false;
      this.btnEquipBuy.style.opacity = '1';
    } else {
      const canAfford = this.totalOrbs >= skin.price;
      this.btnEquipBuy.textContent = `UNLOCK (◆ ${skin.price})`;
      this.btnEquipBuy.disabled = !canAfford;
      this.btnEquipBuy.style.opacity = canAfford ? '1' : '0.5';
    }
  }

  handleShopAction() {
    const skin = window.CAR_SKINS[this.selectedShopSkin];
    const isUnlocked = this.unlockedSkins.includes(this.selectedShopSkin);
    const isEquipped = this.player.currentSkin === this.selectedShopSkin;

    if (isEquipped) return;

    if (isUnlocked) {
      // Equip Skin
      this.player.setSkin(this.selectedShopSkin);
      this.sound.playShopBuy();
      this.renderShopGrid();
      this.updatePreviewStage();
      if (this.selectedShopSkin === 'bobik') {
        this.sound.playDogBark();
      }
    } else if (this.totalOrbs >= skin.price) {
      // Purchase Skin
      this.totalOrbs -= skin.price;
      this.unlockedSkins.push(this.selectedShopSkin);
      localStorage.setItem('lane_runner_unlocked_skins', JSON.stringify(this.unlockedSkins));
      this.updateWalletUI();

      this.player.setSkin(this.selectedShopSkin);
      this.sound.playShopBuy();
      this.renderShopGrid();
      this.updatePreviewStage();

      if (this.selectedShopSkin === 'bobik') {
        this.sound.playDogBark();
      }
    }
  }

  updatePreviewStage() {
    const skin = window.CAR_SKINS[this.selectedShopSkin];
    if (!skin) return;

    if (this.previewSkinName) this.previewSkinName.textContent = skin.name;
    if (this.previewSkinRarity) {
      this.previewSkinRarity.textContent = skin.rarity;
      this.previewSkinRarity.className = `preview-skin-rarity ${skin.rarityClass}`;
    }

    if (this.previewCtx) {
      const ctx = this.previewCtx;
      const w = this.previewCanvas.width;
      const h = this.previewCanvas.height;

      ctx.clearRect(0, 0, w, h);

      // Floor spotlight
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2 + 18, 48, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw Selected Car
      ctx.save();
      ctx.translate(w / 2, h / 2 - 4);
      ctx.scale(1.15, 1.15);

      this.player.renderSkinBody(ctx, this.selectedShopSkin, this.player.width / 2, this.player.height / 2);

      ctx.restore();
    }
  }

  startGame() {
    this.sound.init();
    this.state = 'PLAYING';
    this.score = 0;
    this.distance = 0;
    this.speed = this.baseSpeed;
    this.combo = 1;
    this.maxCombo = 1;
    this.comboTimer = 0;
    this.lastTime = performance.now();

    this.player.reset();
    this.obstacles.reset();
    this.particles.reset();

    if (this.startScreen) {
      this.startScreen.classList.remove('active');
      this.startScreen.classList.add('hidden');
    }
    if (this.pauseScreen) this.pauseScreen.classList.add('hidden');
    if (this.gameoverScreen) this.gameoverScreen.classList.add('hidden');
    if (this.shopScreen) this.shopScreen.classList.add('hidden');
    if (this.hud) this.hud.classList.remove('hidden');

    if (this.tokenDisplay) this.tokenDisplay.textContent = '0';
    if (this.comboBadge) this.comboBadge.classList.add('hidden');

    this.sound.resumeEngine();
    if (!this.sound.musicMuted) {
      this.sound.startArcadeMusic();
    }
  }

  restartGame() {
    this.startGame();
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.sound.stopEngine();
      this.sound.stopArcadeMusic();

      const pauseScore = document.getElementById('pause-score');
      const pauseTokens = document.getElementById('pause-tokens');
      if (pauseScore) pauseScore.textContent = Math.floor(this.score).toLocaleString();
      if (pauseTokens) pauseTokens.textContent = this.obstacles.collectedOrbs.toString();

      if (this.pauseScreen) {
        this.pauseScreen.classList.remove('hidden');
        this.pauseScreen.classList.add('active');
      }
      if (this.iconPause) this.iconPause.classList.add('hidden');
      if (this.iconPlay) this.iconPlay.classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.sound.resumeEngine();
      if (!this.sound.musicMuted) {
        this.sound.startArcadeMusic();
      }

      if (this.pauseScreen) {
        this.pauseScreen.classList.remove('active');
        this.pauseScreen.classList.add('hidden');
      }
      if (this.iconPause) this.iconPause.classList.remove('hidden');
      if (this.iconPlay) this.iconPlay.classList.add('hidden');
      this.lastTime = performance.now();
    }
  }

  triggerCameraShake(intensity = 6, duration = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  showArcadeBanner(text) {
    if (!this.arcadeBannerText || !this.arcadeBanner) return;
    this.arcadeBannerText.textContent = text;
    this.arcadeBanner.classList.remove('hidden');
    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      if (this.arcadeBanner) this.arcadeBanner.classList.add('hidden');
    }, 1400);
  }

  onWingsPickedUp() {
    this.showArcadeBanner('WING FLIGHT! CHILL & GLIDE!');
    this.triggerCameraShake(2.5, 0.2);
  }

  registerNearMiss(x, y) {
    this.combo = Math.min(8, this.combo + 1);
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.comboTimer = this.comboDuration;

    const points = 50 * this.combo;
    this.addScore(points);

    this.sound.playNearMiss(this.combo);
    this.particles.addFloatingText(x, y - 20, `+${points} CLOSE CALL!`, '#10b981', 16);
    this.triggerCameraShake(3, 0.15);

    if (this.combo >= 2) {
      this.showArcadeBanner(`COMBO x${this.combo}!`);
    }
  }

  addScore(amount) {
    this.score += amount;
  }

  updateTokenCount(count) {
    if (this.tokenDisplay) this.tokenDisplay.textContent = count.toString();
    this.totalOrbs++;
    this.updateWalletUI();
  }

  onCrash(obstacle) {
    this.state = 'GAMEOVER';
    this.player.isDead = true;
    if (obstacle) obstacle.hasCrashed = true;

    this.sound.playCrash();
    this.sound.stopEngine();
    this.sound.stopArcadeMusic();

    this.particles.createCrashExplosion(this.player.x, this.player.y);
    this.triggerCameraShake(18, 0.5);

    const finalScoreNum = Math.floor(this.score);
    const isNewHigh = finalScoreNum > this.highScore;
    if (isNewHigh) {
      this.highScore = finalScoreNum;
      localStorage.setItem('lane_runner_highscore', this.highScore.toString());
    }

    this.updateWalletUI();

    // Safely populate Game Over stats
    setTimeout(() => {
      if (this.finalScoreVal) this.finalScoreVal.textContent = finalScoreNum.toLocaleString();
      if (this.goBestScoreVal) this.goBestScoreVal.textContent = this.highScore.toLocaleString();
      if (this.goOrbsVal) this.goOrbsVal.textContent = `◆ ${this.obstacles.collectedOrbs.toString()}`;
      if (this.goWingsVal) this.goWingsVal.textContent = this.obstacles.collectedWings.toString();
      if (this.goMaxComboVal) this.goMaxComboVal.textContent = `x${this.maxCombo}`;

      if (this.newHighScoreBadge) {
        if (isNewHigh && finalScoreNum > 0) {
          this.newHighScoreBadge.classList.remove('hidden');
        } else {
          this.newHighScoreBadge.classList.add('hidden');
        }
      }

      if (this.hud) this.hud.classList.add('hidden');

      if (this.gameoverScreen) {
        this.gameoverScreen.classList.remove('hidden');
        this.gameoverScreen.classList.add('active');
      }
    }, 600);
  }

  checkCollisions() {
    if (this.player.isDead || this.player.isFlying || this.player.isInAir()) return;

    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width * 0.72;
    const ph = this.player.height * 0.76;

    for (const obs of this.obstacles.obstacles) {
      const ox = obs.x;
      const oy = obs.y;
      const ow = obs.width * 0.78;
      const oh = obs.height * 0.82;

      if (
        Math.abs(px - ox) < (pw + ow) * 0.5 &&
        Math.abs(py - oy) < (ph + oh) * 0.5
      ) {
        this.onCrash(obs);
        break;
      }
    }
  }

  update(dt) {
    if (this.state === 'PLAYING') {
      if (this.speed < this.maxSpeed) {
        this.speed += dt * 1.8;
      }

      const displaySpeed = this.player.isFlying ? this.speed + 35 : this.speed;
      this.sound.updateEngine(displaySpeed);

      const scoreMultiplier = this.player.isFlying ? this.combo * 2.5 : this.combo;
      const distDelta = (displaySpeed * 1000 / 3600) * dt;
      this.distance += distDelta;
      this.score += distDelta * 1.5 * scoreMultiplier;

      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.combo = 1;
        }
      }

      this.player.update(dt, this.canvasLogicalHeight);
      this.obstacles.update(dt, displaySpeed, this.player);
      this.particles.update(dt, (displaySpeed / 100) * 4.5);

      this.checkCollisions();
      this.updateHUD(displaySpeed);
    } else if (this.state === 'SHOP') {
      this.updatePreviewStage();
    } else {
      this.particles.update(dt, 1);
    }

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
      }
    }
  }

  updateHUD(displaySpeed) {
    if (this.scoreDisplay) this.scoreDisplay.textContent = Math.floor(this.score).toLocaleString();
    if (this.speedDisplay) this.speedDisplay.textContent = Math.floor(displaySpeed || this.speed).toString();

    if (this.comboBadge) {
      if (this.combo > 1) {
        this.comboBadge.textContent = `x${this.combo}`;
        this.comboBadge.classList.remove('hidden');
      } else {
        this.comboBadge.classList.add('hidden');
      }
    }

    if (this.player.isFlying) {
      if (this.hudJumpCard) this.hudJumpCard.classList.add('hidden');
      if (this.hudFlightCard) this.hudFlightCard.classList.remove('hidden');

      const flightProgress = Math.max(0, this.player.flightTimer / this.player.flightDuration);
      if (this.flightProgressFill) this.flightProgressFill.style.width = `${flightProgress * 100}%`;
      if (this.flightTimeText) this.flightTimeText.textContent = `${this.player.flightTimer.toFixed(1)}s`;
    } else {
      if (this.hudFlightCard) this.hudFlightCard.classList.add('hidden');
      if (this.hudJumpCard) this.hudJumpCard.classList.remove('hidden');

      const jumpProgress = this.player.getJumpProgress();
      if (this.jumpProgressFill) this.jumpProgressFill.style.width = `${jumpProgress * 100}%`;

      if (this.jumpStatusText) {
        if (this.player.isJumping) {
          this.jumpStatusText.textContent = 'AIRBORNE!';
          this.jumpStatusText.className = 'jump-status cooldown';
        } else if (jumpProgress >= 1) {
          this.jumpStatusText.textContent = 'READY [SPACE]';
          this.jumpStatusText.className = 'jump-status ready';
        } else {
          const remainingSec = Math.ceil(this.player.jumpCooldownTimer);
          this.jumpStatusText.textContent = `CHARGING ${remainingSec}s`;
          this.jumpStatusText.className = 'jump-status cooldown';
        }
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const width = this.canvasLogicalWidth;
    const height = this.canvasLogicalHeight;

    ctx.save();

    if (this.shakeTimer > 0) {
      const factor = this.shakeTimer / this.shakeDuration;
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity * factor * 2;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity * factor * 2;
      ctx.translate(shakeX, shakeY);
    }

    ctx.fillStyle = '#eaeff5';
    ctx.fillRect(0, 0, width, height);

    this.obstacles.renderRoad(ctx);
    this.obstacles.renderCollectibles(ctx);
    this.obstacles.renderObstacles(ctx);
    this.player.render(ctx);
    this.particles.render(ctx);

    ctx.restore();
  }

  loop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});

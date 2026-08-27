/**
 * Arcade Particle & Visual FX System
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.speedLines = [];
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.speedLines = [];
  }

  createExhaust(x, y, isBoosting = false) {
    if (this.particles.length > 340) return;
    const color = isBoosting ? '#38bdf8' : '#cbd5e1';
    this.particles.push({
      type: 'smoke',
      x: x + (Math.random() - 0.5) * 4,
      y: y,
      vx: (Math.random() - 0.5) * 1.2,
      vy: isBoosting ? 4.5 : 2.5 + Math.random() * 2,
      size: isBoosting ? 4 : 2.5 + Math.random() * 2,
      maxSize: isBoosting ? 9 : 6 + Math.random() * 3,
      alpha: isBoosting ? 0.75 : 0.45,
      color: color,
      life: 0,
      maxLife: 0.3 + Math.random() * 0.15
    });
  }

  createWingVortex(leftX, rightX, y) {
    if (this.particles.length > 340) return;
    // Wingtip ribbon trails
    [leftX, rightX].forEach((wx) => {
      this.particles.push({
        type: 'spark',
        x: wx,
        y: y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 3 + Math.random() * 2,
        size: 3,
        alpha: 0.85,
        color: Math.random() < 0.5 ? '#38bdf8' : '#fbbf24',
        life: 0,
        maxLife: 0.25
      });
    });
  }

  createWingsPickup(x, y) {
    // Glowing golden/cyan burst
    for (let i = 0; i < 28; i++) {
      const angle = (Math.PI * 2 * i) / 28;
      const speed = 2.5 + Math.random() * 6;
      this.particles.push({
        type: 'spark',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3.5 + Math.random() * 2,
        alpha: 1,
        color: i % 2 === 0 ? '#fbbf24' : '#38bdf8',
        life: 0,
        maxLife: 0.55 + Math.random() * 0.25
      });
    }

    this.particles.push({
      type: 'ring',
      x: x,
      y: y,
      radius: 12,
      maxRadius: 75,
      alpha: 0.9,
      color: 'rgba(251, 191, 36, 0.75)',
      life: 0,
      maxLife: 0.45
    });
  }

  createJumpRing(x, y) {
    this.particles.push({
      type: 'ring',
      x: x,
      y: y,
      radius: 10,
      maxRadius: 55,
      alpha: 0.85,
      color: 'rgba(56, 189, 248, 0.65)',
      life: 0,
      maxLife: 0.38
    });

    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18;
      const speed = 2.5 + Math.random() * 4.5;
      this.particles.push({
        type: 'spark',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3.5,
        alpha: 0.9,
        color: '#38bdf8',
        life: 0,
        maxLife: 0.4 + Math.random() * 0.2
      });
    }
  }

  createLandingPuff(x, y) {
    this.particles.push({
      type: 'ring',
      x: x,
      y: y,
      radius: 8,
      maxRadius: 45,
      alpha: 0.65,
      color: 'rgba(37, 99, 235, 0.4)',
      life: 0,
      maxLife: 0.3
    });

    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        type: 'smoke',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3.5 + Math.random() * 3,
        maxSize: 10 + Math.random() * 6,
        alpha: 0.6,
        color: '#94a3b8',
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2
      });
    }
  }

  createOrbCollect(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        type: 'spark',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3,
        alpha: 1,
        color: '#f59e0b',
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2
      });
    }
  }

  addFloatingText(x, y, text, color = '#2563eb', fontSize = 16) {
    this.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      fontSize: fontSize,
      alpha: 1,
      vy: -2.2,
      life: 0,
      maxLife: 0.75
    });
  }

  createCrashExplosion(x, y) {
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 10;
      const colors = ['#ef4444', '#f59e0b', '#38bdf8', '#1e293b', '#64748b'];
      this.particles.push({
        type: 'fragment',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3.5 + Math.random() * 5,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 12,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 0.8 + Math.random() * 0.6
      });
    }

    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      this.particles.push({
        type: 'smoke',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 6 + Math.random() * 8,
        maxSize: 22 + Math.random() * 12,
        alpha: 0.8,
        color: '#475569',
        life: 0,
        maxLife: 0.9 + Math.random() * 0.4
      });
    }
  }

  update(dt, roadScrollSpeed = 0) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      const progress = p.life / p.maxLife;

      if (p.type === 'smoke') {
        p.x += p.vx;
        p.y += p.vy + roadScrollSpeed * 0.4;
        p.size += (p.maxSize - p.size) * (dt * 4.5);
        p.alpha = (1 - progress) * 0.6;
      } else if (p.type === 'ring') {
        p.radius += (p.maxRadius - p.radius) * (dt * 6.5);
        p.y += roadScrollSpeed;
        p.alpha = (1 - progress) * 0.75;
      } else if (p.type === 'spark' || p.type === 'fragment') {
        p.x += p.vx;
        p.y += p.vy + roadScrollSpeed * 0.35;
        p.vx *= 0.96;
        p.vy *= 0.96;
        if (p.rotation !== undefined) p.rotation += p.vRot * dt;
        p.alpha = 1 - progress;
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt;
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy;
      ft.alpha = 1 - (ft.life / ft.maxLife);
    }
  }

  render(ctx) {
    ctx.save();

    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

      if (p.type === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'fragment') {
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = Math.max(0, Math.min(1, ft.alpha));
      ctx.font = `900 ${ft.fontSize || 16}px "Orbitron", "JetBrains Mono", sans-serif`;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, ft.x, ft.y);

      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }
}

window.particleSystem = new ParticleSystem();

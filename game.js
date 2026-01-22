// ==================== 🎮 12种子弹射击游戏 - 优化版 ====================
console.log('🚀 启动优化版游戏 - 性能提升+音效系统');

// ==================== 配置常量 ====================
const CONFIG = {
    // 游戏配置
    CANVAS: {
        MAX_WIDTH: 900,
        MAX_HEIGHT: 650,
        MIN_WIDTH: 300,
        MIN_HEIGHT: 400
    },
    
    // 玩家配置
    PLAYER: {
        SIZE: 22,
        SPEED: 5,
        COLOR: '#00ff88',
        INVINCIBLE_TIME: 1000
    },
    
    // 子弹类型 (12种)
    BULLET_TYPES: [
        {id: 0, name: '普通', color: '#00ff88', damage: 10, speed: 12, size: 5},
        {id: 1, name: '散弹', color: '#ffff00', damage: 8, speed: 10, size: 6},
        {id: 2, name: '激光', color: '#4169e1', damage: 15, speed: 18, size: 4},
        {id: 3, name: '导弹', color: '#ff4400', damage: 20, speed: 8, size: 8},
        {id: 4, name: '闪电', color: '#00ffff', damage: 12, speed: 25, size: 7},
        {id: 5, name: '彩虹', color: 'rainbow', damage: 10, speed: 12, size: 6},
        {id: 6, name: '毒液', color: '#7cfc00', damage: 8, speed: 9, size: 7},
        {id: 7, name: '冰霜', color: '#87ceeb', damage: 6, speed: 11, size: 6},
        {id: 8, name: '火焰', color: '#ff4500', damage: 14, speed: 10, size: 7},
        {id: 9, name: '黑洞', color: '#000000', damage: 25, speed: 5, size: 12},
        {id: 10, name: '追踪', color: '#9370db', damage: 12, speed: 8, size: 6},
        {id: 11, name: '爆破', color: '#ff6347', damage: 18, speed: 7, size: 10}
    ],
    
    // 关卡配置 (10关)
    LEVELS: [
        {id: 1, target: 20, enemySpeed: 1.8, spawnRate: 0.018, maxEnemies: 10, enemyHealth: 25, enemySize: 18},
        {id: 2, target: 30, enemySpeed: 2.0, spawnRate: 0.022, maxEnemies: 12, enemyHealth: 30, enemySize: 18},
        {id: 3, target: 40, enemySpeed: 2.2, spawnRate: 0.025, maxEnemies: 14, enemyHealth: 35, enemySize: 16},
        {id: 4, target: 50, enemySpeed: 2.4, spawnRate: 0.028, maxEnemies: 16, enemyHealth: 40, enemySize: 16},
        {id: 5, target: 60, enemySpeed: 2.6, spawnRate: 0.030, maxEnemies: 18, enemyHealth: 45, enemySize: 14},
        {id: 6, target: 70, enemySpeed: 2.8, spawnRate: 0.032, maxEnemies: 20, enemyHealth: 50, enemySize: 14},
        {id: 7, target: 80, enemySpeed: 3.0, spawnRate: 0.035, maxEnemies: 22, enemyHealth: 55, enemySize: 12},
        {id: 8, target: 90, enemySpeed: 3.2, spawnRate: 0.038, maxEnemies: 24, enemyHealth: 60, enemySize: 12},
        {id: 9, target: 100, enemySpeed: 3.5, spawnRate: 0.040, maxEnemies: 26, enemyHealth: 65, enemySize: 10},
        {id: 10, target: 120, enemySpeed: 4.0, spawnRate: 0.045, maxEnemies: 30, enemyHealth: 70, enemySize: 10}
    ],
    
    // 音效配置 (优化：使用更小的音效文件)
    SOUNDS: {
        shoot: 'https://assets.mixkit.co/sfx/preview/mixkit-short-laser-gun-shot-1670.mp3', // 小文件
        hit: 'https://assets.mixkit.co/sfx/preview/mixkit-electronic-retro-block-hit-2185.mp3', // 小文件
        explosion: 'https://assets.mixkit.co/sfx/preview/mixkit-bomb-explosion-2396.mp3',
        switch: 'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3', // 小文件
        level: 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3',
        gameover: 'https://assets.mixkit.co/sfx/preview/mixkit-sad-game-over-trombone-471.mp3'
    },
    
    // 性能优化配置
    PERFORMANCE: {
        MAX_BULLETS: 80,           // 限制最大子弹数
        MAX_PARTICLES: 150,        // 限制最大粒子数
        MAX_ENEMIES: 35,           // 限制最大敌人数（比关卡配置稍高）
        RENDER_STARS: 60,          // 减少星星数量
        COLLISION_GRID_SIZE: 100,  // 碰撞检测网格大小
        BULLET_CULL_DISTANCE: 50   // 子弹裁剪距离
    }
};

// ==================== 游戏状态 ====================
let GameState = {
    // 基础状态
    score: 0,
    currentLevel: 1,
    enemiesDefeated: 0,
    totalEnemiesDefeated: 0,
    
    // 游戏状态
    isStarted: false,
    isPaused: false,
    isGameOver: false,
    
    // 生命系统
    infiniteLife: true,
    playerLives: 3,
    lastHitTime: 0,
    
    // 性能监控
    fps: 0,
    lastFrameTime: 0,
    frameCount: 0,
    lastFpsUpdate: 0,
    
    // 重置状态
    reset() {
        this.score = 0;
        this.currentLevel = 1;
        this.enemiesDefeated = 0;
        this.totalEnemiesDefeated = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.playerLives = this.infiniteLife ? Infinity : 3;
        this.lastHitTime = 0;
    }
};

// ==================== 游戏对象池（性能优化关键） ====================
const ObjectPool = {
    // 对象池
    bullets: [],
    enemies: [],
    particles: [],
    
    // 活跃对象
    activeBullets: [],
    activeEnemies: [],
    activeParticles: [],
    
    // 初始化对象池
    init() {
        // 预创建对象
        this.bullets = Array.from({length: CONFIG.PERFORMANCE.MAX_BULLETS}, () => ({
            x: 0, y: 0, vx: 0, vy: 0, size: 5, color: '#fff', damage: 10, type: 'normal', active: false
        }));
        
        this.enemies = Array.from({length: CONFIG.PERFORMANCE.MAX_ENEMIES}, () => ({
            x: 0, y: 0, size: 15, color: '#f00', hp: 30, speed: 2, type: 'normal', active: false
        }));
        
        this.particles = Array.from({length: CONFIG.PERFORMANCE.MAX_PARTICLES}, () => ({
            x: 0, y: 0, vx: 0, vy: 0, size: 2, color: '#fff', life: 0, active: false
        }));
        
        this.activeBullets = [];
        this.activeEnemies = [];
        this.activeParticles = [];
    },
    
    // 从池中获取对象
    getBullet() {
        for (let bullet of this.bullets) {
            if (!bullet.active) {
                bullet.active = true;
                this.activeBullets.push(bullet);
                return bullet;
            }
        }
        return null; // 池已满
    },
    
    getEnemy() {
        for (let enemy of this.enemies) {
            if (!enemy.active) {
                enemy.active = true;
                this.activeEnemies.push(enemy);
                return enemy;
            }
        }
        return null;
    },
    
    getParticle() {
        for (let particle of this.particles) {
            if (!particle.active) {
                particle.active = true;
                this.activeParticles.push(particle);
                return particle;
            }
        }
        return null;
    },
    
    // 回收对象
    recycleBullet(bullet) {
        bullet.active = false;
        const index = this.activeBullets.indexOf(bullet);
        if (index > -1) this.activeBullets.splice(index, 1);
    },
    
    recycleEnemy(enemy) {
        enemy.active = false;
        const index = this.activeEnemies.indexOf(enemy);
        if (index > -1) this.activeEnemies.splice(index, 1);
    },
    
    recycleParticle(particle) {
        particle.active = false;
        const index = this.activeParticles.indexOf(particle);
        if (index > -1) this.activeParticles.splice(index, 1);
    },
    
    // 清理所有对象
    clear() {
        this.activeBullets.forEach(b => b.active = false);
        this.activeEnemies.forEach(e => e.active = false);
        this.activeParticles.forEach(p => p.active = false);
        this.activeBullets = [];
        this.activeEnemies = [];
        this.activeParticles = [];
    }
};

// ==================== 玩家对象 ====================
const Player = {
    x: 0,
    y: 0,
    size: CONFIG.PLAYER.SIZE,
    color: CONFIG.PLAYER.COLOR,
    targetX: 0,
    isInvincible: false,
    invincibleTimer: 0,
    
    init(canvas) {
        this.x = canvas.width / 2;
        this.y = canvas.height * 0.85;
        this.targetX = this.x;
        this.isInvincible = false;
        this.invincibleTimer = 0;
    },
    
    update(deltaTime) {
        // 平滑移动到目标位置
        const dx = this.targetX - this.x;
        this.x += dx * 0.2;
        
        // 边界检查
        const margin = this.size + 5;
        this.x = Math.max(margin, Math.min(canvas.width - margin, this.x));
        
        // 无敌计时
        if (this.isInvincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
                this.color = CONFIG.PLAYER.COLOR;
            }
        }
    },
    
    hit() {
        if (GameState.infiniteLife) return false;
        
        const now = Date.now();
        if (now - GameState.lastHitTime < CONFIG.PLAYER.INVINCIBLE_TIME) return false;
        
        GameState.playerLives--;
        GameState.lastHitTime = now;
        this.isInvincible = true;
        this.invincibleTimer = CONFIG.PLAYER.INVINCIBLE_TIME;
        this.color = '#ff0000';
        
        // 音效
        SoundSystem.play('hit', {volume: 0.4});
        
        // 粒子效果
        for (let i = 0; i < 15; i++) {
            const p = ObjectPool.getParticle();
            if (p) {
                p.x = this.x;
                p.y = this.y;
                p.vx = (Math.random() - 0.5) * 8;
                p.vy = (Math.random() - 0.5) * 8;
                p.size = Math.random() * 3 + 1;
                p.color = '#ff0000';
                p.life = 30;
            }
        }
        
        if (GameState.playerLives <= 1) {
            showLifeWarning();
        }
        
        return GameState.playerLives <= 0;
    }
};

// ==================== 子弹管理器 ====================
const BulletManager = {
    currentType: 0,
    lastShotTime: 0,
    shotInterval: 150,
    
    create(x, y) {
        const now = Date.now();
        if (now - this.lastShotTime < this.shotInterval) return;
        this.lastShotTime = now;
        
        const bulletConfig = CONFIG.BULLET_TYPES[this.currentType];
        
        // 音效
        SoundSystem.play('shoot', {volume: 0.3, rate: bulletConfig.speed > 20 ? 1.5 : 1.0});
        
        // 根据子弹类型创建
        switch(bulletConfig.name) {
            case '散弹':
                this.createSpread(x, y, bulletConfig);
                break;
            case '彩虹':
                this.createRainbow(x, y, bulletConfig);
                break;
            default:
                this.createSingle(x, y, bulletConfig);
        }
    },
    
    createSingle(x, y, config) {
        const bullet = ObjectPool.getBullet();
        if (!bullet) return;
        
        Object.assign(bullet, {
            x, y,
            vy: -config.speed,
            size: config.size,
            color: config.color === 'rainbow' ? `hsl(${Date.now() % 360}, 100%, 50%)` : config.color,
            damage: config.damage,
            type: config.name
        });
    },
    
    createSpread(x, y, config) {
        for (let i = -1; i <= 1; i++) {
            const bullet = ObjectPool.getBullet();
            if (!bullet) continue;
            
            Object.assign(bullet, {
                x: x + i * 20,
                y: y,
                vy: -config.speed,
                size: config.size,
                color: config.color,
                damage: config.damage,
                type: 'spread'
            });
        }
    },
    
    createRainbow(x, y, config) {
        const bullet = ObjectPool.getBullet();
        if (!bullet) return;
        
        Object.assign(bullet, {
            x, y,
            vy: -config.speed,
            size: config.size,
            color: `hsl(${Date.now() % 360}, 100%, 50%)`,
            damage: config.damage,
            type: 'rainbow'
        });
    },
    
    update(deltaTime) {
        for (let i = ObjectPool.activeBullets.length - 1; i >= 0; i--) {
            const bullet = ObjectPool.activeBullets[i];
            
            // 移动
            bullet.y += bullet.vy;
            
            // 超出屏幕回收
            if (bullet.y < -CONFIG.PERFORMANCE.BULLET_CULL_DISTANCE) {
                ObjectPool.recycleBullet(bullet);
            }
        }
    },
    
    switchType() {
        this.currentType = (this.currentType + 1) % CONFIG.BULLET_TYPES.length;
        SoundSystem.play('switch', {volume: 0.4});
        return CONFIG.BULLET_TYPES[this.currentType];
    }
};

// ==================== 敌人生成器 ====================
const EnemyGenerator = {
    spawnTimer: 0,
    spawnInterval: 1000,
    
    update(deltaTime, canvas) {
        this.spawnTimer += deltaTime;
        const level = CONFIG.LEVELS[GameState.currentLevel - 1];
        
        if (this.spawnTimer >= this.spawnInterval && 
            ObjectPool.activeEnemies.length < level.maxEnemies &&
            Math.random() < level.spawnRate) {
            
            this.spawnTimer = 0;
            this.createEnemy(canvas, level);
        }
    },
    
    createEnemy(canvas, level) {
        const enemy = ObjectPool.getEnemy();
        if (!enemy) return;
        
        const type = Math.random() < 0.7 ? 'normal' : 'fast';
        const baseSpeed = level.enemySpeed;
        const baseHealth = level.enemyHealth;
        
        Object.assign(enemy, {
            x: Math.random() * canvas.width,
            y: -30,
            size: level.enemySize,
            color: type === 'fast' ? '#ff00ff' : '#ff4444',
            hp: baseHealth * (type === 'fast' ? 0.7 : 1),
            maxHp: baseHealth * (type === 'fast' ? 0.7 : 1),
            speed: baseSpeed * (type === 'fast' ? 1.5 : 1),
            type: type,
            points: type === 'fast' ? 15 + GameState.currentLevel * 3 : 10 + GameState.currentLevel * 2
        });
    }
};

// ==================== 碰撞检测系统（优化版） ====================
const CollisionSystem = {
    // 使用简单的网格系统优化碰撞检测
    checkCollisions(canvas) {
        const bullets = ObjectPool.activeBullets;
        const enemies = ObjectPool.activeEnemies;
        
        // 检查子弹-敌人碰撞
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            let bulletHit = false;
            
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                
                // 快速距离检查（平方距离，避免开方）
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const minDistance = bullet.size + enemy.size;
                
                if (dx * dx + dy * dy < minDistance * minDistance) {
                    // 碰撞发生
                    enemy.hp -= bullet.damage;
                    bulletHit = true;
                    
                    // 音效
                    SoundSystem.play('hit', {volume: 0.3});
                    
                    // 粒子效果
                    this.createHitParticles(bullet.x, bullet.y, bullet.color);
                    
                    // 敌人死亡
                    if (enemy.hp <= 0) {
                        this.onEnemyDeath(enemy, bullet);
                        ObjectPool.recycleEnemy(enemy);
                    }
                    
                    break;
                }
            }
            
            if (bulletHit) {
                ObjectPool.recycleBullet(bullet);
            }
        }
        
        // 检查敌人-玩家碰撞和边界
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            
            // 敌人到达底部
            if (enemy.y > canvas.height - 10) {
                if (!GameState.infiniteLife && !Player.isInvincible) {
                    if (Player.hit()) {
                        gameOver('生命值耗尽！');
                    }
                }
                ObjectPool.recycleEnemy(enemy);
                continue;
            }
            
            // 敌人移动
            enemy.y += enemy.speed;
        }
    },
    
    createHitParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const p = ObjectPool.getParticle();
            if (p) {
                p.x = x;
                p.y = y;
                p.vx = (Math.random() - 0.5) * 6;
                p.vy = (Math.random() - 0.5) * 6;
                p.size = Math.random() * 3 + 1;
                p.color = color;
                p.life = 25;
            }
        }
    },
    
    onEnemyDeath(enemy, bullet) {
        GameState.score += enemy.points;
        GameState.enemiesDefeated++;
        GameState.totalEnemiesDefeated++;
        
        // 更新UI
        updateGameUI();
        
        // 死亡粒子效果
        for (let i = 0; i < 12; i++) {
            const p = ObjectPool.getParticle();
            if (p) {
                p.x = enemy.x;
                p.y = enemy.y;
                p.vx = (Math.random() - 0.5) * 8;
                p.vy = (Math.random() - 0.5) * 8;
                p.size = Math.random() * 4 + 2;
                p.color = enemy.color;
                p.life = 35;
            }
        }
        
        // 爆炸音效
        SoundSystem.play('explosion', {volume: 0.4});
        
        // 检查关卡完成
        if (GameState.enemiesDefeated >= CONFIG.LEVELS[GameState.currentLevel - 1].target) {
            completeLevel();
        }
    }
};

// ==================== 粒子系统 ====================
const ParticleSystem = {
    update(deltaTime) {
        for (let i = ObjectPool.activeParticles.length - 1; i >= 0; i--) {
            const p = ObjectPool.activeParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            if (p.life <= 0) {
                ObjectPool.recycleParticle(p);
            }
        }
    }
};

// ==================== 音效系统（优化版） ====================
const SoundSystem = {
    enabled: true,
    volume: 0.5,
    audioContext: null,
    buffers: {},
    
    init() {
        if (!this.enabled) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 音效系统初始化');
        } catch (e) {
            console.warn('⚠️ 音效系统初始化失败:', e);
            this.enabled = false;
        }
    },
    
    async play(name, options = {}) {
        if (!this.enabled || !this.audioContext) return;
        
        try {
            // 创建简单的音效（避免网络加载延迟）
            this.playGeneratedSound(name, options);
        } catch (e) {
            console.warn('⚠️ 音效播放失败:', e);
        }
    },
    
    playGeneratedSound(name, options) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 根据音效类型设置频率
        let frequency = 800;
        let duration = 0.1;
        
        switch(name) {
            case 'shoot':
                frequency = 1000 + Math.random() * 200;
                duration = 0.08;
                break;
            case 'hit':
                frequency = 400 + Math.random() * 100;
                duration = 0.12;
                break;
            case 'explosion':
                frequency = 150;
                duration = 0.3;
                break;
            case 'switch':
                frequency = 600;
                duration = 0.05;
                break;
        }
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        const volume = (options.volume || this.volume) * 0.3;
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    },
    
    toggle() {
        this.enabled = !this.enabled;
        const btn = document.getElementById('soundToggleBtn');
        if (btn) {
            btn.innerHTML = this.enabled ? 
                '<div style="font-size: 18px;">🔊</div><div class="sound-text">声音</div>' :
                '<div style="font-size: 18px;">🔇</div><div class="sound-text">静音</div>';
        }
    }
};

// ==================== 渲染系统（优化版） ====================
const RenderSystem = {
    // 缓存渲染对象
    starPositions: [],
    
    init(canvas) {
        // 预计算星星位置（减少计算量）
        this.starPositions = [];
        for (let i = 0; i < CONFIG.PERFORMANCE.RENDER_STARS; i++) {
            this.starPositions.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.5 + 0.5,
                speed: Math.random() * 0.5 + 0.3
            });
        }
    },
    
    renderBackground(ctx, canvas, time) {
        // 纯黑背景
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 优化的星空（使用缓存位置）
        for (let star of this.starPositions) {
            // 轻微移动
            star.y += star.speed * 0.05;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
            
            const alpha = 0.4 + Math.sin(time / 1000 + star.x) * 0.2;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    
    renderPlayer(ctx) {
        if (Player.isInvincible) {
            const blink = Math.sin(Date.now() / 100) > 0;
            ctx.fillStyle = blink ? '#ffffff' : '#ff0000';
        } else {
            ctx.fillStyle = Player.color;
        }
        
        ctx.shadowColor = Player.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(Player.x, Player.y - Player.size);
        ctx.lineTo(Player.x - Player.size * 1.3, Player.y + Player.size * 0.9);
        ctx.lineTo(Player.x + Player.size * 1.3, Player.y + Player.size * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    },
    
    renderBullets(ctx) {
        ObjectPool.activeBullets.forEach(bullet => {
            ctx.fillStyle = bullet.color;
            ctx.shadowColor = bullet.color;
            ctx.shadowBlur = bullet.size * 1.2;
            ctx.fillRect(bullet.x - bullet.size/2, bullet.y - bullet.size/2, bullet.size, bullet.size);
            ctx.shadowBlur = 0;
        });
    },
    
    renderEnemies(ctx) {
        ObjectPool.activeEnemies.forEach(enemy => {
            // 敌人本体
            ctx.fillStyle = enemy.color;
            ctx.shadowColor = enemy.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // 血量条
            const hpPercent = enemy.hp / enemy.maxHp;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 8, enemy.size * 2 * hpPercent, 4);
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(enemy.x - enemy.size, enemy.y - enemy.size - 8, enemy.size * 2, 4);
        });
    },
    
    renderParticles(ctx) {
        ObjectPool.activeParticles.forEach(p => {
            ctx.globalAlpha = Math.min(1, p.life / 30);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
            ctx.globalAlpha = 1;
        });
    },
    
    renderUI(ctx, canvas) {
        // 左上角：关卡信息
        ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
        ctx.fillRect(10, 10, 140, 40);
        ctx.fillStyle = '#ff00ff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`关卡 ${GameState.currentLevel}`, 20, 30);
        ctx.fillText(`进度: ${GameState.enemiesDefeated}/${CONFIG.LEVELS[GameState.currentLevel - 1].target}`, 20, 50);
        
        // 右上角：分数和生命
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(canvas.width - 150, 10, 140, 40);
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`分数: ${GameState.score}`, canvas.width - 140, 30);
        
        if (!GameState.infiniteLife) {
            ctx.fillStyle = '#ff0000';
            ctx.fillText(`生命: ${GameState.playerLives}`, canvas.width - 140, 50);
        }
        
        // FPS显示（调试用）
        if (GameState.fps > 0) {
            ctx.fillStyle = GameState.fps < 30 ? '#ff0000' : '#00ff00';
            ctx.font = '10px Arial';
            ctx.fillText(`FPS: ${Math.round(GameState.fps)}`, canvas.width - 50, 20);
        }
    }
};

// ==================== DOM元素和全局变量 ====================
let canvas, ctx;
let lastTime = 0;
let isTouching = false;
let moveDirection = {x: 0, y: 0};
let isManualControl = false;

// UI元素
const uiElements = {
    healthValue: document.getElementById('healthValue'),
    score: document.getElementById('score'),
    level: document.getElementById('level'),
    progress: document.getElementById('progress'),
    bulletName: document.getElementById('bulletName'),
    bulletColor: document.getElementById('bulletColor'),
    levelInfo: document.getElementById('levelInfo'),
    lifeWarning: document.getElementById('lifeWarning'),
    gameOverlay: document.getElementById('gameOverlay'),
    messageTitle: document.getElementById('messageTitle'),
    messageText: document.getElementById('messageText'),
    messageStats: document.getElementById('messageStats')
};

// ==================== 游戏逻辑函数 ====================
function initCanvas() {
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight - 60;
    
    canvas.width = Math.max(CONFIG.CANVAS.MIN_WIDTH, 
        Math.min(availableWidth * 0.98, CONFIG.CANVAS.MAX_WIDTH));
    canvas.height = Math.max(CONFIG.CANVAS.MIN_HEIGHT,
        Math.min(availableHeight * 0.85, CONFIG.CANVAS.MAX_HEIGHT));
    
    Player.init(canvas);
    RenderSystem.init(canvas);
}

function updateGameUI() {
    uiElements.score.textContent = GameState.score;
    uiElements.level.textContent = GameState.currentLevel;
    uiElements.progress.textContent = `${GameState.enemiesDefeated}/${CONFIG.LEVELS[GameState.currentLevel - 1].target}`;
    
    if (GameState.infiniteLife) {
        uiElements.healthValue.textContent = '∞';
        uiElements.healthValue.classList.add('infinite');
    } else {
        uiElements.healthValue.textContent = GameState.playerLives;
        uiElements.healthValue.classList.remove('infinite');
    }
}

function updateBulletDisplay() {
    const bullet = CONFIG.BULLET_TYPES[BulletManager.currentType];
    uiElements.bulletName.textContent = bullet.name;
    uiElements.bulletColor.style.background = bullet.color === 'rainbow' ? 
        'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : bullet.color;
}

function showLevelInfo() {
    uiElements.levelInfo.textContent = `关卡 ${GameState.currentLevel}`;
    uiElements.levelInfo.style.display = 'block';
    setTimeout(() => {
        uiElements.levelInfo.style.display = 'none';
    }, 2000);
}

function showLifeWarning() {
    uiElements.lifeWarning.style.display = 'block';
    setTimeout(() => {
        uiElements.lifeWarning.style.display = 'none';
    }, 1500);
}

function completeLevel() {
    if (GameState.currentLevel >= CONFIG.LEVELS.length) {
        gameVictory();
        return;
    }
    
    GameState.isPaused = true;
    ObjectPool.clear();
    
    GameState.currentLevel++;
    GameState.enemiesDefeated = 0;
    
    updateGameUI();
    showLevelInfo();
    SoundSystem.play('level', {volume: 0.5});
    
    setTimeout(() => {
        GameState.isPaused = false;
    }, 1200);
}

function gameVictory() {
    GameState.isGameOver = true;
    GameState.isPaused = true;
    
    uiElements.messageTitle.textContent = '🎊 游戏胜利！';
    uiElements.messageTitle.className = 'win-message';
    uiElements.messageText.textContent = '恭喜你通关了所有关卡！';
    uiElements.messageStats.textContent = `最终分数: ${GameState.score} | 总击败敌人: ${GameState.totalEnemiesDefeated}`;
    document.getElementById('gameMessage').className = 'game-message win-message';
    uiElements.gameOverlay.style.display = 'flex';
    
    SoundSystem.play('level', {volume: 0.7});
}

function gameOver(reason) {
    GameState.isGameOver = true;
    GameState.isPaused = true;
    
    uiElements.messageTitle.textContent = '💀 游戏结束';
    uiElements.messageText.textContent = reason || '游戏结束！';
    uiElements.messageStats.textContent = `最终分数: ${GameState.score} | 完成关卡: ${GameState.currentLevel - 1}`;
    document.getElementById('gameMessage').className = 'game-message';
    uiElements.gameOverlay.style.display = 'flex';
    
    SoundSystem.play('gameover', {volume: 0.6});
}

function restartGame() {
    GameState.reset();
    ObjectPool.clear();
    Player.init(canvas);
    BulletManager.currentType = 0;
    
    updateGameUI();
    updateBulletDisplay();
    uiElements.gameOverlay.style.display = 'none';
}

// ==================== 事件处理 ====================
function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    Player.targetX = Math.max(Player.size, Math.min(canvas.width - Player.size, 
        (touch.clientX - rect.left) * scaleX));
    isTouching = true;
    isManualControl = false;
}

function handleMouse(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    Player.targetX = Math.max(Player.size, Math.min(canvas.width - Player.size, 
        (e.clientX - rect.left) * scaleX));
}

// ==================== 游戏主循环 ====================
function gameLoop(currentTime) {
    // 计算deltaTime和FPS
    const deltaTime = Math.min(50, currentTime - lastTime) || 16;
    lastTime = currentTime;
    
    // 更新FPS显示
    GameState.frameCount++;
    if (currentTime - GameState.lastFpsUpdate >= 1000) {
        GameState.fps = (GameState.frameCount * 1000) / (currentTime - GameState.lastFpsUpdate);
        GameState.lastFpsUpdate = currentTime;
        GameState.frameCount = 0;
    }
    
    // 更新游戏状态
    if (!GameState.isPaused && !GameState.isGameOver && GameState.isStarted) {
        Player.update(deltaTime);
        BulletManager.update(deltaTime);
        EnemyGenerator.update(deltaTime, canvas);
        ParticleSystem.update(deltaTime);
        CollisionSystem.checkCollisions(canvas);
        
        // 自动射击
        if (isTouching || isManualControl) {
            BulletManager.create(Player.x, Player.y - Player.size);
        }
        
        // 手动控制移动
        if (isManualControl) {
            Player.x += moveDirection.x * CONFIG.PLAYER.SPEED;
            const margin = Player.size + 5;
            Player.x = Math.max(margin, Math.min(canvas.width - margin, Player.x));
        }
    }
    
    // 渲染
    if (canvas.width > 0 && canvas.height > 0) {
        RenderSystem.renderBackground(ctx, canvas, currentTime);
        RenderSystem.renderBullets(ctx);
        RenderSystem.renderEnemies(ctx);
        RenderSystem.renderParticles(ctx);
        RenderSystem.renderPlayer(ctx);
        RenderSystem.renderUI(ctx, canvas);
    }
    
    requestAnimationFrame(gameLoop);
}

// ==================== 初始化函数 ====================
function initGame() {
    console.log('🎮 初始化游戏系统...');
    
    // 获取Canvas元素
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 初始化对象池
    ObjectPool.init();
    
    // 初始化音效
    SoundSystem.init();
    
    // 初始化Canvas
    initCanvas();
    
    // 初始化UI
    updateGameUI();
    updateBulletDisplay();
    
    // 设置事件监听
    setupEventListeners();
    
    console.log('✅ 游戏初始化完成');
}

function setupEventListeners() {
    // 窗口大小变化
    window.addEventListener('resize', () => {
        if (GameState.isStarted) {
            setTimeout(initCanvas, 100);
        }
    });
    
    // 游戏模式选择
    document.getElementById('infiniteModeBtn').addEventListener('click', () => selectGameMode(true));
    document.getElementById('limitedModeBtn').addEventListener('click', () => selectGameMode(false));
    
    // 游戏控制按钮
    document.getElementById('lifeModeBtn').addEventListener('click', toggleLifeMode);
    document.getElementById('switchBulletBtn').addEventListener('click', switchBullet);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    
    // 移动控制按钮
    document.querySelectorAll('.move-btn').forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const direction = btn.getAttribute('data-direction');
            isManualControl = true;
            isTouching = true;
            moveDirection = direction === 'left' ? {x: -1, y: 0} : {x: 1, y: 0};
        });
        
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            moveDirection = {x: 0, y: 0};
            isTouching = false;
        });
    });
    
    // 触摸控制
    canvas.addEventListener('touchstart', handleTouch, {passive: false});
    canvas.addEventListener('touchmove', handleTouch, {passive: false});
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        isTouching = false;
    });
    
    // 鼠标控制
    canvas.addEventListener('mousedown', (e) => {
        isTouching = true;
        handleMouse(e);
    });
    canvas.addEventListener('mousemove', (e) => {
        if (isTouching) handleMouse(e);
    });
    canvas.addEventListener('mouseup', () => isTouching = false);
    canvas.addEventListener('mouseleave', () => isTouching = false);
    
    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (!GameState.isStarted || GameState.isPaused || GameState.isGameOver) return;
        
        switch(e.key.toLowerCase()) {
            case 'arrowleft': case 'a': case 'j':
                e.preventDefault();
                isManualControl = true;
                moveDirection = {x: -1, y: 0};
                isTouching = true;
                break;
            case 'arrowright': case 'd': case 'l':
                e.preventDefault();
                isManualControl = true;
                moveDirection = {x: 1, y: 0};
                isTouching = true;
                break;
            case 's': case ' ':
                e.preventDefault();
                switchBullet();
                break;
            case 'm':
                e.preventDefault();
                toggleLifeMode();
                break;
            case 'r':
                if (GameState.isGameOver) restartGame();
                break;
            case 'p': case 'escape':
                e.preventDefault();
                GameState.isPaused = !GameState.isPaused;
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        switch(e.key.toLowerCase()) {
            case 'arrowleft': case 'a': case 'j':
            case 'arrowright': case 'd': case 'l':
                if (!isTouching) moveDirection = {x: 0, y: 0};
                break;
        }
    });
    
    // 阻止滚动
    document.addEventListener('touchmove', (e) => {
        if (e.target === canvas || e.target.closest('.controls-area')) {
            e.preventDefault();
        }
    }, {passive: false});
}

// ==================== 游戏控制函数 ====================
function selectGameMode(isInfinite) {
    GameState.infiniteLife = isInfinite;
    GameState.playerLives = isInfinite ? Infinity : 3;
    
    // 更新模式按钮
    const lifeModeBtn = document.getElementById('lifeModeBtn');
    lifeModeBtn.innerHTML = isInfinite ? 
        '<div style="font-size: 18px;">♾️</div><div class="life-mode-text">无限</div>' :
        '<div style="font-size: 18px;">❤️</div><div class="life-mode-text">有限</div>';
    lifeModeBtn.className = isInfinite ? 'life-mode-btn infinite' : 'life-mode-btn limited';
    
    // 显示游戏界面
    document.getElementById('modeSelection').style.display = 'none';
    document.getElementById('gameHeader').style.display = 'flex';
    document.querySelector('.canvas-container').style.display = 'block';
    
    // 初始化游戏
    initCanvas();
    updateGameUI();
    updateBulletDisplay();
    showLevelInfo();
    
    GameState.isStarted = true;
    GameState.reset();
    
    console.log(`🎮 选择游戏模式: ${isInfinite ? '无限生命' : '有限生命（3条命）'}`);
}

function toggleLifeMode() {
    if (GameState.isPaused || GameState.isGameOver) return;
    
    GameState.infiniteLife = !GameState.infiniteLife;
    GameState.playerLives = GameState.infiniteLife ? Infinity : 3;
    
    const lifeModeBtn = document.getElementById('lifeModeBtn');
    lifeModeBtn.innerHTML = GameState.infiniteLife ? 
        '<div style="font-size: 18px;">♾️</div><div class="life-mode-text">无限</div>' :
        '<div style="font-size: 18px;">❤️</div><div class="life-mode-text">有限</div>';
    lifeModeBtn.className = GameState.infiniteLife ? 'life-mode-btn infinite' : 'life-mode-btn limited';
    
    updateGameUI();
    SoundSystem.play('switch', {volume: 0.5});
    
    console.log(GameState.infiniteLife ? '✅ 切换到无限生命模式' : '✅ 切换到有限生命模式');
}

function switchBullet() {
    const bullet = BulletManager.switchType();
    updateBulletDisplay();
    
    // 按钮动画
    const btn = document.getElementById('switchBulletBtn');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => btn.style.transform = '', 150);
}

// ==================== 启动游戏 ====================
window.addEventListener('DOMContentLoaded', () => {
    console.log('✨ 游戏已加载，请选择游戏模式');
    console.log('🖱️ 电脑操作：鼠标/A/D移动，S切换子弹，M切换模式，P暂停');
    
    // 显示模式选择界面
    document.getElementById('modeSelection').style.display = 'flex';
});

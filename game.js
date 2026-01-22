// ==================== 🎮 12种子弹射击游戏 - 修复优化版 ====================
console.log('🚀 启动修复优化版游戏 - 解决卡顿和音效问题');

// ==================== 基础配置 ====================
const CONFIG = {
    // 性能限制
    MAX_BULLETS: 50,      // 减少子弹数量
    MAX_ENEMIES: 20,      // 减少敌人数量  
    MAX_PARTICLES: 80,    // 减少粒子数量
    MAX_STARS: 40,        // 减少星星数量
    
    // 玩家
    PLAYER_SPEED: 4,
    PLAYER_SIZE: 20,
    
    // 游戏
    BULLET_COOLDOWN: 200,  // 增加射击冷却
    ENEMY_SPAWN_RATE: 0.015 // 降低敌人生成率
};

// ==================== 简化版音效系统（使用Web Audio API） ====================
class SoundManager {
    constructor() {
        this.enabled = true;
        this.volume = 0.3;
        this.audioContext = null;
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 音效系统已初始化');
        } catch (e) {
            console.warn('⚠️ 音效初始化失败，使用静音模式');
            this.enabled = false;
        }
    }
    
    playShoot() {
        if (!this.enabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 800 + Math.random() * 400;
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {
            // 静默失败
        }
    }
    
    playHit() {
        if (!this.enabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 300 + Math.random() * 200;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.15);
        } catch (e) {
            // 静默失败
        }
    }
    
    playExplosion() {
        if (!this.enabled || !this.audioContext) return;
        
        try {
            // 创建多个振荡器模拟爆炸声
            for (let i = 0; i < 3; i++) {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = 100 + Math.random() * 100;
                oscillator.type = i === 0 ? 'sine' : 'square';
                
                const delay = i * 0.05;
                gainNode.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime + delay);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + delay + 0.3);
                
                oscillator.start(this.audioContext.currentTime + delay);
                oscillator.stop(this.audioContext.currentTime + delay + 0.3);
            }
        } catch (e) {
            // 静默失败
        }
    }
    
    playSwitch() {
        if (!this.enabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 600;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.08);
        } catch (e) {
            // 静默失败
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        const btn = document.getElementById('soundToggleBtn');
        if (btn) {
            btn.innerHTML = this.enabled ? 
                '<div style="font-size: 18px;">🔊</div><div class="sound-text">声音</div>' :
                '<div style="font-size: 18px;">🔇</div><div class="sound-text">静音</div>';
        }
    }
}

// 创建音效管理器
const soundManager = new SoundManager();

// ==================== 游戏状态管理 ====================
let game = {
    score: 0,
    level: 1,
    enemiesDefeated: 0,
    levelTarget: 20,
    totalEnemiesDefeated: 0,
    
    isStarted: false,
    isPaused: false,
    isGameOver: false,
    
    infiniteLife: true,
    playerLives: 3,
    lastHitTime: 0,
    
    // 性能监控
    lastUpdate: 0,
    fps: 60,
    frameCount: 0,
    lastFpsUpdate: 0
};

// ==================== 游戏对象 ====================
let player = {
    x: 0, y: 0, size: CONFIG.PLAYER_SIZE, color: '#0f0',
    targetX: 0, isInvincible: false, invincibleTimer: 0
};

// 游戏数组（限制大小）
let bullets = [];
let enemies = [];
let particles = [];
let stars = [];

// ==================== 性能优化工具 ====================
class PerformanceManager {
    static cleanArrays() {
        // 清理超出限制的对象
        if (bullets.length > CONFIG.MAX_BULLETS) {
            bullets = bullets.slice(-CONFIG.MAX_BULLETS);
        }
        if (enemies.length > CONFIG.MAX_ENEMIES) {
            enemies = enemies.slice(-CONFIG.MAX_ENEMIES);
        }
        if (particles.length > CONFIG.MAX_PARTICLES) {
            particles = particles.slice(-CONFIG.MAX_PARTICLES);
        }
    }
    
    static updateFPS(currentTime) {
        game.frameCount++;
        if (currentTime - game.lastFpsUpdate >= 1000) {
            game.fps = Math.round((game.frameCount * 1000) / (currentTime - game.lastFpsUpdate));
            game.lastFpsUpdate = currentTime;
            game.frameCount = 0;
        }
    }
}

// ==================== 初始化函数 ====================
function initCanvas() {
    const canvas = document.getElementById('gameCanvas');
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight - 60;
    
    canvas.width = Math.min(availableWidth * 0.98, 800);
    canvas.height = Math.min(availableHeight * 0.85, 500);
    
    player.x = canvas.width / 2;
    player.y = canvas.height * 0.85;
    player.targetX = player.x;
    
    // 初始化星星
    stars = [];
    for (let i = 0; i < CONFIG.MAX_STARS; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.2 + 0.3,
            speed: Math.random() * 0.3 + 0.2
        });
    }
    
    return canvas;
}

// ==================== 游戏对象创建 ====================
let currentBulletType = 0;
const bulletTypes = [
    {name: '普通', color: '#0f0', damage: 10, speed: 10, size: 4},
    {name: '散弹', color: '#ff0', damage: 6, speed: 8, size: 5},
    {name: '激光', color: '#f0f', damage: 15, speed: 12, size: 3},
    {name: '导弹', color: '#f00', damage: 20, speed: 6, size: 6},
    {name: '闪电', color: '#0ff', damage: 12, speed: 15, size: 4},
    {name: '彩虹', color: '#f00', damage: 8, speed: 9, size: 5},
    {name: '毒液', color: '#7f0', damage: 8, speed: 7, size: 5},
    {name: '冰霜', color: '#8cf', damage: 5, speed: 8, size: 5},
    {name: '火焰', color: '#f80', damage: 12, speed: 7, size: 6},
    {name: '黑洞', color: '#000', damage: 25, speed: 4, size: 8},
    {name: '追踪', color: '#a6f', damage: 10, speed: 6, size: 5},
    {name: '爆破', color: '#f44', damage: 15, speed: 5, size: 7}
];

let lastShotTime = 0;

function createBullet(x, y) {
    const now = Date.now();
    if (now - lastShotTime < CONFIG.BULLET_COOLDOWN) return;
    lastShotTime = now;
    
    const bulletConfig = bulletTypes[currentBulletType];
    
    // 播放音效
    soundManager.playShoot();
    
    if (bulletConfig.name === '散弹') {
        for (let i = -1; i <= 1; i++) {
            bullets.push({
                x: x + i * 15,
                y: y,
                vx: 0,
                vy: -bulletConfig.speed,
                size: bulletConfig.size,
                color: bulletConfig.name === '彩虹' ? `hsl(${now % 360}, 100%, 50%)` : bulletConfig.color,
                damage: bulletConfig.damage,
                type: bulletConfig.name
            });
        }
    } else {
        bullets.push({
            x: x,
            y: y,
            vx: 0,
            vy: -bulletConfig.speed,
            size: bulletConfig.size,
            color: bulletConfig.name === '彩虹' ? `hsl(${now % 360}, 100%, 50%)` : bulletConfig.color,
            damage: bulletConfig.damage,
            type: bulletConfig.name
        });
    }
}

function createEnemy(canvas) {
    if (enemies.length >= CONFIG.MAX_ENEMIES) return;
    
    const levelConfig = levelConfigs[game.level - 1];
    const type = Math.random() < 0.7 ? 'normal' : 'fast';
    
    enemies.push({
        x: Math.random() * canvas.width,
        y: -20,
        size: type === 'fast' ? 14 : 16,
        color: type === 'fast' ? '#f0f' : '#f00',
        hp: type === 'fast' ? 20 : 30,
        speed: type === 'fast' ? 2.5 : 1.8,
        type: type,
        points: type === 'fast' ? 15 : 10
    });
}

// ==================== 关卡配置 ====================
const levelConfigs = [
    {target: 20, enemySpeed: 1.8, spawnRate: CONFIG.ENEMY_SPAWN_RATE, maxEnemies: 8},
    {target: 25, enemySpeed: 2.0, spawnRate: CONFIG.ENEMY_SPAWN_RATE * 1.2, maxEnemies: 10},
    {target: 30, enemySpeed: 2.2, spawnRate: CONFIG.ENEMY_SPAWN_RATE * 1.4, maxEnemies: 12},
    {target: 35, enemySpeed: 2.4, spawnRate: CONFIG.ENEMY_SPAWN_RATE * 1.6, maxEnemies: 14},
    {target: 40, enemySpeed: 2.6, spawnRate: CONFIG.ENEMY_SPAWN_RATE * 1.8, maxEnemies: 16},
    {target: 45, enemySpeed: 2.8, spawnRate: CONFIG.ENEMY_SPAWN_RATE * 2.0, maxEnemies: 18},
    {target: 50, enemySpeed: 3.0, spawnRate: CONFIG.ENEMY_SPAWN_RATE * 2.2, maxEnemies: 20},
    {target: 55, enemySpeed: 3.2, spawnRate: CONFIG.ENEMY_SPAWN_RATE * 2.4, maxEnemies: 22},
    {target: 60, enemySpeed: 3.4, spawnRate: CONFIG.ENEMY_SPAWN_RATE * 2.6, maxEnemies: 24},
    {target: 65, enemySpeed: 3.6, spawnRate: CONFIG.ENEMY_SPAWN_RATE * 2.8, maxEnemies: 26}
];

// ==================== 游戏逻辑更新 ====================
function updateGame(deltaTime, canvas) {
    if (game.isPaused || game.isGameOver) return;
    
    // 更新玩家
    const dx = player.targetX - player.x;
    player.x += dx * 0.15;
    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    
    if (player.isInvincible) {
        player.invincibleTimer -= deltaTime;
        if (player.invincibleTimer <= 0) {
            player.isInvincible = false;
            player.color = '#0f0';
        }
    }
    
    // 更新子弹（反向遍历以便安全删除）
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y += bullet.vy;
        
        // 移出屏幕的子弹
        if (bullet.y < -20) {
            bullets.splice(i, 1);
        }
    }
    
    // 更新敌人
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemy.speed;
        
        // 敌人到达底部
        if (enemy.y > canvas.height - 10) {
            if (!game.infiniteLife && !player.isInvincible) {
                playerHit();
            }
            enemies.splice(i, 1);
            continue;
        }
    }
    
    // 碰撞检测（简化的网格检测）
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        let bulletHit = false;
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < bullet.size + enemy.size) {
                // 击中音效
                soundManager.playHit();
                
                enemy.hp -= bullet.damage;
                
                // 创建击中粒子
                for (let k = 0; k < 5; k++) {
                    particles.push({
                        x: bullet.x,
                        y: bullet.y,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4,
                        size: Math.random() * 2 + 1,
                        color: bullet.color,
                        life: 20
                    });
                }
                
                if (enemy.hp <= 0) {
                    // 死亡音效
                    soundManager.playExplosion();
                    
                    game.score += enemy.points;
                    game.enemiesDefeated++;
                    game.totalEnemiesDefeated++;
                    
                    // 更新UI
                    document.getElementById('score').textContent = game.score;
                    document.getElementById('progress').textContent = `${game.enemiesDefeated}/${game.levelTarget}`;
                    
                    // 创建死亡粒子
                    for (let k = 0; k < 10; k++) {
                        particles.push({
                            x: enemy.x,
                            y: enemy.y,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            size: Math.random() * 3 + 1,
                            color: enemy.color,
                            life: 30
                        });
                    }
                    
                    enemies.splice(j, 1);
                    
                    // 检查关卡完成
                    if (game.enemiesDefeated >= game.levelTarget) {
                        completeLevel();
                    }
                }
                
                bullets.splice(i, 1);
                bulletHit = true;
                break;
            }
        }
    }
    
    // 更新粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    // 生成敌人
    if (Math.random() < levelConfigs[game.level - 1].spawnRate && 
        enemies.length < levelConfigs[game.level - 1].maxEnemies) {
        createEnemy(canvas);
    }
    
    // 性能清理
    PerformanceManager.cleanArrays();
}

// ==================== 渲染函数 ====================
function renderGame(ctx, canvas, currentTime) {
    // 黑色背景
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 星星背景（简化）
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        const alpha = 0.3 + Math.sin(currentTime / 1000 + star.x) * 0.2;
        ctx.globalAlpha = alpha;
        ctx.fillRect(star.x, star.y, star.size, star.size);
        
        // 移动星星
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
    ctx.globalAlpha = 1;
    
    // 渲染子弹
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = bullet.color;
        ctx.fillRect(bullet.x - bullet.size/2, bullet.y - bullet.size/2, bullet.size, bullet.size);
        ctx.shadowBlur = 0;
    });
    
    // 渲染敌人
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // 简单血量条
        const hpPercent = Math.max(0, enemy.hp / (enemy.type === 'fast' ? 20 : 30));
        ctx.fillStyle = '#f00';
        ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 6, enemy.size * 2 * hpPercent, 3);
    });
    
    // 渲染玩家
    if (player.isInvincible) {
        const blink = Math.sin(currentTime / 100) > 0;
        ctx.fillStyle = blink ? '#fff' : '#f00';
    } else {
        ctx.fillStyle = player.color;
    }
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.size);
    ctx.lineTo(player.x - player.size * 1.2, player.y + player.size * 0.8);
    ctx.lineTo(player.x + player.size * 1.2, player.y + player.size * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // 渲染粒子
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
    
    // 渲染UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 120, 35);
    ctx.fillStyle = '#0ff';
    ctx.font = '12px Arial';
    ctx.fillText(`关卡 ${game.level}`, 20, 25);
    ctx.fillText(`进度: ${game.enemiesDefeated}/${game.levelTarget}`, 20, 40);
    
    ctx.fillRect(canvas.width - 130, 10, 120, 35);
    ctx.fillStyle = '#ff0';
    ctx.fillText(`分数: ${game.score}`, canvas.width - 120, 25);
    
    if (!game.infiniteLife) {
        ctx.fillStyle = '#f00';
        ctx.fillText(`生命: ${game.playerLives}`, canvas.width - 120, 40);
    }
    
    // 显示FPS（调试用）
    ctx.fillStyle = game.fps < 30 ? '#f00' : '#0f0';
    ctx.font = '10px Arial';
    ctx.fillText(`FPS: ${game.fps}`, canvas.width - 40, 20);
}

// ==================== 游戏事件处理 ====================
function playerHit() {
    if (game.infiniteLife) return;
    
    const now = Date.now();
    if (now - game.lastHitTime < 1000) return;
    
    game.playerLives--;
    game.lastHitTime = now;
    player.isInvincible = true;
    player.invincibleTimer = 1000;
    player.color = '#f00';
    
    // 音效
    soundManager.playHit();
    
    // 更新UI
    document.getElementById('healthValue').textContent = game.playerLives;
    
    if (game.playerLives <= 1) {
        document.getElementById('lifeWarning').style.display = 'block';
        setTimeout(() => {
            document.getElementById('lifeWarning').style.display = 'none';
        }, 1500);
    }
    
    if (game.playerLives <= 0) {
        gameOver('生命值耗尽！');
    }
}

function completeLevel() {
    if (game.level >= levelConfigs.length) {
        gameVictory();
        return;
    }
    
    game.isPaused = true;
    bullets.length = 0;
    enemies.length = 0;
    particles.length = 0;
    
    game.level++;
    game.levelTarget = levelConfigs[game.level - 1].target;
    game.enemiesDefeated = 0;
    
    document.getElementById('level').textContent = game.level;
    document.getElementById('progress').textContent = `0/${game.levelTarget}`;
    
    // 显示关卡信息
    document.getElementById('levelInfo').textContent = `关卡 ${game.level}`;
    document.getElementById('levelInfo').style.display = 'block';
    
    setTimeout(() => {
        game.isPaused = false;
        document.getElementById('levelInfo').style.display = 'none';
    }, 1500);
}

function gameVictory() {
    game.isGameOver = true;
    game.isPaused = true;
    
    document.getElementById('messageTitle').textContent = '🎊 游戏胜利！';
    document.getElementById('messageText').textContent = '恭喜你通关了所有关卡！';
    document.getElementById('messageStats').textContent = `最终分数: ${game.score} | 总击败敌人: ${game.totalEnemiesDefeated}`;
    document.getElementById('gameMessage').className = 'game-message win-message';
    document.getElementById('gameOverlay').style.display = 'flex';
}

function gameOver(reason) {
    game.isGameOver = true;
    game.isPaused = true;
    
    document.getElementById('messageTitle').textContent = '💀 游戏结束';
    document.getElementById('messageText').textContent = reason || '游戏结束！';
    document.getElementById('messageStats').textContent = `最终分数: ${game.score} | 完成关卡: ${game.level - 1}`;
    document.getElementById('gameMessage').className = 'game-message';
    document.getElementById('gameOverlay').style.display = 'flex';
}

function restartGame() {
    game.score = 0;
    game.level = 1;
    game.enemiesDefeated = 0;
    game.levelTarget = levelConfigs[0].target;
    game.totalEnemiesDefeated = 0;
    game.isPaused = false;
    game.isGameOver = false;
    game.playerLives = game.infiniteLife ? Infinity : 3;
    game.lastHitTime = 0;
    
    player.isInvincible = false;
    player.invincibleTimer = 0;
    player.color = '#0f0';
    
    bullets.length = 0;
    enemies.length = 0;
    particles.length = 0;
    
    currentBulletType = 0;
    
    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
    document.getElementById('progress').textContent = `0/${game.levelTarget}`;
    document.getElementById('healthValue').textContent = game.infiniteLife ? '∞' : game.playerLives;
    document.getElementById('gameOverlay').style.display = 'none';
    
    updateBulletDisplay();
}

function updateBulletDisplay() {
    const bullet = bulletTypes[currentBulletType];
    document.getElementById('bulletName').textContent = bullet.name;
    document.getElementById('bulletColor').style.background = bullet.color === 'rainbow' ? 
        'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : bullet.color;
}

function toggleLifeMode() {
    if (game.isPaused || game.isGameOver) return;
    
    game.infiniteLife = !game.infiniteLife;
    game.playerLives = game.infiniteLife ? Infinity : 3;
    
    const btn = document.getElementById('lifeModeBtn');
    btn.innerHTML = game.infiniteLife ? 
        '<div style="font-size: 18px;">♾️</div><div class="life-mode-text">无限</div>' :
        '<div style="font-size: 18px;">❤️</div><div class="life-mode-text">有限</div>';
    btn.className = game.infiniteLife ? 'life-mode-btn infinite' : 'life-mode-btn limited';
    
    document.getElementById('healthValue').textContent = game.infiniteLife ? '∞' : game.playerLives;
    soundManager.playSwitch();
}

// ==================== 游戏主循环 ====================
let canvas, ctx;
let isTouching = false;
let moveDirection = {x: 0, y: 0};
let isManualControl = false;

function gameLoop(currentTime) {
    // 计算deltaTime
    const deltaTime = Math.min(50, currentTime - game.lastUpdate) || 16;
    game.lastUpdate = currentTime;
    
    // 更新FPS
    PerformanceManager.updateFPS(currentTime);
    
    // 游戏逻辑更新
    if (!game.isPaused && !game.isGameOver && game.isStarted) {
        updateGame(deltaTime, canvas);
        
        // 自动射击
        if (isTouching || isManualControl) {
            createBullet(player.x, player.y - player.size);
        }
        
        // 手动控制移动
        if (isManualControl) {
            player.x += moveDirection.x * CONFIG.PLAYER_SPEED;
            player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
        }
    }
    
    // 渲染
    renderGame(ctx, canvas, currentTime);
    
    // 继续循环
    requestAnimationFrame(gameLoop);
}

// ==================== 事件监听 ====================
function setupEventListeners() {
    // 窗口大小变化
    window.addEventListener('resize', () => {
        if (game.isStarted) {
            canvas = initCanvas();
            player.x = canvas.width / 2;
            player.targetX = player.x;
        }
    });
    
    // 游戏模式选择
    document.getElementById('infiniteModeBtn').addEventListener('click', () => selectGameMode(true));
    document.getElementById('limitedModeBtn').addEventListener('click', () => selectGameMode(false));
    
    // 控制按钮
    document.getElementById('lifeModeBtn').addEventListener('click', toggleLifeMode);
    document.getElementById('soundToggleBtn').addEventListener('click', () => soundManager.toggle());
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    
    // 切换子弹
    document.getElementById('switchBulletBtn').addEventListener('click', () => {
        currentBulletType = (currentBulletType + 1) % bulletTypes.length;
        updateBulletDisplay();
        soundManager.playSwitch();
        
        const btn = document.getElementById('switchBulletBtn');
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => btn.style.transform = '', 150);
    });
    
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
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        player.targetX = (touch.clientX - rect.left) * (canvas.width / rect.width);
        isTouching = true;
        isManualControl = false;
    }, {passive: false});
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        player.targetX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    }, {passive: false});
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        isTouching = false;
    }, {passive: false});
    
    // 鼠标控制
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        player.targetX = (e.clientX - rect.left) * (canvas.width / rect.width);
        isTouching = true;
        isManualControl = false;
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (isTouching) {
            const rect = canvas.getBoundingClientRect();
            player.targetX = (e.clientX - rect.left) * (canvas.width / rect.width);
        }
    });
    
    canvas.addEventListener('mouseup', () => isTouching = false);
    canvas.addEventListener('mouseleave', () => isTouching = false);
    
    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (!game.isStarted || game.isPaused || game.isGameOver) return;
        
        switch(e.key.toLowerCase()) {
            case 'arrowleft': case 'a':
                e.preventDefault();
                isManualControl = true;
                moveDirection = {x: -1, y: 0};
                isTouching = true;
                break;
            case 'arrowright': case 'd':
                e.preventDefault();
                isManualControl = true;
                moveDirection = {x: 1, y: 0};
                isTouching = true;
                break;
            case 's': case ' ':
                e.preventDefault();
                currentBulletType = (currentBulletType + 1) % bulletTypes.length;
                updateBulletDisplay();
                soundManager.playSwitch();
                break;
            case 'm':
                e.preventDefault();
                toggleLifeMode();
                break;
            case 'r':
                if (game.isGameOver) restartGame();
                break;
            case 'p':
                e.preventDefault();
                game.isPaused = !game.isPaused;
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        switch(e.key.toLowerCase()) {
            case 'arrowleft': case 'a':
            case 'arrowright': case 'd':
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

// ==================== 游戏启动 ====================
function selectGameMode(isInfinite) {
    game.infiniteLife = isInfinite;
    game.playerLives = isInfinite ? Infinity : 3;
    
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
    
    // 初始化
    canvas = initCanvas();
    ctx = canvas.getContext('2d');
    
    updateBulletDisplay();
    game.isStarted = true;
    
    // 开始游戏循环
    requestAnimationFrame(gameLoop);
    
    console.log(`🎮 选择游戏模式: ${isInfinite ? '无限生命' : '有限生命（3条命）'}`);
}

// ==================== 页面加载完成 ====================
window.addEventListener('DOMContentLoaded', () => {
    console.log('✨ 游戏已加载，请选择游戏模式');
    console.log('🔊 音效已启用');
    console.log('🖱️ 电脑操作：鼠标/A/D移动，S切换子弹，M切换模式，P暂停');
    
    // 设置事件监听
    setupEventListeners();
});

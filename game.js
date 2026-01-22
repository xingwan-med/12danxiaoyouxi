// ==================== 🎮 12种子弹射击游戏 - 稳定版 ====================
console.log('🚀 启动稳定版游戏 - 修复卡顿和游戏逻辑');

// ==================== 基础配置 ====================
const CONFIG = {
    PLAYER_SPEED: 5,
    PLAYER_SIZE: 22,
    BULLET_COOLDOWN: 150,
    ENEMY_SPAWN_RATE: 0.02
};

// ==================== 简化的音效系统 ====================
class SimpleSound {
    constructor() {
        this.enabled = true;
        this.init();
    }
    
    init() {
        // 尝试初始化音频上下文
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 音效系统已启用');
        } catch (e) {
            console.log('⚠️ 音效初始化失败，使用静音模式');
            this.enabled = false;
        }
    }
    
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            // 静默失败
        }
    }
    
    playShoot() {
        this.playTone(800 + Math.random() * 300, 0.08, 'square', 0.2);
    }
    
    playHit() {
        this.playTone(400 + Math.random() * 200, 0.1, 'sawtooth', 0.25);
    }
    
    playExplosion() {
        this.playTone(150, 0.25, 'sine', 0.4);
    }
    
    playSwitch() {
        this.playTone(600, 0.05, 'sine', 0.3);
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

const sound = new SimpleSound();

// ==================== 游戏状态 ====================
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
    lastHitTime: 0
};

// ==================== 游戏对象 ====================
let player = {
    x: 0, y: 0, size: CONFIG.PLAYER_SIZE, color: '#00ff88',
    targetX: 0, isInvincible: false, invincibleTimer: 0
};

let bullets = [];
let enemies = [];
let particles = [];

// ==================== 子弹系统 ====================
let currentBulletType = 0;
const bulletTypes = [
    {name: '普通', color: '#00ff88', damage: 10, speed: 12, size: 5},
    {name: '散弹', color: '#ffff00', damage: 8, speed: 10, size: 6},
    {name: '激光', color: '#4169e1', damage: 15, speed: 18, size: 4},
    {name: '导弹', color: '#ff4400', damage: 20, speed: 8, size: 8},
    {name: '闪电', color: '#00ffff', damage: 12, speed: 25, size: 7},
    {name: '彩虹', color: 'rainbow', damage: 10, speed: 12, size: 6},
    {name: '毒液', color: '#7cfc00', damage: 8, speed: 9, size: 7},
    {name: '冰霜', color: '#87ceeb', damage: 6, speed: 11, size: 6},
    {name: '火焰', color: '#ff4500', damage: 14, speed: 10, size: 7},
    {name: '黑洞', color: '#000000', damage: 25, speed: 5, size: 12},
    {name: '追踪', color: '#9370db', damage: 12, speed: 8, size: 6},
    {name: '爆破', color: '#ff6347', damage: 18, speed: 7, size: 10}
];

let lastShotTime = 0;

function createBullet(x, y) {
    const now = Date.now();
    if (now - lastShotTime < CONFIG.BULLET_COOLDOWN) return;
    lastShotTime = now;
    
    const bulletConfig = bulletTypes[currentBulletType];
    
    // 播放音效
    sound.playShoot();
    
    if (bulletConfig.name === '散弹') {
        for (let i = -1; i <= 1; i++) {
            bullets.push({
                x: x + i * 20,
                y: y,
                vy: -bulletConfig.speed,
                size: bulletConfig.size,
                color: bulletConfig.name === '彩虹' ? `hsl(${now % 360}, 100%, 50%)` : bulletConfig.color,
                damage: bulletConfig.damage
            });
        }
    } else if (bulletConfig.name === '彩虹') {
        const hue = now % 360;
        bullets.push({
            x: x, y: y,
            vy: -bulletConfig.speed,
            size: bulletConfig.size,
            color: `hsl(${hue}, 100%, 50%)`,
            damage: bulletConfig.damage
        });
    } else {
        bullets.push({
            x: x, y: y,
            vy: -bulletConfig.speed,
            size: bulletConfig.size,
            color: bulletConfig.color,
            damage: bulletConfig.damage
        });
    }
}

// ==================== 敌人生成 ====================
const levelConfigs = [
    {target: 20, enemySpeed: 1.8, spawnRate: CONFIG.ENEMY_SPAWN_RATE, maxEnemies: 10, enemyHealth: 25},
    {target: 30, enemySpeed: 2.0, spawnRate: 0.025, maxEnemies: 12, enemyHealth: 30},
    {target: 40, enemySpeed: 2.2, spawnRate: 0.028, maxEnemies: 14, enemyHealth: 35},
    {target: 50, enemySpeed: 2.4, spawnRate: 0.030, maxEnemies: 16, enemyHealth: 40},
    {target: 60, enemySpeed: 2.6, spawnRate: 0.032, maxEnemies: 18, enemyHealth: 45},
    {target: 70, enemySpeed: 2.8, spawnRate: 0.035, maxEnemies: 20, enemyHealth: 50},
    {target: 80, enemySpeed: 3.0, spawnRate: 0.038, maxEnemies: 22, enemyHealth: 55},
    {target: 90, enemySpeed: 3.2, spawnRate: 0.040, maxEnemies: 24, enemyHealth: 60},
    {target: 100, enemySpeed: 3.5, spawnRate: 0.043, maxEnemies: 26, enemyHealth: 65},
    {target: 120, enemySpeed: 4.0, spawnRate: 0.045, maxEnemies: 30, enemyHealth: 70}
];

function createEnemy(canvas) {
    const levelConfig = levelConfigs[game.level - 1];
    if (enemies.length >= levelConfig.maxEnemies) return;
    
    const enemyType = Math.random() < 0.7 ? 'normal' : 'fast';
    
    enemies.push({
        x: Math.random() * canvas.width,
        y: -30,
        size: 18,
        color: enemyType === 'fast' ? '#ff00ff' : '#ff4444',
        hp: levelConfig.enemyHealth * (enemyType === 'fast' ? 0.7 : 1),
        speed: levelConfig.enemySpeed * (enemyType === 'fast' ? 1.5 : 1),
        type: enemyType,
        points: enemyType === 'fast' ? 15 + game.level * 3 : 10 + game.level * 2
    });
}

// ==================== 游戏更新逻辑 ====================
function updateGame(canvas) {
    if (game.isPaused || game.isGameOver) return;
    
    // 更新玩家位置（关键修复：确保玩家可以移动）
    const dx = player.targetX - player.x;
    player.x += dx * 0.2;  // 增加移动速度
    
    // 边界检查
    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    
    // 无敌状态更新
    if (player.isInvincible) {
        player.invincibleTimer -= 16;
        if (player.invincibleTimer <= 0) {
            player.isInvincible = false;
            player.color = '#00ff88';
        }
    }
    
    // 更新子弹
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y += bullets[i].vy;
        if (bullets[i].y < -40) bullets.splice(i, 1);
    }
    
    // 更新敌人
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemies[i].speed;
        
        // 敌人到达底部
        if (enemies[i].y > canvas.height - 10) {
            if (!game.infiniteLife && !player.isInvincible) {
                playerHit();
            }
            enemies.splice(i, 1);
            continue;
        }
    }
    
    // 碰撞检测
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < bullet.size + enemy.size) {
                // 播放击中音效
                sound.playHit();
                
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
                    // 播放爆炸音效
                    sound.playExplosion();
                    
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
                break;
            }
        }
    }
    
    // 更新粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life--;
        
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    // 生成敌人
    if (Math.random() < levelConfigs[game.level - 1].spawnRate && 
        enemies.length < levelConfigs[game.level - 1].maxEnemies) {
        createEnemy(canvas);
    }
}

// ==================== 渲染函数 ====================
function renderGame(ctx, canvas) {
    // 黑色背景
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 简单的星星背景
    for (let i = 0; i < 50; i++) {
        const x = (i * 19) % canvas.width;
        const y = (i * 23) % canvas.height;
        const size = (Math.sin(Date.now() / 1000 + i) + 1) * 0.3 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(Date.now() / 1500 + i) * 0.1})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 渲染子弹
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(bullet.x - bullet.size/2, bullet.y - bullet.size/2, bullet.size, bullet.size);
        ctx.shadowBlur = 0;
    });
    
    // 渲染敌人
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // 血量条
        const maxHealth = levelConfigs[game.level - 1].enemyHealth;
        const hpPercent = enemy.hp / maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 8, enemy.size * 2 * hpPercent, 4);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(enemy.x - enemy.size, enemy.y - enemy.size - 8, enemy.size * 2, 4);
    });
    
    // 渲染玩家
    if (player.isInvincible) {
        const blink = Math.sin(Date.now() / 100) > 0;
        ctx.fillStyle = blink ? '#ffffff' : '#ff0000';
    } else {
        ctx.fillStyle = player.color;
    }
    
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.size);
    ctx.lineTo(player.x - player.size * 1.3, player.y + player.size * 0.9);
    ctx.lineTo(player.x + player.size * 1.3, player.y + player.size * 0.9);
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
    
    // 简单UI
    ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
    ctx.fillRect(10, 10, 140, 40);
    ctx.fillStyle = '#ff00ff';
    ctx.font = '14px Arial';
    ctx.fillText(`关卡 ${game.level}`, 20, 30);
    ctx.fillText(`进度: ${game.enemiesDefeated}/${game.levelTarget}`, 20, 50);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(canvas.width - 150, 10, 140, 40);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`分数: ${game.score}`, canvas.width - 140, 30);
    
    if (!game.infiniteLife) {
        ctx.fillStyle = '#ff0000';
        ctx.fillText(`生命: ${game.playerLives}`, canvas.width - 140, 50);
    }
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
    player.color = '#ff0000';
    
    // 播放音效
    sound.playHit();
    
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
    player.color = '#00ff88';
    
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
    sound.playSwitch();
}

// ==================== 游戏主循环 ====================
let canvas, ctx;
let isTouching = false;
let moveDirection = {x: 0, y: 0};
let isManualControl = false;

function gameLoop() {
    if (canvas && canvas.width > 0 && canvas.height > 0) {
        updateGame(canvas);
        renderGame(ctx, canvas);
    }
    requestAnimationFrame(gameLoop);
}

// ==================== 事件监听 ====================
function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    player.targetX = Math.max(player.size, Math.min(canvas.width - player.size, 
        (touch.clientX - rect.left) * scaleX));
    isTouching = true;
    isManualControl = false;
}

function handleMouse(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    player.targetX = Math.max(player.size, Math.min(canvas.width - player.size, 
        (e.clientX - rect.left) * scaleX));
}

function setupEventListeners() {
    // 窗口大小变化
    window.addEventListener('resize', () => {
        if (game.isStarted) {
            const availableWidth = window.innerWidth;
            const availableHeight = window.innerHeight - 60;
            
            canvas.width = Math.min(availableWidth * 0.98, 900);
            canvas.height = Math.min(availableHeight * 0.85, 650);
            
            player.x = canvas.width / 2;
            player.targetX = player.x;
        }
    });
    
    // 游戏模式选择
    document.getElementById('infiniteModeBtn').addEventListener('click', () => selectGameMode(true));
    document.getElementById('limitedModeBtn').addEventListener('click', () => selectGameMode(false));
    
    // 控制按钮
    document.getElementById('lifeModeBtn').addEventListener('click', toggleLifeMode);
    document.getElementById('soundToggleBtn').addEventListener('click', () => sound.toggle());
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    
    // 切换子弹
    document.getElementById('switchBulletBtn').addEventListener('click', () => {
        currentBulletType = (currentBulletType + 1) % bulletTypes.length;
        updateBulletDisplay();
        sound.playSwitch();
        
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
    canvas.addEventListener('touchstart', handleTouch, {passive: false});
    canvas.addEventListener('touchmove', handleTouch, {passive: false});
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        isTouching = false;
    }, {passive: false});
    
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
        if (!game.isStarted || game.isPaused || game.isGameOver) return;
        
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
                currentBulletType = (currentBulletType + 1) % bulletTypes.length;
                updateBulletDisplay();
                sound.playSwitch();
                break;
            case 'm':
                e.preventDefault();
                toggleLifeMode();
                break;
            case 'r':
                if (game.isGameOver) restartGame();
                break;
            case 'p': case 'escape':
                e.preventDefault();
                game.isPaused = !game.isPaused;
                console.log(game.isPaused ? '⏸️ 游戏暂停' : '▶️ 游戏继续');
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
    
    // 初始化Canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight - 60;
    
    canvas.width = Math.min(availableWidth * 0.98, 900);
    canvas.height = Math.min(availableHeight * 0.85, 650);
    
    player.x = canvas.width / 2;
    player.y = canvas.height * 0.85;
    player.targetX = player.x;
    
    // 更新UI
    updateBulletDisplay();
    document.getElementById('healthValue').textContent = isInfinite ? '∞' : '3';
    document.getElementById('score').textContent = '0';
    document.getElementById('level').textContent = '1';
    document.getElementById('progress').textContent = '0/20';
    
    game.isStarted = true;
    game.score = 0;
    game.level = 1;
    game.enemiesDefeated = 0;
    game.levelTarget = 20;
    
    // 设置事件监听
    setupEventListeners();
    
    // 开始游戏循环
    gameLoop();
    
    console.log(`🎮 选择游戏模式: ${isInfinite ? '无限生命' : '有限生命（3条命）'}`);
    console.log('✨ 游戏开始！');
}

// ==================== 页面加载完成 ====================
window.addEventListener('DOMContentLoaded', () => {
    console.log('✨ 游戏已加载，请选择游戏模式');
    console.log('🔊 音效系统已准备');
    console.log('🖱️ 电脑操作：鼠标/A/D移动，S切换子弹，M切换模式，P暂停');
    
    // 显示模式选择界面
    document.getElementById('modeSelection').style.display = 'flex';
});

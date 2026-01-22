// 🎮 **完整版游戏** - 12种子弹射击游戏
console.log('🚀 启动12种子弹射击游戏');

// 游戏状态
let game = {
    score: 0,
    isStarted: false,
    isPaused: false,
    isGameOver: false,
    currentLevel: 1,
    enemiesDefeated: 0,
    levelTarget: 20,
    totalEnemiesDefeated: 0,
    infiniteLife: true,
    playerLives: 3,
    maxLives: 3,
    lastHitTime: 0,
    invincibleTime: 1000
};

// 玩家属性
let player = {
    x: 0, y: 0, 
    size: 22, 
    color: '#00ff88', 
    targetX: 0, 
    targetY: 0,
    isInvincible: false,
    invincibleTimer: 0
};

// 子弹类型 - 12种
let currentBulletType = 0;
const bulletTypes = [
    // 原有6种（激光颜色已修改）
    {name: '普通', color: '#00ff88', damage: 10, speed: 12, size: 5},
    {name: '散弹', color: '#ffff00', damage: 8, speed: 10, size: 6},
    {name: '激光', color: '#4169e1', damage: 15, speed: 18, size: 4}, // 改为深蓝
    {name: '导弹', color: '#ff4400', damage: 20, speed: 8, size: 8},
    {name: '闪电', color: '#00ffff', damage: 12, speed: 25, size: 7},
    {name: '彩虹', color: 'rainbow', damage: 10, speed: 12, size: 6},
    
    // 新增6种（保持原色）
    {name: '毒液', color: '#7cfc00', damage: 8, speed: 9, size: 7},
    {name: '冰霜', color: '#87ceeb', damage: 6, speed: 11, size: 6},
    {name: '火焰', color: '#ff4500', damage: 14, speed: 10, size: 7},
    {name: '黑洞', color: '#000000', damage: 25, speed: 5, size: 12},
    {name: '追踪', color: '#9370db', damage: 12, speed: 8, size: 6},
    {name: '爆破', color: '#ff6347', damage: 18, speed: 7, size: 10}
];

// 关卡配置
const levelConfigs = [
    {target: 20, enemySpeed: 1.8, spawnRate: 0.018, maxEnemies: 10, enemyHealth: 25, enemySize: 18},
    {target: 30, enemySpeed: 2.0, spawnRate: 0.022, maxEnemies: 12, enemyHealth: 30, enemySize: 18},
    {target: 40, enemySpeed: 2.2, spawnRate: 0.025, maxEnemies: 14, enemyHealth: 35, enemySize: 16},
    {target: 50, enemySpeed: 2.4, spawnRate: 0.028, maxEnemies: 16, enemyHealth: 40, enemySize: 16},
    {target: 60, enemySpeed: 2.6, spawnRate: 0.030, maxEnemies: 18, enemyHealth: 45, enemySize: 14},
    {target: 70, enemySpeed: 2.8, spawnRate: 0.032, maxEnemies: 20, enemyHealth: 50, enemySize: 14},
    {target: 80, enemySpeed: 3.0, spawnRate: 0.035, maxEnemies: 22, enemyHealth: 55, enemySize: 12},
    {target: 90, enemySpeed: 3.2, spawnRate: 0.038, maxEnemies: 24, enemyHealth: 60, enemySize: 12},
    {target: 100, enemySpeed: 3.5, spawnRate: 0.040, maxEnemies: 26, enemyHealth: 65, enemySize: 10},
    {target: 120, enemySpeed: 4.0, spawnRate: 0.045, maxEnemies: 30, enemyHealth: 70, enemySize: 10}
];

// DOM元素
const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
const modeSelection = document.getElementById('modeSelection');
const gameHeader = document.getElementById('gameHeader');
const canvasContainer = document.getElementById('gameCanvas').parentElement;
const healthElement = document.getElementById('healthValue');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const progressElement = document.getElementById('progress');
const bulletNameElement = document.getElementById('bulletName');
const bulletColorElement = document.getElementById('bulletColor');
const switchBulletBtn = document.getElementById('switchBulletBtn');
const lifeModeBtn = document.getElementById('lifeModeBtn');
const moveControls = document.getElementById('moveControls');
const levelInfo = document.getElementById('levelInfo');
const lifeWarning = document.getElementById('lifeWarning');
const gameOverlay = document.getElementById('gameOverlay');
const gameMessage = document.getElementById('gameMessage');
const messageTitle = document.getElementById('messageTitle');
const messageText = document.getElementById('messageText');
const messageStats = document.getElementById('messageStats');
const restartBtn = document.getElementById('restartBtn');
const infiniteModeBtn = document.getElementById('infiniteModeBtn');
const limitedModeBtn = document.getElementById('limitedModeBtn');

// 游戏数组
const bullets = [], enemies = [], particles = [];
let isTouching = false;
let lastShotTime = 0;
let moveDirection = {x: 0, y: 0};
const moveSpeed = 5;
let isManualControl = false;
let currentLevelConfig = levelConfigs[0];

// ==================== 游戏函数 ====================

// 切换生命模式函数
function toggleLifeMode() {
    if (game.isPaused || game.isGameOver) return;
    
    game.infiniteLife = !game.infiniteLife;
    
    if (game.infiniteLife) {
        game.playerLives = Infinity;
        player.isInvincible = false;
        lifeModeBtn.innerHTML = '<div style="font-size: 18px;">♾️</div><div class="life-mode-text">无限</div>';
        lifeModeBtn.className = 'life-mode-btn infinite';
        console.log('✅ 切换到无限生命模式');
    } else {
        game.playerLives = 3;
        player.isInvincible = false;
        lifeModeBtn.innerHTML = '<div style="font-size: 18px;">❤️</div><div class="life-mode-text">有限</div>';
        lifeModeBtn.className = 'life-mode-btn limited';
        console.log('✅ 切换到有限生命模式（3条命）');
    }
    
    updateHealthDisplay();
    
    lifeModeBtn.style.transform = 'scale(0.9)';
    setTimeout(() => {
        lifeModeBtn.style.transform = '';
    }, 200);
}

// 更新生命值显示
function updateHealthDisplay() {
    if (game.infiniteLife) {
        healthElement.textContent = '∞';
        healthElement.classList.add('infinite');
    } else {
        healthElement.textContent = game.playerLives;
        healthElement.classList.remove('infinite');
    }
}

// 玩家受伤
function playerHit() {
    if (game.infiniteLife) return;
    
    const now = Date.now();
    if (now - game.lastHitTime < game.invincibleTime) return;
    
    game.playerLives--;
    game.lastHitTime = now;
    player.isInvincible = true;
    player.invincibleTimer = game.invincibleTime;
    
    updateHealthDisplay();
    
    if (game.playerLives <= 1) {
        showLifeWarning();
    }
    
    console.log(`💔 玩家受伤，剩余生命: ${game.playerLives}`);
    
    if (game.playerLives <= 0) {
        gameOver('生命值耗尽！');
    }
}

// 显示生命值警告
function showLifeWarning() {
    lifeWarning.style.display = 'block';
    setTimeout(() => {
        lifeWarning.style.display = 'none';
    }, 2000);
}

// 选择游戏模式
function selectGameMode(isInfinite) {
    game.infiniteLife = isInfinite;
    game.playerLives = isInfinite ? Infinity : 3;
    
    if (isInfinite) {
        lifeModeBtn.innerHTML = '<div style="font-size: 18px;">♾️</div><div class="life-mode-text">无限</div>';
        lifeModeBtn.className = 'life-mode-btn infinite';
    } else {
        lifeModeBtn.innerHTML = '<div style="font-size: 18px;">❤️</div><div class="life-mode-text">有限</div>';
        lifeModeBtn.className = 'life-mode-btn limited';
    }
    
    updateHealthDisplay();
    modeSelection.style.display = 'none';
    gameHeader.style.display = 'flex';
    canvasContainer.style.display = 'block';
    
    initCanvas();
    updateBulletDisplay();
    updateProgressDisplay();
    showLevelInfo();
    game.isStarted = true;
    gameLoop();
    
    console.log(`🎮 选择游戏模式: ${isInfinite ? '无限生命' : '有限生命（3条命）'}`);
}

// 画布初始化
function initCanvas() {
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight - 60;
    
    canvas.width = Math.min(availableWidth * 0.98, 900);
    canvas.height = Math.min(availableHeight * 0.85, 650);
    
    player.x = canvas.width / 2;
    player.y = canvas.height * 0.8;
    player.targetX = player.x;
    player.targetY = player.y;
}

// 显示关卡信息
function showLevelInfo() {
    levelInfo.textContent = `关卡 ${game.currentLevel}`;
    levelInfo.style.display = 'block';
    setTimeout(() => {
        levelInfo.style.display = 'none';
    }, 3000);
}

// 更新游戏进度显示
function updateProgressDisplay() {
    progressElement.textContent = `${game.enemiesDefeated}/${game.levelTarget}`;
    levelElement.textContent = game.currentLevel;
    
    if (game.enemiesDefeated >= game.levelTarget) {
        completeLevel();
    }
}

// 完成当前关卡
function completeLevel() {
    if (game.currentLevel >= levelConfigs.length) {
        gameVictory();
        return;
    }
    
    game.isPaused = true;
    enemies.length = 0;
    bullets.length = 0;
    particles.length = 0;
    
    game.currentLevel++;
    currentLevelConfig = levelConfigs[game.currentLevel - 1];
    game.levelTarget = currentLevelConfig.target;
    game.enemiesDefeated = 0;
    
    updateProgressDisplay();
    showLevelInfo();
    
    setTimeout(() => {
        game.isPaused = false;
    }, 1000);
}

// 游戏胜利
function gameVictory() {
    game.isGameOver = true;
    game.isPaused = true;
    
    messageTitle.textContent = '🎊 游戏胜利！';
    messageTitle.className = 'win-message';
    messageText.textContent = '恭喜你通关了所有关卡！';
    messageStats.textContent = `最终分数: ${game.score} | 总击败敌人: ${game.totalEnemiesDefeated}`;
    gameMessage.className = 'game-message win-message';
    gameOverlay.style.display = 'flex';
}

// 游戏失败
function gameOver(reason) {
    game.isGameOver = true;
    game.isPaused = true;
    
    messageTitle.textContent = '💀 游戏结束';
    messageText.textContent = reason || '游戏结束！';
    messageStats.textContent = `最终分数: ${game.score} | 完成关卡: ${game.currentLevel - 1}`;
    gameMessage.className = 'game-message';
    gameOverlay.style.display = 'flex';
}

// 重新开始游戏
function restartGame() {
    game.score = 0;
    game.currentLevel = 1;
    game.enemiesDefeated = 0;
    game.levelTarget = levelConfigs[0].target;
    game.totalEnemiesDefeated = 0;
    game.isPaused = false;
    game.isGameOver = false;
    game.playerLives = game.infiniteLife ? Infinity : 3;
    player.isInvincible = false;
    player.invincibleTimer = 0;
    
    player.x = canvas.width / 2;
    player.y = canvas.height * 0.8;
    player.targetX = player.x;
    player.targetY = player.y;
    
    bullets.length = 0;
    enemies.length = 0;
    particles.length = 0;
    
    currentBulletType = 0;
    
    scoreElement.textContent = game.score;
    updateHealthDisplay();
    updateProgressDisplay();
    updateBulletDisplay();
    
    gameOverlay.style.display = 'none';
}

// 更新子弹显示
function updateBulletDisplay() {
    const bullet = bulletTypes[currentBulletType];
    bulletNameElement.textContent = bullet.name;
    const color = bullet.color === 'rainbow' ? '#ff0080' : bullet.color;
    bulletColorElement.style.background = bullet.color === 'rainbow' ? 
        'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : color;
}

// 创建子弹
function createBullet(x, y) {
    const bulletConfig = bulletTypes[currentBulletType];
    const now = Date.now();
    if (now - lastShotTime < 150) return;
    lastShotTime = now;

    switch(bulletConfig.name) {
        case '散弹':
            for (let i = -1; i <= 1; i++) {
                bullets.push({
                    x: x + i * 20,
                    y: y,
                    vy: -bulletConfig.speed,
                    size: bulletConfig.size,
                    color: bulletConfig.color,
                    damage: bulletConfig.damage,
                    type: 'spread'
                });
            }
            break;
            
        case '毒液':
            bullets.push({
                x: x, y: y,
                vy: -bulletConfig.speed,
                size: bulletConfig.size,
                color: bulletConfig.color,
                damage: bulletConfig.damage,
                type: 'poison',
                trail: true
            });
            break;
            
        case '冰霜':
            bullets.push({
                x: x, y: y,
                vy: -bulletConfig.speed,
                size: bulletConfig.size,
                color: bulletConfig.color,
                damage: bulletConfig.damage,
                type: 'frost',
                slowEffect: 0.5
            });
            break;
            
        case '火焰':
            bullets.push({
                x: x, y: y,
                vy: -bulletConfig.speed,
                size: bulletConfig.size,
                color: bulletConfig.color,
                damage: bulletConfig.damage,
                type: 'fire',
                burnDamage: 3
            });
            break;
            
        case '黑洞':
            bullets.push({
                x: x, y: y,
                vy: -bulletConfig.speed,
                size: bulletConfig.size * 1.5,
                color: bulletConfig.color,
                damage: bulletConfig.damage,
                type: 'blackhole',
                attraction: 2
            });
            break;
            
        case '追踪':
            bullets.push({
                x: x, y: y,
                vy: -bulletConfig.speed,
                size: bulletConfig.size,
                color: bulletConfig.color,
                damage: bulletConfig.damage,
                type: 'homing',
                target: null
            });
            break;
            
        case '爆破':
            bullets.push({
                x: x, y: y,
                vy: -bulletConfig.speed,
                size: bulletConfig.size,
                color: bulletConfig.color,
                damage: bulletConfig.damage,
                type: 'explode',
                blastRadius: 50
            });
            break;
            
        case '彩虹':
            const hue = (now / 30) % 360;
            bullets.push({
                x: x, y: y,
                vy: -bulletConfig.speed,
                size: bulletConfig.size,
                color: `hsl(${hue}, 100%, 50%)`,
                damage: bulletConfig.damage,
                type: 'rainbow'
            });
            break;
            
        default:
            bullets.push({
                x: x, y: y,
                vy: -bulletConfig.speed,
                size: bulletConfig.size,
                color: bulletConfig.color,
                damage: bulletConfig.damage,
                type: bulletConfig.name
            });
    }
}

// 创建敌人
function createEnemy() {
    if (enemies.length >= currentLevelConfig.maxEnemies || game.isPaused) return;
    
    const enemyType = Math.random() < 0.7 ? 'normal' : 'fast';
    const baseSpeed = currentLevelConfig.enemySpeed;
    const baseHealth = currentLevelConfig.enemyHealth;
    const baseSize = currentLevelConfig.enemySize;
    
    const configs = {
        normal: {
            hp: baseHealth,
            speed: baseSpeed,
            size: baseSize,
            color: '#ff4444',
            points: 10 + game.currentLevel * 2
        },
        fast: {
            hp: Math.floor(baseHealth * 0.7),
            speed: baseSpeed * 1.5,
            size: Math.floor(baseSize * 0.8),
            color: '#ff00ff',
            points: 15 + game.currentLevel * 3
        }
    };
    
    const config = configs[enemyType];
    enemies.push({
        x: Math.random() * canvas.width,
        y: -25,
        size: config.size,
        color: config.color,
        hp: config.hp,
        points: config.points,
        speed: config.speed,
        type: enemyType,
        originalSpeed: config.speed, // 记录原始速度用于恢复
        poisoned: false,
        poisonTimer: 0,
        poisonDamage: 0,
        frostTimer: 0,
        burning: false,
        burnTimer: 0,
        burnDamage: 0
    });
}

// 游戏更新
function update() {
    if (game.isPaused || game.isGameOver || !game.isStarted) return;
    
    // 更新无敌计时器
    if (player.isInvincible) {
        player.invincibleTimer -= 16;
        if (player.invincibleTimer <= 0) {
            player.isInvincible = false;
            player.color = '#00ff88';
        }
    }
    
    // 玩家移动
    if (isManualControl) {
        player.x += moveDirection.x * moveSpeed;
    } else {
        const dx = player.targetX - player.x;
        player.x += dx * 0.15;
    }

    // 边界检查
    const margin = player.size + 5;
    player.x = Math.max(margin, Math.min(canvas.width - margin, player.x));

    // 自动射击
    if (isTouching || isManualControl) {
        createBullet(player.x, player.y - player.size);
    }

    // 更新子弹
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // 追踪弹逻辑
        if (bullet.type === 'homing' && bullet.target === null) {
            // 寻找最近敌人
            let closestDist = Infinity;
            let closestEnemy = null;
            for (let j = 0; j < enemies.length; j++) {
                const e = enemies[j];
                const dx = bullet.x - e.x;
                const dy = bullet.y - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestEnemy = e;
                }
            }
            if (closestEnemy) {
                bullet.target = closestEnemy;
            }
        }
        
        // 更新追踪弹
        if (bullet.type === 'homing' && bullet.target) {
            const dx = bullet.target.x - bullet.x;
            const dy = bullet.target.y - bullet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 10) {
                bullet.x += (dx / dist) * 3;
                bullet.y += (dy / dist) * 3;
            }
        } else {
            bullet.y += bullet.vy;
        }
        
        if (bullet.y < -40) bullets.splice(i, 1);
    }

    // 更新敌人
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // 应用状态效果
        if (enemy.poisoned && enemy.poisonTimer > 0) {
            enemy.poisonTimer -= 16;
            if (enemy.poisonTimer % 200 < 16) {
                enemy.hp -= enemy.poisonDamage || 2;
                
                // 毒液粒子效果
                if (Math.random() < 0.3) {
                    particles.push({
                        x: enemy.x + (Math.random() - 0.5) * enemy.size,
                        y: enemy.y + (Math.random() - 0.5) * enemy.size,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        size: Math.random() * 2 + 1,
                        color: '#7cfc00',
                        life: 20,
                        alpha: 0.6
                    });
                }
            }
            if (enemy.poisonTimer <= 0) {
                enemy.poisoned = false;
            }
        }
        
        if (enemy.frostTimer > 0) {
            enemy.frostTimer -= 16;
            enemy.speed = enemy.originalSpeed * 0.5; // 减速50%
            
            // 冰霜粒子效果
            if (Math.random() < 0.2) {
                particles.push({
                    x: enemy.x + (Math.random() - 0.5) * enemy.size,
                    y: enemy.y + (Math.random() - 0.5) * enemy.size,
                    vx: (Math.random() - 0.5) * 1,
                    vy: (Math.random() - 0.5) * 1,
                    size: Math.random() * 2 + 1,
                    color: '#87ceeb',
                    life: 15,
                    alpha: 0.7
                });
            }
            
            if (enemy.frostTimer <= 0) {
                enemy.speed = enemy.originalSpeed; // 恢复速度
            }
        }
        
        if (enemy.burning && enemy.burnTimer > 0) {
            enemy.burnTimer -= 16;
            if (enemy.burnTimer % 300 < 16) {
                enemy.hp -= enemy.burnDamage || 3;
                
                // 火焰粒子效果
                for (let j = 0; j < 3; j++) {
                    particles.push({
                        x: enemy.x + (Math.random() - 0.5) * enemy.size,
                        y: enemy.y + (Math.random() - 0.5) * enemy.size,
                        vx: (Math.random() - 0.5) * 3,
                        vy: -Math.random() * 3 - 1,
                        size: Math.random() * 2 + 1,
                        color: `hsl(${20 + Math.random() * 30}, 100%, 50%)`,
                        life: 25,
                        alpha: 0.8
                    });
                }
            }
            if (enemy.burnTimer <= 0) {
                enemy.burning = false;
            }
        }
        
        enemy.y += enemy.speed;
        
        // 检查敌人是否到达底部
        if (enemy.y > canvas.height - 10) {
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
        let bulletHit = false;
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < bullet.size + enemy.size) {
                // 根据子弹类型应用不同效果
                switch(bullet.type) {
                    case 'poison':
                        enemy.hp -= bullet.damage;
                        enemy.poisoned = true;
                        enemy.poisonTimer = 1000;
                        enemy.poisonDamage = 2;
                        break;
                        
                    case 'frost':
                        enemy.hp -= bullet.damage;
                        enemy.frostTimer = 2000;
                        break;
                        
                    case 'fire':
                        enemy.hp -= bullet.damage;
                        enemy.burning = true;
                        enemy.burnTimer = 1500;
                        enemy.burnDamage = 3;
                        break;
                        
                    case 'blackhole':
                        enemy.hp -= bullet.damage;
                        // 吸引周围其他敌人
                        for (let k = 0; k < enemies.length; k++) {
                            if (k !== j) {
                                const otherEnemy = enemies[k];
                                const dx2 = bullet.x - otherEnemy.x;
                                const dy2 = bullet.y - otherEnemy.y;
                                const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                                if (dist2 < 100) {
                                    otherEnemy.x += dx2 * 0.1;
                                    otherEnemy.y += dy2 * 0.1;
                                }
                            }
                        }
                        // 黑洞粒子效果
                        for (let p = 0; p < 10; p++) {
                            const angle = Math.random() * Math.PI * 2;
                            const radius = bullet.size * 0.8;
                            particles.push({
                                x: bullet.x + Math.cos(angle) * radius,
                                y: bullet.y + Math.sin(angle) * radius,
                                vx: Math.cos(angle) * 2,
                                vy: Math.sin(angle) * 2,
                                size: Math.random() * 3 + 1,
                                color: '#4b0082',
                                life: 30,
                                alpha: 0.8
                            });
                        }
                        break;
                        
                    case 'explode':
                        enemy.hp -= bullet.damage;
                        // 对周围敌人造成伤害
                        for (let k = 0; k < enemies.length; k++) {
                            if (k !== j) {
                                const otherEnemy = enemies[k];
                                const dx2 = bullet.x - otherEnemy.x;
                                const dy2 = bullet.y - otherEnemy.y;
                                const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                                if (dist2 < bullet.blastRadius) {
                                    otherEnemy.hp -= bullet.damage * 0.5;
                                }
                            }
                        }
                        // 爆炸粒子效果
                        for (let p = 0; p < 25; p++) {
                            particles.push({
                                x: bullet.x,
                                y: bullet.y,
                                vx: (Math.random() - 0.5) * 10,
                                vy: (Math.random() - 0.5) * 10,
                                size: Math.random() * 4 + 2,
                                color: ['#ff4500', '#ff6347', '#ffa500'][Math.floor(Math.random() * 3)],
                                life: 40
                            });
                        }
                        bulletHit = true;
                        break;
                        
                    default:
                        enemy.hp -= bullet.damage;
                }
                
                if (enemy.hp <= 0) {
                    game.score += enemy.points;
                    game.enemiesDefeated++;
                    game.totalEnemiesDefeated++;
                    scoreElement.textContent = game.score;
                    
                    // 敌人死亡粒子效果
                    for (let p = 0; p < 15; p++) {
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
                    updateProgressDisplay();
                    
                    // 火焰击杀额外效果
                    if (bullet.type === 'fire') {
                        for (let p = 0; p < 8; p++) {
                            particles.push({
                                x: enemy.x,
                                y: enemy.y,
                                vx: (Math.random() - 0.5) * 5,
                                vy: -Math.random() * 5 - 2,
                                size: Math.random() * 2 + 1,
                                color: '#ff4500',
                                life: 25
                            });
                        }
                    }
                }
                
                // 某些子弹击中后消失，某些继续
                if (bullet.type !== 'laser' && bullet.type !== 'blackhole') {
                    bulletHit = true;
                }
                break;
            }
        }
        
        if (bulletHit) {
            bullets.splice(i, 1);
        }
        
        // 毒液弹轨迹效果
        if (bullet.type === 'poison' && bullet.trail && Math.random() < 0.4) {
            particles.push({
                x: bullet.x,
                y: bullet.y,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                size: Math.random() * 2 + 1,
                color: '#7cfc00',
                life: 25,
                alpha: 0.5
            });
        }
        
        // 火焰弹轨迹效果
        if (bullet.type === 'fire' && Math.random() < 0.5) {
            particles.push({
                x: bullet.x,
                y: bullet.y,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 1,
                size: Math.random() * 2 + 1,
                color: `hsl(${25 + Math.random() * 20}, 100%, 50%)`,
                life: 20
            });
        }
    }

    // 生成敌人
    if (Math.random() < currentLevelConfig.spawnRate && enemies.length < currentLevelConfig.maxEnemies) {
        createEnemy();
    }
    
    // 更新粒子系统
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// 渲染函数
function render() {
    if (!game.isStarted) return;
    
    // 纯黑色背景
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 星空效果
    for (let i = 0; i < 100; i++) {
        const x = (i * 19) % canvas.width;
        const y = (i * 23) % canvas.height;
        const size = (Math.sin(Date.now() / 1000 + i) + 1) * 0.3 + 0.5;
        const alpha = 0.3 + Math.sin(Date.now() / 1500 + i) * 0.1;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    // 较大的星星
    for (let i = 0; i < 20; i++) {
        const x = (i * 47) % canvas.width;
        const y = (i * 53) % canvas.height;
        const size = (Math.sin(Date.now() / 800 + i * 2) + 1) * 0.5 + 1;
        const alpha = 0.5 + Math.sin(Date.now() / 1200 + i * 3) * 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    // 显示当前关卡信息
    ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
    ctx.fillRect(10, 10, 150, 30);
    ctx.fillStyle = '#ff00ff';
    ctx.font = '14px Arial';
    ctx.fillText(`关卡 ${game.currentLevel}`, 20, 30);
    ctx.fillText(`进度: ${game.enemiesDefeated}/${game.levelTarget}`, 20, 50);
    
    // 显示生命值模式
    if (!game.infiniteLife) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(canvas.width - 120, 10, 110, 30);
        ctx.fillStyle = '#ff0000';
        ctx.font = '14px Arial';
        ctx.fillText(`生命: ${game.playerLives}`, canvas.width - 110, 30);
    }

    // 玩家飞船
    if (player.isInvincible) {
        const blink = Math.sin(Date.now() / 100) > 0;
        ctx.fillStyle = blink ? '#ffffff' : '#ff0000';
    } else {
        ctx.fillStyle = player.color;
    }
    
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.size);
    ctx.lineTo(player.x - player.size * 1.3, player.y + player.size * 0.9);
    ctx.lineTo(player.x + player.size * 1.3, player.y + player.size * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // 子弹渲染
    bullets.forEach(bullet => {
        switch(bullet.type) {
            case 'laser':
                ctx.shadowColor = bullet.color;
                ctx.shadowBlur = 15;
                ctx.fillStyle = bullet.color;
                ctx.fillRect(bullet.x - bullet.size * 0.8, bullet.y - bullet.size * 3, bullet.size * 1.6, bullet.size * 5);
                ctx.shadowBlur = 0;
                break;
                
            case 'poison':
                ctx.globalAlpha = 0.8;
                ctx.shadowColor = '#7cfc00';
                ctx.shadowBlur = 10;
                ctx.fillStyle = bullet.color;
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
                break;
                
            case 'frost':
                ctx.shadowColor = '#87ceeb';
                ctx.shadowBlur = 8;
                ctx.fillStyle = bullet.color;
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 雪花效果
                for (let i = 0; i < 3; i++) {
                    const angle = (Date.now() / 500 + i * 2) % (Math.PI * 2);
                    const radius = bullet.size + 3;
                    const px = bullet.x + Math.cos(angle) * radius;
                    const py = bullet.y + Math.sin(angle) * radius;
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(px, py, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.shadowBlur = 0;
                break;
                
            case 'fire':
                const fireHue = (Date.now() / 50) % 60;
                ctx.shadowColor = '#ff4500';
                ctx.shadowBlur = 15;
                ctx.fillStyle = `hsl(${30 + fireHue}, 100%, 50%)`;
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                break;
                
            case 'blackhole':
                ctx.shadowColor = '#000000';
                ctx.shadowBlur = 20;
                ctx.fillStyle = bullet.color;
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 旋转光环
                ctx.strokeStyle = '#4b0082';
                ctx.lineWidth = 2;
                ctx.beginPath();
                const rotation = Date.now() / 200;
                const rx = Math.cos(rotation) * bullet.size;
                const ry = Math.sin(rotation) * bullet.size;
                ctx.arc(bullet.x + rx, bullet.y + ry, bullet.size * 0.5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
                break;
                
            case 'homing':
                ctx.shadowColor = '#9370db';
                ctx.shadowBlur = 10;
                ctx.fillStyle = bullet.color;
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 追踪线效果
                if (bullet.target) {
                    ctx.strokeStyle = 'rgba(147, 112, 219, 0.3)';
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(bullet.x, bullet.y);
                    ctx.lineTo(bullet.target.x, bullet.target.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
                ctx.shadowBlur = 0;
                break;
                
            case 'explode':
                const flash = Math.sin(Date.now() / 100) > 0;
                ctx.shadowColor = '#ff6347';
                ctx.shadowBlur = flash ? 15 : 8;
                ctx.fillStyle = flash ? '#ffffff' : bullet.color;
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                break;
                
            case 'rainbow':
                const hue = (Date.now() / 20 + bullet.x) % 360;
                ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
                ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
                ctx.shadowBlur = 8;
                ctx.fillRect(bullet.x - bullet.size / 2, bullet.y - bullet.size / 2, bullet.size, bullet.size);
                ctx.shadowBlur = 0;
                break;
                
            default:
                ctx.fillStyle = bullet.color;
                ctx.shadowColor = bullet.color;
                ctx.shadowBlur = bullet.size * 1.5;
                ctx.fillRect(bullet.x - bullet.size / 2, bullet.y - bullet.size / 2, bullet.size, bullet.size);
                ctx.shadowBlur = 0;
        }
    });

    // 敌人渲染
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // 血量条
        const maxHealth = currentLevelConfig.enemyHealth;
        const hpPercent = enemy.hp / maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 10, enemy.size * 2 * hpPercent, 5);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(enemy.x - enemy.size, enemy.y - enemy.size - 10, enemy.size * 2, 5);
        
        // 显示状态效果
        if (enemy.poisoned) {
            ctx.fillStyle = 'rgba(124, 252, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size + 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (enemy.frostTimer > 0) {
            ctx.strokeStyle = 'rgba(135, 206, 235, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (enemy.burning) {
            ctx.fillStyle = `rgba(255, 69, 0, ${0.3 + 0.2 * Math.sin(Date.now() / 200)})`;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size + 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // 渲染粒子系统
    particles.forEach(p => {
        ctx.globalAlpha = p.alpha || 0.8;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    });
}

// 游戏循环
function gameLoop() {
    if (canvas.width > 0 && canvas.height > 0) {
        update();
        render();
    }
    requestAnimationFrame(gameLoop);
}

// ==================== 事件处理 ====================

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    player.targetX = Math.max(player.size, Math.min(canvas.width - player.size, (touch.clientX - rect.left) * scaleX));
    isTouching = true;
    isManualControl = false;
}

// 窗口大小变化时重新初始化
window.addEventListener('resize', function() {
    if (game.isStarted) {
        setTimeout(initCanvas, 100);
    }
});

// 事件绑定
infiniteModeBtn.addEventListener('click', () => {
    selectGameMode(true);
});

limitedModeBtn.addEventListener('click', () => {
    selectGameMode(false);
});

// 生命模式切换按钮事件
lifeModeBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleLifeMode();
}, false);

// 切换子弹按钮事件
switchBulletBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    currentBulletType = (currentBulletType + 1) % bulletTypes.length;
    updateBulletDisplay();
    this.style.background = 'linear-gradient(135deg, #00ff88, #00ccff)';
    setTimeout(() => {
        this.style.background = 'linear-gradient(135deg, #ff0080, #ff6600)';
    }, 200);
}, false);

// 移动控制按钮事件
moveControls.querySelectorAll('.move-btn').forEach(btn => {
    btn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const direction = this.getAttribute('data-direction');
        isManualControl = true;
        isTouching = true;

        if (direction === 'left') {
            moveDirection = {x: -1, y: 0};
        } else if (direction === 'right') {
            moveDirection = {x: 1, y: 0};
        }

        this.style.background = 'rgba(0, 255, 136, 0.3)';
        this.style.boxShadow = '0 2px 8px rgba(0, 255, 136, 0.7)';
        this.style.transform = 'scale(0.9)';
    }, {passive: false});

    btn.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        moveDirection = {x: 0, y: 0};
        isTouching = false;
        this.style.background = 'rgba(0, 0, 0, 0.5)';
        this.style.boxShadow = '0 4px 10px rgba(0, 255, 136, 0.3)';
        this.style.transform = '';
    }, {passive: false});
});

// 重新开始按钮事件
restartBtn.addEventListener('click', restartGame);

// 画布触摸事件
canvas.addEventListener('touchstart', handleTouch, {passive: false});
canvas.addEventListener('touchmove', handleTouch, {passive: false});
canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isTouching = false;
}, {passive: false});

// ==================== 新增：鼠标事件支持 ====================

// 鼠标按下/移动事件
canvas.addEventListener('mousedown', function(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    player.targetX = Math.max(player.size, Math.min(canvas.width - player.size, 
        (e.clientX - rect.left) * scaleX));
    isTouching = true;
    isManualControl = false;
});

canvas.addEventListener('mousemove', function(e) {
    if (isTouching) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        player.targetX = Math.max(player.size, Math.min(canvas.width - player.size, 
            (e.clientX - rect.left) * scaleX));
    }
});

canvas.addEventListener('mouseup', function(e) {
    e.preventDefault();
    isTouching = false;
});

canvas.addEventListener('mouseleave', function(e) {
    e.preventDefault();
    isTouching = false;
});

// ==================== 新增：键盘控制支持 ====================

// 键盘事件监听
document.addEventListener('keydown', function(e) {
    if (!game.isStarted || game.isPaused || game.isGameOver) return;
    
    switch(e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
        case 'j':
            e.preventDefault();
            isManualControl = true;
            moveDirection = {x: -1, y: 0};
            isTouching = true;
            break;
            
        case 'arrowright':
        case 'd':
        case 'l':
            e.preventDefault();
            isManualControl = true;
            moveDirection = {x: 1, y: 0};
            isTouching = true;
            break;
            
        case 's':
        case ' ':
            e.preventDefault();
            currentBulletType = (currentBulletType + 1) % bulletTypes.length;
            updateBulletDisplay();
            switchBulletBtn.style.background = 'linear-gradient(135deg, #00ff88, #00ccff)';
            setTimeout(() => {
                switchBulletBtn.style.background = 'linear-gradient(135deg, #ff0080, #ff6600)';
            }, 200);
            break;
            
        case 'm':
            e.preventDefault();
            if (!game.isPaused && !game.isGameOver) {
                toggleLifeMode();
            }
            break;
            
        case 'r':
            if (game.isGameOver) {
                restartGame();
            }
            break;
            
        case 'p':
        case 'escape':
            e.preventDefault();
            game.isPaused = !game.isPaused;
            console.log(game.isPaused ? '⏸️ 游戏暂停' : '▶️ 游戏继续');
            break;
    }
});

// 键盘松开事件
document.addEventListener('keyup', function(e) {
    if (!game.isStarted || game.isPaused || game.isGameOver) return;
    
    switch(e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
        case 'j':
        case 'arrowright':
        case 'd':
        case 'l':
            if (!isTouching) {
                moveDirection = {x: 0, y: 0};
            }
            break;
    }
});

// ==================== 新增：双击全屏支持 ====================

let lastClickTime = 0;
canvas.addEventListener('click', function(e) {
    const currentTime = new Date().getTime();
    const clickGap = currentTime - lastClickTime;
    
    if (clickGap < 300 && clickGap > 0) {
        if (!document.fullscreenElement) {
            if (canvas.requestFullscreen) {
                canvas.requestFullscreen();
            } else if (canvas.webkitRequestFullscreen) {
                canvas.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }
    
    lastClickTime = currentTime;
});

// 阻止滚动
document.addEventListener('touchmove', (e) => {
    if (e.target === canvas || e.target.closest('.move-controls') || 
        e.target.closest('.mobile-controls') || e.target.closest('.life-mode-toggle')) {
        e.preventDefault();
    }
}, {passive: false});

console.log('🎮 游戏已加载，请选择游戏模式');
console.log('✨ 新功能：游戏过程中可随时点击中间按钮切换生命模式！');
console.log('🖱️ 电脑版操作：鼠标控制移动，A/D左右移动，S切换子弹，M切换模式');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverText = document.getElementById('gameOver');

// Fullscreen canvas adjustment
function resizeCanvas() {
    const aspectRatio = 2 / 1;
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    if (width / height > aspectRatio) {
        width = height * aspectRatio;
    } else {
        height = width / aspectRatio;
    }
    
    canvas.width = width;
    canvas.height = height;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);

// Game objects
const player = {
    x: 50,
    y: 300,
    width: 30,
    height: 30,
    speed: 5,
    velY: 0,
    jumping: false,
    powerUp: null,
    keys: 0,
    health: 3
};

// Levels (scaled to 800x400 base)
const levels = [
    {
        platforms: [
            {x: 0, y: 380, width: 800, height: 20},
            {x: 200, y: 300, width: 100, height: 20},
            {x: 400, y: 220, width: 100, height: 20}
        ],
        enemies: [
            {x: 600, y: 350, width: 30, height: 30, speed: 2, type: 'basic'}
        ],
        powerUps: [
            {x: 250, y: 270, width: 20, height: 20, type: 'speed', active: true}
        ],
        keys: [
            {x: 450, y: 190, width: 15, height: 15, active: true}
        ],
        door: {x: 700, y: 350, width: 30, height: 30, nextLevel: 1},
        obstacles: [
            {x: 350, y: 360, width: 20, height: 20, type: 'spike'}
        ]
    },
    {
        platforms: [
            {x: 0, y: 380, width: 800, height: 20},
            {x: 150, y: 280, width: 150, height: 20},
            {x: 500, y: 200, width: 150, height: 20}
        ],
        enemies: [
            {x: 300, y: 250, width: 40, height: 40, speed: 3, type: 'basic'},
            {x: 600, y: 350, width: 50, height: 50, speed: 0, type: 'boss', health: 3}
        ],
        powerUps: [
            {x: 550, y: 170, width: 20, height: 20, type: 'jump', active: true}
        ],
        keys: [],
        door: null,
        obstacles: [
            {x: 200, y: 260, width: 20, height: 20, type: 'spike'},
            {x: 450, y: 360, width: 20, height: 20, type: 'spike'}
        ]
    }
];

// Game variables
let currentLevel = 0;
let keys = {};
const gravity = 0.5;
const friction = 0.8;
let scrollOffset = 0;
let gameOver = false;

// Touch controls
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');

function handleTouchStart(e) {
    e.preventDefault();
    keys[this.id === 'leftBtn' ? 'ArrowLeft' : this.id === 'rightBtn' ? 'ArrowRight' : ' '] = true;
}

function handleTouchEnd(e) {
    e.preventDefault();
    keys[this.id === 'leftBtn' ? 'ArrowLeft' : this.id === 'rightBtn' ? 'ArrowRight' : ' '] = false;
}

[leftBtn, rightBtn, jumpBtn].forEach(btn => {
    btn.addEventListener('touchstart', handleTouchStart);
    btn.addEventListener('touchend', handleTouchEnd);
    btn.addEventListener('mousedown', handleTouchStart); // For desktop testing
    btn.addEventListener('mouseup', handleTouchEnd);
});

// Prevent default browser behaviors
document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// Collision detection
function collides(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Game loop
function update() {
    if (gameOver) {
        if (keys['r'] || keys['touch']) {
            resetGame();
            keys['touch'] = false;
        }
        return;
    }

    const level = levels[currentLevel];
    const scaleX = canvas.width / 800;
    const scaleY = canvas.height / 400;

    // Player movement
    if (keys['ArrowRight']) {
        player.x += player.speed * scaleX;
        if (player.x > canvas.width / 2) scrollOffset += player.speed * scaleX;
    }
    if (keys['ArrowLeft'] && player.x > 50 * scaleX) {
        player.x -= player.speed * scaleX;
    }
    if (keys[' '] && !player.jumping) {
        player.velY = player.powerUp === 'jump' ? -15 : -12;
        player.jumping = true;
        keys[' '] = false;
    }

    // Physics
    player.velY += gravity;
    player.y += player.velY * scaleY;
    player.velY *= friction;

    // Platform collision
    level.platforms.forEach(platform => {
        const scaledPlatform = {
            x: platform.x * scaleX,
            y: platform.y * scaleY,
            width: platform.width * scaleX,
            height: platform.height * scaleY
        };
        if (collides(player, scaledPlatform) && player.velY > 0) {
            player.y = scaledPlatform.y - player.height;
            player.velY = 0;
            player.jumping = false;
        }
    });

    // Enemy movement and collision
    level.enemies.forEach(enemy => {
        const scaledEnemy = {
            x: enemy.x * scaleX,
            y: enemy.y * scaleY,
            width: enemy.width * scaleX,
            height: enemy.height * scaleY
        };
        if (enemy.type === 'basic') {
            enemy.x -= enemy.speed * scaleX;
            if (enemy.x < -enemy.width) enemy.x = 800 + scrollOffset / scaleX;
        }
        if (collides(player, scaledEnemy)) {
            player.health--;
            player.x = 50 * scaleX;
            player.y = 300 * scaleY;
            scrollOffset = 0;
            if (player.health <= 0) gameOver = true;
        }
    });

    // Power-up collision
    level.powerUps.forEach(powerUp => {
        const scaledPowerUp = {
            x: powerUp.x * scaleX,
            y: powerUp.y * scaleY,
            width: powerUp.width * scaleX,
            height: powerUp.height * scaleY
        };
        if (powerUp.active && collides(player, scaledPowerUp)) {
            powerUp.active = false;
            player.powerUp = powerUp.type;
            if (powerUp.type === 'speed') player.speed = 8;
            setTimeout(() => {
                player.powerUp = null;
                player.speed = 5;
            }, 5000);
        }
    });

    // Key collection
    level.keys.forEach(key => {
        const scaledKey = {
            x: key.x * scaleX,
            y: key.y * scaleY,
            width: key.width * scaleX,
            height: key.height * scaleY
        };
        if (key.active && collides(player, scaledKey)) {
            key.active = false;
            player.keys++;
        }
    });

    // Door interaction
    if (level.door) {
        const scaledDoor = {
            x: level.door.x * scaleX,
            y: level.door.y * scaleY,
            width: level.door.width * scaleX,
            height: level.door.height * scaleY
        };
        if (collides(player, scaledDoor) && player.keys > 0) {
            currentLevel = level.door.nextLevel;
            player.x = 50 * scaleX;
            player.y = 300 * scaleY;
            scrollOffset = 0;
            player.keys--;
        }
    }

    // Obstacle collision
    level.obstacles.forEach(obstacle => {
        const scaledObstacle = {
            x: obstacle.x * scaleX,
            y: obstacle.y * scaleY,
            width: obstacle.width * scaleX,
            height: obstacle.height * scaleY
        };
        if (collides(player, scaledObstacle)) {
            player.health--;
            player.x = 50 * scaleX;
            player.y = 300 * scaleY;
            scrollOffset = 0;
            if (player.health <= 0) gameOver = true;
        }
    });

    // Drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(scaleX, scaleY);

    // Draw level
    level.platforms.forEach(platform => {
        ctx.fillStyle = '#654321';
        ctx.fillRect(platform.x - scrollOffset / scaleX, platform.y, platform.width, platform.height);
    });

    // Draw obstacles
    level.obstacles.forEach(obstacle => {
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(obstacle.x - scrollOffset / scaleX, obstacle.y, obstacle.width, obstacle.height);
    });

    // Draw player
    ctx.fillStyle = player.powerUp ? '#FFD700' : '#FF0000';
    ctx.fillRect(player.x / scaleX, player.y / scaleY, player.width, player.height);

    // Draw enemies
    level.enemies.forEach(enemy => {
        ctx.fillStyle = enemy.type === 'boss' ? '#800080' : '#00FF00';
        ctx.fillRect(enemy.x - scrollOffset / scaleX, enemy.y, enemy.width, enemy.height);
    });

    // Draw power-ups
    level.powerUps.forEach(powerUp => {
        if (powerUp.active) {
            ctx.fillStyle = powerUp.type === 'speed' ? '#0000FF' : '#00FFFF';
            ctx.fillRect(powerUp.x - scrollOffset / scaleX, powerUp.y, powerUp.width, powerUp.height);
        }
    });

    // Draw keys
    level.keys.forEach(key => {
        if (key.active) {
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(key.x - scrollOffset / scaleX, key.y, key.width, key.height);
        }
    });

    // Draw door
    if (level.door) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(level.door.x - scrollOffset / scaleX, level.door.y, level.door.width, level.door.height);
    });

    // Draw HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.fillText(`Health: ${player.health} Keys: ${player.keys}`, 10, 30);

    ctx.restore();

    // Game over
    gameOverText.style.display = gameOver ? 'block' : 'none';
    if (gameOver) {
        document.addEventListener('touchstart', () => keys['touch'] = true, { once: true });
    }

    requestAnimationFrame(update);
}

function resetGame() {
    const scaleX = canvas.width / 800;
    const scaleY = canvas.height / 400;
    player.x = 50 * scaleX;
    player.y = 300 * scaleY;
    player.health = 3;
    player.keys = 0;
    player.powerUp = null;
    player.speed = 5;
    scrollOffset = 0;
    currentLevel = 0;
    levels.forEach(level => {
        level.powerUps.forEach(p => p.active = true);
        level.keys.forEach(k => k.active = true);
    });
    gameOver = false;
}

// Start game
update();

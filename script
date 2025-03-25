const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverText = document.getElementById('gameOver');

// Adjust canvas size
function resizeCanvas() {
    const maxWidth = 800;
    const aspectRatio = 2 / 1;
    canvas.width = Math.min(window.innerWidth, maxWidth);
    canvas.height = canvas.width / aspectRatio;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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

// Levels
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

leftBtn.addEventListener('touchstart', () => keys['ArrowLeft'] = true);
leftBtn.addEventListener('touchend', () => keys['ArrowLeft'] = false);
rightBtn.addEventListener('touchstart', () => keys['ArrowRight'] = true);
rightBtn.addEventListener('touchend', () => keys['ArrowRight'] = false);
jumpBtn.addEventListener('touchstart', () => keys[' '] = true);
jumpBtn.addEventListener('touchend', () => keys[' '] = false);

// Keyboard controls (for desktop)
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Prevent default touch behaviors on canvas
canvas.addEventListener('touchstart', (e) => e.preventDefault());
canvas.addEventListener('touchmove', (e) => e.preventDefault());

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
        if (keys['r'] || (navigator.maxTouchPoints > 0 && keys['touch'])) {
            resetGame();
            keys['touch'] = false;
        }
        return;
    }

    const level = levels[currentLevel];

    // Player movement
    if (keys['ArrowRight']) {
        player.x += player.speed;
        if (player.x > canvas.width / 2) scrollOffset += player.speed;
    }
    if (keys['ArrowLeft'] && player.x > 50) {
        player.x -= player.speed;
    }
    if (keys[' '] && !player.jumping) {
        player.velY = player.powerUp === 'jump' ? -15 : -12;
        player.jumping = true;
        keys[' '] = false; // Prevent continuous jumping on mobile
    }

    // Physics
    player.velY += gravity;
    player.y += player.velY;
    player.velY *= friction;

    // Platform collision
    level.platforms.forEach(platform => {
        if (collides(player, platform) && player.velY > 0) {
            player.y = platform.y - player.height;
            player.velY = 0;
            player.jumping = false;
        }
    });

    // Enemy movement and collision
    level.enemies.forEach(enemy => {
        if (enemy.type === 'basic') {
            enemy.x -= enemy.speed;
            if (enemy.x < -enemy.width) enemy.x = canvas.width + scrollOffset;
        }
        if (collides(player, enemy)) {
            player.health--;
            player.x = 50;
            player.y = 300;
            scrollOffset = 0;
            if (player.health <= 0) gameOver = true;
        }
    });

    // Power-up collision
    level.powerUps.forEach(powerUp => {
        if (powerUp.active && collides(player, powerUp)) {
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
        if (key.active && collides(player, key)) {
            key.active = false;
            player.keys++;
        }
    });

    // Door interaction
    if (level.door && collides(player, level.door) && player.keys > 0) {
        currentLevel = level.door.nextLevel;
        player.x = 50;
        player.y = 300;
        scrollOffset = 0;
        player.keys--;
    }

    // Obstacle collision
    level.obstacles.forEach(obstacle => {
        if (collides(player, obstacle)) {
            player.health--;
            player.x = 50;
            player.y = 300;
            scrollOffset = 0;
            if (player.health <= 0) gameOver = true;
        }
    });

    // Drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scale drawing to canvas size
    const scaleX = canvas.width / 800;
    const scaleY = canvas.height / 400;
    ctx.scale(scaleX, scaleY);

    // Draw level
    level.platforms.forEach(platform => {
        ctx.fillStyle = '#654321';
        ctx.fillRect(platform.x - scrollOffset, platform.y, platform.width, platform.height);
    });

    // Draw obstacles
    level.obstacles.forEach(obstacle => {
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(obstacle.x - scrollOffset, obstacle.y, obstacle.width, obstacle.height);
    });

    // Draw player
    ctx.fillStyle = player.powerUp ? '#FFD700' : '#FF0000';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw enemies
    level.enemies.forEach(enemy => {
        ctx.fillStyle = enemy.type === 'boss' ? '#800080' : '#00FF00';
        ctx.fillRect(enemy.x - scrollOffset, enemy.y, enemy.width, enemy.height);
    });

    // Draw power-ups
    level.powerUps.forEach(powerUp => {
        if (powerUp.active) {
            ctx.fillStyle = powerUp.type === 'speed' ? '#0000FF' : '#00FFFF';
            ctx.fillRect(powerUp.x - scrollOffset, powerUp.y, powerUp.width, powerUp.height);
        }
    });

    // Draw keys
    level.keys.forEach(key => {
        if (key.active) {
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(key.x - scrollOffset, key.y, key.width, key.height);
        }
    });

    // Draw door
    if (level.door) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(level.door.x - scrollOffset, level.door.y, level.door.width, level.door.height);
    }

    // Draw HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.fillText(`Health: ${player.health} Keys: ${player.keys}`, 10, 30);

    // Reset scale
    ctx.scale(1 / scaleX, 1 / scaleY);

    // Game over
    gameOverText.style.display = gameOver ? 'block' : 'none';
    if (gameOver) {
        canvas.addEventListener('touchstart', () => keys['touch'] = true, { once: true });
    }

    requestAnimationFrame(update);
}

function resetGame() {
    player.x = 50;
    player.y = 300;
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

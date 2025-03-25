// Initialize immediately
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverText = document.getElementById('gameOver');

if (!canvas || !ctx) {
    alert("Canvas not supported on this device.");
    throw new Error("Canvas not supported");
}

// Canvas sizing
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

// Game state
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

function setupTouchControls(btn, key) {
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys[key] = true;
    }, { passive: false });
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys[key] = false;
    }, { passive: false });
    // Fallback for desktop testing
    btn.addEventListener('mousedown', () => keys[key] = true);
    btn.addEventListener('mouseup', () => keys[key] = false);
}

setupTouchControls(leftBtn, 'ArrowLeft');
setupTouchControls(rightBtn, 'ArrowRight');
setupTouchControls(jumpBtn, ' ');

// Keyboard controls for PC
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        keys[e.key] = true;
    }
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        keys[e.key] = false;
    }
});

// Prevent default touch behaviors
document.body.addEventListener('touchstart', (e) => {
    if (!e.target.closest('#controls')) e.preventDefault();
}, { passive: false });
document.body.addEventListener('touchmove', (e) => {
    if (!e.target.closest('#controls')) e.preventDefault();
}, { passive: false });

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
        gameOverText.style.display = 'block';
        document.addEventListener('touchstart', () => {
            resetGame();
            gameOverText.style.display = 'none';
        }, { once: true });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r') {
                resetGame();
                gameOverText.style.display = 'none';
            }
        }, { once: true });
        return;
    }

    const level = levels[currentLevel];
    const scaleX = canvas.width / 800;
    const scaleY = canvas.height / 400;

    // Movement
    if (keys['ArrowRight']) {
        player.x += player.speed * scaleX;
        if (player.x > canvas.width / 2) scrollOffset += player.speed * scaleX;
    }
    if (keys['ArrowLeft'] && player.x > 50 * scaleX) {
        player.x -= player.speed * scaleX;
    }
    if (keys[' '] && !player.jumping) {
        player.velY = player.powerUp === 'jump' ? -15 * scaleY : -12 * scaleY;
        player.jumping = true;
        keys[' '] = false;
    }

    // Physics
    player.velY += gravity * scaleY;
    player.y += player.velY;
    player.velY *= friction;

    // Platform collision
    level.platforms.forEach(platform => {
        const scaledPlatform = {
            x: platform.x * scaleX - scrollOffset,
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

    // Enemy logic
    level.enemies.forEach(enemy => {
        const scaledEnemy = {
            x: enemy.x * scaleX - scrollOffset,
            y: enemy.y * scaleY,
            width: enemy.width * scaleX,
            height: enemy.height * scaleY
        };
        if (enemy.type === 'basic') {
            enemy.x -= enemy.speed * scaleX;
            if (enemy.x * scaleX < -enemy.width * scaleX) enemy.x = 800 + scrollOffset / scaleX;
        }
        if (collides(player, scaledEnemy)) {
            player.health--;
            player.x = 50 * scaleX;
            player.y = 300 * scaleY;
            scrollOffset = 0;
            if (player.health <= 0) gameOver = true;
        }
    });

    // Power-ups
    level.powerUps.forEach(powerUp => {
        const scaledPowerUp = {
            x: powerUp.x * scaleX - scrollOffset,
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

    // Keys
    level.keys.forEach(key => {
        const scaledKey = {
            x: key.x * scaleX - scrollOffset,
            y: key.y * scaleY,
            width: key.width * scaleX,
            height: key.height * scaleY
        };
        if (key.active && collides(player, scaledKey)) {
            key.active = false;
            player.keys++;
        }
    });

    // Door
    if (level.door) {
        const scaledDoor = {
            x: level.door.x * scaleX - scrollOffset,
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

    // Obstacles
    level.obstacles.forEach(obstacle => {
        const scaledObstacle = {
            x: obstacle.x * scaleX - scrollOffset,
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

    // Rendering
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Platforms
    level.platforms.forEach(platform => {
        ctx.fillStyle = '#654321';
        ctx.fillRect(platform.x * scaleX - scrollOffset, platform.y * scaleY, platform.width * scaleX, platform.height * scaleY);
    });

    // Obstacles
    level.obstacles.forEach(obstacle => {
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(obstacle.x * scaleX - scrollOffset, obstacle.y * scaleY, obstacle.width * scaleX, obstacle.height * scaleY);
    });

    // Player
    ctx.fillStyle = player.powerUp ? '#FFD700' : '#FF0000';
    ctx.fillRect(player.x, player.y, player.width * scaleX, player.height * scaleY);

    // Enemies
    level.enemies.forEach(enemy => {
        ctx.fillStyle = enemy.type === 'boss' ? '#800080' : '#00FF00';
        ctx.fillRect(enemy.x * scaleX - scrollOffset, enemy.y * scaleY, enemy.width * scaleX, enemy.height * scaleY);
    });

    // Power-ups
    level.powerUps.forEach(powerUp => {
        if (powerUp.active) {
            ctx.fillStyle = powerUp.type === 'speed' ? '#0000FF' : '#00FFFF';
            ctx.fillRect(powerUp.x * scaleX - scrollOffset, powerUp.y * scaleY, powerUp.width * scaleX, powerUp.height * scaleY);
        }
    });

    // Keys
    level.keys.forEach(key => {
        if (key.active) {
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(key.x * scaleX - scrollOffset, key.y * scaleY, key.width * scaleX, key.height * scaleY);
        }
    });

    // Door
    if (level.door) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(level.door.x * scaleX - scrollOffset, level.door.y * scaleY, level.door.width * scaleX, level.door.height * scaleY);
    }

    // HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${20 * scaleY}px Arial`;
    ctx.fillText(`Health: ${player.health} Keys: ${player.keys}`, 10 * scaleX, 30 * scaleY);

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

// Start the game
update();
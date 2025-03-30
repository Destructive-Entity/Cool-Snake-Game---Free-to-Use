/**
 * 🐍 ENHANCED SNAKE GAME 🐍
 * Features: Difficulty, Pause, High Score, Levels, Sound, Themes
 */

// ============================
//  DOM Element References
// ============================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const gameOverElement = document.getElementById('gameOver');
const startScreen = document.getElementById('startScreen');
const pauseScreen = document.getElementById('pauseScreen');
const startButton = document.getElementById('startButton');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const soundToggle = document.getElementById('soundToggle');
const highScoreElement = document.getElementById('highScoreValue');
const highScoresContainer = document.getElementById('highScoresDisplay');
const themeButtons = document.querySelectorAll('.theme-option');

// ============================
// 🔊 Audio Setup
// ============================
const eatSound = new Audio('eat.wav'); // Replace with your sound file path
const gameOverSound = new Audio('gameover.wav'); // Replace with your sound file path
let soundEnabled = true; // Default sound state

// ============================
// 🎨 Theme & Style Setup
// ============================
let currentTheme = 'theme-default'; // Matches initial body class
const themes = {
    'theme-default': {
        bg: '#FFFFFF', grid: '#EEEEEE', food: '#FF0000', foodStroke: '#AA0000',
        snakeHead: '#006400', snakeBody: '#90EE90', snakeStroke: '#003000',
        gameOverFill: 'rgba(0, 0, 0, 0.7)', gameOverText: '#FFFFFF'
    },
    'theme-blue': {
        bg: '#E0F7FA', grid: '#B2EBF2', food: '#FF8A65', foodStroke: '#E64A19',
        snakeHead: '#0277BD', snakeBody: '#4FC3F7', snakeStroke: '#01579B',
        gameOverFill: 'rgba(1, 87, 155, 0.7)', gameOverText: '#E1F5FE'
    },
    'theme-green': {
        bg: '#E8F5E9', grid: '#C8E6C9', food: '#FFB74D', foodStroke: '#F57C00',
        snakeHead: '#2E7D32', snakeBody: '#81C784', snakeStroke: '#1B5E20',
        gameOverFill: 'rgba(27, 94, 32, 0.7)', gameOverText: '#E8F5E9'
    },
     'theme-red': {
        bg: '#FFEBEE', grid: '#FFCDD2', food: '#AED581', foodStroke: '#689F38',
        snakeHead: '#B71C1C', snakeBody: '#EF5350', snakeStroke: '#7f0000',
        gameOverFill: 'rgba(127, 0, 0, 0.7)', gameOverText: '#FFEBEE'
    }
    // Add more theme color objects here matching your CSS/Buttons
};
let colors = themes[currentTheme]; // Active color set

// ============================
// 📏 Game Constants & Variables
// ============================
const gridSize = 20;
const canvasSize = canvas.width;
const tileCount = canvasSize / gridSize;

// Game State
let snake;
let food;
let dx; // Direction x
let dy; // Direction y
let score;
let currentLevel;
let changingDirection;
let gameLoopInterval;
let baseSpeed; // Set by difficulty
let currentSpeed; // Can change with levels
let isGameOver;
let isPaused;
let isGameRunning; // Tracks if the game loop should be active
let highScore;
let foodPulseCounter = 0; // For food animation

// Leveling
const scoreThresholdPerLevel = 50; // Score needed to level up
const speedIncreasePerLevel = 5;   // Milliseconds faster per level (adjust!)
const maxLevel = 10;               // Optional max level

// ============================
// 🚀 Game Initialization & Start
// ============================

function loadHighScore() {
    highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
    highScoreElement.textContent = highScore;
    if (highScore > 0 || localStorage.getItem('snakeHighScore')) {
        highScoresContainer.style.display = 'block'; // Show if score exists
    }
}

function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
         if (highScoresContainer.style.display !== 'block') {
             highScoresContainer.style.display = 'block';
         }
         // Add a subtle animation/highlight maybe
         highScoreElement.style.animation = 'pulse 0.5s ease-in-out';
         setTimeout(() => { highScoreElement.style.animation = ''; }, 500);
    }
}

function setActiveButton(buttons, activeButton) {
     buttons.forEach(btn => btn.classList.remove('active'));
     activeButton.classList.add('active');
}

function selectDifficulty(speed, button) {
    baseSpeed = speed;
    setActiveButton(difficultyButtons, button);
    console.log(`Difficulty set: speed = ${baseSpeed}`);
}

function selectTheme(themeName, button) {
    currentTheme = themeName;
    colors = themes[currentTheme];
    document.body.className = themeName; // Update body class for CSS styling
    setActiveButton(themeButtons, button);
    // If game is running, need to redraw elements with new colors
    if (isGameRunning && !isPaused && !isGameOver) {
        redrawGameElements(); // Redraw immediately if game is active
    } else if (!isGameRunning) {
         clearCanvas(); // Clear canvas to show new background color on start screen
    }
     console.log(`Theme set: ${currentTheme}`);
}

function prepareGame() {
    // Reset core game variables
    snake = [{ x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }]; // Center start
    food = { x: -1, y: -1 }; // Initial invalid position
    dx = 0;
    dy = 0;
    score = 0;
    currentLevel = 1;
    currentSpeed = baseSpeed;
    changingDirection = false;
    isGameOver = false;
    isPaused = false;
    isGameRunning = false; // Game hasn't started the loop yet

    // Update UI
    scoreElement.textContent = score;
    levelElement.textContent = currentLevel;
    gameOverElement.style.display = 'none';
    pauseScreen.classList.remove('active');
    startScreen.classList.add('active'); // Ensure start screen is visible

    loadHighScore();
    generateFood(); // Generate initial food position
    clearCanvas(); // Draw initial empty canvas state based on theme
    drawFood();    // Draw the first food item
    drawSnake();   // Draw the initial snake segment
}

function startGame() {
    if (isGameRunning) return; // Prevent multiple starts

    startScreen.classList.remove('active');
    isGameRunning = true;
    isPaused = false; // Ensure not paused
    currentSpeed = baseSpeed - ((currentLevel - 1) * speedIncreasePerLevel); // Adjust speed for level
    startGameLoop();
    console.log(`Game started! Speed: ${currentSpeed}`);
}

// Initial setup when script loads
function initializeApp() {
    // Set default difficulty (first button)
    selectDifficulty(parseInt(difficultyButtons[0].dataset.speed), difficultyButtons[0]);
    // Set default theme (first button)
    selectTheme(themeButtons[0].dataset.theme, themeButtons[0]);
    // Setup initial game state but don't start loop
    prepareGame();
    updateSoundButton(); // Set initial sound button appearance
}


// ============================
// ⏱️ Game Loop Control
// ============================
function startGameLoop() {
    if (gameLoopInterval) clearInterval(gameLoopInterval); // Clear previous loop
    // Ensure speed is not negative
    const effectiveSpeed = Math.max(25, currentSpeed); // Minimum speed limit
    gameLoopInterval = setInterval(mainGameLoop, effectiveSpeed);
}

function stopGameLoop() {
    clearInterval(gameLoopInterval);
}

function togglePause() {
    if (isGameOver || !isGameRunning) return; // Can't pause if game over or not started

    isPaused = !isPaused;
    if (isPaused) {
        stopGameLoop();
        pauseScreen.classList.add('active');
        console.log("Game Paused");
    } else {
        startGameLoop(); // Resumes with currentSpeed
        pauseScreen.classList.remove('active');
        console.log("Game Resumed");
    }
}

function mainGameLoop() {
    if (isPaused || isGameOver) return; // Should not run if paused or game over

    changingDirection = false; // Reset direction lock for next input

    // Logic updates
    moveSnake();
    const collisionDetected = checkCollision(); // Check collision *after* moving

    if (collisionDetected) {
        triggerGameOver();
        return; // Stop loop execution for this frame
    }

    // Drawing updates
    redrawGameElements();
}

// Separate drawing updates allows calling it when theme changes etc.
function redrawGameElements() {
    clearCanvas();
    drawFood();
    drawSnake();
}


// ============================
// 🎨 Rendering Functions
// ============================
function clearCanvas() {
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Optional Grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < tileCount; i++) {
        for (let j = 0; j < tileCount; j++) {
            ctx.strokeRect(i * gridSize, j * gridSize, gridSize, gridSize);
        }
    }
}

// Helper for rounded rectangles
function drawRoundedRect(x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

function drawSnakePart(part, index) {
    const x = part.x * gridSize;
    const y = part.y * gridSize;
    const radius = gridSize * 0.25; // Adjust for desired roundness

    ctx.fillStyle = index === 0 ? colors.snakeHead : colors.snakeBody;
    ctx.strokeStyle = colors.snakeStroke;
    ctx.lineWidth = 1;

    // Draw rounded segment
    drawRoundedRect(x + 1, y + 1, gridSize - 2, gridSize - 2, radius, true, true);

    // Add eyes to head (simple example)
    if (index === 0) {
        ctx.fillStyle = 'white';
        const eyeSize = gridSize * 0.15;
        let eyeX1, eyeY1, eyeX2, eyeY2;

        // Basic eye positioning based on direction (can be improved)
        if (dx === 1) { // Right
             eyeX1 = x + gridSize * 0.6; eyeY1 = y + gridSize * 0.25;
             eyeX2 = x + gridSize * 0.6; eyeY2 = y + gridSize * 0.75 - eyeSize;
        } else if (dx === -1) { // Left
             eyeX1 = x + gridSize * 0.4 - eyeSize; eyeY1 = y + gridSize * 0.25;
             eyeX2 = x + gridSize * 0.4 - eyeSize; eyeY2 = y + gridSize * 0.75 - eyeSize;
        } else if (dy === 1) { // Down
             eyeX1 = x + gridSize * 0.25; eyeY1 = y + gridSize * 0.6;
             eyeX2 = x + gridSize * 0.75 - eyeSize; eyeY2 = y + gridSize * 0.6;
        } else { // Up or stationary
             eyeX1 = x + gridSize * 0.25; eyeY1 = y + gridSize * 0.4 - eyeSize;
             eyeX2 = x + gridSize * 0.75 - eyeSize; eyeY2 = y + gridSize * 0.4 - eyeSize;
        }
         ctx.beginPath();
         ctx.arc(eyeX1 + eyeSize/2, eyeY1 + eyeSize/2, eyeSize / 1.5, 0, Math.PI * 2);
         ctx.arc(eyeX2 + eyeSize/2, eyeY2 + eyeSize/2, eyeSize / 1.5, 0, Math.PI * 2);
         ctx.fill();
    }
}


function drawSnake() {
    // Draw tail first so head overlaps
    for (let i = snake.length - 1; i >= 0; i--) {
        drawSnakePart(snake[i], i);
    }
}

function drawFood() {
    const x = food.x * gridSize;
    const y = food.y * gridSize;
    const baseSize = gridSize;
    const pulseAmount = Math.sin(foodPulseCounter * 0.2) * 2; // Simple pulse effect
    const currentSize = baseSize - 2 + pulseAmount; // Slightly smaller + pulse
    const offset = (baseSize - currentSize) / 2;

    ctx.fillStyle = colors.food;
    ctx.strokeStyle = colors.foodStroke;
    ctx.lineWidth = 1;

    // Draw rounded food
    drawRoundedRect(x + offset, y + offset, currentSize, currentSize, currentSize * 0.3, true, true);

    foodPulseCounter += 1; // Increment for animation
}

// ============================
// 🧠 Game Logic
// ============================
function moveSnake() {
    const head = {
        x: (snake[0].x + dx + tileCount) % tileCount, // Wrap around horizontally
        y: (snake[0].y + dy + tileCount) % tileCount  // Wrap around vertically
    };
    snake.unshift(head); // Add new head

    // Check for food collision
    if (head.x === food.x && head.y === food.y) {
        // Grow snake, increase score, generate new food, potentially level up
        score += 10;
        scoreElement.textContent = score;
        playSound(eatSound);
        generateFood();
        checkLevelUp();
    } else {
        // Didn't eat, remove tail
        snake.pop();
    }
}

function generateFood() {
     let newFoodX, newFoodY;
    let validPosition = false;
    while (!validPosition) {
        newFoodX = Math.floor(Math.random() * tileCount);
        newFoodY = Math.floor(Math.random() * tileCount);

        // Check collision with *entire* snake
        validPosition = true; // Assume valid initially
        for (const part of snake) {
            if (part.x === newFoodX && part.y === newFoodY) {
                validPosition = false; // Collision detected
                break;
            }
        }
    }
    food = { x: newFoodX, y: newFoodY };
    foodPulseCounter = 0; // Reset pulse animation
}

function checkCollision() {
    const head = snake[0];

    // Self collision (check from neck onwards)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true; // Collision detected
        }
    }
    // Wall collision removed due to wrap-around logic in moveSnake

    return false; // No collision
}

function checkLevelUp() {
    const nextLevel = Math.floor(score / scoreThresholdPerLevel) + 1;
    if (nextLevel > currentLevel && currentLevel < maxLevel) {
        currentLevel = nextLevel;
        levelElement.textContent = currentLevel;
        // Adjust speed: ensure it doesn't go below a minimum
        currentSpeed = Math.max(30, baseSpeed - ((currentLevel - 1) * speedIncreasePerLevel));
        startGameLoop(); // Restart loop with new speed
        console.log(`Level Up! Level: ${currentLevel}, Speed: ${currentSpeed}`);
        // Optional: Add visual/audio feedback for level up
    }
}

function triggerGameOver() {
    isGameOver = true;
    isGameRunning = false; // Stop the game state
    stopGameLoop();
    playSound(gameOverSound);
    saveHighScore(); // Save score before displaying message

    // Update and display game over message
    gameOverElement.innerHTML = `Game Over! Final Score: ${score}<br><small>Press 'R' to Restart</small>`; // Use innerHTML for line break
    gameOverElement.style.display = 'block';
    gameOverElement.style.animation = 'bounce 0.6s ease-out'; // Trigger animation
     // Remove animation after it finishes to allow re-triggering
     setTimeout(() => { gameOverElement.style.animation = ''; }, 600);

    console.log("Game Over! Final Score: ", score);

    // Optional: Draw overlay on canvas too
    ctx.fillStyle = colors.gameOverFill;
    ctx.fillRect(0, 0, canvasSize, canvasSize); // Full overlay

    ctx.font = '40px Poppins, sans-serif'; // Use Poppins
    ctx.fillStyle = colors.gameOverText;
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvasSize / 2, canvasSize / 2 - 30);

    ctx.font = '25px Poppins, sans-serif';
    ctx.fillText(`Score: ${score}`, canvasSize / 2, canvasSize / 2 + 20);

     ctx.font = '18px Poppins, sans-serif';
     ctx.fillText("Press 'R' to Play Again", canvasSize / 2, canvasSize / 2 + 60);
}

// ============================
// 🎮 Input Handling
// ============================
function handleKeyDown(event) {
    // Restart game (only when game is over)
    if (isGameOver && event.key.toUpperCase() === 'R') {
        console.log("Restarting game...");
        prepareGame(); // Reset variables and UI for a new game
        // Don't call startGame() here, let the user click Start again
        return;
    }

     // Pause toggle (only when game is running and not over)
     if (!isGameOver && isGameRunning && event.key.toUpperCase() === 'P') {
         togglePause();
         return;
     }

    // Ignore movement input if game not running, paused, over, or already changing direction
    if (!isGameRunning || isPaused || isGameOver || changingDirection) return;

    const keyPressed = event.key;

    // Current direction flags (local scope)
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingLeft = dx === -1;
    const goingRight = dx === 1;

    // Change direction (prevent 180° turns)
    let directionChanged = false;
    if ((keyPressed === 'ArrowUp' || keyPressed.toLowerCase() === 'w') && !goingDown) {
        dx = 0; dy = -1; directionChanged = true;
    } else if ((keyPressed === 'ArrowDown' || keyPressed.toLowerCase() === 's') && !goingUp) {
        dx = 0; dy = 1; directionChanged = true;
    } else if ((keyPressed === 'ArrowLeft' || keyPressed.toLowerCase() === 'a') && !goingRight) {
        dx = -1; dy = 0; directionChanged = true;
    } else if ((keyPressed === 'ArrowRight' || keyPressed.toLowerCase() === 'd') && !goingLeft) {
        dx = 1; dy = 0; directionChanged = true;
    }

    if (directionChanged) {
         changingDirection = true; // Lock direction change until next frame
    }
}

// ============================
// 🔊 Sound Control
// ============================
function playSound(sound) {
    if (soundEnabled && sound) {
        sound.currentTime = 0; // Rewind to start
        sound.play().catch(error => console.error("Sound play failed:", error)); // Play and catch errors
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    updateSoundButton();
    console.log("Sound enabled:", soundEnabled);
}

function updateSoundButton() {
     soundToggle.textContent = soundEnabled ? '🔊' : '🔇'; // Update icon
     soundToggle.classList.toggle('muted', !soundEnabled); // Add/remove muted class for CSS styling (like the strike-through)
}


// ============================
// 🏁 Event Listeners & Startup
// ============================
document.addEventListener('keydown', handleKeyDown);

// Start button listener
startButton.addEventListener('click', startGame);

// Difficulty button listeners
difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
        selectDifficulty(parseInt(button.dataset.speed), button);
    });
});

// Sound toggle listener
soundToggle.addEventListener('click', toggleSound);

// Theme button listeners
themeButtons.forEach(button => {
    button.addEventListener('click', () => {
         selectTheme(button.dataset.theme, button);
    });
});

// Initialize the application state and prepare the start screen
initializeApp();
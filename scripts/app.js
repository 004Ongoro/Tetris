// Game board dimensions
const ROWS = 20;
const COLS = 10;

// Tetromino shapes with associated colors
const SHAPES = [
  { shape: [[1, 1], [1, 1]], color: 'square' }, // Square (cyan)
  { shape: [[0, 1, 0], [1, 1, 1]], color: 't-shape' }, // T-shape (orange)
  { shape: [[1, 1, 0], [0, 1, 1]], color: 'z-shape' }, // Z-shape (red)
  { shape: [[0, 1, 1], [1, 1, 0]], color: 's-shape' }, // S-shape (lime)
  { shape: [[1, 1, 1, 1]], color: 'line' }, // Line (blue)
  { shape: [[1, 0, 0], [1, 1, 1]], color: 'l-shape' }, // L-shape (yellow)
  { shape: [[0, 0, 1], [1, 1, 1]], color: 'j-shape' } // J-shape (magenta)
];

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let currentShape = {};
let currentPos = { x: 0, y: 0 };
let score = 0;
let highScore = localStorage.getItem('tetrisHighScore') || 0;
let gameInterval = null;
let isPaused = false;
let difficulty = 'easy'; // Default difficulty
let heldShape = null;
let nextShape = getRandomShape();

// DOM elements
const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const nextPiecePreview = document.getElementById('next-piece-preview');
const hiddenUI = document.getElementById('hidden-ui');
const toggleUIButton = document.getElementById('toggle-ui-btn');

const difficultySelector = document.getElementById('difficulty');

// Initialize difficulty
difficulty = difficultySelector.value;

// Handle difficulty change
difficultySelector.addEventListener('change', (e) => {
  difficulty = e.target.value;
  if (gameInterval) {
    clearInterval(gameInterval);
    startGame();
  }
});

// Initialize game board
function createBoard() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      gameBoard.appendChild(cell);
    }
  }
}

// Draw the board and the current shape
function drawBoard() {
  gameBoard.innerHTML = '';

  // Draw the static board (already placed blocks)
  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const div = document.createElement('div');
      div.classList.add('cell');
      if (cell) div.classList.add(cell); // Add the color class
      gameBoard.appendChild(div);
    });
  });

  // Draw the current shape (falling block with glow)
  currentShape.shape.forEach((row, rowIndex) => {
    row.forEach((val, colIndex) => {
      if (val && currentPos.y + rowIndex >= 0) {
        const cellIndex = (currentPos.y + rowIndex) * COLS + (currentPos.x + colIndex);
        if (cellIndex >= 0 && cellIndex < ROWS * COLS) {
          const cell = gameBoard.children[cellIndex];
          if (cell) {
            cell.classList.add(currentShape.color, 'falling-block'); // Apply color and glow
          }
        }
      }
    });
  });
}

// Add a new shape to the board
function addShapeToBoard(shape, pos, color) {
  shape.forEach((row, rowIndex) => {
    row.forEach((val, colIndex) => {
      if (val && pos.y + rowIndex >= 0) {
        board[pos.y + rowIndex][pos.x + colIndex] = color;
      }
    });
  });
}

// Check for collisions
function checkCollision(shape, pos) {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (
        shape[row][col] &&
        (board[pos.y + row]?.[pos.x + col] || pos.x + col < 0 || pos.x + col >= COLS || pos.y + row >= ROWS)
      ) {
        return true;
      }
    }
  }
  return false;
}

// Rotate the shape
function rotateShape(shape) {
  const rotated = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
  return rotated;
}

// Clear completed rows
function clearRows() {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row].every(cell => cell)) {
      board.splice(row, 1);
      board.unshift(Array(COLS).fill(0));
      score += 10;
      updateHighScore();
    }
  }
}

// Update high score
function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('tetrisHighScore', highScore);
  }
  highScoreDisplay.textContent = highScore;
}

// DOM elements
const gameOverModal = document.getElementById('game-over-modal');
const playAgainButton = document.getElementById('play-again-btn');
const finalScoreDisplay = document.getElementById('final-score');

// Show Game Over Modal
function showGameOverModal() {
  clearInterval(gameInterval); // Stop the game loop
  finalScoreDisplay.textContent = score; // Display the final score
  gameOverModal.classList.remove('hidden'); // Show the modal
}

// Play Again Button
playAgainButton.addEventListener('click', () => {
  gameOverModal.classList.add('hidden'); // Hide the modal
  startGame(); // Restart the game
});

// Update the game loop to show the modal when the game ends
function gameLoop() {
  if (!isPaused) {
    if (!checkCollision(currentShape.shape, { ...currentPos, y: currentPos.y + 1 })) {
      currentPos.y++;
    } else {
      addShapeToBoard(currentShape.shape, currentPos, currentShape.color);
      clearRows();
      currentShape = nextShape;
      nextShape = getRandomShape();
      drawNextPiecePreview();
      currentPos = { x: Math.floor(COLS / 2) - 1, y: 0 };
      if (checkCollision(currentShape.shape, currentPos)) {
        showGameOverModal(); // Show the modal when the game is over
        return;
      }
    }
    drawBoard();
    scoreDisplay.textContent = score;
  }
}

// Generate a random shape
function getRandomShape() {
  return SHAPES[Math.floor(Math.random() * SHAPES.length)];
}

// Start the game
function startGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0)); // Reset board
  score = 0;
  scoreDisplay.textContent = score;
  currentShape = getRandomShape();
  nextShape = getRandomShape();
  drawNextPiecePreview();
  currentPos = { x: Math.floor(COLS / 2) - 1, y: 0 };
  isPaused = false;
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, getDifficultySpeed());
  drawBoard();
}

// Get difficulty speed
function getDifficultySpeed() {
  switch (difficulty) {
    case 'easy':
      return 500;
    case 'medium':
      return 300;
    case 'hard':
      return 100;
    default:
      return 500;
  }
}

// Hold Feature
function holdShape() {
  if (!heldShape) {
    heldShape = currentShape;
    currentShape = nextShape;
    nextShape = getRandomShape();
    drawNextPiecePreview();
    currentPos = { x: Math.floor(COLS / 2) - 1, y: 0 };
  } else {
    [heldShape, currentShape] = [currentShape, heldShape];
    currentPos = { x: Math.floor(COLS / 2) - 1, y: 0 };
  }
}

// Draw Next Piece Preview
function drawNextPiecePreview() {
  nextPiecePreview.innerHTML = '';
  nextShape.shape.forEach((row) => {
    row.forEach((val) => {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      if (val) cell.classList.add(nextShape.color);
      nextPiecePreview.appendChild(cell);
    });
  });
}

// Toggle Hidden UI
toggleUIButton.addEventListener('click', () => {
  hiddenUI.classList.toggle('hidden'); // Toggle the 'hidden' class
  toggleUIButton.textContent = hiddenUI.classList.contains('hidden') 
    ? 'Show Controls' // If hidden, show "Show Controls"
    : 'Hide Controls'; // Otherwise, show "Hide Controls"
});

// Add event listeners for mobile controls
document.getElementById('left-btn').addEventListener('click', () => {
  if (!isPaused && !checkCollision(currentShape.shape, { ...currentPos, x: currentPos.x - 1 })) {
    currentPos.x--;
  }
});

document.getElementById('right-btn').addEventListener('click', () => {
  if (!isPaused && !checkCollision(currentShape.shape, { ...currentPos, x: currentPos.x + 1 })) {
    currentPos.x++;
  }
});

document.getElementById('down-btn').addEventListener('click', () => {
  if (!isPaused && !checkCollision(currentShape.shape, { ...currentPos, y: currentPos.y + 1 })) {
    currentPos.y++;
  }
});

document.getElementById('rotate-btn').addEventListener('click', () => {
  if (!isPaused) {
    const rotated = rotateShape(currentShape.shape);
    if (!checkCollision(rotated, currentPos)) {
      currentShape.shape = rotated;
    }
  }
});

document.getElementById('hold-btn').addEventListener('click', () => {
  if (!isPaused) {
    holdShape();
  }
});

// Start Over Button
document.getElementById('start-over-btn').addEventListener('click', () => {
  startGame();
});

// Pause Button
document.getElementById('pause-btn').addEventListener('click', () => {
  isPaused = !isPaused;
  if (isPaused) {
    document.getElementById('pause-btn').textContent = 'Resume';
  } else {
    document.getElementById('pause-btn').textContent = 'Pause';
  }
});

// Start the game
startGame();
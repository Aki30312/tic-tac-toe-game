// -------------------- DOM --------------------
const boardEl = document.getElementById("board");
const cells = Array.from(document.querySelectorAll(".cell"));

const singleBtn = document.getElementById("singlePlayerBtn");
const twoBtn = document.getElementById("twoPlayerBtn");
const startBtn = document.getElementById("startBtn");

const p1NameInput = document.getElementById("p1Name");
const p2NameInput = document.getElementById("p2Name");
const p2Field = document.getElementById("p2Field");

const labelX = document.getElementById("labelX");
const labelO = document.getElementById("labelO");
const scoreXEl = document.getElementById("scoreX");
const scoreOEl = document.getElementById("scoreO");

const turnBadge = document.getElementById("turnBadge");
const hintEl = document.getElementById("hint");

const restartBtn = document.getElementById("restartBtn");
const resetBtn = document.getElementById("resetBtn");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const playAgainBtn = document.getElementById("playAgainBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

const winLine = document.getElementById("winLine");

// Confetti
const confettiCanvas = document.getElementById("confetti");
const ctx = confettiCanvas.getContext("2d");

// -------------------- STATE --------------------
let gameMode = null;            // "single" | "two"
let board = Array(9).fill("");  // "", "X", "O"
let currentPlayer = "X";
let locked = true;              // prevents play before start or during AI move
let gameOver = false;

let names = { X: "Player 1", O: "Player 2" };
let scores = { X: 0, O: 0 };

// Win combos
const WINS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// Smart priority for AI (center, corners, sides)
const AI_PRIORITY = [4, 0, 2, 6, 8, 1, 3, 5, 7];

// -------------------- SOLID FUNCTIONS --------------------

// UI: mode button styles
function setModeButtons() {
  singleBtn.classList.toggle("btn-primary", gameMode === "single");
  twoBtn.classList.toggle("btn-primary", gameMode === "two");
}

// UI: show/hide player2 input depending on mode
function syncNameFieldsWithMode() {
  if (gameMode === "single") {
    p2Field.style.display = "none";
    p2NameInput.value = "Computer";
  } else {
    p2Field.style.display = "block";
    if (p2NameInput.value.trim() === "Computer") p2NameInput.value = "";
  }
}

// UI: labels + scoreboard
function updateLabelsAndScores() {
  labelX.textContent = `${names.X} (X)`;
  labelO.textContent = `${names.O} (O)`;
  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
}

// UI: badge text
function setTurnText(text, tone = "neutral") {
  turnBadge.textContent = text;
  // tone hint (simple)
  turnBadge.style.boxShadow = "none";
  if (tone === "good") turnBadge.style.boxShadow = "0 0 0 4px rgba(34,197,94,0.14)";
  if (tone === "bad") turnBadge.style.boxShadow = "0 0 0 4px rgba(239,68,68,0.14)";
  if (tone === "warn") turnBadge.style.boxShadow = "0 0 0 4px rgba(250,204,21,0.14)";
  if (tone === "info") turnBadge.style.boxShadow = "0 0 0 4px rgba(56,189,248,0.14)";
}

// Game: read names safely
function readNames() {
  const n1 = p1NameInput.value.trim();
  const n2 = p2NameInput.value.trim();

  names.X = n1 ? n1 : "Player 1";
  if (gameMode === "single") names.O = "Computer";
  else names.O = n2 ? n2 : "Player 2";
}

// Game: start a new round (board only)
function startRound() {
  board = Array(9).fill("");
  currentPlayer = "X";
  locked = false;
  gameOver = false;
  hideModal();
  stopConfetti();
  clearWinLine();
  renderBoard();
  setTurnText(`${names[currentPlayer]}'s turn (${currentPlayer})`, "info");
}

// Game: hard reset (scores + board)
function resetAll() {
  scores = { X: 0, O: 0 };
  updateLabelsAndScores();
  startRound();
}

// UI: render board from state
function renderBoard() {
  cells.forEach((cell, i) => {
    cell.textContent = board[i];
    cell.classList.toggle("filled", board[i] !== "");
    cell.classList.remove("win", "invalid");
  });
}

// Game: place a mark if possible
function placeMark(index, mark) {
  if (board[index] !== "" || gameOver) return false;
  board[index] = mark;

  const cell = cells[index];
  cell.textContent = mark;
  cell.classList.add("filled", "pop");
  setTimeout(() => cell.classList.remove("pop"), 180);

  return true;
}

// Game: check winner
function getWinnerInfo() {
  for (const line of WINS) {
    const [a,b,c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return { winner: null, line: null };
}

// Game: draw check
function isDraw() {
  return board.every(v => v !== "");
}

// Game: switch turn
function switchTurn() {
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  setTurnText(`${names[currentPlayer]}'s turn (${currentPlayer})`, "info");
}

// UI: show win line + highlight winning cells
function showWin(line) {
  line.forEach(i => cells[i].classList.add("win"));
  drawWinLine(line);
}

// UI: win line orientation
function drawWinLine(line) {
  // base is horizontal across center; rotate/translate based on line
  winLine.classList.remove("hidden");

  // Map line to transform
  const key = line.join("");
  const map = {
    "012": { r: 0,   x: 0,   y: -33.33 },
    "345": { r: 0,   x: 0,   y: 0 },
    "678": { r: 0,   x: 0,   y: 33.33 },

    "036": { r: 90,  x: -33.33, y: 0 },
    "147": { r: 90,  x: 0,      y: 0 },
    "258": { r: 90,  x: 33.33,  y: 0 },

    "048": { r: 45,  x: 0,   y: 0 },
    "246": { r: -45, x: 0,   y: 0 },
  };

  const cfg = map[key] || { r: 0, x: 0, y: 0 };
  // Use percentage translate in container coordinates
  winLine.style.transform = `translate(${cfg.x}%, ${cfg.y}%) rotate(${cfg.r}deg)`;
}

// UI: clear win line
function clearWinLine() {
  winLine.classList.add("hidden");
  winLine.style.transform = "";
}

// Modal
function showModal(title, text) {
  modalTitle.textContent = title;
  modalText.textContent = text;
  modal.classList.remove("hidden");
}

function hideModal() {
  modal.classList.add("hidden");
}

// Feedback for invalid click
function flashInvalid(cellIndex) {
  const cell = cells[cellIndex];
  cell.classList.add("invalid");
  setTimeout(() => cell.classList.remove("invalid"), 300);
}

// Round end handler
function endRound(winner, line) {
  gameOver = true;
  locked = true;

  if (winner) {
    scores[winner] += 1;
    updateLabelsAndScores();
    showWin(line);

    const title = winner === "X" ? `🏆 ${names.X} Wins!` : `🏆 ${names.O} Wins!`;
    showModal(title, `${names.X}: ${scores.X}  •  ${names.O}: ${scores.O}`);
    setTurnText(title, "good");

    // Confetti for a human win or any win (your choice). Here: always.
    startConfetti();
  } else {
    showModal("🟰 Draw!", `No winner this round.\n${names.X}: ${scores.X}  •  ${names.O}: ${scores.O}`);
    setTurnText("Draw!", "warn");
  }
}

// Main: evaluate after a move
function evaluateGameAfterMove() {
  const { winner, line } = getWinnerInfo();
  if (winner) return endRound(winner, line);
  if (isDraw()) return endRound(null, null);

  switchTurn();

  // If single player and it's computer turn (O), trigger AI
  if (gameMode === "single" && currentPlayer === "O") {
    locked = true;
    setTurnText("Computer thinking…", "info");
    setTimeout(() => {
      makeComputerMove();
      locked = false;
      if (!gameOver) setTurnText(`${names[currentPlayer]}'s turn (${currentPlayer})`, "info");
    }, 450);
  }
}

// AI: find a winning move for mark
function findWinningMove(forMark) {
  for (let i = 0; i < 9; i++) {
    if (board[i] !== "") continue;
    const copy = board.slice();
    copy[i] = forMark;
    if (doesBoardWin(copy, forMark)) return i;
  }
  return null;
}

// AI helper: win check on custom board
function doesBoardWin(customBoard, mark) {
  return WINS.some(([a,b,c]) =>
    customBoard[a] === mark && customBoard[b] === mark && customBoard[c] === mark
  );
}

// AI: choose best move (win > block > priority)
function getBestAIMove() {
  // 1) try win
  const winMove = findWinningMove("O");
  if (winMove !== null) return winMove;

  // 2) try block X
  const blockMove = findWinningMove("X");
  if (blockMove !== null) return blockMove;

  // 3) priority
  for (const i of AI_PRIORITY) {
    if (board[i] === "") return i;
  }
  return null;
}

// AI: place move
function makeComputerMove() {
  if (gameOver) return;
  const move = getBestAIMove();
  if (move === null) return;

  placeMark(move, "O");
  // small AI flash
  cells[move].classList.add("win");
  setTimeout(() => cells[move].classList.remove("win"), 220);

  evaluateGameAfterMove();
}

// -------------------- EVENTS --------------------
singleBtn.addEventListener("click", () => {
  gameMode = "single";
  setModeButtons();
  syncNameFieldsWithMode();
  hintEl.textContent = "Single Player: AI tries to win or block, then center/corners/sides.";
  setTurnText("Single Player selected — Enter name and Start", "info");
});

twoBtn.addEventListener("click", () => {
  gameMode = "two";
  setModeButtons();
  syncNameFieldsWithMode();
  hintEl.textContent = "Two Player: Take turns placing X and O.";
  setTurnText("Two Player selected — Enter names and Start", "info");
});

startBtn.addEventListener("click", () => {
  if (!gameMode) {
    setTurnText("Please choose a mode first", "warn");
    return;
  }
  readNames();
  updateLabelsAndScores();
  locked = false;
  startRound();
});

boardEl.addEventListener("click", (e) => {
  const cell = e.target.closest(".cell");
  if (!cell) return;

  const index = Number(cell.dataset.i);

  if (locked || gameOver) return;

  // In single player: human is X only
  if (gameMode === "single" && currentPlayer !== "X") return;

  const ok = placeMark(index, currentPlayer);
  if (!ok) return flashInvalid(index);

  evaluateGameAfterMove();
});

restartBtn.addEventListener("click", () => {
  if (!gameMode) {
    setTurnText("Choose a mode first", "warn");
    return;
  }
  startRound();
});

resetBtn.addEventListener("click", () => {
  if (!gameMode) {
    setTurnText("Choose a mode first", "warn");
    return;
  }
  resetAll();
});

playAgainBtn.addEventListener("click", () => startRound());
closeModalBtn.addEventListener("click", () => hideModal());

// Start locked until mode + start
setTurnText("Choose Single Player or Two Player to begin", "info");
syncNameFieldsWithMode();
setModeButtons();
updateLabelsAndScores();

// -------------------- CONFETTI (simple + clean) --------------------
let confettiPieces = [];
let confettiId = null;

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeConfetti);

function createPiece() {
  return {
    x: Math.random() * confettiCanvas.width,
    y: -20 - Math.random() * 200,
    w: 6 + Math.random() * 6,
    h: 10 + Math.random() * 10,
    vx: -2 + Math.random() * 4,
    vy: 2 + Math.random() * 5,
    r: Math.random() * Math.PI,
    vr: -0.12 + Math.random() * 0.24
  };
}

function startConfetti() {
  resizeConfetti();
  confettiPieces = Array.from({ length: 160 }, createPiece);
  if (confettiId) cancelAnimationFrame(confettiId);
  animateConfetti();
  // stop after ~2.5s for polish
  setTimeout(() => stopConfetti(), 2500);
}

function stopConfetti() {
  if (confettiId) cancelAnimationFrame(confettiId);
  confettiId = null;
  confettiPieces = [];
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

function animateConfetti() {
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  const palette = ["#22c55e", "#38bdf8", "#facc15", "#ef4444", "#a21caf"];

  for (const p of confettiPieces) {
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.vr;

    if (p.y > confettiCanvas.height + 30) {
      p.y = -20;
      p.x = Math.random() * confettiCanvas.width;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r);
    ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)];
    ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
    ctx.restore();
  }

  confettiId = requestAnimationFrame(animateConfetti);
}

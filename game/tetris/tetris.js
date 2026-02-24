const canvas = document.getElementById("tetrisCanvas");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("nextCanvas");
const nextCtx = nextCanvas ? nextCanvas.getContext("2d") : null;

// Constantes principales du jeu
const ROWS = 20; // Nombre de lignes de la grille
const COLS = 10; // Nombre de colonnes de la grille
const BLOCK_SIZE = 30; // Taille d'un bloc sur le plateau (en pixels)
const PREVIEW_BLOCK_SIZE = 20; // Taille d'un bloc dans la fenêtre "prochain tetromino"

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

// Définition des pièces de Tetris (Tetrominos)
const TETROMINOS = {
    I: { color: 'cyan', shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]] },
    J: { color: 'blue', shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]] },
    L: { color: 'orange', shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]] },
    O: { color: 'yellow', shape: [[1, 1], [1, 1]] },
    S: { color: 'green', shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]] },
    T: { color: 'purple', shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]] },
    Z: { color: 'red', shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]] }
}

// Variables d'état du jeu
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let currentTetromino = null;
let nextTetromino = null;
let currentPos = { x: 3, y: 0 };
let score = 0;
let level = 1;
let gameOver = false;
let gameStarted = false;
let bestScore = parseInt(localStorage.getItem("tetris_bestScore") || "0", 10);

// Variables pour contrôler le drag à la souris / au toucher
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragMoved = false;
let dragAnchorX = 0; // Décalage X du bloc cliqué à l'intérieur de la pièce
let dragSpeedMultiplier = 1; // Facteur de vitesse quand on tire la pièce vers le bas

document.getElementById("beastscore").textContent = `Beast Score: ${bestScore}`;

// Variables de timing (utilisées dans la boucle animée requestAnimationFrame)
let dropCounter = 0;
let dropInterval = 800; // Parçanın aşağı düşme hızı (ms)
let lastTime = 0;

// Crée une nouvelle pièce aléatoire
function getRandomTetromino() {
    const keys = Object.keys(TETROMINOS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const piece = TETROMINOS[randomKey];
    return {
        color: piece.color,
        shape: piece.shape.map(row => [...row])
    };
}

// Dessine un bloc (avec effets de lumière / ombre)
function drawBlock(x, y, color) {
    const padding = 2;
    const size = BLOCK_SIZE - padding * 2;
    const rx = x * BLOCK_SIZE + padding;
    const ry = y * BLOCK_SIZE + padding;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(rx, ry, size, size, 4);
    ctx.fill();

    // Effet de lumière (haut / gauche)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(rx, ry, size, size * 0.2);
    ctx.fillRect(rx, ry, size * 0.2, size);

    // Effet d'ombre (bas / droite)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(rx, ry + size * 0.8, size, size * 0.2);
    ctx.fillRect(rx + size * 0.8, ry, size * 0.2, size);

    // Bordure légère autour du bloc
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(rx, ry, size, size);
}

// Dessine tous les blocs déjà posés sur le plateau
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawBlock(x, y, board[y][x]);
            }
        }
    }
}

// Dessine le prochain tetromino dans le petit canvas de prévisualisation
function drawNextTetromino() {
    if (!nextCtx || !nextTetromino) return;

    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

    const shape = nextTetromino.shape;
    const color = nextTetromino.color;

    const rows = shape.length;
    const cols = shape[0].length;

    // Ajuster dynamiquement la taille pour que la forme tienne au maximum dans la fenêtre
    const padding = 10;
    const availableWidth = nextCanvas.width - padding * 2;
    const availableHeight = nextCanvas.height - padding * 2;

    // Calculer la vraie zone occupée par la pièce (bounding box des cellules = 1)
    let minRow = rows, maxRow = -1, minCol = cols, maxCol = -1;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (shape[y][x]) {
                if (y < minRow) minRow = y;
                if (y > maxRow) maxRow = y;
                if (x < minCol) minCol = x;
                if (x > maxCol) maxCol = x;
            }
        }
    }

    const shapeCols = maxCol - minCol + 1;
    const shapeRows = maxRow - minRow + 1;

    const blockSize = Math.min(
        availableWidth / shapeCols,
        availableHeight / shapeRows
    );

    const shapeWidth = shapeCols * blockSize;
    const shapeHeight = shapeRows * blockSize;

    const offsetX = (nextCanvas.width - shapeWidth) / 2 - minCol * blockSize;
    const offsetY = (nextCanvas.height - shapeHeight) / 2 - minRow * blockSize;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (shape[y][x]) {
                const rx = offsetX + x * blockSize + 2;
                const ry = offsetY + y * blockSize + 2;
                const size = blockSize - 4;

                nextCtx.fillStyle = color;
                nextCtx.beginPath();
                nextCtx.roundRect(rx, ry, size, size, 4);
                nextCtx.fill();

                // Effet de lumière / ombre simplifié
                nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                nextCtx.fillRect(rx, ry, size, size * 0.2);
                nextCtx.fillRect(rx, ry, size * 0.2, size);

                nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                nextCtx.fillRect(rx, ry + size * 0.8, size, size * 0.2);
                nextCtx.fillRect(rx + size * 0.8, ry, size * 0.2, size);
            }
        }
    }
}

// Dessine la pièce actuellement en mouvement
function drawTetromino() {
    if (!currentTetromino) return;
    const shape = currentTetromino.shape;
    const color = currentTetromino.color;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                drawBlock(currentPos.x + x, currentPos.y + y, color);
            }
        }
    }
}

// Teste s'il y a collision pour un décalage donné (xOffset, yOffset)
function hasCollision(xOffset, yOffset, customShape = null) {
    const shape = customShape || currentTetromino.shape;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const newX = currentPos.x + x + xOffset;
                const newY = currentPos.y + y + yOffset;
                if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && board[newY][newX])) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Supprime les lignes complètes et met à jour le score / niveau
function removeRows() {
    let linesRemoved = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== null)) {
            linesRemoved++;
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(null));
            y++;
        }
    }
    if (linesRemoved > 0) {
        const points = [0, 100, 300, 500, 800];
        score += points[linesRemoved] * level;
        document.getElementById("score").textContent = `Score: ${score}`;

        if (score > bestScore) {
            bestScore = score;
            document.getElementById("beastscore").textContent = `Beast Score: ${bestScore}`;
            localStorage.setItem("tetris_bestScore", bestScore);
        }

        // Calcul du nouveau niveau en fonction du score total
        const newLevel = Math.floor(score / 1000) + 1;
        if (newLevel > level) {
            level = newLevel;
            dropInterval = Math.max(100, 800 - (level - 1) * 70);
        }
    }
}

// Fait pivoter la pièce actuelle (rotation 90° horaire)
function rotateTetromino() {
    const shape = currentTetromino.shape;
    const newShape = shape[0].map((_, index) => shape.map(row => row[index]).reverse());
    if (!hasCollision(0, 0, newShape)) {
        currentTetromino.shape = newShape;
    }
}

// Fait descendre la pièce d'une ligne (ou la fixe si elle touche le bas / un autre bloc)
function moveDown() {
    if (!hasCollision(0, 1)) {
        currentPos.y++;
    } else {
        mergeTetromino();
        removeRows();
        // Prend la pièce suivante comme pièce active et génère un nouveau "next"
        currentTetromino = nextTetromino;
        nextTetromino = getRandomTetromino();
        currentPos = { x: 3, y: 0 };
        drawNextTetromino();
        // Si la nouvelle pièce est déjà en collision tout en haut, la partie est finie
        if (hasCollision(0, 0)) {
            gameOver = true;
            gameStarted = false;
            document.getElementById("restartButton").style.display = "block";
            drawGameOver();
        }
    }
    dropCounter = 0; // Quand on descend manuellement, on réinitialise le timer de chute automatique
}

// Fusionne la pièce actuelle dans le plateau (elle devient fixe)
function mergeTetromino() {
    const shape = currentTetromino.shape;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const boardY = currentPos.y + y;
                const boardX = currentPos.x + x;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentTetromino.color;
                }
            }
        }
    }
}

// Affiche l'écran "jeu terminé" par-dessus le plateau
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('JEU TERMINÉ', canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = '20px Outfit';
    ctx.fillText(`Skor: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
}

// Déplacement horizontal d'une case (gauche/droite)
function move(offsetX) {
    if (!hasCollision(offsetX, 0)) {
        currentPos.x += offsetX;
    }
}

// Boucle principale du jeu (animée avec requestAnimationFrame, ~60 fps)
function update(time = 0) {
    if (gameOver || !gameStarted) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;

    // Intervalle effectif, accéléré si le joueur tire la pièce vers le bas
    const effectiveInterval = dropInterval / dragSpeedMultiplier;

    if (dropCounter > effectiveInterval) {
        moveDown();
    }

    drawBoard();
    drawTetromino();

    requestAnimationFrame(update);
}

// Démarre une nouvelle partie (ou redémarre après Game Over)
function startGame() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    currentTetromino = getRandomTetromino();
    nextTetromino = getRandomTetromino();
    currentPos = { x: 3, y: 0 };
    score = 0;
    level = 1;
    dropInterval = 800;
    dropCounter = 0;
    gameOver = false;
    gameStarted = true;
    lastTime = performance.now();

    document.getElementById("score").textContent = `Score: ${score}`;
    document.getElementById("startButton").style.display = "none";
    document.getElementById("restartButton").style.display = "none";

    drawNextTetromino();

    update();
}

// Gestion des événements (clavier / boutons)
document.getElementById("startButton").addEventListener("click", startGame);
document.getElementById("startButton").style.display = "block";
document.getElementById("restartButton").addEventListener("click", startGame);

document.addEventListener('keydown', (event) => {
    if (!gameStarted || gameOver) return;

    switch (event.key) {
        case 'ArrowLeft':
            move(-1);
            break;
        case 'ArrowRight':
            move(1);
            break;
        case 'ArrowDown':
            moveDown();
            break;
        case 'ArrowUp':
            rotateTetromino();
            break;
    }
});

// Convertit une position écran (clientX / clientY) en coordonnées de cellule sur la grille
function getCellFromPointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const cellX = Math.floor(x / BLOCK_SIZE);
    const cellY = Math.floor(y / BLOCK_SIZE);
    return { cellX, cellY };
}

// Vérifie si une cellule de la grille correspond à un bloc de la pièce actuelle
function isCellOnCurrentTetromino(cellX, cellY) {
    if (!currentTetromino) return false;
    const shape = currentTetromino.shape;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const globalX = currentPos.x + x;
                const globalY = currentPos.y + y;
                if (globalX === cellX && globalY === cellY) {
                    return { hit: true, localX: x, localY: y };
                }
            }
        }
    }
    return { hit: false, localX: 0, localY: 0 };
}

// Calcule les bornes min / max possibles pour currentPos.x sans sortir du plateau
function getCurrentTetrominoHorizontalBounds() {
    if (!currentTetromino) {
        return { minX: 0, maxX: COLS - 1 };
    }

    const shape = currentTetromino.shape;
    const rows = shape.length;
    const cols = shape[0].length;

    let minCol = cols;
    let maxCol = -1;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (shape[y][x]) {
                if (x < minCol) minCol = x;
                if (x > maxCol) maxCol = x;
            }
        }
    }

    // Şeklin dolu alanını baz alarak tahtadan taşmaması için izin verilen aralık
    const minX = -minCol;
    const maxX = COLS - 1 - maxCol;

    return { minX, maxX };
}

// Gestion de la souris (desktop + certains navigateurs tablette)
canvas.addEventListener('mousedown', (event) => {
    if (!gameStarted || gameOver) return;

    const { cellX, cellY } = getCellFromPointer(event.clientX, event.clientY);
    const hitInfo = isCellOnCurrentTetromino(cellX, cellY);

    if (hitInfo.hit) {
        isDragging = true;
        dragMoved = false;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        dragAnchorX = hitInfo.localX; // Parça içindeki x ofseti
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (!isDragging || !gameStarted || gameOver) return;

    const moveThreshold = 5; // Seuil de pixels avant de considérer qu'on "glisse" vraiment
    if (Math.abs(event.clientX - dragStartX) > moveThreshold || Math.abs(event.clientY - dragStartY) > moveThreshold) {
        dragMoved = true;
    }

    // Accélère la chute en fonction de combien on tire la souris vers le bas (uniquement mouvement positif)
    const deltaY = event.clientY - dragStartY;
    const pullAmount = Math.max(0, deltaY);
    // 0px -> 1x, 80px -> ~2x, 240px -> ~4x, maksimum 5x
    dragSpeedMultiplier = 1 + Math.min(4, pullAmount / 80);

    // Mise à jour de la position horizontale (X) uniquement
    const { cellX } = getCellFromPointer(event.clientX, event.clientY);
    const desiredX = cellX - dragAnchorX;
    const { minX, maxX } = getCurrentTetrominoHorizontalBounds();
    const clampedX = Math.min(Math.max(desiredX, minX), maxX);
    const offsetX = clampedX - currentPos.x;

    if (!hasCollision(offsetX, 0)) {
        currentPos.x = clampedX;
    }
});

canvas.addEventListener('mouseup', () => {
    if (!gameStarted || gameOver) {
        isDragging = false;
        dragSpeedMultiplier = 1;
        return;
    }

    // Si on n'a pas vraiment glissé (simple clic), on considère que c'est une rotation
    if (isDragging && !dragMoved) {
        rotateTetromino();
    }

    isDragging = false;
    dragSpeedMultiplier = 1;
});

canvas.addEventListener('mouseleave', () => {
    // Si la souris sort du canvas, on annule le drag pour éviter des états bizarres
    isDragging = false;
    dragSpeedMultiplier = 1;
});

// Gestion du toucher (tablette / téléphone)
canvas.addEventListener('touchstart', (event) => {
    if (!gameStarted || gameOver) return;
    if (event.touches.length === 0) return;

    const touch = event.touches[0];
    const { cellX, cellY } = getCellFromPointer(touch.clientX, touch.clientY);
    const hitInfo = isCellOnCurrentTetromino(cellX, cellY);

    if (hitInfo.hit) {
        isDragging = true;
        dragMoved = false;
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        dragAnchorX = hitInfo.localX;
        event.preventDefault();
    }
}, { passive: false });

canvas.addEventListener('touchmove', (event) => {
    if (!isDragging || !gameStarted || gameOver) return;
    if (event.touches.length === 0) return;

    const touch = event.touches[0];

    const moveThreshold = 5; // Même logique de seuil que pour la souris
    if (Math.abs(touch.clientX - dragStartX) > moveThreshold || Math.abs(touch.clientY - dragStartY) > moveThreshold) {
        dragMoved = true;
    }

    // Accélère la chute en fonction du glissement vertical du doigt
    const deltaY = touch.clientY - dragStartY;
    const pullAmount = Math.max(0, deltaY);
    dragSpeedMultiplier = 1 + Math.min(4, pullAmount / 80);

    const { cellX } = getCellFromPointer(touch.clientX, touch.clientY);
    const desiredX = cellX - dragAnchorX;
    const { minX, maxX } = getCurrentTetrominoHorizontalBounds();
    const clampedX = Math.min(Math.max(desiredX, minX), maxX);
    const offsetX = clampedX - currentPos.x;

    if (!hasCollision(offsetX, 0)) {
        currentPos.x = clampedX;
    }

    event.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (event) => {
    if (!gameStarted || gameOver) {
        isDragging = false;
        dragSpeedMultiplier = 1;
        return;
    }

    // Si le doigt n'a presque pas bougé, on interprète ça comme un "tap" pour faire tourner la pièce
    if (isDragging && !dragMoved) {
        rotateTetromino();
    }

    isDragging = false;
    dragSpeedMultiplier = 1;
    event.preventDefault();
}, { passive: false });

// Premier rendu du plateau (vide) au chargement
drawBoard();

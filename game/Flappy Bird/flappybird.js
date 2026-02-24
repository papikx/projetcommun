
//plateau
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

//oiseau
let birdWidth = 34; //rapport largeur/hauteur = 408/228 = 17/12
let birdHeight = 24;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;
//let birdImg;
let birdImgs = [];
let birdImgsIndex = 0;

let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
}

//tuyaux
let pipeArray = [];
let pipeWidth = 64; //rapport largeur/hauteur = 384/3072 = 1/8
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//physique
let baseVelocityX = -2; // base speed
let velocityX = baseVelocityX; // current speed
let velocityY = 0; // jump speed
let gravity = 0.4;

let gameOver = false;
let score = 0;
let scoreEl = null;
let bestEl = null;
let bestScore = 0;
let gameOverTime = 0; // Timestamp when the game ended

// Game Over Overlay elements
let gameOverOverlay = null;
let finalScoreEl = null;
let retryBtn = null;

let wingSound = new Audio("./sfx_wing.wav");
let hitSound = new Audio("./sfx_hit.wav");
let bgm = new Audio("./bgm_mario.mp3");

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //utilisé pour dessiner sur le plateau

    //dessiner flappy bird
    // context.fillStyle = "green";
    // context.fillRect(bird.x, bird.y, bird.width, bird.height);

    //charger les images
    //birdImg = new Image();
    //birdImg.src = "./flappybird.png";
    //birdImg.onload = function() {
    //context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    //}

    for (let i = 0; i < 4; i++) {
        let birdImg = new Image();
        birdImg.src = `./flappybird${i}.png`;
        birdImgs.push(birdImg);
    }

    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";

    requestAnimationFrame(update);
    setInterval(placePipes, 1500); //toutes les 1,5 secondes
    setInterval(animateBird, 100); //toutes les 0,1 secondes
    document.addEventListener("keydown", moveBird);

    // HUD elements
    scoreEl = document.getElementById('scoreVal');
    bestEl = document.getElementById('bestScore');
    bestScore = localStorage.getItem('flappy_bestScore') ? parseInt(localStorage.getItem('flappy_bestScore')) : 0;
    if (bestEl) bestEl.innerText = bestScore;

    // Button listeners
    const startBtn = document.getElementById('startBtn');
    const menuBtn = document.getElementById('menuBtn');

    // Game Over Overlay elements
    gameOverOverlay = document.getElementById('gameOverOverlay');
    finalScoreEl = document.getElementById('finalScore');
    retryBtn = document.getElementById('retryBtn');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (gameOver) {
                resetGame();
            } else {
                // If the game isn't over, maybe just play the sound?
                // Or if it's the very first start, ensure it feels responsive
                wingSound.play();
                velocityY = -6;
            }
        });
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            // Retour au menu des jeux
            window.location.href = '../game_menu.html';
        });
    }
    if (retryBtn) {
        retryBtn.addEventListener('click', resetGame);
    }
}

function resetGame() {
    if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
    bird.y = birdY;
    pipeArray = [];
    score = 0;
    gameOver = false;
    velocityX = baseVelocityX; // reset speed
    velocityY = 0;
    bgm.pause();
    bgm.currentTime = 0;
    bgm.play();
}

function update() {
    requestAnimationFrame(update);
    if (gameOver) {
        return;
    }
    context.clearRect(0, 0, board.width, board.height);

    // Difficulty scaling: increase speed as score grows
    // speed = base + (score * factor). Clamp at reasonable max.
    let speedFactor = 0.1;
    let maxSpeed = -8;
    velocityX = Math.max(baseVelocityX - (Math.floor(score) * speedFactor), maxSpeed);

    //oiseau
    velocityY += gravity;
    // bird.y += velocityY;
    bird.y = Math.max(bird.y + velocityY, 0); //appliquer la gravité à bird.y actuel, limiter bird.y au sommet du canevas
    //context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    context.drawImage(birdImgs[birdImgsIndex], bird.x, bird.y, bird.width, bird.height);
    //birdImgsIndex++; //incrementer l'index pour la prochaine image
    //birdImgsIndex %= birdImgs.length; //circle back with modulus, max frames = 4
    // 0 1 2 3 0 1 2 3 0 1 2 3


    if (bird.y > board.height) {
        bgm.pause();
        bgm.currentTime = 0;
        gameOver = true;
        gameOverTime = Date.now();
        // update best
        if (Math.floor(score) > bestScore) {
            bestScore = Math.floor(score);
            localStorage.setItem('flappy_bestScore', bestScore);
            if (bestEl) bestEl.innerText = bestScore;
        }
    }

    //tuyaux
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5; //0,5 car il y a 2 tuyaux! donc 0,5*2 = 1, 1 pour chaque ensemble de tuyaux
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe)) {
            hitSound.play();
            bgm.pause();
            bgm.currentTime = 0;
            gameOver = true;
            // update best
            if (Math.floor(score) > bestScore) {
                bestScore = Math.floor(score);
                localStorage.setItem('flappy_bestScore', bestScore);
                if (bestEl) bestEl.innerText = bestScore;
            }
            gameOverTime = Date.now();
        }
    }

    //effacer les tuyaux
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift(); //supprime le premier élément du tableau
    }

    // update HUD score
    if (scoreEl) scoreEl.innerText = Math.floor(score);

    if (gameOver) {
        if (gameOverOverlay) {
            gameOverOverlay.classList.remove('hidden');
            if (finalScoreEl) finalScoreEl.innerText = Math.floor(score);
        }
    }
}

function animateBird() {
    birdImgsIndex++; //incrementer l'index pour la prochaine image
    birdImgsIndex %= birdImgs.length; //circle back with modulus, max frames = 4
}

function placePipes() {
    if (gameOver) {
        return;
    }

    //(0-1) * hauteurTuyau/2.
    // 0 -> -128 (hauteurTuyau/4)
    // 1 -> -128 - 256 (hauteurTuyau/4 - hauteurTuyau/2) = -3/4 hauteurTuyau
    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    let openingSpace = board.height / 4;

    let topPipe = {
        img: topPipeImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    pipeArray.push(topPipe);

    let bottomPipe = {
        img: bottomPipeImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    pipeArray.push(bottomPipe);
}

function moveBird(e) {
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") {
        bgm.play();
        wingSound.play();
        //saut
        velocityY = -6;

        //réinitialiser le jeu
        if (gameOver) {
            // Add a small cooldown (500ms) to prevent accidental restarts
            if (Date.now() - gameOverTime > 500) {
                resetGame();
            }
        }
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //le coin supérieur gauche de a n'atteint pas le coin supérieur droit de b
        a.x + a.width > b.x &&   //le coin supérieur droit de a dépasse le coin supérieur gauche de b
        a.y < b.y + b.height &&  //le coin supérieur gauche de a n'atteint pas le coin inférieur gauche de b
        a.y + a.height > b.y;    //le coin inférieur gauche de a dépasse le coin supérieur gauche de b
}
document.addEventListener('DOMContentLoaded', () => {
    // --- Éléments du DOM ---
    const grid = document.getElementById('gameGrid');
    const scoreDisplay = document.getElementById('score');
    const timeLeftDisplay = document.getElementById('timer');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const gameOverModal = document.getElementById('gameOverModal');
    const finalScoreDisplay = document.getElementById('finalScore');
    const instructionDisplay = document.getElementById('instruction');

    // --- Audio ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const correctSound = new Audio('sounds/hit.mp3');
    const bgm = new Audio('sounds/bgm.mp3');
    const gameOverSound = new Audio('sounds/gameover.mp3');

    // --- État du jeu ---
    let state = {
        score: 0,
        timeLeft: 30,
        isPlaying: false,
        isPaused: false,
        timerId: null,
        characters: [],
        currentTarget: null,
        canClick: false,
        mistakes: [] // Suivi des erreurs
    };

    // --- Initialisation ---
    function init() {
        loadCharacters();
        createGrid(false);
        setupListeners();
    }

    // --- Chargement des personnages ---
    function loadCharacters() {
        // ===> Cette liste correspond à vos images <===
        const filePairs = [
            { name: 'ali', image: 'imgEleves/ali.png', sound: 'voix/Ali.m4a' },
            { name: 'artem', image: 'imgEleves/artem.png', sound: 'voix/Artem.m4a' },
            { name: 'leandro', image: 'imgEleves/léandro.png', sound: 'voix/Léandro.m4a' },
            { name: 'nicolas', image: 'imgEleves/Nicolas.png', sound: 'voix/Nicolas.m4a' },
            { name: 'dylan', image: 'imgEleves/dylan.png', sound: 'voix/Dylan.m4a' },
            { name: 'ryan', image: 'imgEleves/ryan.png', sound: 'voix/Ryan.m4a' },
            { name: 'luc-emmanuel', image: 'imgEleves/luc-emmanuel.png', sound: 'voix/luc emmanuel.m4a' },
            { name: 'robin', image: 'imgEleves/robain.png', sound: 'voix/Robin.m4a' },
            { name: 'yassin', image: 'imgEleves/yassin.png', sound: 'voix/Yassin.m4a' },
            { name: 'romain', image: 'imgEleves/romain.png', sound: 'voix/Romain.m4a' },
            { name: 'musab', image: 'imgEleves/musab.png', sound: 'voix/Mussab.m4a' },
            { name: 'juan', image: 'imgEleves/juan.png', sound: 'voix/Juan.m4a' },
            { name: 'jeremy', image: 'imgEleves/jeremy.png', sound: 'voix/Jeremy.m4a' },
            { name: 'guynathan', image: 'imgEleves/guynathan.png', sound: 'voix/Guynathan.m4a' },
            { name: 'magomed-emi', image: 'imgEleves/magomed-emi.png', sound: 'voix/Moha.m4a' },
            { name: 'herman', image: 'imgEleves/herman.png', sound: 'voix/Hermann.m4a' },
            { name: 'daris', image: 'imgEleves/daris.png', sound: 'voix/Daris.m4a' },
            { name: 'iker', image: 'imgEleves/iker.png', sound: 'voix/Iker.m4a' },
            { name: 'jason', image: 'imgEleves/jason.png', sound: 'voix/Jason.m4a' },
            { name: 'sebastian', image: 'imgEleves/Sebastian.png', sound: 'voix/Sebastian.m4a' }
        ];

        state.characters = filePairs.map((char, index) => ({
            ...char,
            id: index + 1,
            soundAudio: char.sound ? new Audio(char.sound) : null
        }));
    }

    // --- Création de la grille ---
    function createGrid(shuffle = true) {
        grid.innerHTML = '';
        let charactersToDisplay = [...state.characters];
        if (shuffle) {
            charactersToDisplay.sort(() => Math.random() - 0.5);
        }

        charactersToDisplay.forEach(char => {
            const cell = document.createElement('div');
            cell.className = 'character-cell';
            cell.style.backgroundImage = `url('${char.image}')`;
            cell.dataset.id = char.id;
            cell.addEventListener('click', onCellClick);
            grid.appendChild(cell);
        });
    }

    // --- Logique de jeu ---
    function startGame() {
        if (state.isPlaying) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();

        state.score = 0;
        state.timeLeft = 75; // 1 minute 15 seconds
        state.isPlaying = true;
        state.isPaused = false;
        state.mistakes = []; // Reset erreurs

        scoreDisplay.textContent = state.score;
        timeLeftDisplay.textContent = state.timeLeft;
        instructionDisplay.textContent = "Écoutez...";

        startBtn.disabled = true;
        pauseBtn.disabled = false;
        gameOverModal.classList.add('hidden');
        document.body.classList.add('party-active');

        createGrid(true);

        if (bgm.src) { bgm.currentTime = 0; bgm.loop = true; bgm.play().catch(e => console.error("BGM Error:", e)); }
        const vid = document.getElementById('disco-bg');
        if (vid) { vid.currentTime = 0; vid.play().catch(e => console.error("Video Error:", e)); }

        state.timerId = setInterval(countDown, 1000);
        setTimeout(nextTurn, 1500);
    }

    function nextTurn() {
        if (!state.isPlaying || state.isPaused) return;

        document.querySelectorAll('.character-cell').forEach(c => c.classList.remove('correct', 'incorrect'));

        const validTargets = state.characters.filter(c => c.soundAudio);
        if (validTargets.length === 0) {
            endGame();
            return;
        }
        state.currentTarget = validTargets[Math.floor(Math.random() * validTargets.length)];

        instructionDisplay.textContent = "Qui est-ce ?";
        state.currentTarget.soundAudio.play().catch(e => console.error("Sound Error:", e));
        state.canClick = true;
    }

    function onCellClick(event) {
        if (!state.canClick || state.isPaused || !state.isPlaying) return;

        state.canClick = false;
        const clickedId = parseInt(event.currentTarget.dataset.id);
        const clickedCell = event.currentTarget;

        if (clickedId === state.currentTarget.id) {
            state.score++;
            scoreDisplay.textContent = state.score;
            clickedCell.classList.add('correct');
            instructionDisplay.textContent = "Bien joué !";
            if (correctSound.src) correctSound.play().catch(() => { });
        } else {
            // Enregistrer l'erreur
            state.mistakes.push({
                target: state.currentTarget,
                clicked: state.characters.find(c => c.id === clickedId)
            });
            clickedCell.classList.add('incorrect');
            instructionDisplay.textContent = "Raté !";
        }

        setTimeout(nextTurn, 1200);
    }

    function countDown() {
        if (state.isPaused) return;
        state.timeLeft--;
        timeLeftDisplay.textContent = state.timeLeft;
        if (state.timeLeft <= 0) {
            endGame();
        }
    }

    function endGame() {
        state.isPlaying = false;
        clearInterval(state.timerId);

        document.body.classList.remove('party-active');
        if (bgm) bgm.pause();
        const vid = document.getElementById('disco-bg');
        if (vid) vid.pause();

        if (gameOverSound.src) gameOverSound.play().catch(() => { });
        finalScoreDisplay.textContent = state.score;

        // Afficher les erreurs
        const mistakesContainer = document.getElementById('mistakesList');
        if (state.mistakes.length > 0) {
            let html = '<h3>Vos Erreurs:</h3><ul style="list-style: none; padding: 0;">';
            state.mistakes.forEach(m => {
                html += `
                    <li style="margin-bottom: 5px; background: rgba(255,0,0,0.1); padding: 5px; border-radius: 5px; display: flex; align-items: center; justify-content: space-between;">
                        <div style="flex: 1; text-align: center;">
                            <span style="display: block; font-size: 0.8em; color: #00ff00;">C'était :</span>
                            <img src="${m.target.image}" style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid #00ff00;">
                            <span style="display: block; font-size: 0.8em;">${m.target.name}</span>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <span style="display: block; font-size: 0.8em; color: #ff0000;">Vous avez cliqué :</span>
                            <img src="${m.clicked.image}" style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid #ff0000;">
                            <span style="display: block; font-size: 0.8em;">${m.clicked.name}</span>
                        </div>
                    </li>`;
            });
            html += '</ul>';
            mistakesContainer.innerHTML = html;
        } else {
            mistakesContainer.innerHTML = '<p style="color: #00ff00;">Aucune erreur ! Parfait ! 🌟</p>';
        }

        gameOverModal.classList.remove('hidden');

        startBtn.disabled = false;
        pauseBtn.disabled = true;
        instructionDisplay.textContent = "Le jeu est terminé !";
    }

    // --- Gestionnaires d'événements ---
    function setupListeners() {
        startBtn.addEventListener('click', startGame);

        pauseBtn.addEventListener('click', () => {
            if (!state.isPlaying) return;
            state.isPaused = !state.isPaused;
            pauseBtn.textContent = state.isPaused ? "Reprendre" : "Pause";
            instructionDisplay.textContent = state.isPaused ? "Jeu en pause" : "Écoutez...";

            if (state.isPaused) {
                if (bgm) bgm.pause();
                audioCtx.suspend();
            } else {
                if (bgm) bgm.play();
                audioCtx.resume();
            }
        });
    }

    // Démarrer le script
    init();
});

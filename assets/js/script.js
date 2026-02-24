/**
 * Logique principale du jeu Quiz
 * Gère la sélection des produits, le cycle d   e 5 questions, et l'affichage des résultats.
 */

// Éléments du DOM
const questionElement = document.getElementById("question");
const answerButtons = document.getElementById("answer-buttons");
const nextButton = document.getElementById("next-btn");

const productSelectionDiv = document.getElementById("product-selection");
const quizDiv = document.getElementById("quiz-interface");
const productList = document.getElementById("product-list");
const gameTitle = document.getElementById("game-title");
const gamesBtn = document.getElementById("games-btn");

// États du jeu
let currentQuestionIndex = 0;
let score = 0;
let selectedProduct = null;
let gameQuestions = [];
const QUESTIONS_PER_GAME = 5;

// Liste des produits à gagner
const products = [
    { name: "iPhone 15", price: "999 CHF", image: "iphone15.jpg" },
    { name: "PS5", price: "499 CHF", image: "ps5.jpg" },
    { name: "MacBook Air", price: "1100 CHF", image: "macbook.jpg" },
    { name: "AirPods Pro", price: "250 CHF", image: "airpods.jpg" }
];

/**
 * Initialisation de l'application
 */
function initApp() {
    showProductSelection();
}

/**
 * Affiche l'écran de sélection des produits
 */
function showProductSelection() {
    productSelectionDiv.style.display = "block";
    quizDiv.style.display = "none";
    gameTitle.innerText = "Choisissez un produit à gagner !";
    nextButton.style.display = "none";
    if (gamesBtn) gamesBtn.style.display = "block";

    // Générer la liste des produits
    if (productList.children.length === 0) {
        products.forEach(prod => {
            const div = document.createElement("div");
            div.className = "product-card";
            div.innerHTML = `
                <h3>${prod.name}</h3>
                <p>Valeur: ${prod.price}</p>
                <!-- <img src="${prod.image}" alt="${prod.name}"> -->
            `;
            div.onclick = () => selectProduct(prod);
            productList.appendChild(div);
        });
    }
}

/**
 * Gère la sélection d'un produit et lance le quiz
 * @param {Object} product Le produit sélectionné
 */
function selectProduct(product) {
    selectedProduct = product;
    productSelectionDiv.style.display = "none";
    quizDiv.style.display = "block";
    gameTitle.innerText = `Quiz pour : ${product.name}`;
    if (gamesBtn) gamesBtn.style.display = "none";
    startQuiz();
}

/**
 * Démarre une nouvelle session de quiz
 * Sélectionne 5 questions au hasard
 */
function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    nextButton.innerHTML = "Suivant";

    // Charger toutes les questions depuis data.js (localStorage ou défaut)
    const allQuestions = loadQuestions();

    // Mélanger et prendre les 5 premières
    gameQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, QUESTIONS_PER_GAME);

    showQuestion();
}

/**
 * Affiche la question courante
 */
function showQuestion() {
    resetState();
    let currentQuestion = gameQuestions[currentQuestionIndex];
    let questionNo = currentQuestionIndex + 1;
    questionElement.innerHTML = `${questionNo}. ${currentQuestion.question}`;

    // Mélanger les réponses
    const answers = [...currentQuestion.answers].sort(() => Math.random() - 0.5);

    answers.forEach(answer => {
        const button = document.createElement("button");
        button.innerHTML = answer.text;
        button.classList.add("btn");
        answerButtons.appendChild(button);
        if (answer.correct) {
            button.dataset.correct = answer.correct;
        }
        button.addEventListener("click", selectAnswer);
    });
}

/**
 * Réinitialise l'état des boutons pour la prochaine question
 */
function resetState() {
    nextButton.style.display = "none";
    while (answerButtons.firstChild) {
        answerButtons.removeChild(answerButtons.firstChild);
    }
}

/**
 * Gère le clic sur une réponse
 */
function selectAnswer(e) {
    const selectedBtn = e.target;
    // La dataset stocke des chaînes, donc on compare à "true" ou on vérifie l'existence
    const isCorrect = selectedBtn.dataset.correct === "true" || selectedBtn.dataset.correct === true;

    if (isCorrect) {
        selectedBtn.classList.add("correct");
        score++;
    } else {
        selectedBtn.classList.add("incorrect");
    }

    // Montrer les bonnes/mauvaises réponses et désactiver les boutons
    Array.from(answerButtons.children).forEach(button => {
        if (button.dataset.correct === "true") {
            button.classList.add("correct");
        }
        button.disabled = true;
    });

    nextButton.style.display = "block";
}

/**
 * Affiche le score final et le résultat
 */
function showScore() {
    resetState();
    const won = score === QUESTIONS_PER_GAME;

    if (won) {
        questionElement.innerHTML = `Félicitations ! Vous avez gagné : ${selectedProduct.name} !<br>Score : ${score}/${QUESTIONS_PER_GAME}`;
    } else {
        questionElement.innerHTML = `Dommage ! Vous avez perdu.<br>Score : ${score}/${QUESTIONS_PER_GAME}.<br>Il fallait un sans-faute !`;
    }

    nextButton.innerHTML = "Choisir un autre produit";
    nextButton.style.display = "block";
}

/**
 * Gère le clic sur le bouton "Suivant"
 */
function handleNextButton() {
    currentQuestionIndex++;
    if (currentQuestionIndex < gameQuestions.length) {
        showQuestion();
    } else {
        showScore();
    }
}

nextButton.addEventListener("click", () => {
    if (currentQuestionIndex < gameQuestions.length) {
        handleNextButton();
    } else {
        initApp(); // Retour au menu principal
    }
});

// Lancer l'application
initApp();
const cells = document.querySelectorAll(".cell");
const status = document.getElementById("status");
let currentPlayer = "X";
let gameOver = false;

const winningCombos = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
];

cells.forEach((cell, index) => {
    cell.addEventListener("click", () => {
        if (cell.textContent !== "" || gameOver) return;

        cell.textContent = currentPlayer;
        cell.classList.add("disabled");

        if (checkWin()) {
            status.textContent = `Le joueur ${currentPlayer} a gagné 🎉`;
            gameOver = true;
        } else if (isDraw()) {
            status.textContent = "Match nul 🤝";
            gameOver = true;
        } else {
            currentPlayer = currentPlayer === "X" ? "O" : "X";
            status.textContent = `Tour du joueur ${currentPlayer}`;
        }
    });
});

function checkWin() {
    return winningCombos.some(combo =>
        combo.every(i => cells[i].textContent === currentPlayer)
    );
}

function isDraw() {
    return [...cells].every(cell => cell.textContent !== "");
}

function resetGame() {
    cells.forEach(cell => {
        cell.textContent = "";
        cell.classList.remove("disabled");
    });
    currentPlayer = "X";
    gameOver = false;
    status.textContent = "Tour du joueur X";
}

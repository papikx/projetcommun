const wheel = document.getElementById('wheel');
const colors = [
    '#1c028fff', '#0077ffff', '#ffffffff', '#0077ffff', '#ffffffff', '#0077ffff',
    '#ffffffff', '#0077ffff', '#ffffffff', '#0077ffff', '#ffffffff', '#0077ffff'
];

// Default Prizes
const defaultPrizes = [
    " Mega Maison",
    " Voyage Mars",
    " Île Privée",
    " Ferrari Or",
    " 100M €",
    " Yacht Luxe",
    " Jet Privé",
    " Château",
    " Diamant",
    " Rencontre Aliens",
    " Pizza à vie",
    " Rien du tout"
];

// Load from LocalStorage or use default
let prizes = JSON.parse(localStorage.getItem('wheelPrizes')) || defaultPrizes;

let segmentsCount = prizes.length;
let segmentAngle = 360 / segmentsCount;

function drawWheel() {
    segmentsCount = prizes.length;
    segmentAngle = 360 / segmentsCount;

    // Create Conic Gradient Background
    const startOffset = -segmentAngle / 2;
    let gradientString = `conic-gradient(from ${startOffset}deg, `;
    let currentAngle = 0;

    for (let i = 0; i < segmentsCount; i++) {
        const color = colors[i % colors.length];
        const nextAngle = currentAngle + segmentAngle;
        gradientString += `${color} ${currentAngle}deg ${nextAngle}deg`;
        if (i < segmentsCount - 1) gradientString += ', ';
        currentAngle = nextAngle;
    }
    gradientString += ')';

    wheel.style.background = gradientString;
    wheel.innerHTML = ''; // Clear previous content

    // Create Text Labels
    for (let i = 0; i < segmentsCount; i++) {
        const label = document.createElement('div');
        label.style.position = 'absolute';
        label.style.top = '50%';
        label.style.left = '50%';
        label.style.width = '0';
        label.style.height = '0';

        const rotation = i * segmentAngle + segmentAngle / 2 + startOffset;
        label.style.transform = `rotate(${rotation}deg)`;

        const text = document.createElement('span');
        text.innerText = prizes[i];
        text.style.position = 'absolute';
        text.style.left = '60px'; // distance from center
        text.style.transformOrigin = 'left center';
        text.style.whiteSpace = 'nowrap';

        // Intelligent text color based on background
        const segmentColor = colors[i % colors.length];
        if (segmentColor.toLowerCase().startsWith('#ffff') || segmentColor.toLowerCase() === 'white') {
            text.style.color = 'black';
            text.style.textShadow = 'none';
        } else {
            text.style.color = 'white';
            text.style.textShadow = '1px 1px 2px black';
        }

        text.style.fontWeight = 'bold';
        text.style.fontSize = '14px';

        label.appendChild(text);
        wheel.appendChild(label);
    }
}

// Initial draw
drawWheel();

// Spin Logic
const spinBtn = document.getElementById('spinBtn');
let currentRotation = 0;
let isSpinning = false;

spinBtn.addEventListener('click', () => {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;

    const randomDegree = Math.floor(Math.random() * 360);
    const extraSpins = 360 * 5;
    const totalAddRotation = extraSpins + randomDegree;

    currentRotation += totalAddRotation;

    wheel.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
        isSpinning = false;
        spinBtn.disabled = false;
        determineWinner(currentRotation);
    }, 4000); // Must match CSS transition duration
});

function determineWinner(totalRotation) {
    const actualRotation = totalRotation % 360;
    const winningAngle = (360 - actualRotation) % 360;

    // Add offset for center alignment
    const offsetAngle = winningAngle + (segmentAngle / 2);

    let winningIndex = Math.floor(offsetAngle / segmentAngle);

    if (winningIndex >= segmentsCount) winningIndex = 0;

    const winner = prizes[winningIndex];
    console.log(`Gagné : ${winner}`);
}

// Admin Logic (New Implementation)
const adminBtn = document.getElementById('adminBtn');
const adminPanel = document.getElementById('adminPanel');
const prizesListContainer = document.getElementById('prizesListContainer');
const addPrizeBtn = document.getElementById('addPrizeBtn');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

function renderAdminPrizes() {
    prizesListContainer.innerHTML = '';
    prizes.forEach((prize) => {
        addPrizeRow(prize);
    });
}

function addPrizeRow(value = '') {
    const div = document.createElement('div');
    div.className = 'prize-item';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.className = 'prize-input';
    input.placeholder = 'Nom du lot';

    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = '🗑️'; // Start with emoji
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = () => div.remove(); // Simple remove

    div.appendChild(input);
    div.appendChild(deleteBtn);
    prizesListContainer.appendChild(div);
}

if (adminBtn) {
    adminBtn.addEventListener('click', () => {
        renderAdminPrizes();
        adminPanel.classList.remove('hidden');
    });
}

if (addPrizeBtn) {
    addPrizeBtn.addEventListener('click', () => {
        addPrizeRow();
        // Scroll to bottom
        setTimeout(() => {
            prizesListContainer.scrollTop = prizesListContainer.scrollHeight;
        }, 10);
    });
}

if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
        adminPanel.classList.add('hidden');
    });
}

if (saveBtn) {
    saveBtn.addEventListener('click', () => {
        const inputs = prizesListContainer.querySelectorAll('.prize-input');
        const newPrizes = [];
        inputs.forEach(input => {
            if (input.value.trim() !== '') {
                newPrizes.push(input.value.trim());
            }
        });

        if (newPrizes.length > 0) {
            prizes = newPrizes;
            localStorage.setItem('wheelPrizes', JSON.stringify(prizes));
            drawWheel();
            adminPanel.classList.add('hidden');
        } else {
            alert("Il faut au moins un prix !");
        }
    });
}

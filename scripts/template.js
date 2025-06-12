// === 1. Sélection des éléments ===
const el = {
    betInput: document.querySelector("#bet"),
    betList: document.querySelector(".display-selected"),
    betFactor: document.querySelector(".display-bet-factor"),
    earnings: document.querySelector(".display-earnings"),
    matches: document.querySelector(".display-bets"),
};

// === 2. État de l'application ===
let state = {
    selectedBets: [],
    matches: [],
};

// === 3. Fonctions d'affichage ===
function renderBets() {
    el.betList.innerHTML = "";
    state.selectedBets.forEach(bet => {
        const betDiv = document.createElement("div");
        betDiv.className = "bet";
        betDiv.innerHTML = `
            <strong>${bet.homeTeam} - ${bet.awayTeam}</strong>
            <span>${bet.betValue}</span>
            <button class="remove" data-id="${bet.matchId}">🗑️</button>
        `;
        el.betList.appendChild(betDiv);
    });
    attachRemoveEvents();
}

function renderFactor() {
    const total = state.selectedBets.reduce((acc, bet) => acc * parseFloat(bet.betValue), 1);
    el.betFactor.innerHTML = `Cote totale : <span>${total.toFixed(2)}</span>`;
    return total;
}

function renderEarnings() {
    const factor = renderFactor();
    const betAmount = parseFloat(el.betInput.value);
    const earnings = !isNaN(betAmount) ? (factor * betAmount) : 0;
    el.earnings.innerHTML = `Gain potentiel : <span>${earnings.toFixed(2)} €</span>`;
}

// === 4. Événements ===
function attachRemoveEvents() {
    document.querySelectorAll(".remove").forEach(button => {
        button.addEventListener("click", () => {
            const id = button.dataset.id;
            state.selectedBets = state.selectedBets.filter(b => b.matchId !== id);
            document.querySelectorAll(`.btn-choice[data-id="${id}"]`).forEach(btn => btn.classList.remove("active"));
            renderAll();
        });
    });
}

function setupBetButtons() {
    el.matches.addEventListener("click", async (e) => {
        const btn = e.target.closest(".btn-choice");
        if (!btn) return;

        const matchId = btn.dataset.id;
        if (btn.classList.contains("active")) return;

        // Supprimer les anciens choix pour ce match
        document.querySelectorAll(`.btn-choice[data-id="${matchId}"]`).forEach(b => b.classList.remove("active"));
        state.selectedBets = state.selectedBets.filter(b => b.matchId !== matchId);

        // Trouver le match
        const match = state.matches.find(m => m.match_id == matchId);
        if (match) {
            state.selectedBets.push({
                matchId,
                homeTeam: match.hometeam,
                awayTeam: match.awayteam,
                betValue: btn.textContent,
            });
            btn.classList.add("active");
            renderAll();
        }
    });
}

el.betInput.addEventListener("input", renderEarnings);

// === 5. Chargement initial ===
async function init() {
    const res = await fetch("../scripts/datas.json");
    const data = await res.json();
    state.matches = data.matchs;

    // Affiche les boutons de cotes
    data.matchs.forEach(match => {
        const container = document.createElement("div");
        container.innerHTML = `
            <button class="btn-choice" data-id="${match.match_id}" data-bet="home">${match.home_odd}</button>
            <button class="btn-choice" data-id="${match.match_id}" data-bet="draw">${match.draw_odd}</button>
            <button class="btn-choice" data-id="${match.match_id}" data-bet="away">${match.away_odd}</button>
        `;
        el.matches.appendChild(container);
    });

    setupBetButtons();
}

function renderAll() {
    renderBets();
    renderEarnings();
}

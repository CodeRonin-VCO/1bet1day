// Déclaration de la classe principale
class BetApp {
    constructor(selectors) {
        // Enregistre les éléments DOM utiles dans un objet `el`
        this.el = {
            input: document.querySelector(selectors.input),
            betList: document.querySelector(selectors.betList),
            betFactor: document.querySelector(selectors.betFactor),
            earnings: document.querySelector(selectors.earnings),
            matches: document.querySelector(selectors.matches)
        };

        // Initialise l'état de l'application
        this.state = {
            selectedBets: [],   // Tableau contenant les paris sélectionnés
            matches: []         // Tableau contenant tous les matchs récupérés via API
        };

        this.init(); // Démarre l'app dès l'instanciation
    }
    // Fonction de démarrage
    async init() {
        await this.loadMatches();            // 1. Récupération des données
        this.loadFromStorage();              // 2. Récupération des paris sauvegardés
        this.renderMatchButtons();           // 3. Génération des boutons
        this.attachGlobalEvents();           // 4. Mise en place des écouteurs
        this.renderAll();                    // 5. Affichage des paris + cotes + gains
    }
    // Charge les données des matchs depuis le fichier JSON
    async loadMatches() {
        try {
            const res = await fetch("../scripts/datas.json");
            const data = await res.json();
            this.state.matches = data.matchs;
        } catch (e) {
            console.error("Erreur de chargement :", e);
        }
    }
    // Crée les boutons de choix de pari pour chaque match
    renderMatchButtons() {
        this.state.matches.forEach(match => {
            const container = document.createElement("div");
            container.innerHTML = `
                <button class="btn-choice" data-id="${match.match_id}" data-bet="home">${match.home_odd}</button>
                <button class="btn-choice" data-id="${match.match_id}" data-bet="draw">${match.draw_odd}</button>
                <button class="btn-choice" data-id="${match.match_id}" data-bet="away">${match.away_odd}</button>
            `;
            this.el.matches.appendChild(container);
        });
    }
    // Active les événements principaux
    attachGlobalEvents() {
        this.el.matches.addEventListener("click", this.handleMatchClick.bind(this));
        this.el.input.addEventListener("input", this.renderEarnings.bind(this));
    }
    // Gère les clics sur les boutons de paris
    handleMatchClick(e) {
        const btn = e.target.closest(".btn-choice");
        if (!btn) return;

        const matchId = btn.dataset.id;
        const alreadyActive = btn.classList.contains("active");

        // Supprime la classe active et les paris liés
        document.querySelectorAll(`.btn-choice[data-id="${matchId}"]`).forEach(b => b.classList.remove("active"));
        this.state.selectedBets = this.state.selectedBets.filter(b => b.matchId !== matchId);

        // Si ce n’était pas déjà actif, on ajoute le pari
        if (!alreadyActive) {
            const match = this.state.matches.find(m => m.match_id == matchId);
            if (match) {
                this.state.selectedBets.push({
                    matchId,
                    homeTeam: match.hometeam,
                    awayTeam: match.awayteam,
                    betValue: btn.textContent
                });
                btn.classList.add("active");
            }
        }

        this.renderAll(); // Mets à jour l'affichage
    }
    // Ajoute les gestionnaires de suppression sur chaque 🗑️
    attachDeleteHandlers() {
        this.el.betList.querySelectorAll(".remove").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const matchId = btn.dataset.id;

                // Supprime le pari du state
                this.state.selectedBets = this.state.selectedBets.filter(b => b.matchId !== matchId);

                // Supprime aussi la classe active du bouton correspondant
                document.querySelectorAll(`.btn-choice[data-id="${matchId}"]`).forEach(b => b.classList.remove("active"));

                this.renderAll();
            });
        });
    }
    // Affiche tous les paris sélectionnés
    renderBets() {
        this.el.betList.innerHTML = "";

        this.state.selectedBets.forEach(bet => {
            const div = document.createElement("div");
            div.className = "bet";
            div.innerHTML = `
                <strong>${bet.homeTeam} - ${bet.awayTeam}</strong>
                <span>${bet.betValue}</span>
                <button class="remove" data-id="${bet.matchId}">🗑️</button>
            `;
            this.el.betList.appendChild(div);
        });

        // Ajoute les gestionnaires de suppression
        this.attachDeleteHandlers();
    }
    // Calcule et affiche la cote totale
    renderFactor() {
        const total = this.state.selectedBets.reduce((acc, bet) => acc * parseFloat(bet.betValue), 1);
        this.el.betFactor.innerHTML = `Cote totale : <span>${total.toFixed(2)}</span>`;
        return total;
    }
    // Calcule et affiche le gain potentiel
    renderEarnings() {
        const factor = this.renderFactor(); // Récupère la cote
        const betAmount = parseFloat(this.el.input.value);
        const earnings = !isNaN(betAmount) ? (factor * betAmount) : 0;

        this.el.earnings.innerHTML = `Gain potentiel : <span>${earnings.toFixed(2)} €</span>`;
    }
    // Rafraîchit tout : liste des paris + cotes + gains
    renderAll() {
        this.renderBets();
        this.renderEarnings();
        this.saveToStorage();
    }
    saveToStorage() {
        localStorage.setItem("betApp:selectedBets", JSON.stringify(this.state.selectedBets));
    }
    loadFromStorage() {
        const stored = localStorage.getItem("betApp:selectedBets");
        if (stored) {
            this.state.selectedBets = JSON.parse(stored);
        }
    }
}

// Instanciation avec les bons sélecteurs CSS
const app = new BetApp({
    input: "#bet",
    betList: ".display-selected",
    betFactor: ".display-bet-factor",
    earnings: ".display-earnings",
    matches: ".display-bets"
});

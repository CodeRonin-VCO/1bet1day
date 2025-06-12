// ==== Sélections ====
const btnMoonTheme          = document.querySelector(".theme-moon");
const btnSunTheme           = document.querySelector(".theme-sun");
const tagMain               = document.querySelector("main");

// Affichage paris
const containerTeamList     = document.querySelector(".display-teams");
const containerBtnBet       = document.querySelector(".display-bets");

// Affichage mes paris
const containerSelectedBet  = document.querySelector(".display-selected");
const inputBetAmount        = document.querySelector("#bet");
const containerTotalOdds    = document.querySelector(".display-bet-factor");
const containerEarnings     = document.querySelector(".display-earnings");

// ==== Variables ====
const ARRAY_BACKGROUND_IMAGES = [`../images/bg1.png`, `../images/bg2.png`, `../images/bg3.png`, `../images/bg.jpg`]
let arraySelectedBets = [];

// ==== Fonctions utilitaires ==== 
function createElement(tag, className, content) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }
    if (content) {
        element.innerHTML = content;
    }
    return element;
}
function appendElement(parent, child) {
    parent.append(child);
}

// ==== Random bg-img ====
const randomBg = ARRAY_BACKGROUND_IMAGES[Math.floor(Math.random()*ARRAY_BACKGROUND_IMAGES.length)]
tagMain.style.background = `url(${randomBg}) no-repeat right bottom/40%`;

// ==== API & Async fct° ====
async function getApi() {
    try {
        const response = await fetch(`../scripts/datas.json`);
        const data = await response.json();

        console.log(data.matchs, "base data");
        
        return data.matchs
    }
    catch (error) {
        console.error(error);
    }
}
async function displayApi() {
    const matches = await getApi();

    matches.forEach(match => {
        // Affichage "équipe"
        const teams = createElement("div", "", `${match.hometeam}-${match.awayteam}`)
        appendElement(containerTeamList, teams);

        // Affichage "indice score"
        const indiceScore = createElement("div", `matchId-${match.match_id}`, `
        <button class="btn-choice" data-bet="home" data-id="${match.match_id}">${match.home_odd}</button> 
        <button class="btn-choice" data-bet="draw" data-id="${match.match_id}">${match.draw_odd}</button> 
        <button class="btn-choice" data-bet="away" data-id="${match.match_id}">${match.away_odd}</button>`);
        appendElement(containerBtnBet, indiceScore)
    });
}
displayApi();

// ==== Fonctions ====
function displayChosenBets() {
    containerSelectedBet.innerHTML = "";

    arraySelectedBets.forEach(element => {
        const info = createElement("div", "info", ``);
        const infoTitle = createElement("h4", "info__title", `${element.homeTeam}`);
        const infoScore = createElement("div", "info__score", `${element.betValue}`);
        const infoDelete = createElement("button", "info__delete", `🗑️`);
        const infoTeams = createElement("small", "info__teams", `${element.homeTeam}-${element.awayTeam}`);

        appendElement(containerSelectedBet, info);
        appendElement(info, infoTitle);
        appendElement(info, infoScore);
        appendElement(info, infoDelete);
        appendElement(info, infoTeams);

        infoDelete.addEventListener("click", function (event) {
            arraySelectedBets = arraySelectedBets.filter(bet => bet.matchId !== element.matchId);

            // Retirer la classe du tableau
            document.querySelectorAll(`.btn-choice[data-id="${element.matchId}"]`).forEach(btn => {
                btn.classList.remove("active");
            });
            // Il faut rafraichir les éléments du DOM => on rappelle nos deux fonctions de calcul
            displayChosenBets();
            displayTotalBetFactor();
        });
    });
};
function displayTotalBetFactor() {
    containerTotalOdds.innerHTML = "";

    const totalFactor = arraySelectedBets.reduce((accumulator, bet) => accumulator + parseFloat(bet.betValue), 0)

    const label = createElement("div", "", "Cote totale:");
    const tf = createElement("span", "total-factor", `${totalFactor.toFixed(2)}`);

    appendElement(containerTotalOdds, label);
    appendElement(containerTotalOdds, tf)
    displayTotalEarnings()
}
function displayTotalEarnings() {
    containerEarnings.innerHTML = "";

    const totalEarnings = parseFloat(document.querySelector(".total-factor").textContent) * parseFloat(inputBetAmount.value);

    if (!isNaN(totalEarnings)) {
        containerEarnings.innerHTML = `<div>Gain potentiel:</div> <span>${totalEarnings.toFixed(2)} €</span>`;
    } else {
        containerEarnings.innerHTML = `<div>Gain potentiel:</div> <span>0.00 €</span>`;
    }
}

// ==== Evénements ====
containerBtnBet.addEventListener("click", async function (event) {
    event.preventDefault();

    // Récupérer le bouton
    const chosenButton = event.target.closest(".btn-choice");

    if (chosenButton) {
        // Récupérer l'id du match pour traiter par ligne
        const matchId = chosenButton.dataset.id;

        if (chosenButton.classList.contains("active")) {
            chosenButton.classList.remove("active")

        } else {
            document.querySelectorAll(`.btn-choice[data-id="${matchId}"]`).forEach(el => {
                el.classList.remove("active")

                // Générer un nouveau tableau filtré (seuls les objets de pari dont l'identifiant de match ne correspond pas à matchId sont inclus dans le nouveau tableau.)
                arraySelectedBets = arraySelectedBets.filter(bet => bet.matchId !== matchId);
                displayChosenBets()
            })

            chosenButton.classList.add("active")

            // Récupérer les données du match concerné et ajouter la valeur du bouton sélectionné
            const matches = await getApi();
            const match = matches.find(el => el.match_id == matchId)
            if (match) {
                // Créer un objet de pari
                const betObject = {
                    matchId: match.match_id,
                    homeTeam: match.hometeam,
                    awayTeam: match.awayteam,
                    betType: chosenButton.dataset.bet,
                    betValue: chosenButton.textContent,
                };

                // Ajouter l'objet de pari au tableau
                arraySelectedBets.push(betObject);
                document.querySelector("aside").classList.add("active")
                displayChosenBets()
                displayTotalBetFactor()
            }            
        }
    }
})


//!!! indispensable pour que la mise à jour se fasse lorsque l'utilisateur tape une mise
inputBetAmount.addEventListener("input", displayTotalEarnings);
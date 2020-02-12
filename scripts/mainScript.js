  /////////////////////////////////
 // Setup Namespace Declaration //
/////////////////////////////////

setup = {};

  //////////////////////////////////
 // Cache Setup Screen Selectors //
//////////////////////////////////

setup.cacheSelectors = function () {
    setup.$header = $('header');
    setup.$main = $('main');
    setup.$mainWrapper = $('main .wrapper');
    setup.$footer = $('footer');
    setup.$footerLinks = $('footer ul');
    setup.$backToMenuBtn = $('#backToMenu');
    setup.$newGameBtn = $('#newGame');
    setup.$howToPlayBtn = $('#howToPlay');
    setup.$howToPlayScreen = $('.howToPlay');
    setup.$setupGameSection = $('.setupGame');
    setup.$startScreen = $('.startScreen');
    setup.$selectionScreen = $('.selectionScreen');
    setup.$selectionForm = $('.selectionForm');
    setup.$playAreaSection = $('.playArea');
    setup.$gameOverScreen = $('.gameOverScreen');
    setup.$leaderboard = $('.leaderboard ul');
    setup.$yourScore = $('.yourScore div');
    setup.$playAgainBtn = $('#playAgain');
    setup.$changePilotBtn = $('#changePilot');
    setup.mobile = window.matchMedia("(max-width: 460px)");
};

  ////////////////////
 // Event Handlers //
////////////////////

setup.toggleHowToPlay = function () {
    setup.$startScreen.toggleClass('hidden');
    setup.$footerLinks.toggleClass('hidden');
    setup.$howToPlayScreen.toggleClass('hidden');
    setup.$backToMenuBtn.toggleClass('hidden');
};

setup.startNewGame = function () {
    setup.$selectionScreen.addClass('hidden');
    setup.$setupGameSection.addClass('hidden');
    setup.$playAreaSection.removeClass('hidden');
    setup.$header.addClass('hidden');
    setup.$footer.addClass('hidden');
    setup.$main.addClass('gameMain');
    setup.$mainWrapper.addClass('gameWrapper');
    setup.$gameOverScreen.addClass('hidden');
    game.init();
};

setup.changePilot = function () {
    setup.$gameOverScreen.addClass('hidden');
    setup.$header.removeClass('hidden');
    setup.$footer.removeClass('hidden');
    setup.$main.removeClass('gameMain');
    setup.$mainWrapper.removeClass('gameWrapper');
    setup.$selectionScreen.removeClass('hidden');
    setup.$setupGameSection.removeClass('hidden');
};

  /////////////////////
 // Event Listeners //
/////////////////////

setup.eventListeners = function () {

    setup.$newGameBtn.on('click', function () {
        setup.$startScreen.addClass('hidden');
        setup.$selectionScreen.removeClass('hidden');
        // if (setup.mobile.matches) {
        //     const mainElement = document.querySelector('main');
        //     mainElement.requestFullscreen();
        // }
    });

    setup.$howToPlayBtn.on('click', setup.toggleHowToPlay);

    setup.$backToMenuBtn.on('click', setup.toggleHowToPlay);

    setup.$selectionForm.on('submit', function(e) {
        e.preventDefault();
        game.playerStats.name = $('#name').val();
        if (!game.playerStats.name) {
            game.playerStats.name = 'Unknown';
        }
        game.playerStats.ship = parseInt($('input[name="shipChoice"]:checked').val());
        setup.startNewGame();
    });

    setup.$playAgainBtn.on('click', setup.startNewGame);

    setup.$changePilotBtn.on('click', setup.changePilot);
};

  ////////////////////////////////
 // Game Over Screen Functions //
////////////////////////////////

setup.displayLeaderboard = function () {
    setup.$leaderboard.html('');
    for (let player of game.leaderboard) {

        let highlight = '';
        
        if (player.rank === game.playerStats.rank) {
            highlight = 'scoreHighlight';
        }

        const scoreToAppend = `
            <li class="${highlight}">
                <p>${player.rank}.</p>
                <p>${player.name}</p>
                <p>Time: ${player.time}</p>
                <p>Score: ${player.score}</p>
            </li>
        `;
        setup.$leaderboard.append(scoreToAppend);
    }

    const yourScore = `
        <p>${game.playerStats.rank}.</p>
        <p>${game.playerStats.name}</p>
        <p>Time: ${game.playerStats.time.timePlayed}</p>
        <p>Score: ${game.playerStats.score}</p>
    `;

    setup.$yourScore.html(yourScore);

};

setup.endGameScreen = function () {
    setup.$playAreaSection.addClass('hidden');
    setup.$gameOverScreen.removeClass('hidden');
    setup.displayLeaderboard();
};

  //////////////////////////
 // Setup Initialization //
//////////////////////////

setup.init = function () {
    setup.cacheSelectors();
    setup.eventListeners();
};

  ////////////////////
 // Document Ready //
////////////////////

$(function () {
    setup.init();
});
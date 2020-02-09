setup = {};

setup.cacheSelectors = function () {
    setup.$header = $('header');
    setup.$main = $('main');
    setup.$mainWrapper = $('main .wrapper');
    setup.$footer = $('footer');
    setup.$newGameBtn = $('#newGame');
    setup.$howToPlayBtn = $('#howToPlay');
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
};

setup.eventListeners = function () {

    setup.$newGameBtn.on('click', function () {
        setup.$startScreen.addClass('hidden');
        setup.$selectionScreen.removeClass('hidden');
    });

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

setup.displayLeaderboard = function () {
    setup.$leaderboard.html('');
    let rank = 1;
    for (let player of game.leaderboard) {
        const scoreToAppend = `
            <li>
                <p>${rank}.</p>
                <p>${player.name}</p>
                <p>Time: ${player.time}</p>
                <p>Score: ${player.score}</p>
            </li>
        `;
        setup.$leaderboard.append(scoreToAppend);
        rank++;
    }

    const yourScore = `
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

setup.init = function () {
    setup.cacheSelectors();
    setup.eventListeners();
};

$(function () {
    setup.init();
});
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
};

setup.eventListeners = function () {
    setup.$newGameBtn.on('click', function () {
        setup.$startScreen.addClass('hidden');
        setup.$selectionScreen.removeClass('hidden');
    });

    setup.$selectionForm.on('submit', function(e) {
        e.preventDefault();
        game.playerName = $('#name').val();
        if (!game.playerName) {
            game.playerName = 'Anonymous';
        }
        game.playerShip = parseInt($('input[name="shipChoice"]:checked').val());
        setup.startNewGame();
    });
};

setup.startNewGame = function () {
    setup.$selectionScreen.addClass('hidden');
    setup.$setupGameSection.addClass('hidden');
    setup.$playAreaSection.removeClass('hidden');
    setup.$header.addClass('hidden');
    setup.$footer.addClass('hidden');
    setup.$main.css('height', '100vh');
    setup.$mainWrapper.addClass('gameWrapper');
    
    game.init();
};

setup.init = function () {
    setup.cacheSelectors();
    setup.eventListeners();
};

$(function () {
    setup.init();
});
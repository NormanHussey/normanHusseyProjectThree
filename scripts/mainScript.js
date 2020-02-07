setup = {};

setup.cacheSelectors = function () {
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
};

setup.init = function () {
    setup.cacheSelectors();
    setup.eventListeners();
};

$(function () {
    setup.init();
});
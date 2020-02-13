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
    setup.$musicBtn = $('.musicBtn');
    setup.$musicCheckbox = $('.musicBtn span');
    setup.$sfxBtn = $('.sfxBtn');
    setup.$sfxCheckbox = $('.sfxBtn span');
    setup.$fullscreenBtn = $('.fullscreenBtn');
    setup.$fullscreenCheckbox = $('.fullscreenBtn span');
    setup.$selectionForm = $('.selectionForm');
    setup.$playAreaSection = $('.playArea');
    setup.$gameOverScreen = $('.gameOverScreen');
    setup.$leaderboard = $('.leaderboard ul');
    setup.$yourScore = $('.yourScore div');
    setup.$playAgainBtn = $('#playAgain');
    setup.$changePilotBtn = $('#changePilot');
};

  ////////////////////
 // Event Handlers //
////////////////////

// Add or Remove the How To Play screen
setup.toggleHowToPlay = function () {
    setup.$startScreen.toggleClass('hidden');
    setup.$footerLinks.toggleClass('hidden');
    setup.$howToPlayScreen.toggleClass('hidden');
    setup.$backToMenuBtn.toggleClass('hidden');
};

// Start a new game
setup.startNewGame = function () {
    // Hide the selection screen
    setup.$selectionScreen.addClass('hidden');
    setup.$setupGameSection.addClass('hidden');
    // Unhide the playArea section
    setup.$playAreaSection.removeClass('hidden');
    // Hide the header and footer
    setup.$header.addClass('hidden');
    setup.$footer.addClass('hidden');
    // Make the main section the full viewport height
    setup.$main.addClass('gameMain');
    // Give the main section a narrower wrapper to fit the arcade style aesthetic
    setup.$mainWrapper.addClass('gameWrapper');
    // Make sure the game over (leaderboard) screen is hidden (in case this is not the first time playing)
    setup.$gameOverScreen.addClass('hidden');
    // Start the game
    game.init();
};

// Show the selection screen so that the player can change their name, ship, and gameplay options
setup.changePilot = function () {
    // Hide the game over (leaderboard) screen
    setup.$gameOverScreen.addClass('hidden');
    // Unhide the header
    setup.$header.removeClass('hidden');
    // Set the main section back to its original height
    setup.$main.removeClass('gameMain');
    // Set the main section back to its original wrapper
    setup.$mainWrapper.removeClass('gameWrapper');
    // Unhide the selection screen
    setup.$selectionScreen.removeClass('hidden');
    setup.$setupGameSection.removeClass('hidden');
};

// Check the current music selection and update the checkbox icon accordingly (if checked then it should have a checked icon, if unchecked then it should have an empty square icon)
setup.checkMusicSelection= function (checked = true) {
    if (setup.$musicBtn['0'].previousElementSibling.checked === checked) {
        setup.$musicCheckbox.html('<i class="far fa-check-square"></i>');
        game.musicEnabled = true;
    } else {
        setup.$musicCheckbox.html('<i class="far fa-square"></i>');
        game.musicEnabled = false;
    }
};

// Check the current sound fx selection and update the checkbox icon accordingly (if checked then it should have a checked icon, if unchecked then it should have an empty square icon)
setup.checkSfxSelection = function (checked = true) {
    if (setup.$sfxBtn['0'].previousElementSibling.checked === checked) {
        setup.$sfxCheckbox.html('<i class="far fa-check-square"></i>');
        game.sfxEnabled = true;
    } else {
        setup.$sfxCheckbox.html('<i class="far fa-square"></i>');
        game.sfxEnabled = false;
    }
};

// Check the current fullscreen selection and update the checkbox icon accordingly (if checked then it should have a checked icon, if unchecked then it should have an empty square icon)
setup.checkFullscreenSelection = function (checked = true) {
    if (setup.$fullscreenBtn['0'].previousElementSibling.checked === checked) {
        setup.$fullscreenCheckbox.html('<i class="far fa-check-square"></i>');
        // Fullscreen is checked so go into fullscreen mode
        setup.$main['0'].requestFullscreen();
    } else {
        setup.$fullscreenCheckbox.html('<i class="far fa-square"></i>');
        // Fullscreen is unchecked so exit fullscreen mode
        document.exitFullscreen();
    }
};

// Check each of the selection options
setup.checkOptionSelections = function () {
    setup.checkMusicSelection();
    setup.checkSfxSelection();
    setup.checkFullscreenSelection();
};

  /////////////////////
 // Event Listeners //
/////////////////////

setup.eventListeners = function () {

    setup.$newGameBtn.on('click', function () {
        setup.$startScreen.addClass('hidden');
        setup.$selectionScreen.removeClass('hidden');
        setup.$footer.addClass('hidden');
        setup.$main.addClass('selectionMain');
        setup.checkOptionSelections();
    });

    setup.$howToPlayBtn.on('click', setup.toggleHowToPlay);

    setup.$backToMenuBtn.on('click', setup.toggleHowToPlay);

    setup.$musicBtn.on('click', function () {
        setup.checkMusicSelection(false);
    });

    setup.$sfxBtn.on('click', function () {
        setup.checkSfxSelection(false);
    });

    setup.$fullscreenBtn.on('click', function () {
        setup.checkFullscreenSelection(false);
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
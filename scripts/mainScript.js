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
    setup.$musicInput = $('#music');
    setup.$musicCheckbox = $('.musicBtn span');
    setup.$sfxBtn = $('.sfxBtn');
    setup.$sfxInput = $('#sfx');
    setup.$sfxCheckbox = $('.sfxBtn span');
    setup.$fullscreenBtn = $('.fullscreenBtn');
    setup.$fullscreenInput = $('#fullscreen');
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
        // Enable in-game music
        game.musicEnabled = true;
    } else {
        setup.$musicCheckbox.html('<i class="far fa-square"></i>');
        // Disable in-game music
        game.musicEnabled = false;
    }
};

// Check the current sound fx selection and update the checkbox icon accordingly (if checked then it should have a checked icon, if unchecked then it should have an empty square icon)
setup.checkSfxSelection = function (checked = true) {
    if (setup.$sfxBtn['0'].previousElementSibling.checked === checked) {
        setup.$sfxCheckbox.html('<i class="far fa-check-square"></i>');
        // Enable in-game sound fx
        game.sfxEnabled = true;
    } else {
        setup.$sfxCheckbox.html('<i class="far fa-square"></i>');
        // Disable in-game sound fx
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
        // Hide the start screen
        setup.$startScreen.addClass('hidden');
        // Unhide the selection screen
        setup.$selectionScreen.removeClass('hidden');
        // Hide the footer section
        setup.$footer.addClass('hidden');
        // Adjust the main section height to account for the removed footer
        setup.$main.addClass('selectionMain');
        // Check each of the selection options
        setup.checkOptionSelections();
    });

    // Open the How to Play section
    setup.$howToPlayBtn.on('click', setup.toggleHowToPlay);

    // Return to the main menu
    setup.$backToMenuBtn.on('click', setup.toggleHowToPlay);

    // Check/uncheck the music selection
    setup.$musicBtn.on('click', function () {
        setup.checkMusicSelection(false);
    });

    // Check/uncheck the sound fx selection
    setup.$sfxBtn.on('click', function () {
        setup.checkSfxSelection(false);
    });

    // Check/uncheck the fullscreen selection
    setup.$fullscreenBtn.on('click', function () {
        setup.checkFullscreenSelection(false);
    });

    setup.$selectionScreen.on('keypress', function (e) {
        // If the spacebar is pressed while in the selection screen
        if (e.which === 32) {
            if (setup.$musicInput.is(':focus')) {
                // If the music selection is in focus then check the music selection
                setup.checkMusicSelection(false);
            } else if (setup.$sfxInput.is(':focus')) {
                // If the sound fx selection is in focus then check the sound fx selection
                setup.checkSfxSelection(false);
            } else if (setup.$fullscreenInput.is(':focus')) {
                // If the fullscreen selection is in focus then check the fullscreen selection
                setup.checkFullscreenSelection(false);
            }
        }
    });

    // Submitting the game selection form
    setup.$selectionForm.on('submit', function(e) {
        // Prevent the form from refreshing the page
        e.preventDefault();
        // Set the player's name with the name entered into the name input
        game.playerStats.name = $('#name').val();
        if (!game.playerStats.name) {
            // If the player did not enter their name then set the player name to "Unknown"
            game.playerStats.name = 'Unknown';
        }
        // Store the value of the ship that the player chose
        game.playerStats.ship = parseInt($('input[name="shipChoice"]:checked').val());
        // Start a new game
        setup.startNewGame();
    });

    // Start another game
    setup.$playAgainBtn.on('click', setup.startNewGame);

    // Open the change pilot screen
    setup.$changePilotBtn.on('click', setup.changePilot);
};

  ////////////////////////////////
 // Game Over Screen Functions //
////////////////////////////////

setup.displayLeaderboard = function () {
    // Clear the leaderboard
    setup.$leaderboard.html('');

    for (let player of game.leaderboard) {
        // Iterate through all the entries in the leaderboard
        let highlight = '';
        
        if (player.rank === game.playerStats.rank) {
            // If the current entry has the same rank as the player stats object then this is the most recent game so we will highlight that entry so that the player can easily find themselves in the leaderboard
            highlight = 'scoreHighlight';
        }

        // Create HTML with the current entry information and if it is the most recent game then it will have the scoreHighlight class added
        const scoreToAppend = `
            <li class="${highlight}">
                <p>${player.rank}.</p>
                <p>${player.name}</p>
                <p>Time: ${player.time}</p>
                <p>Score: ${player.score}</p>
            </li>
        `;
        // Append the HTML entry to the on-screen leaderboard UL
        setup.$leaderboard.append(scoreToAppend);
    }

    // Create HTML with the most recent game information
    const yourScore = `
        <p>${game.playerStats.rank}.</p>
        <p>${game.playerStats.name}</p>
        <p>Time: ${game.playerStats.time.timePlayed}</p>
        <p>Score: ${game.playerStats.score}</p>
    `;

    // Display the most recent game information at the bottom of the screen. This is so that even if the player doesn't place on the leaderboard, they can still see their score and time
    setup.$yourScore.html(yourScore);

};

setup.endGameScreen = function () {
    // Hide the play area
    setup.$playAreaSection.addClass('hidden');
    // Unhide the game over (leaderboard) screen
    setup.$gameOverScreen.removeClass('hidden');
    // Update the leaderboard with the correct information
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
  ////////////////////////////////
 // Game Namespace Declaration //
////////////////////////////////

const game = {};

  ////////////////////////////////////////////////////
 // Initialize Starting Variables on the Namespace //
////////////////////////////////////////////////////

game.playerStats = {};


game.setupNewGame = function() {

    // Initialize a gameboard object to store important data like the element, size, and position and also a move function to create the scrolling background effect
    game.board = {
        $element: setup.$playAreaSection,
        top: 0,
        left: 0,
        width: setup.$playAreaSection.width(),
        height: setup.$playAreaSection.height(),
        wPercent: setup.$playAreaSection.width() / 100,
        hPercent: setup.$playAreaSection.height() / 100,
        move: function(x, y) {
            const newX = parseInt(this.$element.css('--bgX')) + x;
            const newY = parseInt(this.$element.css('--bgY')) + y;
            this.$element.css('--bgX', newX + 'px');
            this.$element.css('--bgY', newY + 'px');
        }
    };

    // Cache the window
    game.$window = $(window);

    // Initialize important game variables, arrays, and objects
    game.over = false;
    game.speed = 1;
    game.slowMotion = false;
    game.wave = 0;
    game.waveEnemies = [];
    game.updatingActors = [];
    game.keys = {};
    
    // Store the player's start position on the Stats object
    game.playerStats.start = {
        x: game.board.width / 2,
        y: game.board.height - (game.board.hPercent * 15)
    };
    
    // Store the score on the Stats object
    game.playerStats.score = 0;

    // Store the time played into an object on Stats
    game.playerStats.time = {
        secondsElapsed: 0,
        mins: 0,
        secs: 0,
        timePlayed: '0:00'
    };
    
    // Cache the selectors for displaying useful information to the player
    game.display ={
        $health: $('#health'),
        $score: $('#score'),
        $wave: $('#wave')
    };
    
    // Store an array of available ship types
    game.ships = [
        'url("../assets/ships/greenShip.gif")',
        'url("../assets/ships/redSilverShip.gif")',
        'url("../assets/ships/bigBlueShip.gif")',
        'url("../assets/ships/bigRedShip.gif")',
        'url("../assets/ships/biggerRedShip.gif")',
        'url("../assets/ships/bigGreenShip.gif")',
        'url("../assets/ships/sleekBlueShip.gif")',
    ];

    // Filter the ships array to remove the ship that the player chose so that enemies will never have the same ship as the player
    game.enemyShips = game.ships.filter(function (ship, index) {
        return index !== game.playerStats.ship;
    });
    
    // Create different weapon types with assets and attributes
    game.weaponTypes = [
        {
            type: 'singleShot',
            reloadDelay: 15,
            damage: 1,
            decayDistance: game.board.hPercent * 20,
            decayRate: Infinity,
            asset: 'url("../assets/green_bullet.gif")'
        },
        {
            type: 'spread',
            reloadDelay: 25,
            damage: 1,
            decayDistance: game.board.hPercent * 20,
            decayRate: Infinity,
            asset: 'url("../assets/magenta_bullet.gif")'
        },
        {
            type: 'homingMissile',
            reloadDelay: 40,
            damage: 3,
            decayDistance: Infinity,
            decayRate: 75,
            asset: 'url("../assets/red_bullet.gif")'
        },
    ];
    
    // Create different pickup types with assets
    game.pickupTypes = [
        {
            type: 'health',
            asset: 'url("../assets/pickups/healthPickup.png")'
        },
        {
            type: 'singleShot',
            asset: 'url("../assets/pickups/singleShotPickup.png")'
        },
        {
            type: 'spread',
            asset: 'url("../assets/pickups/spreadPickup.png")'
        },
        {
            type: 'homingMissile',
            asset: 'url("../assets/pickups/homingMissilePickup.png")'
        },
        {
            type:'nuke',
            asset: 'url("../assets/pickups/nukePickup.png")'
        },
        {
            type:'slowMotion',
            asset: 'url("../assets/pickups/sloMoPickup.png")'
        }
    ];

};

  ////////////////////////
 // Class Declarations //
////////////////////////

// The following audio classes are created as a solution to the limitation of javascript only being able to play an audio once through to the end before beginning another one. By creating separate audio channels and an audio switcher, the game can play the same file in another channel even while it is already currently playing. In other words, this will allow overlapping audio.

class AudioChannel {
    // Take the supplied url and create an audio object with that source
    constructor(source) {
        this.source = source;
        this.resource = new Audio(source);
    }

    // When play() is called, first check if the game is currently in slow motion and if so, slow down the playback rate, otherwise keep it normal. Then play the audio object.
    play() {
        if (game.slowMotion) {
            this.resource.playbackRate = 0.5;
        } else {
            this.resource.playbackRate = 1.0;
        }
        this.resource.play();
    }

    // When stop() is called, pause the audio object and reset it to the beginning.
    stop() {
        this.resource.pause();
        this.resource.currentTime = 0;
    }
}


class AudioSwitcher {
    // Create a switcher with a source url and a set number of channels. 
    constructor(source, numberOfChannels) {
        this.channels = [];
        this.source = source;
        this.numberOfChannels = numberOfChannels;
        this.index = 0;

        // Create as many new audio channel objects as the numberOfChannels and place each of them into the channels array
        for (var i = 0; i < this.numberOfChannels; i++) {
            this.channels.push(new AudioChannel(this.source));
        }
    }

    // When play() is called, first check if Sound FX is enabled and if so, play the current channel. Then increment the index property so that the next channel will play when this is called next.
    play() {
        if (game.sfxEnabled) {
            this.channels[this.index].play();
            this.index++;
            // Check that index is not longer than the length of the channels array and if it is, set it back to the beginning.
            if (this.index >= this.channels.length) {
                this.index = 0;
            }
        }
    }
}


// Create all the sound fx objects using the AudioSwitcher class and store them in an object on the namespace.

game.sfx = {
    explosion: new AudioSwitcher('./assets/audio/sfx/explosion.ogg', 3),
    pew: new AudioSwitcher('./assets/audio/sfx/pew.wav', 3),
    pickup: new AudioSwitcher('./assets/audio/sfx/pickup.wav', 2)
};

// Create an object of music containing audio objects for each music track. The AudioSwitcher and AudioChannel classes are not necessary for the music because there is only ever one song being played at a time and it always plays to the end (unless the game ends first)
game.music = {
    track01: new Audio('./assets/audio/music/track01-DontBeA.mp3'),
    track02: new Audio('./assets/audio/music/track02-LavaFlow.mp3'),
    track03: new Audio('./assets/audio/music/track03-GameAtHeart.mp3'),
    track04: new Audio('./assets/audio/music/track04-FerrousRage.mp3'),
    track05: new Audio('./assets/audio/music/track05-FrigidTriumph.mp3'),
    track06: new Audio('./assets/audio/music/track06-ReallyDangerous.mp3')
};

// Create a playlist array so that we play our tracks in a specific order.
game.playList = [
    game.music.track01,
    game.music.track02,
    game.music.track03,
    game.music.track04,
    game.music.track05,
    game.music.track06
];

// Create a variable to keep track of the current song being played
game.currentTrack = 0;



// Create a base "Actor" class that will manage all the dynamic game objects (anything that changes through the course of the game and must react to external stimuli)

class Actor {
    // Store the given x and y position, the HTML element, and check if this should be deployed to the DOM immediately or not
    constructor(x, y, element, type, deploy = true) {
        this.position = {
            x: x,
            y: y,
        };
        // Store a jQuery object of the HTML element for this Actor
        this.$element = $(element);
        this.type = type;
        if (deploy) {
            this.deploy();
        }
    }

    // Getters for positioning

    get top() {
        return this.position.y;
    }

    get left() {
        return this.position.x;
    }

    get bottom() {
        return this.position.y + this.height;
    }

    get right() {
        return this.position.x + this.width;
    }

    get centreX() {
        this.position.x + this.width / 2;
    }

    get centreY() {
        this.position.x + this.height / 2;
    }

    // The deploy() function adds this object to the gameboard (the DOM)
    deploy() {
        game.board.$element.append(this.$element);
        this.$element.css('--x', this.position.x + 'px');
        this.$element.css('--y', this.position.y + 'px');
        this.width = this.$element.width();
        this.height = this.$element.height();
        // Add this Actor to an array that will iterate over all currently active Actors
        game.updatingActors.push(this);
    }

    // Collision Detection
    checkCollision(avoidance = 0) {
        // Iterate over all active Actors on the gameboard
        for (let i = 0; i < game.updatingActors.length; i++) {
            const actor = game.updatingActors[i];
            // If the current Actor is not me then do the following
            if (actor !== this) {
                // Avoidance is a buffer that will allow smarter enemies to avoid colliding with each other
                const actorLeft = actor.left - avoidance;
                const actorRight = actor.right + avoidance;
                const actorTop = actor.top - avoidance;
                const actorBottom = actor.bottom + avoidance;
                // Check if I am colliding with the current Actor
                if (actorLeft < this.right && actorRight > this.left && actorTop < this.bottom && actorBottom > this.top ) {
                    // If so then create a collider object with important information about the Actor that I am colliding with
                    const collider = {};
                    // Store the actor itself into this collider object
                    collider.actor = actor;
                    // Store the direction that the collision is coming from
                    if (actor.bottom >= (this.top - 1) && actor.bottom <= (this.top + 1)) {
                        collider.collideFrom = 'top';
                    } else if (actor.top <= (this.bottom + 1) && actor.top >= (this.bottom - 1)) {
                        collider.collideFrom = 'bottom';
                    } else if (actor.left <= (this.right + 1) && actor.left >= (this.right - 1)) {
                        collider.collideFrom = 'right';
                    } else {
                        collider.collideFrom = 'left';
                    }
                    // Return the collider object
                    return collider;
                };
            };
        };
        // I have checked every active actor on the gameboard and I am not colliding with any of them so return false
        return false;
    }

    // An update function that will be called on every active Actor once per animation frame
    update() {
        let movementLimitation = false;
        // Check collision with all active actors
        const collidingObject = this.checkCollision();
        // If there is a collision, then call the handleCollision() function to deal with it by passing the collision information to it
        if (collidingObject) {
            movementLimitation = this.handleCollision(collidingObject);
        }
        // Call the move() function to move this Actor and pass it any movement limitation information if there is any
        this.move(movementLimitation);
        // Call the drawSelf() function to update the Actor's position on the gameboard
        this.drawSelf();
    }

    // The drawSelf() function updates the Actor's position on the gameboard
    drawSelf() {
        this.$element.css('--x', this.position.x + 'px');
        this.$element.css('--y', this.position.y + 'px');
    }
}

// Create a pickup subclass of Actor to handle the pick up objects
class Pickup extends Actor {
    // Create the pickup object with x and y positions, the pickup type, and the speed that it is travelling
    constructor(x, y, pickupType, speed) {
        const element = `<div class="pickup">`;
        // Pass the necessary information into the Actor super constructor
        super(x, y, element, 'pickup', true);
        this.pickupType = pickupType;
        this.speed = speed;
        // Set the element to have the correct background image based on the pickupTypes object
        this.$element.css('--imgUrl', this.pickupType.asset);
    }

    // Handle collisions with other Actors
    handleCollision(collider) {
        // If the collider is not a bullet then do the following
        if (collider.actor.type !== 'bullet') {
            // Play the pickup sound effect
            game.sfx.pickup.play();
            // Perform different actions based on the pickup type
            switch(this.pickupType.type) {
                // If it is a health pickup then give the colliding Actor 3 health
                case 'health':
                    collider.actor.health += 3;
                    break;

                // If it is a singleShot pickup then set the colliding Actor's weapon to be the singleShot
                case 'singleShot':
                    collider.actor.weaponType = game.weaponTypes[0];
                    break;

                // If it is a spread shot pickup then set the colliding Actor's weapon to be the spread shot
                case 'spread':
                    collider.actor.weaponType = game.weaponTypes[1];
                    break;

                // If it is a homing missile pickup then set the colliding Actor's weapon to be the homing missile
                case 'homingMissile':
                    collider.actor.weaponType = game.weaponTypes[2];
                    break;

                // If it is the nuke pickup type then do the following
                case 'nuke':
                    // Iterate over all enemies in the current wave
                    for (let enemy of game.waveEnemies) {
                        // If this enemy is currently on the gameboard then
                        if (enemy.deployed) {
                            // Set the enemy's health to 0 and set the hitBy property to "player" in order to give the player score credit
                            enemy.hitBy = 'player';
                            enemy.health = 0;
                        }
                    }
                    break;

                // If it is the slow motion pickup type then do the following
                case 'slowMotion':
                    // Store the current game speed in a temporary variable
                    const currentGameSpeed = game.speed;
                    // Set the game speed to be very slow
                    game.speed = 0.25;
                    // Set slow motion to true
                    game.slowMotion = true;
                    // Set the playback rate of the music to be very slow as well
                    game.playList[game.currentTrack].playbackRate = 0.5;
                    // After 3 seconds, switch the game speed and music playback speed back to normal
                    setTimeout(function () {
                        game.playList[game.currentTrack].playbackRate = 1.0;
                        game.speed = currentGameSpeed;
                        game.slowMotion = false;
                    }, 3000)
                    break;

            }
            // Destroy this pickup because it has been "picked up"
            game.deleteActor(this);
        }
    }

    // Move the pickup down the gameboard by the speed that it was given at creation (the same speed as the enemy who dropped it)
    move() {
        this.position.y += this.speed * game.speed;
    }

    // On every update check to see if this pickup has reached the bottom of the gameboard. If it has then delete it, if it hasn't then run the Actor class's update() function
    update() {
        if (this.top >= game.board.height) {
            game.deleteActor(this);
        } else {
            super.update();
        }
    }

}

// Create a bullet subclass of the Actor class to handle all projectiles (bullets)
class Bullet extends Actor {
    constructor(x, y, yDirection, xDirection, speed, damage = 1, firedBy, weaponType, target = undefined) {
        const element = '<div class="bullet">';
        // Call the super constructor to create the Actor
        super(x, y, element, 'bullet');
        // Store all the given variables to properties on the bullet
        this.yDirection = yDirection;
        this.xDirection = xDirection;
        this.speed = speed;
        this.damage = damage;
        this.firedBy = firedBy;
        this.weaponType = weaponType;
        this.decayDistance = this.weaponType.decayDistance;
        this.decayRate = this.weaponType.decayRate;
        this.decay = 0;
        // Store the starting y position of the bullet
        this.startY = y;
        // Set the background image of the element to the correct weapon asset
        this.$element.css('--imgUrl', this.weaponType.asset);
        this.target = target;
    }

    update() {
        // If the game is not in slow motion then increment the decay factor (which is based on time)
        if (!game.slowMotion) {
            this.decay++;
        }
        // If the decay factor has met or exceeded the decay rate limit (it has reached the end of its lifetime) then destroy this bullet
        if (this.decay >= this.decayRate) {
            game.deleteActor(this);
        }
        // Check if the bullet has reached it's decay distance (some bullet types will destroy themselves over a specified period of time whereas others will destroy themselves based on the distance they've travelled in their lifetime)
        if ((this.yDirection === 1 && this.position.y >= this.startY + this.decayDistance) || (this.yDirection === -1 && this.position.y <= this.startY - this.decayDistance)) {
            // If it has reached it's maximum distance then destroy this bullet
            game.deleteActor(this);
        } else {
            // If it has not, then check if it has reached the bottom of the gameboard
            if (this.position.y < this.height || this.bottom > game.board.height - this.height) {
                // If it has reached the bottom of the gameboard without colliding with anything then destroy it
                game.deleteActor(this);
            } else {
                // If it hasn't then call the Actor's update() function
                super.update();
            }
        }
    }

    move() {
        // If this bullet does not have a target (it is not a homing missile) or it has only been alive for a short time (10th of a second)
        if (!this.target || this.decay < 10) {
            // Change the position of the bullet based on its speed and direction (speed is multiplied by 2 so that it is always faster than the scrolling background and therefore is actually moving)
            this.position.y += (game.speed * (this.speed * 2) * this.yDirection);
            this.position.x += (game.speed * (this.speed * 2) * this.xDirection);
        } else {
            // If this bullet has a target and therefore is a homing missile then check the bullet's position against the target position

            if (this.target.position.y < this.position.y) {
                // If the target is above the bullet then move up
                this.position.y -= (game.speed * (this.speed * 2));
            } else if (this.target.position.y > this.position.y) {
                // If the target is below the bullet then move down
                this.position.y += (game.speed * (this.speed * 2));
            }

            if (this.target.position.x < this.position.x) {
                // If the target is to the left of the bullet then move to the left
                this.position.x -= (game.speed * (this.speed * 2));
            } else if (this.target.position.x > this.position.x) {
                // If the target is to the right of the bullet then move to the right
                this.position.x += (game.speed * (this.speed * 2));
            }
            
        }
    }

    handleCollision(collider) {
        // If the colliding actor has a health property
        if (collider.actor.health) {
            // Reduce the collider's health by the damage amount
            collider.actor.health -= this.damage;
            // Set the actor's hitBy property to be the Actor type that fired this bullet
            collider.actor.hitBy = this.firedBy;
            // Call showHit() on the collider
            collider.actor.showHit();
        }
        // Destroy this bullet
        game.deleteActor(this);
    }

    drawSelf() {
        // Call drawSelf() from the Actor class
        super.drawSelf();
        // Change the angle of the bullet to match the angle that it was fired at (if it was a spread shot bullet)
        if (this.yDirection === 1) {
            if (this.xDirection < 0) {
                this.$element.css('--angle', '225deg');
            } else if (this.xDirection > 0) {
                this.$element.css('--angle', '135deg');
            } else {
                this.$element.css('--angle', '180deg');
            }
        } else {
                if (this.xDirection < 0) {
                    this.$element.css('--angle', '-45deg');
                } else if (this.xDirection > 0) {
                    this.$element.css('--angle', '45deg');
                } else {
                    this.$element.css('--angle', '0deg');
                }
        }
    }
}

// Create a Ship subclass of Actor to handle all ship objects (player and enemy)
class Ship extends Actor {
    constructor(x, y, type, deploy = true, health = 5, shipNumber = 0, minReloadSpeed, weaponType = 0) {
        const element = '<div class="ship">';
        // Call the super constructor with the given properties
        super(x, y, element, type, deploy);
        this.health = health;
        // Assign this ship's element the background image of the player selected ship
        this.$element.css('--imgUrl', game.ships[shipNumber]);
        this.movement = 0;
        this.direction = -1;
        this.speed = 1;
        this.reloadCounter = 0;
        this.minReloadSpeed = minReloadSpeed;
        this.reloadSpeed = this.minReloadSpeed;
        // Set the weapon type for this ship
        this.weaponType = game.weaponTypes[weaponType];
    }

    // Display feedback when this ship has been hit by a bullet
    showHit() {
        // Set the ship's element to have a translucent red circle around it
        this.$element.css('--colour', 'rgba(255, 0, 0, 0.4)');
        this.$element.css('border-radius', '50%');
        const thisActor = this;
        // After 200ms, remove the red circle from the element
        setTimeout(function () {
            thisActor.$element.css('--colour', 'rgba(0, 0, 0, 0)');
            thisActor.$element.css('border-radius', '0');
        }, 200);
    }

    // Take in a moment value from the player and set the movement property to it
    inputMove(movement) {
        this.movement = movement;
    }

    move(movementLimitation) {
        // If there is a movement limitation by collision then do the following
        if (movementLimitation) {
            if (movementLimitation === 'left' && this.movement < 0) {
                // If there is collision coming from the left and this ship is trying to move left then don't allow the movement by returning false
                return false;
            } else if (movementLimitation === 'right' && this.movement > 0) {
                // If there is collision coming from the right and this ship is trying to move right then don't allow the movement by returning false
                return false;
            }
        } else {
            // If there is no movement limitation by collision then check if the ship is trying to move outside of the bounds of the gameboard
            const proposedMovement = this.position.x + this.movement;
            if (proposedMovement >= game.board.left && proposedMovement <= (game.board.width - this.width)) {
                // If the ship is trying to move within the bounds of the gameboard then set the position to the proposed movement
                this.position.x = proposedMovement;
            }
            // Reset the movement property to prepare for the next movement input from the player
            this.movement = 0;
        }
    }

    handleCollision(collider) {
        if (collider.actor.type !== 'bullet' && collider.actor.type !== 'pickup') {
            // If the colliding actor is not a bullet or a pick up then do the following
            // Set the hitBy to the collider's type
            this.hitBy = collider.actor.type;
            // Lower both ships' health by the amount of the other ship's speed
            this.health -= (collider.actor.speed);
            collider.actor.health -= this.speed;
            collider.actor.showHit();
            // Return the direction that the collision came from
            return collider.collideFrom;
        }
    }

    // Check this ship's health
    checkHealth() {
        // If the health is less than or equal to zero (the ship is dead)
        if (this.health <= 0) {
            // If this is the player then
            if (this.type === 'player') {
                // Set the health to zero so that the display doesn't show a negative number
                this.health = 0;
                // End the game
                game.endGame();
            } else {
                // If this is an enemy
                if (this.hitBy === 'player') {
                    // If this enemy was hit by the player then increase the player's score by the enemy's score value
                    game.playerStats.score += this.scoreValue;
                }
                // Drop a pickup
                this.dropPickUp();
            }
            // Kill this ship
            this.die();
        }
    }
    
    die() {
        // Create an explosion at this ship's position
        game.createExplosion(this.position.x, this.position.y);     
        // Delete this actor   
        game.deleteActor(this);
    }

    update() {
        // Increment the reload counter
        this.reloadCounter++;
        // Call the Actor's update() function
        super.update();
        // Check this ship's health to see if it's dead
        this.checkHealth();
    }

    // If this ship is using homing missiles then we need to find a target
    findHomingTarget() {
        let nearestEnemy;
        // Declare a variable that will be used to compare the distance of the nearest enemy and initialize it to the full width of the gameboard which is the maximum distance that any enemy could be along the x axis
        let nearestEnemyPos = game.board.width;
        // Iterate through all enemies in the current wave
        for (let enemy of game.waveEnemies) {
            // If this enemy is currently on the gameboard
            if (enemy.deployed) {
                // Compare the absolute distance from the player ship to the enemy ship along the x axis
                const positionDifference = Math.abs(this.position.x - enemy.position.x);
                if (positionDifference < nearestEnemyPos) {
                    // If this is the nearest ship we've found so far then set the nearest enemy to this one before continuing through the rest of the enemies in the wave
                    nearestEnemyPos = positionDifference;
                    nearestEnemy = enemy;
                }
            }
        }
        // The nearest enemy has been found so return it
        return nearestEnemy;
    }

    // Fire the ship's weapon
    fire() {
        // Set the reload speed to this weapon's reload delay plus the minimum reload speed (if this is an enemy ship)
        this.reloadSpeed = this.minReloadSpeed + this.weaponType.reloadDelay;
        // Reset the reload counter
        this.reloadCounter = 0;
        let bulletY;
        if (this.direction === 1) {
            // If the bullet is travelling downwards then set it's initial y value to be the bottom of this ship plus the bullet's height
            bulletY = this.bottom + game.bulletHeight;
        } else {
            // If the bullet is travelling upwards then set it's initial y value to be the top of this ship minus the bullet's height
            bulletY = this.position.y - game.bulletHeight;
        };
        // Check the current weapon type and fire the bullet(s) accordingly
        switch (this.weaponType.type) {
            // If it is a single shot
            case 'singleShot':
                // Create a single bullet at this position, headed in the same direction
                const newBullet = new Bullet(this.position.x + this.width / 2, bulletY, this.direction, 0, this.speed, this.weaponType.damage, this.type, this.weaponType);
                break;
                
            // If it is a spread shot
            case 'spread':
                // Create one bullet to the left
                const newBullet1 = new Bullet(this.position.x + this.width / 2 - game.bulletWidth, bulletY, this.direction, -1, this.speed, this.weaponType.damage, this.type, this.weaponType);
                // Create one bullet in the middle
                const newBullet2 = new Bullet(this.position.x + this.width / 2, bulletY, this.direction, 0, this.speed, this.weaponType.damage, this.type, this.weaponType);
                // Create one bullet to the right
                const newBullet3 = new Bullet(this.position.x + this.width / 2 + game.bulletWidth, bulletY, this.direction, 1, this.speed, this.weaponType.damage, this.type, this.weaponType);
                break;

            // If it is a homing missile
            case "homingMissile":
                // Find the homing target for this bullet
                const target = this.findHomingTarget();
                // Create the bullet
                const newBulletHoming = new Bullet(this.position.x + this.width / 2, bulletY, this.direction, 0, this.speed, 1, this.type, this.weaponType, target);
                break;
        };
        // Play the bullet "pew" sound effect
        game.sfx.pew.play();
    }

};

// Create an Enemy subclass of the Ship class (which is a subclass of Actor)
class Enemy extends Ship {
    constructor(x, y, type, health, shipNumber = 0, speed = 1, reloadSpeed = 150, intelligence = 1, weaponType = 0) {
        // Call the super constructor with the given properties
        super(x, y, type, false, health, shipNumber, reloadSpeed, weaponType);
        // Set the element's background image to be the given ship number from the enemy ships array
        this.$element.css('--imgUrl', game.enemyShips[shipNumber]);
        // Flip the element so that it is facing downwards
        this.$element.css('--scaleY', '-1');
        this.direction = 1;
        this.speed = speed;
        this.intelligence = intelligence;
        // Set a score value to give to the player based on the health and intelligence
        this.scoreValue = this.health * this.intelligence * 10;
    }

    // Find the player
    findTarget(movementLimitation) {
        // The distance that this enemy can see the player from is based on its intelligence (higher intelligence can see from a greater distance)
        const distance = this.intelligence * (game.board.hPercent * 4);
        // Check if the player is within the distance range of this enemy
        if (game.player.position.y >= this.position.y - distance && game.player.position.y <= this.position.y + distance) {
            // If the player is within the distance range then do the following
            if (game.player.position.x < this.position.x && movementLimitation !== 'left') {
                // If the player is to the left and there are no movement limitations to the left then move to the left towards the player
                this.position.x -= game.speed * this.speed;
            } else if (game.player.position.x > this.position.x && movementLimitation !== 'right') {
                // If the player is to the right and there are no movement limitations to the right then move to the right towards the player
                this.position.x += game.speed * this.speed;
            }
        }
    }

    // The homing target for enemies will always be the player
    findHomingTarget() {
        return game.player;
    }

    // Decide whether to fire
    chooseToFire() {
        if (this.intelligence <= 1) {
            // If this enemy is low intelligence then it will just fire whenever it can
            this.fire();
        } else {
            // If it is more intelligent than that then do the following
            const playerX = game.player.position.x;
            const playerHalfWidth = game.player.width / 2;
            // Check if the player is within range along the x axis in order to potentially hit it with a shot
            if (this.position.x >= playerX - playerHalfWidth && this.position.x <= playerX + playerHalfWidth) {
                // If it is then fire
                this.fire();
            }
        }
    }

    // Drop a pickup
    dropPickUp() {
        // The drop chance of any enemy is 25% plus one percent of it's score value
        const chance = 0.25 + (this.scoreValue / 100);
        // Run the drop chance through a probability function
        if (game.probability(chance)) {
            // If the probability function returns true then create a random pickup type at the enemy's position and travelling at the enemy's speed
            const pickupType = game.randomIntInRange(0, game.pickupTypes.length - 1);
            const newPickup = new Pickup(this.position.x, this.position.y, game.pickupTypes[pickupType], this.speed);
        }
    }

    move(movementLimitation) {
        // If there is no movement limitation below then always travel downward at this enemy's speed
        if (movementLimitation !== 'bottom') {
            this.position.y += game.speed * this.speed;
        }
        // Check if this enemy can and should be avoiding a collision with another enemy
        this.avoidCollision();
        // Look for the player in order to move towards it if within range
        this.findTarget(movementLimitation);
    }

    // Avoiding collision with other enemies
    avoidCollision() {
        // Check for a collision that is about to happen within a range governed by this enemy's intelligence
        const incomingCollision = this.checkCollision(game.board.hPercent * this.intelligence);
        if (incomingCollision && incomingCollision.actor.type === 'enemy') {
            // If this enemy is about to collide with another enemy then do the following
            switch (incomingCollision.collideFrom) {
                case 'left':
                    // If the other enemy is to the left then move to the right
                    this.position.x += game.speed * this.speed;
                    break;
    
                case 'right':
                    // If the other enemy is to the right then move to the left
                    this.position.x -= game.speed * this.speed;
                    break;
    
                case 'top':
                    // If the other enemy is above then move downwards
                    this.position.y += game.speed * this.speed;
                    break;
    
                case 'bottom':
                    // If the other enemy is below then move upwards
                    this.position.y -= game.speed * this.speed;
                    break;
            }
            // Make this movement visible on the gameboard
            this.drawSelf();
        }
    }

    update() {
        // If the enemy has made it past the bottom of the gameboard then delete it
        if (this.position.y > game.board.height) {
            game.deleteActor(this);
        };
        // Call the Ship's update() function
        super.update();
        // If the enemy is able to fire then choose whether it should
        if (this.reloadCounter >= this.reloadSpeed) {
            this.chooseToFire();
        }
    }

};


  ///////////////////////
 /// Event Handlers ////
///////////////////////

game.mouseMoveHandler = function (e) {
    // Send the player ship a movement command based on the mouse x position relative to the gameboard and the player's current position
    game.player.inputMove((e.pageX - this.offsetLeft) - game.player.position.x);
};

game.touchMoveHandler = function (e) {
    // Prevent accidentally pinch zooming when swiping the player left or right
    e.preventDefault();
    // Store the value of the touch position
    const touchPoint = e.originalEvent.touches[0];
    // Send the player ship a movement command based on the touch x position relative to the gameboard and the player's current position
    game.player.inputMove((touchPoint.pageX - this.offsetLeft) - game.player.position.x);
};

game.keyDownHandler = function (e) {
    // Set the key object with a property matching this keycode to be true
    game.keys[e.keyCode] = true;
};

game.keyUpHandler = function (e) {
    // Set the key object with a property matching this keycode to be false
    game.keys[e.keyCode] = false;
};

game.keyPressHandler = function (e) {
    // If the player presses the space bar then
    if (e.which === 32) {
        // Check if the player is able to fire based on the reload counter
        if (game.player.reloadCounter >= game.player.reloadSpeed) {
            // If the player can fire then fire
            game.player.fire();
        }
    }
};

game.clickHandler = function (e) {
    // The player has clicked (or touched/tapped) anywhere on the gameboard
    // Check if the player is able to fire based on the reload counter
    if (game.player.reloadCounter >= game.player.reloadSpeed) {
        // If the player can fire then fire
        game.player.fire();
    }
};

  /////////////////////
 // Event Listeners //
/////////////////////

game.addEventListeners = function () {

    // Add all the necessary event listeners using the corresponding handler functions

    game.board.$element.on('mousemove', game.mouseMoveHandler);
        
    game.board.$element.on('touchmove', game.touchMoveHandler);
    
    game.$window.on("keydown", game.keyDownHandler);
    
    game.$window.on("keyup", game.keyUpHandler);
    
    game.$window.on('keypress', game.keyPressHandler);
    
    game.$window.on('click', game.clickHandler);
};

game.removeEventListeners = function () {

    // Remove all the event listeners

    game.board.$element.off('mousemove', game.mouseMoveHandler);
        
    game.board.$element.off('touchmove', game.touchMoveHandler);
    
    game.$window.off("keydown", game.keyDownHandler);
    
    game.$window.off("keyup", game.keyUpHandler);
    
    game.$window.off('keypress', game.keyPressHandler);
    
    game.$window.off('click', game.clickHandler);
}

  ////////////////////
 // Keyboard Input //
////////////////////

game.checkInput = function () {

    if (game.keys[37]) {
        // If the player presses the left cursor key then check if they are trying to move beyond the leftmost bounds of the gamebosard
        if (game.player.left > 0) {
            // If they are trying to move within the gameboard then send a movement command to move to the left by 4px
            game.player.inputMove(-4);
        }
    }

    // If the player presses the right cursor key then check if they are trying to move beyond the rightmost bounds of the gamebosard
    if (game.keys[39]) {
        if (game.player.right < game.board.width) {
            // If they are trying to move within the gameboard then send a movement command to move to the right by 4px
            game.player.inputMove(4);
        }
    }
};

  /////////////////////////
 // Enemy/Wave Spawning //
/////////////////////////

// Spawn a single enemy
game.spawnEnemy = function (minHealth, maxHealth, maxSpeed, fastestReloadSpeed, slowestReloadSpeed, minIntelligence, maxIntelligence) {
    // Choose a random x value within the confines of the gameboard
    const x = game.randomIntInRange(0, game.board.width - game.shipWidth);
    // Choose a random health value within the given min and max values
    const health = game.randomIntInRange(minHealth, maxHealth);
    // Choose a random speed value within 2 and the given max value
    const speed = game.randomIntInRange(2, maxSpeed);
    // Choose a random reload speed within the given min and max values
    const reloadSpeed = game.randomIntInRange(fastestReloadSpeed, slowestReloadSpeed);
    // Choose a random intelligence within the given min and max values
    const intelligence = game.randomIntInRange(minIntelligence, maxIntelligence);
    // Choose a random ship within the enemy ships array
    const shipNumber = game.randomIntInRange(0, game.enemyShips.length - 1);
    // Choose a weapon type based on wave, intelligence, and probability
    let weaponType;
    // Choose the homing missile based on a low probability relative to the wave number and intelligence level
    if (game.probability((game.wave / 100) + (intelligence / 100))) {
        weaponType = 2;
    // Choose the spread shot based on a higher probability relative to the wave number and intelligence level
    } else if (game.probability((game.wave / 25) + (intelligence / 25))) {
        weaponType = 1;
    } else {
        // Otherwise choose the single shot
        weaponType = 0;
    }
    // Create a new enemy with the given characteristics
    return new Enemy (x, -game.shipHeight, 'enemy', health, shipNumber, speed, reloadSpeed, intelligence, weaponType);
};

// Start a new enemy wave
game.newWave = function () {
    // Increment the wave number
    game.wave++;
    // Choose the number of enemies for the new wave based on the wave number
    const numberOfEnemies = Math.round(5 * (1 + game.wave / 2));
    // Choose the min and max characteristic values based on the wave number
    const maxHealth = Math.ceil(1 + (game.wave / 4));
    const minHealth = Math.floor(1 + (game.wave / 8));
    const maxSpeed = 2 + (game.wave / 10);
    const fastestReloadSpeed = 45 / game.wave;
    const slowestReloadSpeed = 45;
    const maxIntelligence = game.wave;
    let minIntelligence = Math.round(game.wave / 2);
    if (minIntelligence < 1) {
        minIntelligence = 1;
    }

    // Create all the enemies for this wave
    for (let i = 0; i < numberOfEnemies; i++) {
        // Create the enemy based on given min and max characteristics
        const newEnemy = game.spawnEnemy(minHealth, maxHealth, maxSpeed, fastestReloadSpeed, slowestReloadSpeed, minIntelligence, maxIntelligence);
        // Set the new enemy to not deploy immediately
        newEnemy.deployed = false;
        // Push this enemy into an array containing all the enemies for this wave
        game.waveEnemies.push(newEnemy);
    }
    // Reset the index variable for the enemy wave array
    game.currentWaveEnemy = 0;
    // Set the spawn interval based on the wave number (enemies will spawn more frequently on later waves)
    let spawnInterval = 2500 - (game.wave * 100);
    if (spawnInterval < 100) {
        // Set the minimum spawn interval to 100ms
        spawnInterval = 100;
    }
    // Create a deployment interval to deploy each of the wave enemies every interval length
    game.deploymentInterval = setInterval(game.deployEnemy, spawnInterval);
    // Increase the overall game speed relative to the wave number
    game.speed += game.wave / 10;
};

// When an enemy's position in the wave queue comes up, determine whether to deploy them
game.deployEnemy = function () {
    // Store this enemy in a temporary variable
    const currentEnemy = game.waveEnemies[game.currentWaveEnemy];
    // If this enemy exists and has not been deployed then
    if (currentEnemy && !currentEnemy.deployed) {
        // Deploy the enemy (add it to the gameboard)
        currentEnemy.deploy();
        currentEnemy.deployed = true;
    }
    // Increment the wave enemy index variable
    game.currentWaveEnemy++;
    // If the wave enemy index is higher than the number of enemies in the array then reset it to the beginning
    if (game.currentWaveEnemy >= game.waveEnemies.length) {
        game.currentWaveEnemy = 0;
    }
};

// Check if the current wave has been completed
game.checkWave = function () {
    // If all the enemies in the current wave have been destroyed then
    if (game.waveEnemies.length === 0) {
        // Clear the deployment interval
        clearInterval(game.deploymentInterval);
        // Start a new wave
        game.newWave();
    }
};

  ////////////////////////////
 // General Tool Functions //
////////////////////////////

// Return a random integer within a given range
game.randomIntInRange = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Calculate the pixel sizes of the bullet and ship elements (based on the current screen size)
game.findSpriteSizes = function() {
    // Create a dummy bullet on the gameboard
    const bullet = new Bullet(0, 0, 1, 0, 0, 0, 'none', 0, false);
    // Store it's height and width to variables on the namespace
    game.bulletHeight = bullet.height;
    game.bulletWidth = bullet.width;
    // Delete the dummy bullet
    game.deleteActor(bullet);

    // Create a dummy ship on the gameboard
    const ship = new Ship(0, 0, 'none', true, 1, 0, 1, 0);
    // Store it's height and width to variables on the namespace
    game.shipHeight = ship.height;
    game.shipWidth = ship.width;
    // Delete the dummy ship
    game.deleteActor(ship);
};

// Remove a given item from a given array regardless of it's position in the array
game.removeFromArray = function (item, array) {
    for (var i = 0; i < array.length; i++) {
        // Iterate through all elements in the given array
        if (array[i] === item) {
            // If the given item has been found then splice it out of the array
            array.splice(i, 1);
        }
    }
};

// Return true or false based on the probability of the given chance factor
game.probability = function (n) {
    // Choose a random float between 0 and 1 exclusive
    const randomChance = Math.random();
    // If the given chance is above zero and the random float is less than or equal to the chance factor then return true, otherwise return false
    return n > 0 && randomChance <= n;
}

// Delete a given actor from the game
game.deleteActor = function (actor) {
    // Remove the given actor from the updating actors array
    game.removeFromArray(actor, game.updatingActors);
    if (actor.type === 'enemy') {
        // If the actor is an enemy then remove it from the current enemy wave array
        game.removeFromArray(actor, game.waveEnemies);
        // If the enemy is still alive (health is greater than zero) then
        if (actor.health > 0) {
            // Set it's y position back to the top of the gameboard
            actor.position.y = -game.shipHeight;
            // Set it's deployed value to false so it won't be rendered on the gameboard
            actor.deployed = false;
            // Put it back into the enemy wave array so that it can be deployed again
            game.waveEnemies.push(actor);1
            // This makes it so that if the enemy reaches the bottom of the gameboard without being destroyed then it essentially comes back again and will continue to do so until it is destroyed by the player
        }
    }
    // Remove this actor's element from the gameboard
    actor.$element.remove();
    // Delete this actor object from memory
    delete actor;
};

// Check the current song playing
game.checkPlayList = function () {
    // If the current song has stopped and music is enabled then
    if (game.playList[game.currentTrack].ended && game.musicEnabled) {
        // Increment the playlist index
        game.currentTrack++;
        // If the index has reached the end of the playlist then reset it to the beginning
        if (game.currentTrack >= game.playList.length) {
            game.currentTrack = 0;
        }
        // Play the next song on the playlist based on the index position
        game.playList[game.currentTrack].play();
    }
};

// Create an explosion effect when a ship is destroyed
game.createExplosion= function (x, y) {
    // Play the explosion sound effect
    game.sfx.explosion.play();
    // Create a new element for the explosion and give the ship class
    const $explosion = $('<div class="ship">');
    // Position the explosion at the exact position where the ship was destroyed
    $explosion.css('--x', x + 'px');
    $explosion.css('--y', y + 'px');
    // Set the background image to be the explosion gif
    $explosion.css('--imgUrl', 'url("../assets/explosion.gif")');
    // Add the explosion to the gameboard
    game.board.$element.append($explosion);
    setTimeout(function() {
        // After slightly more than one second (the length of the explosion gif), remove the explosion from the gameboard
        $explosion.remove();
    }, 1100);
};

  ///////////////////////////
 // Leaderboard Functions //
///////////////////////////

// Load in the leaderboard from the cache
game.loadLeaderboard = function () {

    if (!localStorage.leaderboard) {
        // If the leaderboard does not exist in the cache (this is the first time playing the game in this browser) then set the leaderboard variable to an empty array and create a leaderboard item in the cache and set it to an empty JSON object
        game.leaderboard = [];
        localStorage.setItem('leaderboard', '{}');
    } else {
        // If the leaderboard does exist in the cache then set the leaderboard variable to it's value
        game.leaderboard = JSON.parse(localStorage.leaderboard);
    }

};

game.updateLeaderboard = function () {

    // Create an object of the player's stats to enter into the leaderboard
    const newScoreEntry = {
        name: game.playerStats.name,
        time: game.playerStats.time.timePlayed,
        score: game.playerStats.score
    };

    // Add this object into the leaderboard array
    game.leaderboard.push(newScoreEntry);

    // Sort the leaderboard in descending order based on the score value of each object
    game.leaderboard.sort((a, b) => b.score - a.score);

    // Iterate through each entry on the leaderboard
    for (let i = 0; i < game.leaderboard.length; i++) {
        const item = game.leaderboard[i];
        // Give the current item a rank based on it's position in the array (ex. the first item gets a rank of 1)
        item.rank = i + 1;
        if (item.name === newScoreEntry.name && item.time === newScoreEntry.time && item.score === newScoreEntry.score) {
            // If this entry is the new entry that was just entered then add it's rank to the player stats object on the namespace
            game.playerStats.rank = i + 1;
        }
    }

    // If there are more than 10 items on the leaderboard then bump the last item off (this leaderboard only shows the top 10)
    if (game.leaderboard.length > 10) {
        game.leaderboard.pop();
    }

};

game.saveLeaderboard = function() {
    // Update the leaderboard variable on the namespace with the newest entry
    game.updateLeaderboard();
    // Turn the leaderboard array into a JSON string
    const leaderboardString = JSON.stringify(game.leaderboard);
    // Store the leaderboard JSON string into the leaderboard property in the cache
    localStorage.setItem('leaderboard', leaderboardString);
 
};

  ///////////////////////////
 // End of Game Functions //
///////////////////////////

// Calculate the length of this game
game.calculateTimePlayed = function () {
    // Clear the timer interval so that we are no longer counting the time
    clearInterval(game.playerStats.time.interval);
    // Store the number of full minutes played
    game.playerStats.time.mins = (game.playerStats.time.secondsElapsed - (game.playerStats.time.secondsElapsed % 60)) / 60;
    // Store the number of seconds played (not including the full minutes)
    game.playerStats.time.secs = game.playerStats.time.secondsElapsed % 60;

    let secondsPlayed = game.playerStats.time.secs;
    if (secondsPlayed < 10) {
        // If the number of seconds played (not include full minutes) is less than 10 then add a zero in front of the number
        secondsPlayed = '0' + secondsPlayed;
    }

    // Store the length of the game on the player stats object as a string in the format of 00:00 (minutes:seconds)
    game.playerStats.time.timePlayed = `${game.playerStats.time.mins}:${secondsPlayed}`;
};

// Clear all actors from the gameboard
game.clearBoard = function () {
    // Clear the wave deployment interval
    clearInterval(game.deploymentInterval);
    // Iterate through all of the active actors and delete each of them
    for (let actor of game.updatingActors) {
        game.deleteActor(actor);
    }
    // Empty the gameboard of all child elements except for the display area
    game.board.$element.children().not('.gameDisplayArea').remove();
};

// End the game
game.endGame = function () {
    game.calculateTimePlayed();
    game.saveLeaderboard();
    game.removeEventListeners();
    // Let the game continue to run for 2 seconds after the player dies so that the ending is not abrupt and so that the player can take one last look at the display information at the top of the screen. This delay also shows the player that enemies continue to invade even after they're gone
    setTimeout(function() {
        // Stop the music from playing
        game.playList[game.currentTrack].pause();
        game.playList[game.currentTrack].currentTime = 0;
        game.over = true;
        game.clearBoard();
        // Send the player to the end of game screen (the leaderboard)
        setup.endGameScreen();
    }, 2000);
};

  //////////////////////
 // Update Functions //
//////////////////////

// Iterate through all the active actors in the game and call their update() function
game.updateActors = function () {
    for (let i = 0; i < game.updatingActors.length; i++) {
        game.updatingActors[i].update();
    }
};

game.updateDisplay = function () {
    // Move the background image of the gameboard down to make it look like the player is flying upwards
    game.board.move(0, game.speed);
    // Update the health, wave, and score displays with their current values
    game.display.$health.text(game.player.health);
    game.display.$wave.text(game.wave);
    game.display.$score.text(game.playerStats.score);
};

// Update the game every animation frame (60 times per second)
game.update = function () {
    if (!game.over) {
        // If the game is not over then perform the following tasks
        game.checkWave();
        game.checkInput();
        game.updateActors();
        game.updateDisplay();
        game.checkPlayList();
        // Run the update again on the next animation frame
        requestAnimationFrame(game.update);
    }
};

  /////////////////////////
 // Game Initialization //
/////////////////////////

game.init = function() {
    game.setupNewGame();
    game.loadLeaderboard();
    game.findSpriteSizes();
    // Create the player ship at the bottom centre of the gameboard, with 3 health, the single shot weapon type, and the ship that the player chose from the selection screen
    game.player = new Ship (game.playerStats.start.x, game.playerStats.start.y, 'player', true, 3, game.playerStats.ship, 0, 0);
    // Start timing the game
    game.playerStats.time.interval = setInterval(() => game.playerStats.time.secondsElapsed++, 1000);
    // If music is enabled then play the first song on the playlist
    if (game.musicEnabled) {
        game.playList[game.currentTrack].play();
    }
    game.addEventListeners();
    // Start updating the game on each animation frame (60 times per second)
    window.requestAnimationFrame(game.update);
};


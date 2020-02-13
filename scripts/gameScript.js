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

    fire() {
        this.reloadSpeed = this.minReloadSpeed + this.weaponType.reloadDelay;
        this.reloadCounter = 0;
        let bulletY;
        if (this.direction === 1) {
            bulletY = this.bottom + game.bulletHeight;
        } else {
            bulletY = this.position.y - game.bulletHeight;
        };
        switch (this.weaponType.type) {
            case 'singleShot':
                const newBullet = new Bullet(this.position.x + this.width / 2, bulletY, this.direction, 0, this.speed, this.weaponType.damage, this.type, this.weaponType);
                break;
                
            case 'spread':
                const newBullet1 = new Bullet(this.position.x + this.width / 2 - game.bulletWidth, bulletY, this.direction, -1, this.speed, this.weaponType.damage, this.type, this.weaponType);
                const newBullet2 = new Bullet(this.position.x + this.width / 2, bulletY, this.direction, 0, this.speed, this.weaponType.damage, this.type, this.weaponType);
                const newBullet3 = new Bullet(this.position.x + this.width / 2 + game.bulletWidth, bulletY, this.direction, 1, this.speed, this.weaponType.damage, this.type, this.weaponType);
                break;

            case "homingMissile":
                const target = this.findHomingTarget();
                const newBulletHoming = new Bullet(this.position.x + this.width / 2, bulletY, this.direction, 0, this.speed, 1, this.type, this.weaponType, target);
                break;
        };
        game.sfx.pew.play();
    }

};

class Enemy extends Ship {
    constructor(x, y, type, health, shipNumber = 0, speed = 1, reloadSpeed = 150, intelligence = 1, weaponType = 0) {
        super(x, y, type, false, health, shipNumber, reloadSpeed, weaponType);
        this.$element.css('--imgUrl', game.enemyShips[shipNumber]);
        this.$element.css('--scaleY', '-1');
        this.direction = 1;
        this.speed = speed;
        this.intelligence = intelligence;
        this.scoreValue = this.health * this.intelligence * 10;
    }

    findTarget(movementLimitation) {
        const distance = this.intelligence * (game.board.hPercent * 4);
        if (game.player.position.y >= this.position.y - distance && game.player.position.y <= this.position.y + distance) {
            if (game.player.position.x < this.position.x && movementLimitation !== 'left') {
                this.position.x -= game.speed * this.speed;
            } else if (game.player.position.x > this.position.x && movementLimitation !== 'right') {
                this.position.x += game.speed * this.speed;
            }
        }
    }

    findHomingTarget() {
        return game.player;
    }

    chooseToFire() {
        if (this.intelligence <= 1) {
            this.fire();
        } else {
            const playerX = game.player.position.x;
            const playerHalfWidth = game.player.width / 2;
            if (this.position.x >= playerX - playerHalfWidth && this.position.x <= playerX + playerHalfWidth) {
                this.fire();
            }
        }
    }

    dropPickUp() {
        const chance = 0.25 + (this.scoreValue / 100);
        if (game.probability(chance)) {
            const pickupType = game.randomIntInRange(0, game.pickupTypes.length - 1);
            const newPickup = new Pickup(this.position.x, this.position.y, game.pickupTypes[pickupType], this.speed);
        }
    }

    move(movementLimitation) {
        if (movementLimitation !== 'bottom') {
            this.position.y += game.speed * this.speed;
        }
        this.avoidCollision();
        this.findTarget(movementLimitation);
    }

    avoidCollision() {
        const incomingCollision = this.checkCollision(game.board.hPercent * this.intelligence);
        if (incomingCollision && incomingCollision.actor.type === 'enemy') {
            switch (incomingCollision.collideFrom) {
                case 'left':
                    this.position.x += game.speed * this.speed;
                    break;
    
                case 'right':
                    this.position.x -= game.speed * this.speed;
                    break;
    
                case 'top':
                    this.position.y += game.speed * this.speed;
                    break;
    
                case 'bottom':
                    this.position.y -= game.speed * this.speed;
                    break;
            }
            this.drawSelf();
        }
    }

    update() {
        if (this.position.y > game.board.height) {
            game.deleteActor(this);
        };

        super.update();
        if (this.reloadCounter >= this.reloadSpeed) {
            this.chooseToFire();
        }
    }

};

// Actor Classes End

  ///////////////////////
 /// Event Handlers ////
///////////////////////

game.mouseMoveHandler = function (e) {
    game.player.inputMove((e.pageX - this.offsetLeft) - game.player.position.x);
};

game.touchMoveHandler = function (e) {
    e.preventDefault();
    const touch = e.originalEvent.touches[0];
    x = touch.pageX;
    game.player.inputMove((x - this.offsetLeft) - game.player.position.x);
};

game.keyDownHandler = function (e) {
    game.keys[e.keyCode] = true;
};

game.keyUpHandler = function (e) {
    game.keys[e.keyCode] = false;
};

game.keyPressHandler = function (e) {
    if (e.which === 32) { // space bar
        if (game.player.reloadCounter >= game.player.reloadSpeed) {
            game.player.fire();
        }
    }
};

game.clickHandler = function (e) {
    if (game.player.reloadCounter >= game.player.reloadSpeed) {
        game.player.fire();
    }
};

  /////////////////////
 // Event Listeners //
/////////////////////

game.addEventListeners = function () {

    game.board.$element.on('mousemove', game.mouseMoveHandler);
        
    game.board.$element.on('touchmove', game.touchMoveHandler);
    
    game.$window.on("keydown", game.keyDownHandler);
    
    game.$window.on("keyup", game.keyUpHandler);
    
    game.$window.on('keypress', game.keyPressHandler);
    
    game.$window.on('click', game.clickHandler);
};

game.removeEventListeners = function () {
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
    if (game.keys[37]) { // left
        if (game.player.left > 0) {
            game.player.inputMove(-4);
        }
    }

    if (game.keys[39]) { // right
        if (game.player.right < game.board.width) {
            game.player.inputMove(4);
        }
    }
};

  /////////////////////////
 // Enemy/Wave Spawning //
/////////////////////////

game.spawnEnemy = function (minHealth, maxHealth, maxSpeed, fastestReloadSpeed, slowestReloadSpeed, minIntelligence, maxIntelligence) {
    const x = game.randomIntInRange(0, game.board.width - game.shipWidth);
    const health = game.randomIntInRange(minHealth, maxHealth);
    const speed = game.randomIntInRange(2, maxSpeed);
    const reloadSpeed = game.randomIntInRange(fastestReloadSpeed, slowestReloadSpeed);
    const intelligence = game.randomIntInRange(minIntelligence, maxIntelligence);
    const shipNumber = game.randomIntInRange(0, game.enemyShips.length - 1);
    let weaponType;
    if (game.probability((game.wave / 100) + (intelligence / 100))) {
        weaponType = 2;
    } else if (game.probability((game.wave / 25) + (intelligence / 25))) {
        weaponType = 1;
    } else {
        weaponType = 0;
    }
    return new Enemy (x, -game.shipHeight, 'enemy', health, shipNumber, speed, reloadSpeed, intelligence, weaponType);
};

game.newWave = function () {
    game.wave++;
    const numberOfEnemies = Math.round(5 * (1 + game.wave / 2));
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

    for (let i = 0; i < numberOfEnemies; i++) {
        const newEnemy = game.spawnEnemy(minHealth, maxHealth, maxSpeed, fastestReloadSpeed, slowestReloadSpeed, minIntelligence, maxIntelligence);
        newEnemy.deployed = false;
        game.waveEnemies.push(newEnemy);
    }
    game.currentWaveEnemy = 0;
    let spawnInterval = 2500 - (game.wave * 100);
    if (spawnInterval < 100) {
        spawnInterval = 100;
    }
    game.deploymentInterval = setInterval(game.deployEnemy, spawnInterval);
    game.speed += game.wave / 10;
};

game.deployEnemy = function () {
    const currentEnemy = game.waveEnemies[game.currentWaveEnemy];
    if (currentEnemy && !currentEnemy.deployed) {
        currentEnemy.deploy();
        currentEnemy.deployed = true;
    }
    game.currentWaveEnemy++;
    if (game.currentWaveEnemy >= game.waveEnemies.length) {
        game.currentWaveEnemy = 0;
    }
};

game.checkWave = function () {
    if (game.waveEnemies.length === 0) {
        clearInterval(game.deploymentInterval);
        game.newWave();
    }
};

  ////////////////////////////
 // General Tool Functions //
////////////////////////////

game.randomIntInRange = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

game.findSpriteSizes = function() {
    const bullet = new Bullet(0, 0, 1, 0, 0, 0, 'none', 0, false);
    game.bulletHeight = bullet.height;
    game.bulletWidth = bullet.width;
    game.deleteActor(bullet);

    const ship = new Ship(0, 0, 'none', true, 1, 0, 1, 0);
    game.shipHeight = ship.height;
    game.shipWidth = ship.width;
    game.deleteActor(ship);
};

game.removeFromArray = function (item, array) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === item) {
            array.splice(i, 1);
        }
    }
};

game.probability = function (n) {
    const randomChance = Math.random();
    return n > 0 && randomChance <= n;
}

game.deleteActor = function (actor) {
    game.removeFromArray(actor, game.updatingActors);
    if (actor.type === 'enemy') {
        game.removeFromArray(actor, game.waveEnemies);
        if (actor.health > 0) {
            actor.position.y = 10;
            actor.deployed = false;
            game.waveEnemies.push(actor);
        }
    }
    actor.$element.remove();
    delete actor;
};

game.checkPlayList = function () {
    if (game.playList[game.currentTrack].ended && game.musicEnabled) {
        game.currentTrack++;
        if (game.currentTrack >= game.playList.length) {
            game.currentTrack = 0;
        }
        game.playList[game.currentTrack].play();
    }
};

game.createExplosion= function (x, y) {
    game.sfx.explosion.play();
    const $explosion = $('<div class="ship">');
    $explosion.css('--x', x + 'px');
    $explosion.css('--y', y + 'px');
    $explosion.css('--imgUrl', 'url("../assets/explosion.gif")');
    game.board.$element.append($explosion);
    setTimeout(function() {
        $explosion.remove();
    }, 1100);
};

  ///////////////////////////
 // Leaderboard Functions //
///////////////////////////

game.loadLeaderboard = function () {

    if (!localStorage.leaderboard) {
        game.leaderboard = [];
        localStorage.setItem('leaderboard', '{}');
    } else {
        game.leaderboard = JSON.parse(localStorage.leaderboard);
    }

};

game.saveLeaderboard = function() {

    game.updateLeaderboard();
    const leaderboardString = JSON.stringify(game.leaderboard);
    localStorage.setItem('leaderboard', leaderboardString);
 
};

game.updateLeaderboard = function () {

    let secondsPlayed = game.playerStats.time.secs;
    if (secondsPlayed < 10) {
        secondsPlayed = '0' + secondsPlayed;
    }

    game.playerStats.time.timePlayed = `${game.playerStats.time.mins}:${secondsPlayed}`;

    const newScoreEntry = {
        name: game.playerStats.name,
        time: game.playerStats.time.timePlayed,
        score: game.playerStats.score
    };

    game.leaderboard.push(newScoreEntry);

    game.leaderboard.sort((a, b) => b.score - a.score);

    for (let i = 0; i < game.leaderboard.length; i++) {
        const item = game.leaderboard[i];
        item.rank = i + 1;
        if (item.name === newScoreEntry.name && item.time === newScoreEntry.time && item.score === newScoreEntry.score) {
            game.playerStats.rank = i + 1;
        }
    }

    if (game.leaderboard.length > 10) {
        game.leaderboard.pop();
    }

};

  ///////////////////////////
 // End of Game Functions //
///////////////////////////

game.calculateTimePlayed = function () {
    clearInterval(game.playerStats.time.interval);
    game.playerStats.time.mins = (game.playerStats.time.secondsElapsed - (game.playerStats.time.secondsElapsed % 60)) / 60;
    game.playerStats.time.secs = game.playerStats.time.secondsElapsed % 60;
};

game.clearBoard = function () {
    clearInterval(game.deploymentInterval);
    for (let actor of game.updatingActors) {
        game.deleteActor(actor);
    }
    game.board.$element.children().not('.gameDisplayArea').remove();
};

game.endGame = function () {
    game.calculateTimePlayed();
    game.saveLeaderboard();
    game.removeEventListeners();
    setTimeout(function() {
        game.playList[game.currentTrack].pause();
        game.playList[game.currentTrack].currentTime = 0;
        game.over = true;
        game.clearBoard();
        setup.endGameScreen();
    }, 2000);
};

  //////////////////////
 // Update Functions //
//////////////////////

game.updateActors = function () {
    for (let i = 0; i < game.updatingActors.length; i++) {
        game.updatingActors[i].update();
    }
};

game.updateDisplay = function () {
    game.board.move(0, game.speed);
    game.display.$health.text(game.player.health);
    game.display.$score.text(game.playerStats.score);
    game.display.$wave.text(game.wave);
};

game.update = function () {
    if (!game.over) {
        game.checkWave();
        game.checkInput();
        game.updateActors();
        game.updateDisplay();
        game.checkPlayList();
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
    game.player = new Ship (game.playerStats.start.x, game.playerStats.start.y, 'player', true, 100, game.playerStats.ship, 0, 0);
    game.playerStats.time.interval = setInterval(() => game.playerStats.time.secondsElapsed++, 1000);
    if (game.musicEnabled) {
        game.playList[game.currentTrack].play();
    }
    game.addEventListeners();
    window.requestAnimationFrame(game.update);
};


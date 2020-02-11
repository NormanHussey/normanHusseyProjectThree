const game = {};
game.playerStats = {};

game.setupNewGame = function() {
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
    game.$window = $(window);
    game.over = false;
    game.speed = 1;
    game.slowMotion = false;
    game.wave = 0;
    game.waveEnemies = [];
    game.updatingActors = [];
    game.keys = {};
    
    game.playerStats.start = {
        x: game.board.width / 2,
        y: game.board.height - (game.board.hPercent * 15)
    };
    
    game.playerStats.score = 0;

    game.playerStats.time = {
        secondsElapsed: 0,
        mins: 0,
        secs: 0,
        timePlayed: '0:00'
    };
    
    game.display ={
        $health: $('#health'),
        $score: $('#score'),
        $wave: $('#wave')
    };
    
    game.ships = [
        'url("../assets/ships/redSilverShip.gif")',
        'url("../assets/ships/bigBlueShip.gif")',
        'url("../assets/ships/bigRedShip.gif")',
        'url("../assets/ships/biggerRedShip.gif")',
        'url("../assets/ships/bigGreenShip.gif")',
        'url("../assets/ships/sleekBlueShip.gif")',
        'url("../assets/ships/greenShip.gif")',
    ];

    game.enemyShips = game.ships.filter(function (ship, index) {
        return index !== game.playerStats.ship;
    });
    
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

    game.sfx = {
        explosion: new AudioSwitcher('../assets/audio/sfx/explosion.ogg', 10),
        pew: new AudioSwitcher('../assets/audio/sfx/pew.wav', 10),
        pickup: new AudioSwitcher('../assets/audio/sfx/pickup.wav', 4)
    };

    game.music = {
        track01: new Audio('../assets/audio/music/track01-DontBeA.mp3'),
        track02: new Audio('../assets/audio/music/track02-LavaFlow.mp3'),
        track03: new Audio('../assets/audio/music/track03-GameAtHeart.mp3'),
        track04: new Audio('../assets/audio/music/track04-FerrousRage.mp3'),
        track05: new Audio('../assets/audio/music/track05-FrigidTriumph.mp3'),
        track06: new Audio('../assets/audio/music/track06-ReallyDangerous.mp3')
    };

    game.playList = [
        game.music.track01,
        game.music.track02,
        game.music.track03,
        game.music.track04,
        game.music.track05,
        game.music.track06
    ];

    game.currentTrack = 0;

};

class AudioChannel {
    constructor(source) {
        this.source = source;
        this.resource = new Audio(source);
    }

    play() {
        if (game.slowMotion) {
            this.resource.playbackRate = 0.25;
        } else {
            this.resource.playbackRate = 1.0;
        }
        this.resource.play();
    }

    stop() {
        this.resource.pause();
        this.resource.currentTime = 0;
    }
}

class AudioSwitcher {
    constructor(source, numberOfChannels) {
        this.channels = [];
        this.source = source;
        this.numberOfChannels = numberOfChannels;
        this.index = 0;

        for (var i = 0; i < this.numberOfChannels; i++) {
            this.channels.push(new AudioChannel(this.source));
        }
    }

    play() {
        this.channels[this.index].play();
        this.index++;
        if (this.index >= this.channels.length) {
            this.index = 0;
        }
    }
}


class Actor {
    constructor(x, y, element, type, deploy = true) {
        this.position = {
            x: x,
            y: y,
        };
        this.$element = $(element);
        this.type = type;
        if (deploy) {
            this.deploy();
        }
    }

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

    deploy() {
        game.board.$element.append(this.$element);
        this.$element.css('--x', this.position.x + 'px');
        this.$element.css('--y', this.position.y + 'px');
        this.width = this.$element.width();
        this.height = this.$element.height();
        game.updatingActors.push(this);
    }

    checkCollision(avoidance = 0) {
        for (let i = 0; i < game.updatingActors.length; i++) {
            const actor = game.updatingActors[i];
            if (actor !== this) {
                const actorLeft = actor.left - avoidance;
                const actorRight = actor.right + avoidance;
                const actorTop = actor.top - avoidance;
                const actorBottom = actor.bottom + avoidance;
                if (actorLeft < this.right && actorRight > this.left && actorTop < this.bottom && actorBottom > this.top ) {
                    const collider = {};
                    collider.actor = actor;
                    if (actor.bottom >= (this.top - 1) && actor.bottom <= (this.top + 1)) {
                        collider.collideFrom = 'top';
                    } else if (actor.top <= (this.bottom + 1) && actor.top >= (this.bottom - 1)) {
                        collider.collideFrom = 'bottom';
                    } else if (actor.left <= (this.right + 1) && actor.left >= (this.right - 1)) {
                        collider.collideFrom = 'right';
                    } else {
                        collider.collideFrom = 'left';
                    }
                    return collider;
                };
            };
        };
        return false;
    }

    update() {
        let movementLimitation = false;
        const collidingObject = this.checkCollision();
        if (collidingObject) {
            movementLimitation = this.handleCollision(collidingObject);
        }
        this.move(movementLimitation);
        this.drawSelf();
    }

    drawSelf() {
        this.$element.css('--x', this.position.x + 'px');
        this.$element.css('--y', this.position.y + 'px');
    }
}

class Pickup extends Actor {
    constructor(x, y, pickupType, speed) {
        const element = `<div class="pickup">`;
        super(x, y, element, 'pickup', true);
        this.pickupType = pickupType;
        this.speed = speed;
        this.$element.css('--imgUrl', this.pickupType.asset);
    }

    handleCollision(collider) {
        if (collider.actor.type !== 'bullet') {
            game.sfx.pickup.play();
            switch(this.pickupType.type) {
                case 'health':
                    collider.actor.health += 3;
                    break;

                case 'singleShot':
                    collider.actor.weaponType = game.weaponTypes[0];
                    break;

                case 'spread':
                    collider.actor.weaponType = game.weaponTypes[1];
                    break;

                case 'homingMissile':
                    collider.actor.weaponType = game.weaponTypes[2];
                    break;

                case 'nuke':
                    for (let enemy of game.waveEnemies) {
                        if (enemy.deployed) {
                            enemy.hitBy = 'player';
                            enemy.health = 0;
                        }
                    }
                    break;

                case 'slowMotion':
                    const currentGameSpeed = game.speed;
                    game.speed = 0.25;
                    game.slowMotion = true;
                    game.playList[game.currentTrack].playbackRate = 0.25;
                    setTimeout(function () {
                        game.playList[game.currentTrack].playbackRate = 1.0;
                        game.speed = currentGameSpeed;
                        game.slowMotion = false;
                    }, 3000)
                    break;

            }
            game.deleteActor(this);
        }
    }

    move() {
        this.position.y += this.speed * game.speed;
    }

    update() {
        if (this.top >= game.board.height) {
            game.deleteActor(this);
        } else {
            super.update();
        }
    }

}


class Bullet extends Actor {
    constructor(x, y, yDirection, xDirection, speed, damage = 1, firedBy, weaponType, target = undefined) {
        const element = '<div class="bullet">';
        super(x, y, element, 'bullet');
        this.yDirection = yDirection;
        this.xDirection = xDirection;
        this.speed = speed;
        this.damage = damage;
        this.firedBy = firedBy;
        this.weaponType = weaponType;
        this.decayDistance = this.weaponType.decayDistance;
        this.decayRate = this.weaponType.decayRate;
        this.decay = 0;
        this.startY = y;
        this.$element.css('--imgUrl', this.weaponType.asset);
        this.target = target;
        game.sfx.pew.play();
    }

    update() {
        if (!game.slowMotion) {
            this.decay++;
        }
        if (this.decay >= this.decayRate) {
            game.deleteActor(this);
        }
        if ((this.yDirection === 1 && this.position.y >= this.startY + this.decayDistance) || (this.yDirection === -1 && this.position.y <= this.startY - this.decayDistance)) {
            game.deleteActor(this);
        } else {
            if (this.position.y < this.height || this.bottom > game.board.height - this.height) {
                game.deleteActor(this);
            } else {
                super.update();
            }
        }
    }

    move() {
        if (!this.target || this.decay < 10) {
            this.position.y += (game.speed * (this.speed * 2) * this.yDirection);
            this.position.x += (game.speed * (this.speed * 2) * this.xDirection);
        } else {
            if (this.target.position.y < this.position.y) {
                this.position.y -= (game.speed * (this.speed * 2));
            } else if (this.target.position.y > this.position.y) {
                this.position.y += (game.speed * (this.speed * 2));
            }

            if (this.target.position.x < this.position.x) {
                this.position.x -= (game.speed * (this.speed * 2));
            } else if (this.target.position.x > this.position.x) {
                this.position.x += (game.speed * (this.speed * 2));
            }
            
        }
    }

    handleCollision(collider) {
        if (collider.actor.health) {
            collider.actor.health -= this.damage;
            collider.actor.hitBy = this.firedBy;
            collider.actor.showHit();
        }
        game.deleteActor(this);
    }

    drawSelf() {
        super.drawSelf();
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

class Ship extends Actor {
    constructor(x, y, type, deploy = true, health = 5, shipNumber = 0, minReloadSpeed, weaponType = 0) {
        const element = '<div class="ship">';
        super(x, y, element, type, deploy);
        this.health = health;
        this.$element.css('--imgUrl', game.ships[shipNumber]);
        this.movement = 0;
        this.direction = -1;
        this.speed = 1;
        this.reloadCounter = 0;
        this.minReloadSpeed = minReloadSpeed;
        this.reloadSpeed = this.minReloadSpeed;
        this.weaponType = game.weaponTypes[weaponType];
    }

    showHit() {
        this.$element.css('--colour', 'rgba(255, 0, 0, 0.4)');
        this.$element.css('border-radius', '50%');
        const thisActor = this;
        setTimeout(function () {
            thisActor.$element.css('--colour', 'rgba(0, 0, 0, 0)');
            thisActor.$element.css('border-radius', '0');
        }, 200);
    }

    inputMove(movement) {
        this.movement = movement;
    }

    move(movementLimitation) {
        if (movementLimitation) {
            if (movementLimitation === 'left' && this.direction < 0) {
                return false;
            } else if (movementLimitation === 'right' && this.direction > 0) {
                return false;
            }
        } else {
            const proposedMovement = this.position.x + this.movement;
            if (proposedMovement >= game.board.left && proposedMovement <= (game.board.width - this.width)) {
                this.position.x = proposedMovement;
            }
            this.movement = 0;
        }
    }

    handleCollision(collider) {
        if (collider.actor.type !== 'bullet' && collider.actor.type !== 'pickup') {
            this.hitBy = collider.actor.type;
            this.health -= (collider.actor.health * collider.actor.speed);
            collider.actor.showHit();
            return collider.collideFrom;
        }
    }

    checkHealth() {
        if (this.health <= 0) {
            if (this.type === 'player') {
                this.health = 0;
                game.endGame();
            } else {
                if (this.hitBy === 'player') {
                    game.playerStats.score += this.scoreValue;
                }
                this.dropPickUp();
            }
            this.die();
        }
    }
    
    die() {
        game.createExplosion(this.position.x, this.position.y);        
        game.deleteActor(this);
    }

    update() {
        this.reloadCounter++;
        super.update();
        this.checkHealth();
    }

    findHomingTarget() {
        let nearestEnemy;
        let nearestEnemyYPos = 0;
        for (let enemy of game.waveEnemies) {
            if (enemy.deployed) {
                if (enemy.position.y > nearestEnemyYPos) {
                    nearestEnemyYPos = enemy.position.y;
                    nearestEnemy = enemy;
                }
            }
        }
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
        }
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
        if (incomingCollision && incomingCollision.actor.type !== 'bullet') {
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

// Event Handler Functions

game.mouseMoveHandler = function (e) {
    game.player.inputMove((e.pageX - this.offsetLeft) - game.player.position.x);
};

game.touchMoveHandler = function (e) {
    const touch = e.originalEvent.touches[0];
    // || e.originalEvent.changedTouches[0]
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

game.addEventListeners = function () {
    
    // game.board.$element.on('tap', function (e) {
        //     console.log('tap');
        // });

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

    if (game.keys[38]) { // up
        game.speed += 0.1;
    }

    if (game.keys[40]) { // down
        if (game.speed > 1.1) {
            game.speed -= 0.1;
        }
    }
};

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
}

game.checkWave = function () {
    if (game.waveEnemies.length === 0) {
        clearInterval(game.deploymentInterval);
        game.newWave();
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
}

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

game.clearBoard = function () {
    clearInterval(game.deploymentInterval);
    for (let actor of game.updatingActors) {
        game.deleteActor(actor);
    }
    game.board.$element.children().not('.gameDisplayArea').remove();
}

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

game.calculateTimePlayed = function () {
    clearInterval(game.playerStats.time.interval);
    game.playerStats.time.mins = (game.playerStats.time.secondsElapsed - (game.playerStats.time.secondsElapsed % 60)) / 60;
    game.playerStats.time.secs = game.playerStats.time.secondsElapsed % 60;
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

game.checkPlayList = function () {
    if (game.playList[game.currentTrack].ended) {
        game.currentTrack++;
        if (game.currentTrack >= game.playList.length) {
            game.currentTrack = 0;
        }
        game.playList[game.currentTrack].play();
    }
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

game.init = function() {
    game.setupNewGame();
    game.loadLeaderboard();
    game.findSpriteSizes();
    game.player = new Ship (game.playerStats.start.x, game.playerStats.start.y, 'player', true, 3, game.playerStats.ship, 0, 0);
    game.playerStats.time.interval = setInterval(() => game.playerStats.time.secondsElapsed++, 1000);
    game.playList[game.currentTrack].play();
    game.addEventListeners();
    window.requestAnimationFrame(game.update);
};


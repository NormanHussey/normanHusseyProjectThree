const game = {};

game.board = {
    $element: $('.playArea'),
    top: 0,
    left: 0,
    width: $('.playArea').width(),
    height: $('.playArea').height(),
    move: function(x, y) {
        const newX = parseInt(this.$element.css('--bgX')) + x;
        const newY = parseInt(this.$element.css('--bgY')) + y;
        this.$element.css('--bgX', newX + 'px');
        this.$element.css('--bgY', newY + 'px');
    }
};

game.speed = 1;
game.wave = 0;
game.waveEnemies = [];
game.over = false;
game.keys = {};

game.playerStats = {
    start: {
        x: game.board.width / 2,
        y: game.board.height - 100
    },
    score: 0
};

game.display ={
    $health: $('#health'),
    $score: $('#score'),
    $wave: $('#wave')
};

game.enemyShips = [
    'url("./assets/greenShip.gif")',
    'url("./assets/sleekBlueShip.gif")',
    'url("./assets/bigGreenShip.gif")',
    'url("./assets/bigRedShip.gif")',
    'url("./assets/bigBlueShip.gif")',
    'url("./assets/biggerRedShip.gif")'
];

game.weaponTypes = [
    {
        type: 'singleShot',
        reloadDelay: 0,
        damage: 1,
        decayDistance: 200,
        decayRate: Infinity,
        asset: 'url("./assets/green_bullet.gif")'
    },
    {
        type: 'spread',
        reloadDelay: 25,
        damage: 1,
        decayDistance: 200,
        decayRate: Infinity,
        asset: 'url("./assets/magenta_bullet.gif")'
    },
    {
        type: 'homingMissile',
        reloadDelay: 50,
        damage: 2,
        decayDistance: Infinity,
        decayRate: 100,
        asset: 'url("./assets/red_bullet.gif")'
    },
];

game.pickupTypes = [
    {
        type: 'health',
        asset: 'url("./assets/healthPickup.png")'
    },
    {
        type: 'singleShot',
        asset: 'url("./assets/singleShotPickup.png")'
    },
    {
        type: 'spread',
        asset: 'url("./assets/spreadPickup.png")'
    },
    {
        type: 'homingMissile',
        asset: 'url("./assets/homingMissilePickup.png")'
    }
];

game.updatingActors = [];

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

    handleCollision(collider) {
        // do something
    }

    move() {
        // do something
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
    constructor(x, y, element, pickupType, speed) {
        super(x, y, element, 'pickup', true);
        this.pickupType = pickupType;
        this.speed = speed;
        this.$element.css('--imgUrl', this.pickupType.asset);
    }

    handleCollision(collider) {
        if (collider.actor.type !== 'bullet') {
            switch(this.pickupType.type) {
                case 'health':
                    collider.actor.health += 5;
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

            }
            game.deleteActor(this);
        }
    }

    move() {
        this.position.y += this.speed * game.speed;
    }

    update() {
        if (this.bottom > game.board.height - this.height) {
            game.deleteActor(this);
        } else {
            super.update();
        }
    }

}


class Bullet extends Actor {
    constructor(x, y, element, yDirection, xDirection, speed, damage = 1, firedBy, weaponType, target = undefined) {
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
    }

    update() {
        this.decay++;
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
        if (!this.target || this.decay < 20) {
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
    constructor(x, y, element, type, deploy = true, health = 5, minReloadSpeed, weaponType = 0) {
        super(x, y, element, type, deploy);
        this.health = health;
        this.movement = 0;
        this.direction = -1;
        this.speed = 1;
        this.reloadCounter = 0;
        this.minReloadSpeed = minReloadSpeed;
        this.reloadSpeed = this.minReloadSpeed;
        this.weaponType = game.weaponTypes[weaponType];
    }

    // rotate(direction) {
    //     this.angle += (Math.PI / 180) * 100 * direction;
    //     this.$element.css('--angle', this.angle + 'deg');
    // }

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
                game.over = true;
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
            bulletY = this.bottom + 14;
        } else {
            bulletY = this.position.y - 14;
        };
        const bulletDiv = '<div class="bullet">';
        switch (this.weaponType.type) {
            case 'singleShot':
                const newBullet = new Bullet(this.position.x + this.width / 2, bulletY, bulletDiv, this.direction, 0, this.speed, this.weaponType.damage, this.type, this.weaponType);
                break;
                
            case 'spread':
                const newBullet1 = new Bullet(this.position.x + this.width / 2 - 5, bulletY, bulletDiv, this.direction, -1, this.speed, this.weaponType.damage, this.type, this.weaponType);
                const newBullet2 = new Bullet(this.position.x + this.width / 2, bulletY, bulletDiv, this.direction, 0, this.speed, this.weaponType.damage, this.type, this.weaponType);
                const newBullet3 = new Bullet(this.position.x + this.width / 2 + 5, bulletY, bulletDiv, this.direction, 1, this.speed, this.weaponType.damage, this.type, this.weaponType);
                break;

            case "homingMissile":
                const target = this.findHomingTarget();
                const newBulletHoming = new Bullet(this.position.x + this.width / 2, bulletY, bulletDiv, this.direction, 0, this.speed, 1, this.type, this.weaponType, target);
                break;
        }
    }

};

class Enemy extends Ship {
    constructor(x, y, element, type, health, speed = 1, reloadSpeed = 150, intelligence = 1, shipNumber = 0, weaponType = 0) {
        super(x, y, element, type, false, health, reloadSpeed, weaponType);
        this.direction = 1;
        this.speed = speed;
        this.intelligence = intelligence;
        this.$element.css('--imgUrl', game.enemyShips[shipNumber]);
        this.scoreValue = this.health * this.intelligence * 10;
    }

    findTarget(movementLimitation) {
        const distance = this.intelligence * 50;
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
            const pickupDiv = `<div class="pickup">`;
            const newPickup = new Pickup(this.position.x, this.position.y, pickupDiv, game.pickupTypes[pickupType], this.speed);
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
        const incomingCollision = this.checkCollision(this.intelligence - 2);
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
        if (this.position.y > game.board.height - this.height) {
            game.deleteActor(this);
        };

        super.update();
        if (this.reloadCounter >= this.reloadSpeed) {
            this.chooseToFire();
        }
    }

};

game.addEventListeners = function () {
    game.board.$element.on('mousemove', function (e) {
        game.player.inputMove((e.pageX - this.offsetLeft) - game.player.position.x);
    });

    game.board.$element.on('tap', function (e) {
        console.log('tap');
    });

    game.board.$element.on('touchmove', function(e) {
        const touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
        x = touch.pageX;
        game.player.inputMove((x - this.offsetLeft) - game.player.position.x);
        return false;
    });
    
    $(window).on("keydown", function (e) {
        game.keys[e.keyCode] = true;
    });
    
    $(window).on("keyup", function (e) {
        game.keys[e.keyCode] = false;
    });
    
    $(window).on('keypress', function (e) {
        // console.log(e.which);
        if (!game.over) {
            switch (e.which) {
                case 32: // space bar
                    if (game.player.reloadCounter >= game.player.reloadSpeed) {
                        game.player.fire();
                    }
                    break;
            }
        }
    });
    
    $(window).on('click', function (e) {
        if (!game.over) {
            if (game.player.reloadCounter >= game.player.reloadSpeed) {
                game.player.fire();
            }
        };
    });
};

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

game.chooseRandomColour = function (transparency = 1) {
    const red = Math.floor(Math.random() * 255);
    const green = Math.floor(Math.random() * 255);
    const blue = Math.floor(Math.random() * 255);
    return `rgba(${red}, ${green}, ${blue}, ${transparency})`;
};

game.randomIntInRange = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

game.spawnEnemy = function (minHealth, maxHealth, maxSpeed, fastestReloadSpeed, slowestReloadSpeed, minIntelligence, maxIntelligence) {
    const x = game.randomIntInRange(0, game.board.width - 25);
    const health = game.randomIntInRange(minHealth, maxHealth);
    const speed = game.randomIntInRange(2, maxSpeed);
    const reloadSpeed = game.randomIntInRange(fastestReloadSpeed, slowestReloadSpeed);
    const intelligence = game.randomIntInRange(minIntelligence, maxIntelligence);
    const shipNumber = game.randomIntInRange(0, game.enemyShips.length - 1);
    let weaponType;
    if (game.probability(intelligence / 10)) {
        weaponType = 2;
    } else if (game.probability(intelligence / 5)) {
        weaponType = 1;
    } else {
        weaponType = 0;
    }
    return new Enemy (x, 10, '<div class="ship">', 'enemy', health, speed, reloadSpeed, intelligence, shipNumber, weaponType);
};

game.newWave = function () {
    game.wave++;
    const numberOfEnemies = 10 + game.wave;
    const maxHealth = Math.ceil(1 + (game.wave / 10));
    const minHealth = Math.floor(1 + (game.wave / 10));
    const maxSpeed = 2 + (game.wave / 8);
    const fastestReloadSpeed = 100 / game.wave;
    const slowestReloadSpeed = 100;
    const maxIntelligence = game.wave;
    let minIntelligence = game.wave - 2;
    if (minIntelligence < 1) {
        minIntelligence = 1;
    }

    for (let i = 0; i < numberOfEnemies; i++) {
        const newEnemy = game.spawnEnemy(minHealth, maxHealth, maxSpeed, fastestReloadSpeed, slowestReloadSpeed, minIntelligence, maxIntelligence);
        newEnemy.deployed = false;
        game.waveEnemies.push(newEnemy);
    }
    game.currentWaveEnemy = 0;
    let spawnInterval = 3000 - (game.wave * 100);
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
    const $explosion = $('<div class="ship">');
    $explosion.css('--x', x + 'px');
    $explosion.css('--y', y + 'px');
    $explosion.css('--imgUrl', 'url("./assets/explosion.gif")');
    game.board.$element.append($explosion);
    setTimeout(function() {
        $explosion.remove();
    }, 1000);
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
    game.display.$health.text(game.player.health);
    game.display.$score.text(game.playerStats.score);
    game.display.$wave.text(game.wave);
};

game.update = function () {
    game.checkWave();
    game.checkInput();
    game.updateActors();
    if (!game.over) {
        game.board.move(0, game.speed);
    } else {
        if (!localStorage.highScore || localStorage.highScore < game.playerStats.score) {
            localStorage.setItem('highScore', game.playerStats.score);
        }
    }
    game.updateDisplay();
    requestAnimationFrame(game.update);
};

game.init = function() {
    const currentHighScore = localStorage.getItem('highScore');
    console.log(currentHighScore);
    game.player = new Ship (game.playerStats.start.x, game.playerStats.start.y, '<div class="ship">', 'player', true, 10, 0, 0);
    game.addEventListeners();
    window.requestAnimationFrame(game.update);
};

$(function() {
    game.init();
});

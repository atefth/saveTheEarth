var game = new Phaser.Game(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, Phaser.AUTO, '', {
    preload: preload,
    create: create,
    update: update
});
var player;
var world;
var blink;
var rocketangel;
var rocketdirection;
var rocketSpeedDelta;
var rocketradius;
var platforms;
var scoreText;
var playerangle;
var scaleRatio;
var score;
//asteroids
var asteroid;
var asteroidarray = [];
var collidedtoRocket = false;
var collidedtoEarth = false;
var arri = 0;
var explosions;

scaleRatio = window.devicePixelRatio / 2;

//load images or files before game starts
function preload() {
    game.load.image('background', 'assets/game/background.png');
    game.load.image('world', 'assets/game/world.png');
    game.load.image('player', 'assets/game/player.png');
    game.load.image('blink', 'assets/game/blink.png');
    game.load.image('asteroid', 'assets/game/asteroid.png');
    game.load.spritesheet('kaboom', 'assets/game/explode.png', 128, 128);

}


//create all the images ans things on the screen
function create() {
    score = 0;
    rocketangel = 0;
    rocketdirection = 1;
    rocketSpeedDelta = 0.002;
    rocketradius = 170;
    playerangle = 60;

    //  A simple background for our game
    game.add.sprite(0, 0, 'background');

    //  We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.P2JS);


    //  Turn on impact events for the world, without this we get no collision callbacks
    game.physics.p2.setImpactEvents(true);

    game.physics.p2.restitution = 0.8;


    //  Create our collision groups. One for the player, one for the pandas
    var playerCollisionGroup = game.physics.p2.createCollisionGroup();
    var asteroidCollisionGroup = game.physics.p2.createCollisionGroup();
    var earthCollisionGroup = game.physics.p2.createCollisionGroup();

    world = game.add.sprite(game.world.centerX - 10, game.world.centerY - 20, 'world');

    world.anchor.setTo(0.5, 0.5);
    world.scale.setTo(scaleRatio, scaleRatio);
    game.physics.p2.enable(world);
    world.body.setCircle(28);

    world.body.static = true
        //  Set the ships collision group

    world.body.setCollisionGroup(earthCollisionGroup);

    //  The ship will collide with the pandas, and when it strikes one the hitPanda callback will fire, causing it to alpha out a bit
    //  When pandas collide with each other, nothing happens to them.

    world.body.collides(asteroidCollisionGroup, hitEarth, this);






    platforms = game.add.group();
    platforms.enableBody = true;
    platforms.physicsBodyType = Phaser.Physics.P2JS;
    for (var i = 0; i < 10; i++) {
        var asteroidx;
        var asteroidy;
        var randomx1 = game.rnd.integerInRange(-200, 10);
        var randomx2 = game.rnd.integerInRange(game.world.width, game.world.width + 200);
        if (randomx1 + randomx2 >= game.world.width) {
            asteroidx = randomx2;
        }
        else {
            asteroidx = randomx1;
        }



        var randomy1 = game.rnd.integerInRange(-200, 10);
        var randomy2 = game.rnd.integerInRange(game.world.height, game.world.height - 200);

        if (randomy1 + randomy2 >= game.world.height) {
            asteroidy = randomy2;
        }
        else {
            asteroidy = randomy1;
        }


        asteroid = game.add.sprite(asteroidx, asteroidy, 'asteroid');
        asteroid.anchor.setTo(0.5, 0.5);
        asteroid.scale.setTo(scaleRatio, scaleRatio);
        game.physics.p2.enable(asteroid, false);
        asteroid.body.setRectangle(40, 40);
        //  Tell the panda to use the pandaCollisionGroup
        asteroid.body.setCollisionGroup(asteroidCollisionGroup);
        //  Pandas will collide against themselves and the player
        //  If you don't set this they'll not collide with anything.
        //  The first parameter is either an array or a single collision group.
        asteroid.body.collides([asteroidCollisionGroup, playerCollisionGroup]);
        asteroid.body.collides([asteroidCollisionGroup, earthCollisionGroup]);
        asteroidarray.push(asteroid);
    }

    //adding player
    player = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
    player.anchor.setTo(0.5, 0.5);
    player.scale.setTo(scaleRatio, scaleRatio);
    game.physics.p2.enable(player);
    player.body.setCircle(28);

    //  Set the ships collision group

    player.body.setCollisionGroup(playerCollisionGroup);

    //  The ship will collide with the pandas, and when it strikes one the hitPanda callback will fire, causing it to alpha out a bit
    //  When pandas collide with each other, nothing happens to them.

    player.body.collides(asteroidCollisionGroup, hitPanda, this);

    //  The platforms group contains the ground and the 2 ledges we can jump on

    //asteroid.body.collideWorldBounds = true;
    //  The score
    scoreText = game.add.text(16, 16, 'score: 0', {
        fontSize: '32px',
        fill: '#FFF'
    });
    scoreText.scale.setTo(scaleRatio, scaleRatio);
    cursors = game.input.keyboard.createCursorKeys();
    //  An explosion pool
    explosions = game.add.group();
    explosions.createMultiple(30, 'kaboom');
    explosions.forEach(setupInvader, this);

}

function setupInvader(invader) {

    invader.anchor.x = 0.5;
    invader.anchor.y = 0.5;
    invader.animations.add('kaboom');

}

function hitEarth() {

    //  body1 is the space ship (as it's the body that owns the callback)
    //  body2 is the body it impacted with, in this case our panda
    //  As body2 is a Phaser.Physics.P2.Body object, you access its own (the sprite) via the sprite property:
    score -= 10;
    collidedtoEarth = true;
    //  And create an explosion :)
    var explosion = explosions.getFirstExists(false);
    explosion.reset(world.body.x, world.body.y);
    explosion.play('kaboom', 30, false, true);


}

function hitPanda() {

    //  body1 is the space ship (as it's the body that owns the callback)
    //  body2 is the body it impacted with, in this case our panda
    //  As body2 is a Phaser.Physics.P2.Body object, you access its own (the sprite) via the sprite property:
    score += 10;
    collidedtoRocket = true;

}

function update() {

    var playerangelchange;
    var speed = 1.14;
    // platforms.forEachAlive(moveBullets,this);
    if (collidedtoRocket == false) {
        moveBullets(asteroidarray[arri]);
    }
    else {
        collidedtoRocket = false;
        arri++;
        if (arri > 9) {
            arri = 0
        }
    }
    if (collidedtoEarth == true) {
        collidedtoEarth = false;
        arri++;
        if (arri > 9) {
            arri = 0
        }
    }


    //keypress
    if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        //it will speed up the rocket

    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.ENTER)) {
        //it will cause the blink
        if (speed > 0)
            speed = 2.14;
        else
            speed = -2.14;
        blink = game.add.sprite(player.x, player.y, 'blink');
        blink.anchor.setTo(0.5, 0.5);
        blink.scale.setTo(scaleRatio, scaleRatio);
        game.add.tween(blink).to({
            alpha: 0
        }, 20, Phaser.Easing.Linear.None, true);
        //blink.destroy(true);
    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
        rocketdirection = -1; //change the direction
    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
        rocketdirection = 1; //change the direction
    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
        //it will cause the blink
        if (speed > 0)
            speed = 2.14;
        else
            speed = -2.14;
        blink = game.add.sprite(player.x, player.y, 'blink');
        blink.anchor.setTo(0.5, 0.5);
        blink.scale.setTo(scaleRatio, scaleRatio);
        game.add.tween(blink).to({
            alpha: 0
        }, 20, Phaser.Easing.Linear.None, true);
        //blink.destroy(true);
    }
    //speed of current rocket movement
    if (rocketdirection == 1) {
        rocketSpeedDelta = speed;
        playerangelchange = 1.1;
    }
    else if (rocketdirection == -1) {
        rocketSpeedDelta = -speed;
        playerangelchange = -1.1;
    }


    //for moving on a circular path
    rocketangel += this.time.physicsElapsed * rocketSpeedDelta;
    player.body.x = game.world.centerX + Math.cos(rocketangel) * rocketradius;
    player.body.y = game.world.centerY + Math.sin(rocketangel) * rocketradius;
    playerangle += playerangelchange;
    player.body.angle = playerangle;

    //showing score
    scoreText.text = 'Score: ' + score;




}

function moveBullets(asteroid) {
    setTimeout(accelerateToObject(asteroid, world, 30), 50000); //start accelerateToObject on every bullet
}


function accelerateToObject(obj1, obj2, speed) {
    if (typeof speed === 'undefined') {
        speed = 60;
    }
    var angle = Math.atan2(obj2.y - obj1.y, obj2.x - obj1.x);
    //obj1.body.rotation = angle + game.math.degToRad(90);  // correct angle of angry bullets (depends on the sprite used)
    obj1.body.force.x = Math.cos(angle) * speed; // accelerateToObject
    obj1.body.force.y = Math.sin(angle) * speed;
}
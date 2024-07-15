function newPlayer(x, y, d, speed, team) {
    player = new Sprite(x, y)
    player.diameter = d
    
    player.speedConst = speed
    player.collider = "dynamic"

    if (myTeam == "blue") {
        player.image = "./assets/textures/bluesoldier.png"
    } else {
        player.image = "./assets/textures/redsoldier.png"
    }

    player.image.scale = d/202 * 1.3

    //For multiplayer purposes
    player.health = 100
    player.team = team
}


//Will shoot a new projectile
function playerShoot(speed, diameter) {
    let dir = atan2(mouseY - player.pos.y, mouseX - player.pos.x)

    PM.newProjectile(player.x, player.y, speed, dir, diameter)
}


//Ensures player movement functionality
function playerMovement() {
    //Keyboard inputs mapped to movement
    if (kb.pressing("w")) {
        player.pos.y -= player.speedConst;
    }
    if (kb.pressing("a")) {
        player.pos.x -= player.speedConst;
    }
    if (kb.pressing("s")) {
        player.pos.y += player.speedConst;
    }
    if (kb.pressing("d")) {
        player.pos.x += player.speedConst;
    }

    //To prevent some "bouncebacks" upon collision with enemy projectiles that have mass
    player.vel.x = 0
    player.vel.y = 0

    let dir = atan2(mouseY - player.pos.y, mouseX - player.pos.x)
    player.rotation = dir - PI/2
}


//Checks for collisions and deducts health accordingly
function playersCheckCollisions() {
    //For own player
    for(let i = 0; i < PM.allProjectiles.length; i++) {
        if(PM.allProjectiles[i].team !== player.team) {
            if(PM.allProjectiles[i].collides(player)) {
                player.health -= 10
                receiveDamageSound.play()

                if(player.health <= 0) {
                    socket.emit("killPlayer", socket.id, PM.allProjectiles[i].origin)
                    console.log("Killer is " + EM.findUsername(PM.allProjectiles[i].origin))
                    killer = EM.findUsername(PM.allProjectiles[i].origin)

                    deathSound.play()
                }
                
                PM.allProjectiles[i].remove()
                PM.allProjectiles.splice(i, 1)

                console.log("Self-Projectile Collision")
            }
        }
    }


    //For other players
    for(let i = 0; i < PM.allProjectiles.length; i++) {
        for(let j = 0; j < EM.entities.length; j++) {
            if(EM.entities[j].team !== PM.allProjectiles[i].team) {
                if(EM.entities[j].collides(PM.allProjectiles[i])) {
                    EM.entities[j].health -= 10

                    PM.allProjectiles[i].remove()
                    PM.allProjectiles.splice(i, 1)

                    console.log("otherPlayer-Projectile Collision")
                }
            }
        }
    }
}


function deadScreen() {
    fill(220)
    rect(0, 0, width, height)

    textAlign(CENTER)
    textSize(width * 1/30)
    fill(0)

    if(typeof killer == "undefined") {
        text("Game Over\nYou have been killed by\nsome troll who didn't put a name.", width * 1/2, height * 1/4)
    } else {
        text("Game Over\nYou have been killed by " + killer + ".", width * 1/2, height * 1/4)
    }
    

    //Return to homescreen button
    if(mouseX > width * 1/3 && mouseX < width * 2/3 && mouseY > height * 2/4 && mouseY < height * 3/4) {
        fill(180)
        rect(width * 0.95/3, height * 1.95/4, width * 1.1/3, height * 1.1/4)
        textSize(width * 1/30)
    } else {
        fill(255)
        rect(width * 1/3, height * 2/4, width * 1/3, height * 1/4)
        textSize(width * 1/35)
    }

    fill(0)
    text("PLAY AGAIN", width * 1/2, height * 2.5/4)
}
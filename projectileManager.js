class projectileManager {
    constructor() {
        this.allProjectiles = []
    }


    //Creates a new projectile. Function is meant for the local player only
    newProjectile(x, y, speed, dir, d) {
        //This allows the sprite to spawn outside the player
        let x1 = x + cos(dir) * player.d
        let y1 = y + sin(dir) * player.d
        
        //Basic sprite properties
        let projectile = new Sprite(x1, y1)
        projectile.speed = speed
        projectile.direction = dir
        projectile.d = d

        if(myTeam == "blue") {
            projectile.color = "blue"
        } else {
            projectile.color = "red"
        }

        projectile.bounciness = 1
        projectile.friction = 0

        //For multiplayer collision purposes
        projectile.bounceLeft = 3
        projectile.team = myTeam
        projectile.origin = socket.id
        projectile.id = crypto.randomUUID()

        this.allProjectiles.push(projectile)

        socket.emit("newProjectile", x1 / width, y1 / height, speed, dir, d, projectile.bounceLeft, projectile.team, socket.id, projectile.id)
    }


    // <--From here onwards lies all multiplayer functions for projectiles--> //


    //Creates a new projectile. This function is for other clients' projectiles.
    newMultiplayerProjectile(x, y, speed, dir, d, bounceLeft, team, origin, id) {
        //Basic sprite properties
        let projectile = new Sprite(x * width, y * height)
        projectile.speed = speed
        projectile.direction = dir
        projectile.d = d

        projectile.bounciness = 1
        projectile.friction = 0

        //For multiplayer collision purposes
        projectile.bounceLeft = bounceLeft
        projectile.team = team
        projectile.origin = origin
        projectile.id = id

        if(projectile.team == "blue") {
            projectile.color = "blue"
        } else {
            projectile.color = "red"
        }

        this.allProjectiles.push(projectile)
    }


    //Returns a boolean whether there exists a projectile with a given ID
    projectileExists(id) {
        for(let i = 0; i < this.allProjectiles.length; i++) {
            if(this.allProjectiles[i].id == id) {
                return true
            } else {
                continue
            }
        }

        return false
    }


    //Given the ID and the relevant attributes, will update that specific projectile's attributes
    updateProjectile(id, x, y, speed, dir, bounceLeft) {
        for(let i = 0; i < this.allProjectiles.length; i++) {
            if(this.allProjectiles[i].id == id) {
                this.allProjectiles[i].pos.x = x
                this.allProjectiles[i].pos.y = y
                this.allProjectiles[i].speed = speed
                this.allProjectiles[i].direction = dir
                this.allProjectiles[i].bounceLeft = bounceLeft
            } else {
                continue
            }
        }
    }


    //Given the ID of the projectile, it will be removed
    removeProjectile(id) {
        for(let i = 0; i < this.allProjectiles.length; i++) {
            if(this.allProjectiles[i].id == id) {
                this.allProjectiles[i].remove()
            } else {
                continue
            }
        }
    }


    //Checking for any collisions with walls (static or player-placed)
    projectilesWallsCollision() {
        for(let i = 0; i < this.allProjectiles.length; i++) {
            for(let j = 0; j < WM.walls.length; j++) {
                if(this.allProjectiles[i].team !== WM.walls[j].team) {
                    if(WM.walls[j].collides(this.allProjectiles[i])) {
                        WM.walls[j].health--
                        this.allProjectiles[i].bounceLeft--
                        
                        projectileBounceSound.play()
                        wallBreakSound.play()
    
                        console.log("Projectile-Wall Collision")
                    }
                }
            }

            for(let j = 0; j < WM.staticWalls.length; j++) {
                if(WM.staticWalls[j].collides(this.allProjectiles[i])) {
                    WM.staticWalls[j].health--
                    this.allProjectiles[i].bounceLeft--

                    projectileBounceSound.play()

                    console.log("Projectile-StaticWall Collision")
                }
            }
        }


        //Removing any out-of-bounds projectile (if they happen) to save resources
        //Leeway has already been accounted for in terms of the projectiles' radius
        for(let i = 0; i < this.allProjectiles.length; i++) {
            if(this.allProjectiles[i].pos.x < 0 || this.allProjectiles[i].pos.x > width || this.allProjectiles[i].pos.y < 0 || this.allProjectiles[i].pos.y > height) {
                this.allProjectiles[i].remove()
                this.allProjectiles.splice(i, 1)
            }
        }
    }


    //Will remove a projectile sprite after it has done all its 3 bounces with walls
    projectilesCheckHealth() {
        for(let i = 0; i < this.allProjectiles.length; i++) {
            if(this.allProjectiles[i].bounceLeft <= 0) {
                this.allProjectiles[i].remove()
                this.allProjectiles.splice(i, 1)

                //console.log("Projectile Removed")
            }
        }
    }


    //Do not collide with friendly walls, players and projectiles
    projectilesFriendlyOverlap() {
        for(let projectile of PM.allProjectiles) {
            if(projectile.team == player.team) {
                projectile.overlaps(player)
            }

            for(let i = 0; i < PM.allProjectiles.length; i++) {
                if(PM.allProjectiles[i].team == projectile.team) {
                    projectile.overlaps(PM.allProjectiles[i])
                }
            }
            for(let i = 0; i < WM.walls.length; i++) {
                if(WM.walls[i].team == projectile.team) {
                    projectile.overlaps(WM.walls[i])
                }
            }
            for(let i = 0; i < EM.entities.length; i++) {
                if(EM.entities[i].team == projectile.team) {
                    projectile.overlaps(EM.entities[i])
                }
            }
        }
    }
}
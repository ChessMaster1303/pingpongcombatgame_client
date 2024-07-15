class playerManager {
    constructor() {
        this.entities = []
    }


    registerNewPlayer(id, username, team, relativePosition, rotation) {
        let x = relativePosition.x * width
        let y = relativePosition.y * height
        let newPlayer = new Sprite(x, y)
        newPlayer.speed = 0
        newPlayer.diameter = width * 1 / 20
        newPlayer.collider = "dynamic"
        newPlayer.rotation = rotation

        //For multiplayer functionality
        newPlayer.username = username
        newPlayer.team = team
        newPlayer.id = id

        if (team == "blue") {
            newPlayer.image = "./assets/textures/bluesoldier.png"
        } else {
            newPlayer.image = "./assets/textures/redsoldier.png"
        }

        newPlayer.image.scale = newPlayer.diameter / 202 * 1.3

        //Overlap instead of collide with friendly projectiles
        for (let i = 0; i < PM.allProjectiles.length; i++) {
            if (PM.allProjectiles[i].team == newPlayer.team) {
                newPlayer.overlaps(PM.allProjectiles[i])
            }
        }

        this.entities.push(newPlayer)

        console.log("Player Registered: " + id)
    }


    playerExists(id) {
        for (let i = 0; i < this.entities.length; i++) {
            if (this.entities[i].id == id) {
                return true;
            }
            else {
                continue
            }
        }

        return false
    }


    findUsername(id) {
        for (let i = 0; i < this.entities.length; i++) {
            if (this.entities[i].id == id) {
                return this.entities[i].username
            } else {
                continue
            }
        }
    }


    updatePlayerPosition(id, relativePosition, rotation) {
        for (let i = 0; i < this.entities.length; i++) {
            if (this.entities[i].id == id) {
                this.entities[i].pos.x = relativePosition.x * width;
                this.entities[i].pos.y = relativePosition.y * height;
                this.entities[i].rotation = rotation

                //Make it such that the entity doesn't "jitter" after colliding with projectile
                this.entities[i].vel.x = 0
                this.entities[i].vel.y = 0
            } else {
                continue
            }
        }
    }


    updatePlayerHealth(id, health) {
        for (let i = 0; i < this.entities.length; i++) {
            if (this.entities[i].id == id) {
                this.entities[i].health = health
            } else {
                continue
            }
        }
    }


    removePlayer(id) {
        for (let i = 0; i < this.entities.length; i++) {
            if (this.entities[i].id == id) {
                this.entities[i].remove()
                this.entities.splice(i, 1)

                console.log("Player Removed: " + id)
            } else {
                continue
            }
        }
    }


    removeAll() {
        for (let i = 0; i < this.entities.length; i++) {
            this.entities[i].remove()
        }
        this.entities.splice(0, this.entities.length)
    }
}
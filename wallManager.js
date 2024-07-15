class wallManager {
    constructor() {
        this.walls = []
        this.staticWalls = []
    }


    newWall(team, index, size) {
        //Different team's walls start at different points
        if (team == "blue") {
            origin = createVector(0, 0)
        } else {
            origin = createVector(width * 3 / 4, 0)
        }

        //The position of the sprite is dependent on the index of the wall
        //The size/2 is because for p5play sprites, the centre of the rectangle is at (x, y), not the top-left corner
        let x = origin.x + (index % 8) * size + size / 2
        let y = origin.y + floor(index / 8) * size + size / 2

        //Basic sprite properties
        let wall = new Sprite(x, y)
        wall.w = size
        wall.h = size

        //For collision
        wall.bounciness = 1
        wall.friction = 0
        wall.collider = "static"

        //For multiplayer purposes
        wall.health = 1
        wall.team = team
        wall.index = index

        if (team == "blue") {
            wall.color = "blue"
        } else {
            wall.color = "red"
        }

        //Overlap with friendly projectiles
        for (let i = 0; i < PM.allProjectiles.length; i++) {
            if (PM.allProjectiles[i].team == wall.team) {
                wall.overlaps(PM.allProjectiles[i])
            }
        }

        this.walls.push(wall)
    }


    //Static walls are not meant to be deleted. They are usually to mark the game boundaries, HUD area etc.
    newStaticWall(x, y, w, h) {
        //Basic sprite properties
        let wall = new Sprite(x, y)
        wall.w = w
        wall.h = h

        //For collision with player
        wall.collider = "static"
        wall.bounciness = 1
        wall.friction = 0

        //Invisible walls
        wall.visible = false

        this.staticWalls.push(wall)
    }


    //Returns a boolean that is the state of whether the wall with a specific team and ID is present
    wallExists(team, index) {
        for (let i = 0; i < this.walls.length; i++) {
            if (this.walls[i].team == team && this.walls[i].index == index) {
                return true
            } else {
                continue
            }
        }

        return false
    }


    //Removes a wall given the team and index
    removeWall(team, index) {
        for (let i = 0; i < this.walls.length; i++) {
            if (this.walls[i].team == team && this.walls[i].index == index) {
                this.walls[i].remove()
                this.walls.splice(i, 1)

                wallBreakSound.play()
                wallExplodeQueue.push({life: 10, index: index, team: team})
            } else {
                continue
            }
        }
    }


    wallsCheckHealth() {
        for (let i = 0; i < this.walls.length; i++) {
            if (this.walls[i].health <= 0) {
                wallBreakSound.play()
                wallExplodeQueue.push({life: 10, index: this.walls[i].index, team: this.walls[i].team})

                this.walls[i].remove()
                this.walls.splice(i, 1)
            }
        }
    }


    removeAll() {
        for (let i = 0; i < this.walls.length; i++) {
            this.walls[i].remove()
        }
        this.walls.splice(0, this.walls.length)

        for (let i = 0; i < this.staticWalls.length; i++) {
            this.staticWalls[i].remove()
        }
        this.staticWalls.splice(0, this.staticWalls.length)
    }
}
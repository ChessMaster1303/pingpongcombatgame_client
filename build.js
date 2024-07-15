function buildInterface() {
    let origin = -1
    let size = width * 1 / 32
    let mouseIndex = -1

    if (myTeam == "blue" && mouseX > 0 && mouseX < width * 1 / 4 && mouseY > 0 && mouseY < height) {
        origin = createVector(0, 0)
        mouseIndex = floor(mouseY / size) * 8 + floor(mouseX / size)
    } else if (myTeam == "red" && mouseX > width * 3 / 4 && mouseX < width && mouseY > 0 && mouseY < height) {
        origin = createVector(width * 3 / 4, 0)
        mouseIndex = floor(mouseY / size) * 8 + floor((mouseX - width * 3 / 4) / size)
    }

    //No point displaying the building HUD if the player's mouse isn't even in the correct zone
    if (mouseIndex == -1 && origin == -1) {
        return
    }
    else if(mouseIndex !== -1 && origin !== -1) {
        if ((myTeam == "blue" && mouseX > 0 && mouseX < width * 1 / 4 && mouseY > 0 && mouseY < height) || (myTeam == "red" && mouseX > width * 3 / 4 && mouseX < width && mouseY > 0 && mouseY < height)) {
            for (let y = -1; y < 2; y++) {
                for (let x = -1; x < 2; x++) {
                    //Preventing loopback, when the HUD will wraparound the build area
                    if ((floor(mouseIndex / 8) + y < 0) || (floor(mouseIndex / 8) + y > 17) || (mouseIndex % 8 + x < 0) || (mouseIndex % 8 + x > 7)) {
                        continue
                    } else {
                        let finalIndex = mouseIndex + x + (y * 8)
                        push()
                        if (WM.wallExists(myTeam, finalIndex) == false) {
                            if (x == 0 && y == 0) {
                                if(myTeam == "blue") {
                                    fill(0, 0, 255, 100)
                                } else {
                                    fill(255, 0, 0, 100)
                                }
                            } else {
                                noFill()
                            }
                        } else {
                            fill(0)
                        }
    
                        rect(origin.x + (finalIndex % 8) * size, origin.y + floor(finalIndex / 8) * size, size, size)
                        pop()
                    }
                }
            }
        }
    }
}


function buildWall() {
    let size = width * 1 / 32
    let index

    if (myTeam == "blue" && mouseX > 0 && mouseX < width * 1 / 4 && mouseY > 0 && mouseY < height) {
        index = floor(mouseY / size) * 8 + floor(mouseX / size)
    } else if (myTeam == "red" && mouseX > width * 3 / 4 && mouseX < width && mouseY > 0 && mouseY < height) {
        index = floor(mouseY / size) * 8 + floor((mouseX - width * 3 / 4) / size)
    }

    //To prevent building outside your designated zone
    if(typeof(index) !== "undefined") {
        WM.newWall(myTeam, index, width * 1 / 32)
        socket.emit("newWall", myTeam, index)
        buildCharge -= 200
    }
    
}
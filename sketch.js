//The 3 object managers that will manage players, projectiles and walls
let EM = new playerManager();
let PM = new projectileManager();
let WM = new wallManager();

//For multiplayer networking
let socket

//This will be used to keep track of the number of frames elapsed: will be used for the server to determine which client has the most recent update
let ticksElapsed = 0

//A boolean that, when true, will start the game
let gameStart = false
let mode = "startPage";

//Variable and boolean for username input at start screen
let listenUserName = false
let username = ""

//The one and only player object
let player;

//For game-end purposes
let killer

//For "Mission Control Purposes"
let messages = []

//Either "blue" or "red", will be assigned when the player connects to the server
let myTeam

//Boolean to describe whether the game is the same state as server when joining
let initialised = false

//For shooting purposes
let shootCharge = 0
let buildCharge = 0

//For a future implementation of the game, where upgrades can be purchased
let credits = 0

//Image and Sound Assets
let roadking_font
let justbreathe_font

let startMenuBackground
let gameBackground
let battlegroundImage
let battlegroundImageRotations = []
let wallExplodeImage
let wallExplodeQueue = []

let demoPlayerImage

let gameMusic
let wallBreakSound


function preload() {
	roadking_font = loadFont("./assets/fonts/RoadKing.otf")
	justbreathe_font = loadFont("./assets/fonts/JustBreathe.otf")

	startMenuBackground = loadImage("./assets/textures/warbackdrop.png")
	gameBackground = loadImage("./assets/textures/futuristicHUD.jpg")
	battlegroundImage = loadImage("./assets/textures/grass.jpg")
	tileInitialise()
	wallExplodeImage = loadImage("./assets/textures/Explosion.jpg")

	demoPlayerImage = loadImage("./assets/textures/bluesoldier.png")

	gameMusic = loadSound("./assets/sound/Rite_Of_Battle.mp3")
	wallBreakSound = loadSound("./assets/sound/TNT_Explosion.mp3")
	projectileBounceSound = loadSound("./assets/sound/Bounce_Sound.mp3")
	receiveDamageSound = loadSound("./assets/sound/Oof_Sound.mp3")
	deathSound = loadSound("./assets/sound/Death_Bong.mp3")
}


function setup() {
	new Canvas(windowWidth, windowWidth * 9 / 16);

	angleMode(RADIANS)
	frameRate(60)

	gameMusic.setVolume(0.5)
	wallBreakSound.setVolume(1)
	projectileBounceSound.setVolume(1)
	
}


function tileInitialise() {
	for(let i = 0; i < 145; i++) {
		battlegroundImageRotations.push(round(random(0, 3)))
	}
}



function draw() {
	background(255);

	if (gameStart == false) {
		//Before the game starts, we will be at the home screen
		startMenu()
	}

	if (gameStart == true) {
		//Listen for any disconnected clients, and remove them from local list
		socket.on("removeClient", (id) => {
			if(EM.playerExists(id)) {
				messages.push(EM.findUsername(id) + " has left the game")
			}
			EM.removePlayer(id)
		})


		socket.on("playerDied", (victim, killer) => {
			if(victim == socket.id) {
				player.remove()
				EM.removeAll()
				WM.removeAll()

				mode = "gameOver"
				
				//console.log("I am dead")
			} else {
				if(EM.playerExists(victim)) {
					if(killer == socket.id) {
						messages.push("You have slain " + EM.findUsername(victim))
					} else {
						messages.push(EM.findUsername(killer) + " has slain " + EM.findUsername(victim))
					}
				}
				EM.removePlayer(victim)

				//console.log("Someone else has died")
			}
		})


		//Always emit client player position. Completely separate from the simulation
		socket.emit("myPlayerPosition", player.position.x / width, player.position.y / height, player.rotation)


		//Listen for other players position (going to be completely separate from the projectiles collisions simulations and all)
		socket.on("playersData", (playersData) => {
			for (let i = 0; i < playersData.length; i++) {
				if (playersData[i].id == socket.id) {
					continue
				}
				else if (EM.playerExists(playersData[i].id) == true) {
					EM.updatePlayerPosition(playersData[i].id, playersData[i].position, playersData[i].rotation)
				}
				//Making sure we have the username before we create the player
				else if (typeof (playersData[i].username) !== "undefined" && typeof (playersData[i].position) !== "undefined") {
					EM.registerNewPlayer(playersData[i].id, playersData[i].username, playersData[i].team, playersData[i].position, playersData[i].rotation)
					
					if(playersData[i].team == myTeam) {
						messages.push("Reinforcement has come: " + playersData[i].username)
					} else {
						messages.push("A new enemy has arrived: " + playersData[i].username)
					}
				}
			}
		})


		//Listen for the creation of new projectiles
		socket.on("initialiseProjectile", (x, y, speed, dir, d, bounceLeft, team, origin, id) => {
			//Prevent the duplication of your own projectiles
			if (origin !== socket.id) {
				if (PM.projectileExists(id) == false) {
					PM.newMultiplayerProjectile(x, y, speed, dir, d, bounceLeft, team, origin, id)
				}
			}
		})


		//Listen for the creation of new projectiles
		socket.on("initialiseWall", (team, index) => {
			//Prevent duplication of existing (usually own) walls
			if (WM.wallExists(team, index) == false) {
				WM.newWall(team, index, width * 1 / 32)
			}
		})


		//Listen for projectile and player updates (dependent on simulation!)
		socket.on("simulationUpdate", (tick, origin, playerHealth, projectileData, wallData) => {
			for (let i = 0; i < playerHealth.length; i++) {
				EM.updatePlayerHealth(playerHealth[i].id, playerHealth[i].health)
			}

			for (let i = 0; i < projectileData.length; i++) {
				let x = projectileData[i].x * width //+ ((ticksElapsed - tick) + cos(projectileData[i].dir) * projectileData[i].speed)
				let y = projectileData[i].y * height //+ ((ticksElapsed - tick) + sin(projectileData[i].dir) * projectileData[i].speed)

				PM.updateProjectile(projectileData[i].id, x, y, projectileData[i].speed, projectileData[i].dir, projectileData[i].bounceLeft)
			}

			for (let i = 0; i < wallData.length; i++) {
				if (WM.wallExists(wallData[i].team, wallData[i].index) == false) {
					WM.newWall(wallData[i].team, wallData[i].index, width * 1 / 32)
				}
			}

			ticksElapsed = tick
		})

		//Heads-Up-Display with all the information and visuals and aesthetics
		HUD()


		//Shows the building interface with possible building configurations
		if (mode == "build") {
			buildInterface()
		}


		//Various functions to ensure all the game runs
		playerMovement()
		playersCheckCollisions()

		PM.projectilesWallsCollision()
		PM.projectilesCheckHealth()
		PM.projectilesFriendlyOverlap()

		WM.wallsCheckHealth()

		//Charging up the shot
		if (shootCharge < 30) {
			//Hidden incentive such that player shooting charges faster in no-man's land
			if (player.pos.x > width * 1 / 4 && player.pos.x < width * 3 / 4) {
				//Making sure shootCharge doesn't exceed 100
				if (shootCharge + 1.15 > 30) {
					shootCharge += 30 - shootCharge
				} else {
					shootCharge += 1.15
				}
			} else {
				if (shootCharge + 1 > 30) {
					shootCharge += 30 - shootCharge
				} else {
					shootCharge++
				}
			}
		}


		//Charging wall
		if (buildCharge < 200) {
			buildCharge++
		}




		//Sending all the data to the server
		let allData = [ticksElapsed, socket.id]

		//Players' Health data
		let playersHealth = []
		playersHealth.push({ id: socket.id, health: player.health })
		for (let i = 0; i < EM.entities.length; i++) {
			playersHealth.push({ id: EM.entities[i].id, health: EM.entities[i].health })
		}

		allData.push(playersHealth)

		//Projectile Positions and other data
		let projectilesData = []
		for (let i = 0; i < PM.allProjectiles.length; i++) {
			projectilesData.push({ id: PM.allProjectiles[i].id, bounceLeft: PM.allProjectiles[i].bounceLeft, x: PM.allProjectiles[i].pos.x / width, y: PM.allProjectiles[i].pos.y / height, speed: PM.allProjectiles[i].speed, dir: PM.allProjectiles[i].direction })
		}

		allData.push(projectilesData)

		let wallData = []
		for (let i = 0; i < WM.walls.length; i++) {
			wallData.push({ index: WM.walls[i].index, team: WM.walls[i].team })
		}

		allData.push(wallData)

		socket.emit("allData", allData)

		ticksElapsed++


		//Display deathscreen
		if(mode == "gameOver") {
			deadScreen()
		} 
	}
}





function HUD() {
	background(220)
	image(gameBackground, width * 1/4, height * 2/4, width * 2/4, height * 2/4)

	//Battlefield images of grass
	push()
	translate(width * 1 / 4, height * 1 / 4)
	for (let x = 0; x < 16; x++) {
		for (let y = 0; y < 9; y++) {
			imageMode(CENTER)
			push()
			translate(width * 1 / 32 * x + width * 1 / 64, height * 1 / 18 * y + height * 1 / 36)
			rotate(battlegroundImageRotations[y * 16 + x] * PI/2)
			image(battlegroundImage, 0, 0, width * 1 / 32, height * 1 / 18)
			pop()
		}
	}
	pop()


	//Team Sides Text
	push()
	textAlign(CENTER)
	textSize(width * 1 / 40)

	push()
	translate(width * 1.1 / 4, height * 1 / 8)
	rotate(PI / 2)
	fill(0, 0, 255)
	text("BLU", 0, 0)
	pop()

	push()
	translate(width * 2.9 / 4, height * 1 / 8)
	rotate(PI * 3 / 2)
	fill(255, 0, 0)
	text("RED", 0, 0)
	pop()
	pop()


	//Various Team's base background colour
	push()
	fill(0, 0, 255, 100)
	rect(0, 0, width * 1 / 4, height)
	rect(width * 1/4, 0, width * 0.3/4, height * 1/4)

	fill(255, 0, 0, 100)
	rect(width * 3 / 4, 0, width * 1 / 4, height)
	rect(width * 3/4, 0, width * (-0.3/4), height * 1/4)
	pop()


	//Team Zones Building Boundaries
	line(width * 1 / 4, 0, width * 1 / 4, height)
	line(width * 3 / 4, 0, width * 3 / 4, height)

	//Map Borders
	line(0, 0, width, 0)
	line(width, 0, width, height)
	line(width, height, 0, height)
	line(0, height, 0, 0)


	//HUD Area
	stroke(0)
	line(width * 1 / 4, height * 3 / 4, width * 3 / 4, height * 3 / 4)

	//Mission Control Area
	line(width * 1 / 4, height * 1 / 4, width * 3 / 4, height * 1 / 4)
	line(width * 1.3/4, 0, width * 1.3/4, height * 1/4)
	line(width * 1.75/4, 0, width * 1.75/4, height * 1/4)


	//Mode Display
	text("Current Mode:", width * 1.5 / 4, height * 0.2 / 4)

	if(mode == "fight") {
		fill(150)
		rect(width * 1.35/4, height * 0.3/4, width * 0.35/4, height * 0.2/4)
		fill(0)
		text("FIGHT", width * 1.525/4, height * 0.42/4)
		fill(255)
		rect(width * 1.35/4, height * 0.6/4, width * 0.35/4, height * 0.2/4)
		fill(0)
		text("BUILD", width * 1.525/4, height * 0.72/4)
	} else if(mode == "build") {
		fill(255)
		rect(width * 1.35/4, height * 0.3/4, width * 0.35/4, height * 0.2/4)
		fill(0)
		text("FIGHT", width * 1.525/4, height * 0.42/4)
		fill(150)
		rect(width * 1.35/4, height * 0.6/4, width * 0.35/4, height * 0.2/4)
		fill(0)
		text("BUILD", width * 1.525/4, height * 0.72/4)
	}

	
	//TO DO: mission control logs (who killed who)
	push()
	textAlign(CENTER)
	textSize(width * 1/50)
	text("MISSION CONTROL:", width * 2.25/4, height * 0.2/4)
	line(width * 1.9/4, height * 0.3/4, width * 2.6/4, height * 0.3/4)

	//Keeps the messages array to a max length of 3 at all times
	if(messages.length > 3) {
		while(messages.length > 3) {
			messages.splice(0, 1)
		}
	}

	//Prints out all the messages
	textAlign(LEFT)
	textSize(width * 1/80)
	for(let i = 0; i < messages.length; i++) {
		text(messages[i], width * 1.9/4, height * (0.5 + i * 0.2)/4)
	}
	pop()
	


	//Health Display
	push()
	textAlign(LEFT)
	fill(255)
	text("Player Health: " + player.health + " / 100", width * 1.1 / 4, height * 6.3 / 8)
	strokeWeight(width * 1 / 200)
	noFill()
	rect(width * 1.1 / 4, height * 6.5 / 8, width * 1.8 / 4 + width * 1 / 400, height * 0.5 / 8)

	noStroke()
	fill(0, 255, 0)
	rect(width * 1.1 / 4 + width * 1 / 400, height * 6.5 / 8 + width * 1 / 400, width * (player.health / 100) * 1.8 / 4 - width * 1 / 400, height * 0.5 / 8 - width * 1 / 200)
	pop()

	for (let i = 1; i < 10; i++) {
		line(width * 1.1 / 4 + (i / 10 * width * 1.8 / 4), height * 6.5 / 8, width * 1.1 / 4 + (i / 10 * width * 1.8 / 4), height * 7 / 8)
	}


	//Shoot charging
	push()
	textAlign(LEFT)
	fill(255)
	text("Bullet Charge-Up: " + round(shootCharge * 100 / 30, 2) + "%", width * 1.1 / 4, height * 7.3 / 8)
	strokeWeight(width * 1 / 200)
	noFill()
	rect(width * 1.1 / 4, height * 7.4 / 8, width * 0.8 / 4 + width * 1 / 400, height * 0.5 / 8)

	noStroke()
	fill(255, 213, 128)
	rect(width * 1.1 / 4 + width * 1 / 400, height * 7.4 / 8 + width * 1 / 400, width * (shootCharge / 30) * 0.8 / 4 - width * 1 / 400, height * 0.5 / 8 - width * 1 / 200)
	pop()


	//Wall building charging
	push()
	textAlign(LEFT)
	fill(255)
	text("Wall Charge-Up: " + round(buildCharge / 2, 2) + "%", width * 2.1 / 4, height * 7.3 / 8)
	strokeWeight(width * 1 / 200)
	noFill()
	rect(width * 2.1 / 4, height * 7.4 / 8, width * 0.8 / 4 + width * 1 / 400, height * 0.5 / 8)

	noStroke()
	fill(197, 199, 156)
	rect(width * 2.1 / 4 + width * 1 / 400, height * 7.4 / 8 + width * 1 / 400, width * (buildCharge / 200) * 0.8 / 4 - width * 1 / 400, height * 0.5 / 8 - width * 1 / 200)
	pop()


	//Name and Health Display for other players
	for (let i = 0; i < EM.entities.length; i++) {
		let entityPos = EM.entities[i].pos
		let entityHealth = EM.entities[i].health
		textSize(width / 100)
		text(EM.entities[i].username, entityPos.x, entityPos.y + height * 1.6 / 25)
		text("HP: " + entityHealth, entityPos.x, entityPos.y - height * 1.6 / 25)
	}



	//Name Display for self, with identifier triangle
	push()
	translate(player.pos.x, player.pos.y - height * 1.5 / 20)
	scale(width * 1 / 80)
	fill(0)
	triangle(0, 0, -0.8, -1, 0.8, -1)
	pop()

	fill(0)
	textSize(width / 100)
	text(username, player.pos.x, player.pos.y + height * 1.6 / 25)



	//Displaying all blown-up walls
	for(let i = 0; i < wallExplodeQueue.length; i++) {
		if(wallExplodeQueue[i].life < 0) {
			wallExplodeQueue.splice(i, 1)
		} else {
			let size = width * 1 / 32
			let origin
			if(wallExplodeQueue[i].team == "blue") {
				origin = createVector(0, 0)
			} else {
				origin = createVector(width * 3/4, 0)
			}

			let x = origin.x + (wallExplodeQueue[i].index % 8) * size
        	let y = origin.y + floor(wallExplodeQueue[i].index / 8) * size

			image(wallExplodeImage, x, y, size, size)

			wallExplodeQueue[i].life -= 1
		}
	}
}





function startMenu() {
	background(220)
	imageMode(CORNER)
	image(startMenuBackground, 0, 0, width, height)

	//Username input
	if (mouseX > width / 3 && mouseX < width * 2 / 3 && mouseY > height * 1.5 / 4 && mouseY < height * 2 / 4) {
		fill(220)
	} else {
		fill(255)
	}
	rect(width * 1 / 3, height * 1.5 / 4, width * 1 / 3, height * 0.5 / 4)
	textAlign(LEFT)
	textSize(width / 80)
	fill(0)

	if (frameCount % 30 < 15 && listenUserName == true) {
		text("Username: " + username + "|", width * 1.05 / 3, height * 1.35 / 3)
	} else {
		text("Username: " + username, width * 1.05 / 3, height * 1.35 / 3)
	}


	//Game Start Button
	if (mouseX > width / 3 && mouseX < width * 2 / 3 && mouseY > height * 2 / 4 && mouseY < height * 3 / 4) {
		fill(220)
	} else {
		fill(255)
	}
	rect(width / 3, height * 2 / 4, width * 1 / 3, height * 1 / 4)
	textAlign(CENTER)
	textSize(width / 20)
	fill(0)
	text("ENTER", width / 2, height * 2.5 / 4)

	push()
	textFont(roadking_font)
	text("PING-PONG\nSHOOTOUT", width * 1 / 2, height * 0.8 / 4)
	pop()

	push()
	textSize(width * 1 / 60)
	textAlign(RIGHT)
	fill(255)
	text("Version 0.7.0 (Unified)", width * 9.9 / 10, height * 9.8 / 10)
	pop()


	startMenuFunctions()
}





function mouseClicked() {
	//Start screen functionality
	if (mode == "startPage") {
		//When clicking on the username box, then will start listening for keystrokes
		if (mouseX > width / 3 && mouseX < width * 2 / 3 && mouseY > height * 1.5 / 4 && mouseY < height * 2 / 4) {
			listenUserName = true
		}
		else if (mouseX < width / 3 || mouseX > width * 2 / 3 || mouseY < height * 1.5 / 4 || mouseY > height * 2 / 4) {
			listenUserName = false
		}

		//Clicking the "Enter Game" will establish the connection with server and start the game
		if (mouseX > width / 3 && mouseX < width * 2 / 3 && mouseY > height * 2 / 4 && mouseY < height * 3 / 4) {
			//Attempt to ping render web service
			socket = io.connect("wss://pingpongcombatgame-server.onrender.com");
			gameMusic.play()

			fullscreen(true)

			//Send username to the server
			listenUserName = false
			socket.emit("username", username)

			//Listen for initial team assignment
			socket.on("myTeam", (team) => {
				myTeam = team

				//Depending on team assigned, put the player at blue or red spawn
				if (team == "blue") {
					newPlayer(width * 1 / 8, height / 2, width * 1 / 20, width * 1 / 100, team)
				} else {
					newPlayer(width * 7 / 8, height / 2, width * 1 / 20, width * 1 / 100, team)
				}

				//Lets the other game functionality kick into play
				mode = "fight"
				gameStart = true
			})


			//Creating some static walls to prevent the player from entering out-of-bounds areas

			//Mission Control Panel
			WM.newStaticWall(width * 1 / 2, height * 1 / 8, width * 1 / 2, height * 1 / 4)

			//HUD Area Walls
			WM.newStaticWall(width * 1 / 2, height * 7 / 8, width * 1 / 2, height * 1 / 4)

			//Map Boundary: Top
			WM.newStaticWall(width * 1 / 2, 0, width, 1)

			//Map Boundary: Bottom
			WM.newStaticWall(width * 1 / 2, height, width, 1)

			//Map Boundary: Left
			WM.newStaticWall(0, height * 1 / 2, 1, height)

			//Map Boundary: Right
			WM.newStaticWall(width, height * 1 / 2, 1, height)
		}
	}

	//Allows shooting
	else if (mode == "fight") {
		if (shootCharge >= 30) {
			playerShoot(width * 1 / 50, width * 1 / 100)
			shootCharge -= 30
		}
	}

	//Builds the actual wall (not just show the interface)
	else if (mode == "build") {
		if (buildCharge >= 200) {
			buildWall()
		}
	}


	else if (mode == "gameOver") {
		if(mouseX > width * 0.95/3 && mouseX < width * 2.05/3 && mouseY > height * 1.95/4 && mouseY < height * 3.05/4) {
			location.reload()
			console.log("Attempted Reload")
		}
	}
}





function keyTyped() {
	//Listens for regular keys when inputting username
	if (listenUserName == true) {
		username += key
	}

	//Listens for "B" or "F" to switch into "build" or "fight" mode respectively
	if (gameStart == true) {
		if (keyCode == 66) {
			mode = "build"
		}
		if (keyCode == 70) {
			mode = "fight"
		}
	}
}





//Listens for the backspace key to know when to delete the last character of username (only at start screen)
function keyReleased() {
	if (listenUserName == true) {
		if (key == "Backspace") {
			username = username.substring(0, username.length - 1)
		}

		if(key == " ") {
			username = username + " "
		}
	}
}
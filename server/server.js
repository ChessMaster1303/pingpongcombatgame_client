import { Server } from "socket.io";

//create http server forwarding network traffic to socketio server
const io = new Server(8001, {
    cors: {
        origin: "*",
    },
});

console.log("Server is Running")

//Will store the information of all players (player position + client connection data)
const clients = []

//Team information (will store client IDs)
const blueTeam = []
const redTeam = []

//Ensures 60fps experience for clients
const TICK_DELAY = 1000 / 60

//To keep track of ticks elasped since server start. Will be used to determine which client is sending the most up-to-date information
let ticksElapsed = 0

//allDataCollection will keep the simulation data from all clients, then compare them later
let allDataCollection = []


//This will be used to store the information of all players & clients
class Client {
    constructor(socket) {
        this.socket = socket;
    }
}


function tick() {
    //Emit player data periodically (regardless of simulation)
    let playersData = []
    for (let i = 0; i < clients.length; i++) {
        playersData.push({ id: clients[i].socket.id, username: clients[i].username, team: clients[i].team, position: clients[i].position, rotation: clients[i].rotation })
    }
    for (let i = 0; i < clients.length; i++) {
        //Emits the position of all the players to all connected players
        clients[i].socket.emit("playersData", playersData)
    }

    //For simulation
    if (ticksElapsed % 5 == 0) {
        checkData()

    }

    ticksElapsed++
}



function checkData() {
    let shortestGap = Infinity
    let origin = NaN
    let accuratePlayerHealth
    let accurateProjectileData
    let accurateWallData

    //Choosing the data that is simulated the latest
    for (let i = 0; i < allDataCollection.length; i++) {
        let gap = ticksElapsed - allDataCollection[i][0]
        if (gap < shortestGap) {
            origin = allDataCollection[i][1]
            accuratePlayerHealth = allDataCollection[i][2]
            accurateProjectileData = allDataCollection[i][3]
            accurateWallData = allDataCollection[i][4]
        } else {
            continue
        }
    }

    //Sending the most accurate data back to all clients
    for (let i = 0; i < clients.length; i++) {
        clients[i].socket.emit("simulationUpdate", ticksElapsed, origin, accuratePlayerHealth, accurateProjectileData, accurateWallData)
    }
}



//For dead victims
function removePlayerData(victim) {
    //Removing the victim from the player lists
    let username

    for (let i = 0; i < clients.length; i++) {
        if (clients[i].socket.id == victim) {
            username = clients[i].username
            clients.splice(i, 1)
        } else {
            continue
        }
    }
    for (let i = 0; i < blueTeam.length; i++) {
        if (blueTeam[i] == victim) {
            blueTeam.splice(i, 1)
        } else {
            continue
        }
    }
    for (let i = 0; i < redTeam.length; i++) {
        if (redTeam[i] == victim) {
            redTeam.splice(i, 1)
        } else {
            continue
        }
    }

    console.log("--------------------------------------------")
    console.log("Client has died: " + victim + " (" + username + ")")
    console.log("Number of Clients: " + clients.length)
    console.log("Blue Team: " + blueTeam.length + " players")
    console.log("Red Team: " + redTeam.length + " players")
}



setInterval(tick, TICK_DELAY);




//This establishes a connection with each and every client. Only in this function, is "socket" (think of it as a connection) is defined and its functions can be used
io.on("connection", socket => {
    //Think of the "Client" object just as a way to store everything
    let client = new Client(socket)
    clients.push(client)

    console.log("--------------------------------------------")
    console.log("New Client Connection: " + client.socket.id + " (" + client.username + ")");
    console.log("Number of Clients: " + clients.length)

    if (blueTeam.length <= redTeam.length) {
        client.team = "blue"
        blueTeam.push(client.socket.id)
        client.socket.emit("myTeam", "blue")
    } else {
        client.team = "red"
        redTeam.push(client.socket.id)
        client.socket.emit("myTeam", "red")
    }

    console.log("Blue Team: " + blueTeam.length + " players")
    console.log("Red Team: " + redTeam.length + " players")

    socket.on("username", (username) => {
        client.username = username
    })

    //Lets the client know the current tick count of the server
    socket.emit("currentTick", ticksElapsed)


    //Constantly receiving information about each client's position
    socket.on("myPlayerPosition", (x, y, rotation) => {
        client.position = { x, y };
        client.rotation = rotation
    });


    //Will forward the new projectile data to all clients (this bypasses simulation stage)
    socket.on("newProjectile", (x, y, speed, dir, d, bounceLeft, team, origin, id) => {
        for (let i = 0; i < clients.length; i++) {
            clients[i].socket.emit("initialiseProjectile", x, y, speed, dir, d, bounceLeft, team, origin, id)
        }
    })


    //Will forward the new wall information to all clients (bypass simulation)
    socket.on("newWall", (team, index) => {
        for (let i = 0; i < clients.length; i++) {
            clients[i].socket.emit("initialiseWall", team, index)
        }
    })


    socket.on("allData", allData => {
        allDataCollection.push(allData)
    })


    socket.on("killPlayer", (victim, killer) => {
        for (let i = 0; i < clients.length; i++) {
            clients[i].socket.emit("playerDied", victim, killer)
        }

        removePlayerData(victim)
    })


    //When a client disconnects
    socket.on("disconnect", () => {
        console.log("--------------------------------------------")

        for (let i = 0; i < clients.length; i++) {
            clients[i].socket.emit("removeClient", client.socket.id)
            if(clients[i].socket.id == client.socket.id) {
                clients.splice(i, 1)
            }
        }

        for(let i = 0; i < blueTeam.length; i++) {
            if(blueTeam[i] == client.socket.id) {
                blueTeam.splice(i, 1)
            }
        }
        for(let i = 0; i < redTeam.length; i++) {
            if(redTeam[i] == client.socket.id)
                redTeam.splice(i, 1)
        }


        console.log("Client Disconnected: " + client.socket.id + " (" + client.username + ")")
        console.log("Number of Clients: " + clients.length)

        console.log("Blue Team: " + blueTeam.length + " players")
        console.log("Red Team: " + redTeam.length + " players")
    })
})
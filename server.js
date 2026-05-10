const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const messagesFile = "messages.json";

// Charger anciens messages
function loadMessages() {
    try {
        const data = fs.readFileSync(messagesFile);
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Sauvegarder messages
function saveMessages(messages) {
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
}

let messages = loadMessages();

io.on("connection", (socket) => {
    console.log("Utilisateur connecté");

    // Envoyer ancien historique au nouvel utilisateur
    socket.emit("load messages", messages);

    socket.on("chat message", (msg) => {
        messages.push(msg);
        saveMessages(messages);

        io.emit("chat message", msg);
    });

    socket.on("disconnect", () => {
        console.log("Utilisateur déconnecté");
    });
});

server.listen(3000, () => {
    console.log("Serveur lancé sur http://localhost:3000");
});
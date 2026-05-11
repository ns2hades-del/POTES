const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));
app.use(express.json());

const usersFile = "users.json";
const messagesFile = "messages.json";
const groupsFile = "groups.json";

function loadData(file) {
    try {
        return JSON.parse(fs.readFileSync(file));
    } catch {
        return [];
    }
}

function saveData(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

let users = loadData(usersFile);
let messages = loadData(messagesFile);
let groups = loadData(groupsFile);

let onlineUsers = [];

app.get("/users", (req, res) => {
    res.json(users);
});

app.get("/groups", (req, res) => {
    res.json(groups);
});

app.post("/register", (req, res) => {
    const { username, password } = req.body;

    const existingUser = users.find(
        user => user.username === username
    );

    if (existingUser) {
        return res.json({
            success: false,
            message: "Utilisateur déjà existant"
        });
    }

    const newUser = {
        username,
        password,
        bio: "",
        avatar: ""
    };

    users.push(newUser);
    saveData(usersFile, users);

    res.json({ success: true });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const user = users.find(
        user =>
            user.username === username &&
            user.password === password
    );

    if (user) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.post("/create-group", (req, res) => {
    const { groupName } = req.body;

    if (!groups.includes(groupName)) {
        groups.push(groupName);
        saveData(groupsFile, groups);
    }

    res.json({ success: true });
});

io.on("connection", socket => {
    socket.emit("load messages", messages);
    socket.emit("online users", onlineUsers);

    socket.on("user connected", username => {
        if (!onlineUsers.includes(username)) {
            onlineUsers.push(username);
        }

        io.emit("online users", onlineUsers);
    });

    socket.on("chat message", msg => {
        messages.push(msg);
        saveData(messagesFile, messages);

        io.emit("chat message", msg);
    });

    socket.on("disconnect", () => {
        io.emit("online users", onlineUsers);
    });
});

server.listen(3000, () => {
    console.log("Serveur lancé sur port 3000");
});
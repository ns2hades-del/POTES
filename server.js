const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const multer = require("multer");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

app.get("/users", async (req, res) => {
    const { data, error } = await supabase
        .from("users")
        .select("*");

    if (error) return res.json([]);

    res.json(data);
});

app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        const { data: existing } = await supabase
            .from("users")
            .select("*")
            .eq("username", username);

        if (existing && existing.length > 0) {
            return res.status(400).json({
                error: "Pseudo déjà pris"
            });
        }

        const { error } = await supabase
            .from("users")
            .insert([
                {
                    username,
                    password,
                    bio: "",
                    avatar: ""
                }
            ]);

        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Erreur serveur"
        });
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const { data } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single();

    if (!data) {
        return res.status(400).json({
            error: "Identifiants incorrects"
        });
    }

    res.json({ success: true });
});

app.post("/create-group", async (req, res) => {
    const { groupName } = req.body;

    await supabase
        .from("groups")
        .insert([{ name: groupName }]);

    res.json({ success: true });
});

app.post("/upload-avatar", upload.single("avatar"), async (req, res) => {
    const username = req.body.username;
    const file = req.file;

    if (!file) {
        return res.status(400).json({
            error: "Aucun fichier"
        });
    }

    const fileName = `${username}-${Date.now()}.png`;

    await supabase.storage
        .from("avatars")
        .upload(fileName, file.buffer, {
            contentType: file.mimetype
        });

    const {
        data: { publicUrl }
    } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

    await supabase
        .from("users")
        .update({ avatar: publicUrl })
        .eq("username", username);

    res.json({ avatar: publicUrl });
});

io.on("connection", socket => {
    socket.on("chat message", msg => {
        io.emit("chat message", msg);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Serveur lancé sur port " + PORT);
});
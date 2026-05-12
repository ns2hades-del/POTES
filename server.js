const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
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

const upload = multer({
    storage: multer.memoryStorage()
});

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

/* USERS */
app.get("/users", async (req, res) => {
    const { data, error } = await supabase
        .from("users")
        .select("*");

    if (error) {
        console.log(error);
        return res.json([]);
    }

    res.json(data || []);
});

/* GROUPS */
app.get("/groups", async (req, res) => {
    const { data, error } = await supabase
        .from("groups")
        .select("*");

    if (error) {
        console.log(error);
        return res.json([]);
    }

    res.json(data || []);
});

app.post("/create-group", async (req, res) => {
    const { groupName } = req.body;

    const { error } = await supabase
        .from("groups")
        .insert([{ name: groupName }]);

    if (error) {
        console.log(error);
        return res.status(500).json({
            error: error.message
        });
    }

    res.json({ success: true });
});

/* PRIVATE HISTORY */
app.get("/messages/:user1/:user2", async (req, res) => {
    const { user1, user2 } = req.params;

    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
            `and(from_user.eq.${user1},to_user.eq.${user2}),and(from_user.eq.${user2},to_user.eq.${user1})`
        )
        .order("created_at", { ascending: true });

    if (error) {
        console.log(error);
        return res.json([]);
    }

    res.json(data || []);
});

/* GROUP HISTORY */
app.get("/group-messages/:group", async (req, res) => {
    const { group } = req.params;

    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("group_name", group)
        .order("created_at", { ascending: true });

    if (error) {
        console.log(error);
        return res.json([]);
    }

    res.json(data || []);
});

/* REGISTER */
app.post("/register", async (req, res) => {
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
        console.log(error);
        return res.status(500).json({
            error: error.message
        });
    }

    res.json({ success: true });
});

/* LOGIN */
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

    res.json({
        success: true,
        user: data
    });
});

/* AVATAR */
app.post("/upload-avatar", upload.single("avatar"), async (req, res) => {
    try {
        const username = req.body.username;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                error: "Aucun fichier"
            });
        }

        const fileName = `${username}-${Date.now()}`;

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

        res.json({
            success: true,
            avatar: publicUrl
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Erreur upload"
        });
    }
});

/* SOCKET */
io.on("connection", socket => {
    socket.on("chat message", async msg => {
        const { error } = await supabase
            .from("messages")
            .insert([
                {
                    from_user: msg.from,
                    to_user: msg.to || "",
                    group_name: msg.group || "",
                    text: msg.text
                }
            ]);

        console.log("Insert message :", error || "OK");

        io.emit("chat message", msg);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Serveur lancé sur port " + PORT);
});
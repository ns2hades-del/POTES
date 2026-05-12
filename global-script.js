const socket = io();
const currentUser = localStorage.getItem("username");
const messagesContainer = document.getElementById("messages");
let secretKey = "";

// Permission notifications
if (Notification.permission !== "granted") {
    Notification.requestPermission();
}

// Config chiffrement
fetch("/config")
.then(res => res.json())
.then(data => {
    secretKey = data.secret;
});

function encrypt(text) {
    if (!text || !secretKey) return text;
    return CryptoJS.AES.encrypt(text, secretKey).toString();
}

function decrypt(ciphertext) {
    if (!ciphertext || !secretKey) return ciphertext;
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
        return bytes.toString(CryptoJS.enc.Utf8) || ciphertext;
    } catch (e) {
        return ciphertext;
    }
}

function showNotification(from, text) {
    if (Notification.permission === "granted" && document.hidden) {
        new Notification(`Général: ${from}`, {
            body: text,
            icon: "logo-dark.png"
        });
    }
}

function sendGlobalMessage() {
    const input = document.getElementById("messageInput");

    if (input.value.trim() === "") return;

    const message = {
        type: "global",
        from: currentUser,
        text: encrypt(input.value)
    };

    socket.emit("chat message", message);
    input.value = "";
}

socket.on("load messages", (messages) => {
    messagesContainer.innerHTML = "";

    messages.forEach(msg => {
        if (msg.type === "global") {
            const decryptedMsg = { ...msg, text: decrypt(msg.text) };
            displayMessage(decryptedMsg);
        }
    });
});

socket.on("chat message", (msg) => {
    if (msg.type === "global") {
        const decryptedMsg = { ...msg, text: decrypt(msg.text) };
        displayMessage(decryptedMsg);
        if (msg.from !== currentUser) {
            showNotification(msg.from, decryptedMsg.text);
        }
    }
});

function displayMessage(msg) {
    const messagesContainer = document.getElementById("messages");
    const div = document.createElement("div");
    const isSent = msg.from === currentUser;
    
    const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.className = `message ${isSent ? 'message-sent' : 'message-received'}`;
    
    div.innerHTML = `
        <div class="message-info">${isSent ? 'Moi' : msg.from} • ${time} <span style="font-size: 10px; opacity: 0.5;">🔒</span></div>
        <div class="message-text">${msg.text}</div>
    `;

    messagesContainer.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    const container = document.getElementById("messages");
    container.scrollTop = container.scrollHeight;
}

document.getElementById("messageInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendGlobalMessage();
});
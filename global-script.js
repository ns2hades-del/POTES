const socket = io();
const currentUser = localStorage.getItem("username");
const messagesContainer = document.getElementById("messages");

function sendGlobalMessage() {
    const input = document.getElementById("messageInput");

    if (input.value.trim() === "") return;

    const message = {
        type: "global",
        from: currentUser,
        text: input.value
    };

    socket.emit("chat message", message);
    input.value = "";
}

socket.on("load messages", (messages) => {
    messagesContainer.innerHTML = "";

    messages.forEach(msg => {
        if (msg.type === "global") {
            displayMessage(msg);
        }
    });
});

socket.on("chat message", (msg) => {
    if (msg.type === "global") {
        displayMessage(msg);
    }
});

function displayMessage(msg) {
    const messagesContainer = document.getElementById("messages");
    const div = document.createElement("div");
    const isSent = msg.from === currentUser;
    
    div.className = `message ${isSent ? 'message-sent' : 'message-received'}`;
    
    div.innerHTML = `
        <div class="message-info">${isSent ? 'Moi' : msg.from}</div>
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
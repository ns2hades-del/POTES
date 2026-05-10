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
    const item = document.createElement("p");
    item.innerHTML = `<strong>${msg.from} :</strong> ${msg.text}`;
    messagesContainer.appendChild(item);
}
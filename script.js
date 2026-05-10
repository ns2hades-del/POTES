const socket = io();

const currentUser = localStorage.getItem("username");
const chatUser = localStorage.getItem("chatUser");

document.getElementById("chatTitle").innerText =
    "Discussion avec " + chatUser;

const messagesContainer = document.getElementById("messages");

function sendMessage() {
    const input = document.getElementById("messageInput");

    if (input.value.trim() === "") return;

    const message = {
        from: currentUser,
        to: chatUser,
        text: input.value
    };

    socket.emit("chat message", message);
    input.value = "";
}

socket.on("load messages", (messages) => {
    messagesContainer.innerHTML = "";

    messages.forEach(msg => {
        if (
            (msg.from === currentUser && msg.to === chatUser) ||
            (msg.from === chatUser && msg.to === currentUser)
        ) {
            displayMessage(msg);
        }
    });
});

socket.on("chat message", (msg) => {
    if (
        (msg.from === currentUser && msg.to === chatUser) ||
        (msg.from === chatUser && msg.to === currentUser)
    ) {
        displayMessage(msg);
    }
});

function displayMessage(msg) {
    const item = document.createElement("p");
    item.innerHTML = `<strong>${msg.from} :</strong> ${msg.text}`;
    messagesContainer.appendChild(item);
}
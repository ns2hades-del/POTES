async function register() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Remplis tous les champs");
        return;
    }

    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await response.json();

        if (data.success) {
            alert("Compte créé avec succès");
        } else {
            alert(data.error || "Erreur inscription");
        }

    } catch (error) {
        console.error(error);
        alert("Erreur serveur");
    }
}

async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Remplis tous les champs");
        return;
    }

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem("username", username);
            window.location.href = "home.html";
        } else {
            alert(data.error || "Connexion refusée");
        }

    } catch (error) {
        console.error(error);
        alert("Erreur serveur");
    }
}
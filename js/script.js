import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAceW9Yh2jRfY3pCFawWCTzP4Hvngt1V8g",
    authDomain: "rbxgang-86d30.firebaseapp.com",
    projectId: "rbxgang-86d30",
    storageBucket: "rbxgang-86d30.firebasestorage.app",
    messagingSenderId: "35329039357",
    appId: "1:35329039357:web:2430fb26473ef1e9fd1794"
};

// SOLUCIÓN AL ERROR: Verificar si la app ya existe antes de inicializar
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Diccionario de Logos (SVG) - Sin cambios
const Icons = {
    discord: `<svg viewBox="0 0 127.14 96.36" style="width:18px;"><path fill="currentColor" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.39,80.21a105.73,105.73,0,0,0,32.27,16.15,77.7,77.7,0,0,0,7.21-11.73,69.19,69.19,0,0,1-11.44-5.46c.97-.7,1.92-1.42,2.83-2.17a73.58,73.58,0,0,0,64.9,0c.91.75,1.86,1.47,2.83,2.17a69.1,69.1,0,0,1-11.44,5.46,77.35,77.35,0,0,0,7.21,11.73,105.54,105.54,0,0,0,32.27-16.15C130.58,52.25,126,28.42,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5.17-12.69,11.44-12.69S53.9,46,53.9,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.17-12.69,11.44-12.69S96.15,46,96.15,53,91,65.69,84.69,65.69Z"/></svg>`,
    dashboard: `<svg viewBox="0 0 24 24" style="width:16px;"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 13.125C3 12.504 3.504 12 4.125 12h5.75c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-5.75A1.125 1.125 0 0 1 3 19.875v-6.75zM13 4.125C13 3.504 13.504 3 14.125 3h5.75c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-5.75A1.125 1.125 0 0 1 13 10.875v-6.75zM3 4.125C3 3.504 3.504 3 4.125 3h5.75c.621 0 1.125.504 1.125 1.125v2.75c0 .621-.504 1.125-1.125 1.125h-5.75A1.125 1.125 0 0 1 3 6.875v-2.75zM13 17.125c0-.621.504-1.125 1.125-1.125h5.75c.621 0 1.125.504 1.125 1.125v2.75c0 .621-.504 1.125-1.125 1.125h-5.75a1.125 1.125 0 0 1-1.125-1.125v-2.75z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" style="width:16px;"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    logout: `<svg viewBox="0 0 24 24" style="width:16px;"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>`
};

document.addEventListener("DOMContentLoaded", async () => {
    if (localStorage.getItem('user_logged_out') !== 'true') {
        await autoLoginByBID();
    }
    renderTopbar();
});

// El resto de tus funciones se mantienen igual
async function autoLoginByBID() {
    if (localStorage.getItem('rbx_user')) return;

    // 1. Verificar si ya tiene device_bid
    let bid = localStorage.getItem('device_bid');
    
    // 2. Si no existe, generar uno aleatorio
    if (!bid) {
        bid = Date.now().toString() + Math.floor(Math.random() * 10000); 
        localStorage.setItem('device_bid', bid);
    }

    try {
        const q = query(collection(db, "users"), where("browserId", "==", bid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Si existe un usuario con este BID, guardarlo
            const userData = querySnapshot.docs[0].data();
            localStorage.setItem('rbx_user', JSON.stringify(userData));
        }
        // Si no existe, no se hace nada (usuario anónimo)
    } catch (error) { 
        console.error("Error identificando:", error); 
    }
}


function renderTopbar() {
    const authBtn = document.getElementById('auth-btn');
    const dropdown = document.getElementById('auth-dropdown');
    if (!authBtn) return;

    const rbxUser = JSON.parse(localStorage.getItem('rbx_user'));

    if (rbxUser) {
        const discordAvatar = `https://cdn.discordapp.com/avatars/${rbxUser.discordId}/${rbxUser.avatar || 'default'}.png`;

        authBtn.className = "user-auth-wrapper"; 
        authBtn.innerHTML = `
            <div class="user-pill">
                <div class="avatar-container">
                    <img src="${discordAvatar}" 
                         class="nav-avatar" 
                         alt="Discord Avatar"
                         onerror="this.onerror=null; this.src='https://cdn.discordapp.com/embed/avatars/0.png';">
                </div>
                <span class="nav-username">${rbxUser.discordName}</span>
                <span class="nav-arrow">▼</span>
            </div>
        `;
        
        dropdown.innerHTML = `
            <a href="/profile/dashboard">${Icons.dashboard} <span>Dashboard</span></a>
            <a href="/profile/configure">${Icons.settings} <span>Configuración</span></a>
            <hr style="border:0; border-top:1px solid rgba(255,255,255,0.1); margin:8px 0;">
            <a href="#" onclick="logout()" class="logout-link">${Icons.logout} <span>Cerrar Sesión</span></a>
        `;

        authBtn.onclick = (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        };
    } else {
        authBtn.innerHTML = `<div class="btn-discord-content">${Icons.discord} <span>Login con Discord</span></div>`;
        authBtn.className = "btn-login-discord";
        authBtn.onclick = window.loginWithDiscord;
    }
}

window.loginWithDiscord = function() {
    localStorage.removeItem('user_logged_out');
    const CLIENT_ID = '1472654015702499550';
    const REDIRECT_URI = encodeURIComponent('http://127.0.0.1:5500/auth/set-up/'); 
    window.location.href = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=identify+guilds.join`;
};

window.logout = function() {
    localStorage.setItem('user_logged_out', 'true');
    localStorage.removeItem('rbx_user');
    window.location.reload();
};

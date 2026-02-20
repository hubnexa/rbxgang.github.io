import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAceW9Yh2jRfY3pCFawWCTzP4Hvngt1V8g",
    authDomain: "rbxgang-86d30.firebaseapp.com",
    projectId: "rbxgang-86d30",
    storageBucket: "rbxgang-86d30.firebasestorage.app",
    messagingSenderId: "35329039357",
    appId: "1:35329039357:web:2430fb26473ef1e9fd1794"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const STAFF_JSON = { "1403182631704858645": "Owner" };

const Icons = {
    discord: `<svg viewBox="0 0 127.14 96.36" style="width:18px;"><path fill="currentColor" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.39,80.21a105.73,105.73,0,0,0,32.27,16.15,77.7,77.7,0,0,0,7.21-11.73,69.19,69.19,0,0,1-11.44-5.46c.97-.7,1.92-1.42,2.83-2.17a73.58,73.58,0,0,0,64.9,0c.91.75,1.86,1.47,2.83,2.17a69.1,69.1,0,0,1-11.44,5.46,77.35,77.35,0,0,0,7.21,11.73,105.54,105.54,0,0,0,32.27-16.15C130.58,52.25,126,28.42,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5.17-12.69,11.44-12.69S53.9,46,53.9,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.17-12.69,11.44-12.69S96.15,46,96.15,53,91,65.69,84.69,65.69Z"/></svg>`,
    dashboard: `<svg viewBox="0 0 24 24" style="width:16px;"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 13.125C3 12.504 3.504 12 4.125 12h5.75c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-5.75A1.125 1.125 0 0 1 3 19.875v-6.75zM13 4.125C13 3.504 13.504 3 14.125 3h5.75c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-5.75A1.125 1.125 0 0 1 13 10.875v-6.75zM3 4.125C3 3.504 3.504 3 4.125 3h5.75c.621 0 1.125.504 1.125 1.125v2.75c0 .621-.504 1.125-1.125 1.125h-5.75A1.125 1.125 0 0 1 3 6.875v-2.75zM13 17.125c0-.621.504-1.125 1.125-1.125h5.75c.621 0 1.125.504 1.125 1.125v2.75c0 .621-.504 1.125-1.125 1.125h-5.75a1.125 1.125 0 0 1-1.125-1.125v-2.75z"/></svg>`,
    logout: `<svg viewBox="0 0 24 24" style="width:16px;"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>`,
    ranks: {
        Basic: `<svg viewBox="0 0 24 24" width="12" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="8"/></svg>`,
        VIP: `<svg viewBox="0 0 24 24" width="12" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
        Owner: `<svg viewBox="0 0 24 24" width="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 15l-2 1V4l2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1v12l-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/></svg>`
    }
};

const RANK_CONFIG = {
    "Basic": { color: "#a0a0a0" }, "VIP": { color: "#8b5cf6" }, "Bronce": { color: "#cd7f32" },
    "Plata": { color: "#c0c0c0" }, "Oro": { color: "#ffd700" }, "Admin": { color: "#ef4444" }, "Owner": { color: "#ff5c5c" }
};

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Detección de AdBlock (Anzuelo invisible)
    const detectAdBlock = () => {
        const ad = document.createElement('div');
        ad.className = 'adsbox ads-indicator google-ad-manager';
        ad.setAttribute('style', 'position:absolute;left:-999px;top:-999px;width:1px;height:1px;');
        document.body.appendChild(ad);
        const isBlocked = ad.offsetHeight === 0 || window.getComputedStyle(ad).display === 'none';
        ad.remove();
        return isBlocked;
    };

    if (detectAdBlock()) {
        window.location.replace("/auth/detect/?type=adblocker");
        return;
    }

    // 2. Detección VPN/Proxy
    try {
        const vpnRes = await fetch('https://ipapi.co/json/');
        const data = await vpnRes.json();
        if (data.security?.proxy || data.security?.vpn || data.org?.toLowerCase().includes("hosting")) {
            window.location.replace("/auth/detect/?type=vpn");
            return;
        }
    } catch (e) { console.warn("VPN check skipped"); }

    if (localStorage.getItem('user_logged_out') !== 'true') {
        await autoLoginByBID();
    }
    checkAccessControl();
    renderTopbar();
});

function checkAccessControl() {
    const path = window.location.pathname;
    const user = localStorage.getItem('rbx_user');
    const isPublicPage = path === "/" || path === "/index.html" || path.startsWith("/help/") || path.startsWith("/legal/") || path.startsWith("/error/") || path.startsWith("/auth/detect/");
    if (!isPublicPage && !user) window.location.href = "/error/auth/";
}

async function autoLoginByBID() {
    if (localStorage.getItem('rbx_user')) return;
    let bid = localStorage.getItem('device_bid');
    if (!bid) {
        bid = Date.now().toString() + Math.floor(Math.random() * 10000); 
        localStorage.setItem('device_bid', bid);
    }

    try {
        const q = query(collection(db, "users"), where("browserId", "==", bid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            let userData = userDoc.data();
            
            // Unificamos a "Rank" con R mayúscula
            let finalRank = STAFF_JSON[userData.discordId] || userData.Rank || "Basic";
            if (userData.Rank !== finalRank) {
                await updateDoc(doc(db, "users", userDoc.id), { Rank: finalRank });
                userData.Rank = finalRank;
            }
            localStorage.setItem('rbx_user', JSON.stringify(userData));
        }
    } catch (error) { console.error("Auth Error:", error); }
}

function renderTopbar() {
    const navElement = document.querySelector('.topbar');
    if (!navElement) return;

    const rbxUser = JSON.parse(localStorage.getItem('rbx_user'));

    navElement.innerHTML = `
        <div class="logo">RBX<span class="brand-accent">Gang</span></div>
        <ul class="nav-links">
            <li><a href="/">Inicio</a></li>
            <li><a href="/plans/">Planes</a></li>
            <li><a href="/events">Eventos</a></li>
            <li><a href="/help/us">Nosotros</a></li>
            <li><a href="/transparency">Trasnparencia</a></li>
        </ul>
        <div class="auth-container" id="auth-wrapper"></div>
    `;

    const wrapper = document.getElementById('auth-wrapper');

    if (rbxUser) {
        const avatar = `https://cdn.discordapp.com/avatars/${rbxUser.discordId}/${rbxUser.avatar || 'default'}.png`;
        const userRank = rbxUser.Rank || "Basic";
        const rankStyle = RANK_CONFIG[userRank] || RANK_CONFIG["Basic"];
        const rankIcon = Icons.ranks[userRank] || Icons.ranks["Basic"];
        const rankClass = `rank-${userRank.toLowerCase()}`;

        wrapper.innerHTML = `
            <button id="auth-btn" class="user-auth-wrapper">
                <div class="user-pill">
                    <div class="avatar-container">
                        <img src="${avatar}" class="nav-avatar" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png';">
                    </div>
                    <span class="nav-username">${rbxUser.discordName}</span>
                    <span class="nav-arrow">▼</span>
                </div>
            </button>
            <div class="rank-tag ${rankClass}" style="border-color: ${rankStyle.color}; color: ${rankStyle.color};">
                ${rankIcon} <span>${userRank}</span>
            </div>
            <div id="auth-dropdown" class="dropdown-content">
                <a href="/profile/dashboard">${Icons.dashboard} <span>Dashboard</span></a>
                <hr style="border:0; border-top:1px solid rgba(255,255,255,0.1); margin:8px 0;">
                <a href="#" onclick="logout()" class="logout-link">${Icons.logout} <span>Cerrar Sesión</span></a>
            </div>
        `;

        document.getElementById('auth-btn').onclick = (e) => {
            e.stopPropagation();
            document.getElementById('auth-dropdown').classList.toggle('show');
        };
    } else {
        wrapper.innerHTML = `
            <button id="auth-btn" class="btn-login-discord" onclick="window.loginWithDiscord()">
                <div class="btn-discord-content">${Icons.discord} <span>Login</span></div>
            </button>
        `;
    }
}

window.logout = function() {
    localStorage.setItem('user_logged_out', 'true');
    localStorage.removeItem('rbx_user');
    window.location.href = "/";
};

window.loginWithDiscord = () => {
    const CLIENT_ID = '1472654015702499550';
    const REDIRECT_URI = encodeURIComponent('https://rbxgang.xyz/auth/set-up/'); 
    window.location.href = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=identify+guilds.join`;
};
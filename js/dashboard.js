import { db } from '/firebase-config.js';
import { 
    doc, getDoc, setDoc, updateDoc, deleteDoc, increment, 
    arrayUnion, collection, query, where, getDocs, orderBy, limit, addDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const OWNER_ID = "1403182631704858645";
const currentUser = JSON.parse(localStorage.getItem('rbx_user'));

const ROBUX_PACKS = [
    { id: 1, robux: 800, price: 680 },
    { id: 2, robux: 1700, price: 1360 },
    { id: 3, robux: 4500, price: 3400 },
    { id: 4, robux: 10000, price: 6800 }
];

let isClaiming = false; // Bloqueo de seguridad

// ... (mismo encabezado de imports y OWNER_ID)

async function initDashboard() {
    if (!currentUser) return window.location.href = "/";

    const dashRef = doc(db, "Dashboard", currentUser.discordId);
    const balRef = doc(db, "Balance", currentUser.discordId);

    try {
        const dashSnap = await getDoc(dashRef);
        const isAdminValue = currentUser.discordId === OWNER_ID;

        if (!dashSnap.exists()) {
            // Si es nuevo, pedimos el usuario de Roblox por primera vez
            const rbxName = prompt("Bienvenido! Ingresa tu usuario de Roblox para vincularlo:");
            
            await setDoc(dashRef, {
                discordName: currentUser.discordName,
                robloxUser: rbxName || "No vinculado", // Guardamos el usuario de Roblox
                robuxTotales: 0,
                invitados: 0,
                isAdmin: isAdminValue,
                isBlocked: false,
                redeemedCodes: [],
                lastLogin: new Date()
            });
        }

        const balSnap = await getDoc(balRef);
        if (!balSnap.exists()) await setDoc(balRef, { credits: 0.00 });

        if (dashSnap.exists() && dashSnap.data().isBlocked) {
            alert("Tu cuenta ha sido suspendida.");
            return logout();
        }

        renderUserData();
        renderPacks();

        async function checkDailyAutoOpen() {
    const actRef = doc(db, "Activity", currentUser.discordId);
    const actSnap = await getDoc(actRef);
    const todayStr = new Date().toISOString().split('T')[0];

    if (!actSnap.exists() || actSnap.data().lastClaim !== todayStr) {
        setTimeout(() => openDailyModal(), 1500); // Abre después de 1.5s para no saturar
    }
}
// Llamar dentro de initDashboard() al final.
    } catch (error) { console.error("DB Error:", error); }
}

// COMPRA DE PACKS (ACTUALIZADA)
window.buyPack = async (packId) => {
    const pack = ROBUX_PACKS.find(p => p.id === packId);
    const dashRef = doc(db, "Dashboard", currentUser.discordId);
    const balRef = doc(db, "Balance", currentUser.discordId);
    
    try {
        const dashSnap = await getDoc(dashRef);
        const balSnap = await getDoc(balRef);
        const userData = dashSnap.data();

        // Validar si tiene el usuario de Roblox guardado
        if (!userData.robloxUser || userData.robloxUser === "No vinculado") {
            const newRbx = prompt("No tienes un usuario de Roblox guardado. Ingrésalo ahora:");
            if (!newRbx) return;
            await updateDoc(dashRef, { robloxUser: newRbx });
            userData.robloxUser = newRbx;
        }

        if (balSnap.data().credits < pack.price) {
            return showNotification("SALDO", "Créditos insuficientes", "err");
        }

        // Confirmación de compra
        if(!confirm(`¿Comprar ${pack.robux} Robux por ${pack.price} créditos para el usuario ${userData.robloxUser}?`)) return;

        await updateDoc(balRef, { credits: increment(-pack.price) });

        const transRef = await addDoc(collection(db, "Transactions"), {
            userId: currentUser.discordId,
            userName: currentUser.discordName,
            robloxUser: userData.robloxUser, // Guardamos la referencia en la transacción
            type: "PURCHASE",
            detail: `${pack.robux} Robux`,
            amount: -pack.price,
            date: new Date()
        });

        // Generar voucher con el usuario guardado automáticamente
        showVoucher(pack.robux, userData.robloxUser, transRef.id);
        renderUserData();

    } catch (e) { 
        console.error(e);
        showNotification("ERROR", "Fallo en la transacción", "err"); 
    }
};

async function renderUserData() {
    // Referencias a las 3 colecciones
    const dashSnap = await getDoc(doc(db, "Dashboard", currentUser.discordId));
    const balSnap = await getDoc(doc(db, "Balance", currentUser.discordId));
    const userSnap = await getDoc(doc(db, "users", currentUser.discordId)); // <--- Tu ubicación específica

    const dashData = dashSnap.data();
    const userData = userSnap.exists() ? userSnap.data() : null;

    // Renderizar datos de Dashboard y Balance
    document.getElementById('user-total-robux').innerText = `R$ ${dashData.robuxTotales}`;
    document.getElementById('user-balance').innerText = balSnap.data().credits.toFixed(2);
    document.getElementById('user-invites').innerText = dashData.invitados;

    // Renderizar dato desde la colección Users
    const rbxName = userData ? userData.robloxUser : "No vinculado";
    document.getElementById('user-roblox-name').innerText = rbxName;

    // Control de acceso Staff
    if (dashData.isAdmin || currentUser.discordId === OWNER_ID) {
        document.getElementById('nav-admin').style.display = 'flex';
        document.getElementById('nav-payments').style.display = 'flex';
    }
}

function renderPacks() {
    const container = document.getElementById('packs-container');
    if (!container) return;
    container.innerHTML = ROBUX_PACKS.map(p => `
        <div class="pack-card">
            <div class="pack-icon">R$</div>
            <h4>${p.robux} Robux</h4>
            <p>${p.price} Créditos</p>
            <button class="btn-login" onclick="buyPack(${p.id})">COMPRAR</button>
        </div>
    `).join('');
}

// SISTEMA PROMOCODES
window.redeemCode = async () => {
    const code = document.getElementById('promo-input').value.trim().toUpperCase();
    if (!code) return showNotification("AVISO", "Ingrese un código", "warn");

    const promoRef = doc(db, "Promocodes", code);
    const dashRef = doc(db, "Dashboard", currentUser.discordId);

    try {
        const promoSnap = await getDoc(promoRef);
        const dashSnap = await getDoc(dashRef);
        const dashData = dashSnap.data();

        if (!promoSnap.exists()) return showNotification("ERROR", "Código no válido", "err");
        if (dashData.redeemedCodes?.includes(code)) return showNotification("ERROR", "Ya usado", "err");

        const val = promoSnap.data().value;
        await updateDoc(doc(db, "Balance", currentUser.discordId), { credits: increment(val) });
        await updateDoc(dashRef, { redeemedCodes: arrayUnion(code) });

        await addDoc(collection(db, "Transactions"), {
            userId: currentUser.discordId,
            userName: currentUser.discordName,
            type: "PROMOCODE",
            detail: code,
            amount: val,
            date: new Date()
        });

        showNotification("ÉXITO", `Recibiste ${val} créditos`, "ok");
        renderUserData();
    } catch (e) { showNotification("ERROR", "Fallo en sistema", "err"); }
};

// COMPRA DE PACKS
function generateGangID() {
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `GANG_${part1}_${part2}`;
}

window.showConfirm = (title, text) => {
    return new Promise((resolve) => {
        const modal = document.getElementById('dash-modal');
        const footer = document.getElementById('modal-footer');
        
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-text').innerText = text;
        document.getElementById('modal-icon-container').innerHTML = `
            <svg width="50" height="50" viewBox="0 0 24 24" fill="#8b5cf6"><path d="M11 9h2V7h-2v2zm0 8h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
        `;

        footer.innerHTML = `
            <button class="btn-login danger" id="confirm-cancel">CANCELAR</button>
            <button class="btn-login" id="confirm-ok">CONFIRMAR</button>
        `;

        modal.classList.add('show');

        document.getElementById('confirm-ok').onclick = () => {
            modal.classList.remove('show');
            resolve(true);
        };
        document.getElementById('confirm-cancel').onclick = () => {
            modal.classList.remove('show');
            resolve(false);
        };
    });
};

window.buyPack = async (packId) => {
    const pack = ROBUX_PACKS.find(p => p.id === packId);
    const balRef = doc(db, "Balance", currentUser.discordId);
    
    try {
        const userSnap = await getDoc(doc(db, "users", currentUser.discordId));
        const balSnap = await getDoc(balRef);
        const robloxUser = userSnap.exists() ? userSnap.data().robloxUser : null;

        if (!robloxUser || robloxUser === "No vinculado") {
            return showNotification("VINCULACIÓN", "Vincula tu Roblox primero.", "warn");
        }

        if (balSnap.data().credits < pack.price) {
            return showNotification("SALDO", "Créditos insuficientes", "err");
        }

        const confirmed = await showConfirm("CONFIRMAR", `¿Comprar ${pack.robux} Robux?`);
        if (!confirmed) return;

        // --- GENERACIÓN DE VOUCHER PERSONALIZADO ---
        const customVoucherID = generateGangID();

        await updateDoc(balRef, { credits: increment(-pack.price) });

        // Guardamos el voucher con el ID personalizado como ID del documento
        await setDoc(doc(db, "Vouchers", customVoucherID), {
            voucherId: customVoucherID,
            userId: currentUser.discordId,
            userName: currentUser.discordName,
            robloxUser: robloxUser,
            amount: pack.robux,
            status: "PENDING",
            date: new Date()
        });

        // Registrar en historial de transacciones
        await addDoc(collection(db, "Transactions"), {
            userId: currentUser.discordId,
            type: "PURCHASE",
            detail: `Voucher: ${customVoucherID}`,
            amount: -pack.price,
            date: new Date()
        });

        showVoucher(pack.robux, robloxUser, customVoucherID);
        renderUserData();

    } catch (e) { 
        console.error(e);
        showNotification("ERROR", "No se pudo procesar la compra", "err"); 
    }
};

function showVoucher(amount, roblox, tid) {
    const container = document.getElementById('voucher-data');
    container.innerHTML = `
        <div class="v-row"><span>CÓDIGO VOUCHER:</span> <b style="color:var(--primary)">${tid}</b></div>
        <div class="v-row"><span>ROBLOX USER:</span> <b>${roblox}</b></div>
        <div class="v-row"><span>CANTIDAD:</span> <b style="color:var(--accent)">R$ ${amount}</b></div>
        <div class="v-row"><span>USUARIO:</span> <small>${currentUser.discordName}</small></div>
    `;
    document.getElementById('voucher-modal').classList.add('show');
}
// ADMIN ACCIONES
window.adminAction = async (type) => {
    const target = document.getElementById('admin-user-id').value.trim();
    if(!target) return showNotification("ADMIN", "Falta ID de Usuario", "warn");

    const userRef = doc(db, "Dashboard", target);
    const balRef = doc(db, "Balance", target);

    try {
        if (type === 'CREDITS') {
            const amount = parseFloat(document.getElementById('admin-user-credits').value);
            await updateDoc(balRef, { credits: increment(amount) });
            showNotification("ADMIN", "Saldo actualizado", "ok");
        } else if (type === 'BLOCK') {
            if (target === OWNER_ID) return showNotification("ERROR", "Inmune", "err");
            await updateDoc(userRef, { isBlocked: true });
            showNotification("ADMIN", "Bloqueado", "ok");
        } else if (type === 'MAKE_ADMIN') {
            if (currentUser.discordId !== OWNER_ID) return showNotification("ERROR", "Solo Owner", "err");
            await updateDoc(userRef, { isAdmin: true });
            showNotification("ADMIN", "Nuevo Admin", "ok");
        }
    } catch (e) { showNotification("ERROR", "Usuario no existe", "err"); }
};

window.createPromo = async () => {
    const name = document.getElementById('admin-promo-name').value.trim().toUpperCase();
    const val = parseFloat(document.getElementById('admin-promo-value').value);
    if(!name || isNaN(val)) return;

    await setDoc(doc(db, "Promocodes", name), { value: val, creator: currentUser.discordName, date: new Date() });
    showNotification("ADMIN", "Código creado", "ok");
    loadAdminData();
};

async function loadPaymentsPanel() {
    const container = document.getElementById('pending-vouchers-list');
    if (!container) return;

    // Solo mostramos los que están PENDING
    const q = query(collection(db, "Vouchers"), where("status", "==", "PENDING"), orderBy("date", "desc"));
    const snap = await getDocs(q);

    // Dentro de loadPaymentsPanel, en el .map:
container.innerHTML = snap.docs.map(v => {
    const d = v.data();
    // Usamos v.id para asegurarnos de referenciar el documento exacto en Firebase
    return `
    <div class="trans-item">
        <div class="v-info">
            <b style="color:var(--primary)">${d.voucherId}</b>
            <div style="display:flex; flex-direction:column; margin-top:5px;">
                <span>Roblox: <b class="accent">${d.robloxUser}</b></span>
                <small class="text-dim">Discord ID: ${d.userId}</small>
                <small class="text-dim">Monto: R$ ${d.amount}</small>
            </div>
        </div>
        <button class="btn-login" style="width:auto; height:40px; padding:0 15px;" 
            onclick="completeVoucherPayment('${v.id}', '${d.userId}', ${d.amount})">
            ENTREGAR
        </button>
    </div>`;
}).join('');
}

window.completeVoucherPayment = async (docId, userId, amount) => {
    // 1. Buscamos los detalles actuales del voucher para estar seguros
    try {
        const vSnap = await getDoc(doc(db, "Vouchers", docId));
        if (!vSnap.exists()) return showNotification("ERROR", "El voucher ya no existe", "err");
        
        const vData = vSnap.data();

        // 2. Abrimos el modal personalizado de confirmación
        const confirmed = await showConfirm(
            "CONFIRMAR ENTREGA", 
            `Vas a entregar R$ ${amount} al usuario:\n\n` +
            `Discord ID: ${userId}\n` +
            `Roblox: ${vData.robloxUser}\n\n` +
            `¿Confirmas que la transferencia en Roblox fue realizada?`
        );

        if (!confirmed) return;

        // 3. Proceso de actualización en Firebase
        // Actualizamos el estado del Voucher a COMPLETED
        await updateDoc(doc(db, "Vouchers", docId), { 
            status: "COMPLETED",
            processedBy: currentUser.discordName,
            processedAt: new Date()
        });

        // Sumamos los Robux al contador total del usuario
        await updateDoc(doc(db, "Dashboard", userId), { 
            robuxTotales: increment(amount) 
        });

        // 4. Notificamos éxito y refrescamos la lista
        showNotification("ÉXITO", `R$ ${amount} entregados correctamente.`, "ok");
        loadPaymentsPanel();

    } catch (e) {
        console.error(e);
        showNotification("ERROR", "No se pudo procesar la entrega.", "err");
    }
};

async function loadAdminData() {
    const usersSnap = await getDocs(collection(db, "Dashboard"));
    const adminsList = [];
    let totalUsers = 0;

    usersSnap.forEach(u => {
        totalUsers++;
        if (u.data().isAdmin) adminsList.push(u.data().discordName);
    });

    document.getElementById('admin-total-users').innerText = totalUsers;
    document.getElementById('admin-list').innerText = adminsList.join(", ") || "Solo el Owner";

    const promoSnap = await getDocs(collection(db, "Promocodes"));
    const promoContainer = document.getElementById('active-promos-list');
    
    promoContainer.innerHTML = promoSnap.empty ? '<p class="text-dim">Sin códigos</p>' : 
        promoSnap.docs.map(p => `
            <div class="promo-tag">
                <span>${p.id} (<b>${p.data().value}</b>)</span>
                <button onclick="deletePromo('${p.id}')" class="delete-mini">×</button>
            </div>
        `).join('');
}

window.deletePromo = async (code) => {
    if(!confirm(`¿Eliminar ${code}?`)) return;
    await deleteDoc(doc(db, "Promocodes", code));
    loadAdminData();
};

window.processPayment = async () => {
    const id = document.getElementById('pay-discord-id').value.trim();
    const amt = parseInt(document.getElementById('pay-amount').value);
    if(!id || isNaN(amt)) return;

    try {
        await updateDoc(doc(db, "Dashboard", id), { robuxTotales: increment(amt) });
        await addDoc(collection(db, "Transactions"), {
            userId: id,
            type: "PAYMENT_DONE",
            detail: `Entrega de R$ ${amt}`,
            amount: 0,
            date: new Date()
        });
        showNotification("PAGO", "Robux sumados", "ok");
    } catch (e) { showNotification("ERROR", "Usuario no encontrado", "err"); }
};



window.processManualPayment = async () => {
    const id = document.getElementById('pay-discord-id').value.trim();
    const robuxAmount = parseInt(document.getElementById('pay-pack-select').value);
    
    if(!id) return showNotification("ERROR", "Ingresa un ID de Discord", "err");

    try {
        const dashRef = doc(db, "Dashboard", id);
        const dashSnap = await getDoc(dashRef);

        if (!dashSnap.exists()) {
            return showNotification("ERROR", "El usuario no existe en Dashboard", "err");
        }

        await updateDoc(dashRef, { 
            robuxTotales: increment(robuxAmount) 
        });

        await addDoc(collection(db, "Transactions"), {
            userId: id,
            type: "ADMIN_PAY",
            detail: `Entrega manual de R$ ${robuxAmount}`,
            amount: 0,
            date: new Date()
        });

        showNotification("ÉXITO", `Se entregaron R$ ${robuxAmount}`, "ok");
    } catch (e) {
        showNotification("ERROR", "No se pudo procesar", "err");
    }
};

window.switchTab = (id) => {
    document.querySelectorAll('.side-link, .content-section').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-${id}`).classList.add('active');
    document.getElementById(`tab-${id}`).classList.add('active');
    if (id === 'transactions') loadTransactions();
    if (id === 'admin') loadAdminData();
    if (id === 'payments') {
        loadPaymentsPanel();
    }
    if (id === 'transactions') {
        loadTransactions();
    }
    if (id === 'activity') {
        loadActivityPanel();
    }
};

window.openDailyModal = async () => {
    const modal = document.getElementById('daily-modal');
    const container = document.getElementById('modal-daily-steps');
    const claimBtn = document.getElementById('modal-claim-btn');

    const actRef = doc(db, "Activity", currentUser.discordId);
    const actSnap = await getDoc(actRef);
    const actData = actSnap.exists() ? actSnap.data() : { lastClaim: null, streak: 0 };
    
    const todayStr = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay();

    // Actualizar estado del botón en el modal
    if (actData.lastClaim === todayStr) {
        claimBtn.disabled = true;
        claimBtn.innerText = "YA RECLAMADO";
        claimBtn.classList.remove('pulse');
    } else {
        claimBtn.disabled = false;
        claimBtn.innerText = "RECLAMAR AHORA";
        claimBtn.classList.add('pulse');
    }

    // Renderizar días
    container.innerHTML = DAYS_NAME.map((name, index) => {
        const isToday = index === dayOfWeek;
        const isPast = index < dayOfWeek;
        const isClaimedPast = isPast; // Podrías hacerlo más complejo validando cada día
        return `
            <div class="modal-step ${isToday ? 'active' : ''} ${isPast ? 'completed' : ''}">
                <div class="dot"></div>
                <span>${name}</span>
            </div>
        `;
    }).join('');

    modal.classList.add('show');
};

window.closeDailyModal = () => {
    document.getElementById('daily-modal').classList.remove('show');
};

async function loadTransactions() {
    const container = document.getElementById('trans-list');
    if (!container) return;
    
    container.innerHTML = '<p class="text-dim">Cargando movimientos...</p>';

    try {
        // Asegúrate de que los nombres de los campos coincidan con tu DB (date vs fecha)
        const q = query(
            collection(db, "Transactions"), 
            where("userId", "==", currentUser.discordId), 
            orderBy("date", "desc"), 
            limit(15)
        );

        const snap = await getDocs(q);
        
        if (snap.empty) {
            container.innerHTML = '<p class="text-dim">Aún no tienes movimientos.</p>';
            return;
        }

        container.innerHTML = snap.docs.map(d => {
            const data = d.data();
            const isNegative = data.amount < 0;
            // Formatear fecha opcionalmente
            const dateStr = data.date?.toDate().toLocaleDateString() || "";

            return `
                <div class="trans-item">
                    <div style="display:flex; flex-direction:column">
                        <span style="font-size:0.85rem; font-weight:bold;">${data.type}</span>
                        <small class="text-dim">${data.detail} • ${dateStr}</small>
                    </div>
                    <span class="${isNegative ? 'danger-text' : 'accent'}">
                        ${isNegative ? '' : '+'}${data.amount}
                    </span>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Error completo:", e); 
        container.innerHTML = `<p class="danger-text">Error: Revisa la consola para crear el índice de Firestore.</p>`;
    }
}

const DAYS_NAME = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

async function loadActivityPanel() {
    const container = document.getElementById('daily-steps-container');
    const streakElem = document.getElementById('streak-counter');
    const claimBtn = document.getElementById('claim-daily-btn');
    
    // 1. Obtener datos de actividad del usuario
    const actRef = doc(db, "Activity", currentUser.discordId);
    const actSnap = await getDoc(actRef);
    let actData = actSnap.exists() ? actSnap.data() : { lastClaim: null, streak: 0 };

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay(); // 0 a 6

    // 2. Renderizar los círculos de los días
    container.innerHTML = DAYS_NAME.map((name, index) => {
        let statusClass = "";
        if (index < dayOfWeek) statusClass = "past";
        if (index === dayOfWeek) statusClass = "current";
        
        return `
            <div class="day-step ${statusClass}">
                <div class="step-circle">${index + 1}</div>
                <span>${name}</span>
            </div>
        `;
    }).join('');

    // 3. Verificar si puede reclamar
    if (actData.lastClaim !== todayStr) {
        claimBtn.disabled = false;
        claimBtn.innerText = "RECLAMAR RECOMPENSA DIARIA";
    } else {
        claimBtn.disabled = true;
        claimBtn.innerText = "MAÑANA VUELVE POR MÁS";
    }

    streakElem.innerText = `🔥 ${actData.streak} Días`;
}

window.claimDailyReward = async () => {
    if (isClaiming) return; // Si ya está procesando, no hace nada

    const todayStr = new Date().toISOString().split('T')[0];
    const actRef = doc(db, "Activity", currentUser.discordId);
    const balRef = doc(db, "Balance", currentUser.discordId);

    try {
        isClaiming = true; // Bloqueamos clics
        const actSnap = await getDoc(actRef);
        const actData = actSnap.exists() ? actSnap.data() : { lastClaim: "", streak: 0 };

        // VALIDACIÓN CRÍTICA: ¿Ya reclamó hoy?
        if (actData.lastClaim === todayStr) {
            showNotification("AVISO", "Ya has reclamado tu premio de hoy.", "warn");
            closeDailyModal();
            return;
        }

        // Lógica de Streak: Si ayer no reclamó, se reinicia (opcional, aquí solo suma)
        let newStreak = (actData.streak || 0) + 1;

        await setDoc(actRef, {
            lastClaim: todayStr,
            streak: newStreak
        }, { merge: true });

        // Sumar créditos
        await updateDoc(balRef, { credits: increment(0.50) });

        // CIERRE Y NOTIFICACIÓN CORRECTA
        closeDailyModal(); // Cerramos el modal del calendario
        openDailyModal("LOGRADO", `Has recibido +0.50 créditos. Racha: ${newStreak} días.`, "ok");
        
        renderUserData(); // Actualizar balance en pantalla
        loadActivityPanel(); // Actualizar panel de actividad si está abierto

    } catch (e) {
        console.error(e);
        showNotification("ERROR", "No se pudo reclamar.", "err");
    } finally {
        isClaiming = false; // Liberamos el bloqueo
    }
};

function showNotification(title, text, type) {
    const container = document.getElementById('modal-icon-container');
    const svgs = {
        ok: '<svg width="50" height="50" viewBox="0 0 24 24" fill="#10b981"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
        err: '<svg width="50" height="50" viewBox="0 0 24 24" fill="#ef4444"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
        warn: '<svg width="50" height="50" viewBox="0 0 24 24" fill="#f59e0b"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
    };
    container.innerHTML = svgs[type] || svgs.warn;
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-text').innerText = text;
    document.getElementById('dash-modal').classList.add('show');
}

window.closeModal = () => document.getElementById('dash-modal').classList.remove('show');
window.closeVoucher = () => document.getElementById('voucher-modal').classList.remove('show');

initDashboard();
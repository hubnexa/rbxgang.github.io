const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const path = require('path');

// Esto le dice a Express que sirva todos los archivos de tu carpeta actual
app.use(express.static(path.join(__dirname, '/')));

// Esto asegura que al entrar a la raíz se cargue el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 1. CORRECCIÓN DE CORS: Permitir tu dominio real y local
const allowedOrigins = ['http://127.0.0.1:5500', 'https://rbxgang.xyz', 'https://rbxgang-web.onrender.com'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    }
}));

app.use(express.json());

// 2. SEGURIDAD: Usa variables de entorno en producción (Render -> Settings -> Env Vars)
const CLIENT_ID = process.env.CLIENT_ID || '1472654015702499550';
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'H2SW3Kn6iAYih2CLswFCVNGHAbx1olIz';
// La REDIRECT_URI debe cambiar según el entorno
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://127.0.0.1:5500/auth/set-up/'; 

app.post('/api/auth/discord', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Código no proporcionado" });

    try {
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', 
            new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }).toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
        });

        res.json(userRes.data);
    } catch (e) {
        console.error("❌ Error Discord API:", e.response?.data || e.message);
        res.status(500).json({ error: "Error de autenticación" });
    }
});

// 3. PUERTO DINÁMICO: Render asigna el puerto, no puedes usar 3000 fijo
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));

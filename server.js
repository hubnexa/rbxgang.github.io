const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// IMPORTANTE: Permitir que tu Live Server (5500) hable con Node (3000)
app.use(cors({
    origin: 'http://127.0.0.1:5500'
}));
app.use(express.json());

const CLIENT_ID = '1472654015702499550';
const CLIENT_SECRET = 'H2SW3Kn6iAYih2CLswFCVNGHAbx1olIz';
// Esta URL DEBE ser la misma que pusiste en el Panel de Discord
const REDIRECT_URI = 'http://127.0.0.1:5500/auth/set-up/'; 

app.post('/api/auth/discord', async (req, res) => {
    const { code } = req.body;
    console.log("-> Código recibido del frontend:", code);

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

        console.log("-> Usuario encontrado:", userRes.data.username);
        res.json(userRes.data);

    } catch (e) {
        console.error("❌ Error en el proceso:", e.response?.data || e.message);
        res.status(500).json({ error: "Fallo en la comunicación con Discord" });
    }
});

app.listen(3000, () => console.log("🚀 Servidor API corriendo en http://localhost:3000"));
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const app = express();
app.use(cors());

app.get('/api/tasas', async (req, res) => {
    try {
        const agent = new https.Agent({ rejectUnauthorized: false });
        
        // 1. Añadimos cabeceras de un navegador real y un timeout de 10 segundos
        const response = await axios.get('https://www.bcv.org.ve/', { 
            httpsAgent: agent,
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });
        
        const $ = cheerio.load(response.data);

        const extraerTasa = (idHTML) => {
            let texto = $(`#${idHTML} .centrado strong`).text().trim();
            texto = texto.replace(',', '.');
            return parseFloat(texto) || 0; // Prevenir NaN si el selector falla
        };

        const usd = extraerTasa('dolar');
        const eur = extraerTasa('euro');

        // 2. Validación de seguridad extra
        if (usd === 0) {
            throw new Error("No se pudo extraer la tasa del HTML (posible cambio en la web del BCV).");
        }

        res.json({
            exito: true,
            tasas: { USD: usd, EUR: eur }
        });
    } catch (e) {
        console.error("Error en proxy BCV:", e.message); // Útil para ver el error exacto en los logs de tu servidor
        res.status(500).json({ exito: false, error: e.message || 'Error al conectar' });
    }
});

module.exports = app;

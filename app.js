const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Serve static files with caching for production
const staticOptions = {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    etag: true
};

app.use(express.static(path.join(__dirname, 'public'), staticOptions));
app.use('/images', express.static(path.join(__dirname, 'data', 'images'), staticOptions));

// Read Data
const dataPath = path.join(__dirname, 'data', 'content.json');

app.get('/', async (req, res) => {
    try {
        const rawData = await fs.promises.readFile(dataPath, 'utf8');
        const siteData = JSON.parse(rawData);

        // Fetch Discord member count
        const serverId = '1455558934323658788';
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`https://discord.com/api/guilds/${serverId}/widget.json`, {
                signal: controller.signal
            });
            clearTimeout(timeout);

            if (response.ok) {
                const widgetData = await response.json();
                if (widgetData.presence_count !== undefined) {
                    siteData.about.stats.forEach(stat => {
                        if (stat.label === "Member Sayı" || stat.label === "Aktiv Üzv") {
                            stat.value = `${widgetData.presence_count}+`;
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Discord widget fetch error:', error.message);
        }

        res.render('index', { data: siteData });
    } catch (error) {
        console.error('Server error:', error.message);
        res.status(500).send('Server Error');
    }
});

// 404 handler — catch all unmatched routes
app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html lang="az">
        <head>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>404 — GSG Azerbaijan</title>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap" rel="stylesheet"/>
            <style>
                body {
                    margin: 0; background: #131313; color: #e2e2e2;
                    font-family: 'Space Grotesk', sans-serif;
                    display: flex; justify-content: center; align-items: center;
                    min-height: 100vh; text-align: center;
                }
                h1 { font-size: clamp(4rem, 15vw, 12rem); margin: 0; line-height: 1; }
                p { color: #919191; margin: 1rem 0 2rem; text-transform: uppercase; letter-spacing: 0.3em; font-size: 0.85rem; }
                a {
                    display: inline-block; background: #fff; color: #131313;
                    padding: 14px 40px; text-decoration: none; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.9rem;
                    transition: all 0.3s ease;
                }
                a:hover { box-shadow: 6px 6px 0 rgba(255,255,255,0.2); transform: translateY(-2px); }
            </style>
        </head>
        <body>
            <div>
                <h1>404</h1>
                <p>Səhifə tapılmadı</p>
                <a href="/">Ana Səhifə</a>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`GSG Azerbaijan server running on http://localhost:${PORT}`);
});

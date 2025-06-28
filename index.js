const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/api/tiktok', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url || !url.includes('tiktok')) {
            return res.status(400).json({ error: 'Invalid TikTok URL' });
        }

        // Follow redirection if short link
        const { request: redirected } = await axios.get(url, { maxRedirects: 0 }).catch(e => e.response);
        const finalUrl = redirected?.headers?.location || url;

        // Get HTML from final page
        const response = await axios.get(finalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Mobile; Android 12)',
            },
        });

        const html = response.data;

        // Extract video URL
        const match = html.match(/"playAddr":"(.*?)"/);

        if (match && match[1]) {
            // Decode unicode + escaped slashes
            const decodedUrl = JSON.parse(`"${match[1]}"`);
            return res.json({ downloadUrl: decodedUrl }); // use decodedUrl here
        }

        res.status(500).json({ error: 'Video URL not found. TikTok may have changed structure.' });

    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ error: 'Server error. Try again.' });
    }
});

app.listen(5000, () => {
    console.log('TikTok API running at http://localhost:5000');
});

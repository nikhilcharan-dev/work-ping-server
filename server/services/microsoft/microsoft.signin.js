import axios from "axios";
import { Router } from "express";

const router = Router();

const SCOPE = [
    'openid',
    'profile',
    'email',
    'offline_access',
    'User.Read'
].join(' ');

router.get('/start', (req, res) => {
    const { state = 'default' } = req.query;
    if(state !== "earthisflat") return;
    const authUrl =
        `https://login.microsoftonline.com/common/oauth2/v2.0/authorize` +
        `?client_id=${process.env.MS_CLIENT_ID}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(process.env.MS_REDIRECT_URI)}` +
        `&response_mode=query` +
        `&scope=${encodeURIComponent(SCOPE)}` +
        `&state=${state}`;
    res.redirect(authUrl);
});


router.get('/callback', async (req, res) => {
    const { code, state } = req.query;

    try {
        const tokenRes = await axios.post(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            new URLSearchParams({
                client_id: process.env.MS_CLIENT_ID,
                client_secret: process.env.MS_CLIENT_SECRET,
                code,
                redirect_uri: process.env.MS_REDIRECT_URI,
                grant_type: 'authorization_code',
                scope: SCOPE
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const {
            access_token,
            refresh_token,
            expires_in,
            id_token
        } = tokenRes.data;

        // Get user profile
        const profileRes = await axios.get(
            'https://graph.microsoft.com/v1.0/me',
            {
                headers: { Authorization: `Bearer ${access_token}` }
            }
        );

        const { mail, userPrincipalName, displayName } = profileRes.data;

        const email = mail || userPrincipalName;
        const expiresAt = Date.now() + expires_in * 1000
        console.log({
            email,
            displayName,
            expiresAt: Date.now() + expires_in * 1000
        });

        res.status(200).send(`
          <script>
            window.opener.postMessage({
                email: "${email}",
                message: "oauth_success"
            }, '*');
            window.close();
          </script>
        `);
    } catch (err) {
        console.error(
            '❌ Microsoft OAuth Error:',
            err.response?.data || err.message
        );
        res.status(500).json({ error: 'Microsoft OAuth failed' });
    }
});

export default router;
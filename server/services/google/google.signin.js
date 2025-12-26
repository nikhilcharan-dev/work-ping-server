import { Router } from 'express';
import axios from 'axios';
import 'dotenv/config';


const router = Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const SCOPE = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
].join(' ');


router.get('/start', (req, res) => {
    const { state } = req.query;
    if(state !== "earthisflat") return;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${encodeURIComponent(SCOPE)}&access_type=offline&prompt=consent&state=${state}`;
    res.redirect(url);
});

router.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    console.log("Callback Triggered", code, state);
    try {
        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', null, {
            params: {
                code,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            }
        });

        const accessToken = tokenRes.data.access_token;
        // we only get it one sign up not signin
        const refreshToken = tokenRes.data.refresh_token;

        const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const { email, picture } = userInfoRes.data;
        const expiresIn = Date.now() + (tokenRes.data.expires_in * 1000);

        console.log(userInfoRes.data);

        // Update User Details
        // Push with access_token, refresh_token, expiresIn

        // if (alreadyLinked) {
        //     return res.status(200).send(`
        //       <script>
        //         window.opener.postMessage({
        //             message: "oauth_already_linked"
        //         }, '*');
        //         window.close();
        //       </script>
        //     `);
        // }

        res.status(200).send(`
          <script>
            window.opener.postMessage({
                email: "${email}",
                message: "oauth_success"
            }, '*');
            window.close();
          </script>
        `);
    } catch (error) {
        console.error("❌ Google OAuth error:", error.response?.data || error.message);
        res.status(500).send("OAuth Error: Could not complete authentication.");
    }
});


export default router;

/*
{
  id: '105482525388940160130',
  email: 'nikhilcharangollapalli@gmail.com',
  verified_email: true,
  name: 'Nikhil Charan Gollapalli',
  given_name: 'Nikhil Charan',
  family_name: 'Gollapalli',
  picture: 'https://lh3.googleusercontent.com/a/ACg8ocKzjTGeVA8wuWp9MsNGLrNRvcGJZPF8rCLmHjuASoEnTABHnA=s96-c'
}
*/
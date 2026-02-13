import axios from "axios";
import { Router } from "express";
import jwt from "jsonwebtoken";
import Account from "#models/Account.js";

const router = Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:5000/auth/google/callback" // process.env.GOOGLE_REDIRECT_URI;

const SCOPE = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email"
].join(" ");

router.get('/start', (req, res) => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${encodeURIComponent(SCOPE)}&access_type=offline&prompt=consent`;
    res.redirect(url);
});

router.get("/callback", async (req, res) => {
    const { code } = req.query;

    try {
        // Exchange code for tokens
        const tokenRes = await axios.post(
            "https://oauth2.googleapis.com/token",
            null,
            {
                params: {
                    code,
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    redirect_uri: REDIRECT_URI,
                    grant_type: "authorization_code"
                }
            }
        );

        const accessToken = tokenRes.data.access_token;

        // Get user profile
        const userInfoRes = await axios.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        const {
            id: googleId,
            email,
            verified_email,
            name,
            picture
        } = userInfoRes.data;

        if (!verified_email) {
            return res.status(400).send("Email not verified by Google");
        }

        // Check if account exists
        let account = await Account.findOne({ email });

        if (!account) {
            // SIGN UP
            account = await Account.create({
                email,
                emailVerified: true,
                role: "admin", // or decide dynamically
                providers: {
                    google: {
                        id: googleId,
                        linked: true
                    }
                }
            });
        } else {
            // SIGN IN
            if (!account.providers.google?.linked) {
                account.providers.google = {
                    id: googleId,
                    linked: true
                };
                await account.save();
            }
        }

        // Issue YOUR JWT
        const token = jwt.sign(
            {
                accountId: account._id,
                role: account.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Send back to frontend
        // res.status(200).send(`
        //     <script>
        //         window.opener.postMessage({
        //             token: "${token}",
        //             message: "oauth_success"
        //         }, '*');
        //         window.close();
        //     </script>
        // `);
        console.log(token);
    } catch (error) {
        console.error(
            "Google OAuth error:",
            error.response?.data || error.message
        );
        res.status(500).send("OAuth Error");
    }
});

export default router;
import axios from "axios";
import { Router } from "express";
import jwt from "jsonwebtoken";
import Account from "#models/Account.js";
import crypto from "crypto";
import Admin from "#models/Admin.js";

const router = Router();

const MS_CLIENT_ID = process.env.MS_CLIENT_ID;
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET;
const MS_REDIRECT_URI = process.env.MS_REDIRECT_URI;

const SCOPE = [
    "openid",
    "profile",
    "email",
    "https://graph.microsoft.com/User.Read"
].join(" ");


router.get("/start", (req, res) => {
    const state = crypto.randomBytes(16).toString("hex");

    const authUrl =
        `https://login.microsoftonline.com/common/oauth2/v2.0/authorize` +
        `?client_id=${MS_CLIENT_ID}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(MS_REDIRECT_URI)}` +
        `&response_mode=query` +
        `&scope=${encodeURIComponent(SCOPE)}` +
        `&state=${state}`;

    res.redirect(authUrl);
});


router.get("/callback", async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send("Authorization code missing");
    }

    try {
        // Exchange code
        const tokenRes = await axios.post(
            "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            new URLSearchParams({
                client_id: MS_CLIENT_ID,
                client_secret: MS_CLIENT_SECRET,
                code,
                redirect_uri: MS_REDIRECT_URI,
                grant_type: "authorization_code"
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );


        const accessToken = tokenRes.data.access_token;

        if (!accessToken) {
            return res.status(400).send("Microsoft access token missing");
        }

        // Fetch profile
        const profileRes = await axios.get(
            "https://graph.microsoft.com/v1.0/me",
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        const {
            mail,
            userPrincipalName,
            displayName,
            id
        } = profileRes.data;

        console.log(profileRes.data);

        const email = mail || userPrincipalName;
        const microsoftId = id;

        if (!email || !microsoftId) {
            return res.status(400).send("Invalid Microsoft profile data");
        }

        // Find existing account
        let account = await Account.findOne({ email });

        if (!account) {
            // SIGN UP
            account = await Account.create({
                email,
                emailVerified: true,
                role: "admin", // default role
                providers: {
                    microsoft: {
                        id: microsoftId,
                        linked: true
                    }
                }
            });

             await Admin.create({
                 name: displayName,
                 email,
            })
        } else {
            // SIGN IN + LINK IF NOT LINKED
            if (!account.providers?.microsoft?.linked) {
                account.providers.microsoft = {
                    id: microsoftId,
                    linked: true
                };
                await account.save();
            }
        }

        // Issue YOUR JWT
        const appToken = jwt.sign(
            {
                accountId: account._id,
                role: account.role
            },
            process.env.SECRET_KEY,
            { expiresIn: "7d" }
        );

        res.status(200).send(`
          <script>
            window.opener.postMessage({
                token: "${appToken}",
                message: "oauth_success"
            }, '*');
            window.close();
          </script>
        `);

    } catch (err) {
        console.error(
            "Microsoft OAuth Error:",
            err.response?.data || err.message
        );
        res.status(500).json({ error: "Microsoft OAuth failed" });
    }
});

export default router;
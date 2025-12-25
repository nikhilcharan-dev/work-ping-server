import axios from "axios";
import { Router } from "express";

const router = Router();

router.get("/auth/microsoft/callback", async (req, res) => {
    const { code } = req.query;

    const tokenRes = await axios.post(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        new URLSearchParams({
            client_id: process.env.MS_CLIENT_ID,
            client_secret: process.env.MS_CLIENT_SECRET,
            code,
            redirect_uri: process.env.MS_REDIRECT_URI,
            grant_type: "authorization_code",
        })
    );

    const accessToken = tokenRes.data.access_token;

    const profile = await axios.get(
        "https://graph.microsoft.com/v1.0/me",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    const { mail, userPrincipalName, displayName } = profile.data;

    // mail may be null → use userPrincipalName
    const email = mail || userPrincipalName;

    console.log(profile.data)

    // 👉 create / login user
    // 👉 issue your JWT
});

export default router;
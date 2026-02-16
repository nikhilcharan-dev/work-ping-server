import { setup2FA } from "#services/2fa/index.js";
import Account from "#models/Account.js";

export default function twoFactorRoutes(app) {

    const { router } = setup2FA(app, {
        appName: "Work Ping",

        // Save secret in Account model
        saveSecret: async (userId, secret) => {
            await Account.findByIdAndUpdate(userId, {
                twoFactorSecret: secret
            });
        },

        // Retrieve secret from Account model
        getSecret: async (userId) => {
            const account = await Account.findById(userId);
            return account?.twoFactorSecret || null;
        },

        // Tell service how to get userId
        getUserId: (req) => {
            return req.user?.accountId;
        },

        // For JWT-based apps (no session)
        isVerified: (req) => {
            return req.user?.twoFactorVerified === true;
        }
    });
    console.log("[2FA] Initialised")
    return router;
}

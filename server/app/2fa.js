import { setup2FA } from "#services/2fa/index.js";
import Account from "#models/Account.js";
import Admin from "#models/Admin.js"
export default function twoFactorRoutes(app) {

    const { router } = setup2FA(app, {
        appName: "Work Ping",

        // Save secret in Account model
        saveSecret: async (userId, secret) => {
            const user = await Admin.findById(userId);
            await Account.findOneAndUpdate({email: user.email}, {
                twoFactorSecret: secret,
                twoFactorEnabled: true,
            });
        },

        // Retrieve secret from Account model
        getSecret: async (userId) => {
            const user = await Admin.findById(userId);
            const account = await Account.findOne({email: user.email});
            return account?.twoFactorSecret || null;
        },

        // For JWT-based apps (no session)
        isVerified: (req) => {
            return req.user?.twoFactorVerified === true;
        }
    });
    console.log("[2FA] Initialised")
    return router;
}

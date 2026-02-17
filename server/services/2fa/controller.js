import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export const createController = (config) => {
    // Validate config
    if (!config || typeof config.saveSecret !== 'function' || typeof config.getSecret !== 'function') {
        throw new Error('2FA Service requires "saveSecret" and "getSecret" async functions in config.');
    }

    const { saveSecret, getSecret, appName = 'MyApp' } = config;

    return {
        async setup(req, res) {
            try {
                const userId = req.user ? req.user.id : req.body.userId; // adjust based on auth
                if (!userId) {
                    return res.status(400).json({ error: 'User ID is required' });
                }

                const secret = speakeasy.generateSecret({
                    name: `${appName} (${userId})`
                });

                const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

                await saveSecret(userId, secret.base32);

                res.json({
                    message: '2FA setup initiated',
                    secret: secret.base32, // Optional: for manual entry
                    qrCode: qrCodeUrl
                });
            } catch (error) {
                console.error('2FA Setup Error:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        },

        async verify(req, res) {
            try {
                const { token, userId } = req.body;
                const id = userId || (req.user ? req.user.id : null);

                if (!id || !token) {
                    return res.status(400).json({ error: 'User ID and Token are required' });
                }

                const secret = await getSecret(id);
                console.log(`DEBUG: Verifying user ${id}, secret found: ${!!secret}, token: ${token}`);

                // GENERIC ERROR: Don't reveal if user exists or has 2FA specific error
                // Unless we really want to, but security audit said no.
                // However, if secret is null, verification fails naturally.

                const verified = secret ? speakeasy.totp.verify({
                    secret: secret,
                    encoding: 'base32',
                    token: token,
                    window: 1 // Allow 1 step (30s) leeway either side, creating a 90s window. 
                    // Standard is often 1. 
                }) : false;

                if (verified) {
                    // Optional: Mark 2FA as enabled in DB if it was pending
                    if (config.enable2FA && typeof config.enable2FA === 'function') {
                        await config.enable2FA(id);
                    }

                    res.json({ verified: true, message: '2FA verified successfully' });
                } else {
                    // Generic error message
                    res.status(401).json({ verified: false, error: '2FA verification failed' });
                }
            } catch (error) {
                console.error('2FA Verify Error:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        },

        async validate(req, res) {
            // Similar to verify, but might be used for login
            // For plug-and-play, verify and validate are essentially the same operation: check token against stored secret.
            return this.verify(req, res);
        }
    };
};

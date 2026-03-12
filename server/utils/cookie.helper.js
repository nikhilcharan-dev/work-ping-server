const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours

export function getCookieOptions(req, { httpOnly = true } = {}) {
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    return {
        httpOnly,
        secure: isSecure,
        sameSite: isSecure ? "none" : "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
    };
}

export function setAuthCookie(res, req, token, options = {}) {
    res.cookie("accessToken", token, getCookieOptions(req, options));
}

export function clearAuthCookie(res, req) {
    res.clearCookie("accessToken", getCookieOptions(req));
}

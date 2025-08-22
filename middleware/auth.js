const {getAuth} = require('../config/firebase');

const auth = getAuth();

const authenticate = async (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ error: "No Authorization header" });
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        // Verify ID token (not custom token)
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error("Error verifying token:", error);
        res.status(401).json({ error: "Unauthorized" });
    }
};

module.exports = {
    authenticate
};
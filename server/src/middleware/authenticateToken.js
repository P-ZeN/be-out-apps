import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token == null) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            return res.sendStatus(403);
        }

        // Handle different JWT payload formats and ensure backward compatibility
        // Some tokens use 'userId', others might use 'id'
        const user = {
            id: payload.userId || payload.id,           // For most routes (tickets, organizer, etc.)
            userId: payload.userId || payload.id,       // For admin routes
            email: payload.email,
            role: payload.role
        };

        req.user = user;
        next();
    });
};

export default authenticateToken;

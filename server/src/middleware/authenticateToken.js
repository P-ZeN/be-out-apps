import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    //console.log("Auth header:", authHeader); // Debug log
    //console.log("Token:", token); // Debug log
    //console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET); // Debug log

    if (token == null) {
        // console.log("No token provided"); // Debug log
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            //console.log("JWT verification error:", err); // Debug log
            return res.sendStatus(403);
        }
        //console.log("JWT decoded user:", user); // Debug log
        req.user = user;
        next();
    });
};

export default authenticateToken;

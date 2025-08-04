const jwt = require('jsonwebtoken');
const User = require('./model');

// Middleware to verify JWT and user existence
const verifyJWT = async (req, res, next) => {
    // 1. Get the Authorization header
    let token;
    const authHeader = req.headers['authorization'];
    // 2. Check if the header exists and starts with 'Bearer '
    if (authHeader && authHeader.startsWith('Bearer ')) {
        // 3. Extract the token from the header
        token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
        // 4. Or get the token from the query parameter
        token = req.query.token;
    } else {
        // If not, respond with 401 and ask user to login
        return res.status(401).json({ message: 'Please login' });
    }
    try {
        // 5. Verify the token using JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // 6. Check if the decoded token exists and has an id
        if (!decoded || !decoded.id) {
            // If not, respond with 401 and token expired message
            return res.status(401).json({ message: 'Token expired' });
        }
        // 7. Check if the user with this id exists in the database
        const user = await User.findById(decoded.id);
        if (!user) {
            // If user not found, respond with 401 and token expired message
            return res.status(401).json({ message: 'Token expired' });
        }
        // 8. Attach the decoded user info to the request object for use in next middleware/routes
        req.user = decoded;
        // 9. Call next() to proceed to the next middleware/route handler
        next();
    } catch (err) {
        // 10. If token is invalid or expired, respond with 401
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = verifyJWT;

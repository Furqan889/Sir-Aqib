const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.cookies.adminToken || req.session.token;

  if (!token) {
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.clearCookie('adminToken');
    req.session.destroy();
    return res.redirect('/login');
  }
};

module.exports = { verifyToken };

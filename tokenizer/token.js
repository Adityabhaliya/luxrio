const jwt = require('jsonwebtoken');

const SECRET_KEY = 'sign12sign5944asve444sign';

exports.generateToken = (userId ,role) => {
  return jwt.sign({ id: userId ,role  }, SECRET_KEY, { expiresIn: '24h' });
};


exports.verifyAdminToken = (req, res, next) => {
  const token = req.headers['x-access-key'];  
  if (!token) {
      return res.status(401).json({ success: false, message: 'Access Denied: No Token Provided' });
  }

  try {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.user = decoded;
      if (req.user.role !== 1) {
          return res.status(403).json({ success: false, message: 'Access Denied: Not an Admin' });
      }
      next();
  } catch (error) {
      res.status(400).json({ success: false, message: 'Invalid Token' });
  }
};

exports.verifyUserToken = (req, res, next) => {
  const token = req.headers['x-access-key'];  
  if (!token) {
      return res.status(401).json({ success: false, message: 'Access Denied: No Token Provided' });
  }

  try {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.user = decoded;
      if (req.user.role !== 2) {
          return res.status(403).json({ success: false, message: 'Access Denied: Not an Admin' });
      }
      next();
  } catch (error) {
      res.status(400).json({ success: false, message: 'Invalid Token' });
  }
};

 
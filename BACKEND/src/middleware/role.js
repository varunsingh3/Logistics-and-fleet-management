/**
 * Restricts access to specified roles
 * @param  {...string} roles Allowed roles (e.g. 'admin', 'manager', 'user')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to perform this action. Required role(s): ${roles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
};

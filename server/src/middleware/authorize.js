const AppError = require("../utils/AppError");

// authorize('admin', 'staff') -> only these roles may proceed
module.exports = function authorize(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError("You do not have permission to perform this action", 403, "FORBIDDEN");
    }
    next();
  };
};

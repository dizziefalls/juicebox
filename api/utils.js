//Simple helper func to check for user status
function requireUser(req, res, next) {
  if (!req.user) {
    next({
      name: "MissingUserError",
      message: "You must be logged in to perform this action"
    })
  }

  next();
}

module.exports = {
  requireUser
}
const { validationResult } = require("express-validator");
module.exports = (req, res, next) => {
  // Checks for validations error in the previous validators rules middleware and store them in error obj
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ validationErrorsReport: validationErrors.array() });
  }
  next(); // if not validation error occured
};

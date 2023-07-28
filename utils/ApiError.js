class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith("4") ? "fail" : "error"; // error code with 400 >> fail , with 500 >> error
    this.operational = true;
  }
}

module.exports = ApiError
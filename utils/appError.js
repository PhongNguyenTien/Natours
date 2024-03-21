// AppError: handle all operational errors (and only operational)
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';

    /*có 2 loại error:
            programming error: lỗi bên trong server của mình
            operational error: lỗi do request từ client */
    this.isOperational = true; // dùng để check liệu có phải operational error hay k, vì class này chỉ xử lí operational error.
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;

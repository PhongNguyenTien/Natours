const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => {
      next(err)
    }); // nhắc lại: Nếu truyền tham số cho next thì mặc định sẽ nhảy xuống các error handler middleware.
  };
};

export default catchAsync;
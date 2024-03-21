import express from 'express';
import morgan from 'morgan';
import tourRouter from './routes/tourRouter.js';
import userRouter from './routes/userRouter.js';
import AppError from './utils/appError.js';
import generalHandleError from './controllers/errorController.js';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import reviewRouter from './routes/reviewRouter.js';

const app = express();

// setting security HTTP Headers
app.use(helmet());

// limit requests to an API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from your IP, please try again later.',
});

app.use(limiter); // limit the quantity of request come from same IP to an API

// add body to http req -> tạo thành req object => phải có middleware này thì mới sử dụng đc attribute body của req (req.body)
// nếu không có middleware này, khi access req.body -> undefined
app.use(
  express.json({
    limit:
      '10kb' /* chỉ accept các request có body <= 10kb => tránh DENIAL-OF-SERVICE (DOS) ATTACK*/,
  }),
);

// sanitize data to prevent NoSQL injection
app.use(mongoSanitize());

// prevent HTTP para pollution
app.use(
  hpp({
    whitelist: ['duration', 'difficulty', 'ratingsAverage', 'price'],
  }),
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // middleware giúp log các thông tin của req, res theo dạng dễ nhìn hơn (nhớ phải đặt middleware này đầu tiên)
}

app.use(express.urlencoded({ extended: true }));

// test middleware, may be useful in the future :))
app.use((req, res, next) => {
  req.requestTime = new Date().toString();
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
/* tạo ra một error, sau đó xử lí error nảy bằng cách truyền vào next. Tại hàm next, nếu truyền tham số cho hàm next 
    thì tham số được truyền vào sẽ mặc định đc hiểu là Error, và khi đó, các middleware tiếp theo trong
    stack middleware sẽ bị bỏ qua, chạy thẳng xuống error handler middleware*/
app.use('*', (req, res, next) => {
  // let err = new Error(`Can not find the ${req.originalUrl} route!`);
  // err.statusCode = 404;
  // err.status = 'failed'; // nếu không set status cho err, postman thay vì trả về log api như mong muốn, thì sẽ trả về 1 file html có ND là lỗi đc định nghĩa ở khời tạo err.
  // next(err); // truyền thẳng err cho error handler middleware xử lí

  // sử dụng AppError class tự build:
  next(new AppError(`Can not find the ${req.originalUrl} route!`, 404));
});

// khi không truyển url vào middleware => Express mặc định là error handler middleware
// general error handler middleware
app.use(generalHandleError);

export default app;

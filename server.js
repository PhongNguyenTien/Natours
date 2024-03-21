import mongoose from 'mongoose';
import 'dotenv/config';
import app from './app.js';

// handle uncaught exception globally: should be before all the code.
process.on('uncaughtException', (err) => {
  console.log('uncaught exception! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});
const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
const connectDB = async () => {
  // try {
    await mongoose.connect(db);
    console.log('Connect to database successfully');
  // } catch (error) {
  //   console.log('Error to connect to database');
  // }
};
connectDB();

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// handle the unhandled rejection globally:
process.on('unhandledRejection', (err) => {
  console.log(err.name," ...", err.message);
  console.log('unhandled rejection! Shutting down...');
  // close the server, and exit the app
  server.close(() => {
    console.log("Close the server...")
    process.exit(1);
  });
});

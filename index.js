import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';

import connectDB from './src/database/connectDB.js';
import userRouter from './src/routes/user.routes.js';
import adminRouter from './src/routes/admin.routes.js';

const app = express();

// Core middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ✅ Enhanced cookie parser configuration
app.use(cookieParser());

// ✅ Enhanced CORS config for proper cookie handling
app.use(cors({
    origin: ["http://localhost:5173", "https://cms-newsnow.netlify.app"],
    credentials: true,
}));

// ✅ Add debugging middleware for CORS
// app.use((req, res, next) => {
//     console.log('=== REQUEST DEBUG ===');
//     console.log('Method:', req.method);
//     console.log('URL:', req.url);
//     console.log('Origin:', req.get('Origin'));
//     console.log('Credentials:', req.get('credentials'));
//     console.log('===================');
//     next();
// });

// connect database
connectDB();

// routes
app.get('/', (req, res) => {
    res.send('Hello World');
});

app.use('/api', userRouter)
app.use('/admin', adminRouter)

const port = process.env.PORT || 3333;
app.listen(port, () => console.log(`Listening on port ${port}...`));

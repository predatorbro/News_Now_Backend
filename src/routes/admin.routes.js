
import express from 'express';
const router = express.Router();
import authMiddleware from '../middlewares/auth.middleware.js';
import isAdmin from '../middlewares/isAdmin.middleware.js';
import articleController from '../controllers/articleControllers.js';
import categoryController from '../controllers/categoryControllers.js';
import commentController from '../controllers/commentControllers.js';
import { refreshAccessToken } from '../controllers/refreshAccessToken.js';
import UserController from '../controllers/userControllers.js';
import upload from '../middlewares/multer.middleware.js';
router.post('/index', UserController.adminLogin);
router.get('/logout', UserController.logout);
router.post('/renewtoken', refreshAccessToken);


router.get('/currUser', authMiddleware, UserController.currUser);
router.get('/dashboard', authMiddleware, UserController.dashboard);
router.get('/settings', UserController.settings);
router.post('/settings', authMiddleware, isAdmin, upload.single("image"), UserController.saveSettings);

//User CRUD Routes
router.get('/users', authMiddleware, isAdmin, UserController.alluser);
router.post('/add-user', authMiddleware, isAdmin, UserController.addUser);
router.post('/update-user/:_id', authMiddleware, isAdmin, UserController.updateUser);
router.delete('/delete-user/:_id', authMiddleware, isAdmin, UserController.deleteUser);

// //Category CRUD Routes
router.get('/category', categoryController.allCategory);
router.post('/add-category', authMiddleware, categoryController.addCategoryPage);
router.post('/update-category/:_id', authMiddleware, categoryController.updateCategory);
router.delete('/delete-category/:_id', authMiddleware, categoryController.deleteCategory);

// //Article CRUD Routes

// error handling is only apply in this component only
router.get('/articles', authMiddleware, articleController.allArticle);
router.get('/articles/:_id', authMiddleware, articleController.singleArticle);
router.post('/add-article', authMiddleware, upload.single("image"), articleController.addArticle);
router.post('/update-article/:_id', authMiddleware, upload.single("image"), articleController.updateArticle);
router.delete('/delete-article/:_id', authMiddleware, articleController.deleteArticle);

// //Comment Routes
router.get('/comments', authMiddleware, commentController.allComments);
router.patch('/update-comment/:_id', authMiddleware, commentController.updateStatus);

// // 404 M_iddleware
// router.use((req, res, next) => {
//     res.status(404).render('admin/404', {
//         message: 'Page not found',
//         role: req.role
//     })
// });

// // 500 Error Handler
// router.use((err, req, res, next) => {
//     console.error(err.stack);
//     const status = err.status || 500;
//     let view;
//     switch (status) {
//         case 401:
//             view = 'admin/401';
//             break;
//         case 404:
//             view = 'admin/404';
//             break;
//         case 500:
//             view = 'admin/500';
//             break;
//         default:
//             view = 'admin/500';
//     }
//     res.status(status).render(view, {
//         message: err.message || 'Something went wrong',
//         role: req.role
//     });
// });


// router.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({
//         message: err.message || 'Internal Server Error',
//         status: err.statusCode
//     })
// });
// Global Error Handler (add at the end of all routes)
router.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const errors = err.errors || [];

    if (res.headersSent) return next(err);

    res.status(statusCode).json({
        success: false,
        message,
        errors,
        data: null,
        statusCode: err.statusCode
    });
});

export default router;
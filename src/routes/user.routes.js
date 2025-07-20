import express from 'express';
const router = express.Router();

import siteController from '../controllers/siteControllers.js';
// import loadCommonData from '../middlewares/'
// router.use(loadCommonData);

router.get('/articles', siteController.index);
router.get('/category', siteController.category);
router.get('/latest', siteController.latest);
router.get('/category/:category', siteController.articleByCategories);
router.get('/author/:author', siteController.author);
router.get('/single/:slug', siteController.singleArticle);
router.post('/search', siteController.search);
router.post('/add-comment', siteController.addComment);
router.get('/comments/:articleId', siteController.getComments);

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
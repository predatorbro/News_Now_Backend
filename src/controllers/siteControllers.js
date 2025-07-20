import { Article } from '../models/article.model.js'
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Category } from '../models/category.model.js'
import { User } from '../models/user.model.js';
import { Comment } from '../models/comment.model.js';
// import { Comment } from '../models/comment.model.js'
// import { User } from '../models/user.model.js'

// const index = async (req, res) => {
//     try {
//         const articles = await Article.find({}).populate('author', "fullName").populate('category', "name");
//         res.status(200).json(new ApiResponse(200, 'Articles fetched successfully', articles));
//     } catch (error) {
//         console.log(error);
//         throw new ApiError(500, 'Error fetching articles', error);
//     }
// }

const index = async (req, res) => {
    try {
        const articles = await Article.aggregate([
            {
                $sort: { createdAt: -1 } // Optional: sort by latest
            },
            {
                $group: {
                    _id: "$category",
                    articles: { $push: "$$ROOT" }
                }
            },
            {
                $project: {
                    articles: { $slice: ["$articles", 3] } // Limit to 3 articles per category
                }
            },
            { $unwind: "$articles" }, // Flatten array
            { $replaceRoot: { newRoot: "$articles" } }, // Bring article doc to top level
        ]);

        // Populate author and category manually (because .aggregate doesn't support .populate)
        const populated = await Article.populate(articles, [
            { path: "author", select: ["username", "fullName"] },
            { path: "category", select: "name" },
        ]);

        res.status(200).json(new ApiResponse(200, "Articles fetched successfully", populated));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, "Error fetching limited articles", error);
    }
};

const latest = async (req, res) => {
    try {
        const articles = await Article.find({}).sort('-createdAt').limit(5).populate('author', ["username", "fullName"]).populate('category', "name");
        res.status(200).json(new ApiResponse(200, 'Latest 5 articles fetched successfully', articles));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, 'Error fetching articles', error);
    }
}
const category = async (req, res) => {
    try {
        const categoryInUse = await Article.distinct('category')
        const category = await Category.find({ _id: { $in: categoryInUse } })
        res.status(200).json(new ApiResponse(200, 'Categories fetched successfully', category));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, 'Error fetching categories', error);
    }
}
const articleByCategories = async (req, res) => {
    try {
        const { category } = req.params;

        const categoryDoc = await Category.findOne({
            name: { $regex: `^${category}$`, $options: 'i' },
        });

        if (!categoryDoc) {
            throw new ApiError(404, 'Category not found');
        }

        const articles = await Article.find({ category: categoryDoc._id })
            .populate('author', ["username", "fullName"])
            .populate('category', 'name');

        res
            .status(200)
            .json(new ApiResponse(200, 'Articles fetched successfully', articles));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, 'Error fetching articles by category', error);
    }
};

const singleArticle = async (req, res) => {
    try {
        const { slug } = req.params;

        const article = await Article.findOne({ slug })
            .populate('author', ["username", "fullName"])
            .populate('category', 'name');

        if (!article) {
            throw new ApiError(404, 'Article not found');
        }

        res
            .status(200)
            .json(new ApiResponse(200, 'Article fetched successfully', article));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, 'Error fetching article', error);
    }
}
const search = async (req, res, next) => {
    try {
        const { keywords } = req.body;
        if (!Array.isArray(keywords) || keywords.length === 0) {
            throw new ApiError(400, 'Please provide an array of keywords.');
        }

        const regexArray = keywords.map(word => ({
            $or: [
                { title: { $regex: word, $options: 'i' } },
                { content: { $regex: word, $options: 'i' } }
            ]
        }));

        const articles = await Article.find({ $or: regexArray })
            .populate('author', 'fullName')
            .populate('category', 'name');

        return res.status(200).json(
            new ApiResponse(200, 'Articles fetched successfully', articles)
        );
    } catch (error) {
        next(error); // assuming your global error handler uses ApiError
    }
};

const author = async (req, res) => {
    try {
        const { author } = req.params;

        const userDoc = await User.findOne({
            username: { $regex: `^${author}$`, $options: 'i' }, // case-insensitive match
        });
        console.log(author, userDoc)
        if (!userDoc) {
            throw new ApiError(404, 'Author not found');
        }

        const articles = await Article.find({ author: userDoc._id })
            .populate('author', 'fullName')
            .populate('category', 'name');

        res.status(200).json(new ApiResponse(200, 'Articles fetched successfully', articles));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, 'Error fetching articles by author', error);
    }
};

const addComment = async (req, res) => {
    try {
        const { articleId, name, email, content } = req.body;
        if (!articleId || !name || !email || !content) {
            throw new ApiError(400, 'Please provide articleId and comment.');
        }

        const article = await Article.findById(articleId);
        if (!article) {
            throw new ApiError(404, 'Article not found');
        }

        const newComment = await Comment.create({
            article: articleId,
            name,
            email,
            content,
            status: 'pending',
        });

        res.status(201).json(new ApiResponse(201, 'Comment added successfully', newComment));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, 'Error adding comment', error);
    }
}
const getComments = async (req, res) => {
    try {
        const comments = await Comment.find({
            $and: [
                {
                    status: 'approved'
                }, {
                    article: req.params.articleId
                }]
        });
        res.status(200).json(new ApiResponse(200, 'Comments fetched successfully', comments));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, 'Error fetching comments', error);
    }
}
export default {
    index,
    category,
    latest,
    articleByCategories,
    singleArticle,
    search,
    author,
    addComment,
    getComments
}
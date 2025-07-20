import mongoose from "mongoose";
import { Article } from "../models/article.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from 'fs';
import path from 'path';
const allArticle = async (req, res) => {
    // error handling is only apply in this component only

    try {
        let articles
        if (req.user.role === 'admin') {
            articles = await Article.find({}).populate('author', "username").populate('category', "slug")
        } else {
            articles = await Article.find({ author: req.user._id }).populate('author', "username").populate('category', "slug")
        }
        res.status(200).json(new ApiResponse(200, 'Articles fetched successfully', articles));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, 'Error fetching articles', error);
    }

}
const singleArticle = async (req, res) => {
    const { _id } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(_id)) {
            throw new ApiError(400, 'Invalid article ID format');
        }

        let article;

        if (req.user.role === 'admin') {
            article = await Article.findById(_id)
                .populate('author', 'username')
                .populate('category', 'name');
        } else {
            article = await Article.findOne({ _id, author: req.user._id })
                .populate('author', 'username')
                .populate('category', 'slug');
        }

        if (!article) {
            throw new ApiError(404, 'Article not found or access denied');
        }

        res.status(200).json(
            new ApiResponse(200, 'Article fetched successfully', article)
        );
    } catch (error) {
        console.error('Error fetching article:', error);
        throw new ApiError(
            error.statusCode || 500,
            error.message || 'Error fetching article',
            error.errors || []
        );
    }
};

const addArticle = async (req, res) => {
    try {
        const article = await Article.create(req.body);
        article.image = req.file ? req.file.path : '';
        article.author = req.user._id;
        await article.save();

        res.status(201).json(
            new ApiResponse(201, 'Article created successfully', article)
        )
    } catch (error) {
        console.log(error);
        throw new ApiError(500, 'Error creating article');
    }
}
const updateArticle = async (req, res) => {
    try {
        const { _id } = req.params;
        const article = await Article.findById(_id);
        if (!article) {
            throw new ApiError(404, 'Article not found');
        }
        console.log("Detils ;", req.user._id.toString() == article.author.toString());
        if (req.user.role !== 'admin') {
            if (req.user._id.toString() !== article.author.toString()) {
                throw new ApiError(403, 'You are not authorized to update this article');
            }
        }
        if (req.file) {
            if (article.image) {
                const relativeImagePath = article.image.replace(/\\/g, '/');
                const fullImagePath = path.join(process.cwd(), relativeImagePath);
                if (fs.existsSync(fullImagePath)) {
                    fs.unlinkSync(fullImagePath);
                }
                // Remove old image if exists
            }
            article.image = req.file ? req.file.path : article.image;
        }
        article.title = req.body.title || article.title;
        article.content = req.body.content || article.content;
        article.category = req.body.category || article.category;
        article.slug = req.body.slug || article.slug;

        await article.save();

        console.log('Article updated successfully:', article);
        if (!article) {
            throw new ApiError(404, 'Article not found');
        }

        return res.status(200).json(new ApiResponse(200, 'Article updated successfully', article));
    } catch (error) {
        throw new ApiError(error.statusCode || 400, error.message || 'Failed to update article', error);
    }
}
const deleteArticle = async (req, res) => {
    const { _id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(_id)) {
            throw new ApiError(400, 'Invalid article ID format');
        }
        const article = await Article.findByIdAndDelete(_id);
        if (!article) {
            throw new ApiError(404, 'Article not found');
        } if (req.user.role !== 'admin') {
            if (req.user._id.toString() !== article.author.toString()) {
                throw new ApiError(403, 'You are not authorized to delete this article');
            }
        }
        if (article.image) {
            const relativeImagePath = article.image.replace(/\\/g, '/');
            const fullImagePath = path.join(process.cwd(), relativeImagePath);
            if (fs.existsSync(fullImagePath)) {
                fs.unlinkSync(fullImagePath);
            }
        }
        return res.status(200).json(new ApiResponse(200, 'Article deleted successfully', article));
    } catch (error) {
        throw new ApiError(error.statusCode || 400, error.message || 'Failed to delete article', error);
    }
}
export default {
    allArticle,
    addArticle,
    updateArticle,
    deleteArticle,
    singleArticle
}
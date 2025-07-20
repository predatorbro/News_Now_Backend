import express from 'express';
import { Category } from '../models/category.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Article } from '../models/article.model.js';
const allCategory = async (req, res) => {
    try {
        const categories = await Category.find().populate('author', 'fullName');

        if (!categories || categories.length === 0) {
            return res.status(404).json(new ApiResponse(404, 'Categories not found'));
        }

        // Add article count for each category
        const categoriesWithCount = await Promise.all(
            categories.map(async (cat) => {
                const articleCount = await Article.countDocuments({ category: cat._id });
                return {
                    ...cat.toObject(),
                    articleCount,
                };
            })
        );

        res.json(new ApiResponse(200, 'All categories with article counts', categoriesWithCount));
    } catch (error) {
        console.error(error);
        throw new ApiError(500, 'Failed to fetch categories', error);
    }
};

const addCategoryPage = async (req, res) => {
    const { name, description } = req.body;
    console.log(name, description)
    const doc = new Category({ name, description });
    doc.author = req.user._id
    try {
        const newCategory = await doc.save();
        res.status(201).json(new ApiResponse(201, 'Category created successfully', newCategory));
    } catch (error) {
        throw new ApiError(500, 'Failed to add category', error);
    }
};

const updateCategory = async (req, res) => {

    try {
        const { _id } = req.params;
        const temp = await Category.findById(_id);
        if (!temp) {
            return res.status(404).json(new ApiResponse(404, 'Category not found'));
        }
        if (req.user.role == 'author') {
            if (temp.author.toString() !== req.user._id.toString()) {
                return res.status(403).json(new ApiResponse(403, 'Forbidden', null));
            }
        }
        const { name, description } = req.body;
        const updatedCategory = await Category.findByIdAndUpdate(_id, { name, description }, { new: true, runValidators: true });
        if (!updatedCategory) {
            return res.status(404).json(new ApiResponse(404, 'Category not found'));
        }
        res.json(new ApiResponse(200, 'Category updated successfully', updatedCategory));
    } catch (error) {
        next(new ApiError(500, 'Failed to update category', error));
    }
}
const deleteCategory = async (req, res, next) => {
    try {
        const { _id } = req.params;

        // 🧠 Step 1: Check if any article is using this category
        const articlesUsingCategory = await Article.find({ category: _id });

        if (articlesUsingCategory.length > 0) {
            return res.status(400).json(
                new ApiResponse(400, 'Cannot delete: Category is in use by one or more articles', {
                    count: articlesUsingCategory.length
                })
            );
        }

        // 🧹 Step 2: Proceed with deletion
        const deletedCategory = await Category.findByIdAndDelete(_id);
        if (!deletedCategory) {
            return res.status(404).json(new ApiResponse(404, 'Category not found'));
        }

        return res.json(new ApiResponse(200, 'Category deleted successfully', deletedCategory));
    } catch (error) {
        return next(new ApiError(500, 'Failed to delete category', error));
    }
};


export default {
    allCategory,
    addCategoryPage,
    updateCategory,
    deleteCategory
};
import express from 'express';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { Category } from '../models/category.model.js';
import { Article } from '../models/article.model.js';
import { Setting } from '../models/settings.model.js';
import path from "path";
import fs from "fs";
import { Comment } from '../models/comment.model.js';

const generateTokens = async (_id) => {
    const user = await User.findById(_id);
    if (!user) {
        throw new ApiError(404, 'Invalid Refresh Token');
    }
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    return { accessToken, refreshToken };
}
const adminLogin = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            throw new ApiError(401, 'Invalid username or password');
        }

        const isMatch = await user.isPasswordCorrect(password);
        if (!isMatch) {
            throw new ApiError(401, 'Invalid username or password');
        }

        const { accessToken, refreshToken } = await generateTokens(user._id);
        console.log('Tokens generated successfully');

        // Save refresh token in DB
        user.refreshToken = refreshToken;
        await user.save();

        // ✅ Set cookies with proper configuration for browser compatibility
        const cookieOptions = {
            httpOnly: true, // Changed to false for debugging
            secure: false
        };


        console.log('Cookies set successfully');

        return res
            .cookie('accessToken', accessToken, cookieOptions)
            .cookie('refreshToken', refreshToken, cookieOptions)
            .status(200).json(
                new ApiResponse(200, 'Admin login successful', {
                    cookieSet: true
                })
            );

    } catch (error) {
        console.error('Admin login error:', error);
        throw new ApiError(error.statusCode || 500, error.message || 'Admin login failed', error);
    }
};

const logout = async (req, res) => {
    try {
        const cookieOptions = {
            httpOnly: true, // Changed to false for debugging
            secure: false
        };
        res.clearCookie('accessToken', cookieOptions);
        res.clearCookie('refreshToken', cookieOptions);

        console.log('Cookies cleared successfully');

        return res.status(200).json(new ApiResponse(200, 'Logout successful'));
    } catch (error) {
        console.error('Logout error:', error);
        throw new ApiError(error.statusCode || 500, error.message || 'Logout failed', error);
    }
};

const alluser = async (req, res) => {
    try {
        const allUsers = await User.find({});
        if (!allUsers || allUsers.length === 0) {
            throw new ApiError(404, 'No users found');
        }
        return res.status(200).json(new ApiResponse(200, 'Users fetched successfully', allUsers));
    } catch (errors) {
        throw new ApiError(errors.statusCode || 500, errors.message || 'Error fetching users', errors);
    }
};

const addUser = async (req, res) => {
    try {
        const { fullName, username, password, role } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            throw new ApiError(409, 'Username already exists');
        }

        const user = await User.create({ fullName, username, password, role });
        if (!user) {
            throw new ApiError(400, 'User not created');
        }

        return res.status(201).json(new ApiResponse(201, 'User created successfully', user));
    } catch (error) {
        throw new ApiError(error.statusCode || 400, error.message || 'Failed to create user', error);
    }
};

const updateUser = async (req, res) => {
    try {
        const { _id } = req.params;
        const { fullName, username, password, role } = req.body;

        const user = await User.findById(_id);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        user.fullName = fullName || user.fullName;
        user.username = username || user.username;
        user.password = password || user.password;
        user.role = role || user.role;

        const updatedUser = await user.save();

        return res.status(200).json(new ApiResponse(200, 'User updated successfully', updatedUser));
    } catch (error) {
        throw new ApiError(error.statusCode || 400, error.message || 'Failed to update user', error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { _id } = req.params;

        // ✅ Step 1: Check if user has written articles
        const articleCount = await Article.countDocuments({ author: _id });

        // ✅ Optional: Check if user has written comments (if applicable)
        const commentCount = await Comment?.countDocuments?.({ user: _id }) || 0;

        if (articleCount > 0 || commentCount > 0) {
            return res.status(400).json(
                new ApiResponse(400, 'Cannot delete user. User has existing data linked (articles/comments).', {
                    articles: articleCount,
                    comments: commentCount
                })
            );
        }

        // ✅ Step 2: Safe to delete user
        const user = await User.findByIdAndDelete(_id);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        return res.status(200).json(
            new ApiResponse(200, 'User deleted successfully', user)
        );
    } catch (error) {
        next(new ApiError(error.statusCode || 400, error.message || 'Failed to delete user', error));
    }
};

const dashboard = async (req, res) => {
    try {
        let articleCount = 0;
        if (req.user.role == 'author') {
            articleCount = await Article.countDocuments({ author: req.user._id });
        } else {
            articleCount = await Article.countDocuments({});
        }
        const userCount = await User.countDocuments({});
        const categoryCount = await Category.countDocuments({});
        return res.status(200).json(new ApiResponse(200, 'Dashboard data fetched successfully', {
            user: req.user,
            userCount: userCount,
            categoryCount: categoryCount,
            articleCount: articleCount
        }));
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw new ApiError(error.statusCode || 500, error.message || 'Failed to fetch dashboard data', error);
    }
}
const saveSettings = async (req, res) => {
    try {
        const { websiteName, themeColor, footerDescription } = req.body;

        let setting = await Setting.findOne();
        if (!setting) {
            setting = new Setting();
        }

        // 🧠 Delete old logo if a new one is uploaded
        if (setting.image) {
            const oldImagePath = path.join(process.cwd(), setting.image);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
                console.log("🧹 Old logo deleted:", oldImagePath);
            }
        }
        setting.image = req?.file?.path || "";
        setting.websiteName = websiteName || "News Now";
        setting.themeColor = (themeColor === "#000000") ? "" : themeColor;
        setting.footerDescription = footerDescription || `© Copyright 2025 ${setting.websiteName}`;

        await setting.save();

        return res.status(200).json(
            new ApiResponse(200, 'Setting saved successfully', setting)
        );
    } catch (error) {
        console.error('❌ Error saving setting:', error);
        throw new ApiError(
            error.statusCode || 500,
            error.message || 'Failed to save setting',
            error
        );
    }
};
const settings = async (req, res) => {
    try {
        const setting = await Setting.findOne().select('-__v -user -_id');
        if (!setting) {
            throw new ApiError(404, 'Setting not found');
        }
        return res.status(200).json(new ApiResponse(200, 'Setting fetched successfully', setting));
    } catch (error) {
        console.error('Error fetching setting:', error);
        throw new ApiError(error.statusCode || 500, error.message || 'Failed to fetch setting', error);
    }
}
const currUser = async (req, res) => {
    try {
        return res.status(200).json(new ApiResponse(200, 'Current user fetched successfully', req.user));
    } catch (error) {
        console.error('Error fetching current user:', error);
        throw new ApiError(error.statusCode || 500, error.message || 'Failed to fetch current user', error);
    }
}
export default {
    dashboard,
    adminLogin,
    logout,
    alluser,
    addUser,
    updateUser,
    deleteUser,
    settings,
    saveSettings,
    currUser
};

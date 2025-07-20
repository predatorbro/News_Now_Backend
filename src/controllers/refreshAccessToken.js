// controller/auth.controller.js
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) { 
      throw new ApiError(401, "Refresh token not found");
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, "Refresh token expired");
      }
      throw new ApiError(403, "Invalid refresh token");
    }

    const user = await User.findById(decoded._id);
    if (!user || user.refreshToken !== refreshToken) {
      throw new ApiError(403, "Refresh token mismatch or user not found");
    }

    const accessToken = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESSTOKEN_EXPIRY }
    );

    res
      .status(200)
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 1000 * 60 * 15, // 15 minutes (example)
      })
      .json(new ApiResponse(200, "Access token refreshed successfully"));

  } catch (error) {
    // next(error); // use your global error handler
    console.error('Error refreshing access token:', error);
    throw new ApiError(error.statusCode || 500, error.message || 'Failed to refresh access token', error);
  }
};

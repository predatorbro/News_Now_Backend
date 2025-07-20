import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';

const authMiddleware = async (req, res, next) => {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      throw new ApiError(401, 'Access token is missing');
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Access token expired');
      }
      throw new ApiError(401, 'Invalid access token');
    }

    const user = await User.findById(decodedToken._id).select('-password -__v -refreshToken');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    req.user = user;
    next();

  } catch (error) {
    next(error); // pass to global error handler
  }
};

export default authMiddleware;

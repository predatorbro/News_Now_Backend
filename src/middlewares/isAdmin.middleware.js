import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const isAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            // Not authenticated
            return res
                .status(401)
                .json(new ApiResponse(401, "Unauthorized: No user found in request"));
        }

        if (req.user.role !== "admin") {
            // Authenticated but not admin
            return res
                .status(403)
                .json(new ApiResponse(403, "Forbidden: Admin access required"));
        }

        next(); // User is admin
    } catch (error) {
        // Unexpected error
        next(new ApiError(500, "Internal server error in admin check", error));
    }
};



export default isAdmin;
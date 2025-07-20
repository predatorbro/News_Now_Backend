import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const allComments = async function (req, res) {
    try {
        let comments;

        if (req.user?.role === 'admin') {
            // Admin can see all comments
            comments = await Comment.find({})
                .populate('article', 'title author')
                .populate({ path: 'article', populate: { path: 'author', select: 'fullName email _id' } });
        } else {
            // Non-admin sees only comments on their own articles
            comments = await Comment.find({})
                .populate({
                    path: 'article',
                    populate: {
                        path: 'author',
                        select: '_id'
                    }
                });

            // Filter out comments on articles not authored by the current user
            comments = comments.filter(comment =>
                comment.article?.author?._id.toString() === req.user._id.toString()
            );
        }

        res.status(200).json(new ApiResponse(200, 'Comments fetched successfully', comments));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, 'Error fetching comments', error);
    }
};


const updateStatus = async function (req, res) {
    try {
        const comment = await Comment.findById(req.params._id).populate({
            path: 'article',
            populate: {
                path: 'author',
                select: '_id role'
            }
        });

        if (!comment) {
            throw new ApiError(404, 'Comment not found');
        }

        // Role-based access control
        if (req.user?.role !== 'admin') {
            if (comment.article?.author?._id.toString() !== req.user._id.toString()) {
                throw new ApiError(403, 'Unauthorized to update this comment');
            }
        }

        // If status is rejected, delete the comment
        if (req.body.status === 'rejected') {
            await Comment.findByIdAndDelete(req.params._id);
            return res.status(200).json(new ApiResponse(200, 'Comment rejected and deleted successfully'));
        }

        // Else, update the status
        comment.status = req.body.status;
        await comment.save();

        res.status(200).json(new ApiResponse(200, 'Comment status updated successfully', comment));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, 'Error updating comment status', error);
    }
};


export default {
    allComments,
    updateStatus
}
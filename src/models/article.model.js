import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import slugify from 'slugify';
const newsSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    slug: {
        type: String,
    },
    content: {
        type: String,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    image: {
        type: String,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
mongoose.plugin(mongoosePaginate);
export const Article = mongoose.model('Article', newsSchema);



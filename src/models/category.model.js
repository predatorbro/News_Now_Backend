import mongoose from 'mongoose';
import slugify from 'slugify';

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            //   unique: true, // 🔒 prevent duplicate slugs
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true, // ✅ this will add createdAt and updatedAt fields automatically
    }
);

// ✅ Pre-save middleware to generate slug
categorySchema.pre('validate', function (next) {
    if (this.name) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});


export const Category = mongoose.model('Category', categorySchema);

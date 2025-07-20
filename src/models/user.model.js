import mongoose from 'mongoose'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'author'],
        default: 'author',
        required: true
    },
    refreshToken: {
        type: String,
        default: null
    }
});
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
})
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}
userSchema.methods.generateAccessToken = async function () {
    const token = await jwt.sign(
        {
            _id: this._id,
            username: this.username
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.ACCESSTOKEN_EXPIRY
        });
    return token;
}
userSchema.methods.generateRefreshToken = async function () {
    const token = await jwt.sign(
        {
            _id: this._id
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.REFRESHTOKEN_EXPIRY
        });
    return token;
}
export const User = mongoose.model('User', userSchema);

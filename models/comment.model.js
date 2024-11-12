import mongoose, { Types } from "mongoose";
import { User } from "../models/user.model.js";

const commentSchema = new mongoose.Schema({
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
})

export const Comment = mongoose.model('Comment', commentSchema);
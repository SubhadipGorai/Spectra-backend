import mongoose from "mongoose";
import { User } from "../models/user.model.js";

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recieverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    messages: { type: String, required: true }
});

export const Message = mongoose.model('Message', messageSchema);
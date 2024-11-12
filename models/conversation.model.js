import mongoose from "mongoose";
import { User } from "../models/user.model.js";

const conversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }]
});

export const Conversation = mongoose.model('Conversation', conversationSchema);
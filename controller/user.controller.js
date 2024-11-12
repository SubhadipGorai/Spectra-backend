import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

export const register = async (req, res) => {
    try {
        const { username, email, password, fullname } = req.body;
        if (!username || !email || !password) {
            return res.status(401).json({
                message: "Something is missing, Please Check!",
                success: false
            });
        }
        const user = await User.findOne({ email });
        if (user) {
            return res.status(401).json({
                message: "You already have an account",
                success: false,
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            username,
            email,
            password: hashedPassword,
            fullname
        });
        return res.status(200).json({
            message: "Account Created Successfully",
            success: true,
        });
    } catch (error) {
        console.log(error);
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email) {
            return res.status(401).json({
                message: "Please Enter Your Email",
                success: false
            });
        }
       

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: "Email not found",
                success: false,
            });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Wrong Password",
                success: false,
            });
        }
        
        const token = await jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1d' });
        const populatedPost=await Promise.all(
            user.posts.map(async (postId)=>{
                const post=await Post.findById(postId);
                if(post.author.equals(user._id)){
                    return post;
                }
                return null;
            })
        )
        user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            fullname: user.fullname,
            profilePicture: user.profilePicture,
            followers: user.followers,
            following: user.following,
            posts: populatedPost,
            bookmarks: user.bookmarks
        } 

        return res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 1 * 24 * 60 * 60 * 1000 }).json({
            message: `Welcome ${user.fullname}`,
            success: true,
            user
        });

    } catch (error) {
        console.log(error);
    }
}

export const logout = async (_, res) => {
    try {
        return res.cookie('token', '', { maxAge: 0 }).json({
            message: "Logged Out Succesfully",
            success: true
        });
    } catch (error) {
        console.log(error);
    }
}

export const getProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        let user = await User.findById(userId).select("-password");
        return res.status(200).json({
            user,
            success: true
        });
    } catch (error) {
        console.log(error);
    }
}

export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { bio, gender } = req.body;
        const profilePicture = req.file;
        let cloudResponse;
        if (profilePicture) {
            const fileUri = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri);
        }
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(401).json({
                message: "User Not Found",
                success: false
            });
        }

        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (profilePicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();
        return res.status(200).json({
            message: "Profile Updated",
            success: true,
            user
        });
    } catch (error) {
        console.log(error);
    }
}

export const getSuggestedUsers = async (req, res) => {
    try {
        const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select("-password");
        if (!suggestedUsers) {
            return res.status(401).json({
                message: "User Not Found",
                success: false
            });
        }
        return res.status(401).json({
            success: true,
            users: suggestedUsers
        });
    } catch (error) {
        console.log(error);
    }
}

export const followOrUnfollow = async (req, res) => {
    try {
        const whoFollow = req.id;
        const whomToFollow = req.params.id;
        if (whoFollow === whomToFollow) {
            return res.status(401).json({
                message: "Can't Follow Yourself",
                success: false
            });
        }

        const user = await User.findById(whoFollow);
        const targetUser = await User.findById(whomToFollow);
        if (!user || !targetUser) {
            return res.status(401).json({
                message: "User not found",
                success: false
            });
        }

        const isFollowing = user.following.includes(whomToFollow);
        if (isFollowing) {
            await Promise.all([
                User.updateOne({ _id: whoFollow }, { $pull: { following: whomToFollow } }),
                User.updateOne({ _id: whomToFollow }, { $pull: { followers: whoFollow } }),
            ])
            return res.status(200).json({
                message: "Unfollowed Successfully",
                success: true
            });
        } else {
            await Promise.all([
                User.updateOne({ _id: whoFollow }, { $push: { following: whomToFollow } }),
                User.updateOne({ _id: whomToFollow }, { $push: { followers: whoFollow } }),
            ])
            return res.status(200).json({
                message: "Followed Successfully",
                success: true
            });
        }
    } catch (error) {
        console.log(error);
    }
}
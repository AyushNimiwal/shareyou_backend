import mongoose from 'mongoose';
import {Like} from '../models/like.model.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId}=req.params;
    const like = await Like.findOne({video:videoId, likedBy: req.user._id});
    if(like){
        await like.remove();
        return res.status(200).json(new ApiResponse(200, 'Unlike video successfully'));
    }
    else {
        await Like.create({video:videoId, likedBy: req.user._id});
        return res.status(200).json(new ApiResponse(200, 'Like video successfully'));
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId}=req.params;
    const like = await Like.findOne({comment:commentId, likedBy: req.user._id});
    if(like){
        await like.remove();
        return res.status(200).json(new ApiResponse(200, 'Unlike comment successfully'));
    }
    else {
        await Like.create({comment:commentId, likedBy: req.user._id});
        return res.status(200).json(new ApiResponse(200, 'Like comment successfully'));
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId}=req.params;
    const like = await Like.findOne({tweet:tweetId, likedBy: req.user._id});
    if(like){
        await like.remove();
        return res.status(200).json(new ApiResponse(200, 'Unlike tweet successfully'));
    }
    else {
        await Like.create({tweet:tweetId, likedBy: req.user._id});
        return res.status(200).json(new ApiResponse(200, 'Like tweet successfully'));
    }
})

const getLikedVideos =  asyncHandler(async (req, res) => {
    const likedVideos =await Like.find({likedBy:req.user._id}).populate('video');
    return res.status(200).json(new ApiResponse(200, likedVideos, likedVideos.length, 'Liked videos fetched successfully'));
})

export {toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos};



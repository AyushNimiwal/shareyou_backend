import mongoose from 'mongoose';
import {Tweet} from '../models/tweet.model.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    const tweet =await Tweet.create({content, owner:req.user._id});
    await tweet.save();
    res.status(201).json(new ApiResponse(201, tweet, 'Tweet created successfully'));
})

const getUserTweets = asyncHandler(async (req, res) => {
    const tweets = await Tweet.find({owner:req.user._id});
    res.status(200).json(new ApiResponse(200, tweets, 'User tweets retrieved successfully'));
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    const {content} = req.body;
    const tweet= await Tweet.findByIdAndUpdate(
        tweetId,
        {content},
        {new:true}
    )
    return res.status(200).json(new ApiResponse(200, tweet, 'Tweet updated successfully'));
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    await Tweet.findByIdAndDelete(tweetId);
    return res.status(200).json(new ApiResponse(200, null, 'Tweet deleted successfully'));
})

export {createTweet, getUserTweets, updateTweet, deleteTweet};




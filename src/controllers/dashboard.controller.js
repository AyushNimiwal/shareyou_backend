import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import {Subscription} from '../models/subscription.model.js';
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId= req.user._id;
    const videos = await Video.find({owner: channelId}).countDocuments();
    const subscribers = await Subscription.find({channel: channelId}).countDocuments();
    const Likes = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                }
            }
        }
    ])
    const views=await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {//group by video_id
                _id: null,//group by video_id
                views: {//sum of views
                    $sum: "$views"//sum of views
                }
            }
        },
        {
            $addFields: {
                views: "$views"
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200,{videos,subscribers,Likes:Likes[0]?.likesCount,views:views[0]?.views}))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId= req.user._id;
    const videos = await Video.find({owner: channelId}).populate('owner').sort({createdAt: -1}).exec();
    return res.status(200).json(new ApiResponse(200,videos))
});

export { getChannelStats, getChannelVideos };
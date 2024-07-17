import mongoose from 'mongoose';
import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Subscription } from '../models/subscription.model.js';

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId}=req.params;
    const subscriberId=req.user._id;
    const subscription=await Subscription.findOne({channel:channelId,subscriber:subscriberId});
    if(subscription){
        await Subscription.findByIdAndDelete(subscription._id);
        return res.status(200).json(new ApiResponse(200,false,"Unsubscribed successfully"));
    }
    else{
        const response=await Subscription.create({
            subscriber:subscriberId,
            channel:channelId
        });
        return res.status(200).json(new ApiResponse(200,true,"Subscribed successfully"));
    }
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId}=req.params;
    const subscribers=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },
    ])

    return res.status(200).json(new ApiResponse(200,{subscriberCount:subscribers.length,subscribers:subscribers},"Subscribers fetched successfully"))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId=req.user._id;
    const subscriptions=await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(subscriberId)
            }
        },
    ])
    const response=[];
    for(let i=0;i<subscriptions.length;i++){
        const channel=await Subscription.findById(subscriptions[i]._id).populate('channel', 'username avatar');
        const subscribers=await Subscription.aggregate([
            {
                $match:{
                    channel:channel.channel._id
                }
            },
            {
                $count:'subscriberCount'
            },
        ])
        response.push({
                _id:channel.channel._id,
                username:channel.channel.username,
                avatar:channel.channel.avatar,
                subscriberCount:subscribers[0]?.subscriberCount || 0
        })
    }
    return res.status(200).json(new ApiResponse(200,{subscriptionCount:subscriptions?.length,subscriptions:response},"Subscriptions fetched successfully"))
})
export {toggleSubscription, getUserChannelSubscribers, getSubscribedChannels}


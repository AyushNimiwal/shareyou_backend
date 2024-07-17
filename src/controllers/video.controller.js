import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import {deleteFromCloudinary, uploadOnCloudinary} from '../utils/cloudinary.js';

const publishVideo = asyncHandler(async(req,res)=>{
    const {title,description}=req.body;
    const videoLocalPath=req.files?.video[0]?.path;
    const thumbnailLocalPath=req.files?.thumbnail[0]?.path;
    if(!videoLocalPath){
        throw new ApiError(400,"Video file is required");
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail file is required");
    }
    const videoUrl=await uploadOnCloudinary(videoLocalPath);
    const thumbnailUrl=await uploadOnCloudinary(thumbnailLocalPath);
    if(!videoUrl){
        throw new ApiError(500,"Failed to upload video");
    }
    if(!thumbnailUrl){
        throw new ApiError(500,"Failed to upload thumbnail");
    }
    const video=await Video.create({
        title,
        description,
        videoFile:videoUrl.url,
        duration:videoUrl.duration,
        thumbnail:thumbnailUrl.url,
        owner:req.user._id
    });
    const createdVideo=await Video.findById(video._id);
    res.status(201).json(new ApiResponse(201,createdVideo,"Video published successfully"));
})

const getVideoById=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    const video=await Video.findById(videoId).populate("owner","username avatar");
    if(!video){
        throw new ApiError(404,"Video not found");
    }
    res.status(200).json(new ApiResponse(200,video));

})

const getVideosByOwner = asyncHandler(async(req,res)=>{
    const {userId}=req.params;
    const videos=await Video.find({owner:userId}).populate("owner","username avatar");
    res.status(200).json(new ApiResponse(200,videos,"Videos fetched successfully"));
})

const updateVideoViews=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found");
    }
    video.views+=1;
    await video.save();
    res.status(200).json(new ApiResponse(200,video,"Video views updated successfully"));
})

const updateVideoDetails=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    const {title,description}=req.body;
    const thumbnailLocalPath=req.file?.path;
    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found");
    }
    if(video.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to update this video");
    }
    if(title){
        video.title=title;
    }
    if(description){
        video.description=description;
    }
    if(thumbnailLocalPath){
        const thumbnailUrl=await uploadOnCloudinary(thumbnailLocalPath);
        if(!thumbnailUrl){
            throw new ApiError(500,"Failed to upload thumbnail");
        }
        video.thumbnail=thumbnailUrl.url;
    }
    await video.save();
    res.status(200).json(new ApiResponse(200,video,"Video details updated successfully"));
})

const deleteVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found");
    }
    if(video.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to delete this video");
    }
    const thumbnailPublicUrl=video.thumbnail;
    const videoPublicUrl=video.videoFile;
    await Video.findByIdAndDelete(videoId);
    await deleteFromCloudinary(thumbnailPublicUrl);
    await deleteFromCloudinary(videoPublicUrl);
    res.status(200).json(new ApiResponse(200,"","Video deleted successfully"));
})

const getAllVideos=asyncHandler(async(req,res)=>{
    const {queryText}=req.body;
    const videos=await Video.find({$or:[{title:{$regex:queryText,$options:"i"}},{description:{$regex:queryText,$options:"i"}}]}).populate("owner","username avatar");
    res.status(200).json(new ApiResponse(200,videos,"Videos fetched successfully"));
})

const getLatestVideos=asyncHandler(async(req,res)=>{
    const videos=await Video.find().sort({createdAt:-1}).limit(10).populate("owner","username avatar");
    res.status(200).json(new ApiResponse(200,videos));
})

const togglePublishStatus=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found");
    }
    if(video.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to update this video");
    }
    video.isPublished=!video.isPublished;
    await video.save();
    res.status(200).json(new ApiResponse(200,video,"Video publish status updated successfully"));
})

export {getLatestVideos,getVideosByOwner,publishVideo,getVideoById,updateVideoViews,updateVideoDetails,deleteVideo,getAllVideos,togglePublishStatus};
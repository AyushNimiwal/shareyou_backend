import mongoose from 'mongoose';
import {Comment} from '../models/comment.model.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId}=req.params;
    const {page=1, limit=10}=req.query;
    const comments = await Comment.find({video: videoId}).populate('owner','username avatar').sort({createdAt: -1})
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
    const count = await Comment.countDocuments({video: videoId});
    return res.status(200).json(new ApiResponse(200,{comments,count}))
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId}=req.params
    const {text}=req.body
    console.log(req.body);
    const comment =await Comment.create({video: videoId, content:text, owner:req.user._id})
    return res.status(201).json(new ApiResponse(201,comment,'Comment added successfully'))
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId}=req.params
    const {text}=req.body
    const comment =await Comment.findByIdAndUpdate(
        commentId,
        {content:text},
        {new:true}
    )
    if(!comment){
        throw new ApiError(404,'Comment not found')
    }
    return res.status(200).json(new ApiResponse(200,comment,'Comment updated successfully'))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId}=req.params
    const comment =await Comment.findByIdAndDelete(commentId)
    return res.status(200).json(new ApiResponse(200,comment,'Comment deleted successfully'))
})

export {getVideoComments,addComment,updateComment,deleteComment}
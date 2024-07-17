import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary,deleteFromCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import {Subscription} from '../models/subscription.model.js';
import mongoose from 'mongoose';

const genrateAccessAndRefreshTokens=async(userId)=>{
    try{
        const user= await User.findById(userId);
        const accessToken=user.genrateAccessToken();
        const refreshToken=user.genrateRefershToken();
        console.log("refreshToken: ",refreshToken);
        console.log("accessToken: ",accessToken);
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});
        return {accessToken,refreshToken};
    }catch(e){
        throw new ApiError(500,"Token generation failed");
    }
}

const regiserUser=asyncHandler( async(req,res)=>{
    //get user details from frontend
    //validation - not empty
    //check if user already exists: username, email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    //create user object-create entry in db
    //remove password and refersh token field from response
    //check for user creation
    //return res
    const {username,email,fullName,password}=req.body;
    // console.log("email: ",email);
    if(
        [username,email,fullName,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required");
    }
    const existedUser=await User.findOne({
        $or:[{ username }, { email }]
    });
    if(existedUser){
        throw new ApiError(409,"User already exists");
    }
    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files&& Array.isArray(req.files.coverImage)&&req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar image is required");
    }
    //upload to cloudinary
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar || !coverImage){
        throw new ApiError(500,"Image upload failed");
    }
    const user=await User.create({
        username:username.toLowerCase(),
        email,
        fullName,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
    });
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"User creation failed");
    }
    return res.status(201).json(
        new ApiResponse(201,createdUser,"User created successfully")
    )

})

const loginUser=asyncHandler( async(req,res)=>{
    //req body->data
    //username or email
    //find the user
    //check for password
    //access and refersh token
    //send cookie

    const {email,username,password}=req.body;
    if(!email && !username){
        throw new ApiError(400,"Email or username is required");
    }
    const user=await User.findOne({
        $or:[{email},{username}]
    })
    if(!user){
        throw new ApiError(404,"User not found");
    }
    const isPasswordValid=await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid credentials");
    }
    const{accessToken,refreshToken}=await genrateAccessAndRefreshTokens(user._id);
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
    }
    return res.status(200).cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(
        200,
        {
            user:loggedInUser,accessToken,refreshToken
        },
        "User logged in successfully"
    ))

})

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {$unset:{
            refreshToken:1//remove refreshToken 
        }},
        {
           new:true 
        }
    )

    console.log("logoutUser: ",req.cookies);
    const options={
        httpOnly:true,
    }
    return res.status(200).clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"User logged out successfully")
    )
})

const refreshAccessToken= asyncHandler(async(req,res)=>{
    const incomingRefershToken=req.cookies.refreshToken || req.bodu.refreshToken;
    if(!incomingRefershToken){
        throw new ApiError(401,"Unauthorized request");
    }
    try {
        const decodedToken=jwt.verify(incomingRefershToken,process.env.REFRESH_TOKEN_SECRET);
        const user=await User.findById(decodedToken._id);
        if(!user){
            throw new ApiError(404,"Invalid refresh token");
        }
        if(incomingRefershToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired");
        }
        const{accessToken,refreshToken}=await genrateAccessAndRefreshTokens(user._id);
        const options={
            httpOnly:true,
            secure:true
        }
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(200,{accessToken,refreshToken},"Token refreshed successfully")
        )
    } catch (error) {
        throw new ApiError(401,"Invalid refresh token");
    }
})

const changeCurrentPassword= asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;
    const user=await User.findById(req.user._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid password");
    }
    user.password=newPassword;
    await user.save({validateBeforeSave:false});
    return res.status(200).json(new ApiResponse(200,{},"Password changed successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"User details fetched successfully"))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {username,fullName,email}=req.body
    if(!username && !fullName && !email){
        throw new ApiError(400,"All fields are required");
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                username:username?.toLowerCase(),
                fullName,
                email
            }
        },
        {
            new:true
        }
    ).select("-password")
    return res.status(200)
    .json(new ApiResponse(200,user,"User details updated successfully"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar image is required");
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath);

    if(!avatar){
        throw new ApiError(500,"Image upload failed");
    }
    const avatarPublicUrl=req.user?.avatar;
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        { new:true }
    ).select("-password")
    if(avatarPublicUrl){
        deleteFromCloudinary(avatarPublicUrl);
    }
    return res.status(200).json(new ApiResponse(200,user,"Avatar updated successfully"))
})

const updateCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover image is required");
    }
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage){
        throw new ApiError(500,"Image upload failed");
    }
    const coverImagePublicUrl=req.user?.coverImage;
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        { new:true }
    ).select("-password")
    if(coverImagePublicUrl){
        deleteFromCloudinary(coverImagePublicUrl);
    }
    return res.status(200).json(new ApiResponse(200,user,"Cover image updated successfully"))
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {id}=req.params;
    const channel=await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(id)
            }
        },
        {
           $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
              } 
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                subscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                avatar:1,
                coverImage:1,
                subscriberCount:1,
                subscribedToCount:1,
                isSubscribed:1,
                email:1,
            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(404,"Channel doesn't exist");
    }
    return res.status(200).json(new ApiResponse(200,channel,"Channel details fetched successfully"))
})

const createChannel = asyncHandler(async(req,res)=>{
    const channel = await Subscription.findOne({subscriber:req.user._id, channel:req.user._id});
    if(!channel){
        const newChannel = await Subscription.create({
            subscriber:req.user._id,
            channel:req.user._id
        })
        return res.status(200).json(new ApiResponse(200,newChannel?.channel,"Channel details fetched successfully"));
    }else{
        return res.status(200).json(new ApiResponse(200,channel?.channel,"Channel details fetched successfully"));
    }
})

const getWatchHistory=asyncHandler(async(req,res)=>{
    // const user=User.aggregate([
    //     {
    //         $match:{
    //             _id: new mongoose.Types.ObjectId(req.user._id)
    //         }
    //     },
    //     {
    //         $lookup:{
    //             from:"videos",
    //             localField:"watchHistory",
    //             foreignField:"_id",
    //             as:"watchHistory",
    //             pipeline:[
    //                 {
    //                     $lookup:{
    //                         from:"users",
    //                         localField:"owner",
    //                         foreignField:"_id",
    //                         as:"owner",
    //                         pipeline:[
    //                             {
    //                                 $project:{
    //                                     fullName:1,
    //                                     username:1,
    //                                     avatar:1
    //                                 }
    //                             }
    //                         ]
    //                     }
    //                 },
    //                 {
    //                     $addFields:{
    //                         owner:{
    //                             $first:"$owner"
    //                         }
    //                     }
    //                 }
    //             ]
    //         },
    //     },
    // ])
    // return res.status(200).json(
    //     new ApiResponse(200,user,"Watch History Successfully fetched")
    // )

    const user=await User.findById(req.user._id).populate(
        { path: "watchHistory",populate:{ path:"owner",select:"fullName username avatar"}})
    return res.status(200).json(new ApiResponse(200,user.watchHistory,"Watch history fetched successfully"))
})

const updateHistory = asyncHandler(async(req,res)=>{
    const {videoId}=req.body;
    if(!videoId){
        throw new ApiError(400,"Video ID is required");
    }
    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $addToSet:{
                watchHistory:videoId
            }
        },
        {
            new:true
        }
    )
    return res.status(200).json(new ApiResponse(200,user,"Watch history updated successfully"))
})

export {loginUser,createChannel,regiserUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateCoverImage,getUserChannelProfile,getWatchHistory,updateHistory}
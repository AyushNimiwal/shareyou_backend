import mongoose from 'mongoose';
import {Playlist} from '../models/playlist.model.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description, videoId}=req.body
    if(!name || !description){
        throw new ApiError(400, 'Please provide all the details')
    }
    const playList=await Playlist.create({
        name,
        description,
        owner:req.user._id,
        videos:[videoId?videoId:[]]
    })
    res.status(201).json(new ApiResponse(201, playList, 'Playlist created successfully'))
})

const getUserPlaylists = asyncHandler(async (req,res)  =>{
    const playlists=await Playlist.find({owner:req.user._id})
    if(!playlists){
        throw new ApiError(404, 'No playlists found')
    }
    res.status(200).json(new ApiResponse(200, playlists, 'Playlists retrieved successfully'))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, 'Playlist not found')
    }
    res.status(200).json(new ApiResponse(200, playlist, 'Playlist retrieved successfully'))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const videoId = req.body
    const playlist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push:{
                videos:videoId
            }
        },
        {new:true}
    )
    return res.status(200).json(new ApiResponse(200, playlist, 'Video added to playlist successfully'))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const videoId = req.body
    const playlist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                videos:videoId
            }
        },
        {new:true}
    )
    return res.status(200).json(new ApiResponse(200, playlist, 'Video removed from playlist successfully'))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const playlist=await Playlist.findByIdAndDelete(playlistId)
    return res.status(200).json(new ApiResponse(200, "", 'Playlist deleted successfully'))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description}=req.body
    const playlist =await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name,
                description
            }
        },
        {new:true}
    )
    return res.status(200).json(new ApiResponse(200, playlist, 'Playlist updated successfully'))
})

export {createPlaylist, getUserPlaylists, getPlaylistById, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist}
import {Router} from 'express'
import { loginUser, regiserUser,logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateCoverImage, updateUserAvatar, getUserChannelProfile, getWatchHistory, updateHistory, createChannel } from '../controllers/user.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

import {upload} from '../middlewares/multer.middleware.js'
const router =Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    regiserUser
)
router.route("/login").post(loginUser)

//secured route
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"),updateCoverImage)
router.route("/c/:id").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)
router.route('/updatehistory').patch(verifyJWT,updateHistory)
router.route("/createchannel").post(verifyJWT,createChannel)

export default router
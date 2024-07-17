import {Router} from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js'
import { upload } from '../middlewares/multer.middleware.js';

const router=Router();
router.use(verifyJWT);

import {getVideoById, publishVideo, updateVideoViews, updateVideoDetails, deleteVideo, getAllVideos, togglePublishStatus, getLatestVideos, getVideosByOwner} from '../controllers/video.controller.js';

router.route('/publish').post(
    upload.fields([
        {
            name:"video",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),publishVideo);

router.route('/:videoId').get(getVideoById);
router.route('/views/:videoId').patch(updateVideoViews);
router.route('/:videoId').patch(upload.single("thumbnail"),updateVideoDetails);
router.route('/:videoId').delete(deleteVideo);
router.route('/allvideos').post(getAllVideos);
router.route('/togglepublish/:videoId').patch(togglePublishStatus);
router.route('/latestvideo').post(getLatestVideos);
router.route('/getVideosByOwner/:userId').post(getVideosByOwner);

export default router;
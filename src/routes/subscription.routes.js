import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/c/:channelId").get(getUserChannelSubscribers)
router.route("/c/subscription/:channelId").post(toggleSubscription);
router.route("/channels").get(getSubscribedChannels)


export default router;
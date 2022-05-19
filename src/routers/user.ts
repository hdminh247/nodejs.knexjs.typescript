import { Router } from "express";

import { getProfile, updateProfile, changePassword } from "../controllers/user";
import { verifyToken } from "./middlewares/authentication";

const router = Router();

router.all("/*", verifyToken());

// Get profile
router.route("/profile").get(getProfile);
router.route("/profile").put(updateProfile);

router.route("/password").put(changePassword);

export default router;

import { Router } from "express";

import { signIn } from "../controllers/auth";

const router = Router();

// Local login
router.route("/login").post(signIn);

export default router;

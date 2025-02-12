import { Router } from "express";
import { login, refresh, register } from "../controllers/authController";
import { validate } from "../middleware/validate";
import {
  loginValidation,
  refreshTokenValidation,
  registerValidation,
} from "../validations/auth.validation";

const router = Router();

// Auth routes
router.post("/register", validate(registerValidation), register);
router.post("/login", validate(loginValidation), login);
router.post("/refresh", validate(refreshTokenValidation), refresh);

export default router;

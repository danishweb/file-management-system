import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import { User } from "../models/User";
import { DuplicateError, UnauthorizedError } from "../utils/errors";
import { generateTokens, refreshAccessToken } from "../utils/jwt";

// Register new user
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(201).json({
      message: "User registered successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if ((error as any).code === 11000) {
      const field = Object.keys((error as any).keyPattern)[0];
      next(new DuplicateError(field as string));
    }
    next(error);
  }
};

// Login user
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(200).json({
      message: "Login successful",
      ...tokens,
      user: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token is required");
    }

    const accessToken = refreshAccessToken(refreshToken);

    res.status(200).json({
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

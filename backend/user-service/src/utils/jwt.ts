import jwt from "jsonwebtoken";
import { IUser } from "../models/User";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

interface TokenPayload {
  userId: string;
  type: "access" | "refresh";
}

export const generateTokens = (user: IUser) => {
  const accessToken = jwt.sign(
    { userId: user._id, type: "access" } as TokenPayload,
    ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId: user._id, type: "refresh" } as TokenPayload,
    REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

export const verifyToken = (
  token: string,
  type: "access" | "refresh"
): TokenPayload => {
  try {
    const secret =
      type === "access" ? ACCESS_TOKEN_SECRET : REFRESH_TOKEN_SECRET;
    const decoded = jwt.verify(token, secret) as TokenPayload;

    if (decoded.type !== type) {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch (error) {
    throw error;
  }
};

export const refreshAccessToken = (refreshToken: string) => {
  try {
    const decoded = verifyToken(refreshToken, "refresh");
    const accessToken = jwt.sign(
      { userId: decoded.userId, type: "access" } as TokenPayload,
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    return accessToken;
  } catch (error) {
    throw error;
  }
};

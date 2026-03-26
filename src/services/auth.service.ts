import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
import { Shop } from "../models/shop.model";
import { User, UserRole } from "../models/user.model";
import { HttpError } from "../utils/http-error";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

let googleClient: OAuth2Client | null = null;

const getGoogleOAuthConfig = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId) {
    throw new HttpError(500, "GOOGLE_CLIENT_ID is not configured");
  }

  if (!clientSecret) {
    throw new HttpError(500, "GOOGLE_CLIENT_SECRET is not configured");
  }

  return { clientId, clientSecret };
};

// GET /api/auth/me
// Returns the logged-in user's profile + their shop details
export const getMe = async (user_id: string) => {
  const user = await User.findById(new Types.ObjectId(user_id)).select(
    "-password_hash"
  );
 
  if (!user) {
    throw new HttpError(404, "User not found.");
  }
 
  const shop = await Shop.findById(user.shop_id);
 
  if (!shop) {
    throw new HttpError(404, "Shop not found.");
  }
 
  return {
    user: {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      last_login: user.last_login,
      created_at: user.created_at,
    },
    shop: {
      _id: shop._id,
      name: shop.name,
      owner_name: shop.owner_name,
      phone: shop.phone,
      address: shop.address,
      created_at: shop.created_at,
    },
  };
};

const getGoogleOAuthClient = () => {
  if (!googleClient) {
    const { clientId, clientSecret } = getGoogleOAuthConfig();
    googleClient = new OAuth2Client(clientId, clientSecret);
  }

  return googleClient;
};

type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
};

type PasswordLoginInput = {
  phone: string;
  password: string;
  shop_id?: string;
};

type OnboardGoogleInput = {
  idToken: string;
  name: string;
  phone: string;
  role: UserRole;
  shop_id?: string;
  shop_name?: string;
  shop_address?: string;
  timezone?: string;
};

const verifyGoogleToken = async (idToken: string): Promise<GoogleProfile> => {
  const { clientId } = getGoogleOAuthConfig();
  const client = getGoogleOAuthClient();

  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email || !payload.name) {
    throw new HttpError(401, "Invalid Google token payload");
  }

  if (!payload.email_verified) {
    throw new HttpError(401, "Google email is not verified");
  }

  const profile: GoogleProfile = {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
  };

  if (payload.picture) {
    profile.picture = payload.picture;
  }

  return profile;
};

const loginWithPassword = async ({ phone, password, shop_id }: PasswordLoginInput) => {
  const query: { phone: string; is_active: boolean; shop_id?: string } = {
    phone,
    is_active: true,
  };

  if (shop_id) {
    query.shop_id = shop_id;
  }

  const user = await User.findOne(query).select("+password_hash");

  if (!user || !user.password_hash) {
    throw new HttpError(401, "Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new HttpError(401, "Invalid credentials");
  }

  user.last_login = new Date();
  await user.save();

  const safeUser = await User.findById(user._id).select("-password_hash");
  return safeUser;
};

const continueWithGoogle = async (idToken: string) => {
  const googleProfile = await verifyGoogleToken(idToken);

  const user = await User.findOne({
    is_active: true,
    $or: [{ google_id: googleProfile.googleId }, { email: googleProfile.email }],
  }).select("-password_hash");

  if (!user) {
    return {
      needsOnboarding: true as const,
      profile: {
        name: googleProfile.name,
        email: googleProfile.email,
        picture: googleProfile.picture,
      },
    };
  }

  user.last_login = new Date();
  if (!user.google_id) {
    user.google_id = googleProfile.googleId;
  }
  if (!user.email) {
    user.email = googleProfile.email;
  }
  if (user.auth_provider !== "google") {
    user.auth_provider = "google";
  }
  await user.save();

  const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET as string);

  return {
    needsOnboarding: false as const,
    message: "Login successful",
    user,
    token
  };
};

const onboardGoogleUser = async (payload: OnboardGoogleInput) => {
  const googleProfile = await verifyGoogleToken(payload.idToken);

  const existingUser = await User.findOne({
    is_active: true,
    $or: [{ google_id: googleProfile.googleId }, { email: googleProfile.email }],
  }).select("-password_hash");

  if (existingUser) {
    existingUser.last_login = new Date();
    await existingUser.save();

    return {
      message: "Login successful",
      user: existingUser,
    };
  }

  let resolvedShopId: mongoose.Types.ObjectId;

  if (payload.role === "worker") {
    if (!payload.shop_id || !mongoose.isValidObjectId(payload.shop_id)) {
      throw new HttpError(400, "Valid shop_id is required for worker");
    }

    const existingShop = await Shop.findById(payload.shop_id);

    if (!existingShop || !existingShop.is_active) {
      throw new HttpError(404, "Active shop not found");
    }

    resolvedShopId = existingShop._id;
  } else {
    if (!payload.shop_name) {
      throw new HttpError(400, "shop_name is required for owner");
    }

    const newShop = await Shop.create({
      name: payload.shop_name,
      owner_name: payload.name,
      phone: payload.phone,
      address: payload.shop_address,
      timezone: payload.timezone || "Asia/Kolkata",
    });

    resolvedShopId = newShop._id;
  }

  const user = await User.create({
    shop_id: resolvedShopId,
    name: payload.name,
    email: googleProfile.email,
    google_id: googleProfile.googleId,
    phone: payload.phone,
    role: payload.role,
    auth_provider: "google",
  });

  const safeUser = await User.findById(user._id).select("-password_hash");

  return {
    message: "Google onboarding completed",
    user: safeUser,
  };
};

const authService = {
  loginWithPassword,
  continueWithGoogle,
  onboardGoogleUser,
};

export default authService;

const express = require("express");
const bcrypt = require("bcryptjs");
const { getCollections } = require("../config/db");
const { signToken, verifyToken } = require("../middleware/auth");

const router = express.Router();

function validatePasswordStrength(password) {
  if (!password || typeof password !== "string" || password.length < 6) {
    return "Password must be at least 6 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  }
  return null;
}

// POST /api/jwt - Generate JWT token for authenticated session
router.post("/jwt", async (req, res, next) => {
  try {
    const { email, name, uid } = req.body || {};
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required to generate a JWT token.",
      });
    }

    const token = signToken({ email, name, uid });
    res.cookie("uddog_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      token,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register - Register new user with email/password
router.post("/auth/register", async (req, res, next) => {
  try {
    const { name, email, photoURL, password } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required.",
      });
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { usersCollection } = await getCollections();

    const existingUser = await usersCollection.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name.trim()
    )}&background=0F5338&color=ffffff&bold=true`;

    const newUserDoc = {
      name: name.trim(),
      displayName: name.trim(),
      email: normalizedEmail,
      photoURL: photoURL && photoURL.trim() ? photoURL.trim() : defaultAvatar,
      passwordHash,
      provider: "credentials",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const insertRes = await usersCollection.insertOne(newUserDoc);
    const userPayload = {
      uid: insertRes.insertedId.toString(),
      name: newUserDoc.name,
      displayName: newUserDoc.displayName,
      email: newUserDoc.email,
      photoURL: newUserDoc.photoURL,
    };

    const token = signToken(userPayload);

    return res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      user: userPayload,
      token,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login - Authenticate user with email & password
router.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { usersCollection } = await getCollections();

    const userDoc = await usersCollection.findOne({ email: normalizedEmail });

    if (!userDoc || !userDoc.passwordHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password. Please verify your credentials.",
      });
    }

    const isMatch = await bcrypt.compare(password, userDoc.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password. Please verify your credentials.",
      });
    }

    const userPayload = {
      uid: userDoc._id.toString(),
      name: userDoc.displayName || userDoc.name,
      displayName: userDoc.displayName || userDoc.name,
      email: userDoc.email,
      photoURL: userDoc.photoURL || null,
    };

    const token = signToken(userPayload);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      user: userPayload,
      token,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/social - Upsert OAuth user (Google / GitHub) and return JWT
router.post("/auth/social", async (req, res, next) => {
  try {
    const { email, name, photoURL, provider = "google" } = req.body || {};

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required for social login synchronization.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { usersCollection } = await getCollections();

    const cleanName = name?.trim() || normalizedEmail.split("@")[0];
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      cleanName
    )}&background=0F5338&color=ffffff&bold=true`;

    const existing = await usersCollection.findOne({ email: normalizedEmail });
    let userPayload;

    if (existing) {
      const updatedName = existing.displayName || existing.name || cleanName;
      const updatedPhoto = existing.photoURL || photoURL || defaultAvatar;
      await usersCollection.updateOne(
        { _id: existing._id },
        {
          $set: {
            displayName: updatedName,
            name: updatedName,
            photoURL: updatedPhoto,
            updatedAt: new Date().toISOString(),
          },
        }
      );
      userPayload = {
        uid: existing._id.toString(),
        name: updatedName,
        displayName: updatedName,
        email: normalizedEmail,
        photoURL: updatedPhoto,
      };
    } else {
      const newDoc = {
        name: cleanName,
        displayName: cleanName,
        email: normalizedEmail,
        photoURL: photoURL || defaultAvatar,
        provider,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const insertRes = await usersCollection.insertOne(newDoc);
      userPayload = {
        uid: insertRes.insertedId.toString(),
        name: newDoc.name,
        displayName: newDoc.displayName,
        email: newDoc.email,
        photoURL: newDoc.photoURL,
      };
    }

    const token = signToken(userPayload);
    return res.status(200).json({
      success: true,
      user: userPayload,
      token,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/profile - Update logged-in user's name and profile picture (Protected)
router.put("/auth/profile", verifyToken, async (req, res, next) => {
  try {
    const email = req.user.email;
    const { name, displayName, photoURL } = req.body || {};
    const finalName = (displayName || name || "").trim();

    if (!finalName || finalName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters long.",
      });
    }

    const { usersCollection, eventsCollection, joinedEventsCollection } =
      await getCollections();

    const updateFields = {
      name: finalName,
      displayName: finalName,
      updatedAt: new Date().toISOString(),
    };
    if (typeof photoURL === "string" && photoURL.trim()) {
      updateFields.photoURL = photoURL.trim();
    }

    await usersCollection.updateOne(
      { email },
      { $set: updateFields },
      { upsert: true }
    );

    // Sync creator name/photo on user's created events & joined records
    const creatorUpdates = { creatorName: finalName };
    if (updateFields.photoURL) {
      creatorUpdates.creatorPhoto = updateFields.photoURL;
    }
    await eventsCollection.updateMany(
      { creatorEmail: email },
      { $set: creatorUpdates }
    );

    const participantUpdates = { userName: finalName };
    if (updateFields.photoURL) {
      participantUpdates.userPhoto = updateFields.photoURL;
    }
    await joinedEventsCollection.updateMany(
      { userEmail: email },
      { $set: participantUpdates }
    );

    const updatedUserDoc = await usersCollection.findOne({ email });
    const userPayload = {
      uid: updatedUserDoc?._id?.toString() || req.user.uid || "",
      name: finalName,
      displayName: finalName,
      email,
      photoURL: updateFields.photoURL || updatedUserDoc?.photoURL || null,
    };

    const token = signToken(userPayload);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: userPayload,
      token,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

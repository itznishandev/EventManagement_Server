const express = require("express");
const { ObjectId } = require("mongodb");
const { getCollections } = require("../config/db");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// POST /api/events/:id/join - Join an event (Protected by JWT)
router.post("/events/:id/join", verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const userEmail = req.user.email.toLowerCase().trim();
    const { userName, userPhoto, note } = req.body || {};

    const { eventsCollection, joinedEventsCollection } = await getCollections();
    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const existingJoin = await joinedEventsCollection.findOne({
      eventId: id,
      userEmail,
    });

    if (existingJoin) {
      return res.status(409).json({
        success: false,
        message: "You have already joined this event.",
      });
    }

    const joinRecord = {
      eventId: id,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      thumbnail: event.thumbnail,
      location: event.location,
      eventDate: event.eventDate,
      creatorEmail: event.creatorEmail,
      creatorName: event.creatorName,
      userEmail,
      userName: (userName || req.user.name || userEmail.split("@")[0]).trim(),
      userPhoto: userPhoto || null,
      note: note ? note.trim() : "",
      joinedAt: new Date().toISOString(),
    };

    await joinedEventsCollection.insertOne(joinRecord);
    await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { participantsCount: 1 } }
    );

    return res.status(201).json({
      success: true,
      message: "Successfully joined the social development event!",
      joinedEvent: joinRecord,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/joined-events - Get all events joined by logged-in user sorted by eventDate
router.get("/joined-events", verifyToken, async (req, res, next) => {
  try {
    const userEmail = req.user.email.toLowerCase().trim();
    const { joinedEventsCollection } = await getCollections();

    const joinedEvents = await joinedEventsCollection
      .find({ userEmail })
      .sort({ eventDate: 1 })
      .toArray();

    return res.status(200).json({
      success: true,
      count: joinedEvents.length,
      joinedEvents,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/my-events - Get all events created by the logged-in user (Manage Events)
router.get("/my-events", verifyToken, async (req, res, next) => {
  try {
    const creatorEmail = req.user.email.toLowerCase().trim();
    const { eventsCollection } = await getCollections();

    const myEvents = await eventsCollection
      .find({ creatorEmail })
      .sort({ eventDate: 1 })
      .toArray();

    return res.status(200).json({
      success: true,
      count: myEvents.length,
      events: myEvents,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const express = require("express");
const { ObjectId } = require("mongodb");
const { getCollections } = require("../config/db");
const { ensureUpcomingSeedData } = require("../data/seedEvents");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

function validateEventPayload(body) {
  const { title, description, eventType, thumbnail, location, eventDate } = body || {};

  if (!title || typeof title !== "string" || title.trim().length < 5) {
    return "Event title must be at least 5 characters long.";
  }
  if (!description || typeof description !== "string" || description.trim().length < 20) {
    return "Event description must be at least 20 characters long.";
  }
  if (!eventType || typeof eventType !== "string" || !eventType.trim()) {
    return "Event type is required.";
  }
  if (!thumbnail || typeof thumbnail !== "string" || !/^https?:\/\/.+/i.test(thumbnail.trim())) {
    return "A valid HTTP/HTTPS thumbnail image URL is required.";
  }
  if (!location || typeof location !== "string" || location.trim().length < 3) {
    return "Event location is required.";
  }
  if (!eventDate) {
    return "Event date is required.";
  }

  const parsedDate = new Date(eventDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid event date format.";
  }

  const now = new Date();
  if (parsedDate <= now) {
    return "Event date must be in the future. Past dates are not allowed.";
  }

  return null;
}

// GET /api/events/upcoming/recent - Fetch 6 recent upcoming events using MongoDB .limit(6)
router.get("/events/upcoming/recent", async (req, res, next) => {
  try {
    await ensureUpcomingSeedData();
    const { eventsCollection } = await getCollections();
    const nowISO = new Date().toISOString();

    const recentEvents = await eventsCollection
      .find({ eventDate: { $gte: nowISO } })
      .sort({ eventDate: 1 })
      .limit(6)
      .toArray();

    return res.status(200).json({
      success: true,
      count: recentEvents.length,
      events: recentEvents,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events - Fetch all upcoming events (eventDate >= today) with optional search & eventType filter
router.get("/events", async (req, res, next) => {
  try {
    await ensureUpcomingSeedData();
    const { eventsCollection } = await getCollections();
    const nowISO = new Date().toISOString();

    const { search = "", eventType = "", sort = "asc" } = req.query;

    const query = {
      eventDate: { $gte: nowISO },
    };

    if (eventType && eventType !== "All" && eventType.trim() !== "") {
      query.eventType = eventType.trim();
    }

    if (search && search.trim() !== "") {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { location: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
      ];
    }

    const sortOrder = sort === "desc" ? -1 : 1;

    const events = await eventsCollection
      .find(query)
      .sort({ eventDate: sortOrder })
      .toArray();

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id - Fetch single event details (Public route)
router.get("/events/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.query;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format.",
      });
    }

    const { eventsCollection, joinedEventsCollection } = await getCollections();
    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const joinedVolunteers = await joinedEventsCollection
      .find({ eventId: id })
      .sort({ joinedAt: -1 })
      .limit(12)
      .toArray();

    let hasJoined = false;
    if (userEmail && typeof userEmail === "string") {
      const existingJoin = await joinedEventsCollection.findOne({
        eventId: id,
        userEmail: userEmail.toLowerCase().trim(),
      });
      hasJoined = Boolean(existingJoin);
    }

    return res.status(200).json({
      success: true,
      event,
      joinedVolunteers,
      hasJoined,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/events - Create a new social service event (Protected by JWT)
router.post("/events", verifyToken, async (req, res, next) => {
  try {
    const validationError = validateEventPayload(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const {
      title,
      description,
      eventType,
      thumbnail,
      location,
      eventDate,
      creatorName,
      creatorPhoto,
      targetVolunteers,
      impactMetric,
    } = req.body;

    const { eventsCollection } = await getCollections();

    const newEvent = {
      title: title.trim(),
      description: description.trim(),
      eventType: eventType.trim(),
      thumbnail: thumbnail.trim(),
      location: location.trim(),
      eventDate: new Date(eventDate).toISOString(),
      creatorEmail: req.user.email.toLowerCase().trim(),
      creatorName: (creatorName || req.user.name || req.user.email.split("@")[0]).trim(),
      creatorPhoto: creatorPhoto || null,
      participantsCount: 0,
      targetVolunteers: Number(targetVolunteers) > 0 ? Number(targetVolunteers) : 50,
      impactMetric: impactMetric?.trim() || "Community Action Drive",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await eventsCollection.insertOne(newEvent);

    return res.status(201).json({
      success: true,
      message: "Event created successfully!",
      event: {
        ...newEvent,
        _id: result.insertedId,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:id - Update an existing event (Protected by JWT + Ownership check)
router.put("/events/:id", verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const { eventsCollection, joinedEventsCollection } = await getCollections();
    const existingEvent = await eventsCollection.findOne({ _id: new ObjectId(id) });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    if (existingEvent.creatorEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only update events that you created.",
      });
    }

    const validationError = validateEventPayload(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const {
      title,
      description,
      eventType,
      thumbnail,
      location,
      eventDate,
      targetVolunteers,
      impactMetric,
    } = req.body;

    const updatedFields = {
      title: title.trim(),
      description: description.trim(),
      eventType: eventType.trim(),
      thumbnail: thumbnail.trim(),
      location: location.trim(),
      eventDate: new Date(eventDate).toISOString(),
      targetVolunteers:
        Number(targetVolunteers) > 0
          ? Number(targetVolunteers)
          : existingEvent.targetVolunteers || 50,
      impactMetric:
        impactMetric?.trim() || existingEvent.impactMetric || "Community Action Drive",
      updatedAt: new Date().toISOString(),
    };

    await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedFields }
    );

    // Sync denormalized event fields in joined_events collection
    await joinedEventsCollection.updateMany(
      { eventId: id },
      {
        $set: {
          title: updatedFields.title,
          description: updatedFields.description,
          eventType: updatedFields.eventType,
          thumbnail: updatedFields.thumbnail,
          location: updatedFields.location,
          eventDate: updatedFields.eventDate,
        },
      }
    );

    const updatedEvent = await eventsCollection.findOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      success: true,
      message: "Event updated successfully!",
      event: updatedEvent,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id - Delete an event (Protected by JWT + Ownership check)
router.delete("/events/:id", verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const { eventsCollection, joinedEventsCollection } = await getCollections();
    const existingEvent = await eventsCollection.findOne({ _id: new ObjectId(id) });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    if (existingEvent.creatorEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only delete events that you created.",
      });
    }

    await eventsCollection.deleteOne({ _id: new ObjectId(id) });
    await joinedEventsCollection.deleteMany({ eventId: id });

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

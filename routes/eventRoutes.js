const express = require("express");
const { ObjectId } = require("mongodb");
const { getCollections } = require("../config/db");
const { ensureUpcomingSeedData } = require("../data/seedEvents");

const router = express.Router();

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

module.exports = router;

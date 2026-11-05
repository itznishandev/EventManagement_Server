# Uddog — Social Development Events Platform (Backend API Server)

RESTful backend server powering **Uddog**, a community-driven social development and civic action platform across Bangladesh. Built with **Express.js**, **MongoDB Atlas**, and **JSON Web Tokens (JWT)** for route-level protection and ownership enforcement.

---

## Live Links & Repositories

- **Live Server API (Vercel):** [https://event-management-server-xi.vercel.app/api](https://event-management-server-xi.vercel.app/api)
- **Live Client Application (Vercel):** [https://uddog-event.vercel.app](https://uddog-event.vercel.app)
- **Client Repository:** [https://github.com/itznishandev/EventManagement_Client](https://github.com/itznishandev/EventManagement_Client)
- **Server Repository:** [https://github.com/itznishandev/EventManagement_Server](https://github.com/itznishandev/EventManagement_Server)

---

## Core Backend Features

- **MongoDB `.limit(6)` Recent Upcoming Query:** Dedicated endpoint (`GET /api/events/upcoming/recent`) utilizing MongoDB's native `.limit(6)` operator and ascending `eventDate` sort to surface the 6 nearest upcoming community drives on the Home page.
- **Strict Future-Date Enforcement:** Both `GET /api/events` and `POST/PUT /api/events` validate event timestamps against current server time so expired drives never appear on the Upcoming Events listing and past dates cannot be submitted.
- **Dynamic Search & Category Filtering:** Server-side regex search across event `title`, `location`, and `description`, combined with `eventType` filtering (`Cleanup`, `Plantation`, `Donation`, `Medical Camp`, `Education`, `Flood Relief`, `Blood Donation`).
- **JWT Authentication & Ownership Guard:** Protected endpoints require a signed Bearer JWT (`verifyToken` middleware). Updating (`PUT /api/events/:id`) or deleting (`DELETE /api/events/:id`) an event verifies that `event.creatorEmail === req.user.email`.
- **Volunteer Participation & Chronological Sorting:** Joining an event (`POST /api/events/:id/join`) stores the full participation record in `joined_events`, prevents duplicate joins via compound unique indexing, increments the event's `participantsCount`, and serves joined events sorted chronologically by `eventDate` (`GET /api/joined-events`).
- **Synchronized Profile Updates:** Updating a user's display name or profile picture (`PUT /api/auth/profile`) propagates across `users`, `events`, and `joined_events` collections.

---

## API Reference

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Health check & endpoint directory |
| `POST` | `/api/jwt` | Public | Issue a signed 7-day JWT token for an authenticated user |
| `POST` | `/api/auth/register` | Public | Register a new user with password policy validation |
| `POST` | `/api/auth/login` | Public | Authenticate user with email & password and issue JWT |
| `POST` | `/api/auth/social` | Public | Sync Google / GitHub OAuth account and issue JWT |
| `PUT` | `/api/auth/profile` | **JWT Protected** | Update user display name & photoURL across collections |
| `GET` | `/api/events/upcoming/recent` | Public | Fetch 6 nearest upcoming events using `.limit(6)` |
| `GET` | `/api/events` | Public | List upcoming events (`?search=&eventType=&sort=asc`) |
| `GET` | `/api/events/:id` | Public | Retrieve single event details and recent joined volunteers |
| `POST` | `/api/events` | **JWT Protected** | Create a new upcoming social service event |
| `PUT` | `/api/events/:id` | **JWT Protected** | Update an event (restricted to event creator) |
| `DELETE` | `/api/events/:id` | **JWT Protected** | Delete an event (restricted to event creator) |
| `POST` | `/api/events/:id/join` | **JWT Protected** | Join an upcoming event and store participation record |
| `GET` | `/api/joined-events` | **JWT Protected** | Fetch logged-in user's joined events sorted by `eventDate` |
| `GET` | `/api/my-events` | **JWT Protected** | Fetch all events created by the logged-in user |

---


4. **Start the server:**
   ```bash
   npm run dev
   ```

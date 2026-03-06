# Mentorship Platform Features: Real-Time Communication, Events, and Session Booking

This repository showcases my work on **core interaction features of a mentorship platform**, including real-time messaging, event management, and mentor session booking.

The implementation focuses on building scalable and responsive user experiences within a production SaaS environment, covering real-time communication patterns, request-based interactions, and event participation flows between mentors and mentees.

---

## Note on Repository Scope

This repository is intended as a **code and architecture showcase**, focusing on how key features are structured and implemented rather than providing a fully runnable application.

The code included here highlights the core logic, patterns, and components used to implement the feature within a larger production SaaS platform. Because of this, the repository may not run out-of-the-box if cloned, and certain dependencies, configurations, or integrations from the original application environment are intentionally omitted.

A **runnable demo version** of these features is planned for a future update. This will include a simplified environment with minimal setup (such as a basic landing page, dummy authentication flow, and sample data) allowing the features to be explored and executed locally.

---

## Features

### Real-Time Chat System

A full-featured messaging system enabling communication between mentors and mentees.

- Real-time messaging powered by **Firebase onSnapshot**
- Optimistic UI updates for instant message sending
- Rollback handling for failed message operations
- Conversation search functionality
- Keyboard UX enhancements (e.g., `Esc` to close active chat, `Enter` to send a message, ...)
- React Query used for caching and state synchronization

---

### Message Request System

To maintain mentor privacy and control over communications:

- Mentees cannot directly message mentors
- A **message request** must be sent first
- Mentors can **accept or reject** the request
- Once accepted, a conversation is created and messaging becomes available

---

### Events System

A structured event discovery and participation system.

- Browse events page
- Category-based event browsing
- Event details pages
- Events categorized as:
  - **Upcoming**
  - **Live**
  - **Past**

Events can be:

- **Public** — visible in event discovery pages
- **Private** — accessible only through a direct event link

Users can:

- Join events directly
- Send join requests if approval is required

---

### Mentor Session Booking

A mentorship booking workflow connecting mentees with mentors.

- Mentees send **session booking requests**
- Mentors can **accept or reject** requests
- Once accepted, a meeting link (e.g., Calendly) is sent to the mentee via the messaging system

This creates a seamless flow from **session request → approval → meeting scheduling**.

---

## Dashboard Management

Mentors manage their interactions through dedicated dashboard pages, including:

- Chat conversations
- Event management
- Session requests

These tools allow mentors to efficiently handle mentee communications and scheduled interactions.

---

## Key Technical Concepts

### Real-Time Messaging

The chat system uses Firebase's real-time listeners to ensure messages are delivered instantly across active conversations.

---

### Optimistic UI Updates

Messages appear instantly in the UI before server confirmation, providing a smooth and responsive messaging experience while handling rollback in case of errors.

---

### Request-Based Communication Flow

Instead of allowing direct messaging, the system implements a request/approval workflow to protect mentors from unsolicited messages.

---

### Event Participation Flows

Events support multiple participation models including direct joining and request-based approval, enabling both open and controlled community interactions.

---

## Tech Stack

- **Next.js**
- **TypeScript**
- **React**
- **Firebase (Realtime Messaging)**
- **TanStack Query (React Query)**
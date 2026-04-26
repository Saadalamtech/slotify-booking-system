# slotify-booking-system
Slotify — Smart Appointment Booking System

Slotify is a clean and responsive web-based appointment booking system designed to manage time slots efficiently and prevent double bookings through structured logic and dynamic state handling.

Project Overview

The application allows users to view available time slots, book appointments, and manage their bookings. It also includes an admin interface to create and manage slots.

The system focuses on real-world usability, ensuring smooth interaction and clear visibility of slot availability.

Features

- View available time slots in a structured grid layout
- Book appointments with real-time status updates
- Cancel bookings and restore slot availability
- Admin panel to create and manage time slots
- Dynamic slot generation based on time intervals
- Conflict-free scheduling to prevent double booking
- Persistent data storage using localStorage

Core Functionality

Each slot is managed using a structured data model:

{
  id: unique,
  date: "YYYY-MM-DD",
  startTime: "10:00",
  endTime: "10:30",
  isBooked: false
}

The system ensures:
- Only available slots can be booked
- Booked slots are instantly updated across the UI
- Cancelling a booking restores availability
- State is consistently maintained using JavaScript logic

Tech Stack

- HTML
- CSS
- JavaScript (Vanilla JS)
- localStorage (for data persistence)

UI Structure

- Navbar with navigation (Home, Book Appointment, My Bookings, Admin Panel)
- Hero section for landing experience
- Available slots displayed as interactive cards
- Booking confirmation modal
- User dashboard for managing appointments
- Admin panel for slot creation and management

Learning Outcomes

- Designed a system with real-time state updates
- Implemented logic to prevent double booking
- Built dynamic UI interactions using JavaScript
- Understood structured data handling and application flow
- Improved problem-solving through edge-case handling

Future Improvements

- Backend integration for persistent database storage
- User authentication system
- Calendar-based UI view
- Notification system (email/SMS)
- Multi-user support

Final Note

The goal of this project was to simulate a real-world booking system with clear logic, clean UI, and consistent behavior across all interactions.

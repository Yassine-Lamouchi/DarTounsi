<p align="center">
  <strong>🏠 DarTounsi</strong><br>
  <em>Tunisia's Premier Property Rental & Co-living Platform</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PHP-8.x-777BB4?style=flat-square&logo=php&logoColor=white" alt="PHP">
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/CSS3-Custom_Design_System-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/Architecture-SPA-e85d04?style=flat-square" alt="SPA">
  <img src="https://img.shields.io/badge/Dependencies-Zero-22c55e?style=flat-square" alt="Zero Dependencies">
</p>

---

## 📖 Table of Contents

1. [Overview](#-overview)
2. [Scrum Team](#-scrum-team)
3. [Architecture & Project Structure](#-architecture--project-structure)
4. [Technology Stack](#-technology-stack)
5. [Features by Sprint](#-features-by-sprint)
6. [SamsarBot AI Assistant](#-samsarbot-ai-assistant)
7. [API Reference](#-api-reference)
8. [Database Schema](#-database-schema)
9. [UML System Design](#-uml-system-design)
10. [Testing Documentation](#-testing-documentation)
11. [Design System](#-design-system)
12. [Installation & Setup](#-installation--setup)
13. [Login Credentials](#-login-credentials)
14. [Routing & Navigation](#-routing--navigation)
15. [License](#-license)

---

## 🌍 Overview

**DarTounsi** (دار التونسي — "The Tunisian Home") is a full-stack **Single Page Application (SPA)** for property rental, flat sharing, and student housing in Tunisia. It was developed as a **Federated Scrum Project** for the 2025–2026 academic year.

The platform enables tenants to search, filter, and apply for properties; property owners and hotel managers to list and manage their listings; and administrators to moderate the entire ecosystem — all within a single browser tab, with no page reloads.

### Key Highlights

| Aspect           | Details                                               |
| ---------------- | ----------------------------------------------------- |
| **Architecture** | Client-side SPA with hash-based routing (`#/page`)    |
| **Backend**      | Single PHP API endpoint (`api.php`) serving JSON      |
| **Frontend**     | Vanilla JavaScript (ES6+), no frameworks or libraries |
| **Styling**      | Custom CSS design system with Dark/Light themes       |
| **Database**     | MySQL (InnoDB) with 12 relational tables              |
| **Dependencies** | **Zero** — no CDNs, no npm, no external APIs          |
| **Localization** | 3 languages (English, French, Arabic) with full RTL   |
| **AI Assistant** | SamsarBot — keyword-based FAQ chatbot (client-side)   |

---

## 👥 Scrum Team

| Role              | Name                | Responsibility                                               | Contribution |
| ----------------- | ------------------- | ------------------------------------------------------------ | :----------: |
| **Product Owner** | Yassine Lamouchi    | Product vision, backlog prioritization, system architecture, documentation, platform direction | **25%** |
| **Scrum Master**  | Mohamed Khabou      | Agile process facilitation, sprint planning, blocker removal, team coordination | 15% |
| **Developer**     | Aymen Majdoub       | Full-stack development, core platform features, integration  | 15% |
| **Developer**     | Adem Loukil         | Backend architecture, API and database design, data layer    | 15% |
| **Developer**     | Raed Guesmi         | Frontend development, UI/UX implementation, CSS design system | 15% |
| **Developer**     | Mohamed Amin Guirat | Quality assurance, integration testing, security validation  | 15% |

> **Note:** All team members contributed across all project areas. The Development Team (Aymen, Adem, Raed, Mohamed Amin) focused more deeply on development, testing, security, maintenance, and performance. Yassine Lamouchi carried additional responsibility as Product Owner for overall architecture, system design oversight, documentation, and quality standards.

### Contribution Breakdown

```
Yassine Lamouchi (PO)    ██████████████████████████████████ 25%
Mohamed Khabou (SM)      ████████████████████               15%
Aymen Majdoub (Dev)      ████████████████████               15%
Adem Loukil (Dev)        ████████████████████               15%
Raed Guesmi (Dev)        ████████████████████               15%
M. Amin Guirat (Dev)     ████████████████████               15%
```

---

## 🏗️ Architecture & Project Structure

DarTounsi follows a **monolithic SPA** pattern: a single HTML shell loads all content dynamically via JavaScript, communicating with a unified PHP REST API.

```
DarTounsi/
│
├── index.php                    # HTML shell (SPA entry point)
│                                  — Navbar, main container, footer
│                                  — SamsarBot floating panel
│                                  — Theme toggle & language switcher
│                                  — Toast notification container
│                                  — Modal overlay system
│
├── app.js                       # Full SPA application (942 lines)
│                                  — Hash-based router (16 routes)
│                                  — Translation system (i18n, 3 languages)
│                                  — API client with error handling
│                                  — All page renderers (Home, Search, Property,
│                                    Login, Register, Dashboard, Profile,
│                                    Admin, Messages, Chat, Notifications,
│                                    Matchmaking, Favorites, About, 404)
│                                  — SamsarBot AI engine (25+ FAQ responses)
│                                  — Avatar system (color initials + uploads)
│                                  — Utility functions (XSS escaping, stars, etc.)
│
├── api.php                      # Unified REST API (925 lines, 12 routes)
│                                  — PDO/MySQL with prepared statements
│                                  — Session-based authentication
│                                  — Role-based access control (RBAC)
│                                  — Pagination helper
│                                  — Notification system
│                                  — File upload handler
│
├── style.css                    # Complete design system (471 lines)
│                                  — CSS custom properties (Dark + Light)
│                                  — Component styles (cards, buttons, forms)
│                                  — Responsive breakpoints (480/768/1024px)
│                                  — Animations (3D cards, fade-in, stagger)
│                                  — SamsarBot panel styling
│                                  — RTL support for Arabic
│
├── database/
│   └── schema.sql               # Full schema + seed data (~40 KB)
│                                  — 12 InnoDB tables with foreign keys
│                                  — 30+ seed users, 51 properties
│                                  — 25 reviews, 20 messages, 9 matchmaking profiles
│                                  — Area safety data, reports, payments
│
├── uploads/                     # 12 property images (PNG, ~10 MB total)
│   ├── apartment_city.png
│   ├── apartment_modern.png
│   ├── beach_house.png
│   ├── hotel_room.png
│   ├── house_garden.png
│   ├── house_traditional.png
│   ├── penthouse_luxury.png
│   ├── room_shared.png
│   ├── studio_cozy.png
│   ├── studio_student.png
│   ├── villa_luxury.png
│   └── villa_traditional.png
│
├── System design/               # 32 UML 2.0 diagram files
│   ├── sprint1/                 # 4 HTML + 4 PlantUML source files
│   ├── sprint2/                 # 4 HTML + 4 PlantUML source files
│   ├── sprint3/                 # 4 HTML + 4 PlantUML source files
│   └── global/                  # 4 HTML + 4 PlantUML source files
│
├── Testing/                     # Testing documentation (4 reports)
│   ├── sprint1_testing.md
│   ├── sprint2_testing.md
│   ├── sprint3_testing.md
│   └── system_testing.md
│
└── README.md                    # This file
```

### Data Flow

```
┌────────────┐     Hash Change      ┌──────────────┐
│            │ ──────────────────▶   │              │
│  Browser   │                      │   app.js     │
│  (User)    │ ◀──────────────────  │   (Router)   │
│            │     DOM Updates      │              │
└────────────┘                      └──────┬───────┘
                                           │
                                    fetch() │ JSON
                                           │
                                    ┌──────▼───────┐
                                    │   api.php    │
                                    │  (REST API)  │
                                    └──────┬───────┘
                                           │
                                     PDO   │ SQL
                                           │
                                    ┌──────▼───────┐
                                    │    MySQL     │
                                    │  (dartounsi) │
                                    └──────────────┘
```

---

## 🛠️ Technology Stack

| Layer        | Technology                       | Purpose                                     |
| ------------ | -------------------------------- | ------------------------------------------- |
| **Frontend** | Vanilla JavaScript (ES6+)        | SPA routing, DOM rendering, API calls       |
| **Styling**  | Vanilla CSS3 (Custom Properties) | Design system, themes, animations           |
| **Backend**  | PHP 8.x                          | REST API, authentication, data validation   |
| **Database** | MySQL 8.0 (InnoDB)               | Relational data storage, foreign keys       |
| **Server**   | Apache (XAMPP)                   | Local development server                    |
| **Auth**     | PHP Sessions + `password_hash()` | Bcrypt password hashing, session management |

> **Zero external dependencies.** No JavaScript frameworks, no CSS frameworks, no CDNs, no npm packages. The entire application runs offline after initial setup.

---

## 🚀 Features by Sprint

### Sprint 1 — Identity & Trust

> _Core objective: Secure user registration, authentication, and role-based dashboards._

| Feature                         | Description                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------- |
| **Email/Password Registration** | Users register with name, email (validated), password (6+ chars), phone, and role |
| **Role Selection**              | Three registrable roles: Tenant, Owner, Hotel Manager                             |
| **Simulated Google OAuth**      | Prompt-based Google login simulation (creates/logs in users)                      |
| **Session Management**          | Server-side PHP sessions; session check returns unread counts                     |
| **Bento Dashboard**             | Tabbed dashboard with My Properties, Rental Requests, Favorites                   |
| **User Profiles**               | Public profiles with avatar, banner, location, bio, stats                         |
| **Avatar System**               | Auto-generated color initials from username + custom photo upload                 |
| **Verification Badges**         | Admin-assigned trust badges shown on profiles and listings                        |
| **Lifestyle Questionnaire**     | Sleep schedule, noise preference, cleanliness, budget (for matchmaking)           |
| **Forced Logout**               | Session cleared on every fresh page load (demo behavior)                          |

### Sprint 2 — Intelligent Discovery

> _Core objective: Property browsing, advanced search, reviews, and direct communication._

| Feature                | Description                                                                  |
| ---------------------- | ---------------------------------------------------------------------------- |
| **Smart Search**       | Filter by city (12 cities), type (5 types), price range, bedrooms, furnished |
| **Multi-Sort**         | Sort results by newest, price ↑/↓, top-rated, or most viewed                 |
| **Text Search**        | Full-text search across title, description, city, neighborhood               |
| **Property Cards**     | 3D hover effects with staggered entrance animations                          |
| **12 Original Images** | Real property photos in `/uploads/` (no placeholder images)                  |
| **Property Detail**    | Gallery, amenity badges, safety score, reviews, similar properties           |
| **Reviews & Ratings**  | 1–5 star rating with comments; average score on cards                        |
| **Direct Messaging**   | User-to-user messaging with conversation threads                             |
| **WhatsApp Contact**   | Owner phone displayed on listings for direct contact                         |
| **Favorites**          | Toggle-based favorite system (heart icon) with dedicated page                |
| **View Counter**       | Incremented on every property detail page visit                              |
| **Pagination**         | Paginated property list (12 per page) with page navigation                   |

### Sprint 3 — AI Matchmaking & Administration

> _Core objective: Roommate matching, AI assistant, admin moderation, notifications._

| Feature                    | Description                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| **🤖 SamsarBot AI**        | Floating chatbot with 25+ FAQ responses (see [dedicated section](#-samsarbot-ai-assistant)) |
| **Roommate Matching**      | Compatibility scores based on lifestyle questionnaire                                       |
| **Admin Panel**            | Full admin dashboard with stats, user management, property moderation                       |
| **Property Approval**      | New listings require admin approval (`pending → active/rejected`)                           |
| **Super Admin Protection** | Super Admin cannot be deleted or modified by regular admins                                 |
| **Report System**          | Users can report listings; admins review and resolve                                        |
| **Toast Notifications**    | In-app notification toasts (success, error, info)                                           |
| **Notification Polling**   | Background polling (30s interval) for unread notification badges                            |
| **Multi-Currency Display** | Prices in TND (Tunisian Dinar), EUR, USD                                                    |
| **AI-Generated Content**   | Auto-generate property descriptions and user bios via SamsarBot                             |

### Cross-Cutting Features

| Feature                  | Description                                                              |
| ------------------------ | ------------------------------------------------------------------------ |
| **🌙 Dark/Light Theme**  | Toggle with smooth CSS transitions; preference saved to `localStorage`   |
| **🌍 3 Languages**       | English, French, Arabic; Arabic activates full RTL layout                |
| **📱 Responsive Design** | Mobile-first breakpoints at 480px, 768px, 1024px                         |
| **🔒 XSS Protection**    | HTML escaping on all user-generated content (client + server)            |
| **🔐 RBAC**              | 5-tier role system: `super_admin > admin > owner/hotel_manager > tenant` |
| **⚡ SPA Transitions**   | Opacity fade + scroll-to-top on every route change                       |
| **🛡️ Safety Scores**     | Neighborhood safety ratings (1–100) with stats overlay                   |

---

## 🤖 SamsarBot AI Assistant

SamsarBot is a **client-side keyword-matching chatbot** embedded on every page. It requires no external APIs or services.

### How It Works

1. **User types** or **clicks a suggestion** → input is lowercased
2. **Keyword matching** scans the query for trigger words (e.g., `"rent"`, `"search"`, `"safety"`)
3. **Contextual suggestions** update based on the current page (e.g., "How to rent?" on property pages)
4. **Response** is displayed with HTML formatting in the chat panel

### Capabilities

| Topic                   | Trigger Keywords                      | Example Answer                           |
| ----------------------- | ------------------------------------- | ---------------------------------------- |
| Registration            | `register`, `sign up`, `account`      | Step-by-step account creation guide      |
| Login                   | `login`, `sign in`                    | Navigation instructions                  |
| Renting                 | `rent`, `apply`                       | 3-step rental application process        |
| Search                  | `search`, `find`, `filter`            | Search feature explanation               |
| Messaging               | `message`, `chat`, `contact`          | How to contact property owners           |
| Matchmaking             | `match`, `roommate`                   | Compatibility system explanation         |
| Safety                  | `safety`, `neighborhood`              | Neighborhood safety scores               |
| Theme/Language          | `theme`, `dark`, `language`, `arabic` | Toggle instructions                      |
| Identity                | `who are you`, `what are you`         | Self-identification as AI                |
| _25+ additional topics_ | —                                     | Reviews, favorites, admin, uploads, etc. |

### UI Components

- **Floating Action Button (FAB):** Orange pulsing 🤖 button (bottom-right)
- **Chat Panel:** 380px wide, slides up with animation
- **Quick Suggestions:** Context-aware pill buttons below messages
- **AI Badge:** "AI" badge in header — identifies itself as artificial intelligence

---

## 🗂️ API Reference

All API calls follow the pattern: `api.php?route=ROUTE&action=ACTION`

### Authentication (`route=auth`)

| Action     | Method | Description                                     | Auth |
| ---------- | ------ | ----------------------------------------------- | ---- |
| `login`    | POST   | Email/password login                            | ❌   |
| `register` | POST   | Create new account (Tenant/Owner/Hotel Manager) | ❌   |
| `google`   | POST   | Simulated Google OAuth (creates or logs in)     | ❌   |
| `session`  | GET    | Check current session + unread counts           | ❌   |
| `logout`   | GET    | Destroy session                                 | ❌   |

### Users (`route=users`)

| Action   | Method | Description                                              | Auth |
| -------- | ------ | -------------------------------------------------------- | ---- |
| `get`    | GET    | Public profile by ID (includes property/review counts)   | ❌   |
| `update` | POST   | Update own profile (name, phone, location, avatar, etc.) | ✅   |
| `stats`  | GET    | Owner dashboard stats (listings, views, favorites)       | ✅   |

### Properties (`route=properties`)

| Action     | Method | Description                                                 | Auth |
| ---------- | ------ | ----------------------------------------------------------- | ---- |
| `list`     | GET    | Paginated list with filters (city, type, price, sort, etc.) | ❌   |
| `get`      | GET    | Single property with reviews, safety, similar properties    | ❌   |
| `create`   | POST   | Create listing (Owner/Hotel Manager/Admin only)             | ✅   |
| `update`   | POST   | Edit listing (owner or admin)                               | ✅   |
| `delete`   | POST   | Delete listing (owner or admin)                             | ✅   |
| `my`       | GET    | Authenticated user's own listings                           | ✅   |
| `featured` | GET    | Premium active listings (up to 6)                           | ❌   |

### Rentals (`route=rentals`)

| Action        | Method | Description                               | Auth |
| ------------- | ------ | ----------------------------------------- | ---- |
| `request`     | POST   | Submit rental request for a property      | ✅   |
| `my-requests` | GET    | Tenant's outgoing requests                | ✅   |
| `incoming`    | GET    | Owner's incoming requests                 | ✅   |
| `accept`      | POST   | Accept request (marks property as rented) | ✅   |
| `reject`      | POST   | Reject request                            | ✅   |

### Favorites (`route=favorites`)

| Action   | Method | Description                        | Auth |
| -------- | ------ | ---------------------------------- | ---- |
| `toggle` | POST   | Add/remove property from favorites | ✅   |
| `list`   | GET    | List all favorited properties      | ✅   |

### Reviews (`route=reviews`)

| Action   | Method | Description                         | Auth |
| -------- | ------ | ----------------------------------- | ---- |
| `create` | POST   | Submit 1–5 star review with comment | ✅   |
| `list`   | GET    | List reviews for a property         | ❌   |

### Messages (`route=messages`)

| Action          | Method | Description                           | Auth |
| --------------- | ------ | ------------------------------------- | ---- |
| `conversations` | GET    | List all conversation threads         | ✅   |
| `thread`        | GET    | Full message thread with another user | ✅   |
| `send`          | POST   | Send a message                        | ✅   |

### Notifications (`route=notifications`)

| Action     | Method | Description                      | Auth |
| ---------- | ------ | -------------------------------- | ---- |
| `list`     | GET    | Paginated notification list      | ✅   |
| `read`     | POST   | Mark single notification as read | ✅   |
| `read-all` | POST   | Mark all notifications as read   | ✅   |
| `count`    | GET    | Unread notification count        | ✅   |

### Matchmaking (`route=matchmaking`)

| Action    | Method   | Description                         | Auth |
| --------- | -------- | ----------------------------------- | ---- |
| `profile` | GET/POST | Get or save lifestyle questionnaire | ✅   |
| `matches` | GET      | List compatibility matches          | ✅   |

### Admin (`route=admin`)

> Requires `admin` or `super_admin` role.

| Action             | Method | Description                                   |
| ------------------ | ------ | --------------------------------------------- |
| `stats`            | GET    | Platform-wide statistics                      |
| `users`            | GET    | Paginated user list with filters              |
| `properties`       | GET    | Paginated property list with status filter    |
| `verify-user`      | POST   | Toggle user verification badge                |
| `delete-user`      | POST   | Delete user (super_admin protection)          |
| `update-user`      | POST   | Update user details (role immutable)          |
| `approve-property` | POST   | Set property status (active/rejected/pending) |
| `delete-property`  | POST   | Delete any property                           |
| `reports`          | GET    | Paginated list of user reports                |
| `resolve-report`   | POST   | Mark report as resolved                       |

### Upload (`route=upload`)

| Method | Description                             | Limits                      |
| ------ | --------------------------------------- | --------------------------- |
| POST   | Upload image file (multipart/form-data) | JPEG/PNG/WebP/GIF, max 5 MB |

### About (`route=about`)

| Method | Description                    |
| ------ | ------------------------------ |
| GET    | Returns Scrum team information |

---

## 🗄️ Database Schema

The `dartounsi` database contains **12 InnoDB tables** with proper foreign key constraints and cascade deletes.

```
┌──────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│      users       │     │    properties      │     │  rental_requests │
│──────────────────│     │───────────────────│     │──────────────────│
│ id (PK)          │◄────│ owner_id (FK)      │     │ tenant_id (FK)   │
│ name             │     │ title              │◄────│ property_id (FK) │
│ email (UNIQUE)   │     │ type (ENUM)        │     │ owner_id (FK)    │
│ password_hash    │     │ price              │     │ status (ENUM)    │
│ role (ENUM)      │     │ city               │     │ message          │
│ is_verified      │     │ status (ENUM)      │     └──────────────────┘
│ ...              │     │ ...                │
└──────────────────┘     └───────────────────┘
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────┐        ┌──────────────────┐
│  favorites   │          │   reviews    │        │    messages      │
│──────────────│          │──────────────│        │──────────────────│
│ user_id (FK) │          │ user_id (FK) │        │ sender_id (FK)   │
│ property_id  │          │ property_id  │        │ receiver_id (FK) │
│ (UK: unique) │          │ rating (1-5) │        │ property_id (FK) │
└──────────────┘          │ comment      │        │ content          │
                          └──────────────┘        │ is_read          │
                                                  └──────────────────┘
```

### All Tables

| Table                  | Purpose                  | Key Columns                                                               |
| ---------------------- | ------------------------ | ------------------------------------------------------------------------- |
| `users`                | User accounts & profiles | `id`, `email`, `role`, `is_verified`, `avatar_url`                        |
| `properties`           | Property listings        | `owner_id`, `type`, `price`, `city`, `status`, `images` (JSON)            |
| `rental_requests`      | Rental applications      | `tenant_id`, `property_id`, `owner_id`, `status`                          |
| `favorites`            | Saved properties         | `user_id`, `property_id` (unique key)                                     |
| `reviews`              | Property ratings         | `user_id`, `property_id`, `rating` (1–5), `comment`                       |
| `messages`             | User-to-user chat        | `sender_id`, `receiver_id`, `content`, `is_read`                          |
| `matchmaking_profiles` | Roommate preferences     | `user_id`, `sleep_schedule`, `noise_level`, `budget_min/max`              |
| `match_results`        | Compatibility scores     | `user_a_id`, `user_b_id`, `compatibility_score`, `score_breakdown` (JSON) |
| `notifications`        | System notifications     | `user_id`, `type`, `title`, `message`, `link`, `is_read`                  |
| `reports`              | Property abuse reports   | `reporter_id`, `property_id`, `reason`, `status`                          |
| `payments`             | Payment records          | `user_id`, `property_id`, `amount`, `status`                              |
| `area_safety`          | Neighborhood safety data | `city`, `neighborhood`, `safety_score` (1–100), `stats` (JSON)            |

### User Roles (ENUM)

| Role            | Permissions                                                             |
| --------------- | ----------------------------------------------------------------------- |
| `tenant`        | Browse, search, favorite, request rentals, review, message, matchmaking |
| `owner`         | All tenant permissions + create/manage property listings                |
| `hotel_manager` | Same as owner (hotel room listings)                                     |
| `admin`         | All permissions + approve properties, verify users, manage reports      |
| `super_admin`   | All admin permissions + delete admins, cannot be deleted or demoted     |

### Seed Data Summary

| Entity               | Count | Notes                                                  |
| -------------------- | ----- | ------------------------------------------------------ |
| Users                | 30    | 1 super_admin, 5 admins, 24 regular users              |
| Properties           | 51    | Across 12 Tunisian cities, 5 property types            |
| Reviews              | 25    | Ratings distributed 3–5 stars                          |
| Messages             | 20    | 10 conversation threads                                |
| Matchmaking Profiles | 9     | With compatibility results                             |
| Area Safety Records  | 15    | For major Tunis neighborhoods + Sfax, Sousse, Hammamet |
| Reports              | 4     | Various report reasons                                 |
| Payments             | 6     | Simulated Konnect payments                             |
| Notifications        | 12    | System, rental, review, and match notifications        |

---

## 📐 UML System Design

**16 UML 2.0 diagrams** are available in the `System design/` directory, organized by sprint. Each diagram is provided as both:

- **`.html`** — Browser-renderable SVG (open in any browser to view)
- **`.puml`** — PlantUML source code (editable)

| Sprint                      | Use Case | Class | Sequence | Activity |
| --------------------------- | :------: | :---: | :------: | :------: |
| **Sprint 1** (Auth & Trust) |    ✅    |  ✅   |    ✅    |    ✅    |
| **Sprint 2** (Discovery)    |    ✅    |  ✅   |    ✅    |    ✅    |
| **Sprint 3** (AI & Admin)   |    ✅    |  ✅   |    ✅    |    ✅    |
| **Global** (Full System)    |    ✅    |  ✅   |    ✅    |    ✅    |

> Open the `.html` files in any browser to view the rendered diagrams. Use the `.puml` files with PlantUML to edit and re-generate.

---

## 🧪 Testing Documentation

Comprehensive testing reports are available in the `Testing/` directory:

| File                 | Scope    | Description                                                      |
| -------------------- | -------- | ---------------------------------------------------------------- |
| `sprint1_testing.md` | Sprint 1 | Authentication, registration, role selection, session management |
| `sprint2_testing.md` | Sprint 2 | Search, filters, property detail, reviews, messaging, favorites  |
| `sprint3_testing.md` | Sprint 3 | SamsarBot AI, matchmaking, admin panel, notifications, reports   |
| `system_testing.md`  | Global   | End-to-end system tests, cross-browser, responsive, performance  |

Each report includes: test cases, expected vs. actual results, edge cases, and pass/fail status.

---

## 🎨 Design System

The application uses a **custom CSS design system** built entirely with CSS Custom Properties (variables), enabling instant theme switching with no JavaScript overhead.

### Color Palette

| Token        | Dark Mode | Light Mode | Usage                        |
| ------------ | --------- | ---------- | ---------------------------- |
| `--accent`   | `#e85d04` | `#e85d04`  | Primary brand color (orange) |
| `--accent-2` | `#f48c06` | `#f48c06`  | Gradient endpoint            |
| `--bg`       | `#0b0d13` | `#f5f6fa`  | Page background              |
| `--surface`  | `#151829` | `#ffffff`  | Component backgrounds        |
| `--card`     | `#1c2038` | `#ffffff`  | Card backgrounds             |
| `--text`     | `#e5e7eb` | `#1a1d2e`  | Primary text                 |
| `--success`  | `#22c55e` | `#22c55e`  | Success states               |
| `--error`    | `#ef4444` | `#ef4444`  | Error states                 |
| `--warning`  | `#f59e0b` | `#f59e0b`  | Warning states               |

### Typography

- **Font Stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif`
- **System fonts only** — zero external font requests (offline-first)

### Component Library

| Component   | CSS Classes                                          | Features                                 |
| ----------- | ---------------------------------------------------- | ---------------------------------------- |
| **Buttons** | `.btn`, `.btn-primary`, `.btn-danger`, `.btn-sm/lg`  | Gradient backgrounds, hover lift         |
| **Cards**   | `.card`, `.card-body`, `.card-img-wrap`              | 3D perspective hover, staggered entrance |
| **Forms**   | `.form-input`, `.form-select`, `.form-textarea`      | Focus glow, accent border                |
| **Badges**  | `.badge-accent`, `.badge-premium`, `.badge-verified` | Role, status, and feature badges         |
| **Avatars** | `.avatar`, `.avatar-sm/lg/xl`                        | Image + color-initial fallback           |
| **Tables**  | `.table`, `.table-wrap`                              | Hover rows, responsive scroll            |
| **Tabs**    | `.tabs`, `.tab`                                      | Bottom-border active state               |
| **Toasts**  | `.toast-success/error/info`                          | Slide-in animation, auto-dismiss         |
| **Modals**  | `.modal-overlay`, `.modal`                           | Backdrop blur, fade-in                   |

### Animations

| Animation      | Keyframes                       | Usage                        |
| -------------- | ------------------------------- | ---------------------------- |
| `fadeInUp`     | Opacity 0→1, Y 20px→0           | Page transitions, modals     |
| `cardEntrance` | Scale 0.95→1, Y 30px→0          | Staggered card grid loading  |
| `float3d`      | Y translation + subtle rotation | Feature icon hover           |
| `samsarPulse`  | Scale 1→1.3, opacity pulse      | SamsarBot FAB attention ring |
| `spin`         | 360° rotation                   | Loading spinner              |

### Responsive Breakpoints

| Breakpoint   | Target       | Layout Changes                                 |
| ------------ | ------------ | ---------------------------------------------- |
| `> 1024px`   | Desktop      | 3/4-column grids, side-by-side property detail |
| `768–1024px` | Tablet       | 2-column grids, stacked property detail        |
| `480–768px`  | Mobile       | 1-column grids, hamburger menu, compact tabs   |
| `< 480px`    | Small Mobile | Reduced padding, 2-column dashboard stats      |

---

## ⚙️ Installation & Setup

### Prerequisites

- **XAMPP** (or any Apache + MySQL + PHP 8.x stack)
- A modern web browser (Chrome, Firefox, Edge, Safari)

### Steps

1. **Copy the project folder** to your XAMPP htdocs directory:

   ```
   C:\xampp\htdocs\DarTounsi\
   ```

2. **Start Apache and MySQL** via XAMPP Control Panel

3. **Import the database:**
   - Open [`http://localhost/phpmyadmin/`](http://localhost/phpmyadmin/)
   - Click **Import** → select `database/schema.sql` → click **Go**
   - The script auto-creates the `dartounsi` database with all tables and seed data

4. **Open the application:**
   ```
   http://localhost/DarTounsi/
   ```

> **Note:** The application forces a logout on every fresh page load (`api.php?route=auth&action=logout` is called in `init()`). This is intentional demo behavior — log in each time you visit.

---

## 🔐 Login Credentials

### Admin Accounts

> 🔑 Password for all admin accounts: **`456789`**

| Name                | Email                             | Role            |
| ------------------- | --------------------------------- | --------------- |
| Yassine Lamouchi    | `yassine.lamouchi@dartounsi.tn`   | **Super Admin** |
| Mohamed Khabou      | `mohamed.khabou@dartounsi.tn`     | Admin           |
| Aymen Majdoub       | `aymen.majdoub@dartounsi.tn`      | Admin           |
| Adem Loukil         | `adem.loukil@dartounsi.tn`        | Admin           |
| Raed Guesmi         | `raed.guesmi@dartounsi.tn`        | Admin           |
| Mohamed Amin Guirat | `mohamedamin.guirat@dartounsi.tn` | Admin           |

### Regular User Accounts

> 🔑 Password for all regular accounts: **`password123`**

| Name            | Email                      | Role          |
| --------------- | -------------------------- | ------------- |
| Asma Ben Ali    | `asma.benali@email.tn`     | Tenant        |
| Mehdi Trabelsi  | `mehdi.trabelsi@email.tn`  | Owner         |
| Nour Hamdi      | `nour.hamdi@email.tn`      | Tenant        |
| Khaled Mansouri | `khaled.mansouri@email.tn` | Owner         |
| Fatma Gharbi    | `fatma.gharbi@email.tn`    | Tenant        |
| Slim Bouaziz    | `slim.bouaziz@email.tn`    | Hotel Manager |

> **Registration:** New users can sign up freely with any email and a 6+ character password. Choose Tenant, Owner, or Hotel Manager at registration.

---

## 🧭 Routing & Navigation

DarTounsi uses **hash-based client-side routing**. All URLs start with `#/`.

| Route             | Page                                             |  Auth Required   |
| ----------------- | ------------------------------------------------ | :--------------: |
| `#/`              | Home (hero + featured properties + testimonials) |        ❌        |
| `#/search`        | Property search with filters                     |        ❌        |
| `#/property/:id`  | Property detail page                             |        ❌        |
| `#/login`         | Login form                                       |        ❌        |
| `#/register`      | Registration form                                |        ❌        |
| `#/dashboard`     | User dashboard (tabbed)                          |        ✅        |
| `#/profile`       | Edit own profile                                 |        ✅        |
| `#/profile/:id`   | View other user's profile                        |        ❌        |
| `#/add-property`  | Create new listing                               | ✅ (Owner/Admin) |
| `#/messages`      | Conversation list                                |        ✅        |
| `#/messages/:id`  | Chat with specific user                          |        ✅        |
| `#/notifications` | Notification center                              |        ✅        |
| `#/favorites`     | Saved properties                                 |        ✅        |
| `#/matchmaking`   | Roommate preferences + matches                   |        ✅        |
| `#/admin`         | Admin panel                                      | ✅ (Admin only)  |
| `#/about`         | About page + team                                |        ❌        |
| `*`               | 404 — Page Not Found                             |        ❌        |

---

## 📝 License

University project — **Federated Scrum Project 2025–2026**

Built with 🧡 by the DarTounsi Scrum Team

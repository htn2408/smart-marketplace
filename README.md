# 🛠️ TaskMate - Smart Marketplace for Home Services & Skilled Taskers

<p align="center">
  <img src="https://img.shields.io/badge/Status-Live%20Demo-success?style=for-the-badge&logo=google-chrome&color=22c55e" alt="Live Demo" />
  <img src="https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue?style=for-the-badge&logo=github-actions" alt="CI/CD" />
  <img src="https://img.shields.io/badge/.NET-10.0-512BD4?style=for-the-badge&logo=dotnet" alt=".NET 10" />
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
</p>

> **TaskMate** is an on-demand gig-economy home services marketplace connecting clients with vetted, skilled taskers (plumbing, electrical repairs, home cleaning, carpentry, and more). Built with a containerized micro-service architecture, dual-database layer (MySQL + MongoDB), real-time WebSockets/SignalR messaging, and an intelligent tasker matching engine.

🌐 **Live Production Demo:** [https://taskmate-vn.duckdns.org](https://taskmate-vn.duckdns.org)

---

## 🌟 Key Features

### 👤 Customer Portal
- **Task Posting & Smart Search:** Post jobs categorized by trade, schedule, location, and estimated budget.
- **Dynamic Filtering & Recommendations:** Filter professionals by proximity, ratings, hourly rates, and real-time availability.
- **Intelligent Matching Algorithm:** Automated tasker recommendation scoring based on a weighted 60% rating / 40% experience formula with automated schedule overlap conflict checks.
- **Booking & Lifecycle Tracking:** End-to-end task state management (Pending -> Accepted -> In Progress -> Completed -> Cancelled).
- **Reviews & Ratings:** Transparent post-completion reviews with verified rating calculations.

### 🧰 Tasker Portal
- **Professional Profiles:** Showcase portfolio images, verified trade skills, hourly rates, and working history.
- **Tasker Dashboard:** Manage job requests, working calendar, schedule availability, and earnings.
- **Order Dispatch Management:** Flexible acceptance, rejection, and progress updates for client bookings.

### 💬 Real-Time Communication & UX
- **Real-Time Chat (SignalR + MongoDB):** Low-latency 1-on-1 instant messaging between clients and taskers; scalable, unstructured chat history persistence via MongoDB.
- **Mobile-First Responsive Design:** Optimized across all viewports (from 360px mobile devices to 4K displays).
- **Security & Identity:** Secure JWT authentication, BCrypt password hashing, and automated OTP password resets via Gmail SMTP.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (React 19 + Vite + Tailwind v4)"]
        UI["Customer & Tasker UI"]
        SignalRClient["SignalR Client (WebSockets)"]
    end

    subgraph Gateway ["Reverse Proxy & Web Server"]
        Nginx["Nginx (Let's Encrypt SSL / Ports 80, 443)"]
    end

    subgraph Backend [".NET 10 Web API Service"]
        API["RESTful Controllers (JWT Auth)"]
        Hub["SignalR Chat Hub"]
        MatchEngine["Matching & Scoring Engine"]
    end

    subgraph DataLayer ["Data Storage (Dual Databases)"]
        MySQL[("MySQL 8.0\n(Users, Tasks, Bookings, Reviews)")]
        MongoDB[("MongoDB 7.0\n(Conversations, Chat Messages)")]
        Cloudinary[("Cloudinary\n(Avatars, Job Attachments)")]
    end

    UI -->|HTTPS Request| Nginx
    SignalRClient -->|WSS Connection| Nginx
    Nginx -->|Proxy Pass| Backend
    API --> MySQL
    API --> MongoDB
    API --> Cloudinary
    Hub --> MongoDB
    MatchEngine --> MySQL
```

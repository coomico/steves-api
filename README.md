# STEVES API
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/coomico/steves-api/blob/main/LICENSE)

> ***The all-in-one event platform that'll make you ghost Google Forms forever*** 👻💔

Steves is the event management solution that finally lets your campus events pass the vibe check. No more tab-hoarding between Google Forms, spreadsheets, Drive, and Linktree. We've packed everything event organizers need into one streamlined system designed by students who were tired of doing things the hard way.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

## 🚀 Features

### Core Features *(Your Google workflow is shaking)*
- [x] User Management & Google OAuth
- [x] Event Creation & Management
- [x] Division Organization
- [x] Registration System *(Google Forms found deceased)*
- [x] Interview Scheduling and Blocking *(no more spreadsheet chaos)*
- [x] File Attachments *(Drive? never met them)*
- [x] Additional Links Management *(bye-bye Linktree)*
- [x] JWT Authentication
- [x] Cursor-based and Offset Pagination
- [x] File Uploads to Cloudflare R2 *(where your files aren't gaslit by Drive storage limits)*

### Coming Soon *(the sequel)*
- ⏳ Real-Time Interview Schedules
- ⏳ Notification System 
- ⏳ Frontend UI *(yes, this is just the API—wait till you see the glow up)*

## 🔧 Tech Stack

| Tech | Why It's Actually Superior? |
|------------|---------|
| TypeScript | No more "undefined is not a function" trauma |
| NestJS     | Backend framework that actually respects your mental health |
| TypeORM    | Database whisperer |
| PostgreSQL | Where your data thrives instead of just surviving |
| JWT        | Gatekeeping, but make it secure |
| Docker     | "Works on my machine" who? |
| Cloudflare R2 | Cloud storage that doesn't need a premium subscription |

## 📋 Prerequisites

- Docker
- Cloudflare R2 account *(using the Free-Tier because we're all on that student budget)* 💸

## 🚀 Installation

1. Clone this repo
   ```bash
   git clone https://github.com/coomico/steves-api.git
   cd steves-api
   ```

2. Create `.env` file with variables like those in `.env.example`

3. First-time deployment
   ```bash
   # Make sure NODE_ENV=development in docker-compose.yaml
   docker compose up -d
   ```

4. Set up Cloudflare R2
   - Log into your Cloudflare dashboard
   - Navigate to R2 Object Storage Overview
   - Click a bucket named `steves-public-bucket` and click "Settings"
   - Enable "Public access" under R2.dev subdomain.
   - Copy the `.r2.dev` URL that appears
   - Paste this URL in your `.env` file for the `R2_DEV_PUBLIC_BUCKET` variable

5. Level up to production mode
   ```bash
   # Stop containers
   docker compose down
   
   # Edit docker-compose.yaml to set NODE_ENV=production
   # (this is where we get serious)
   
   # Restart containers
   docker compose up -d
   ```

## 📚 Documentation

API documentation available at `/docs` when the application is running.

## 📝 License

[MIT License](https://github.com/coomico/steves-api/blob/main/LICENSE)
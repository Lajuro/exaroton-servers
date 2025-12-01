<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-orange?style=for-the-badge&logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/Lajuro/exaroton-servers?style=flat-square" alt="License" />
  <img src="https://img.shields.io/github/stars/Lajuro/exaroton-servers?style=flat-square" alt="Stars" />
  <img src="https://img.shields.io/github/issues/Lajuro/exaroton-servers?style=flat-square" alt="Issues" />
  <img src="https://img.shields.io/github/last-commit/Lajuro/exaroton-servers?style=flat-square" alt="Last Commit" />
</p>

<h1 align="center">🎮 Exaroton Servers Manager</h1>

<p align="center">
  <strong>A modern web application for managing Minecraft servers hosted on Exaroton</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-api-documentation">API</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## ✨ Features

### 🔐 Authentication & Security
- Google OAuth authentication via Firebase
- Role-based access control (Admin/User)
- Granular server access permissions
- Secure API key management

### 🎮 Server Management
- Real-time server status monitoring
- Start, stop, and restart servers
- View online players
- Server console access
- File management (upload/download)

### 📊 Dashboard
- Credits tracking and history
- Action logs with full audit trail
- Multi-language support (English & Portuguese)
- Dark/Light theme toggle
- PWA support for mobile devices

### 👥 User Management (Admin)
- Manage user permissions
- Grant/revoke server access
- Promote/demote administrators
- View activity history

## 🛠 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Backend** | Next.js API Routes |
| **Authentication** | Firebase Auth |
| **Database** | Cloud Firestore |
| **External API** | Exaroton API |
| **Deployment** | Vercel |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project
- Exaroton account with API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Lajuro/exaroton-servers.git
   cd exaroton-servers
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your credentials (see [Environment Variables](#environment-variables) below)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open http://localhost:3000**

### Environment Variables

Create a `.env` file with the following variables:

```env
# Firebase Configuration (from Firebase Console > Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (from Service Account JSON)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Exaroton API
EXAROTON_API_KEY=your_exaroton_api_key

# Optional: Cron Jobs
CRON_SECRET_KEY=your_secret_key_for_cron_jobs
```

### First Login Setup

1. Sign in with your Google account
2. Manually set yourself as admin in Firestore:
   - Go to Firebase Console > Firestore Database
   - Find your user document in the `users` collection
   - Set `isAdmin` field to `true`

## 📦 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Configure all environment variables
4. Deploy!

### Optional: Credit Snapshots Cron

Add to `vercel.json` for automatic credit tracking:

```json
{
  "crons": [{
    "path": "/api/credits/auto-snapshot",
    "schedule": "0 */6 * * *"
  }]
}
```

## 📖 API Documentation

See the full API documentation in [docs/API.md](docs/API.md).

### Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/servers` | GET | List all accessible servers |
| `/api/servers/[id]` | GET | Get server details |
| `/api/servers/[id]/start` | POST | Start a server |
| `/api/servers/[id]/stop` | POST | Stop a server |
| `/api/servers/[id]/restart` | POST | Restart a server |
| `/api/account` | GET | Get Exaroton account info |
| `/api/credits/history` | GET | Get credits history |
| `/api/users` | GET | List users (admin only) |
| `/api/history` | GET | Get action logs |

## 📁 Project Structure

```
exaroton-servers/
├── app/
│   ├── api/              # API routes
│   │   ├── servers/      # Server control endpoints
│   │   ├── users/        # User management endpoints
│   │   ├── credits/      # Credits tracking endpoints
│   │   ├── account/      # Exaroton account endpoint
│   │   └── history/      # Action logs endpoint
│   ├── dashboard/        # User dashboard
│   ├── admin/            # Admin panel
│   ├── servers/[id]/     # Server details page
│   └── login/            # Login page
├── components/           # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utilities and configurations
│   ├── firebase.ts       # Firebase client config
│   ├── firebase-admin.ts # Firebase Admin SDK
│   ├── exaroton.ts       # Exaroton API client
│   └── auth-context.tsx  # Auth context provider
├── types/                # TypeScript type definitions
├── messages/             # i18n translation files
├── docs/                 # Documentation
└── scripts/              # Admin utility scripts
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Exaroton](https://exaroton.com/) for the Minecraft server hosting platform and API
- [Firebase](https://firebase.google.com/) for authentication and database services
- [Vercel](https://vercel.com/) for hosting
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Lajuro">Roberto Camargo</a>
</p>

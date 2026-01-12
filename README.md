# CoupleConnect - LDR Gaming Platform

A Progressive Web App for long-distance couples to play turn-based games in real-time.

## Features

- 🔐 Google Sign-In authentication
- 👥 Partner connection system
- 🎮 4 turn-based games:
  - Tic Tac Toe
  - Connect 4
  - Dots & Boxes
  - Sea Battle (Battleship)
- 📊 Match history tracking
- ⚡ Real-time game synchronization with Firebase Firestore
- 📱 Mobile-first responsive design

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Firebase (Authentication & Firestore)
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore and Authentication enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ngedate
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Google Sign-In in Authentication
   - Create a Firestore database
   - Copy your Firebase config

4. Create `.env.local` file:
```bash
cp .env.example .env.local
```

5. Add your Firebase configuration to `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

6. Deploy Firestore security rules:
   - Copy the rules from `firestore.rules` to your Firebase Console
   - Or use Firebase CLI: `firebase deploy --only firestore:rules`

7. Run the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── (auth)/login/          # Login page
├── (dashboard)/
│   ├── dashboard/        # Game selection
│   ├── profile/          # User profile & partner management
│   └── game/[gameType]/  # Game room (dynamic route)
components/
├── layout/               # Navbar, ProtectedRoute
├── ui/                   # Reusable UI components
└── game/                 # Game-specific components
contexts/
└── AuthContext.tsx       # Global authentication state
hooks/
├── useGameLogic.ts       # Real-time game state management
└── useMatchHistory.ts    # Match history fetching
services/
├── firebase.ts           # Firebase configuration
├── auth.ts               # Authentication functions
└── db.ts                 # Firestore operations
utils/
├── gameRules.ts          # Game logic & win conditions
└── helpers.ts            # Utility functions
```

## Usage

1. **Sign In:** Use Google Sign-In to authenticate
2. **Connect Partner:** Go to Profile and enter your partner's email
3. **Start Game:** Choose a game from the Dashboard
4. **Play:** Take turns in real-time with your partner
5. **View History:** Check your match history in Profile

## Firebase Setup

### Authentication
- Enable Google Sign-In provider
- Add authorized domains if deploying

### Firestore
- Create collections: `users` and `matches`
- Deploy security rules from `firestore.rules`

## License

MIT

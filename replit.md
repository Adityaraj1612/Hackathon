# Sarthi - Predictive AI Safety Net

## Overview
Sarthi is a comprehensive safety platform that protects vulnerable communities through AI-powered predictions and real-time alerts. The system focuses on three key areas:
1. **Women Safety & Empowerment** - Government schemes and danger zone alerts
2. **Disaster Management** - Weather forecasting and risk mapping
3. **Farmer Support** - AI crop recommendations and agricultural intelligence

## Tech Stack
- **Frontend**: React + TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: Firebase Firestore (for user data and safety check-ins)
- **Authentication**: Firebase Auth with Google Sign-In
- **AI/ML**: OpenAI GPT-5 for risk analysis and predictions
- **Maps**: Leaflet for interactive danger zone mapping
- **Data Processing**: Papa Parse for CSV, custom PDF parsing

## Features

### Women Safety & Empowerment
- 150+ government schemes database (parsed from CSV)
- Advanced search and category filters
- Direct "Apply Now" links to official websites
- Interactive danger zone map with crime data overlay
- Real-time location tracking and alerts
- Emergency alert system with 30-second countdown
- Automatic SOS call trigger if user doesn't respond
- Safety check-in history stored in Firebase

### Disaster Management
- Real-time weather data integration
- 5-day forecast with visual cards
- Disaster risk zone mapping (floods, droughts, storms)
- AI-powered disaster prediction based on weather patterns
- Color-coded severity indicators (low/moderate/high/severe)
- Location-based risk alerts

### Farmer Support
- Punjab district-wise fertile land data
- AI-powered crop recommendations based on:
  - Soil type and fertility rating
  - 3-month weather predictions
  - Profitability analysis
- Crop disease detection (UI ready, integration pending)
- Market prices and expert consultation links

## Project Structure

```
├── client/                    # Frontend React app
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── HeroSlider.tsx
│   │   │   ├── DangerZoneMap.tsx
│   │   │   ├── EmergencyAlertModal.tsx
│   │   │   └── ui/          # Shadcn components
│   │   ├── pages/            # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── WomenSafety.tsx
│   │   │   ├── DisasterManagement.tsx
│   │   │   └── FarmersSupport.tsx
│   │   ├── contexts/         # React contexts
│   │   │   └── AuthContext.tsx
│   │   └── lib/              # Utilities
│   │       ├── firebase.ts
│   │       └── queryClient.ts
│   └── index.html
├── server/                    # Backend Express app
│   ├── lib/
│   │   ├── openai.ts         # OpenAI integration
│   │   ├── firebase-admin.ts # Firebase admin (commented)
│   │   └── data-parser.ts    # CSV/PDF parsing
│   └── routes.ts             # API endpoints
├── shared/
│   └── schema.ts             # Shared TypeScript types
├── attached_assets/          # Datasets
│   ├── updated_data[1]_1760544223833.csv  # Schemes data
│   └── Crimes_1760543832513.pdf           # Crime statistics
└── design_guidelines.md      # UI/UX design system
```

## API Endpoints

### Schemes
- `GET /api/schemes?search=&category=&level=` - Fetch government schemes with filters

### Safety & Crime Data
- `GET /api/crime-zones` - Fetch all danger zones with aggregated crime data and risk levels
- `GET /api/crime-data?search=` - Search crime data by state/district name
- `GET /api/state-crime/:state` - Get detailed crime breakdown for specific state
- `POST /api/analyze-location` - AI risk analysis for coordinates using GPT-5
- `POST /api/safety-checkin` - Save safety check-in to Firebase
- `GET /api/safety-history/:userId` - User's safety history from Firebase

### Weather & Disasters
- `GET /api/weather?location=` - Current weather and forecast
- `POST /api/predict-disaster` - AI disaster prediction

### Agriculture
- `GET /api/crop-recommendations?district=&state=` - AI crop recommendations
- `POST /api/analyze-crop-disease` - Crop disease detection (pending)

## Environment Variables

### Required Secrets
- `OPENAI_API_KEY` - OpenAI API key for AI predictions
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID (sarthi-e8175)
- `VITE_FIREBASE_APP_ID` - Firebase app ID

### Optional
- `GOOGLE_API_KEY` - Google Maps API (if needed)
- `SESSION_SECRET` - Express session secret

## Firebase Configuration
```javascript
{
  apiKey: "AIzaSyDnguObswpRQbeB_rZDS2MokRrmfyC6M9I",
  authDomain: "sarthi-e8175.firebaseapp.com",
  projectId: "sarthi-e8175",
  storageBucket: "sarthi-e8175.firebasestorage.app",
  messagingSenderId: "376286301971",
  appId: "1:376286301971:web:30efeae757a609612814e6",
  measurementId: "G-SL08KY3NYM"
}
```

## Design System
- **Primary Color**: Trust blue (220, 85%, 45%)
- **Emergency**: High-visibility red (0, 85%, 50%)
- **Safe**: Reassuring green (145, 65%, 45%)
- **Warning**: Amber (35, 90%, 50%)
- **Typography**: Inter font family
- **Dark Mode**: Supported with system preference detection

## Key Features Implementation

### Automated Emergency Alert System
**Complete Automation Flow:**
1. **Location Detection**: Continuous GPS tracking monitors user proximity to danger zones
2. **Browser Notification**: Automatic alert when entering high/critical risk areas
3. **Emergency Modal**: Opens with "You are in a Danger Zone. Are you Safe?"
4. **30-Second Countdown**: User has 30s to respond "I'm Safe" or "I Need Help"
5. **Emergency Siren**: If no response, plays Police.mp3 siren sound (looping)
6. **20-Second Auto-SOS**: After siren starts, 20s countdown to automatic SOS call
7. **Auto-SOS Call**: If still no response, automatically triggers emergency services contact

**User Control Points:**
- Click "I'm Safe" → Stops all escalation
- Click "Stop Alarm" → Stops siren and closes modal
- Manual "I Need Help" → Immediately triggers siren and auto-SOS countdown
- All timers reset properly for subsequent alerts

### AI Integration
- **Safety Risk Analysis**: GPT-5 analyzes location coordinates and provides risk assessment
- **Crop Recommendations**: AI suggests crops based on soil, weather, and profitability
- **Disaster Prediction**: Weather data analyzed for disaster risk forecasting

### Data Processing
- CSV schemes data parsed on server start (150+ schemes loaded)
- Crime data from PDF converted to structured format
- State coordinates mapped for map visualization
- Real-time data caching for performance

## Running the Application
```bash
npm run dev  # Starts both frontend (Vite) and backend (Express)
```

The app runs on a single port with Vite serving the frontend and proxying API requests to Express.

## Recent Changes (Oct 16, 2025)
- ✅ **Crime Data Integration**: Parsed comprehensive crime dataset (2001-2015+) with 7 crime types across all Indian states/districts
- ✅ **Women Safety Restructure**: Two-tab system with "Risk Area Zones" (state/district crime search) and "Government Schemes" (paginated, 10 per page)
- ✅ **Automated Location Tracking**: Continuous GPS monitoring with geolocation API to detect danger zone proximity
- ✅ **Complete Alert Automation**: Full escalation flow - location detection → browser notification → 30s countdown → emergency siren → 20s auto-SOS countdown → automatic SOS call
- ✅ **Enhanced Danger Map**: Real crime data visualization with color-coded risk levels (low/medium/high/critical) using Leaflet
- ✅ **Backend API**: Crime data endpoints for state/district queries, risk analysis, and location-based searches
- ✅ **Production Ready**: All TypeScript errors resolved, runtime bugs fixed, tested and verified by architect

## Future Enhancements
- [ ] Complete crop disease detection with image upload
- [ ] Expand farmer data beyond Punjab to all Indian states
- [ ] Real-time location tracking with background service
- [ ] Push notifications for danger zone alerts
- [ ] Historical crime data visualization and trends
- [ ] Multilingual support (Hindi, regional languages)
- [ ] Offline mode with cached data
- [ ] Admin dashboard for data management

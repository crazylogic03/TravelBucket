<![CDATA[# 🌍 YOLO — Your Travel Bucket List App

**YOLO** (You Only Live Once) is a feature-rich, AI-powered travel bucket list web application built with React. Plan your dream destinations, visualize them on an interactive map, track your travel progress, and get AI-generated recommendations — all in one beautiful interface.

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-06B6D4?logo=tailwindcss&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-10.16-FF0055?logo=framer&logoColor=white)

---

## ✨ Features

### 🗂️ Destination Management (Full CRUD)
- **Add destinations** with country, city, description, tags, and a personal "Why I want to visit" note
- **Edit / Update** any destination's details at any time
- **Delete destinations** with a confirmation prompt to prevent accidental removal
- **Mark as Visited / Not Visited** — toggle the visited status of any destination with a single click

### 🤖 AI-Powered Recommendations (Groq + LLaMA 3.3)
- **One-click AI Suggest** — enter just a city and country, then hit `✨ AI Suggest` to auto-fill:
  - A 2–3 line **description** of the destination
  - A compelling **"Why Visit"** reason
  - Relevant **tags** (e.g., beach, culture, food)
  - **Top places to visit** with their best time to visit
  - **Famous things** the destination is known for (food, culture, attractions)
- Powered by the **Groq API** using the **LLaMA 3.3 70B Versatile** model
- Structured JSON response format for reliable data extraction

### 🗺️ Interactive Map View (Leaflet + OpenStreetMap)
- **Full interactive world map** powered by Leaflet and OpenStreetMap tiles
- **Color-coded markers**:
  - 🔵 **Blue markers** for bucket list (unvisited) destinations
  - 🟢 **Green markers** for visited destinations
- **Click any marker** to open a detailed sidebar panel with full destination info
- **Fly-to animation** — selecting a destination from the list view smoothly animates the map to that location
- **Popup info** on marker click showing city, country, and visited status
- **Responsive layout** — map and detail sidebar adapt to desktop and mobile screens

### 📊 Progress Dashboard & Statistics
- **Total Destinations** — count of all saved bucket list items
- **Places Visited** — count of destinations marked as visited
- **Completion Percentage** — calculated progress toward visiting all saved destinations
- **Unique Countries** — count of distinct countries across all destinations
- **Animated progress bar** — gradient-colored bar (blue → green) that animates to show visited vs. remaining
- **Staggered entrance animations** — stats cards appear one by one for a polished feel

### 🖼️ Destination Images
- **Upload your own images** — supports local file upload with a drag-and-drop style area (max 5MB, image preview with remove button)
- **Fetch from Unsplash** — automatically search and fetch high-quality landscape photos from Unsplash based on the city/country name
- **Image preview** — see the selected image before saving, with the option to remove and re-select
- **Fallback image** — a beautiful default travel photo is used if no image is provided

### 🌦️ Live Weather Data (OpenWeatherMap)
- **Real-time weather** for each destination using the OpenWeatherMap API
- Displays:
  - **Temperature** in Celsius
  - **Weather condition** with icon (sunny, cloudy, rain, etc.)
  - **Humidity** percentage
- **Auto-refresh** — weather data refreshes every 30 minutes
- **Loading skeleton** — shows animated placeholder while data is being fetched
- Toggle weather visibility on each card with a "Show weather & time" button

### 🕐 Local Time Display
- **IST (Indian Standard Time)** clock displayed for each destination
- Shows current **time** (24-hour format) and **date** (day + month)
- **Auto-updates** every 60 seconds
- Loading skeleton while time initializes

### 📍 Auto-Geocoding (Nominatim / OpenStreetMap)
- **Automatic latitude/longitude lookup** — as you type a city and country, coordinates are fetched automatically from the Nominatim (OpenStreetMap) geocoding API
- **Debounced requests** — waits 800ms after typing stops to avoid excessive API calls
- Coordinates are pre-filled in the form but can be manually overridden
- **Validation** — latitude must be between -90 and 90, longitude between -180 and 180

### 🏷️ Tagging System
- Add **comma-separated tags** to categorize destinations (e.g., `beach, mountains, food, culture`)
- Tags are displayed as **styled pill badges** on destination cards and in the detail view
- Tags are parsed and stored as arrays for clean data handling

### 🎬 Animated Splash Screen
- **Full-screen splash screen** on app launch with:
  - Animated **flying plane** that loops across the screen
  - Animated **briefcase icon** with a spring entrance and "opening" effect
  - Glassmorphism **info card** introducing the app
  - **"Continue to use Present Version"** CTA button with arrow icon
- Built entirely with **Framer Motion** spring and keyframe animations
- Background blur effect on the main app content while splash is active

### 🧭 Navigation & View Switching
- **Sticky navbar** with glassmorphism (semi-transparent + backdrop blur) that adds a shadow on scroll
- Three navigation views accessible via a pill-style toggle:
  - **📋 List View** — grid of destination cards with progress stats
  - **🗺️ Map View** — interactive Leaflet map with markers
  - **➕ Add View** — form to add new destinations
- Animated **logo entrance** with rotation + fade-in effect
- Responsive layout — stacks vertically on mobile, horizontal on desktop

### 📱 Destination Cards
- **Image header** with gradient overlay showing city and country names
- **Visited badge** — green pill with checkmark icon for visited destinations
- **Options menu** (three-dot menu) with:
  - Toggle visited/not visited
  - Delete destination (with confirmation)
- **Auto-close** — options menu closes when clicking outside
- **Hover lift effect** — cards lift slightly on hover with enhanced shadow
- **Line-clamped description** — descriptions are truncated to 2 lines on cards
- **Expandable weather/time section** at the bottom of each card

### 📄 Destination Detail Panel
- Opens as a **sidebar** in map view when a marker or card is clicked
- Shows the full destination info:
  - Hero image with gradient overlay
  - Visited status with toggle button
  - All tags
  - Full description
  - "Why it's on my list" section
  - **Places & Best Time to Visit** — AI-generated list of top spots and when to go
  - **Famous For** — list of things the destination is known for
  - Live weather widget with icon
  - Local time widget
- **Slide-in animation** from the right
- Close button to dismiss the panel

### 💾 Persistent Local Storage
- All destinations are **saved to `localStorage`** automatically
- Data **persists across browser sessions** — no backend or database required
- Automatic load on app startup with error handling
- Efficient save — only writes to storage after the initial load completes

### 🎨 Design System & Theming
- **Custom color palette** with full shade scales (50–900):
  - **Primary** — Blue (`#4A90E2`) for main actions and branding
  - **Secondary** — Green (`#2ECC71`) for success/visited states
  - **Accent** — Warm Orange (`#FF9966`) for highlights and AI features
  - **Neutral** — Slate grays for text, backgrounds, and borders
- **Typography**:
  - **Inter** — body text (clean, modern sans-serif)
  - **Montserrat** — headlines and display text (bold, impactful)
  - Both loaded from Google Fonts
- **Custom shadows** — `card` and `card-hover` box shadows for consistent elevation
- **Custom animations** — `fade-in` and `slide-up` keyframe animations via Tailwind config
- **CSS custom properties** for primary colors in `index.css`

### ⚡ Smooth Animations (Framer Motion)
- **Page transitions** — fade-in when switching between views
- **Card entrance** — staggered slide-up animation in the destination grid
- **Splash screen** — complex multi-element choreographed animation sequence
- **Progress bar** — smooth width animation from 0 to completion percentage
- **Map fly-to** — Leaflet's built-in `flyTo` with 1.5s duration for smooth map transitions
- **Navbar logo** — rotate + fade entrance animation
- **Detail panel** — slide-in from right with opacity transition
- **Hover effects** — cards lift on hover via Framer Motion's `whileHover`

### ✅ Form Validation
- **Required fields** — Country and City are mandatory (with inline error messages)
- **Coordinate validation** — latitude (−90 to 90) and longitude (−180 to 180) range checks
- **Image size limit** — max 5MB for uploaded images
- **Real-time error clearing** — errors disappear as the user corrects the field
- **Loading states** — submit button shows "Saving..." during async operations

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS 3.3 + Custom CSS |
| **Animations** | Framer Motion 10 |
| **Maps** | Leaflet + React-Leaflet |
| **Icons** | React Icons (Ionicons 5 + Font Awesome) |
| **HTTP Client** | Axios |
| **Routing** | React Router DOM v7 |
| **AI / LLM** | Groq API (LLaMA 3.3 70B) |
| **Images** | Unsplash API |
| **Weather** | OpenWeatherMap API |
| **Geocoding** | Nominatim (OpenStreetMap) |
| **State Management** | React Context API + localStorage |
| **Linting** | ESLint 9 |
| **Fonts** | Google Fonts (Inter, Montserrat) |

---

## 📂 Project Structure

```
TravelBucket/
├── public/
│   └── vite.svg                    # Favicon
├── src/
│   ├── assets/
│   │   └── react.svg               # React logo asset
│   ├── components/
│   │   ├── AddDestinationForm.jsx   # Form to add destinations (with AI, Unsplash, geocoding)
│   │   ├── DestinationCard.jsx      # Individual card with image, tags, weather toggle
│   │   ├── DestinationDetail.jsx    # Full detail sidebar panel (map view)
│   │   ├── DestinationList.jsx      # Grid layout of all destination cards
│   │   ├── Footer.jsx               # Footer with copyright
│   │   ├── MapView.jsx              # Interactive Leaflet map with markers & sidebar
│   │   ├── Navbar.jsx               # Sticky nav with view toggle (List / Map / Add)
│   │   ├── ProgressStats.jsx        # Dashboard with stats cards + progress bar
│   │   ├── SplashScreen.jsx         # Animated splash with plane, briefcase, CTA
│   │   ├── TimeInfo.jsx             # IST time display widget
│   │   └── WeatherInfo.jsx          # Live weather widget (OpenWeatherMap)
│   ├── context/
│   │   └── AppContext.jsx           # Global state (destinations, CRUD, stats)
│   ├── utils/
│   │   ├── ai.js                    # Groq API integration (LLaMA 3.3 AI recommendations)
│   │   ├── geocode.js               # Nominatim geocoding (city → lat/lng)
│   │   └── unsplash.js              # Unsplash image search API
│   ├── App.jsx                      # Root component with view routing
│   ├── App.css                      # Legacy CSS styles
│   ├── index.css                    # Tailwind directives + CSS variables + global styles
│   └── main.jsx                     # App entry point with Context Provider
├── .env                             # Environment variables (VITE_GROQ_API_KEY)
├── .gitignore                       # Git ignore rules
├── eslint.config.js                 # ESLint configuration
├── index.html                       # HTML entry point with Leaflet CSS + Google Fonts
├── package.json                     # Dependencies and scripts
├── postcss.config.js                # PostCSS config (Tailwind + Autoprefixer)
├── tailwind.config.js               # Tailwind theme (colors, fonts, shadows, animations)
└── vite.config.js                   # Vite configuration with React plugin
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/crazylogic03/TravelBucket.git
   cd TravelBucket
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```
   > Get a free Groq API key at [console.groq.com](https://console.groq.com)

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   
   Navigate to `http://localhost:5173`

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server with HMR |
| `npm run build` | Build the production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check for code issues |

---

## 🔑 API Keys & Services

| Service | Purpose | How to Get |
|---|---|---|
| **Groq** | AI recommendations (LLaMA 3.3) | [console.groq.com](https://console.groq.com) — Free tier available |
| **Unsplash** | Destination photos | [unsplash.com/developers](https://unsplash.com/developers) — Free tier (50 req/hr) |
| **OpenWeatherMap** | Live weather data | [openweathermap.org/api](https://openweathermap.org/api) — Free tier available |
| **Nominatim** | Geocoding (city → coordinates) | No API key required (free, rate-limited) |

> **Note:** The Groq API key should be set in the `.env` file. The Unsplash and OpenWeatherMap keys are currently embedded in the source code for demo purposes.

---

## 🧩 Component Architecture

```
App
├── SplashScreen              # Animated intro overlay
├── Navbar                    # Sticky header with view toggle
├── ProgressStats             # Stats dashboard (List View)
├── DestinationList           # Card grid (List View)
│   └── DestinationCard       # Individual card
│       ├── WeatherInfo       # Live weather widget
│       └── TimeInfo          # IST time widget
├── MapView                   # Leaflet map (Map View)
│   └── DestinationDetail     # Sidebar detail panel
│       ├── WeatherInfo       # Live weather widget
│       └── TimeInfo          # IST time widget
├── AddDestinationForm        # Add form (Add View)
└── Footer                    # Copyright footer
```

**State Management:** All application state flows through `AppContext` (React Context API), which provides destinations data and CRUD operations to every component. Data is automatically persisted to `localStorage`.

---

## 📸 Screenshots

> _Add screenshots of your app here to showcase the UI._

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/crazylogic03/TravelBucket/issues).

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

© **Thrishul 2025**. All rights reserved.

---

## 🙏 Acknowledgements

- [React](https://react.dev/) — UI library
- [Vite](https://vitejs.dev/) — Build tool
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) — Animation library
- [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/) — Interactive maps
- [Groq](https://groq.com/) — Ultra-fast AI inference
- [Unsplash](https://unsplash.com/) — Beautiful free photos
- [OpenWeatherMap](https://openweathermap.org/) — Weather data API
- [OpenStreetMap](https://www.openstreetmap.org/) — Map tiles & geocoding
- [React Icons](https://react-icons.github.io/react-icons/) — Icon library
]]>

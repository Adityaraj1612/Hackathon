# Predictive AI Safety Net - Design Guidelines

## Design Approach

**System**: Material Design with emergency/safety-focused adaptations
**Rationale**: This is a critical safety application requiring immediate clarity, strong visual feedback, and accessibility during potential emergencies. Material Design's emphasis on clear hierarchy, responsive interaction, and structured layouts aligns perfectly with the life-saving nature of this platform.

**Key Principles**:
1. **Clarity Over Aesthetics** - Information must be instantly readable in stressful situations
2. **Action-Oriented Design** - Emergency buttons and critical actions prominently displayed
3. **Trust Through Consistency** - Government-grade reliability in visual presentation
4. **Mobile-First Emergency Access** - Optimized for phone use during real-time incidents

---

## Color Palette

### Light Mode
- **Primary**: 220 85% 45% (Trust blue - government/safety association)
- **Danger/Alert**: 0 85% 50% (High-visibility red for danger zones and emergency alerts)
- **Success/Safe**: 145 65% 45% (Reassuring green for safe status)
- **Warning**: 35 90% 50% (Amber for weather alerts and cautions)
- **Background**: 0 0% 98%
- **Surface**: 0 0% 100%
- **Text Primary**: 220 15% 20%
- **Text Secondary**: 220 10% 45%

### Dark Mode
- **Primary**: 220 75% 55%
- **Danger/Alert**: 0 80% 55%
- **Success/Safe**: 145 60% 50%
- **Warning**: 35 85% 55%
- **Background**: 220 15% 12%
- **Surface**: 220 12% 16%
- **Text Primary**: 0 0% 95%
- **Text Secondary**: 220 5% 70%

**Emergency Accent**: Use pulsing red (0 85% 50%) for active danger notifications

---

## Typography

**Font Stack**: 
- Primary: 'Inter', system-ui, sans-serif (via Google Fonts)
- Display: 'Inter', for headings with semibold/bold weights

**Scale**:
- Hero/Page Titles: text-4xl md:text-5xl font-bold
- Section Headers: text-2xl md:text-3xl font-semibold
- Card Titles: text-lg font-semibold
- Body Text: text-base leading-relaxed
- Captions/Labels: text-sm text-secondary
- Emergency Alerts: text-xl md:text-2xl font-bold (high visibility)

**Critical Text Treatment**: Emergency alerts and danger notifications use increased letter-spacing (tracking-wide) for maximum legibility under stress

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 3, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: py-12 to py-16
- Card gaps: gap-4 to gap-6
- Emergency elements: Generous touch targets (min 44px/h-11)

**Grid System**:
- Container: max-w-7xl mx-auto px-4
- Two-column layouts: grid-cols-1 lg:grid-cols-2 gap-6
- Three-column cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
- Map sections: Full-width with overlaying controls

**Mobile-First Breakpoints**: Stack all columns on mobile, expand strategically at md: and lg:

---

## Component Library

### Navigation
- **Top Navigation Bar**: Sticky header with app logo, user profile, and emergency SOS button (always visible, red accent)
- **Section Tabs**: Large, touch-friendly tabs for Women Safety, Disaster Management, Farmers (active state with bold underline)
- **Breadcrumbs**: For nested pages within sections

### Hero Slider (Homepage)
- **Full-width carousel**: h-64 md:h-80 with government scheme visuals, alert banners, danger notifications
- **Auto-rotation**: 5-second intervals with manual controls
- **Overlay Text**: Semi-transparent dark overlay (bg-black/40) with white text for readability
- **CTA Buttons**: variant="default" with blur backdrop for contrast

### Cards

**Government Scheme Cards**:
- White/surface background with subtle border
- Scheme title (font-semibold text-lg)
- Eligibility bullet points (text-sm)
- "Apply Now" button (variant="default", primary color) with external link icon
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

**Weather/Disaster Cards**:
- Icon + temperature/condition (large display)
- Risk level indicator (color-coded badge: green/amber/red)
- Forecast details in compact list

**Crop Recommendation Cards**:
- District name header
- Fertility rating (visual bar or stars)
- Recommended crops (comma-separated tags)
- Profitability indicator

### Maps
- **Danger Zone Map** (Women Safety): Interactive map with red overlay polygons for high-crime areas, current user location marker (blue dot with pulsing ring)
- **Disaster Risk Map**: Color-coded zones (green/yellow/orange/red) for flood/storm/drought risk
- **Zoom/Pan Controls**: Bottom-right corner, semi-transparent background
- **Legend**: Top-right corner explaining color codes

### Alerts & Notifications

**Danger Zone Alert Modal**:
- Full-screen overlay (bg-black/80)
- Center card with red border and pulsing animation
- Large heading: "⚠️ You are in a Danger Zone"
- Subtext: "Are you safe?"
- Two large buttons: "I'm Safe" (green) and "I Need Help" (red)
- 30-second countdown timer (text-3xl font-mono)
- Auto-trigger emergency alarm if no response

**Emergency Alarm UI**:
- Red screen flash animation
- Sound wave visualization
- "EMERGENCY ALARM ACTIVE" text
- "Stop Alarm" button (large, centered)
- Auto-SOS call trigger countdown

### Forms
- **Authentication**: Clean login/signup forms with Firebase logo, email/password fields, social login options
- **Profile Setup**: Multi-step form with location permission request (clear explanation of why it's needed)
- **Input Fields**: Rounded corners (rounded-md), clear labels above, error states in red with helper text

### Buttons
- **Primary Actions**: variant="default" with primary color
- **Emergency/SOS**: Red background, large size (h-12), always visible in header
- **Secondary Actions**: variant="outline"
- **Disabled State**: Crop disease detection button (muted with "Coming Soon" tooltip)

### Data Display
- **Statistics**: Large numbers with labels (e.g., "2,450 Schemes Available")
- **Lists**: Structured with alternating row backgrounds for long datasets
- **Tags**: Rounded pill-shaped badges for categories, districts, crop types

---

## Images

**Hero Slider Images** (Homepage):
1. Government schemes awareness graphic (women empowerment, education focus)
2. Disaster preparedness visualization (weather icons, emergency services)
3. Agricultural productivity scene (farmers, green fields, technology)

**Section Headers**: 
- Women Safety: Illustration of diverse women in safe environment
- Disaster Management: Weather satellite/emergency response imagery
- Farmers: Crop fields, technology in agriculture

**Empty States**: Simple illustrations (not photos) for "No schemes found" or "No alerts" states

---

## Animations

**Minimal & Purposeful Only**:
- Hero slider transitions: Smooth fade (duration-500)
- Danger zone pulse: Subtle ring animation on map marker
- Emergency alert: Attention-grabbing red flash (use sparingly)
- Button interactions: Built-in hover/active states only
- Loading states: Simple spinner for data fetching

**NO decorative scroll effects, parallax, or unnecessary motion** - this is a utility application

---

## Accessibility

- High contrast ratios (WCAG AAA for emergency text)
- Keyboard navigation for all interactive elements
- Screen reader labels for map regions and alerts
- Focus indicators (ring-2 ring-primary)
- Touch targets minimum 44px height
- Color is never the only indicator (use icons + text)
- Dark mode respects system preferences but optimized for nighttime emergency use

---

## Section-Specific Design

**Women Safety**:
- Dual-pane layout: Schemes grid (left) + Risk map (right) on desktop
- Filter/search bar for schemes (by state, category)
- Map legend clearly explains red zones

**Disaster Management**:
- Current weather widget (prominent, top of section)
- Toggle between "Current Forecast" and "Risk Mapping" views
- Risk zones displayed with severity gradient

**Farmers Section**:
- District selector (dropdown or map-based)
- Crop cards with visual icons (wheat, rice, etc.)
- "Crop Disease Detection" button disabled with subtle note: "Feature coming soon"
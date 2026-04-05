# 🌿 Symptom Journal

**Track. Reflect. Understand.**  
Your personal companion for logging symptoms, moods, triggers, and wellness patterns.

![App Banner](https://via.placeholder.com/1200x400/4f46e5/ffffff?text=Symptom+Journal)

## ✨ Why Symptom Journal?

Managing symptoms, moods, energy, and triggers can feel chaotic. Symptom Journal gives you a clean, private space to log everything and uncover meaningful patterns over time.

Perfect for chronic conditions, mental health tracking, allergies, medication side effects, or simply gaining more control over your well-being.

## 🚀 Features

- **📝 Quick & Intuitive Logging** — Symptoms with severity sliders, notes, and custom tags
- **🌡️ Mood & Energy Tracking** — Simple daily check-ins
- **🔍 Beautiful Insights** — Charts and trends powered by Victory Native
- **🏷️ Trigger & Pattern Discovery** — Tag food, sleep, stress, weather, medication, etc.
- **📄 Professional Reports** — Print or share PDF reports easily (`expo-print` + `expo-sharing`)
- **🔔 Smart Reminders** — Custom push notifications to build consistency
- **🔒 Privacy & Sync** — Local secure storage + optional Supabase backend sync
- **🌗 Dark / Light Mode** — Clean and calming interface

## 📸 Screenshots

*(Add your screenshots here once ready)*

## 🛠️ Tech Stack

- **Framework**: [Expo SDK 54](https://expo.dev) (Managed Workflow)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI/Navigation**: React Navigation (Native Stack + Bottom Tabs)
- **State & Storage**:
  - Local: `@react-native-async-storage/async-storage` + `expo-secure-store`
  - Backend: [Supabase](https://supabase.com) (`@supabase/supabase-js`)
- **Data Visualization**: [Victory Native](https://formidable.com/open-source/victory/)
- **Utilities**:
  - Notifications: `expo-notifications`
  - Printing & Sharing: `expo-print` + `expo-sharing`
  - Device Info: `expo-device`
- **Core**: React 19 + React Native 0.81

## 🏃‍♂️ Getting Started

```bash
# Clone the repo
git clone https://github.com/yourusername/symptom-journal.git
cd symptom-journal

# Install dependencies
npm install

# Start the app
npx expo start

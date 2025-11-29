# Gesture-Controlled Car Dashboard

A **gesture-based car interface** with smooth, high-end UI for **music, climate, and phone controls**.  
Implemented with **Python backend** (gesture recognition) and **HTML/CSS/JS frontend** (dashboard UI).

---

## Features

### Music
- Play / Pause
- Next / Previous Track
- Volume Up / Down

### Climate (Simulated)
- Fan Speed
- Temperature

### Phone (Simulated)
- Attend / Reject Call
- Swipe to navigate contacts
- Make / Cut Call

---

## Gesture Mapping

| Gesture | Action |
|---------|--------|
| Swipe Left / Right | Music: Next / Previous Track, Phone: Navigate |
| Rotate Hand CW / CCW | Music: Volume Up / Down, Climate: Fan Speed |
| Open Palm | Attend Call, Turn Fan On |
| Close Fist | End Call, Turn Fan Off |
| Swipe Up / Down | Temperature Up / Down |

---

## Tech Stack

- **Frontend:** HTML, CSS, JS  
- **Animations:** GSAP / CSS Transitions  
- **Backend:** Python, Mediapipe Hands, OpenCV  
- **Communication:** WebSocket (Python → Frontend)  
- **Music Playback:** macOS Media API / Spotify API  
- **Hardware:** MacBook, Webcam / Leap Motion, Car Bluetooth

---

## Architecture

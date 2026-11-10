# 🌱 SmartAbility

**SmartAbility** is an interactive, gamified web application designed to help children (especially those with special needs or undergoing therapy) learn and grow through positive reinforcement. Built with modern web technologies, it features a beautiful, accessible interface where children cultivate their own virtual "Gardens" by completing tasks, unlocking stages, and earning interactive rewards.

## ✨ Features

- 🌻 **Virtual Gardens**: Each child gets their own "Garden" that grows through stages (Seed ➡️ Sprout ➡️ Sapling ➡️ Tree ➡️ Butterfly ➡️ Full Garden) as they progress.
- 📸 **AI-Powered Webcam Scanner**: Integrates with MediaPipe and TensorFlow.js to recognize hand gestures or written numbers (1-5) through the device camera, allowing for interactive, physical learning and reward unlocking.
- 🎁 **Tiered Interactive Rewards**:
  - **Level 1**: 🎟️ Stamp Video (Fun animal/fantasy videos)
  - **Level 2**: 🎈 Balloon Burst (Interactive balloons with musical chimes)
  - **Level 3**: 🐾 Character Friend (Special character animations)
  - **Level 4**: 📜 Rhyme Time (Happy rhymes and cheers)
  - **Level 5**: 🎂 Slice the Cake (Interactive cake slicing)
- 🌟 **Sticker Sheet & Badges**: Tracks achievements and displays earned rewards in a fun gallery.
- 👨‍👩‍👧 **Parent/Therapist Portal**: Secure Firebase authentication allows parents or therapists to manage children, track progress, and manually advance garden stages.
- 🎨 **Beautiful UI**: Built with TailwindCSS and Framer Motion, featuring floating animated backgrounds, playful typography (Baloo 2 & Fredoka), and a soothing, nature-inspired color palette.

## 🛠️ Tech Stack

- **Frontend Framework**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS, Framer Motion
- **Backend & Auth**: Firebase (Firestore & Authentication)
- **Machine Learning**: `@mediapipe/tasks-vision`, `@tensorflow/tfjs`, `@teachablemachine/image`
- **Routing**: React Router DOM
- **Code Quality**: Oxlint, TypeScript

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Firebase project

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd smart_project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a `.env` file in the root directory.
   - Add your Firebase configuration variables (e.g., `VITE_FIREBASE_API_KEY`, etc.).

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`.

## 📦 Scripts

- `npm run dev`: Starts the local development server.
- `npm run build`: Compiles TypeScript and builds the app for production.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Runs Oxlint for code quality checks.

## 📄 License

This project is licensed under the MIT License.

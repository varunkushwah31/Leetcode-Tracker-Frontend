# MentorSync Dev Container Guide (macOS & Cross-Platform)

Welcome! This Dev Container provides an instant, zero-configuration development environment tailored for **macOS (Apple Silicon M1/M2/M3/M4 & Intel)** as well as Linux and Windows.

When opened in VS Code, it automatically configures:
- **Java 21 LTS** with Apache Maven
- **Node.js 22 LTS** & npm
- **MongoDB 7** running on port `27017`
- **Redis** running on port `6379`
- Pre-installed VS Code extensions for Java, Spring Boot, React, Tailwind CSS, ESLint, and Prettier
- Automatic port forwarding for frontend (`5173`) and backend (`8080`)

---

## First-Time Mac Setup (Prerequisites)

If this is your first time developing on a Mac, follow these quick steps:

### 1. Install Docker on macOS
Install either:
- **[Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)** (Choose the "Apple Silicon" download for M1/M2/M3/M4 chips, or "Intel" for Intel Macs).
  - Open Docker Desktop from Applications.
  - Complete the initial setup and verify it is running (whale icon in the Mac top menu bar).
  - *(Optional recommendation)*: Under Docker Settings > **General**, ensure **VirtioFS** is selected for ultra-fast file system sharing.
- **[OrbStack](https://orbstack.dev/)** (A very lightweight and fast Docker alternative for macOS).

### 2. Install Visual Studio Code
Download and install **[VS Code for Mac](https://code.visualstudio.com/)**.

### 3. Install the Dev Containers Extension
In VS Code:
1. Open the Extensions sidebar (`Cmd + Shift + X`).
2. Search for **Dev Containers** (`ms-vscode-remote.remote-containers`).
3. Click **Install**.

---

## Getting Started

### 1. Open the Project in VS Code
Open your terminal on Mac (`Terminal` or `iTerm2`) and clone the repository:
```bash
git clone https://github.com/varunkushwah31/Leetcode-Tracker-Frontend.git
cd Leetcode-Tracker-Frontend
code .
```

### 2. Reopen in Container
When VS Code opens the folder, a popup notification will appear in the bottom-right corner:
> **Folder contains a Dev Container configuration file. Reopen to develop in a container?**

Click **Reopen in Container**.

*(If you don't see the popup, press `Cmd + Shift + P`, type `Dev Containers: Reopen in Container`, and press `Enter`.)*

VS Code will now build the container, start MongoDB and Redis, install dependencies, and attach your workspace. The first build takes a couple of minutes; subsequent starts take only seconds.

---

## Running the Application Inside the Dev Container

Once VS Code connects, open an integrated terminal (`Ctrl + ` `~` or menu `Terminal -> New Terminal`).

### Option A: Using VS Code Tasks (Easiest)
1. Press `Cmd + Shift + P`.
2. Type `Tasks: Run Task`.
3. Select **Start Full Stack (Backend + Frontend)**.
   *(Or individually select **Start Backend (Spring Boot)** or **Start Frontend (Vite React)**).*

### Option B: Using the Terminal

#### Start the Spring Boot Backend (Port 8080):
```bash
cd Backend
./mvnw spring-boot:run
```
Backend will connect to MongoDB (`mongodb:27017`) and Redis (`redis:6379`) automatically.

#### Start the React Frontend (Port 5173):
In a second terminal tab (`Cmd + Shift + 5` or click `+`):
```bash
cd Frontend
npm run dev
```

---

## Accessing Services from your Mac Browser

Open your favorite Mac browser (Chrome, Safari, Arc, Firefox):

| Service | Host URL | Description |
|---|---|---|
| **Frontend** | `http://localhost:5173` | React 19 + Vite app with HMR |
| **Backend API** | `http://localhost:8080` | Spring Boot REST API |
| **MongoDB** | `mongodb://localhost:27017` | Connect via MongoDB Compass or Studio 3T |
| **Redis** | `redis://localhost:6379` | Connect via Redis Insight or redis-cli |

---

## Handy Mac Tips for Windows Switchers

- **Command Key**: Use `Cmd` instead of `Ctrl` for most VS Code shortcuts:
  - `Cmd + P`: Quick file search
  - `Cmd + Shift + P`: Command palette
  - `Cmd + Shift + F`: Global search
  - `Cmd + /`: Toggle line comment
- **Terminal Hotkey**: `Ctrl + ` `~` toggles the integrated terminal.
- **Stopping Containers**: When you close VS Code, the dev container services automatically pause. You can also run `Cmd + Shift + P` -> `Dev Containers: Reopen Folder Locally`.
- **Rebuilding Container**: If you ever update dependencies or Dockerfile settings, run `Cmd + Shift + P` -> `Dev Containers: Rebuild Container`.

# 2D Multiplayer Game

This is a 2D multiplayer game.

## Testing the workflow.

## Good Design

This project aims for a clean and modular design, separating concerns to ensure maintainability and scalability. Key design principles include:
- **Client-Server Architecture:** Clear distinction between client-side (public/) and server-side (server.js, gameLogic.js) logic for robust multiplayer functionality.
- **Modular JavaScript:** Code is organized into distinct modules (e.g., `assetLoader.js`, `rendering.js`, `network.js`, `input.js`) to promote reusability and easier debugging.
- **Asset Management:** Centralized asset loading ensures efficient management of game resources.
- **Event-Driven Communication:** Utilizes Socket.IO for real-time, event-driven communication between clients and the server, enabling responsive gameplay.

## How to Run the Project

To get this project up and running on your local machine, follow these steps:

### Prerequisites

Ensure you have Node.js and npm (Node Package Manager) installed. You can download them from [nodejs.org](https://nodejs.org/).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd "2D Multiplayer Game"
    ```
    (Replace `<repository_url>` with the actual URL of your Git repository.)

2.  **Install dependencies:**
    Navigate to the project's root directory and install the required Node.js packages:
    ```bash
    npm install
    ```

### Running the Game

1.  **Start the server:**
    From the project's root directory, run the server using Nodemon (for automatic restarts on file changes during development) or Node:
    ```bash
    npm start
    # or
    node server.js
    ```
    The server will typically run on `http://localhost:3000` (or another port if configured).

2.  **Open the client in your browser:**
    Open your web browser and navigate to `http://localhost:3000`. You can open multiple tabs or browser windows to simulate multiple players.

### Running Tests

To run the unit tests for the project, use the following command:
```bash
npm test
```
This will execute all tests defined in the `__tests__/` directory.

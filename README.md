# SocketTalk-SimIPA

SocketTalk-SimIPA is a web-based chat application developed as part of a simulated thesis (IPA 2025 CH-AG). It supports global chats, private direct messages, user authentication, and message storage in a SQLite database. The application is built using Node.js, Express, and Socket.IO.

## Features

- **Global Chat**: Users can participate in a public chat room.
- **Private Messaging**: Direct messaging between users with chat previews.
- **User Authentication**: Secure login and registration using bcrypt and JWT.
- **Message Storage**: All messages are stored in a SQLite database.
- **Responsive UI**: A user-friendly interface with dynamic elements.
- **WebSocket Communication**: Real-time updates using Socket.IO.

## Technologies Used

- **Backend**:
  - Node.js
  - Express
  - SQLite
  - Socket.IO
  - bcrypt for password hashing
  - JSON Web Tokens (JWT) for authentication
- **Frontend**:
  - HTML, CSS, JavaScript
  - Socket.IO Client
- **Testing**:
  - Jest for unit and integration tests

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/SocketTalk-SimIPA.git
   cd SocketTalk-SimIPA
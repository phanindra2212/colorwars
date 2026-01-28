# Chain Reaction - Multiplayer Browser Game

A real-time multiplayer browser game where players place colored dots on a grid board. When cells reach their maximum capacity, they explode and distribute dots to neighboring cells, creating chain reactions. The last player with dots on the board wins!

## Features

- **Real-time Multiplayer**: Support for 2-10 players per room
- **Chain Reaction Gameplay**: Strategic dot placement with explosive chain reactions
- **Text Chat**: In-game chat for all players
- **Voice Chat**: WebRTC-based voice communication
- **Spectator Mode**: Watch games in progress
- **Responsive Design**: Works on desktop and mobile devices
- **Smooth Animations**: Beautiful explosion effects and transitions

## Game Rules

1. **Board Setup**: Configurable grid (default 6x10)
2. **Cell Capacity**: 
   - Corner cells: 2 dots
   - Edge cells: 3 dots  
   - Other cells: 4 dots
3. **Gameplay**: Players take turns placing dots on empty cells they own
4. **Explosions**: When a cell reaches max capacity, it explodes and distributes dots to neighbors
5. **Chain Reactions**: Explosions can trigger neighboring cells to explode
6. **Winning**: Last player with dots on the board wins

## Tech Stack

### Backend
- **Node.js** with Express
- **Socket.IO** for real-time communication
- **In-memory** room management

### Frontend  
- **React** with functional components and hooks
- **Socket.IO Client** for real-time updates
- **Styled Components** for styling
- **WebRTC** for peer-to-peer voice chat

## Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd multiplayer-chain-game
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Start development servers**
```bash
npm run dev
```

4. **Open your browser**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Project Structure

```
multiplayer-chain-game/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── styles/         # CSS styles
│   │   └── App.js          # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── game/              # Game logic modules
│   │   ├── Board.js       # Board management
│   │   ├── GameRoom.js    # Room logic
│   │   ├── GameManager.js # Room management
│   │   └── Player.js      # Player class
│   └── index.js           # Server entry point
├── package.json           # Root package.json
└── README.md
```

## API Documentation

### Socket.IO Events

#### Client → Server

- `join_room`: Join or create a room
  ```javascript
  socket.emit('join_room', {
    roomId: 'ABC123',
    username: 'PlayerName',
    isSpectator: false
  });
  ```

- `start_game`: Start the game (host only)
  ```javascript
  socket.emit('start_game', { roomId: 'ABC123' });
  ```

- `place_dot`: Place a dot on the board
  ```javascript
  socket.emit('place_dot', {
    roomId: 'ABC123',
    row: 2,
    col: 3
  });
  ```

- `chat_message`: Send a chat message
  ```javascript
  socket.emit('chat_message', {
    roomId: 'ABC123',
    message: 'Hello everyone!'
  });
  ```

- `voice_signal`: WebRTC signaling for voice chat
  ```javascript
  socket.emit('voice_signal', {
    roomId: 'ABC123',
    signal: rtcSignal,
    targetSocketId: 'socketId'
  });
  ```

#### Server → Client

- `room_joined`: Successfully joined a room
- `player_joined`: New player joined
- `player_left`: Player left the room
- `game_started`: Game has started
- `game_update`: Board state updated
- `game_over`: Game finished with winner
- `chat_message`: New chat message
- `voice_signal`: WebRTC signaling
- `error`: Error occurred

### REST API

- `GET /api/rooms`: List all active rooms
- `GET /api/room/:roomId`: Get room details

## Deployment to Render

### Prerequisites
- Render account (free tier available)
- GitHub repository with the code

### Step 1: Prepare for Production

1. **Update package.json scripts**
```json
{
  "scripts": {
    "start": "node server/index.js",
    "build": "cd client && npm run build"
  }
}
```

2. **Set environment variables**
```bash
# In Render dashboard
NODE_ENV=production
PORT=3001
```

### Step 2: Deploy to Render

1. **Connect GitHub repository** to Render
2. **Create Web Service** with these settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Runtime**: Node 18+
   - **Root Directory**: `/` (project root)

3. **Configure CORS** in `server/index.js`:
```javascript
const cors = {
  origin: ['https://your-app.onrender.com'],
  methods: ['GET', 'POST']
};
```

### Step 3: Update Frontend

1. **Set production server URL** in client environment:
```javascript
// client/src/contexts/SocketContext.js
const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001');
```

2. **Add environment variable** in Render:
```
REACT_APP_SERVER_URL=https://your-app.onrender.com
```

### Step 4: Test Deployment

1. **Visit your app**: `https://your-app.onrender.com`
2. **Test multiplayer**: Open multiple tabs to verify real-time functionality
3. **Check console** for any connection errors

## Configuration Options

### Board Configuration
```javascript
// In server/game/GameRoom.js
const boardConfig = { rows: 6, cols: 10 }; // Default
// Can be customized: { rows: 10, cols: 10 }, { rows: 9, cols: 6 }, etc.
```

### Player Limits
- **Maximum players**: 10 per room
- **Minimum players**: 2 to start game
- **Spectators**: Unlimited

### Voice Chat
- Uses WebRTC with STUN servers
- Peer-to-peer audio streaming
- No server-side audio processing required

## Security Considerations

1. **Input Validation**: All user inputs are validated server-side
2. **Rate Limiting**: Consider implementing rate limiting for chat messages
3. **Room Access**: Room IDs are 6-character alphanumeric strings
4. **CORS**: Configured for production domains
5. **No Persistent Data**: All game state is in-memory

## Performance Optimization

1. **Socket.IO**: Uses WebSocket transport with fallback
2. **React**: Functional components with hooks for optimal rendering
3. **CSS**: Hardware-accelerated animations
4. **WebRTC**: Direct peer-to-peer connections for voice chat

## Troubleshooting

### Common Issues

1. **Socket Connection Issues**
   - Check if server is running
   - Verify CORS configuration
   - Check firewall settings

2. **Voice Chat Not Working**
   - Ensure HTTPS (required for WebRTC)
   - Check microphone permissions
   - Verify STUN server connectivity

3. **Game State Sync Issues**
   - Check Socket.IO event handling
   - Verify turn management logic
   - Check for race conditions

### Debug Mode

Enable debug logging:
```javascript
// Client side
localStorage.setItem('debug', 'socket.io-client:*');

// Server side  
DEBUG=socket.io:* npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this code for your own projects!

## Support

If you encounter issues or have questions:
1. Check the troubleshooting section
2. Review the console logs
3. Open an issue on GitHub

Enjoy playing Chain Reaction! 🎮
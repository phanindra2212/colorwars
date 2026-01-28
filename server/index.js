const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { GameRoom } = require('./game/GameRoom');
const { GameManager } = require('./game/GameManager');

const app = express();
const server = http.createServer(app);

// CORS configuration
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-app.onrender.com'] 
      : ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Game state management
const gameManager = new GameManager();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create or join a room
  socket.on('join_room', (data) => {
    const { roomId, username, isSpectator = false } = data;
    
    if (!roomId || !username) {
      socket.emit('error', { message: 'Room ID and username are required' });
      return;
    }

    // Get or create room
    let room = gameManager.getRoom(roomId);
    if (!room) {
      room = gameManager.createRoom(roomId);
    }

    // Check if room is full (for players, not spectators)
    if (!isSpectator && room.players.length >= 10) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    // Join the room
    socket.join(roomId);
    
    // Add player to room
    const player = room.addPlayer(socket.id, username, isSpectator);
    
    // Send current room state to the player
    socket.emit('room_joined', {
      roomId: room.id,
      players: room.players,
      gameState: room.gameState,
      isSpectator: player.isSpectator,
      currentPlayerIndex: room.currentPlayerIndex,
      board: room.board,
      winner: room.winner
    });

    // Notify all players in the room about the new player
    io.to(roomId).emit('player_joined', {
      players: room.players,
      currentPlayerIndex: room.currentPlayerIndex
    });

    console.log(`User ${username} joined room ${roomId}`);
  });

  // Start the game
  socket.on('start_game', (data) => {
    const { roomId } = data;
    const room = gameManager.getRoom(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Check if there are enough players (minimum 2)
    const activePlayers = room.players.filter(p => !p.isSpectator);
    if (activePlayers.length < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }

    // Start the game
    room.startGame();
    
    // Notify all players
    io.to(roomId).emit('game_started', {
      gameState: room.gameState,
      board: room.board,
      currentPlayerIndex: room.currentPlayerIndex,
      players: room.players
    });

    console.log(`Game started in room ${roomId}`);
  });

  // Place a dot on the board
  socket.on('place_dot', (data) => {
    const { roomId, row, col } = data;
    const room = gameManager.getRoom(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Check if it's the player's turn
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.isSpectator) {
      socket.emit('error', { message: 'Spectators cannot place dots' });
      return;
    }

    if (room.currentPlayerIndex !== room.players.indexOf(player)) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    // Try to place the dot
    const result = room.placeDot(row, col, player.id);
    
    if (!result.success) {
      socket.emit('error', { message: result.message });
      return;
    }

    // Process any explosions
    const explosions = room.processExplosions();
    
    // Check for eliminated players
    const eliminatedPlayers = room.checkEliminatedPlayers();
    
    // Check for winner
    const winner = room.checkWinner();
    
    // Move to next turn
    room.nextTurn();

    // Send game state update to all players
    io.to(roomId).emit('game_update', {
      board: room.board,
      currentPlayerIndex: room.currentPlayerIndex,
      players: room.players,
      explosions: explosions,
      eliminatedPlayers: eliminatedPlayers,
      winner: winner
    });

    // If game is over, notify all players
    if (winner) {
      io.to(roomId).emit('game_over', {
        winner: winner,
        players: room.players
      });
    }
  });

  // Chat message
  socket.on('chat_message', (data) => {
    const { roomId, message } = data;
    const room = gameManager.getRoom(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) {
      socket.emit('error', { message: 'Player not found in room' });
      return;
    }

    // Broadcast message to all players in the room
    io.to(roomId).emit('chat_message', {
      username: player.username,
      message: message,
      timestamp: new Date().toISOString()
    });
  });

  // WebRTC signaling for voice chat
  socket.on('voice_signal', (data) => {
    const { roomId, signal, targetSocketId } = data;
    
    // Relay the signal to the target user
    io.to(targetSocketId).emit('voice_signal', {
      signal: signal,
      fromSocketId: socket.id
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find and remove player from all rooms
    gameManager.rooms.forEach(room => {
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        
        // Notify remaining players
        io.to(room.id).emit('player_left', {
          players: room.players,
          currentPlayerIndex: room.currentPlayerIndex
        });

        // If game was in progress and this was an active player, check for winner
        if (room.gameState === 'playing' && !player.isSpectator) {
          const winner = room.checkWinner();
          if (winner) {
            io.to(room.id).emit('game_over', {
              winner: winner,
              players: room.players
            });
          }
        }

        // Remove room if empty
        if (room.players.length === 0) {
          gameManager.removeRoom(room.id);
        }
      }
    });
  });
});

// API Routes
app.get('/api/rooms', (req, res) => {
  const rooms = gameManager.rooms.map(room => ({
    id: room.id,
    playerCount: room.players.filter(p => !p.isSpectator).length,
    spectatorCount: room.players.filter(p => p.isSpectator).length,
    gameState: room.gameState
  }));
  res.json(rooms);
});

app.get('/api/room/:roomId', (req, res) => {
  const room = gameManager.getRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    id: room.id,
    players: room.players,
    gameState: room.gameState,
    currentPlayerIndex: room.currentPlayerIndex
  });
});

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
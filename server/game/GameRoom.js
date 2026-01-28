const { Board } = require('./Board');
const { Player } = require('./Player');

// Predefined colors for players
const PLAYER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FECA57', // Yellow
  '#DDA0DD', // Plum
  '#FF8C00', // Orange
  '#9370DB', // Purple
  '#20B2AA', // Light Sea Green
  '#FF69B4'  // Hot Pink
];

/**
 * GameRoom class manages a single game instance
 */
class GameRoom {
  constructor(roomId, boardConfig = { rows: 6, cols: 10 }) {
    this.id = roomId;
    this.players = [];
    this.board = new Board(boardConfig.rows, boardConfig.cols);
    this.gameState = 'lobby'; // lobby, playing, finished
    this.currentPlayerIndex = 0;
    this.winner = null;
    this.createdAt = new Date();
    this.turnTimer = null;
  }

  /**
   * Add a player to the room
   */
  addPlayer(socketId, username, isSpectator = false) {
    // Check if player already exists
    const existingPlayer = this.players.find(p => p.socketId === socketId);
    if (existingPlayer) {
      return existingPlayer;
    }

    const player = new Player(socketId, username, isSpectator);
    
    // Assign color if not spectator and game hasn't started
    if (!isSpectator && this.gameState === 'lobby') {
      const availableColors = PLAYER_COLORS.filter((color, index) => 
        !this.players.some(p => p.color === color)
      );
      player.color = availableColors[0] || PLAYER_COLORS[this.players.length % PLAYER_COLORS.length];
    }

    this.players.push(player);
    return player;
  }

  /**
   * Remove a player from the room
   */
  removePlayer(socketId) {
    const index = this.players.findIndex(p => p.socketId === socketId);
    if (index !== -1) {
      this.players.splice(index, 1);
      
      // Adjust current player index if necessary
      if (this.currentPlayerIndex >= this.players.length && this.players.length > 0) {
        this.currentPlayerIndex = 0;
      }
    }
  }

  /**
   * Get active players (non-spectators)
   */
  getActivePlayers() {
    return this.players.filter(p => !p.isSpectator && !p.isEliminated);
  }

  /**
   * Start the game
   */
  startGame() {
    if (this.gameState !== 'lobby') {
      return { success: false, message: 'Game already started' };
    }

    const activePlayers = this.getActivePlayers();
    if (activePlayers.length < 2) {
      return { success: false, message: 'Need at least 2 players to start' };
    }

    this.gameState = 'playing';
    this.currentPlayerIndex = 0;
    
    // Reset board
    this.board.reset();
    
    // Reset players
    this.players.forEach(player => player.reset());

    // Place initial dots for each player
    this.placeInitialDots();

    return { success: true };
  }

  /**
   * Place initial dots randomly for each player
   */
  placeInitialDots() {
    const activePlayers = this.getActivePlayers();
    
    for (const player of activePlayers) {
      let placed = 0;
      let attempts = 0;
      
      while (placed < 3 && attempts < 100) {
        const row = Math.floor(Math.random() * this.board.rows);
        const col = Math.floor(Math.random() * this.board.cols);
        
        const result = this.board.placeDot(row, col, player.id);
        if (result.success) {
          placed++;
        }
        attempts++;
      }
    }
  }

  /**
   * Place a dot on the board
   */
  placeDot(row, col, playerId) {
    if (this.gameState !== 'playing') {
      return { success: false, message: 'Game not in progress' };
    }

    return this.board.placeDot(row, col, playerId);
  }

  /**
   * Process all explosions and chain reactions
   */
  processExplosions() {
    const explosions = [];
    let processedExplosions = new Set();
    
    // Keep processing until no more explosions
    while (true) {
      const cellsToExplode = this.board.getCellsToExplode();
      const newExplosions = cellsToExplode.filter(cell => 
        !processedExplosions.has(`${cell.row},${cell.col}`)
      );

      if (newExplosions.length === 0) {
        break;
      }

      for (const cell of newExplosions) {
        const key = `${cell.row},${cell.col}`;
        processedExplosions.add(key);
        
        const result = this.board.explodeCell(cell.row, cell.col, cell.owner);
        if (result.success) {
          explosions.push(...result.explosions);
        }
      }
    }

    return explosions;
  }

  /**
   * Check for eliminated players
   */
  checkEliminatedPlayers() {
    const eliminatedPlayers = [];
    
    for (const player of this.players) {
      if (player.isSpectator || player.isEliminated) {
        continue;
      }

      const playerCells = this.board.getPlayerCells(player.id);
      if (playerCells.length === 0) {
        player.isEliminated = true;
        eliminatedPlayers.push(player);
      }
    }

    return eliminatedPlayers;
  }

  /**
   * Check for winner
   */
  checkWinner() {
    const activePlayers = this.getActivePlayers();
    
    if (activePlayers.length === 1) {
      this.winner = activePlayers[0];
      this.gameState = 'finished';
      return this.winner;
    }

    if (activePlayers.length === 0) {
      this.gameState = 'finished';
      return null; // Draw
    }

    return null;
  }

  /**
   * Move to next player's turn
   */
  nextTurn() {
    const activePlayers = this.getActivePlayers();
    
    if (activePlayers.length === 0) {
      return;
    }

    // Find next active player
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    } while (
      this.players[this.currentPlayerIndex].isSpectator || 
      this.players[this.currentPlayerIndex].isEliminated
    );
  }

  /**
   * Get current player
   */
  getCurrentPlayer() {
    if (this.currentPlayerIndex < this.players.length) {
      return this.players[this.currentPlayerIndex];
    }
    return null;
  }

  /**
   * Get room state for client
   */
  getState() {
    return {
      id: this.id,
      players: this.players,
      gameState: this.gameState,
      currentPlayerIndex: this.currentPlayerIndex,
      board: this.board.getState(),
      winner: this.winner,
      createdAt: this.createdAt
    };
  }
}

module.exports = { GameRoom };
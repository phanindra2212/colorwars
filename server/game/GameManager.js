const { GameRoom } = require('./GameRoom');

/**
 * GameManager class manages all game rooms
 */
class GameManager {
  constructor() {
    this.rooms = new Map();
    this.roomCleanupInterval = setInterval(() => {
      this.cleanupEmptyRooms();
    }, 60000); // Clean up every minute
  }

  /**
   * Create a new game room
   */
  createRoom(roomId, boardConfig = { rows: 6, cols: 10 }) {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId);
    }

    const room = new GameRoom(roomId, boardConfig);
    this.rooms.set(roomId, room);
    
    console.log(`Created room: ${roomId}`);
    return room;
  }

  /**
   * Get a game room by ID
   */
  getRoom(roomId) {
    return this.rooms.get(roomId) || null;
  }

  /**
   * Remove a game room
   */
  removeRoom(roomId) {
    const removed = this.rooms.delete(roomId);
    if (removed) {
      console.log(`Removed room: ${roomId}`);
    }
    return removed;
  }

  /**
   * Get all rooms
   */
  getAllRooms() {
    return Array.from(this.rooms.values());
  }

  /**
   * Clean up empty rooms
   */
  cleanupEmptyRooms() {
    const roomsToRemove = [];
    
    for (const [roomId, room] of this.rooms) {
      if (room.players.length === 0) {
        roomsToRemove.push(roomId);
      }
    }

    for (const roomId of roomsToRemove) {
      this.removeRoom(roomId);
    }

    if (roomsToRemove.length > 0) {
      console.log(`Cleaned up ${roomsToRemove.length} empty rooms`);
    }
  }

  /**
   * Get room statistics
   */
  getStats() {
    const stats = {
      totalRooms: this.rooms.size,
      totalPlayers: 0,
      totalSpectators: 0,
      gamesInProgress: 0,
      gamesFinished: 0
    };

    for (const room of this.rooms.values()) {
      stats.totalPlayers += room.players.filter(p => !p.isSpectator).length;
      stats.totalSpectators += room.players.filter(p => p.isSpectator).length;
      
      if (room.gameState === 'playing') {
        stats.gamesInProgress++;
      } else if (room.gameState === 'finished') {
        stats.gamesFinished++;
      }
    }

    return stats;
  }

  /**
   * Find room containing a specific player
   */
  findRoomByPlayer(socketId) {
    for (const room of this.rooms.values()) {
      if (room.players.some(p => p.socketId === socketId)) {
        return room;
      }
    }
    return null;
  }

  /**
   * Generate a random room ID
   */
  generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomId = '';
    
    for (let i = 0; i < 6; i++) {
      roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return roomId;
  }

  /**
   * Destroy the game manager and clean up
   */
  destroy() {
    if (this.roomCleanupInterval) {
      clearInterval(this.roomCleanupInterval);
    }
    this.rooms.clear();
  }
}

module.exports = { GameManager };
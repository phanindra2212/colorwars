const { v4: uuidv4 } = require('uuid');

/**
 * Player class represents a user in the game room
 */
class Player {
  constructor(socketId, username, isSpectator = false) {
    this.id = uuidv4();
    this.socketId = socketId;
    this.username = username;
    this.isSpectator = isSpectator;
    this.color = null; // Will be assigned when game starts
    this.isEliminated = false;
    this.isReady = false;
  }

  reset() {
    this.isEliminated = false;
    this.isReady = false;
  }
}

module.exports = { Player };
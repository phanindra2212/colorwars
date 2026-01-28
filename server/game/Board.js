/**
 * Board class manages the game board state
 */
class Board {
  constructor(rows = 6, cols = 10) {
    this.rows = rows;
    this.cols = cols;
    this.cells = this.initializeCells();
  }

  /**
   * Initialize empty board cells
   */
  initializeCells() {
    const cells = [];
    for (let row = 0; row < this.rows; row++) {
      cells[row] = [];
      for (let col = 0; col < this.cols; col++) {
        cells[row][col] = {
          dots: 0,
          owner: null, // Player ID who owns the cell
          maxCapacity: this.getMaxCapacity(row, col)
        };
      }
    }
    return cells;
  }

  /**
   * Get maximum capacity for a cell based on its position
   * Corner cells: 2, Edge cells: 3, Other cells: 4
   */
  getMaxCapacity(row, col) {
    const isCorner = (row === 0 || row === this.rows - 1) && 
                     (col === 0 || col === this.cols - 1);
    const isEdge = row === 0 || row === this.rows - 1 || 
                   col === 0 || col === this.cols - 1;
    
    if (isCorner) return 2;
    if (isEdge) return 3;
    return 4;
  }

  /**
   * Place a dot on the board
   */
  placeDot(row, col, playerId) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return { success: false, message: 'Invalid position' };
    }

    const cell = this.cells[row][col];
    
    // If cell is owned by another player, can't place dot
    if (cell.owner && cell.owner !== playerId) {
      return { success: false, message: 'Cell owned by another player' };
    }

    // Check if cell would explode
    if (cell.dots >= cell.maxCapacity) {
      return { success: false, message: 'Cell would explode' };
    }

    // Place the dot
    cell.dots++;
    cell.owner = playerId;

    return { 
      success: true, 
      exploded: false,
      cell: { row, col, dots: cell.dots, owner: cell.owner }
    };
  }

  /**
   * Get neighboring cells for explosion
   */
  getNeighbors(row, col) {
    const neighbors = [];
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1] // Up, Down, Left, Right
    ];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < this.rows && 
          newCol >= 0 && newCol < this.cols) {
        neighbors.push({ row: newRow, col: newCol });
      }
    }

    return neighbors;
  }

  /**
   * Explode a cell and distribute dots to neighbors
   */
  explodeCell(row, col, playerId) {
    const cell = this.cells[row][col];
    
    if (cell.dots < cell.maxCapacity || cell.owner !== playerId) {
      return { success: false, message: 'Cell cannot explode' };
    }

    const explosions = [];
    const neighbors = this.getNeighbors(row, col);

    // Clear the exploding cell
    cell.dots = 0;
    cell.owner = null;
    explosions.push({ row, col, type: 'explosion' });

    // Distribute dots to neighbors
    for (const neighbor of neighbors) {
      const neighborCell = this.cells[neighbor.row][neighbor.col];
      neighborCell.dots++;
      neighborCell.owner = playerId;
      
      explosions.push({ 
        row: neighbor.row, 
        col: neighbor.col, 
        type: 'dot_added',
        owner: playerId,
        dots: neighborCell.dots
      });
    }

    return { success: true, explosions };
  }

  /**
   * Check if any cells need to explode
   */
  getCellsToExplode() {
    const cellsToExplode = [];
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells[row][col];
        if (cell.dots >= cell.maxCapacity && cell.owner) {
          cellsToExplode.push({ row, col, owner: cell.owner });
        }
      }
    }

    return cellsToExplode;
  }

  /**
   * Get all cells owned by a specific player
   */
  getPlayerCells(playerId) {
    const playerCells = [];
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells[row][col];
        if (cell.owner === playerId && cell.dots > 0) {
          playerCells.push({ row, col, dots: cell.dots });
        }
      }
    }

    return playerCells;
  }

  /**
   * Reset the board for a new game
   */
  reset() {
    this.cells = this.initializeCells();
  }

  /**
   * Get board state for client
   */
  getState() {
    return {
      rows: this.rows,
      cols: this.cols,
      cells: this.cells
    };
  }
}

module.exports = { Board };
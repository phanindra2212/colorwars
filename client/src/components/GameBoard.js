import React from 'react';

const GameBoard = ({ board, onPlaceDot, disabled, explosions }) => {
  if (!board) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Loading game board...</p>
      </div>
    );
  }

  const handleCellClick = (row, col) => {
    if (!disabled) {
      onPlaceDot(row, col);
    }
  };

  const renderDots = (cell) => {
    const dots = [];
    for (let i = 0; i < cell.dots; i++) {
      dots.push(
        <div
          key={i}
          className={`dot dot-${cell.dots}`}
          style={{ backgroundColor: cell.owner ? getPlayerColor(cell.owner) : '#ccc' }}
        />
      );
    }
    return dots;
  };

  const getPlayerColor = (ownerId) => {
    // This would need to be passed from the parent component
    // For now, using a default color mapping
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#DDA0DD', '#FF8C00', '#9370DB', '#20B2AA', '#FF69B4'
    ];
    return colors[ownerId % colors.length] || '#ccc';
  };

  const isExploding = (row, col) => {
    return explosions.some(exp => exp.row === row && exp.col === col && exp.type === 'explosion');
  };

  return (
    <div className="card">
      <div 
        className="game-board"
        style={{
          gridTemplateColumns: `repeat(${board.cols}, 60px)`,
          gridTemplateRows: `repeat(${board.rows}, 60px)`
        }}
      >
        {board.cells.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`cell ${disabled ? 'disabled' : ''} ${isExploding(rowIndex, colIndex) ? 'explosion' : ''}`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              style={{
                backgroundColor: cell.owner ? getPlayerColor(cell.owner) + '20' : 'rgba(255, 255, 255, 0.9)',
                borderColor: cell.owner ? getPlayerColor(cell.owner) : 'rgba(255, 255, 255, 0.3)',
                cursor: disabled ? 'not-allowed' : 'pointer'
              }}
            >
              {renderDots(cell)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GameBoard;
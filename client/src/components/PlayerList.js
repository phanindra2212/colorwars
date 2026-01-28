import React from 'react';

const PlayerList = ({ players, currentPlayerIndex }) => {
  const getCurrentPlayerClass = (index) => {
    return index === currentPlayerIndex ? 'current-turn' : '';
  };

  const getEliminatedClass = (player) => {
    return player.isEliminated ? 'eliminated' : '';
  };

  const getSpectatorLabel = (player) => {
    return player.isSpectator ? ' (Spectator)' : '';
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', color: '#333' }}>Players</h3>
      <div className="player-list">
        {players.map((player, index) => (
          <div 
            key={player.id}
            className={`player-item ${getCurrentPlayerClass(index)} ${getEliminatedClass(player)}`}
          >
            <div className="player-info">
              {player.color && !player.isSpectator && (
                <div 
                  className="player-color" 
                  style={{ backgroundColor: player.color }}
                />
              )}
              <span>
                {player.username}
                {getSpectatorLabel(player)}
                {player.isEliminated && ' (Eliminated)'}
                {index === currentPlayerIndex && !player.isSpectator && ' ←'}
              </span>
            </div>
            <div>
              {player.isReady && <span style={{ color: '#27ae60' }}>✓</span>}
            </div>
          </div>
        ))}
      </div>
      
      {players.filter(p => !p.isSpectator).length > 0 && (
        <div style={{ 
          fontSize: '0.9rem', 
          color: '#666', 
          marginTop: '1rem',
          textAlign: 'center'
        }}>
          {players.filter(p => !p.isSpectator).length} active players
          {players.filter(p => p.isSpectator).length > 0 && 
            ` • ${players.filter(p => p.isSpectator).length} spectators`
          }
        </div>
      )}
    </div>
  );
};

export default PlayerList;
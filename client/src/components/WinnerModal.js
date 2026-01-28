import React from 'react';

const WinnerModal = ({ winner, players, onClose }) => {
  const activePlayers = players.filter(p => !p.isSpectator && !p.isEliminated);
  const eliminatedPlayers = players.filter(p => !p.isSpectator && p.isEliminated);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">
          🎉 Game Over! 🎉
        </h2>
        
        <div className="modal-content">
          {winner ? (
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Winner:
              </div>
              <div 
                style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: winner.color,
                  marginBottom: '2rem'
                }}
              >
                {winner.username}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
              It's a draw!
            </div>
          )}

          <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Final Standings:</h4>
            
            {winner && (
              <div style={{ 
                padding: '8px 12px', 
                background: 'rgba(39, 174, 96, 0.1)', 
                borderRadius: '8px',
                marginBottom: '8px'
              }}>
                🏆 {winner.username}
              </div>
            )}

            {activePlayers.filter(p => p !== winner).map((player, index) => (
              <div key={player.id} style={{ 
                padding: '8px 12px', 
                background: 'rgba(255, 255, 255, 0.5)', 
                borderRadius: '8px',
                marginBottom: '4px'
              }}>
                {index + 2}. {player.username}
              </div>
            ))}

            {eliminatedPlayers.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h5 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                  Eliminated:
                </h5>
                {eliminatedPlayers.map(player => (
                  <div key={player.id} style={{ 
                    padding: '4px 8px', 
                    fontSize: '0.85rem',
                    color: '#999',
                    textDecoration: 'line-through'
                  }}>
                    {player.username}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinnerModal;
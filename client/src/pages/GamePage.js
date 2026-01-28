import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import GameBoard from '../components/GameBoard';
import PlayerList from '../components/PlayerList';
import ChatPanel from '../components/ChatPanel';
import VoiceChat from '../components/VoiceChat';
import WinnerModal from '../components/WinnerModal';

const GamePage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  
  const [gameState, setGameState] = useState('lobby');
  const [players, setPlayers] = useState([]);
  const [board, setBoard] = useState(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [winner, setWinner] = useState(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [error, setError] = useState('');
  const [explosions, setExplosions] = useState([]);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    const handleRoomJoined = (data) => {
      setGameState(data.gameState);
      setPlayers(data.players);
      setBoard(data.board);
      setCurrentPlayerIndex(data.currentPlayerIndex);
      setIsSpectator(data.isSpectator);
      setWinner(data.winner);
      setError('');
    };

    const handlePlayerJoined = (data) => {
      setPlayers(data.players);
      setCurrentPlayerIndex(data.currentPlayerIndex);
    };

    const handlePlayerLeft = (data) => {
      setPlayers(data.players);
      setCurrentPlayerIndex(data.currentPlayerIndex);
    };

    const handleGameStarted = (data) => {
      setGameState(data.gameState);
      setBoard(data.board);
      setCurrentPlayerIndex(data.currentPlayerIndex);
      setPlayers(data.players);
    };

    const handleGameUpdate = (data) => {
      setBoard(data.board);
      setCurrentPlayerIndex(data.currentPlayerIndex);
      setPlayers(data.players);
      setExplosions(data.explosions || []);
      
      // Handle eliminated players
      if (data.eliminatedPlayers && data.eliminatedPlayers.length > 0) {
        console.log('Eliminated players:', data.eliminatedPlayers);
      }
      
      // Clear explosions after animation
      if (data.explosions && data.explosions.length > 0) {
        setTimeout(() => setExplosions([]), 600);
      }
    };

    const handleGameOver = (data) => {
      setWinner(data.winner);
      setGameState('finished');
    };

    const handleError = (data) => {
      setError(data.message);
      setTimeout(() => setError(''), 5000);
    };

    // Register event listeners
    socket.on('room_joined', handleRoomJoined);
    socket.on('player_joined', handlePlayerJoined);
    socket.on('player_left', handlePlayerLeft);
    socket.on('game_started', handleGameStarted);
    socket.on('game_update', handleGameUpdate);
    socket.on('game_over', handleGameOver);
    socket.on('error', handleError);

    return () => {
      socket.off('room_joined', handleRoomJoined);
      socket.off('player_joined', handlePlayerJoined);
      socket.off('player_left', handlePlayerLeft);
      socket.off('game_started', handleGameStarted);
      socket.off('game_update', handleGameUpdate);
      socket.off('game_over', handleGameOver);
      socket.off('error', handleError);
    };
  }, [socket]);

  // Join room on component mount
  useEffect(() => {
    if (!connected || !socket) return;

    // The room is already joined from HomePage
    // But we need to handle case where user navigates directly
    const username = localStorage.getItem('username') || 'Player';
    
    // Request current room state
    socket.emit('get_room_state', { roomId });
  }, [connected, socket, roomId]);

  const handleStartGame = useCallback(() => {
    if (socket) {
      socket.emit('start_game', { roomId });
    }
  }, [socket, roomId]);

  const handlePlaceDot = useCallback((row, col) => {
    if (socket && gameState === 'playing') {
      socket.emit('place_dot', { roomId, row, col });
    }
  }, [socket, roomId, gameState]);

  const handleLeaveRoom = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer && socket && 
                   players.some(p => p.socketId === socket.id) &&
                   currentPlayer.socketId === socket.id;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'white', margin: 0 }}>Room {roomId}</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
            {isSpectator ? 'Spectating' : 'Playing'} • {players.length} users
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleLeaveRoom}>
          Leave Room
        </button>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#e74c3c', 
          color: 'white', 
          padding: '12px 16px', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        <div>
          {gameState === 'lobby' && (
            <div className="card">
              <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Lobby</h2>
              
              <PlayerList 
                players={players} 
                currentPlayerIndex={currentPlayerIndex}
              />
              
              {players.filter(p => !p.isSpectator).length >= 2 && !isSpectator && (
                <button 
                  className="btn" 
                  onClick={handleStartGame}
                  style={{ width: '100%', marginTop: '2rem' }}
                >
                  Start Game
                </button>
              )}
              
              {players.filter(p => !p.isSpectator).length < 2 && (
                <p style={{ 
                  textAlign: 'center', 
                  color: '#666', 
                  marginTop: '1rem',
                  fontStyle: 'italic'
                }}>
                  Need at least 2 players to start
                </p>
              )}
            </div>
          )}

          {gameState === 'playing' && (
            <div>
              {currentPlayer && (
                <div className="card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, color: '#333' }}>
                    Current Turn: 
                    <span style={{ color: currentPlayer.color, marginLeft: '8px' }}>
                      {currentPlayer.username}
                    </span>
                  </h3>
                  {isMyTurn && (
                    <p style={{ color: '#27ae60', fontWeight: '600', marginTop: '8px' }}>
                      Your Turn! Click on a cell to place a dot.
                    </p>
                  )}
                </div>
              )}
              
              <GameBoard 
                board={board}
                onPlaceDot={handlePlaceDot}
                disabled={!isMyTurn || isSpectator}
                explosions={explosions}
              />
            </div>
          )}

          {gameState === 'finished' && (
            <div className="card" style={{ textAlign: 'center' }}>
              <h2>Game Over!</h2>
              {winner ? (
                <div>
                  <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>
                    Winner: 
                    <span style={{ color: winner.color, marginLeft: '8px', fontWeight: 'bold' }}>
                      {winner.username}
                    </span>
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>It's a draw!</p>
              )}
            </div>
          )}
        </div>

        <div>
          <ChatPanel roomId={roomId} />
          
          {!isSpectator && (
            <VoiceChat roomId={roomId} players={players} />
          )}
        </div>
      </div>

      {winner && (
        <WinnerModal 
          winner={winner}
          players={players}
          onClose={() => setWinner(null)}
        />
      )}
    </div>
  );
};

export default GamePage;
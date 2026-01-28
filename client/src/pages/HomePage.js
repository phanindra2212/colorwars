import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';

const HomePage = () => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (connected && socket) {
      // Fetch available rooms
      fetch('/api/rooms')
        .then(res => res.json())
        .then(data => setRooms(data))
        .catch(err => console.error('Error fetching rooms:', err));
    }
  }, [connected, socket]);

  const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  const handleCreateRoom = () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    const newRoomId = generateRoomId();
    setIsCreatingRoom(true);
    
    // Join the newly created room
    if (socket) {
      socket.emit('join_room', {
        roomId: newRoomId,
        username: username.trim(),
        isSpectator: false
      });
      
      navigate(`/game/${newRoomId}`);
    }
  };

  const handleJoinRoom = (roomToJoin) => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (socket) {
      socket.emit('join_room', {
        roomId: roomToJoin,
        username: username.trim(),
        isSpectator: false
      });
      
      navigate(`/game/${roomToJoin}`);
    }
  };

  const handleSpectateRoom = (roomToSpectate) => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (socket) {
      socket.emit('join_room', {
        roomId: roomToSpectate,
        username: username.trim(),
        isSpectator: true
      });
      
      navigate(`/game/${roomToSpectate}`);
    }
  };

  return (
    <div className="container">
      <div className="title">Chain Reaction Game</div>
      
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>
          Welcome to Chain Reaction!
        </h2>
        
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Your Username:
          </label>
          <input
            type="text"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            style={{ width: '100%' }}
            maxLength={20}
          />
        </div>

        {error && (
          <div style={{ 
            color: '#e74c3c', 
            marginBottom: '1rem', 
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#333' }}>Create New Room</h3>
          <button 
            className="btn" 
            onClick={handleCreateRoom}
            disabled={!connected || isCreatingRoom}
            style={{ width: '100%' }}
          >
            {!connected ? 'Connecting...' : isCreatingRoom ? 'Creating...' : 'Create Room'}
          </button>
        </div>

        <div>
          <h3 style={{ marginBottom: '1rem', color: '#333' }}>Available Rooms</h3>
          {rooms.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
              No active rooms. Create one to get started!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {rooms.map((room) => (
                <div 
                  key={room.id} 
                  className="player-item"
                  style={{ padding: '1rem' }}
                >
                  <div>
                    <strong>Room {room.id}</strong>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                      {room.playerCount} players • {room.spectatorCount} spectators
                      {room.gameState === 'playing' && ' • In Progress'}
                      {room.gameState === 'finished' && ' • Finished'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {room.gameState === 'lobby' && room.playerCount < 10 && (
                      <button 
                        className="btn" 
                        onClick={() => handleJoinRoom(room.id)}
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                      >
                        Join
                      </button>
                    )}
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleSpectateRoom(room.id)}
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      Spectate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px' }}>
          <h4 style={{ color: '#333', marginBottom: '8px' }}>How to Play:</h4>
          <ul style={{ color: '#666', marginLeft: '20px', fontSize: '0.9rem' }}>
            <li>Place colored dots on the board</li>
            <li>Cells explode when reaching capacity</li>
            <li>Explosions spread to neighboring cells</li>
            <li>Last player with dots wins!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
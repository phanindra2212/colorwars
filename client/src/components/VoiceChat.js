import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';

const VoiceChat = ({ roomId, players }) => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState(new Set());
  
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const socketRef = useRef(null);
  const { socket } = useSocket();

  // WebRTC configuration
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!socket) return;
    socketRef.current = socket;

    // Handle WebRTC signaling
    const handleVoiceSignal = async ({ signal, fromSocketId }) => {
      try {
        const peerConnection = peerConnectionsRef.current.get(fromSocketId);
        
        if (peerConnection) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
          
          if (signal.type === 'offer') {
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            socket.emit('voice_signal', {
              roomId,
              signal: answer,
              targetSocketId: fromSocketId
            });
          }
        }
      } catch (error) {
        console.error('Error handling voice signal:', error);
      }
    };

    socket.on('voice_signal', handleVoiceSignal);

    return () => {
      socket.off('voice_signal', handleVoiceSignal);
    };
  }, [socket, roomId]);

  const startVoiceChat = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      localStreamRef.current = stream;
      setIsVoiceEnabled(true);
      setParticipants(new Set([socketRef.current.id]));

      // Create peer connections with other players
      const activePlayers = players.filter(p => !p.isSpectator && p.socketId !== socketRef.current.id);
      
      for (const player of activePlayers) {
        await createPeerConnection(player.socketId, true);
      }

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopVoiceChat = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc, socketId) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();

    setIsVoiceEnabled(false);
    setParticipants(new Set());
  };

  const createPeerConnection = async (socketId, isInitiator = false) => {
    try {
      const peerConnection = new RTCPeerConnection(configuration);
      
      // Add local stream to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        const audio = new Audio();
        audio.srcObject = event.streams[0];
        audio.play();
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('voice_signal', {
            roomId,
            signal: {
              type: 'ice-candidate',
              candidate: event.candidate
            },
            targetSocketId: socketId
          });
        }
      };

      // Store peer connection
      peerConnectionsRef.current.set(socketId, peerConnection);
      setParticipants(prev => new Set([...prev, socketId]));

      // If initiator, create offer
      if (isInitiator) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        socketRef.current.emit('voice_signal', {
          roomId,
          signal: offer,
          targetSocketId: socketId
        });
      }

    } catch (error) {
      console.error('Error creating peer connection:', error);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const handleVoiceToggle = () => {
    if (isVoiceEnabled) {
      stopVoiceChat();
    } else {
      startVoiceChat();
    }
  };

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>Voice Chat</h3>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
        <button
          className={`btn ${isVoiceEnabled ? 'btn-secondary' : ''}`}
          onClick={handleVoiceToggle}
          style={{ flex: 1, fontSize: '14px', padding: '8px 12px' }}
        >
          {isVoiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
        </button>
        
        {isVoiceEnabled && (
          <button
            className={`btn ${isMuted ? 'btn-secondary' : ''}`}
            onClick={toggleMute}
            style={{ fontSize: '14px', padding: '8px 12px' }}
          >
            {isMuted ? '🎤 Unmute' : '🔇 Mute'}
          </button>
        )}
      </div>

      {isVoiceEnabled && participants.size > 0 && (
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          <div>{participants.size} participant(s)</div>
          {isMuted && (
            <div style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '4px' }}>
              You are muted
            </div>
          )}
        </div>
      )}

      {!isVoiceEnabled && (
        <div style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
          Click to enable voice chat with other players
        </div>
      )}
    </div>
  );
};

export default VoiceChat;
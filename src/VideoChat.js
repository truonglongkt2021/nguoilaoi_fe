import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';
import './VideoChat.css';  // Import file CSS
const socket = io('https://apinguoilaoiv2.amazingtech.cc');

export const VideoChat = () => {
  const [myId, setMyId] = useState('');
  const [peers, setPeers] = useState([]); // Lưu trữ danh sách các peer
  const [roomId, setRoomId] = useState('');
  const myVideo = useRef();
  const videoRefs = useRef({}); // Lưu trữ các video refs của các peer khác

  useEffect(() => {
    socket.on('connect', () => {
      setMyId(socket.id);
    });

    // Nhận tín hiệu WebRTC từ peer khác
    socket.on('signal', (data) => {
      const peer = peers.find(p => p.peerId === data.from);
      if (peer) {
        peer.peer.signal(data.signal);
      }
    });

    socket.on('new-user', (userId) => {
      createPeer(userId, false); // Tạo kết nối với người mới
    });

    socket.on('room-full', (message) => {
      alert(message); // Thông báo nếu room đã đầy
    });
  }, [peers]);

  const joinRoom = () => {
    if (roomId) {
      socket.emit('join-room', roomId);
    }
  };

  const startStream = () => {
    navigator.mediaDevices.getUserMedia({
      video: {
        width: { max: 640 },
        height: { max: 480 },
        frameRate: { max: 30 }
      },
      audio: true
    }).then((stream) => {
      myVideo.current.srcObject = stream;
      createPeer(null, true, stream); // Tạo kết nối cho chính mình
    }).catch((error) => {
      console.error("Error accessing media devices:", error);
    });
  };

  const createPeer = (userId, initiator, stream) => {
    const newPeer = new Peer({
      initiator: initiator,
      trickle: false,
      stream: stream,
    });

    newPeer.on('signal', (signal) => {
      socket.emit('signal', { signal, to: userId });
    });

    newPeer.on('stream', (stream) => {
      if (!videoRefs.current[userId]) {
        videoRefs.current[userId] = React.createRef();
      }
      videoRefs.current[userId].current.srcObject = stream;
    });

    setPeers((prevPeers) => [...prevPeers, { peerId: userId, peer: newPeer }]);
  };

  return (
    <div className="video-container">
      <h3>Your ID: {myId}</h3>
      <input
        type="text"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={joinRoom}>Join Room</button>
      <button onClick={startStream}>Start Stream</button>

      <div className="main-video">
        <video ref={myVideo} autoPlay muted />
      </div>
      
      <div className="peer-videos">
        {Object.keys(videoRefs.current).map((userId) => (
          <video key={userId} ref={videoRefs.current[userId]} autoPlay />
        ))}
      </div>
    </div>
  );
};

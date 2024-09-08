import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';

const socket = io('https://apinguoilaoiv2.amazingtech.cc');  // Kết nối đến signaling server

export const VideoChat = () => {  // Đây là named export
  const [myId, setMyId] = useState('');
  const [peerId, setPeerId] = useState('');
  const [peer, setPeer] = useState(null);
  const myVideo = useRef();
  const peerVideo = useRef();

  useEffect(() => {
    // Nhận ID của người dùng từ signaling server
    socket.on('connect', () => {
      setMyId(socket.id);
    });

    // Nhận tín hiệu WebRTC từ peer khác
    socket.on('signal', (data) => {
      if (peer) {
        peer.signal(data.signal);
      }
    });
  }, [peer]);

  // Bắt đầu phát video từ webcam và tạo kết nối WebRTC
  const startStream = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      myVideo.current.srcObject = stream;
      const newPeer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
      });

      newPeer.on('signal', (signal) => {
        socket.emit('signal', { signal, to: peerId });
      });

      newPeer.on('stream', (stream) => {
        peerVideo.current.srcObject = stream;
      });

      setPeer(newPeer);
    });
  };

  return (
    <div>
      <h3>Your ID: {myId}</h3>
      <input
        type="text"
        placeholder="Enter Peer ID"
        value={peerId}
        onChange={(e) => setPeerId(e.target.value)}
      />
      <button onClick={startStream}>Start Stream</button>

      <div>
        <video ref={myVideo} autoPlay muted style={{ width: '300px' }} />
        <video ref={peerVideo} autoPlay style={{ width: '300px' }} />
      </div>
    </div>
  );
};

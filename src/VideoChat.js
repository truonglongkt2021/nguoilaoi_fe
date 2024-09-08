import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';

const socket = io('https://apinguoilaoi.amazingtech.cc');  // Kết nối đến signaling server

export const VideoChat = () => {
  const [myId, setMyId] = useState('');  // ID của chính mình
  const [peerId, setPeerId] = useState('');  // ID của peer đối diện
  const [peer, setPeer] = useState(null);  // Đối tượng peer WebRTC
  const myVideo = useRef();  // Video của chính mình
  const peerVideo = useRef();  // Video của đối phương

  useEffect(() => {
    // Nhận ID từ signaling server khi kết nối
    socket.on('connect', () => {
      setMyId(socket.id);
    });

    // Nhận tín hiệu WebRTC từ peer khác
    socket.on('signal', (data) => {
      console.log('Received signal:', data);
      if (peer) {
        peer.signal(data.signal);
      }
    });
  }, [peer]);

  // Bắt đầu phát video từ webcam và tạo kết nối WebRTC
  const startStream = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      // Hiển thị video của chính mình
      myVideo.current.srcObject = stream;

      // Tạo một peer mới để khởi tạo kết nối WebRTC
      const newPeer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,  // Gửi stream của mình cho peer khác
      });

      // Gửi tín hiệu WebRTC qua signaling server
      newPeer.on('signal', (signal) => {
        socket.emit('signal', { signal, to: peerId });
      });

      // Nhận stream từ peer khác và hiển thị
      newPeer.on('stream', (stream) => {
        peerVideo.current.srcObject = stream;
      });

      setPeer(newPeer);
    }).catch((err) => console.error("Error accessing media devices.", err));
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
        <video ref={myVideo} autoPlay muted style={{ width: '50%' }} />
        <video ref={peerVideo} autoPlay style={{ width: '50%' }} />
      </div>
    </div>
  );
};

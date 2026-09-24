// lib/webrtcConnection.js
export function createP2PConnection({ socket, peerUserId, isInitiator, onMessage, onStateChange }) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  let dataChannel;

  const setupDataChannel = (channel) => {
    dataChannel = channel;
    dataChannel.onopen = () => onStateChange("connected");
    dataChannel.onclose = () => onStateChange("disconnected");
    dataChannel.onmessage = (event) => onMessage(JSON.parse(event.data));
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("webrtc-ice-candidate", { targetUserId: peerUserId, candidate: event.candidate });
    }
  };

  pc.onconnectionstatechange = () => {
    onStateChange(pc.connectionState); // "connecting" | "connected" | "disconnected" | "failed"
  };

  if (isInitiator) {
    dataChannel = pc.createDataChannel("chat");
    setupDataChannel(dataChannel);
  } else {
    pc.ondatachannel = (event) => setupDataChannel(event.channel);
  }

  return {
    pc,
    async createOffer() {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc-offer", { targetUserId: peerUserId, offer });
    },
    async handleOffer(offer) {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { targetUserId: peerUserId, answer });
    },
    async handleAnswer(answer) {
      await pc.setRemoteDescription(answer);
    },
    async handleIceCandidate(candidate) {
      await pc.addIceCandidate(candidate);
    },
    send(text) {
      if (dataChannel?.readyState === "open") {
        dataChannel.send(JSON.stringify({ text, createdAt: new Date().toISOString() }));
        return true;
      }
      return false;
    },
    close() {
      dataChannel?.close();
      pc.close();
    },
  };
}
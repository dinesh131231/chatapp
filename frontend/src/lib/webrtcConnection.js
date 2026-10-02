export function createP2PConnection({ socket, peerUserId, isInitiator, onMessage, onStateChange }) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  let dataChannel;
  let isClosed = false;

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
    onStateChange(pc.connectionState);
  };

  if (isInitiator) {
    dataChannel = pc.createDataChannel("chat");
    setupDataChannel(dataChannel);
  } else {
    pc.ondatachannel = (event) => setupDataChannel(event.channel);
  }

  // tears down THIS side only — used both when we close and when the peer tells us they closed
  const closeLocally = () => {
    if (isClosed) return;
    isClosed = true;
    dataChannel?.close();
    pc.close();
    onStateChange("disconnected"); // don't rely on the browser firing this on manual close
  };

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
      if (isClosed || dataChannel?.readyState !== "open") return false;
      dataChannel.send(JSON.stringify({ text, createdAt: new Date().toISOString() }));
      return true;
    },
    close() {
      // tell the peer we're leaving, THEN close our own side
      socket.emit("webrtc-close", { targetUserId: peerUserId });
      closeLocally();
    },
    closeLocally, // exposed so the store can use it when the PEER initiated the close
  };
}
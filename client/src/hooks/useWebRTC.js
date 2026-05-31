import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";

export const useWebRTC = (socket, roomId, username, avatar) => {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState([]); // [{ socketId, username, avatar, stream }]
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const pcsRef = useRef({}); // { socketId: RTCPeerConnection }
  const localStreamRef = useRef(null);
  const callUsersMetaRef = useRef({}); // { socketId: { username, avatar } }
  const candidateQueuesRef = useRef({}); // { socketId: [candidates] }

  const cleanupPeer = useCallback((socketId) => {
    if (pcsRef.current[socketId]) {
      pcsRef.current[socketId].close();
      delete pcsRef.current[socketId];
    }
    delete candidateQueuesRef.current[socketId];
    setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
  }, []);

  const createPeerConnection = useCallback((peerSocketId, peerUsername, peerAvatar, currentLocalStream) => {
    if (pcsRef.current[peerSocketId]) {
      cleanupPeer(peerSocketId);
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });

    pcsRef.current[peerSocketId] = pc;
    candidateQueuesRef.current[peerSocketId] = [];

    // Add local stream tracks to connection
    if (currentLocalStream) {
      currentLocalStream.getTracks().forEach((track) => {
        pc.addTrack(track, currentLocalStream);
      });
    }

    // ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("webrtc-signal", {
          to: peerSocketId,
          signal: { type: "candidate", candidate: event.candidate },
        });
      }
    };

    // Remote stream tracks received
    pc.ontrack = (event) => {
      console.log(`🎬 Received remote stream track from ${peerUsername}`, event.streams[0]);
      const remoteStream = event.streams[0];
      setPeers((prev) => {
        const exists = prev.find((p) => p.socketId === peerSocketId);
        if (exists) {
          return prev.map((p) =>
            p.socketId === peerSocketId ? { ...p, stream: remoteStream } : p
          );
        }
        return [
          ...prev,
          {
            socketId: peerSocketId,
            username: peerUsername,
            avatar: peerAvatar,
            stream: remoteStream,
            isMuted: false,
            isVideoOff: false,
          },
        ];
      });
    };

    // Connection states
    pc.onconnectionstatechange = () => {
      console.log(`📞 Call Connection state with ${peerUsername}: ${pc.connectionState}`);
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        cleanupPeer(peerSocketId);
      }
    };

    return pc;
  }, [socket, cleanupPeer]);

  const joinCall = async () => {
    if (!socket || !roomId) {
      toast.error("Socket not connected or Room ID missing");
      return;
    }

    try {
      // 1. Get media access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsMuted(false);
      setIsVideoOff(false);
      setInCall(true);

      // 2. Join call room via signaling server
      socket.emit("join-call", { roomId, username, avatar });
      socket.emit("call-status-update", { roomId, isMuted: false, isVideoOff: false });
      toast.success("Joined voice/video call");
    } catch (error) {
      console.error("Error accessing camera/mic:", error);
      toast.error("Could not access camera or microphone. Please grant permissions.");
    }
  };

  const leaveCall = useCallback(() => {
    if (socket) {
      socket.emit("leave-call", { roomId });
    }

    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // Close all connections
    Object.keys(pcsRef.current).forEach((id) => {
      cleanupPeer(id);
    });

    setPeers([]);
    setInCall(false);
    setIsMuted(false);
    setIsVideoOff(false);
    callUsersMetaRef.current = {};
    toast.success("Left the call");
  }, [socket, roomId, cleanupPeer]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      if (socket) {
        socket.emit("call-status-update", { roomId, isMuted: newMuted, isVideoOff });
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      const newVideoOff = !isVideoOff;
      setIsVideoOff(newVideoOff);
      if (socket) {
        socket.emit("call-status-update", { roomId, isMuted, isVideoOff: newVideoOff });
      }
    }
  };

  // Listen to WebRTC signaling events from socket
  useEffect(() => {
    if (!socket || !inCall) return;

    // 1. Receive other users in call when joining
    const handleCallUsers = async (usersList) => {
      console.log("👥 Existing users in call received:", usersList);
      for (const u of usersList) {
        callUsersMetaRef.current[u.socketId] = { username: u.username, avatar: u.avatar };
        
        // We are the initiator (offer side)
        const pc = createPeerConnection(u.socketId, u.username, u.avatar, localStreamRef.current);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc-signal", {
            to: u.socketId,
            signal: { type: "offer", sdp: offer, username, avatar },
          });
        } catch (err) {
          console.error("Error creating WebRTC offer:", err);
        }
      }
    };

    // 2. Another user joined call (existing user receives this broadcast)
    const handleUserJoinedCall = ({ socketId, username, avatar }) => {
      console.log(`👤 User joined call: ${username} (${socketId})`);
      callUsersMetaRef.current[socketId] = { username, avatar };
      // We wait for them to send us the offer.
    };

    // 3. Receive signal (Offer, Answer, Candidate)
    const handleWebRTCSignal = async ({ from, signal }) => {
      let pc = pcsRef.current[from];

      // Handle Offer
      if (signal.type === "offer") {
        const meta = callUsersMetaRef.current[from] || {
          username: signal.username || "Participant",
          avatar: signal.avatar,
        };
        if (!callUsersMetaRef.current[from]) {
          callUsersMetaRef.current[from] = meta;
        }

        console.log(`📥 Received WebRTC offer from ${meta.username}`);
        pc = createPeerConnection(from, meta.username, meta.avatar, localStreamRef.current);

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("webrtc-signal", {
            to: from,
            signal: { type: "answer", sdp: answer },
          });

          // Process queued candidates
          const queue = candidateQueuesRef.current[from] || [];
          for (const cand of queue) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
          candidateQueuesRef.current[from] = [];
        } catch (err) {
          console.error("Error handling offer:", err);
        }
      } 
      // Handle Answer
      else if (signal.type === "answer") {
        if (!pc) return;
        console.log(`📥 Received WebRTC answer from socket ${from}`);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          // Process queued candidates
          const queue = candidateQueuesRef.current[from] || [];
          for (const cand of queue) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
          candidateQueuesRef.current[from] = [];
        } catch (err) {
          console.error("Error setting remote description from answer:", err);
        }
      } 
      // Handle Candidate
      else if (signal.type === "candidate") {
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (err) {
            console.error("Error adding Ice Candidate:", err);
          }
        } else {
          // Connection not ready or sdp not set yet, queue the candidate
          if (!candidateQueuesRef.current[from]) {
            candidateQueuesRef.current[from] = [];
          }
          candidateQueuesRef.current[from].push(signal.candidate);
        }
      }
    };

    // 4. A user left call
    const handleUserLeftCall = ({ socketId, username }) => {
      console.log(`👤 User left call: ${username}`);
      cleanupPeer(socketId);
    };

    // 5. User updated mic/camera status
    const handleCallStatusUpdate = ({ socketId, isMuted: peerMuted, isVideoOff: peerVideoOff }) => {
      setPeers((prev) =>
        prev.map((p) =>
          p.socketId === socketId
            ? { ...p, isMuted: peerMuted, isVideoOff: peerVideoOff }
            : p
        )
      );
    };

    // Register listeners
    socket.on("call-users", handleCallUsers);
    socket.on("user-joined-call", handleUserJoinedCall);
    socket.on("webrtc-signal", handleWebRTCSignal);
    socket.on("user-left-call", handleUserLeftCall);
    socket.on("call-status-update", handleCallStatusUpdate);

    return () => {
      socket.off("call-users", handleCallUsers);
      socket.off("user-joined-call", handleUserJoinedCall);
      socket.off("webrtc-signal", handleWebRTCSignal);
      socket.off("user-left-call", handleUserLeftCall);
      socket.off("call-status-update", handleCallStatusUpdate);
    };
  }, [socket, inCall, username, avatar, createPeerConnection, cleanupPeer]);

  // Clean up all streams and connections on unmount
  useEffect(() => {
    const pcs = pcsRef.current;
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      Object.keys(pcs).forEach((id) => {
        if (pcs[id]) pcs[id].close();
      });
    };
  }, []);

  return {
    localStream,
    peers,
    inCall,
    isMuted,
    isVideoOff,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo,
  };
};

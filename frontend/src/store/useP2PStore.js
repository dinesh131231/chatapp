// store/useP2PStore.js
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { createP2PConnection } from "../lib/webrtcConnection";

export const useP2PStore = create((set, get) => ({
    p2pEnabled: false,
    p2pStatus: "idle", // idle | connecting | connected | disconnected | failed
    connection: null,
    p2pMessages: [],

    enableP2P: async (peerUserId) => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        const connection = createP2PConnection({
            socket,
            peerUserId,
            isInitiator: true,
            onMessage: (msg) => set({ p2pMessages: [...get().p2pMessages, { ...msg, fromPeer: true }] }),
            onStateChange: (status) => set({ p2pStatus: status }),
        });

        set({ connection, p2pEnabled: true, p2pStatus: "connecting" });
        await connection.createOffer();
    },

    disableP2P: () => {
        get().connection?.close();
        set({ connection: null, p2pEnabled: false, p2pStatus: "idle", p2pMessages: [] });
    },

    // called by the *receiving* side when it gets an incoming offer
    acceptP2POffer: async (peerUserId, offer) => {
        const socket = useAuthStore.getState().socket;
        const connection = createP2PConnection({
            socket,
            peerUserId,
            isInitiator: false,
            onMessage: (msg) => set({ p2pMessages: [...get().p2pMessages, { ...msg, fromPeer: true }] }),
            onStateChange: (status) => set({ p2pStatus: status }),
        });

        set({ connection, p2pEnabled: true, p2pStatus: "connecting" });
        await connection.handleOffer(offer);
    },

    sendP2PMessage: (text) => {
        const sent = get().connection?.send(text);
        if (sent) {
            set({ p2pMessages: [...get().p2pMessages, { text, createdAt: new Date().toISOString(), fromPeer: false }] });
        }
        return sent;
    },
    // store/useP2PStore.js — add this action
    subscribeToP2P: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.on("webrtc-offer", ({ fromUserId, offer }) => {
            get().acceptP2POffer(fromUserId, offer);
        });

        socket.on("webrtc-answer", ({ fromUserId, answer }) => {
            get().connection?.handleAnswer(answer);
        });

        socket.on("webrtc-ice-candidate", ({ fromUserId, candidate }) => {
            get().connection?.handleIceCandidate(candidate);
        });
    },

    unsubscribeFromP2P: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        socket.off("webrtc-offer");
        socket.off("webrtc-answer");
        socket.off("webrtc-ice-candidate");
    },
}));
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";
import toast from "react-hot-toast";

export const useChatRequestStore = create((set, get) => ({
  pendingRequests: [],
  sentRequests: [],
  isLoading: false,

  getPendingRequests: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/chat-requests/pending");
      set({ pendingRequests: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load requests");
    } finally {
      set({ isLoading: false });
    }
  },

  getSentRequests: async () => {
    try {
      const res = await axiosInstance.get("/chat-requests/sent");
      set({ sentRequests: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load sent requests");
    }
  },

  sendChatRequest: async (receiverId) => {
    try {
      const res = await axiosInstance.post(`/chat-requests/send/${receiverId}`);
      toast.success("Chat request sent");
      set({ sentRequests: [...get().sentRequests, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    }
  },

  respondToRequest: async (requestId, action) => {
    try {
      const res = await axiosInstance.put(`/chat-requests/respond/${requestId}`, { action });
      set({
        pendingRequests: get().pendingRequests.filter((r) => r._id !== requestId),
      });
      toast.success(action === "accept" ? "Request accepted" : "Request rejected");

      // refresh contact lists so isConnected reflects the new state (receiver side)
      useChatStore.getState().getAllContacts?.();
      useChatStore.getState().getChatPartners?.();

      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to respond");
    }
  },

  subscribeToChatRequests: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("chatRequestReceived", (request) => {
      set({ pendingRequests: [...get().pendingRequests, request] });
      toast(`New chat request from ${request.senderId.fullName}`);
    });

    socket.on("chatRequestAccepted", (request) => {
      set({
        sentRequests: get().sentRequests.map((r) =>
          r._id === request._id ? request : r
        ),
      });
      toast.success(`${request.receiverId.fullName} accepted your request`);

      // refresh contact lists so isConnected reflects the new state (sender side)
      useChatStore.getState().getAllContacts?.();
      useChatStore.getState().getChatPartners?.();
    });
  },

  unsubscribeFromChatRequests: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("chatRequestReceived");
    socket?.off("chatRequestAccepted");
  },
}));
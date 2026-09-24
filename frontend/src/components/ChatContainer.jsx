
import { useEffect, useRef, useMemo } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useP2PStore } from "../store/useP2PStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const { p2pEnabled, p2pStatus, p2pMessages, enableP2P, disableP2P, sendP2PMessage } = useP2PStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages]);

  // merge normal (server) messages with P2P messages into one timeline, sorted by time
  const combinedMessages = useMemo(() => {
    const normalized = messages.map((msg) => ({
      _id: msg._id,
      text: msg.text,
      image: msg.image,
      createdAt: msg.createdAt,
      isOwn: msg.senderId === authUser._id,
      isP2P: false,
    }));

    const p2pNormalized = p2pMessages.map((msg, idx) => ({
      _id: `p2p-${idx}-${msg.createdAt}`,
      text: msg.text,
      image: null,
      createdAt: msg.createdAt,
      isOwn: !msg.fromPeer,
      isP2P: true,
    }));

    return [...normalized, ...p2pNormalized].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [messages, p2pMessages, authUser._id]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [combinedMessages]);

  const canMessage = selectedUser.isConnected || p2pStatus === "connected";

  const handleToggleP2P = () => {
    if (p2pEnabled) {
      disableP2P();
    } else {
      enableP2P(selectedUser._id);
    }
  };

  return (
    <>
      <ChatHeader />

      {/* Offline mode toggle + status */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-slate-700/50">
        <button
          className={`btn btn-xs ${p2pEnabled ? "btn-success" : "btn-outline"}`}
          onClick={handleToggleP2P}
          disabled={!selectedUser.isConnected}
        >
          {p2pEnabled ? "Offline mode: ON" : "Enable offline mode"}
        </button>
        {p2pEnabled && (
          <span className="text-xs text-slate-400">
            {p2pStatus === "connected"
              ? "🟢 Direct connection active"
              : p2pStatus === "connecting"
              ? "🟡 Connecting..."
              : `🔴 ${p2pStatus}`}
          </span>
        )}
      </div>

      <div className="flex-1 px-6 overflow-y-auto py-8">
        {isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : !canMessage ? (
          <div className="not-connected-banner">
            Waiting for {selectedUser.fullName} to accept your chat request.
          </div>
        ) : combinedMessages.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {combinedMessages.map((msg) => (
              <div
                key={msg._id}
                className={`chat ${msg.isOwn ? "chat-end" : "chat-start"}`}
              >
                <div
                  className={`chat-bubble relative ${
                    msg.isOwn ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-200"
                  } ${msg.isP2P ? "border border-emerald-400/50" : ""}`}
                >
                  {msg.image && (
                    <img src={msg.image} alt="Shared" className="rounded-lg h-48 object-cover" />
                  )}
                  {msg.text && <p className="mt-2">{msg.text}</p>}
                  <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                    {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {msg.isP2P && <span title="Sent peer-to-peer">📡</span>}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>
        ) : (
          <NoChatHistoryPlaceholder />
        )}
      </div>

      {canMessage && <MessageInput useP2P={p2pStatus === "connected"} sendP2PMessage={sendP2PMessage} />}
    </>
  );
}

export default ChatContainer;
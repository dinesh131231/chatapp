import { useEffect } from "react";
import { useChatRequestStore } from "../store/useChatRequestStore";

const RequestsInbox = ({ onClose }) => {
  const { pendingRequests, getPendingRequests, respondToRequest } = useChatRequestStore();

  useEffect(() => {
    getPendingRequests();
  }, [getPendingRequests]);

  const handleRespond = async (id, action) => {
    await respondToRequest(id, action);
    if (pendingRequests.length <= 1) onClose?.(); // close if that was the last one
  };

  return (
    <div className="requests-inbox p-2">
      <h3 className="text-slate-200 font-medium mb-2">Chat Requests</h3>
      {pendingRequests.length === 0 && <p className="text-slate-400 text-sm">No pending requests</p>}
      {pendingRequests.map((req) => (
        <div key={req._id} className="flex items-center gap-2 p-2 hover:bg-slate-700/50 rounded">
          <img src={req.senderId.profilePic || "/avatar.png"} alt="" className="w-8 h-8 rounded-full" />
          <span className="flex-1 text-slate-200 text-sm">{req.senderId.fullName}</span>
          <button className="btn btn-xs btn-success" onClick={() => handleRespond(req._id, "accept")}>
            Accept
          </button>
          <button className="btn btn-xs btn-error" onClick={() => handleRespond(req._id, "reject")}>
            Reject
          </button>
        </div>
      ))}
    </div>
  );
};

export default RequestsInbox;
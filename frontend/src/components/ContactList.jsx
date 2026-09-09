// import { useEffect } from "react";
// import { useChatStore } from "../store/useChatStore";
// import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
// import { useAuthStore } from "../store/useAuthStore";

// function ContactList() {
//   const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } = useChatStore();
//   const { onlineUsers } = useAuthStore();

//   useEffect(() => {
//     getAllContacts();
//   }, [getAllContacts]);

//   if (isUsersLoading) return <UsersLoadingSkeleton />;

//   return (
//     <>
//       {allContacts.map((contact) => (
//         <div
//           key={contact._id}
//           className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
//           onClick={() => setSelectedUser(contact)}
//         >
//           <div className="flex items-center gap-3">
//             <div className={`avatar ${onlineUsers.includes(contact._id) ? "online" : "offline"}`}>
//               <div className="size-12 rounded-full">
//                 <img src={contact.profilePic || "/avatar.png"} />
//               </div>
//             </div>
//             <h4 className="text-slate-200 font-medium">{contact.fullName}</h4>
//           </div>
//         </div>
//       ))}
//     </>
//   );
// }
// export default ContactList;

import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useChatRequestStore } from "../store/useChatRequestStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { sentRequests, getSentRequests, sendChatRequest } = useChatRequestStore();

  useEffect(() => {
    getAllContacts();
    getSentRequests();
  }, [getAllContacts, getSentRequests]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  const getRequestStatus = (contactId) => {
    const req = sentRequests.find(
      (r) => r.receiverId === contactId || r.receiverId?._id === contactId
    );
    return req?.status; // undefined | "pending" | "accepted" | "rejected"
  };

  return (
    <>
      {allContacts.map((contact) => {
        const requestStatus = getRequestStatus(contact._id);
        const isConnected = contact.isConnected ?? requestStatus === "accepted";

        return (
          <div
            key={contact._id}
            className={`bg-cyan-500/10 p-4 rounded-lg transition-colors flex items-center justify-between gap-3 ${
              isConnected ? "cursor-pointer hover:bg-cyan-500/20" : ""
            }`}
           onClick={() => isConnected && setSelectedUser(contact)}
          >
            <div className="flex items-center gap-3">
              <div className={`avatar ${onlineUsers.includes(contact._id) ? "online" : "offline"}`}>
                <div className="size-12 rounded-full">
                  <img src={contact.profilePic || "/avatar.png"} />
                </div>
              </div>
              <h4 className="text-slate-200 font-medium">{contact.fullName}</h4>
            </div>

            {!isConnected && (
              <button
                className="btn btn-xs btn-outline"
                disabled={requestStatus === "pending"}
                onClick={(e) => {
                  e.stopPropagation(); 
                  sendChatRequest(contact._id);
                }}
              >
                {requestStatus === "pending" ? "Requested" : "Connect"}
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}
export default ContactList;
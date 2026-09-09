// import { useChatStore } from "../store/useChatStore";

// import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
// import ProfileHeader from "../components/ProfileHeader";
// import ActiveTabSwitch from "../components/ActiveTabSwitch";
// import ChatsList from "../components/ChatsList";
// import ContactList from "../components/ContactList";
// import ChatContainer from "../components/ChatContainer";
// import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

// function ChatPage() {
//   const { activeTab, selectedUser } = useChatStore();

//   return (
//     <div className="relative w-full max-w-6xl h-[800px]">
//       <BorderAnimatedContainer>
//         {/* LEFT SIDE */}
//         <div className="w-80 bg-slate-800/50 backdrop-blur-sm flex flex-col">
//           <ProfileHeader />
//           <ActiveTabSwitch />

//           <div className="flex-1 overflow-y-auto p-4 space-y-2">
//             {activeTab === "chats" ? <ChatsList /> : <ContactList />}
//           </div>
//         </div>

//         {/* RIGHT SIDE */}
//         <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm">
//           {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
//         </div>
//       </BorderAnimatedContainer>
//     </div>
//   );
// }
// export default ChatPage;

import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useChatRequestStore } from "../store/useChatRequestStore";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import RequestsInbox from "../components/RequestsInbox";
import { Bell } from "lucide-react";

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();
  const { pendingRequests } = useChatRequestStore();
  const [showRequests, setShowRequests] = useState(false);

  return (
    <div className="relative w-full max-w-6xl h-[800px]">
      <BorderAnimatedContainer>
        {/* LEFT SIDE */}
        <div className="w-80 bg-slate-800/50 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-2">
            <div className="flex-1">
              <ProfileHeader />
            </div>
            <div className="relative mr-2">
              <button
                className="p-2 rounded-full hover:bg-slate-700/50"
                onClick={() => setShowRequests((prev) => !prev)}
              >
                <Bell size={18} className="text-slate-200" />
                {pendingRequests.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              {showRequests && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <RequestsInbox onClose={() => setShowRequests(false)} />
                </div>
              )}
            </div>
          </div>

          <ActiveTabSwitch />

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm">
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}
export default ChatPage;
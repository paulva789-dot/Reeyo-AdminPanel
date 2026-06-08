import ChatSideBar from "./components/ChatSideBar";
import Chatwindow from "./components/Chatwindow";
import { useState } from "react";

const ChatPaage = () => {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="h-full flex">
      {/* chat side bar UI layout */}
      <div
        className={`w-full md:w-1/3 ${selectedUser ? "hidden md:block" : "block"}`}
      >
        <ChatSideBar onSelectUser={setSelectedUser} />
      </div>

      {/*chat window UI layout */}
      <div
        className={`w-full md:w-2/3 ${selectedUser ? "block" : "hidden md:block"}`}
      >
        {selectedUser ? (
          <Chatwindow
            selectedUser={selectedUser}
            onBack={() => setSelectedUser(null)}
          />
        ) : (
          <div className="hidden md:flex justify-center items-center h-full text-gray-400">
            Start a conversation
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPaage;

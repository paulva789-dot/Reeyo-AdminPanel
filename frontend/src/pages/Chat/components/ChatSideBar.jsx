import { useState } from "react";
import { chatUsers } from "../../../data/chatMocks";

const ChatSideBar = ({ onSelectUser }) => {
  const [activeTab, setActiveTab] = useState("riders");
  const users = chatUsers[activeTab] || [];

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r">
      {/*tabs layout */}
      <div className="flex border-b ">
        {["riders", "vendors", "customers"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 font-medium text-center transition ${activeTab === tab ? "border-b-2 border-orange-500 text-orange-500" : "text-gray-700"}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/*user list layout*/}
      <div className="flex-1 overflow-y-auto">
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => onSelectUser(user)}
            className="flex p-3 items-center hover:bg-orange-100 rounded-xl cursor-pointer transition"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full mr-3"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-700">{user.name}</div>
              <div className="text-sm text-gray-500 truncate">
                {user.lastMessage}
              </div>
            </div>
            <div className="text-xs text-gray-400">
              {new Date(user.lastMessageTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
        {users.lenght === 0 && (
          <div className="text-gray-400 text-center p-3">No users found</div>
        )}
      </div>
    </div>
  );
};

export default ChatSideBar;

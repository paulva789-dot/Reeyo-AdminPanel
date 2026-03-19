import { chatMessages, currentAdmin } from "../../../data/chatMocks";
import { Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const Chatwindow = ({ selectedUser, onBack }) => {
  if (!selectedUser) return null;

  const [allMessages, setAllMessages] = useState(chatMessages);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const messages = allMessages[selectedUser?.id] || [];

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      senderId: currentAdmin.id,
      content: input,
      timestamp: new Date().toISOString(),
    };
    setAllMessages((prev) => ({
      ...prev,
      [selectedUser.id]: [...(prev[selectedUser.id] || []), newMessage],
    }));
    setInput("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/*Chat messages nav bar or header layout*/}
      <div className="flex p-3 gap-3 border-b border-gray-200">
        <button
          className="text-gray-800 hover:text-gray-500 md:hidden font-bold text-xl"
          onClick={onBack}
        >
          ←
        </button>

        <img
          src={selectedUser.avatar}
          alt={selectedUser.name}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <div className="font-medium">{selectedUser.name}</div>
          <div className="text-xs text-gray-500">
            {selectedUser.isOnline ? "online" : "offline"}
          </div>
        </div>
      </div>

      {/*Chat messages layout */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isAdmin = msg.senderId === currentAdmin.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-3 py-2 max-w-xs text-sm  rounded rounded-tr-xl ${isAdmin ? "bg-blue-400 text-white" : "bg-orange-400 text-white"}`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/*The chat input layout*/}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <input
            className="outline-none rounded-xl px-3 py-2 flex-1 text-sm border"
            placeholder="type a message"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white rounded-lg px-4 flex items-center justify-center hover:bg-blue-600 transition"
            type="submit"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatwindow;

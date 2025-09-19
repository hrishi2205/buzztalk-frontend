import React, { useState, useEffect, useRef } from "react";
import { encryptMessage, decryptMessage } from "../../../utils/crypto.js";

const ChatWindow = ({ currentUser, socket, activeChat }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  let typingTimeout = useRef(null);

  // Set messages when the active chat changes
  useEffect(() => {
    setMessages(activeChat.messages || []);
  }, [activeChat]);

  // Automatically scroll to the bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set up socket listeners for new messages and typing indicators
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      // Only update state if the incoming message belongs to the currently active chat
      if (message.chatId === activeChat._id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleUserTyping = ({ userId }) => {
      // Add user to typing list if not already present
      if (!typingUsers.includes(userId)) {
        setTypingUsers((prev) => [...prev, userId]);
      }
    };

    const handleUserStoppedTyping = ({ userId }) => {
      // Remove user from typing list
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    };

    // Register listeners
    socket.on("newMessage", handleNewMessage);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);

    // Cleanup: remove listeners when component unmounts or socket changes
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
    };
  }, [socket, activeChat._id, typingUsers]);

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat.key) return;

    // Encrypt the message content before sending
    const encryptedContent = await encryptMessage(newMessage, activeChat.key);

    // Emit the 'sendMessage' event to the server
    socket.emit("sendMessage", {
      chatId: activeChat._id,
      content: JSON.stringify(encryptedContent),
    });

    // Reset input and clear typing indicator
    setNewMessage("");
    socket.emit("stopTyping", { chatId: activeChat._id });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  // Handle the typing indicator logic
  const handleTypingChange = (e) => {
    setNewMessage(e.target.value);
    if (!socket) return;

    // If user starts typing, emit 'startTyping' event
    if (!typingTimeout.current) {
      socket.emit("startTyping", { chatId: activeChat._id });
    } else {
      clearTimeout(typingTimeout.current);
    }

    // Set a timeout to emit 'stopTyping' after 2 seconds of inactivity
    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", { chatId: activeChat._id });
      typingTimeout.current = null;
    }, 2000);
  };

  return (
    <div className="hidden md:flex w-full md:w-2/3 flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-amber-200 bg-white flex items-center space-x-3 rounded-tr-2xl">
        <div className="relative">
          <img
            src={`https://i.pravatar.cc/40?u=${activeChat.friend.username}`}
            alt={activeChat.friend.username}
            className="w-10 h-10 rounded-full"
          />
          <span
            className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ${
              activeChat.friend.status === "online"
                ? "bg-green-500"
                : "bg-slate-500"
            } ring-2 ring-slate-800`}
          ></span>
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-900">
            {activeChat.friend.username}
          </h3>
          <p className="text-xs text-slate-500">{activeChat.friend.status}</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <Message
            key={msg._id}
            message={msg}
            currentUser={currentUser}
            chatKey={activeChat.key}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <div className="px-4 pb-1 text-sm text-slate-600 h-6">
        {typingUsers.length > 0 &&
          `${typingUsers.length} user${
            typingUsers.length > 1 ? "s" : ""
          } typing...`}
      </div>

      {/* Message Input Form */}
      <div className="p-4 bg-white border-t border-amber-200 rounded-br-2xl">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleTypingChange}
            placeholder="Type an encrypted message..."
            autoComplete="off"
            className="flex-1 p-3 bg-amber-50 rounded-md text-slate-800 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

// A sub-component responsible for rendering and decrypting a single message
const Message = ({ message, currentUser, chatKey }) => {
  const [decryptedContent, setDecryptedContent] = useState("Decrypting...");
  const isMine = message.senderId._id === currentUser._id;

  useEffect(() => {
    const decrypt = async () => {
      if (chatKey) {
        try {
          // Message content from server is a JSON string, so parse it first
          const content = await decryptMessage(
            JSON.parse(message.content),
            chatKey
          );
          setDecryptedContent(content);
        } catch (e) {
          setDecryptedContent("⚠️ Error decrypting message");
        }
      }
    };
    decrypt();
  }, [message.content, chatKey]);

  return (
    <div className={`flex mb-3 ${isMine ? "justify-end" : "justify-start"}`}>
      <div className="max-w-md">
        <div
          className={`text-xs text-slate-500 mb-1 ${
            isMine ? "text-right" : ""
          }`}
        >
          {message.senderId.username}
        </div>
        <div
          className={`px-4 py-2 rounded-lg break-words ${
            isMine
              ? "bg-amber-500 text-white rounded-br-none"
              : "bg-white border border-amber-200 text-slate-900 rounded-bl-none"
          }`}
        >
          {decryptedContent}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;

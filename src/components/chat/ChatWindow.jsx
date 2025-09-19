import React, { useState, useEffect, useRef } from "react";
import { encryptMessage, decryptMessage } from "../../../utils/crypto.js";

const ChatWindow = ({ currentUser, socket, activeChat, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [lastReadAtByOther, setLastReadAtByOther] = useState(null);
  const messagesEndRef = useRef(null);
  let typingTimeout = useRef(null);
  const inputRef = useRef(null);

  // Helpers: date formatting and grouping
  const isSameDay = (a, b) => {
    const da = new Date(a);
    const db = new Date(b);
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  };
  const dayLabel = (d) => {
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (isSameDay(date, today)) return "Today";
    if (isSameDay(date, yesterday)) return "Yesterday";
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };
  const timeLabel = (d) => {
    const date = new Date(d);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Set messages when the active chat changes
  useEffect(() => {
    setMessages(activeChat.messages || []);
  }, [activeChat]);

  // Automatically scroll to the bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [newMessage]);

  // Set up socket listeners for new messages and typing indicators
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      // Only update state if the incoming message belongs to the currently active chat
      if (message.chatId === activeChat._id) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          const incomingSender = message.senderId?._id || message.senderId;
          const lastSender = last?.senderId?._id || last?.senderId;
          if (
            last &&
            last.optimistic &&
            lastSender === incomingSender &&
            last.content === message.content
          ) {
            return [...prev.slice(0, -1), message];
          }
          return [...prev, message];
        });
      }
    };

    const handleMessagesRead = ({ chatId, userId, at }) => {
      if (chatId === activeChat._id && userId !== currentUser._id) {
        setLastReadAtByOther(at);
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
    socket.on("messagesRead", handleMessagesRead);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);

    // Cleanup: remove listeners when component unmounts or socket changes
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesRead", handleMessagesRead);
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
    const payload = JSON.stringify(encryptedContent);
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg = {
      _id: optimisticId,
      chatId: activeChat._id,
      senderId: { _id: currentUser._id, username: currentUser.username },
      content: payload,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    // Optimistically render the message
    setMessages((prev) => [...prev, optimisticMsg]);

    // Emit the 'sendMessage' event to the server
    socket.emit("sendMessage", {
      chatId: activeChat._id,
      content: payload,
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Trigger form submit
      if (newMessage.trim()) {
        const form = e.currentTarget.closest("form");
        form?.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true })
        );
      }
    }
  };

  // Prepare per-message adjacency markers for bubble shaping
  const enhanced = messages.map((m, idx, arr) => {
    const prev = arr[idx - 1];
    const next = arr[idx + 1];
    const mine = (m.senderId?._id || m.senderId) === currentUser._id;
    const prevSameSender =
      prev &&
      (prev.senderId?._id || prev.senderId) === (m.senderId?._id || m.senderId);
    const nextSameSender =
      next &&
      (next.senderId?._id || next.senderId) === (m.senderId?._id || m.senderId);
    const showAvatar = !mine && !nextSameSender; // show avatar for other user on last bubble in a sequence
    return { m, mine, prevSameSender, nextSameSender, showAvatar };
  });

  // Group messages by day for separators
  const groups = [];
  enhanced.forEach((item) => {
    const createdAt = item.m.createdAt || Date.now();
    const label = dayLabel(createdAt);
    const last = groups[groups.length - 1];
    if (!last || last.label !== label) {
      groups.push({ label, items: [item] });
    } else {
      last.items.push(item);
    }
  });

  return (
    <div className="flex w-full flex-col glass overflow-hidden md:rounded-r-2xl">
      {/* Chat Header */}
      <div className="p-4 border-b border-amber-200 bg-white/50 backdrop-blur-md flex items-center gap-3">
        {/* Mobile back button */}
        {onBack && (
          <button
            className="md:hidden mr-1 p-2 rounded-full bg-amber-100 text-amber-700 border border-amber-200 active:scale-95"
            onClick={onBack}
            aria-label="Back"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <div className="relative">
          <img
            src={
              activeChat.friend.avatarUrl ||
              `https://i.pravatar.cc/40?u=${activeChat.friend.username}`
            }
            alt={activeChat.friend.displayName || activeChat.friend.username}
            className="w-10 h-10 rounded-full"
          />
          <span
            className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${
              activeChat.friend.status === "online"
                ? "bg-green-500"
                : "bg-slate-400"
            }`}
          ></span>
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-900">
            {activeChat.friend.displayName || activeChat.friend.username}
          </h3>
          <p className="text-[11px] text-slate-500">
            @{activeChat.friend.username}
          </p>
          <p className="text-xs text-slate-500">
            {activeChat.friend.status === "online"
              ? "online"
              : activeChat.friend.lastSeen
              ? `last seen ${new Date(
                  activeChat.friend.lastSeen
                ).toLocaleString()}`
              : "offline"}
          </p>
        </div>
      </div>

      {/* Messages Container */}
  <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto bg-white/30">
        {groups.map((group) => (
          <div key={group.label}>
            {/* Day separator */}
            <div className="sticky top-0 z-0 mb-2 flex items-center justify-center">
              <span className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100/80 border border-amber-200 rounded-full">
                {group.label}
              </span>
            </div>
            {/* Messages in this day */}
            {group.items.map(({ m, mine, prevSameSender, nextSameSender, showAvatar }) => (
              <Message
                key={m._id}
                message={m}
                currentUser={currentUser}
                chatKey={activeChat.key}
                mine={mine}
                prevSameSender={prevSameSender}
                nextSameSender={nextSameSender}
                showAvatar={showAvatar}
                timeLabel={timeLabel(m.createdAt || Date.now())}
                lastReadAtByOther={lastReadAtByOther}
              />
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <div className="px-4 pb-1 h-6">
        {typingUsers.length > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-200 text-amber-800 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-pulse" />
            Someone is typing...
          </div>
        )}
      </div>

      {/* Message Input Form */}
      <div className="p-4 bg-white/40 backdrop-blur-md border-t border-amber-200">
        <form onSubmit={handleSendMessage} className="composer">
          {/* Attach */}
          <button type="button" className="toolbar-btn" title="Attach">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12.79V7a2 2 0 00-2-2h-5.79a2 2 0 00-1.41.59L3 14.39a2 2 0 000 2.83l3.78 3.78a2 2 0 002.83 0l8.39-8.39a2 2 0 000-2.83l-3.17-3.17"/></svg>
          </button>
          {/* Textarea */}
          <textarea
            ref={inputRef}
            rows={1}
            value={newMessage}
            onChange={handleTypingChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message (Shift+Enter for newline)"
            autoComplete="off"
            className="flex-1 bg-transparent outline-none resize-none text-slate-800 placeholder:text-slate-400 px-1 py-2"
          />
          {/* Emoji */}
          <button type="button" className="toolbar-btn" title="Emoji">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M15 9h.01M9 9h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </button>
          {/* Send */}
          <button type="submit" className="toolbar-btn brand-gradient text-white" title="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12l14-7-7 14-2-5-5-2z"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

// A sub-component responsible for rendering and decrypting a single message
const Message = ({
  message,
  currentUser,
  chatKey,
  mine,
  prevSameSender,
  nextSameSender,
  showAvatar,
  timeLabel,
  lastReadAtByOther,
}) => {
  const [decryptedContent, setDecryptedContent] = useState("Decrypting...");

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
    <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} mb-1 relative group`}>
      {!mine && showAvatar && (
        <img
          src={
            message.senderId.avatarUrl ||
            `https://i.pravatar.cc/28?u=${message.senderId.username}`
          }
          alt={message.senderId.displayName || message.senderId.username}
          className="w-7 h-7 rounded-full self-end"
        />
      )}
      <div className="max-w-[72%]">
        {/* Sender label (small, only when sequence changes) */}
        {!prevSameSender && (
          <div
            className={`text-[11px] text-slate-500 mb-1 ${
              mine ? "text-right" : ""
            }`}
          >
            {message.senderId.displayName || message.senderId.username}
          </div>
        )}
        <div className={`bubble ${mine ? "bubble-mine" : "bubble-other"} ${nextSameSender ? (mine ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md") : "rounded-2xl"}`}>
          {decryptedContent}
        </div>
        {/* Hover toolbar */}
        <div className="toolbar-floating opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button className="toolbar-btn" title="React">😄</button>
          <button className="toolbar-btn" title="Copy">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
          <button className="toolbar-btn" title="More">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
        </div>
        {/* Timestamp (tiny, subtle) */}
        <div
          className={`mt-1 text-[10px] text-slate-400 ${
            mine ? "text-right" : ""
          }`}
        >
          {timeLabel}
          {mine &&
          lastReadAtByOther &&
          new Date(message.createdAt) <= new Date(lastReadAtByOther) ? (
            <span className="ml-2 text-emerald-600">Seen</span>
          ) : null}
        </div>
      </div>
      {mine && <div className="w-7" />}
    </div>
  );
};

export default ChatWindow;

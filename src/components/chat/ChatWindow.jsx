import React, { useState, useEffect, useRef } from "react";
import {
  uploadChatFile,
  deleteChat,
  unfriendUser,
  blockUser,
} from "../../../utils/api.js";

const ChatWindow = ({ currentUser, socket, activeChat, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [lastReadAtByOther, setLastReadAtByOther] = useState(null);
  const messagesEndRef = useRef(null);
  let typingTimeout = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

    // Reactions: update message reactions in-place
    const handleMessageReaction = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    // Register listeners
    socket.on("newMessage", handleNewMessage);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);
    socket.on("messageReaction", handleMessageReaction);

    // If chat is deleted by you or friend, navigate away
    const handleChatDeleted = ({ chatId }) => {
      if (chatId === activeChat._id) {
        try {
          onBack?.();
        } catch {}
      }
    };
    socket.on("chatDeleted", handleChatDeleted);

    // Cleanup: remove listeners when component unmounts or socket changes
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
      socket.off("messageReaction", handleMessageReaction);
      socket.off("chatDeleted", handleChatDeleted);
    };
  }, [socket, activeChat._id, typingUsers]);

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Send plaintext content
    const payload = newMessage;
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
    socket.emit("sendMessage", { chatId: activeChat._id, content: payload });

    // Reset input and clear typing indicator
    setNewMessage("");
    socket.emit("stopTyping", { chatId: activeChat._id });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  // Insert a simple emoji at cursor/end
  const handleInsertEmoji = () => {
    const emoji = "😊";
    setNewMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  // Trigger file picker
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  // Handle selected file: upload, create attachment message (plaintext JSON), send
  const handleAttachFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so selecting same file again re-triggers change
    e.target.value = "";

    try {
      const token =
        localStorage.getItem("token") || currentUser?.token || undefined;
      const meta = await uploadChatFile(file, token);
      const attachment = {
        type: "attachment",
        url: meta.url,
        filename: meta.filename || file.name,
        mimetype: meta.mimetype || file.type,
        size: meta.size || file.size,
      };

      // Send attachment as JSON string payload (no encryption)
      const payload = JSON.stringify(attachment);

      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMsg = {
        _id: optimisticId,
        chatId: activeChat._id,
        senderId: { _id: currentUser._id, username: currentUser.username },
        content: payload,
        createdAt: new Date().toISOString(),
        optimistic: true,
        reactions: [],
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      socket.emit("sendMessage", { chatId: activeChat._id, content: payload });
    } catch (err) {
      console.error("Attachment send failed:", err);
      // Optionally show a toast here if a toast system exists
    }
  };

  // Toggle a reaction on a message
  const handleToggleReaction = (messageId, emoji) => {
    if (!socket) return;
    socket.emit("reactMessage", { messageId, emoji });
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

  // Delete chat (with confirm)
  const handleDeleteChat = async () => {
    if (!activeChat?._id) return;
    const ok = window.confirm(
      "Delete this chat for both participants? This will remove all messages."
    );
    if (!ok) return;
    try {
      const token =
        localStorage.getItem("token") || currentUser?.token || undefined;
      await deleteChat(activeChat._id, token);
      onBack?.();
    } catch (e) {
      console.error("Delete chat failed:", e);
      alert(e?.message || "Failed to delete chat");
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
    <div className="flex w-full h-full flex-col glass overflow-hidden md:rounded-lg shadow-2xl border border-amber-200/50">
      {/* Chat Header */}
      <div className="p-3 md:p-4 border-b border-amber-200/60 bg-gradient-to-r from-white/70 to-amber-100/70 backdrop-blur-xl flex items-center gap-2 md:gap-3 relative z-30 shadow-sm">
        {/* Mobile back button */}
        {onBack && (
          <button
            className="md:hidden mr-2 p-2.5 rounded-xl bg-white/80 text-amber-700 border border-amber-300/60 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200 shadow-md"
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
        <div className="relative group">
          <img
            src={
              activeChat.friend.avatarUrl ||
              `https://i.pravatar.cc/40?u=${activeChat.friend.username}`
            }
            alt={activeChat.friend.displayName || activeChat.friend.username}
            className="w-12 h-12 rounded-full object-cover ring-3 ring-amber-300/60 shadow-lg group-hover:ring-amber-400 group-hover:scale-105 transition-all duration-300"
          />
          <span
            className={`absolute -bottom-0.5 -right-0.5 block h-3.5 w-3.5 rounded-full ring-2 ring-white shadow-sm ${
              activeChat.friend.status === "online"
                ? "bg-green-500 animate-pulse"
                : "bg-slate-400"
            }`}
          ></span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-base md:text-lg bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent truncate">
            {activeChat.friend.displayName || activeChat.friend.username}
          </h3>
          <p className="text-xs text-amber-600/80 truncate flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                activeChat.friend.status === "online"
                  ? "bg-green-500 animate-pulse"
                  : "bg-slate-400"
              }`}
            />
            @{activeChat.friend.username}
          </p>
          <p className="text-xs text-slate-600 truncate flex items-center gap-1">
            {activeChat.friend.status === "online" ? (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-600 font-medium">Active now</span>
              </>
            ) : activeChat.friend.lastSeen ? (
              <>
                <span className="w-2 h-2 bg-slate-400 rounded-full" />
                <span>
                  last seen{" "}
                  {new Date(activeChat.friend.lastSeen).toLocaleString()}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-slate-400 rounded-full" />
                <span>offline</span>
              </>
            )}
          </p>
        </div>
        {/* Header actions */}
        <div className="ml-auto flex items-center gap-3 shrink-0 relative z-40">
          {/* Overflow menu */}
          <button
            className="p-2.5 rounded-xl bg-white/80 text-amber-700 border border-amber-300/60 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200 shadow-md"
            title="More"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More options"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 z-50 w-44 bg-white border border-amber-200 rounded-lg shadow-lg overflow-hidden">
              <button
                className="w-full text-left px-3 py-2 hover:bg-amber-50 text-slate-800"
                onClick={async () => {
                  setMenuOpen(false);
                  try {
                    const token =
                      localStorage.getItem("token") || currentUser?.token;
                    await unfriendUser(activeChat.friend._id, token);
                    alert(
                      "Unfriended. You can no longer chat unless you add each other again."
                    );
                  } catch (e) {
                    alert(e?.message || "Failed to unfriend");
                  }
                }}
              >
                Unfriend
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-amber-50 text-red-600"
                onClick={async () => {
                  setMenuOpen(false);
                  const ok = window.confirm(
                    "Block this user? They won’t be able to message you."
                  );
                  if (!ok) return;
                  try {
                    const token =
                      localStorage.getItem("token") || currentUser?.token;
                    await blockUser(activeChat.friend._id, token);
                    alert("User blocked.");
                  } catch (e) {
                    alert(e?.message || "Failed to block user");
                  }
                }}
              >
                Block
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-amber-50 text-slate-800"
                onClick={() => {
                  setMenuOpen(false);
                  handleDeleteChat();
                }}
              >
                Delete chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 p-3 md:p-6 space-y-3 md:space-y-4 overflow-y-auto bg-white/30">
        {groups.map((group) => (
          <div key={group.label}>
            {/* Day separator */}
            <div className="sticky top-0 z-0 mb-2 flex items-center justify-center">
              <span className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100/80 border border-amber-200 rounded-full">
                {group.label}
              </span>
            </div>
            {/* Messages in this day */}
            {group.items.map(
              ({ m, mine, prevSameSender, nextSameSender, showAvatar }) => (
                <Message
                  key={m._id}
                  message={m}
                  currentUser={currentUser}
                  mine={mine}
                  prevSameSender={prevSameSender}
                  nextSameSender={nextSameSender}
                  showAvatar={showAvatar}
                  timeLabel={timeLabel(m.createdAt || Date.now())}
                  lastReadAtByOther={lastReadAtByOther}
                  onToggleReaction={handleToggleReaction}
                />
              )
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <div className="px-3 md:px-4 pb-1 h-6">
        {typingUsers.length > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-200 text-amber-800 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-pulse" />
            Someone is typing...
          </div>
        )}
      </div>

      {/* Message Input Form */}
      <div className="p-2.5 md:p-4 bg-white/40 backdrop-blur-md border-t border-amber-200">
        <form onSubmit={handleSendMessage} className="composer">
          {/* Attach */}
          <button
            type="button"
            className="toolbar-btn"
            title="Attach"
            onClick={handleAttachClick}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 12.79V7a2 2 0 00-2-2h-5.79a2 2 0 00-1.41.59L3 14.39a2 2 0 000 2.83l3.78 3.78a2 2 0 002.83 0l8.39-8.39a2 2 0 000-2.83l-3.17-3.17"
              />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleAttachFile}
          />
          {/* Textarea */}
          <textarea
            ref={inputRef}
            rows={1}
            value={newMessage}
            onChange={handleTypingChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            autoComplete="off"
            className="flex-1 bg-transparent outline-none resize-none text-slate-800 placeholder:text-slate-400 px-1 py-2"
          />
          {/* Emoji */}
          <button
            type="button"
            className="toolbar-btn"
            title="Emoji"
            onClick={handleInsertEmoji}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14.828 14.828a4 4 0 01-5.656 0M15 9h.01M9 9h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          {/* Send */}
          <button
            type="submit"
            className="toolbar-btn brand-gradient text-white"
            title="Send"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 12l14-7-7 14-2-5-5-2z"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

// A sub-component responsible for rendering a single message (plaintext or attachment JSON)
const Message = ({
  message,
  currentUser,
  mine,
  prevSameSender,
  nextSameSender,
  showAvatar,
  timeLabel,
  lastReadAtByOther,
  onToggleReaction,
}) => {
  const [displayContent, setDisplayContent] = useState("");
  const [contentObj, setContentObj] = useState(null);

  useEffect(() => {
    const content = message?.content || "";
    // Try to parse as JSON for attachment support
    try {
      const parsed = JSON.parse(content);
      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.type === "attachment"
      ) {
        setContentObj(parsed);
        setDisplayContent("");
      } else if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray(parsed.iv) &&
        Array.isArray(parsed.ciphertext)
      ) {
        // Legacy encrypted message – cannot decrypt after removing E2EE
        setContentObj(null);
        setDisplayContent("🔒 Encrypted (legacy message)");
      } else {
        setContentObj(null);
        setDisplayContent(content);
      }
    } catch {
      // Plain text
      setContentObj(null);
      setDisplayContent(content);
    }
  }, [message?.content]);

  return (
    <div
      className={`flex items-end gap-2 ${
        mine ? "justify-end" : "justify-start"
      } mb-1 relative group`}
    >
      {!mine && showAvatar && (
        <img
          src={
            message.senderId.avatarUrl ||
            `https://i.pravatar.cc/28?u=${message.senderId.username}`
          }
          alt={message.senderId.displayName || message.senderId.username}
          className="w-7 h-7 rounded-full object-cover self-end"
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
        <div
          className={`bubble ${mine ? "bubble-mine" : "bubble-other"} ${
            nextSameSender
              ? mine
                ? "rounded-2xl rounded-br-md"
                : "rounded-2xl rounded-bl-md"
              : "rounded-2xl"
          }`}
        >
          {contentObj && contentObj.type === "attachment" ? (
            <AttachmentPreview attachment={contentObj} />
          ) : (
            displayContent
          )}
        </div>
        {/* Reactions row */}
        {Array.isArray(message.reactions) && message.reactions.length > 0 && (
          <div className={`mt-1 flex gap-1 ${mine ? "justify-end" : ""}`}>
            {Object.entries(
              message.reactions.reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {})
            ).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onToggleReaction?.(message._id, emoji)}
                className="px-2 py-0.5 text-xs rounded-full bg-white/60 border border-amber-200 shadow-sm hover:bg-white/80 active:scale-95"
                title="Toggle reaction"
              >
                <span className="mr-1">{emoji}</span>
                <span className="text-slate-600">{count}</span>
              </button>
            ))}
          </div>
        )}
        {/* Hover toolbar */}
        <div className="toolbar-floating opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            className="toolbar-btn"
            title="React"
            onClick={() => onToggleReaction?.(message._id, "👍")}
          >
            😄
          </button>
          <button className="toolbar-btn" title="Copy">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </button>
          <button className="toolbar-btn" title="More">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
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

// Lightweight attachment previewer
const prettySize = (bytes) => {
  if (bytes == null) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};

const AttachmentPreview = ({ attachment }) => {
  const { url, filename, mimetype, size } = attachment || {};
  const isImage = /^image\//i.test(mimetype || "");
  return (
    <div className="flex flex-col gap-1">
      {isImage ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt={filename || "image"}
            className="max-h-64 max-w-full rounded-lg border border-amber-200/60 shadow-sm"
            loading="lazy"
          />
        </a>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 border border-amber-200 shadow-sm hover:bg-white/80"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          <span className="text-sm text-slate-800">{filename || "file"}</span>
          <span className="text-xs text-slate-500">{prettySize(size)}</span>
        </a>
      )}
    </div>
  );
};

import React, { useState, useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import { apiRequest, SOCKET_URL } from "../../../utils/api";

import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import AddFriendModal from "./AddFriendModal";
import FriendRequestsModal from "./FriendRequestsModal";
import SettingsModal from "./SettingsModal";
import AnimateIn from "../motion/AnimateIn";
// Encryption removed: UnlockKeyModal no longer used

// Polished All Friends modal with mobile bottom-sheet style
const AllFriendsModal = ({ open, friends, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-md sm:mx-4 bg-white/80 backdrop-blur-md border border-amber-200 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] sm:max-h-[80vh] overflow-hidden">
        <div className="relative p-4 border-b border-amber-200 bg-gradient-to-r from-amber-100 to-amber-200">
          <h3 className="text-base sm:text-lg font-bold text-amber-800">
            All Friends
          </h3>
          <button
            className="absolute right-3 top-3 px-3 py-1 rounded-lg bg-white/70 text-amber-700 border border-amber-200 hover:bg-white active:scale-95"
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </button>
        </div>
        <div className="p-2 sm:p-3 overflow-y-auto divide-y divide-amber-100 max-h-[calc(92vh-64px)] sm:max-h-[calc(80vh-64px)]">
          {friends?.length ? (
            friends.map((f) => (
              <div
                key={f._id}
                className="flex items-center gap-3 py-3 px-2 hover:bg-amber-50/60 transition-colors rounded-xl"
              >
                <div className="relative shrink-0">
                  <img
                    src={
                      f.avatarUrl || `https://i.pravatar.cc/40?u=${f.username}`
                    }
                    alt={f.displayName || f.username}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                  <span
                    className={`absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white ${
                      f.status === "online" ? "bg-green-500" : "bg-slate-400"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 truncate">
                    {f.displayName || f.username}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    @{f.username}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-slate-600 text-sm p-3">No friends yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatView = ({ currentUser, onLogout, onAlert, onCurrentUserUpdated }) => {
  const [socket, setSocket] = useState(null);
  const [friends, setFriends] = useState([]);
  const [unreads, setUnreads] = useState({}); // friendId -> count
  const [friendRequests, setFriendRequests] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  // Encryption removed: no shared chat keys
  const [chatMap, setChatMap] = useState({}); // chatId -> friendId
  const [isAddFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [isRequestsModalOpen, setRequestsModalOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isAllFriendsOpen, setAllFriendsOpen] = useState(false);
  const [friendLastTs, setFriendLastTs] = useState({}); // friendId -> last message ts
  // Encryption removed: no unlock/warmup
  const [openBusy, setOpenBusy] = useState({}); // friendId -> bool
  // Refs to avoid effect re-subscription storms
  const activeChatRef = useRef(null);
  const chatMapRef = useRef({});
  const fetchCooldownRef = useRef(0);
  const retriedTransportRef = useRef(false);
  const lastAlertAtRef = useRef(0);

  const fetchData = useCallback(async () => {
    try {
      const [friendsData, requestsData, chats] = await Promise.all([
        apiRequest("users/friends", "GET", null, currentUser.token),
        apiRequest("users/friend-requests", "GET", null, currentUser.token),
        apiRequest("chats", "GET", null, currentUser.token),
      ]);
      setFriends(friendsData);
      setFriendRequests(requestsData);
      // Map unread counts by friend (one-to-one chats only) and build chatId -> friendId mapping
      const map = {};
      const cMap = {};
      chats.forEach((chat) => {
        if (
          Array.isArray(chat.participants) &&
          chat.participants.length === 2
        ) {
          const other = chat.participants.find(
            (p) => p._id !== currentUser._id
          );
          if (other) {
            map[other._id] = chat.unread || 0;
            cMap[chat._id] = other._id;
          }
        }
      });
      setUnreads(map);
      setChatMap(cMap);
      // Build last timestamp per friend from chat.lastMessage
      const ts = {};
      chats.forEach((chat) => {
        const other = (chat.participants || []).find(
          (p) => p._id !== currentUser._id
        );
        const last =
          chat.lastMessage?.createdAt || chat.updatedAt || chat.createdAt;
        if (other && last) ts[other._id] = new Date(last).getTime();
      });
      setFriendLastTs(ts);
    } catch (error) {
      onAlert(error.message, "error");
    }
  }, [currentUser.token, onAlert]);

  // Encryption removed: no private key unlock prompt
  // Socket setup with websocket-first and fallback
  useEffect(() => {
    retriedTransportRef.current = false;

    const attachHandlers = (sock) => {
      const onConnectError = (err) => {
        const now = Date.now();
        if (now - lastAlertAtRef.current > 2000) {
          onAlert(`Socket error: ${err.message}`, "error");
          lastAlertAtRef.current = now;
        }
        // Fallback: if websocket-only failed and we haven't retried yet, try polling+websocket
        if (
          !retriedTransportRef.current &&
          sock.io.opts.transports?.length === 1
        ) {
          retriedTransportRef.current = true;
          try {
            sock.off("connect_error", onConnectError);
            sock.disconnect();
          } catch {}
          const alt = io(SOCKET_URL, {
            auth: { token: currentUser.token },
            path: "/socket.io",
            transports: ["polling", "websocket"],
            withCredentials: true,
          });
          setSocket(alt);
          // attach handlers to the fallback socket
          cleanupRef.current = attachHandlers(alt);
        }
      };

      const onBasicUpdate = () => {
        const now = Date.now();
        if (now < fetchCooldownRef.current) return;
        fetchCooldownRef.current = now + 1000; // throttle to 1s
        fetchData();
      };

      const onNewMessage = (message) => {
        if (!message || !message.chatId) return;
        const ac = activeChatRef.current;
        const isActive = ac && message.chatId === ac._id;
        const senderId = message.senderId?._id || message.senderId;

        // Update friend last message timestamp to move them to top
        const friendId = chatMapRef.current[message.chatId];
        if (friendId) {
          const messageTime = new Date(
            message.createdAt || Date.now()
          ).getTime();
          console.log(
            `📨 New message from friend ${friendId}, updating timestamp to ${messageTime}`
          );
          setFriendLastTs((prev) => {
            const updated = {
              ...prev,
              [friendId]: messageTime,
            };
            console.log("🔄 Updated friendLastTs:", updated);
            return updated;
          });
        }

        if (!isActive && senderId !== currentUser._id) {
          if (friendId) {
            setUnreads((prev) => ({
              ...prev,
              [friendId]: (prev[friendId] || 0) + 1,
            }));
          } else {
            onBasicUpdate();
          }
        }
      };

      const onMessagesRead = ({ chatId, userId, at }) => {
        // If the other user read messages in currently open chat, we can optionally update state
        // We'll let ChatWindow show a read indicator for your last message when it sees this event
      };

      const onFriendOffline = (payload) => {
        const { userId, lastSeen } =
          typeof payload === "object" ? payload : { userId: payload };
        setFriends((prev) =>
          prev.map((f) =>
            f._id === userId ? { ...f, status: "offline", lastSeen } : f
          )
        );
      };

      sock.on("connect_error", onConnectError);
      sock.on("newFriendRequest", onBasicUpdate);
      sock.on("friendRequestAccepted", onBasicUpdate);
      sock.on("friendOnline", onBasicUpdate);
      sock.on("friendOffline", onFriendOffline);
      sock.on("messagesRead", onMessagesRead);
      sock.on("newMessage", onNewMessage);

      // Initial data load
      onBasicUpdate();

      // Cleanup handler for this socket instance
      return () => {
        try {
          sock.off("connect_error", onConnectError);
          sock.off("newFriendRequest", onBasicUpdate);
          sock.off("friendRequestAccepted", onBasicUpdate);
          sock.off("friendOnline", onBasicUpdate);
          sock.off("friendOffline", onFriendOffline);
          sock.off("messagesRead", onMessagesRead);
          sock.off("newMessage", onNewMessage);
          sock.disconnect();
        } catch {}
      };
    };

    // keep a ref to current cleanup to allow replacing on fallback
    const cleanupRef = { current: null };

    // Choose initial transports based on host: in production, start with polling+websocket for compatibility
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    const isProdHost =
      /(^|\.)buzztalk\.me$/i.test(host) || /\.netlify\.app$/i.test(host);
    const initialTransports = isProdHost
      ? ["polling", "websocket"]
      : ["websocket"];

    // First attempt: websocket-only
    const s = io(SOCKET_URL, {
      auth: { token: currentUser.token },
      path: "/socket.io",
      transports: initialTransports,
      forceNew: true,
      timeout: 6000,
      reconnectionAttempts: 3,
      withCredentials: true,
    });
    setSocket(s);
    cleanupRef.current = attachHandlers(s);

    return () => {
      try {
        cleanupRef.current?.();
      } catch {}
    };
  }, [currentUser.token, fetchData, onAlert]);

  // Keep refs in sync without retriggering socket setup
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);
  useEffect(() => {
    chatMapRef.current = chatMap;
  }, [chatMap]);

  // Encryption removed: no shared key warmup

  const handleSelectFriend = async (friend) => {
    if (friend?.__openSettings) {
      setSettingsOpen(true);
      return;
    }

    // Toggle functionality: if clicking on already active chat, close it
    if (activeChat?.friend._id === friend._id) {
      setActiveChat(null);
      return;
    }

    try {
      if (openBusy[friend._id]) return;
      setOpenBusy((m) => ({ ...m, [friend._id]: true }));
      const chat = await apiRequest(
        "chats",
        "POST",
        { friendId: friend._id },
        currentUser.token
      );
      const messages = await apiRequest(
        `chats/${chat._id}/messages`,
        "GET",
        null,
        currentUser.token
      );
      // Mark as read on open
      try {
        await apiRequest(
          `chats/${chat._id}/read`,
          "POST",
          {},
          currentUser.token
        );
      } catch {}
      setUnreads((prev) => ({ ...prev, [friend._id]: 0 }));
      // No shared key; use plaintext
      setActiveChat({ ...chat, friend, messages });
      // Ensure socket joins this chat's room to receive real-time messages
      try {
        socket?.emit("joinChat", { chatId: chat._id });
      } catch {}
    } catch (error) {
      onAlert(error.message, "error");
    } finally {
      setOpenBusy((m) => ({ ...m, [friend._id]: false }));
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 text-slate-900">
      <div className="h-full w-full overflow-hidden relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-300/20 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        {/* Mobile flow */}
        <div className="md:hidden h-full w-full flex relative z-10">
          {!activeChat ? (
            <Sidebar
              currentUser={currentUser}
              friends={(() => {
                const sortedFriends = [...friends].sort(
                  (a, b) =>
                    (friendLastTs[b._id] || 0) - (friendLastTs[a._id] || 0)
                );
                console.log(
                  "👥 Sorted friends:",
                  sortedFriends.map((f) => ({
                    name: f.displayName || f.username,
                    timestamp: friendLastTs[f._id] || 0,
                    date: friendLastTs[f._id]
                      ? new Date(friendLastTs[f._id]).toLocaleString()
                      : "No messages",
                  }))
                );
                return sortedFriends;
              })()}
              unreads={unreads}
              requests={friendRequests}
              onLogout={onLogout}
              onAddFriend={() => setAddFriendModalOpen(true)}
              onShowRequests={() => setRequestsModalOpen(true)}
              onSelectFriend={handleSelectFriend}
              onOpenSettings={() => setSettingsOpen(true)}
              onShowAllFriends={() => setAllFriendsOpen(true)}
              activeChat={activeChat}
            />
          ) : (
            <ChatWindow
              currentUser={currentUser}
              socket={socket}
              activeChat={activeChat}
              onBack={() => setActiveChat(null)}
            />
          )}
        </div>

        {/* Desktop/Tablet split */}
        <div className="hidden md:flex h-full w-full relative z-10">
          <div className="md:w-80 lg:w-96 shrink-0 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-100/50 to-orange-100/50 backdrop-blur-xl" />
            <AnimateIn
              type="left"
              duration={0.2}
              className="h-full relative z-10"
            >
              <Sidebar
                currentUser={currentUser}
                friends={(() => {
                  const sortedFriends = [...friends].sort(
                    (a, b) =>
                      (friendLastTs[b._id] || 0) - (friendLastTs[a._id] || 0)
                  );
                  return sortedFriends;
                })()}
                unreads={unreads}
                requests={friendRequests}
                onLogout={onLogout}
                onAddFriend={() => setAddFriendModalOpen(true)}
                onShowRequests={() => setRequestsModalOpen(true)}
                onSelectFriend={handleSelectFriend}
                onOpenSettings={() => setSettingsOpen(true)}
                onShowAllFriends={() => setAllFriendsOpen(true)}
                activeChat={activeChat}
              />
            </AnimateIn>
          </div>
          <div className="flex-1 min-w-0 flex relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-amber-50/60 backdrop-blur-xl" />
            {activeChat ? (
              <AnimateIn
                type="up"
                duration={0.15}
                className="flex-1 min-w-0 flex relative z-10"
              >
                <ChatWindow
                  currentUser={currentUser}
                  socket={socket}
                  activeChat={activeChat}
                  onBack={() => setActiveChat(null)}
                />
              </AnimateIn>
            ) : (
              <AnimateIn
                type="fade"
                duration={0.2}
                className="h-full w-full relative z-10"
              >
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-600 relative">
                  {/* Hexagon pattern background */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-16 h-16 bg-amber-400 [clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)] animate-bounce" />
                    <div className="absolute top-40 right-32 w-12 h-12 bg-orange-400 [clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)] animate-bounce delay-300" />
                    <div className="absolute bottom-32 left-40 w-20 h-20 bg-yellow-400 [clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)] animate-bounce delay-700" />
                  </div>

                  {/* Main content */}
                  <div className="text-center space-y-6 max-w-md mx-auto px-8">
                    <div className="relative">
                      <div className="w-32 h-32 mx-auto mb-6 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-ping opacity-20" />
                        <div className="absolute inset-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-16 h-16 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        Ready to Buzz? 🐝
                      </h3>
                      <p className="text-lg text-slate-600">
                        Select a friend from your hive to start an encrypted
                        conversation
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sm text-amber-700 bg-amber-100/60 px-4 py-2 rounded-full border border-amber-200">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        End-to-end encrypted
                      </div>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            )}
          </div>
        </div>
      </div>

      {isAddFriendModalOpen && (
        <AddFriendModal
          currentUser={currentUser}
          socket={socket}
          onClose={() => setAddFriendModalOpen(false)}
          onAlert={onAlert}
        />
      )}
      {isRequestsModalOpen && (
        <FriendRequestsModal
          currentUser={currentUser}
          socket={socket}
          requests={friendRequests}
          onClose={() => setRequestsModalOpen(false)}
          onAlert={onAlert}
          onRequestsUpdated={fetchData}
        />
      )}
      {isSettingsOpen && (
        <SettingsModal
          currentUser={currentUser}
          onClose={() => setSettingsOpen(false)}
          onAlert={onAlert}
          onUpdated={(updated) => {
            // Update currentUser centrally so all components reflect changes
            onCurrentUserUpdated?.(updated);
            // Refresh friends list to pick up possible changes
            fetchData();
          }}
        />
      )}
      {isAllFriendsOpen && (
        <AllFriendsModal
          open={isAllFriendsOpen}
          friends={[...friends].sort(
            (a, b) => (friendLastTs[b._id] || 0) - (friendLastTs[a._id] || 0)
          )}
          onClose={() => setAllFriendsOpen(false)}
        />
      )}
      {/* Encryption removed: unlock modal no longer shown */}
    </div>
  );
};

export default ChatView;

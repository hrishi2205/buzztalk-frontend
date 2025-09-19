import React, { useState, useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import { apiRequest, SOCKET_URL } from "../../../utils/api";
import {
  importKey,
  deriveSharedSecret,
  normalizeEcPublicJwk,
} from "../../../utils/crypto";

import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import AddFriendModal from "./AddFriendModal";
import FriendRequestsModal from "./FriendRequestsModal";
import SettingsModal from "./SettingsModal";

const ChatView = ({ currentUser, onLogout, onAlert, onCurrentUserUpdated }) => {
  const [socket, setSocket] = useState(null);
  const [friends, setFriends] = useState([]);
  const [unreads, setUnreads] = useState({}); // friendId -> count
  const [friendRequests, setFriendRequests] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatKeys, setChatKeys] = useState({});
  const [chatMap, setChatMap] = useState({}); // chatId -> friendId
  const [isAddFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [isRequestsModalOpen, setRequestsModalOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isWarmupDone, setIsWarmupDone] = useState(false);
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
    } catch (error) {
      onAlert(error.message, "error");
    }
  }, [currentUser.token, onAlert]);
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
        if (!isActive && senderId !== currentUser._id) {
          const friendId = chatMapRef.current[message.chatId];
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

  useEffect(() => {
    (async () => {
      if (!friends?.length || isWarmupDone) return;
      try {
        const privStr =
          currentUser?.__privateKey ||
          localStorage.getItem(`privateKey_${currentUser.username}`);
        if (!privStr) return;
        const myPrivateKey = await importKey(privStr, true);
        const entries = await Promise.all(
          friends.map(async (f) => {
            try {
              const normalizedJwk = normalizeEcPublicJwk(f.publicKey);
              const otherPublicKey = await importKey(normalizedJwk);
              const key = await deriveSharedSecret(
                myPrivateKey,
                otherPublicKey
              );
              return [f._id, key];
            } catch {
              return null;
            }
          })
        );
        const precomputed = entries.reduce((acc, pair) => {
          if (pair) acc[pair[0]] = pair[1];
          return acc;
        }, {});
        if (Object.keys(precomputed).length) {
          setChatKeys((prev) => ({ ...prev, ...precomputed }));
        }
        setIsWarmupDone(true);
      } catch {
        // ignore warmup errors
      }
    })();
  }, [friends, currentUser.username, isWarmupDone]);

  const handleSelectFriend = async (friend) => {
    if (friend?.__openSettings) {
      setSettingsOpen(true);
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
      let sharedKey = chatKeys[friend._id];
      if (!sharedKey) {
        const privStr =
          currentUser?.__privateKey ||
          localStorage.getItem(`privateKey_${currentUser.username}`);
        if (!privStr) {
          throw new Error("Missing private key");
        }
        const myPrivateKey = await importKey(privStr, true);
        const normalizedJwk = normalizeEcPublicJwk(friend.publicKey);
        const otherPublicKey = await importKey(normalizedJwk);
        sharedKey = await deriveSharedSecret(myPrivateKey, otherPublicKey);
        setChatKeys((prev) => ({ ...prev, [friend._id]: sharedKey }));
      }
      setActiveChat({ ...chat, friend, messages, key: sharedKey });
      // Ensure socket joins this chat's room to receive real-time messages
      try {
        socket?.emit("joinChat", { chatId: chat._id });
      } catch {}
    } catch (error) {
      const msg = /Cannot create a key using the specified key usages/i.test(
        error?.message || ""
      )
        ? "Encryption setup failed. Please log out, log back in, and try again."
        : error.message;
      onAlert(msg, "error");
    } finally {
      setOpenBusy((m) => ({ ...m, [friend._id]: false }));
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-b from-yellow-50 to-amber-100 text-slate-900">
      {/* Mobile flow */}
      <div className="md:hidden h-full w-full flex">
        {!activeChat ? (
          <Sidebar
            currentUser={currentUser}
            friends={friends}
            unreads={unreads}
            requests={friendRequests}
            onLogout={onLogout}
            onAddFriend={() => setAddFriendModalOpen(true)}
            onShowRequests={() => setRequestsModalOpen(true)}
            onSelectFriend={handleSelectFriend}
            onOpenSettings={() => setSettingsOpen(true)}
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
      <div className="hidden md:flex h-full w-full">
        <div className="md:w-80 lg:w-96 shrink-0">
          <Sidebar
            currentUser={currentUser}
            friends={friends}
            unreads={unreads}
            requests={friendRequests}
            onLogout={onLogout}
            onAddFriend={() => setAddFriendModalOpen(true)}
            onShowRequests={() => setRequestsModalOpen(true)}
            onSelectFriend={handleSelectFriend}
            onOpenSettings={() => setSettingsOpen(true)}
            activeChat={activeChat}
          />
        </div>
        <div className="flex-1 min-w-0 flex">
          {activeChat ? (
            <ChatWindow
              currentUser={currentUser}
              socket={socket}
              activeChat={activeChat}
              onBack={() => setActiveChat(null)}
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-500">
              <svg
                className="w-24 h-24 mb-4"
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
              <p className="text-lg">Select a friend to start a conversation</p>
            </div>
          )}
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
    </div>
  );
};

export default ChatView;

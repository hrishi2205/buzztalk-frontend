import React, { useState, useEffect, useCallback } from "react";
import io from "socket.io-client";
import { apiRequest } from "../../../utils/api";
import { importKey, deriveSharedSecret } from "../../../utils/crypto";

import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import AddFriendModal from "./AddFriendModal";
import FriendRequestsModal from "./FriendRequestsModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ChatView = ({ currentUser, onLogout, onAlert }) => {
  const [socket, setSocket] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatKeys, setChatKeys] = useState({}); // Stores derived AES keys { friendId: CryptoKey }
  const [isAddFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [isRequestsModalOpen, setRequestsModalOpen] = useState(false);

  // Function to fetch all user data, wrapped in useCallback for stability
  const fetchData = useCallback(async () => {
    try {
      const [friendsData, requestsData] = await Promise.all([
        apiRequest("users/friends", "GET", null, currentUser.token),
        apiRequest("users/friend-requests", "GET", null, currentUser.token),
      ]);
      setFriends(friendsData);
      setFriendRequests(requestsData);
    } catch (error) {
      onAlert(error.message, "error");
    }
  }, [currentUser.token, onAlert]);

  // Effect for initial data fetch and establishing the socket connection
  useEffect(() => {
    fetchData();

    const newSocket = io(API_URL, { auth: { token: currentUser.token } });
    setSocket(newSocket);

    // Cleanup on component unmount
    return () => newSocket.close();
  }, [fetchData, currentUser.token]);

  // Effect for setting up all real-time socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleFriendStatusUpdate = (userId, status) => {
      setFriends((prevFriends) =>
        prevFriends.map((f) => (f._id === userId ? { ...f, status } : f))
      );
    };

    socket.on("connect_error", (err) =>
      onAlert(`Connection Error: ${err.message}. Please refresh.`, "error")
    );
    socket.on("newFriendRequest", () => {
      onAlert("You have a new friend request!");
      fetchData();
    });
    socket.on("friendRequestAccepted", () => {
      onAlert("A friend request was accepted!");
      fetchData();
    });
    socket.on("friendOnline", (userId) =>
      handleFriendStatusUpdate(userId, "online")
    );
    socket.on("friendOffline", (userId) =>
      handleFriendStatusUpdate(userId, "offline")
    );

    // Cleanup listeners on unmount or when socket changes
    return () => {
      socket.off("connect_error");
      socket.off("newFriendRequest");
      socket.off("friendRequestAccepted");
      socket.off("friendOnline");
      socket.off("friendOffline");
    };
  }, [socket, fetchData, onAlert]);

  // Handler for when a user clicks on a friend in the sidebar
  const handleSelectFriend = async (friend) => {
    try {
      // Fetch chat details and message history from the backend
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

      let sharedKey = chatKeys[friend._id];

      // Derive and cache the shared secret for encryption if it's not already in state
      if (!sharedKey) {
        const myPrivateKey = await importKey(
          localStorage.getItem(`privateKey_${currentUser.username}`),
          true
        );
        const otherPublicKey = await importKey(friend.publicKey);
        sharedKey = await deriveSharedSecret(myPrivateKey, otherPublicKey);
        setChatKeys((prev) => ({ ...prev, [friend._id]: sharedKey }));
      }

      setActiveChat({ ...chat, friend, messages, key: sharedKey });
    } catch (error) {
      onAlert(error.message, "error");
    }
  };

  return (
    <div className="h-screen w-full flex bg-gradient-to-b from-yellow-50 to-amber-100 text-slate-900">
      <Sidebar
        currentUser={currentUser}
        friends={friends}
        requests={friendRequests}
        onLogout={onLogout}
        onAddFriend={() => setAddFriendModalOpen(true)}
        onShowRequests={() => setRequestsModalOpen(true)}
        onSelectFriend={handleSelectFriend}
        activeChat={activeChat}
      />
      {activeChat ? (
        <ChatWindow
          currentUser={currentUser}
          socket={socket}
          activeChat={activeChat}
        />
      ) : (
        <div className="hidden md:flex w-full md:w-2/3 flex-col items-center justify-center text-slate-500">
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
    </div>
  );
};

export default ChatView;

import React, { useState } from "react";
import { apiRequest } from "../../../utils/api.js";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

const FriendRequestsModal = ({
  currentUser,
  socket,
  requests,
  onClose,
  onAlert,
  onRequestsUpdated,
}) => {
  const [busyMap, setBusyMap] = useState({}); // requesterId -> bool

  const handleResponse = async (requesterId, response) => {
    try {
      if (busyMap[requesterId]) return;
      setBusyMap((m) => ({ ...m, [requesterId]: true }));
      // Send the response to the backend API
      await apiRequest(
        "users/friend-request/respond",
        "POST",
        { requesterId, response },
        currentUser.token
      );

      // If accepted, emit a socket event to notify the other user in real-time
      if (response === "accept") {
        socket.emit("acceptFriendRequest", { requesterId });
        onAlert("Friend request accepted!");
      }

      // This function (passed from ChatView) re-fetches friends and requests to update the UI
      onRequestsUpdated();
    } catch (err) {
      onAlert(err.message, "error");
    } finally {
      setBusyMap((m) => ({ ...m, [requesterId]: false }));
    }
  };

  return (
    <Modal title="Friend Requests" onClose={onClose}>
      <div className="max-h-80 overflow-y-auto">
        {requests.length > 0 ? (
          requests.map((req) => (
            <div
              key={req.from._id}
              className="flex items-center justify-between p-3 rounded-md border border-amber-200 bg-amber-50 mb-2"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={`https://i.pravatar.cc/32?u=${req.from.username}`}
                  alt={req.from.username}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-slate-800 font-medium">
                  {req.from.username}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="subtle"
                  disabled={!!busyMap[req.from._id]}
                  onClick={() => handleResponse(req.from._id, "accept")}
                >
                  {busyMap[req.from._id] ? "Accepting..." : "Accept"}
                </Button>
                <Button
                  variant="danger"
                  disabled={!!busyMap[req.from._id]}
                  onClick={() => handleResponse(req.from._id, "reject")}
                >
                  {busyMap[req.from._id] ? "..." : "Reject"}
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-600 p-3">No new friend requests.</p>
        )}
      </div>
    </Modal>
  );
};

export default FriendRequestsModal;

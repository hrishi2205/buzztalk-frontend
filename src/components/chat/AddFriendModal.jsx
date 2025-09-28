import React, { useState } from "react";
import { apiRequest } from "../../utils/api";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";

const AddFriendModal = ({ currentUser, socket, onClose, onAlert }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  const handleSearch = async () => {
    if (searchTerm.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    if (searchTerm.toLowerCase() === currentUser.username) {
      setError("You can't add yourself as a friend.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSearchResult(null);
    setRequestSent(false);

    try {
      const user = await apiRequest(
        `users/search/${searchTerm.toLowerCase()}`,
        "GET",
        null,
        currentUser.token
      );
      setSearchResult(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async (recipientId) => {
    try {
      const result = await apiRequest(
        "users/friend-request/send",
        "POST",
        { recipientId },
        currentUser.token
      );
      // Emit a socket event to notify the other user in real-time
      socket.emit("sendFriendRequest", { recipientId });
      onAlert(result.message);
      setRequestSent(true); // Disable the button after sending
    } catch (err) {
      onAlert(err.message, "error");
    }
  };

  // Allow searching by pressing Enter
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Modal title="Add a Friend" onClose={onClose}>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-grow"
        />
        <Button
          onClick={handleSearch}
          disabled={isLoading || searchTerm.length < 3}
        >
          {isLoading ? "..." : "Search"}
        </Button>
      </div>

      <div className="mt-4 min-h-[50px]">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {searchResult && (
          <div className="flex items-center justify-between p-3 rounded-md bg-amber-50 border border-amber-200">
            <div className="flex items-center space-x-3">
              <img
                src={
                  searchResult.avatarUrl ||
                  `https://i.pravatar.cc/32?u=${searchResult.username}`
                }
                alt={searchResult.displayName || searchResult.username}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <div className="text-slate-800 font-medium">
                  {searchResult.displayName || searchResult.username}
                </div>
                <div className="text-[11px] text-slate-500">
                  @{searchResult.username}
                </div>
              </div>
            </div>
            <Button
              onClick={() => handleSendRequest(searchResult._id)}
              disabled={requestSent}
            >
              {requestSent ? "Sent ✓" : "Send Request"}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddFriendModal;

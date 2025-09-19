import React from "react";

const Sidebar = ({
  currentUser,
  friends,
  requests,
  onLogout,
  onAddFriend,
  onShowRequests,
  onSelectFriend,
  activeChat,
}) => {
  const requestsCount = requests.length;

  return (
    <div className="w-full md:w-1/3 bg-white flex flex-col border-r border-amber-200 rounded-l-2xl">
      {/* Header Section */}
      <div className="p-4 border-b border-amber-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-amber-700">
          {currentUser.username}
        </h2>
        <div className="flex items-center space-x-2">
          {/* Friend Requests Button */}
          <button
            onClick={onShowRequests}
            className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full relative"
            title="Friend Requests"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              ></path>
            </svg>
            {requestsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {requestsCount}
              </span>
            )}
          </button>
          {/* Add Friend Button */}
          <button
            onClick={onAddFriend}
            className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold text-lg leading-none flex items-center justify-center w-8 h-8"
            title="Add Friend"
          >
            +
          </button>
          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full"
            title="Logout"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              ></path>
            </svg>
          </button>
        </div>
      </div>
      {/* Friends List */}
      <div className="flex-1 overflow-y-auto">
        {friends.length > 0 ? (
          friends.map((friend) => (
            <div
              key={friend._id}
              onClick={() => onSelectFriend(friend)}
              className={`p-4 border-b border-amber-100 hover:bg-amber-50 cursor-pointer flex items-center space-x-3 transition-colors ${
                activeChat?.friend._id === friend._id ? "bg-amber-50" : ""
              }`}
            >
              <div className="relative">
                <img
                  src={`https://i.pravatar.cc/40?u=${friend.username}`}
                  alt={friend.username}
                  className="w-10 h-10 rounded-full"
                />
                <span
                  className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ${
                    friend.status === "online" ? "bg-green-500" : "bg-slate-400"
                  } ring-2 ring-white`}
                ></span>
              </div>
              <p className="font-bold text-slate-900">{friend.username}</p>
            </div>
          ))
        ) : (
          <p className="p-4 text-slate-600">Add friends to start chatting.</p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

import React from "react";

const Sidebar = ({
  currentUser,
  friends,
  unreads = {},
  requests,
  onLogout,
  onAddFriend,
  onShowRequests,
  onSelectFriend,
  onOpenSettings,
  activeChat,
}) => {
  const requestsCount = requests.length;

  return (
    <div className="w-full glass flex flex-col md:rounded-l-2xl">
      {/* Header Section */}
      <div className="p-4 border-b border-amber-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img
            src={
              currentUser.avatarUrl ||
              `https://i.pravatar.cc/40?u=${currentUser.username}`
            }
            alt={currentUser.displayName || currentUser.username}
            className="w-9 h-9 rounded-full"
          />
          <div>
            <div className="text-base font-bold text-amber-700">
              {currentUser.displayName || currentUser.username}
            </div>
            <div className="text-[11px] text-slate-500">
              @{currentUser.username}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 bg-white/70 border border-amber-200 text-amber-700 rounded-full hover:bg-amber-50 active:scale-95"
            title="Settings"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.89 3.31.877 2.42 2.42a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.065 2.572c.89 1.543-.877 3.31-2.42 2.42a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.065c-1.543.89-3.31-.877-2.42-2.42a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35.54-.131 1.02-.41 1.365-.815A1.724 1.724 0 007.752 5.38c.345-.404.825-.684 1.365-.815z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          {/* Friend Requests Button */}
          <button
            onClick={onShowRequests}
            className="p-2 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-full relative shadow-sm active:scale-95"
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
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
                {requestsCount}
              </span>
            )}
          </button>
          {/* Add Friend Button */}
          <button
            onClick={onAddFriend}
            className="p-2 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-full font-bold text-lg leading-none flex items-center justify-center w-8 h-8 shadow-sm active:scale-95"
            title="Add Friend"
          >
            +
          </button>
          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2 bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full shadow-sm active:scale-95"
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
              className={`p-4 border-b border-amber-100 cursor-pointer flex items-center space-x-3 transition-colors ${
                activeChat?.friend._id === friend._id ? "bg-amber-50/70 gradient-sheen" : "hover:bg-amber-50/50"
              }`}
            >
              <div className="relative">
                <img
                  src={
                    friend.avatarUrl ||
                    `https://i.pravatar.cc/40?u=${friend.username}`
                  }
                  alt={friend.displayName || friend.username}
                  className="w-10 h-10 rounded-full"
                />
                <span
                  className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                    friend.status === "online" ? "bg-green-500" : "bg-slate-400"
                  }`}
                ></span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 truncate">
                  {friend.displayName || friend.username}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  @{friend.username}
                </p>
              </div>
              {unreads[friend._id] > 0 && (
                <span className="ml-auto bg-blue-600 text-white text-[11px] rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center shadow-sm">
                  {unreads[friend._id] > 99 ? "99+" : unreads[friend._id]}
                </span>
              )}
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

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
  onShowAllFriends,
  activeChat,
}) => {
  const requestsCount = requests.length;

  return (
    <div className="w-full h-full glass flex flex-col md:rounded-lg overflow-hidden shadow-2xl border border-amber-200/50">
      {/* Header Section */}
      <div className="p-4 border-b border-orange-200/60 flex justify-between items-center relative bg-gradient-to-r from-amber-100/80 to-orange-100/80 backdrop-blur-xl">
        {/* Animated background pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-2 right-8 w-6 h-6 bg-amber-400/40 [clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)] animate-pulse" />
          <div className="absolute bottom-2 left-12 w-4 h-4 bg-orange-400/40 [clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)] animate-pulse delay-500" />
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative">
            <img
              src={
                currentUser.avatarUrl ||
                `https://i.pravatar.cc/40?u=${currentUser.username}`
              }
              alt={currentUser.displayName || currentUser.username}
              className="w-10 h-10 rounded-full object-cover ring-3 ring-amber-300/60 shadow-lg transition-all duration-300 hover:ring-amber-400 hover:scale-105"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold truncate bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
              {currentUser.displayName || currentUser.username}
            </div>
            <div className="text-xs text-orange-600/80 truncate flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              @{currentUser.username}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 relative z-10">
          {/* All Friends Button */}
          <button
            onClick={onShowAllFriends}
            className="p-2.5 bg-white/80 border border-orange-300/60 text-orange-700 rounded-xl hover:bg-white hover:scale-105 shadow-lg active:scale-95 transition-all duration-200 backdrop-blur-sm"
            title="All Friends"
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </button>
          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 bg-white/80 border border-orange-300/60 text-orange-700 rounded-xl hover:bg-white hover:scale-105 shadow-lg active:scale-95 transition-all duration-200 backdrop-blur-sm"
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
            className="p-2.5 bg-gradient-to-br from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white rounded-xl relative shadow-lg active:scale-95 transition-all duration-200 hover:scale-105 hover:shadow-xl"
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
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-bounce font-bold">
                {requestsCount}
              </span>
            )}
          </button>
          {/* Add Friend Button */}
          <button
            onClick={onAddFriend}
            className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl font-bold text-lg leading-none flex items-center justify-center w-10 h-10 shadow-lg active:scale-95 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:rotate-90"
            title="Add Friend"
          >
            +
          </button>
          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2.5 bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl shadow-lg active:scale-95 transition-all duration-200 hover:scale-105 hover:shadow-xl"
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
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white/40 to-amber-50/40 backdrop-blur-sm">
        <div className="p-3">
          <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Your Hive ({friends.length})
          </h3>
        </div>
        {friends.length > 0 ? (
          <div className="space-y-1 px-2">
            {friends.map((friend, index) => (
              <div
                key={friend._id}
                onClick={() => onSelectFriend(friend)}
                className={`group mx-2 p-3 rounded-xl cursor-pointer flex items-center space-x-3 transition-all duration-300 hover:shadow-md ${
                  activeChat?.friend._id === friend._id
                    ? "bg-gradient-to-r from-orange-200/80 to-amber-200/80 shadow-lg scale-[1.02] border border-orange-300/60"
                    : "hover:bg-white/60 hover:scale-[1.01] border border-transparent hover:border-orange-200/60"
                } transform-gpu`}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: "fadeInUp 0.3s ease-out forwards",
                }}
              >
                <div className="relative">
                  <img
                    src={
                      friend.avatarUrl ||
                      `https://i.pravatar.cc/40?u=${friend.username}`
                    }
                    alt={friend.displayName || friend.username}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-200/60 shadow-md group-hover:ring-orange-300 transition-all duration-300 group-hover:scale-105"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 block h-3.5 w-3.5 rounded-full ring-2 ring-white shadow-sm transition-all duration-300 ${
                      friend.status === "online"
                        ? "bg-green-500 animate-pulse"
                        : "bg-slate-400"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 truncate group-hover:text-amber-800 transition-colors">
                    {friend.displayName || friend.username}
                  </p>
                  <p className="text-xs text-orange-600/80 truncate flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        friend.status === "online"
                          ? "bg-green-500 animate-pulse"
                          : "bg-slate-400"
                      }`}
                    />
                    @{friend.username}
                  </p>
                  {friend.status === "online" && (
                    <p className="text-xs text-green-600 font-medium">
                      Active now
                    </p>
                  )}
                </div>
                {unreads[friend._id] > 0 && (
                  <div className="ml-auto">
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full h-6 min-w-6 px-2 flex items-center justify-center shadow-lg font-bold animate-pulse">
                      {unreads[friend._id] > 99 ? "99+" : unreads[friend._id]}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-amber-700 mb-2">
              No Friends Yet
            </h3>
            <p className="text-sm text-slate-600 mb-4 max-w-xs">
              Start building your hive! Add friends to begin secure
              conversations.
            </p>
            <button
              onClick={onAddFriend}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg font-semibold hover:from-amber-500 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Add Your First Friend 🐝
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

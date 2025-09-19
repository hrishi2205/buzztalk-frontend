import React, { useState, useEffect } from "react";
import LandingView from "./components/auth/LandingView.jsx";
import LoginView from "./components/auth/LoginView.jsx";
import RegisterFlow from "./components/auth/RegisterFlow.jsx";
import ChatView from "./components/chat/ChatView.jsx";
import Alert from "./components/ui/Alert.jsx";

function App() {
  // State to manage the current view ('landing', 'login', 'register', 'chat', or 'loading')
  const [view, setView] = useState("loading");
  // State to hold the currently logged-in user's data
  const [currentUser, setCurrentUser] = useState(null);
  // State for displaying global alerts: { message: string, type: 'success' | 'error' }
  const [alert, setAlert] = useState(null);

  // This effect runs once when the app loads to check for a persisted session.
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      // If user data is found in local storage, restore the session
      setCurrentUser(JSON.parse(storedUser));
      setView("chat");
    } else {
      // Otherwise, show the landing page
      setView("landing");
    }
  }, []);

  // Function to display an alert message
  const handleAlert = (message, type = "success") => {
    setAlert({ message, type });
  };

  // Callback for when a user successfully logs in or registers
  const handleLoginSuccess = (userData) => {
    // Persist user data to local storage for session management
    localStorage.setItem("currentUser", JSON.stringify(userData));
    setCurrentUser(userData);
    setView("chat");
  };

  // Callback for when a user logs out
  const handleLogout = () => {
    // Clear all user-related data from local storage
    localStorage.removeItem(`privateKey_${currentUser.username}`);
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setView("login");
  };

  // A simple router to render the correct view based on the current state
  const renderView = () => {
    switch (view) {
      case "loading":
        return (
          <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-slate-200">
            Loading...
          </div>
        );
      case "login":
        return (
          <LoginView setView={setView} onLoginSuccess={handleLoginSuccess} />
        );
      case "register":
        return (
          <RegisterFlow
            setView={setView}
            onRegisterSuccess={handleLoginSuccess}
          />
        );
      case "chat":
        return (
          <ChatView
            currentUser={currentUser}
            onLogout={handleLogout}
            onAlert={handleAlert}
          />
        );
      case "landing":
      default:
        return <LandingView setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen min-w-full bg-gradient-to-b from-yellow-50 to-amber-100">
      {/* The Alert component is rendered here at the top level so it can be displayed over any view */}
      {alert && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
      {renderView()}
    </div>
  );
}

export default App;

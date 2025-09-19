import React, { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../utils/api";
import { Toaster } from "react-hot-toast";
import LandingView from "./components/auth/LandingView.jsx";
import LoginView from "./components/auth/LoginView.jsx";
import RegisterFlow from "./components/auth/RegisterFlow.jsx";
import ChatView from "./components/chat/ChatView.jsx";
import Alert from "./components/ui/Alert.jsx";
import LoadingScreen from "./components/ui/LoadingScreen.jsx";

function App() {
  // State to manage the current view ('landing', 'login', 'register', 'chat', or 'loading')
  const [view, setView] = useState("loading");
  // State to hold the currently logged-in user's data
  const [currentUser, setCurrentUser] = useState(null);
  // State for displaying global alerts: { message: string, type: 'success' | 'error' }
  const [alert, setAlert] = useState(null);

  // Centralized navigation that syncs with browser history
  const navigate = useCallback((nextView, { replace = false } = {}) => {
    if (replace) {
      window.history.replaceState(
        { view: nextView },
        "",
        window.location.pathname
      );
    } else {
      window.history.pushState(
        { view: nextView },
        "",
        window.location.pathname
      );
    }
    setView(nextView);
  }, []);

  // Initial route resolution (session check) and history initialization
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setCurrentUser(parsed);
      // Try to refresh the profile from the server to keep avatarUrl and displayName in sync
      (async () => {
        try {
          const fresh = await apiRequest("users/me", "GET", null, parsed.token);
          const merged = { ...parsed, ...fresh };
          setCurrentUser(merged);
          localStorage.setItem("currentUser", JSON.stringify(merged));
        } catch (e) {
          // If refresh fails, keep local copy
        } finally {
          navigate("chat", { replace: true });
        }
      })();
    } else {
      navigate("landing", { replace: true });
    }
    // Handle browser back/forward
    const onPopState = (e) => {
      const stateView = e.state?.view;
      if (stateView) {
        setView(stateView);
      } else {
        const hasUser = !!localStorage.getItem("currentUser");
        setView(hasUser ? "chat" : "landing");
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [navigate]);

  // Function to display an alert message
  const handleAlert = (message, type = "success") => {
    setAlert({ message, type });
  };

  // Callback for when a user successfully logs in or registers
  const handleLoginSuccess = (userData) => {
    // Persist user data to local storage for session management
    localStorage.setItem("currentUser", JSON.stringify(userData));
    setCurrentUser(userData);
    navigate("chat");
  };

  // Callback for when a user logs out
  const handleLogout = () => {
    // Clear all user-related data from local storage
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    navigate("login");
  };

  // A simple router to render the correct view based on the current state
  const renderView = () => {
    switch (view) {
      case "loading":
        return <LoadingScreen />;
      case "login":
        return (
          <LoginView setView={navigate} onLoginSuccess={handleLoginSuccess} />
        );
      case "register":
        return (
          <RegisterFlow
            setView={navigate}
            onRegisterSuccess={handleLoginSuccess}
          />
        );
      case "chat":
        return (
          <ChatView
            currentUser={currentUser}
            onLogout={handleLogout}
            onAlert={handleAlert}
            onCurrentUserUpdated={(u) => {
              setCurrentUser(u);
              localStorage.setItem("currentUser", JSON.stringify(u));
            }}
          />
        );
      case "landing":
      default:
        return <LandingView setView={navigate} />;
    }
  };

  return (
    <div className="min-h-screen min-w-full bg-gradient-to-b from-yellow-50 to-amber-100">
      {/* Global toaster for modern toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2600,
          style: {
            background: "rgba(255,255,255,0.9)",
            color: "#0f172a",
            borderRadius: "14px",
            border: "1px solid rgba(251,191,36,0.35)", // amber-300
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            backdropFilter: "blur(10px)",
          },
          success: {
            duration: 2600,
          },
          error: {
            duration: 3200,
          },
        }}
      />
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

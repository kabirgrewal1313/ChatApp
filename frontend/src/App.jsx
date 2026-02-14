import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { connectSocket, disconnectSocket, getSocket } from "./socket/socket";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000";
console.log(API_BASE_URL)
function App() {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState("");

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [activeUserId, setActiveUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");

  const [chatError, setChatError] = useState("");

  // Load persisted session
  useEffect(() => {
    const stored = window.localStorage.getItem("chat_auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.accessToken && parsed.user) {
          setAccessToken(parsed.accessToken);
          setUser(parsed.user);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // Persist session
  useEffect(() => {
    if (accessToken && user) {
      window.localStorage.setItem(
        "chat_auth",
        JSON.stringify({ accessToken, user })
      );
    } else {
      window.localStorage.removeItem("chat_auth");
    }
  }, [accessToken, user]);

  // Connect socket when authenticated
  useEffect(() => {
    if (!accessToken) return;
    const socket = connectSocket(accessToken);

    const handleReceive = (payload) => {
      setMessages((prev) => {
        if (
          activeUserId &&
          (payload.senderId === activeUserId || payload.senderId === user?.id)
        ) {
          return [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              sender: payload.senderId,
              receiver: activeUserId,
              text: payload.text,
              createdAt: payload.createdAt
            }
          ];
        }
        return prev;
      });
    };

    socket.on("receiveMessage", handleReceive);

    return () => {
      socket.off("receiveMessage", handleReceive);
      disconnectSocket();
    };
  }, [accessToken, activeUserId, user]);

  const isAuthenticated = useMemo(() => !!accessToken && !!user, [accessToken, user]);
  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    const username = formData.get("username");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(
          mode === "signup"
            ? { username, email, password }
            : { email, password }
        )
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Something went wrong");
      }

      setUser(data.user);
      setAccessToken(data.accessToken);
      setMode("login");
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!accessToken) return;
    setUsersLoading(true);
    setChatError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/users`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load users");
      }
      setUsers(data.users || []);
    } catch (err) {
      setChatError(err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchMessages = async (otherUserId) => {
    if (!accessToken || !otherUserId) return;
    setChatError("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/chat/messages/${otherUserId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load messages");
      }
      setMessages(data.messages || []);
    } catch (err) {
      setChatError(err.message);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

  const handleSelectUser = (id) => {
    setActiveUserId(id);
    fetchMessages(id);
  };

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (!messageInput.trim() || !activeUserId || !user) return;

    const text = messageInput.trim();
    setMessageInput("");

    const socket = getSocket();
    if (!socket) {
      setChatError("Socket not connected");
      return;
    }

    socket.emit("sendMessage", {
      receiverId: activeUserId,
      text
    });

    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        sender: user.id,
        receiver: activeUserId,
        text,
        createdAt: new Date().toISOString()
      }
    ]);
  };

  const handleLogout = () => {
    setUser(null);
    setAccessToken("");
    setUsers([]);
    setActiveUserId(null);
    setMessages([]);
    setMessageInput("");
    setChatError("");
    disconnectSocket();
  };

  const activeUser = users.find((u) => u.id === activeUserId) || null;

  if (!isAuthenticated) {
    return (
      <div className="app-shell">
        <div className="auth-card">
          <h1 className="app-title">ChatApp</h1>
          <p className="app-subtitle">Real-time messaging with a clean UI.</p>

          <div className="auth-toggle">
            <button
              type="button"
              className={mode === "login" ? "auth-toggle-btn active" : "auth-toggle-btn"}
              onClick={() => {
                setMode("login");
                setAuthError("");
              }}
            >
              Log in
            </button>
            <button
              type="button"
              className={mode === "signup" ? "auth-toggle-btn active" : "auth-toggle-btn"}
              onClick={() => {
                setMode("signup");
                setAuthError("");
              }}
            >
              Sign up
            </button>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {mode === "signup" && (
              <div className="field">
                <label htmlFor="username">Username</label>
                <input id="username" name="username" type="text" required />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required />
            </div>

            {authError && <p className="error-text">{authError}</p>}

            <button className="primary-btn" type="submit" disabled={authLoading}>
              {authLoading
                ? "Please wait..."
                : mode === "login"
                  ? "Log in"
                  : "Create account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="chat-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div>
              <div className="sidebar-title">ChatApp</div>
              <div className="sidebar-user">{user.username}</div>
            </div>
            <button className="ghost-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <div className="sidebar-section-label">
            Conversations
            <button
              type="button"
              className="ghost-btn small"
              onClick={fetchUsers}
              disabled={usersLoading}
            >
              {usersLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="sidebar-list">
            {users.length === 0 && (
              <div className="empty-state">No other users yet.</div>
            )}
            {users.map((u) => (
              <button
                key={u.id}
                className={
                  u.id === activeUserId ? "user-row active" : "user-row"
                }
                onClick={() => handleSelectUser(u.id)}
              >
                <div className="user-avatar">
                  {u.username?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="user-meta">
                  <div className="user-name">{u.username}</div>
                  <div className="user-email">{u.email}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="chat-main">
          <div className="chat-main-topbar">
            <span className="chat-main-username">Signed in as {user.username}</span>
            <button className="ghost-btn" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>

          {activeUser ? (
            <>
              <header className="chat-header">
                <div className="chat-header-title">{activeUser.username}</div>
                <div className="chat-header-subtitle">{activeUser.email}</div>
              </header>

              <section className="chat-messages">
                {messages.length === 0 && (
                  <div className="empty-state">
                    No messages yet. Say hi!
                  </div>
                )}
                {messages.map((m) => {
                  const isMine = m.sender === user.id;
                  return (
                    <div
                      key={m.id}
                      className={isMine ? "message-row mine" : "message-row"}
                    >
                      <div className="message-bubble">
                        <div className="message-text">{m.text}</div>
                        <div className="message-meta">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>

              <form className="chat-input-row" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <button className="primary-btn" type="submit">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty">
              <h2>Welcome, {user.username}</h2>
              <p>Select a user from the left to start chatting.</p>
            </div>
          )}

          {chatError && <p className="error-text chat-error">{chatError}</p>}
        </main>
      </div>
    </div>
  );
}

export default App;

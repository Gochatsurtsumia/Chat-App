import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL = "https://chat-app-01-bt1u.onrender.com";

function App() {
  const [username, setUsername] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const savedName = localStorage.getItem("chatUsername");
    if (savedName) {
      setUsername(savedName);
    }
  }, []);

  useEffect(() => {
    if (!username) return;

    socketRef.current = io(SERVER_URL);

    socketRef.current.emit("join", { username });

    socketRef.current.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on("user_list", (list) => {
      setUsers(list);
    });

    socketRef.current.on("typing", (data) => {
      setTypingUsers(data);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const handleTyping = (e) => {
  setInput(e.target.value);
  socketRef.current.emit("typing", username);
};

const sendMessage = () => {
  if (input.trim()) {
    socketRef.current.emit("message", { name: username, text: input });
    setInput("");
    socketRef.current.emit("stop_typing", username);
  }
};

  const handleJoin = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      localStorage.setItem("chatUsername", trimmed);
      setUsername(trimmed);
    }
  };

  if (!username) {
    return (
      <div style={styles.joinContainer}>
        <h2>Enter your username to join chat</h2>
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="Your name"
          style={styles.input}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          autoFocus
        />
        <button onClick={handleJoin} style={styles.button}>
          Join Chat
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.chatContainer,
        backgroundColor: darkMode ? "#1e1e1e" : "#f0f8ff",
        color: darkMode ? "#ddd" : "#000",
      }}
    >
      <h2 style={{ textAlign: "center" }}>🔥 Chat App with Typing & Themes</h2>

      <div style={styles.topBar}>
        Online Users: {users.length}
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{ marginLeft: 20, padding: "4px 8px", cursor: "pointer" }}
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <div style={styles.mainContent}>
        <div
          style={{
            ...styles.messageBox,
            backgroundColor: darkMode ? "#2a2a2a" : "#fefefe",
            color: darkMode ? "#ddd" : "#000",
          }}
        >
          {messages.map((msg, idx) => {
            const isMe = msg.name === username;
            return (
              <div
                key={idx}
                style={{
                  ...styles.message,
                  backgroundColor: isMe
                    ? darkMode
                      ? "#007f00"
                      : "#28a745"
                    : darkMode
                    ? "#333"
                    : "#fff",
                  color: isMe ? "#fff" : darkMode ? "#ddd" : "#000",
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  borderTopRightRadius: isMe ? 0 : 8,
                  borderTopLeftRadius: isMe ? 8 : 0,
                }}
              >
                <div style={styles.meta}>
                  <strong>🧑‍💬 {msg.name}</strong>
                  <span style={styles.time}>{msg.time}</span>
                </div>
                <div>{msg.text}</div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div
          style={{
            ...styles.userList,
            backgroundColor: darkMode ? "#252525" : "#eef6ff",
            color: darkMode ? "#ddd" : "#000",
          }}
        >
          <h3>Users</h3>
          <ul style={{ paddingLeft: 20 }}>
            {users.map((user, idx) => (
              <li key={idx} style={{ fontWeight: user === username ? "bold" : "normal" }}>
                {user} {typingUsers.includes(user) ? "💬" : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={styles.inputArea}>
        <input
          type="text"
          value={input}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message with emojis 😄👍💬..."
          style={{
            ...styles.input,
            backgroundColor: darkMode ? "#333" : "#fff",
            color: darkMode ? "#ddd" : "#000",
            borderColor: darkMode ? "#555" : "#ccc",
          }}
          autoFocus
        />
        <button onClick={sendMessage} style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  joinContainer: {
    maxWidth: 400,
    margin: "10rem auto",
    padding: "2rem",
    border: "1px solid #ccc",
    borderRadius: 12,
    textAlign: "center",
    fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#f0f8ff",
  },
  chatContainer: {
    maxWidth: 900,
    margin: "2rem auto",
    fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: "1rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    height: "90vh",
  },
  topBar: {
    marginBottom: "1rem",
    fontWeight: "bold",
    color: "#2d72d9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mainContent: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1rem",
    flexGrow: 1,
    overflow: "hidden",
  },
  messageBox: {
    flex: 3,
    height: "100%",
    overflowY: "auto",
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
  },
  userList: {
    flex: 1,
    height: "100%",
    overflowY: "auto",
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: 8,
  },
  message: {
    maxWidth: "70%",
    padding: "0.5rem",
    marginBottom: "0.5rem",
    borderRadius: 8,
    border: "1px solid #eee",
    display: "flex",
    flexDirection: "column",
  },
  meta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.85rem",
  },
  time: {
    fontSize: "0.8rem",
    color: "#777",
  },
  inputArea: {
    display: "flex",
    gap: "0.5rem",
  },
  input: {
    flex: 1,
    padding: "0.5rem",
    borderRadius: 4,
    border: "1px solid #ccc",
  },
  button: {
    padding: "0.5rem 1rem",
    border: "none",
    backgroundColor: "#2d72d9",
    color: "#fff",
    borderRadius: 4,
    cursor: "pointer",
  },
};

export default App;

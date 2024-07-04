import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { ChatProvider, useChat } from "./ChatContext";

interface Message {
  text: string;
  isSent: boolean;
  sender: string;
}

const ChatRoom: React.FC<{ token: string; username: string }> = ({
  token,
  username,
}) => {
  const { state, dispatch } = useChat();
  const [message, setMessage] = useState("");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    console.log("Attempting to connect WebSocket with token:", token);
    ws.current = new WebSocket(`ws://localhost:8080?token=${token}`);
    ws.current.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      console.log("Message received from server:", newMessage);
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          text: newMessage.message,
          isSent: false,
          sender: newMessage.sender || "Anonymous",
        },
      });
    };
    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    ws.current.onclose = () => {
      console.log("WebSocket connection closed");
    };
    return () => {
      ws.current?.close();
    };
  }, [dispatch, token]);

  const sendMessage = () => {
    if (ws.current && message) {
      console.log("Sending message:", message);
      ws.current.send(
        JSON.stringify({ type: "message", message, sender: username })
      );
      dispatch({
        type: "ADD_MESSAGE",
        payload: { text: message, isSent: true, sender: username },
      });
      setMessage("");
    }
  };

  return (
    <div className="chat-room">
      <div className="messages">
        {state.messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.isSent ? "sent" : "received"}`}
          >
            <div className="sender">{msg.sender}</div>
            <div className="text">{msg.text}</div>
          </div>
        ))}
      </div>
      <div className="input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const login = async () => {
    if (!username) {
      alert("Please enter a username");
      return;
    }
    console.log("Attempting to login...");
    const response = await fetch("http://localhost:8080/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await response.json();
    console.log("Login response:", data);
    setToken(data.token);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="login-form">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
        />
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <ChatProvider>
      <ChatRoom token={token!} username={username} />
    </ChatProvider>
  );
};

export default App;

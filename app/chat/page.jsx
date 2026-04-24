"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { encryptForReceiver, decryptMessage } from "../../lib/crypto";

export default function Chat() {
  const { address } = useAccount();

  const [to, setTo] = useState("");
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);

  const load = async () => {
    const res = await fetch(`/api/messages?address=${address}`);
    const data = await res.json();
    const priv = localStorage.getItem("chat_priv");

    const decoded = await Promise.all(
      data.map(async (m) => {
        try {
          const text = await decryptMessage(m.payload, priv);
          return { ...m, text };
        } catch {
          return { ...m, text: "[encrypted]" };
        }
      })
    );

    setMessages(decoded.reverse());
  };

  const send = async () => {
    if (!to || !msg) return;

    const res = await fetch(`/api/get-key?address=${to}`);
    const { publicKey } = await res.json();

    if (!publicKey) {
      alert("User not registered");
      return;
    }

    const payload = await encryptForReceiver(msg, publicKey);

    await fetch("/api/send", {
      method: "POST",
      body: JSON.stringify({
        from: address,
        to,
        payload
      })
    });

    setMsg("");
    load();
  };

  useEffect(() => {
    if (address) {
      load();
      const i = setInterval(load, 3000);
      return () => clearInterval(i);
    }
  }, [address]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.chatBox}>

        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.avatar}>💬</div>
          <div>
            <div style={{ fontWeight: 600 }}>Chat</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              Secure Messaging
            </div>
          </div>
        </div>

        {/* INPUT ADDRESS */}
        <div style={styles.topInput}>
          <input
            placeholder="Recipient address"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* MESSAGES */}
        <div style={styles.messages}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent:
                  m.from === address ? "flex-end" : "flex-start"
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  background:
                    m.from === address ? "#000" : "#f1f1f1",
                  color:
                    m.from === address ? "#fff" : "#000"
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* INPUT BOTTOM */}
        <div style={styles.bottom}>
          <input
            placeholder="Type message..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            style={styles.input}
          />
          <button onClick={send} style={styles.send}>
            Send
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f5f5"
  },
  chatBox: {
    width: "100%",
    maxWidth: 420,
    height: "90vh",
    background: "#fff",
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 15,
    borderBottom: "1px solid #eee"
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#000",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  topInput: {
    padding: 10,
    borderBottom: "1px solid #eee"
  },
  messages: {
    flex: 1,
    padding: 15,
    overflowY: "auto"
  },
  bubble: {
    padding: "10px 14px",
    borderRadius: 14,
    marginBottom: 10,
    maxWidth: "70%"
  },
  bottom: {
    display: "flex",
    padding: 10,
    borderTop: "1px solid #eee"
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ccc"
  },
  send: {
    marginLeft: 10,
    padding: "10px 16px",
    background: "#000",
    color: "#fff",
    borderRadius: 10
  }
};

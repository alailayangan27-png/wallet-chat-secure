"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { encryptForReceiver, decryptMessage } from "../../lib/crypto";

const ADMIN = "GANTI_DENGAN_WALLET_KAMU";

export default function Chat() {
  const { address } = useAccount();
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);

  const load = async () => {
    const res = await fetch(`/api/messages?address=${address}`);
    const data = await res.json();
    const priv = localStorage.getItem("chat_priv");

    const decoded = await Promise.all(
      data.map(async (m) => {
        try {
          return { ...m, text: await decryptMessage(m.payload, priv) };
        } catch {
          return { ...m, text: "[encrypted]" };
        }
      })
    );

    setMessages(decoded.reverse());
  };

  const send = async () => {
    if (!msg) return;

    const res = await fetch(`/api/get-key?address=${ADMIN}`);
    const { publicKey } = await res.json();

    const payload = await encryptForReceiver(msg, publicKey);

    await fetch("/api/send", {
      method: "POST",
      body: JSON.stringify({
        from: address,
        to: ADMIN,
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
      <div style={styles.box}>

        <div style={styles.header}>
          Customer Support (Online)
        </div>

        <div style={styles.messages}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: m.from === address ? "flex-end" : "flex-start"
            }}>
              <div style={{
                ...styles.bubble,
                background: m.from === address ? "#000" : "#eee",
                color: m.from === address ? "#fff" : "#000"
              }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.input}>
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={send}>Send</button>
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
  box: {
    width: 400,
    height: "90vh",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    borderRadius: 20,
    overflow: "hidden"
  },
  header: {
    padding: 15,
    borderBottom: "1px solid #eee"
  },
  messages: {
    flex: 1,
    padding: 15,
    overflow: "auto"
  },
  bubble: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: "70%"
  },
  input: {
    display: "flex",
    padding: 10,
    borderTop: "1px solid #eee"
  }
};

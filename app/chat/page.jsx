"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { encryptForReceiver, decryptMessage } from "../../lib/crypto";

export default function Chat() {
  const { address } = useAccount();
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
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
          return { ...m, text: "[unreadable]" };
        }
      })
    );

    setMessages(decoded);
  };

  const send = async () => {
    const res = await fetch(`/api/get-key?address=${to}`);
    const { publicKey } = await res.json();

    if (!publicKey) return;

    const payload = await encryptForReceiver(message, publicKey);

    await fetch("/api/send", {
      method: "POST",
      body: JSON.stringify({
        from: address,
        to,
        payload
      })
    });

    setMessage("");
    load();
  };

  useEffect(() => {
    if (address) load();
  }, [address]);

  return (
    <div>
      <h3>{address}</h3>

      <input value={to} onChange={e => setTo(e.target.value)} placeholder="Recipient" />
      <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Message" />

      <button onClick={send}>Send</button>

      {messages.map((m, i) => (
        <div key={i}>{m.text}</div>
      ))}
    </div>
  );
}

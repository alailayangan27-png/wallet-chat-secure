"use client";

import { useAccount, useConnect } from "wagmi";
import { useEffect } from "react";
import { generateKeyPair } from "../lib/crypto";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    if (!address) return;

    const init = async () => {
      let priv = localStorage.getItem("chat_priv");

      if (!priv) {
        const kp = await generateKeyPair();
        localStorage.setItem("chat_priv", kp.privateKeyB64);

        await fetch("/api/save-key", {
          method: "POST",
          body: JSON.stringify({
            address,
            publicKey: kp.publicKeyB64
          })
        });
      }
    };

    init();
  }, [address]);

  if (!isConnected) {
    return <button onClick={() => connect({ connector: connectors[0] })}>Connect Wallet</button>;
  }

  return (
    <div style={{ padding: 20 }}>
      <a href="/chat">Open Customer Support</a>
    </div>
  );
}

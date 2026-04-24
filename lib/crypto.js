const enc = new TextEncoder();
const dec = new TextDecoder();

function ab2b64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b642ab(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["encrypt", "decrypt"]
  );

  const pub = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const priv = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKeyB64: ab2b64(pub),
    privateKeyB64: ab2b64(priv)
  };
}

export async function importPublicKey(b64) {
  return crypto.subtle.importKey(
    "spki",
    b642ab(b64),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

export async function importPrivateKey(b64) {
  return crypto.subtle.importKey(
    "pkcs8",
    b642ab(b64),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

export async function encryptForReceiver(text, publicKeyB64) {
  const pub = await importPublicKey(publicKeyB64);

  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    enc.encode(text)
  );

  const rawAes = await crypto.subtle.exportKey("raw", aesKey);

  const wrappedKey = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    pub,
    rawAes
  );

  return {
    cipher: ab2b64(cipher),
    iv: ab2b64(iv.buffer),
    key: ab2b64(wrappedKey)
  };
}

export async function decryptMessage(payload, privateKeyB64) {
  const priv = await importPrivateKey(privateKeyB64);

  const rawAes = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    priv,
    b642ab(payload.key)
  );

  const aesKey = await crypto.subtle.importKey(
    "raw",
    rawAes,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(b642ab(payload.iv)) },
    aesKey,
    b642ab(payload.cipher)
  );

  return dec.decode(plain);
}

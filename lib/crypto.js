const enc = new TextEncoder();
const dec = new TextDecoder();

const b64 = (b) => btoa(String.fromCharCode(...new Uint8Array(b)));
const ab = (b) => {
  const bin = atob(b);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
};

export async function generateKeyPair() {
  const kp = await crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: "SHA-256" },
    true,
    ["encrypt","decrypt"]
  );

  return {
    publicKeyB64: b64(await crypto.subtle.exportKey("spki", kp.publicKey)),
    privateKeyB64: b64(await crypto.subtle.exportKey("pkcs8", kp.privateKey))
  };
}

export async function encryptForReceiver(text, pubB64) {
  const pub = await crypto.subtle.importKey("spki", ab(pubB64), { name:"RSA-OAEP", hash:"SHA-256" }, true, ["encrypt"]);

  const aes = await crypto.subtle.generateKey({ name:"AES-GCM", length:256 }, true, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cipher = await crypto.subtle.encrypt({ name:"AES-GCM", iv }, aes, enc.encode(text));
  const raw = await crypto.subtle.exportKey("raw", aes);

  const wrapped = await crypto.subtle.encrypt({ name:"RSA-OAEP" }, pub, raw);

  return {
    cipher: b64(cipher),
    iv: b64(iv),
    key: b64(wrapped)
  };
}

export async function decryptMessage(payload, privB64) {
  const priv = await crypto.subtle.importKey("pkcs8", ab(privB64), { name:"RSA-OAEP", hash:"SHA-256" }, true, ["decrypt"]);

  const raw = await crypto.subtle.decrypt({ name:"RSA-OAEP" }, priv, ab(payload.key));

  const aes = await crypto.subtle.importKey("raw", raw, { name:"AES-GCM" }, false, ["decrypt"]);

  const plain = await crypto.subtle.decrypt(
    { name:"AES-GCM", iv: new Uint8Array(ab(payload.iv)) },
    aes,
    ab(payload.cipher)
  );

  return dec.decode(plain);
}

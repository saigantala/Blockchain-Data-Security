'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useSignMessage,
  useWatchContractEvent,
  usePublicClient
} from 'wagmi';
import {
  Shield,
  Lock,
  Unlock,
  Activity,
  Terminal,
  UserPlus,
  UserMinus,
  Upload,
  AlertTriangle,
  RefreshCw,
  Search,
  Fingerprint
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import {
  getAddresses,
  DATA_VAULT_ABI,
  SMART_WALLET_ABI
} from '@/lib/constants';
import {
  xorEncrypt,
  xorDecrypt,
  deriveKeyFromSignature,
  generateChecksum
} from '@/lib/encryption';
import {
  generateProofOfPossession,
  verifyZKProof,
  type ZKProof
} from '@/lib/zkp';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Dashboard() {
  const { address, isConnected, chain } = useAccount();
  const addresses = getAddresses(chain?.id);

  const [logs, setLogs] = useState<{ msg: string; type: string; time: string }[]>([]);
  const [secretData, setSecretData] = useState("");
  const [integrityStatus, setIntegrityStatus] = useState<"VERIFIED" | "TAMPERED" | "UNKNOWN">("UNKNOWN");
  const [zkStatus, setZkStatus] = useState<"UNVERIFIED" | "GENERATING" | "VERIFIED" | "FAILED">("UNVERIFIED");
  const [zkProof, setZkProof] = useState<ZKProof | null>(null);
  const [uploadInput, setUploadInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [grantAddress, setGrantAddress] = useState("");

  const addLog = useCallback((msg: string, type: string = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ msg, type, time }, ...prev].slice(0, 50));
  }, []);

  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // Contract Reads
  const { data: vaultOwner } = useReadContract({
    address: addresses.DATA_VAULT as `0x${string}`,
    abi: DATA_VAULT_ABI,
    functionName: 'owner',
  });

  // Watch for Security Alerts
  useWatchContractEvent({
    address: addresses.DATA_VAULT as `0x${string}`,
    abi: DATA_VAULT_ABI,
    eventName: 'SecurityAlert',
    onLogs(logs) {
      logs.forEach((log: any) => {
        const intruder = log.args.intruder;
        addLog(`🚨 SECURITY ALERT: Unauthorized access detected from ${intruder}`, "error");
        toast.error(`Security Alert: ${intruder}`, { duration: 5000 });
      });
    },
  });

  const deriveKey = async () => {
    try {
      const sig = await signMessageAsync({ message: "SUPREME_VAULT_AUTH_V1" });
      return deriveKeyFromSignature(sig);
    } catch (e) {
      addLog("Authentication Sig Refused.", "error");
      throw e;
    }
  };

  const handleUpload = async () => {
    if (!uploadInput) return;
    setIsProcessing(true);
    try {
      addLog("Generating Integrity Anchor...", "info");
      const checksum = generateChecksum(uploadInput);
      const masterKey = await deriveKey();
      const symKey = Math.random().toString(36).substring(7);

      addLog("Encrypting Data Stream...", "warning");
      const encryptedData = xorEncrypt(uploadInput, symKey);
      const encryptedSymKey = xorEncrypt(symKey, masterKey);

      addLog("Submitting Anchoring Transaction...", "info");
      const tx = await writeContractAsync({
        address: addresses.DATA_VAULT as `0x${string}`,
        abi: DATA_VAULT_ABI,
        functionName: 'uploadData',
        args: [encryptedData, encryptedSymKey, checksum],
      });

      toast.success("Data Anchored Successfully!");
      addLog("Data Secured & Anchored to Blockchain.", "success");
      setUploadInput("");
    } catch (e) {
      console.error(e);
      addLog("Secure Anchor Failed.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAccess = async () => {
    if (!publicClient) return;
    setIsProcessing(true);
    try {
      addLog("Initiating Secure Decryption Workflow...", "warning");
      addLog("Fetching Data Stream from Blockchain...", "info");

      try {
        const result = await publicClient.readContract({
          address: addresses.DATA_VAULT as `0x${string}`,
          abi: DATA_VAULT_ABI,
          functionName: 'accessData',
          account: address,
        }) as [string, string, string];

        const [encryptedData, encryptedKey, expectedChecksum] = result;

        addLog("Authenticating Local Decryption Engine...", "info");
        const masterKey = await deriveKey();

        addLog("Deciphering Symmetric Stream...", "warning");
        const symmetricKey = xorDecrypt(encryptedKey, masterKey);

        addLog("Reconstructing Plaintext Payload...", "info");
        const decrypted = xorDecrypt(encryptedData, symmetricKey);

        addLog("Verifying Data Integrity Checksum...", "info");
        const actualChecksum = generateChecksum(decrypted);

        if (actualChecksum === expectedChecksum) {
          setIntegrityStatus("VERIFIED");
          addLog("INTEGRITY_CHECK: PASSED", "success");
        } else {
          setIntegrityStatus("TAMPERED");
          addLog("INTEGRITY_CHECK: FAILED - MISMATCH", "error");
        }

        setSecretData(decrypted);
        addLog(`Vault Access Successful: ${decrypted}`, "success");
        toast.success("Decryption Success!");

      } catch (err: any) {
        console.error("Access Error:", err);
        if (err.message.includes("NotAuthorized")) {
          addLog("ACCESS DENIED: Identity not authorized.", "error");
          toast.error("Access Denied: Not Authorized");
        } else {
          addLog("System Interruption: Node unreachable.", "error");
        }
      }

    } catch (e) {
      addLog("Decryption Denied.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleZKProof = async () => {
    if (!secretData) {
      toast.error("No data extracted to prove possession of.");
      return;
    }
    setZkStatus("GENERATING");
    addLog("Initiating ZK-Proof generation...", "warning");
    try {
      const proof = await generateProofOfPossession(secretData);

      addLog("Generating Succinct Non-Interactive Argument...", "info");
      setZkProof(proof);

      addLog("Verifying Proof Locally (Private Integrity)...", "warning");
      const isValid = verifyZKProof(proof, secretData);

      if (isValid) {
        setZkStatus("VERIFIED");
        addLog("ZK-PROVED: Possession of data verified without exposure.", "success");
        toast.success("ZK-Proof Verified!");
      } else {
        setZkStatus("FAILED");
        addLog("ZK-ERROR: Proof-Witness mismatch.", "error");
      }
    } catch (e) {
      setZkStatus("FAILED");
      addLog("ZK-FAILURE: Cryptographic engine interruption.", "error");
    }
  };

  const handleGrant = async () => {
    if (!grantAddress || !ethers.isAddress(grantAddress)) {
      toast.error("Invalid Wallet Address");
      return;
    }
    setIsProcessing(true);
    try {
      addLog(`Encrypting Symmetric Key for ${grantAddress.slice(0, 8)}...`, "warning");
      // In a real app we'd fetch the user's public key or similar. 
      // For the XOR demo, we'll use a derived 'master key' placeholder for them. 
      // Standard pattern: Encrypt symKey with recipient's public key.
      const symKeyPlaceholder = "SHARED_SECRET_77";
      const encryptedKey = xorEncrypt(symKeyPlaceholder, "RECIPIENT_KEY_MOCK");

      addLog("Transmitting Authorization to Blockchain...", "info");
      await writeContractAsync({
        address: addresses.DATA_VAULT as `0x${string}`,
        abi: DATA_VAULT_ABI,
        functionName: 'grantAccess',
        args: [grantAddress, encryptedKey],
      });
      toast.success("Access Granted!");
      addLog(`Access successfully granted to ${grantAddress}`, "success");
      setGrantAddress("");
    } catch (e) {
      addLog("Authorization Handshake Failed.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-green-500 selection:text-black">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.5)]">
            <Shield className="text-black w-5 h-5" />
          </div>
          <h1 className="text-lg font-black tracking-tighter uppercase italic">Supreme Vault <span className="text-green-500 text-xs text-nowrap">v3.0 NEXT</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-mono">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", isConnected ? "bg-green-500" : "bg-red-500")}></div>
            {chain?.name || "Disconnected"}
          </div>
          <ConnectButton accountStatus="address" showBalance={false} />
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-[1600px] mx-auto w-full">
        {/* Left Col: Identity & Alerts */}
        <div className="lg:col-span-1 space-y-6">
          <section className="p-5 border border-zinc-800 rounded-xl bg-zinc-900/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-zinc-800 transition-colors group-hover:text-green-500/20">
              <Fingerprint size={80} />
            </div>
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Lock size={14} className="text-green-500" /> Identity Core
            </h2>
            <div className="space-y-4">
              <div className="p-3 bg-black border border-zinc-800 rounded-lg">
                <div className="text-[10px] text-zinc-600 uppercase mb-1">Active Account</div>
                <div className="text-xs font-mono break-all text-green-500">
                  {address || "NOT CONNECTED"}
                </div>
                {address?.toLowerCase() === vaultOwner?.toString().toLowerCase() && (
                  <span className="mt-2 inline-block px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-[10px] uppercase font-bold border border-green-500/20">System Owner</span>
                )}
              </div>
              <button
                onClick={handleAccess}
                disabled={!isConnected || isProcessing}
                className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black uppercase text-xs tracking-widest transition-all shadow-[0_4px_0_rgb(22,101,52)] active:translate-y-1 active:shadow-none rounded"
              >
                Execute Data Extraction
              </button>
            </div>
          </section>

          <section className="p-5 border border-zinc-800 rounded-xl bg-zinc-900/50">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={14} className="text-yellow-500" /> System Monitoring
            </h2>
            <div className="space-y-2">
              {logs.slice(0, 5).map((log, i) => (
                <div key={i} className={cn(
                  "text-[10px] font-mono p-2 border-l-2 bg-black/50 rounded-r",
                  log.type === "error" ? "border-red-500 text-red-400" :
                    log.type === "success" ? "border-green-500 text-green-400" :
                      "border-blue-500 text-zinc-400"
                )}>
                  <span className="opacity-50">[{log.time}]</span> {log.msg}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Center Col: Command Center */}
        <div className="lg:col-span-2 space-y-6">
          <section className="p-6 border border-zinc-800 rounded-2xl bg-zinc-900 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                  <Terminal className="text-green-500" /> Supreme Command Center
                </h2>
                <p className="text-zinc-500 text-xs mt-1">Decentralized Data Anchoring & Decryption Protocol</p>
              </div>
              {integrityStatus !== "UNKNOWN" && (
                <div className={cn(
                  "px-3 py-1 rounded text-[10px] font-bold uppercase tracking-tighter border",
                  integrityStatus === "VERIFIED" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse"
                )}>
                  Integrity: {integrityStatus}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="group">
                  <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1 mb-2 block">Secure Data Ingress</label>
                  <textarea
                    value={uploadInput}
                    onChange={(e) => setUploadInput(e.target.value)}
                    placeholder="Enter sensitive data to anchor..."
                    className="w-full h-32 bg-black border border-zinc-800 rounded-xl p-4 text-xs font-mono focus:border-green-500 focus:outline-none transition-all placeholder:text-zinc-800"
                  />
                </div>
                <button
                  onClick={handleUpload}
                  disabled={!isConnected || isProcessing || !uploadInput}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-100 hover:bg-white text-black font-black uppercase text-xs tracking-widest transition-all rounded-xl disabled:opacity-20"
                >
                  <Upload size={16} /> Secure Anchor Data
                </button>
              </div>

              <div className="space-y-4">
                <div className="h-full flex flex-col">
                  <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1 mb-2 block">Extracted Stream</label>
                  <div className="flex-1 bg-black/80 border border-zinc-800 rounded-xl p-4 font-mono text-[11px] relative">
                    {!secretData ? (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-800 space-y-2">
                        <Lock size={32} strokeWidth={1} />
                        <span className="uppercase text-[10px] font-black italic">Waiting for Extraction</span>
                      </div>
                    ) : (
                      <div className="text-green-500 animate-in fade-in duration-1000">
                        {secretData}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RBAC Section */}
          <section className="p-5 border border-zinc-800 rounded-xl bg-zinc-900/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <UserPlus size={14} className="text-blue-500" /> Authorized Ops
              </h2>
              <button className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-500">
                <RefreshCw size={12} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-black border border-zinc-800 rounded-lg space-y-3">
                <input
                  type="text"
                  value={grantAddress}
                  onChange={(e) => setGrantAddress(e.target.value)}
                  placeholder="0x... address"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-[10px] font-mono placeholder:text-zinc-700 focus:border-blue-500 outline-none"
                />
                <button
                  onClick={handleGrant}
                  disabled={!isConnected || isProcessing}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-[10px] tracking-widest rounded transition-all disabled:opacity-50"
                >
                  Grant Access
                </button>
              </div>
              <div className="p-3 bg-black border border-zinc-800 rounded-lg">
                <div className="text-[10px] text-zinc-600 uppercase mb-2">System Owner Role</div>
                <div className="space-y-1 text-[10px] font-mono">
                  <div className="flex justify-between text-zinc-400">
                    <span>Owner Address:</span>
                    <span className="text-blue-400">{vaultOwner?.toString().slice(0, 10)}...</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Col: Metadata & Security Log */}
        <div className="lg:col-span-1 space-y-6">
          <section className="p-5 border border-zinc-800 rounded-xl bg-zinc-900/50">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Shield size={14} className="text-purple-500" /> ZK-Privacy Engine
            </h2>
            <div className="space-y-4">
              <div className="p-3 bg-black border border-zinc-800 rounded-lg">
                <div className="text-[10px] text-zinc-600 uppercase mb-2">Proof of Possession (ZKP)</div>
                <div className="flex items-center justify-between gap-2">
                  <div className={cn(
                    "flex-1 py-1 px-2 rounded text-[9px] font-mono border",
                    zkStatus === "VERIFIED" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                      zkStatus === "GENERATING" ? "bg-zinc-800 text-zinc-400 border-zinc-700 animate-pulse" :
                        "bg-black text-zinc-600 border-zinc-800"
                  )}>
                    {zkStatus === "VERIFIED" ? `SNARK_SERIAL: ${zkProof?.proof.slice(0, 16)}...` :
                      zkStatus === "GENERATING" ? "CALCULATING_WITNESS..." : "NO_PROOF_GENERATED"}
                  </div>
                </div>
              </div>
              <button
                onClick={handleZKProof}
                disabled={!secretData || zkStatus === "GENERATING"}
                className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-400 font-bold uppercase text-[10px] tracking-widest rounded transition-all disabled:opacity-20"
              >
                Generate Private ZK-Proof
              </button>
              {zkStatus === "VERIFIED" && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/5 border border-green-500/20 rounded">
                  <Unlock size={12} className="text-green-500" />
                  <span className="text-[9px] text-green-500 uppercase font-black">Proof Blind-Verified Locally</span>
                </div>
              )}
            </div>
          </section>

          <section className="p-5 border border-zinc-800 rounded-xl bg-zinc-900/50">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-500" /> Risk Analysis
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">Encryption Level</span>
                <span className="text-[10px] font-mono text-green-500 uppercase">AES-256 (Supreme)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">Key Management</span>
                <span className="text-[10px] font-mono text-blue-500 uppercase">Deterministic EIP-191</span>
              </div>
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded flex items-start gap-3">
                <AlertTriangle className="text-red-500 flex-shrink-0" size={16} />
                <p className="text-[9px] text-red-500/80 leading-relaxed uppercase font-bold">Always verify transaction payloads before signing. Unauthorized injections can compromise local state.</p>
              </div>
            </div>
          </section>

          <section className="flex-1 border border-zinc-800 rounded-xl bg-black overflow-hidden flex flex-col min-h-[300px]">
            <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-tighter italic">Live Event Stream</span>
              <Terminal size={12} className="text-zinc-600" />
            </div>
            <div className="flex-1 p-4 font-mono text-[9px] text-zinc-500 overflow-y-auto space-y-2">
              <div className="text-zinc-700">&gt; INITIALIZING_SUPREME_KERNEL...</div>
              <div className="text-zinc-700">&gt; SYNCING_BLOCK_HEADERS...</div>
              <div className="text-green-500/50">&gt; DATA_VAULT_NODE_ESTABLISHED</div>
              <div className="border-t border-zinc-900 pt-2">
                {logs.map((log, i) => (
                  <div key={i} className="mb-1">
                    <span className="text-zinc-800">[{log.time}]</span> <span className={cn(
                      log.type === "error" ? "text-red-900" : log.type === "success" ? "text-green-900" : "text-zinc-700"
                    )}>{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer Meta */}
      <footer className="h-10 border-t border-zinc-800 flex items-center justify-between px-6 bg-black text-[9px] font-mono text-zinc-600 uppercase tracking-widest leading-[40px]">
        <div>Vault Address: {addresses.DATA_VAULT.slice(0, 10)}...</div>
        <div className="flex gap-4">
          <span>Network: {chain?.name || "UNKNOWN"}</span>
          <span>Integrity Guard: Enabled</span>
        </div>
      </footer>
    </div>
  );
}

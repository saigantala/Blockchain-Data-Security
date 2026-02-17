import { useState, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import './App.css'

import contractAddresses from './contract-addresses.json';

const CONTRACT_ADDRESS = contractAddresses.DATA_VAULT;
const SMART_WALLET_ADDRESS = contractAddresses.SMART_WALLET;

const DATA_VAULT_ABI = [
  "function grantAccess(address user) external",
  "function accessData() external returns (string)",
  "event SecurityAlert(address intruder, uint256 time)"
];

const SMART_WALLET_ABI = [
  "function execute(address _target, bytes calldata _data) external payable",
  "function owner() external view returns (address)"
];

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [smartWallet, setSmartWallet] = useState(null);
  const [smartWalletOwner, setSmartWalletOwner] = useState("");
  const [logs, setLogs] = useState([{ msg: "System Initialized...", type: "info" }]);
  const [targetAddress, setTargetAddress] = useState("");
  const [impersonateAddr, setImpersonateAddr] = useState("");
  const [systemStatus, setSystemStatus] = useState("ONLINE");
  const terminalEndRef = useRef(null);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    connectWallet();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', connectWallet);
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', connectWallet);
      }
    }
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (msg, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { msg: `[${timestamp}] ${msg}`, type }]);
  };

  const isValidAddress = (addr) => {
    return ethers.isAddress(addr);
  };

  const [isSimulated, setIsSimulated] = useState(false);
  const [simulatedInput, setSimulatedInput] = useState("");

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const _provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(_provider);

        const signer = await _provider.getSigner();
        const address = await signer.getAddress();

        setAccount(address);
        setIsSimulated(false); // Reset simulation flag
        addLog(`Identity Verified: ${address}`, "success");

        setupContracts(signer);

      } catch (err) {
        console.error("Wallet connection failed", err);
        addLog("Connection Failed. Manual Authorization Required.", "error");
      }
    } else {
      alert("Metamask Not Detected");
    }
  };

  const loginAsSimulatedUser = async (overrideAddress = null) => {
    const targetAddress = overrideAddress || simulatedInput;

    if (!isValidAddress(targetAddress)) {
      addLog(`Invalid Simulation Address: ${targetAddress}`, "error");
      return;
    }

    try {
      // DIRECT RPC for Hardhat methods
      const localProvider = new ethers.JsonRpcProvider("http://localhost:8545");

      addLog(`SIMULATION PROTOCOL: Overriding Identity to ${targetAddress}...`, "warning");

      // 1. Impersonate
      await localProvider.send("hardhat_impersonateAccount", [targetAddress]);
      await localProvider.send("hardhat_setBalance", [targetAddress, "0x1000000000000000000"]); // Fund 1 ETH

      // 2. Get Signer
      const signer = await localProvider.getSigner(targetAddress);

      setAccount(targetAddress);
      setIsSimulated(true);
      setProvider(localProvider); // Switch provider context if needed for other calls

      setupContracts(signer);

      addLog("Identity Validated (SIMULATED). Full Access Granted.", "success");
      setSimulatedInput("");

    } catch (e) {
      console.error(e);
      addLog(`Simulation Failed: ${e.message}`, "error");
    }
  };

  const setupContracts = async (signer) => {
    const dataVault = new ethers.Contract(CONTRACT_ADDRESS, DATA_VAULT_ABI, signer);
    setContract(dataVault);

    const sw = new ethers.Contract(SMART_WALLET_ADDRESS, SMART_WALLET_ABI, signer);
    setSmartWallet(sw);

    // Fetch Smart Wallet Owner
    try {
      const owner = await sw.owner();
      setSmartWalletOwner(owner);
    } catch (e) { /* ignore */ }

    // Setup Listener (Only needed once, but re-attaching is fine for this demo)
    dataVault.removeAllListeners(); // clear old listeners to avoid duplicates
    dataVault.on("SecurityAlert", (intruder, time) => {
      const timestamps = new Date(Number(time) * 1000).toLocaleTimeString();
      setSystemStatus("ALERT");
      addLog(`🚨 SECURITY BREACH DETECTED! Intruder: ${intruder} at ${timestamps}`, "error");
      setTimeout(() => setSystemStatus("ONLINE"), 5000);
    });
  };

  const grantAccess = async () => {
    if (!contract) return;

    if (!isValidAddress(targetAddress)) {
      addLog(`Invalid Address Format: ${targetAddress}`, "error");
      return;
    }

    try {
      addLog(`Initiating Grant Access Protocol for ${targetAddress}...`, "info");
      const tx = await contract.grantAccess(targetAddress);
      addLog(`Transaction Pending: ${tx.hash}`, "info");
      await tx.wait();
      addLog(`ACCESS GRANTED: ${targetAddress}`, "success");
      setTargetAddress("");
    } catch (err) {
      console.error(err);
      addLog("Authorization Failed. Check permissions.", "error");
    }
  };

  const attemptToSteal = async () => {
    if (!contract) return;

    try {
      // 2. Simulate Authentication Process
      addLog(`[AUTH] Verifying Identity for Wallet ID...`, "warning");
      await new Promise(r => setTimeout(r, 1000)); // Fake processing delay
      addLog(`[AUTH] Identity Verified via Wallet Address. Initiating Data Breach...`, "error");

      // 3. Execute Blockchain Attack
      const tx = await contract.accessData();
      addLog(`Injection Sent: ${tx.hash}`, "info");
      await tx.wait();
      addLog("Transaction Confirmed. Awaiting Response...", "info");

    } catch (err) {
      console.error(err);
      addLog("Operation Failed.", "error");
    }
  };

  const executeViaSmartWallet = async () => {
    if (!smartWallet || !contract) return;

    if (smartWalletOwner && account && smartWalletOwner.toLowerCase() !== account.toLowerCase()) {
      addLog(`ACCESS DENIED: You are not the owner of this Smart Wallet.`, "error");
      addLog(`Owner: ${smartWalletOwner}`, "info");
      return;
    }

    try {
      addLog("Initiating Smart Wallet Proxy Call...", "info");
      // Encode the function call to accessData
      const iface = new ethers.Interface(DATA_VAULT_ABI);
      const data = iface.encodeFunctionData("accessData", []);

      const tx = await smartWallet.execute(CONTRACT_ADDRESS, data);
      addLog(`Proxy Transaction Sent: ${tx.hash}`, "info");
      await tx.wait();
      addLog("Smart Wallet Execution Success! Data Accessed via Proxy.", "success");
    } catch (err) {
      console.error(err);
      addLog("Smart Wallet Execution Failed.", "error");
    }
  };

  const simulateAttack = async () => {
    if (!isValidAddress(impersonateAddr)) {
      addLog("Invalid Tracker ID / Victim Address", "error");
      return;
    }

    try {
      const localProvider = new ethers.JsonRpcProvider("http://localhost:8545");
      addLog(`GHOST MODE: Impersonating ${impersonateAddr} to launch attack...`, "warning");

      await localProvider.send("hardhat_impersonateAccount", [impersonateAddr]);
      await localProvider.send("hardhat_setBalance", [impersonateAddr, "0x1000000000000000000"]); // Fund 1 ETH

      const signer = await localProvider.getSigner(impersonateAddr);
      const impersonatedContract = new ethers.Contract(CONTRACT_ADDRESS, DATA_VAULT_ABI, signer);

      addLog(`[GHOST] Attempting data extraction as ${impersonateAddr}...`, "error");
      const tx = await impersonatedContract.accessData();
      addLog(`[GHOST] Injection Sent: ${tx.hash}`, "info");
      await tx.wait();
      addLog("[GHOST] Transaction Confirmed. Awaiting Response...", "info");

      // Stop impersonating
      await localProvider.send("hardhat_stopImpersonatingAccount", [impersonateAddr]);
      addLog(`[GHOST] Impersonation of ${impersonateAddr} ended.`, "info");

    } catch (e) {
      console.error(e);
      addLog(`[GHOST] Simulation Failed: ${e.message}`, "error");
    }
  };

  const resetConnection = () => {
    connectWallet(); // Revert to Metamask
  };

  // --- NEW LAYOUT COMPONENTS ---

  return (
    <div className="command-center">
      {/* 1. Top Status Bar */}
      <header className="status-bar">
        <div className="brand-logo">
          <div className="logo-icon"></div>
          <span>SECURE_DATA_CMD</span>
        </div>
        <div className="status-metrics">
          <div className={`metric ${systemStatus === 'ALERT' ? 'blink-red' : ''}`}>
            STATUS: <span style={{ color: systemStatus === 'ALERT' ? 'var(--danger)' : 'var(--success)' }}>{systemStatus}</span>
          </div>
          <div className="metric">
            NET: {isSimulated ? "SIMULATED (HARDHAT)" : "LOCALHOST"}
          </div>
        </div>
      </header>

      {/* 2. Identity Core (Central Hub) */}
      <section className={`identity-core ${isSimulated ? 'simulated-mode' : ''}`}>
        <div className="identity-header">IDENTITY CORE CONTEXT</div>
        <div className="identity-display">
          {account ? (
            <div className="current-id">
              <span className="id-label">{isSimulated ? "UNAUTHORIZED SIMULATION" : "VERIFIED USER"}</span>
              <span className="id-address">{account}</span>
            </div>
          ) : (
            <button className="connect-btn" onClick={connectWallet}>INITIALIZE UPLINK</button>
          )}
        </div>

        {/* Simulation Controls embedded in Core */}
        <div className="simulation-controls">
          <input
            placeholder="Simulate Identity (0x...)"
            value={simulatedInput}
            onChange={(e) => setSimulatedInput(e.target.value)}
          />
          <div className="sim-buttons">
            <button onClick={() => loginAsSimulatedUser()}>OVERRIDE ID</button>
            <button onClick={() => loginAsSimulatedUser(ethers.Wallet.createRandom().address)}>RANDOM ID</button>
          </div>
          {isSimulated && <button className="reset-btn" onClick={resetConnection}>RESET CONNECTION</button>}
        </div>
      </section>

      {/* 3. Operations Grid */}
      <main className="ops-grid">

        {/* Left: Authorized Operations */}
        <div className="ops-panel authorized-ops">
          <div className="panel-title">AUTHORIZED OPS</div>

          <div className="control-group">
            <label>Grant Access</label>
            <div className="input-row">
              <input
                placeholder="Target User Address"
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
              />
              <button onClick={grantAccess}>AUTHORIZE</button>
            </div>
          </div>

          <div className="control-group">
            <label>Smart Wallet Proxy</label>
            <div className="info-row">
              <span>Proxy: {SMART_WALLET_ADDRESS.substring(0, 8)}...</span>
              <button onClick={executeViaSmartWallet}>ACCESS VIA PROXY</button>
            </div>
          </div>
        </div>

        {/* Right: Red Team Operations */}
        <div className="ops-panel red-team-ops">
          <div className="panel-title">RED TEAM OPS</div>

          <div className="control-group">
            <label>Active Identity Attack</label>
            <button className="attack-btn" onClick={attemptToSteal}>
              EXECUTE DATA EXTRACTION
            </button>
          </div>

          <div className="control-group">
            <label>Ghost Impersonation (One-Shot)</label>
            <div className="input-row">
              <input
                placeholder="Victim Address"
                value={impersonateAddr}
                onChange={(e) => setImpersonateAddr(e.target.value)}
              />
              <button className="ghost-btn" onClick={simulateAttack}>GHOST ATTACK</button>
            </div>
          </div>
        </div>

      </main>

      {/* 4. Console Log */}
      <footer className="console-log">
        <div className="console-header">SYSTEM LOGS</div>
        <div className="log-window">
          {logs.map((log, i) => (
            <div key={i} className={`log-line ${log.type}`}>
              <span className="log-msg">{log.msg}</span>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </footer>
    </div>
  )
}

export default App

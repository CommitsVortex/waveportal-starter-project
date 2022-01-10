import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import './App.css';
import abi from "./utils/WavePortal.json";

const App = () => {
  // State variable to store user's public wallet
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [message, setMessage] = useState("");
  const contractAddress = "0x04FEd9Ddb831999693C940D9c614a8D6De2eB813";
  
  // Method that will get all waves from contract
  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        
        // call the getAllWaves method from the smart contract
        const waves = await wavePortalContract.getAllWaves();

        // select address, timestamp, and message for UI
        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          }
        });

        // store data in React State
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewState", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);
  
  // clicking the wave button that triggeres contractABI
  // will cause the web client to be reading data from the contract
  // on the blockchain
  const contractABI = abi.abi
  
  const checkIfWalletIsConnected = async () => {    
    try {
      // First make sure the user has access to window.ethereum
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      // Check authorization to acces user's wallet
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !==0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Connect Wallet Function
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);    
    } catch (error)  {
      console.log(error)
    }
  }

  // call getTotalWaves() from the smart contract on this website
  const wave = async () => {
    try {
      const {ethereum} = window;

      if (ethereum) {
        // ethere is a library that lets the frontend talk to the contract
        // provider talks to ethereum nodes
        // using nodes that metamask provides in background to send/receive data
        // from deployed contract
        const provider = new ethers.providers.Web3Provider(ethereum);
        // a signer in ethers is an abstraction of an ethereum account, used to sign messages and transcations
        // executes state changing operations
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        // Execute the actual wave from the smart contract
        // this logs that the writing to the contract is being minted
        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
        console.log("Mining -- ", waveTxn.hash);

        // This logs that the transaction/write has been minted
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        // Return new wave count
        count = await wavePortalContract.getTotalWaves();
        console.log("Restrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  // This runs our function when the page loads
  useEffect(() => {
    checkIfWalletIsConnected();
    getAllWaves();
  }, [])
  
  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <span role="img" aria-label="Wave emoji">👋</span> Hey there!!!
        </div>

        <div className="bio">
          I am Committs Vortex and I will transform your waves into sweat or tears. Connect your Ethereum wallet and holler at me!
        </div>

        {/* <form className="dataContainer">
          <label className="bio">Send a wave message:</label><br></br>
          <input type="text" id="waveMessage" name="waveMessage" defaultValue="👋 " className="waveEntry"></input><br></br>
          <input type="submit" value="Wave to me on-chain" className="waveButton" onClick={wave}></input><br></br>
        </form> */}

        {
          currentAccount ? (<textarea name="messageArea"
            placeholder="👋 "
            type="text"
            id="msg"
            value={message}
            onChange={e => setMessage(e.target.value)} />) : null
        }
        
        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {/* If there is no Current Account render this button */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        
        <div className="waveLogs">
          {allWaves.map((wave, index) => {
            return (
              <div key={index} className="logs">
                <div>Address: {wave.address}</div>
                <div>Time: {wave.timestamp.toString()}</div>
                <div>Message: {wave.message}</div>
              </div>)
          })}
        </div>
        
        <div className="dataContainer">
          {/* <h1>`this is the wave address: {allWaves.Address[0]}`</h1> */}
        </div>
      </div>
    </div>
  );
}

export default App

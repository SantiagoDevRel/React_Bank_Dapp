import './App.css';
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import bankArtifact from "./artifacts/contracts/Bank.sol/Bank.json";
import maticArtifact from "./artifacts/contracts/Matic.sol/Matic.json";
import shibArtifact from "./artifacts/contracts/Shib.sol/Shib.json";
import usdtArtifact from "./artifacts/contracts/Usdt.sol/Usdt.json";
import Modal from './Modal';

const bankAddress = "0x332430281a8405E0F5130899d50eE28DfA196D3c"
const maticAddress = "0x9577FAE59c9806dD409b7E00cfC8C4618AdB105a"
const shibAddress = "0xd492b6BfaC195Ec02d63Ec08dE8Fb41c08bcEDb5"
const usdtAddress = "0xEaAed1CA06C8a0ea7D0343C75C731fFb666e8966"


function App() {
  const [provider, setProvider] = useState(undefined);
  const [signer, setSigner] = useState(undefined);
  const [signerAddress, setSignerAddress] = useState(undefined)
  const [bankContract, setBankContract] = useState(undefined)
  const [tokenContracts, setTokenContracts] = useState({})
  const [tokenBalances, setTokenBalances] = useState({})
  const [tokenSymbol, setTokenSymbols] = useState([])

  const [amount, setAmount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(undefined)
  const [isDeposit, setIsDeposit] = useState(true);

  const toBytes32 = text => (ethers.utils.formatBytes32String(text));
  const toNormalString = bytes32 => (ethers.utils.parseBytes32String(bytes32))
  const toWei = ether => (ethers.utils.parseEther(ether));
  const toEther = wei => (ethers.utils.formatEther(wei).toString())
  const toRound = num => (Number(num).toFixed(2))

  useEffect(()=>{
    const init = async () => {
      //init  provider metamask
      const provider = await new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      //init bankcontract
      const bankContract = await new ethers.Contract(bankAddress,bankArtifact.abi)
      setBankContract(bankContract); //set state bankContract 
      //call bankContract, return the arr of symbols and parse them toNormalString
      bankContract.connect(provider).getWhiteSymbols()
      .then((arr)=>{
        const symbols = arr.map(s => toNormalString(s))
        setTokenSymbols(symbols) //set state tokenSymbols
        getTokenContracts(symbols, bankContract, provider)
      })
    }
    init()
  },[])

  const getTokenContract = async (symbol, bankContract, provider) => {
    const address = await bankContract.connect(provider).getWhiteTokenAddress(toBytes32(symbol));
    const symbolAbi = symbol === "Matic" ? maticArtifact.abi : (symbol === "Shib" ? shibArtifact.abi : usdtArtifact.abi)
    const tokenContract = new ethers.Contract(address, symbolAbi)
    return tokenContract
  }

  const getTokenContracts = async (symbols, bankContract, provider) => {
    symbols.map( async symbol => {
      const contract = await getTokenContract(symbol, bankContract, provider)
        setTokenContracts(prev => ({...prev,[symbol]: contract})) //created object iterating through each symbol:contract
    })
  }

  const isConnected = () => (signer !== undefined)

  const getSigner = async(provider) =>{
    provider.send("eth_requestAccounts", [])
    const signer = provider.getSigner();
    signer.getAddress()
    .then(add => {
      setSignerAddress(add)
    })

    return signer
  }

  const connect = () =>{
    getSigner(provider)
    .then(signer => {
      setSigner(signer)
      getTokenBalances(signer)
    })
  }

  const getTokenBalance = async(symbol, signer) =>{
    const balance = await bankContract.connect(signer).getTokenBalance(toBytes32(symbol))
    return toEther(balance)
  }

  const getTokenBalances = async(signer) =>{
    tokenSymbol.map(async symbol =>{
      const balance = await getTokenBalance(symbol, signer)
      setTokenBalances(prev => ({...prev, [symbol]: balance.toString()})) //CHECK THIS .toString
    } )
  }

  const displayModal = (symbol) =>{
    setSelectedSymbol(symbol)
    setShowModal(true)
  }

  const depositTokens = (wei, symbol) => {
    if (symbol === 'Eth' || symbol === "ETH") {
      signer.sendTransaction({
        to: bankContract.address,
        value: wei
      })
    } else {
      const tokenContract = tokenContracts[ symbol ]
      tokenContract.connect(signer).approve(bankContract.address, wei)
        .then(() => {
          bankContract.connect(signer).depositToken(wei, toBytes32(symbol));
        })
    }
  }

  const withdrawTokens = (amountWei, symbol) =>{
    if(symbol === "ETH" || symbol==="Eth"){
      bankContract.connect(signer).withdrawEther(amountWei)
    }else{
      bankContract.connect(signer).withdrawToken(amountWei, toBytes32(symbol))
    }
  }

  const depositOrWithdraw = (e, symbol) =>{
    e.preventDefault()
    const wei = toWei(amount)
    if(isDeposit){
      depositTokens(wei, symbol)
    }else{
      withdrawTokens(wei, symbol)
    }
  }


  return (
    <div className="App">
      <header className="App-header">
        {isConnected() ? (
          <div>
            <p>
              Welcome {signerAddress?.substring(0,10)}...
            </p>
            <div>
              <div className="list-group">
                <div className="list-group-item">
                  {Object.keys(tokenBalances).map((symbol, idx) => (
                    <div className=" row d-flex py-3" key={idx}>

                      <div className="col-md-3">
                        <div>{symbol.toUpperCase()}</div>
                      </div>

                      <div className="d-flex gap-4 col-md-3">
                        <small className="opacity-50 text-nowrap">{toRound(tokenBalances[symbol])}</small>
                      </div>
                      <div className="d-flex gap-4 col-md-6">
                        <button onClick={ () => displayModal(symbol) } className="btn btn-primary">Deposit/Withdraw</button>
                        <Modal
                          show={showModal}
                          onClose={() => setShowModal(false)}
                          symbol={selectedSymbol}
                          depositOrWithdraw={depositOrWithdraw}
                          isDeposit={isDeposit}
                          setIsDeposit={setIsDeposit}
                          setAmount={setAmount}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div>
            <p>
              You are not connected
            </p>
            <button onClick={connect} className="btn btn-primary">Connect Metamask</button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;

const { ethers } = require('ethers');
const abi = [
  { name:'unlockTokens', type:'function', inputs:[{type:'address'},{type:'uint128'}] }
];

const provider = new ethers.JsonRpcProvider(process.env.INFURA_RPC_URL);
const signer   = new ethers.Wallet(process.env.DEV_WALLET_PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.PRADA_TOKEN_ADDRESS, abi, signer);

exports.unlockPrada = async (to, amountWei) => {
  const tx = await contract.unlockTokens(to, amountWei);
  await tx.wait();
  return tx.hash;
};

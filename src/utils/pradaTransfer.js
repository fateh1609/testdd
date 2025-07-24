// backend/src/utils/pradaTransfer.js
const { ethers } = require('ethers');
const pradaAbi   = require('../abi/prada.json');

const {
  INFURA_RPC_URL,
  PRADA_TOKEN_ADDRESS,
  DEV_WALLET_PRIVATE_KEY
} = process.env;

/* ── provider & signer setup ───────────────────────────────────── */
const provider = new ethers.JsonRpcProvider(INFURA_RPC_URL);
const signer   = new ethers.Wallet(DEV_WALLET_PRIVATE_KEY, provider);

/* ── PRADA ERC‑20 contract instance ────────────────────────────── */
const pradaContract = new ethers.Contract(
  PRADA_TOKEN_ADDRESS,
  pradaAbi,
  signer
);

/* ----------------------------------------------------------------
   ORIGINAL FUNCTION — leave unchanged
----------------------------------------------------------------- */
async function sendPradaTokens(to, amount) {
  try {
    const decimals      = 18;
    const parsedAmount  = ethers.parseUnits(amount.toString(), decimals);

    const tx = await pradaContract.transfer(to, parsedAmount);
    await tx.wait(); // mined

    console.log(`✅ Sent ${amount} PRADA to ${to} | Tx: ${tx.hash}`);
    return tx.hash;
  } catch (error) {
    console.error('❌ PRADA transfer failed:', error);
    throw new Error('PRADA token transfer failed');
  }
}

/* ----------------------------------------------------------------
   NEW HELPERS expected by stake & withdrawal controllers
----------------------------------------------------------------- */

/** Alias: credit PRADA based on USD amount (10 PRADA = 1 USD here) */
async function creditPrada(toAddress, usdAmount) {
  const PRADA_PER_USD = 10;                 // adjust if rate differs
  const tokens = usdAmount * PRADA_PER_USD;
  return sendPradaTokens(toAddress, tokens);
}

/** transferPrada is an alias for direct payouts */
async function transferPrada(toAddress, usdAmount) {
  return creditPrada(toAddress, usdAmount);
}

/** lock/unlock placeholders — replace with real contract calls later */
async function lockPrada(userAddress, usdAmount) {
  console.log(`(mock) locked ${usdAmount} USD worth of PRADA in ${userAddress}`);
  return '0xLOCKTX';
}

async function unlockPrada(userAddress, pradaAmount) {
  console.log(`(mock) unlocked ${pradaAmount} PRADA for ${userAddress}`);
  return '0xUNLOCKTX';
}

/* ---------------------------------------------------------------- */
module.exports = {
  /* original */
  sendPradaTokens,

  /* new helpers used by stake / withdrawal logic */
  creditPrada,
  transferPrada,
  lockPrada,
  unlockPrada
};

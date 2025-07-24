/**********************************************************************
 *  PradaFund – startup tasks
 *    • seed Rank table
 *    • seed admin + system users + wallet
 *    • optional blockchain demo (transfer → approve → lock → unlock)
 *    • optional lab demo (creates alice→bob→carol, stakes, lending)
 *********************************************************************/
require('dotenv').config();
const bcrypt       = require('bcrypt');
const { ethers }   = require('ethers');
const dayjs        = require('dayjs');

const {
  User, Wallet, Rank, Stake, Lending
} = require('./models');

/* ───────────────────── 0. ENV ───────────────────── */
const {
  INFURA_RPC_URL,
  DEV_WALLET_PRIVATE_KEY: DEV_KEY,
  SALE_WALLET_ADDRESS:    SALE_WALLET,
  PRADA_TOKEN_ADDRESS:    PRADA_TOKEN,
  SEED_SALE = 'true',
  DEMO_LAB  = 'true'
} = process.env;

if (!INFURA_RPC_URL || !DEV_KEY || !SALE_WALLET || !PRADA_TOKEN) {
  console.error('❌ Missing one of INFURA_RPC_URL, DEV_WALLET_PRIVATE_KEY, SALE_WALLET_ADDRESS, PRADA_TOKEN_ADDRESS');
  process.exit(1);
}
const LOCKER_ADDRESS = '0x8583686966178DeCC55aD477Abba5C462F85e082';

/* ───────────────────── 1. Tx helper ───────────────────── */
async function makeTxHelper(provider, signerAddr) {
  let nonce = await provider.getTransactionCount(signerAddr, 'pending');
  const fee = await provider.getFeeData();
  const gas = (fee.gasPrice || ethers.parseUnits('3', 'gwei')) * 12n / 10n;

  return async (fn, ...args) => {
    const opts = { gasPrice: gas, nonce: nonce++ };

    if (typeof fn.staticCall === 'function') {
      try { await fn.staticCall(...args); }
      catch (err) { console.error('❌ Static call reverted:', err.reason ?? err.message); return null; }
    }

    try {
      const tx = await fn(...args, opts);
      console.log(`→ tx ${tx.hash} | gas ${ethers.formatUnits(gas,'gwei')} gwei | nonce ${opts.nonce}`);
      await tx.wait();
      return tx.hash;
    } catch (err) {
      console.warn('⚠️  Transaction failed:', err.reason ?? err.message);
      return null;
    }
  };
}

/* ───────────────────── 2. Seed Ranks ───────────────────── */
async function seedRanks() {
  if (await Rank.count()) return;
  await Rank.bulkCreate([
    { name:'Initiate',     volumeReqUsd: 0,        diffPct:  6, bonusAddOnPct: 0, levelsPaid:  1 },
    { name:'Builder',      volumeReqUsd: 3000,     diffPct:  9, bonusAddOnPct: 3, levelsPaid:  5 },
    { name:'Connector',    volumeReqUsd: 7500,     diffPct: 12, bonusAddOnPct: 3, levelsPaid:  9 },
    { name:'Influencer',   volumeReqUsd: 15000,    diffPct: 15, bonusAddOnPct: 3, levelsPaid: 11 },
    { name:'Networker',    volumeReqUsd: 25000,    diffPct: 17, bonusAddOnPct: 2, levelsPaid: 13 },
    { name:'Rainmaker',    volumeReqUsd: 50000,    diffPct: 19, bonusAddOnPct: 2, levelsPaid: 18 },
    { name:'Trailblazer',  volumeReqUsd: 100000,   diffPct: 19, bonusAddOnPct: 0, levelsPaid: 24 },
    { name:'Vanguard',     volumeReqUsd: 500000,   diffPct: 21, bonusAddOnPct: 2, levelsPaid: 26 },
    { name:'Mogul',        volumeReqUsd: 1000000,  diffPct: 22, bonusAddOnPct: 1, levelsPaid: 30 },
    { name:'Tycoon',       volumeReqUsd: 5000000,  diffPct: 23, bonusAddOnPct: 1, levelsPaid: 34 },
    { name:'Legacy Maker', volumeReqUsd: 10000000, diffPct: 23, bonusAddOnPct: 0, levelsPaid:999 }
  ]);
  console.log('💾 Rank table seeded');
}

/* ───────────────────── 3. Seed Users ───────────────────── */
async function seedUsers() {
  const [ adminPwd, sysPwd, pinHash ] = await Promise.all([
    bcrypt.hash('Test@123', 12),
    bcrypt.hash('test@123', 12),
    bcrypt.hash('0000',     12)
  ]);

  const [ admin ]  = await User.findOrCreate({
    where:{ username:'backoffice' },
    defaults:{
      firstName:'Admin', lastName:'User', email:'admin@pradafund.com',
      walletAddress: DEV_KEY, sponsorCode:'backoffice',
      passwordHash: adminPwd, pinHash
    }
  });

  const [ system ] = await User.findOrCreate({
    where:{ username:'system' },
    defaults:{
      firstName:'Regular', lastName:'User', email:'system@pradafund.com',
      walletAddress: SALE_WALLET.toLowerCase(), sponsorCode:'backoffice',
      passwordHash: sysPwd, pinHash
    }
  });

  await Wallet.findOrCreate({ where:{ userId: system.id } });

  console.log(`✅ Admin user:  ${admin._options.isNewRecord ? 'created':'exists'}`);
  console.log(`✅ System user: ${system._options.isNewRecord ? 'created':'exists'} (wallet ensured)`);
}

/* ───────────────────── 4. Blockchain demo ───────────────────── */
async function blockchainDemo() {
  if (SEED_SALE.toLowerCase() !== 'true') {
    console.log('⏩  SEED_SALE=false – skipping blockchain demo');
    return;
  }

  const provider  = new ethers.JsonRpcProvider(INFURA_RPC_URL);
  const devSigner = new ethers.Wallet(DEV_KEY, provider);
  const sendTx    = await makeTxHelper(provider, devSigner.address);

  console.log('🧪 RPC:', INFURA_RPC_URL);
  console.log('🔐 Dev wallet:', devSigner.address);
  const bnb = await provider.getBalance(devSigner.address);
  console.log('💸 BNB balance:', ethers.formatEther(bnb));
  if (bnb === 0n) { console.warn('⚠️  Zero BNB – aborting demo'); return; }

  const abi = [
    { name:'transfer',     type:'function', inputs:[{type:'address'},{type:'uint256'}] },
    { name:'approve',      type:'function', inputs:[{type:'address'},{type:'uint256'}] },
    { name:'lockTokens',   type:'function', inputs:[{type:'address'},{type:'uint128'}] },
    { name:'unlockTokens', type:'function', inputs:[{type:'address'},{type:'uint128'}] },
    { name:'getAccountInfo', type:'function', stateMutability:'view',
      inputs:[{type:'address'}],
      outputs:[{type:'uint256'},{type:'uint128'},{type:'uint256'},{type:'bool'}] }
  ];
  const prada = new ethers.Contract(PRADA_TOKEN, abi, devSigner);
  const amt   = ethers.parseUnits('1000', 18);

  console.log('--- STEP 1: transfer 1000 PRADA to SALE wallet ---');
  await sendTx(prada.transfer.bind(prada), SALE_WALLET, amt);

  console.log('--- STEP 1b: approve locker (SALE wallet) ---');
  const saleSigner = new ethers.Wallet(DEV_KEY, provider);
  const pradaSale  = prada.connect(saleSigner);
  await sendTx(pradaSale.approve.bind(pradaSale), LOCKER_ADDRESS, ethers.MaxUint256);

  console.log('--- STEP 2: lock 1000 PRADA ---');
  await sendTx(prada.lockTokens.bind(prada), SALE_WALLET, amt);

  console.log('--- STEP 3: check locked balance ---');
  let [, locked] = await prada.getAccountInfo(SALE_WALLET);
  console.log(`→ Locked before unlock: ${ethers.formatUnits(locked,18)} PRADA`);

  console.log('--- STEP 4: unlock PRADA ---');
  if (locked > 0n) await sendTx(prada.unlockTokens.bind(prada), SALE_WALLET, locked);

  [, locked] = await prada.getAccountInfo(SALE_WALLET);
  console.log(`→ Locked after unlock: ${ethers.formatUnits(locked,18)} PRADA`);
  console.log('✅ Blockchain demo complete');
}

/* ───────────────────── 5. LAB demo (optional) ───────────────────── */
async function labDemo() {
  if (DEMO_LAB.toLowerCase() !== 'true') return;

  console.log('\n━━ DEMO: Stake • Referral • Lending • Rank ━━');

  const pass = await bcrypt.hash('MyPass123!', 10);
  const pin  = await bcrypt.hash('1234',        10);

  const [ alice ] = await User.findOrCreate({
    where:{ username:'alice' },
    defaults:{ firstName:'Alice', lastName:'Root', email:'alice@demo.com',
               walletAddress: ethers.Wallet.createRandom().address,
               sponsorCode:'root', passwordHash: pass, pinHash: pin }
  });
  const [ bob ] = await User.findOrCreate({
    where:{ username:'bob' },
    defaults:{ firstName:'Bob', lastName:'Down', email:'bob@demo.com',
               walletAddress: ethers.Wallet.createRandom().address,
               sponsorCode:'alice', passwordHash: pass, pinHash: pin }
  });
  const [ carol ] = await User.findOrCreate({
    where:{ username:'carol' },
    defaults:{ firstName:'Carol', lastName:'Leaf', email:'carol@demo.com',
               walletAddress: ethers.Wallet.createRandom().address,
               sponsorCode:'bob', passwordHash: pass, pinHash: pin }
  });
  await Promise.all([alice,bob,carol].map(u=>Wallet.findOrCreate({where:{userId:u.id}})));

  async function createStake(user, usd) {
    const stake = await Stake.create({
      userId:user.id, planCode:'LAB', amountUsd:usd, amountPrada:usd*10,
      baseMonthlyRoi:5.0, startDate:new Date(),
      lockEnds: dayjs().add(60,'day').toDate(),
      roiCap:usd*2.5, totalCap:usd*4, active:true
    });
    /* Direct‑referral only */
    const sponsor = await User.findOne({ where:{ username:user.sponsorCode } });
    if (sponsor) {
      const [ w ] = await Wallet.findOrCreate({ where:{ userId:sponsor.id } });
      await w.creditDirect(usd * 0.075);
    }
    return stake;
  }
  await createStake(alice, 3000);
  await createStake(bob,   1000);
  await createStake(carol,  500);

  /* Print balances */
  for (const u of [alice,bob,carol]) {
    const w = await Wallet.findByPk(u.id);
    console.log(`→ ${u.username.padEnd(5)} direct=${w.availableDirect} diff=${w.availableDiff}`);
  }

  /* Bob loan demo */
  const stakeBob = await Stake.findOne({ where:{ userId:bob.id } });
  await Lending.create({
    userId:bob.id, stakeId:stakeBob.id,
    amountUsd:stakeBob.amountUsd, amountPrada:stakeBob.amountUsd*10,
    startedAt:new Date(), graceEnds:dayjs().add(48,'hour').toDate(),
    dueAt:dayjs().add(14,'day').toDate(), status:'active'
  });
  console.log('→ Bob loan granted');
  const loan = await Lending.findOne({ where:{ userId:bob.id, status:'active' } });
  loan.status = 'repaid';
  await loan.save();
  console.log('→ Bob loan repaid (within grace)');

  console.log('✅ Demo flows completed\n');
}

/* ───────────────────── 6. MAIN ───────────────────── */
(async () => {
  try {
    await seedRanks();
    await seedUsers();
    await blockchainDemo();   // skip with SEED_SALE=false
    await labDemo();          // skip with DEMO_LAB=false
    console.log('🎉 Startup complete');
  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }
})();

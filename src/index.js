// backend/src/index.js
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');

const { sequelize } = require('./models');

// routers
const saleRouter      = require('./routes/sale');
const authRouter      = require('./routes/auth');
const profileRouter   = require('./routes/profile');
const adminUserRouter = require('./routes/admin/users');
const walletRouter    = require('./routes/wallet');
const referralRouter  = require('./routes/referral');
const stakeRouter     = require('./routes/stake');
const withdrawRouter  = require('./routes/withdraw');
const lendingRouter   = require('./routes/lending');
const adminSaleRouter = require('./routes/adminSale');

/* ─────────────────────────────────────────────────────────────── */
(async () => {
  try {
    /* 1) Test & sync DB */
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });   // dev‑friendly; use migrations in prod

    console.log('✅ Database connected and synced');

    /* 2) Startup tasks (seed ranks, etc.) */
    require('./startup');

    /* 3) Schedule crons */
    require('./cron/roiCron');
    require('./cron/boosterCron');
    require('./cron/lendingCron');
    require('./cron/loanSweepCron')();   // <— new
    console.log('🕒 Cron jobs scheduled');

    /* 4) Launch Express */
    const app  = express();
    const PORT = process.env.PORT || 8080;

    app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
    app.use(bodyParser.json());

    /* ── Public / Auth routes ─────────────────────────────────── */
    app.use('/api/auth',     authRouter);
    app.use('/api/dashboard', require('./routes/dashboard'));   // ← add this line

    /* ── Auth‑protected routes (jwtAuth is inside each router) ── */
    app.use('/api/profile',  profileRouter);
    app.use('/api/admin/users', adminUserRouter);

    app.use('/api/wallet',    walletRouter);
    app.use('/api/referrals', referralRouter);
    app.use('/api/stake',     stakeRouter);
    app.use('/api/withdraw',  withdrawRouter);
    app.use('/api/lend',      lendingRouter);

    /* ── Admin sale route (already protected inside) ──────────── */
    app.use('/api/adminSale', adminSaleRouter);

    /* ── Token sale (public buy/list) ─────────────────────────── */
    app.use('/api/sale', saleRouter);

    /* Health check */
    app.get('/', (_req, res) => res.send('PradaFund Backend is running 🚀'));

    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error('❌ Failed to start application:', err);
    process.exit(1);
  }
})();

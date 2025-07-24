# PradaFund Backend

This Node.js project provides the API and background jobs for the PradaFund token sale and staking platform.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file with the following environment variables:
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
   - `JWT_SECRET`
   - `INFURA_RPC_URL`, `DEV_WALLET_PRIVATE_KEY`, `SALE_WALLET_ADDRESS`, `PRADA_TOKEN_ADDRESS`
   - any other variables referenced in `src/config` or cron jobs.
3. Run the development server:
   ```bash
   npm run dev
   ```

## Scripts
- `npm start` – start the server
- `npm run dev` – start with nodemon for development
- `npm run migrate` – run database migrations (uses `sequelize-cli`)

## Tests
This repository currently has no automated tests.

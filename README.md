# Farm and Stake by Adi

Mini Project done for the purpose of submitting as Assignment to Ratio Finance Team

## How to Use Front End (already set Base User Keypair)

Base User Secret Key (devnet) : [232,204,247,3,136,186,142,99,53,249,131,141,169,213,122,60,87,246,39,107,6,212,102,213,16,43,149,28,35,136,248,208,208,154,129,101,124,42,135,241,200,41,213,62,20,10,89,168,235,20,198,201,225,187,58,161,113,139,243,94,34,80,248,96]

Import the base user secret key from above to Wallet of your choice for interacting with the front end

```bash
cd app
yarn
yarn run dev
```
## How to use Front End (from scratch)

1. npm install
2. anchor test
3. Copy the Different Account Addresses printed in terminal while anchor testing
![Addresses to copy](https://i.ibb.co/RhtZTYs/terminal.png)
4. edit app/src/views/HomeView/index.tsx and input the addresses from above correspondingly
![Addresses to input](https://i.ibb.co/k90bJgf/index.png)
5. cd app
6. yarn
7. yarn run dev
8. Import the base user secret key printed on terminal to Wallet of your choice for interacting with the front end

## Tech Stack

This project includes:

- Anchor
- Next.JS
- TypeScript
- [@solana/wallet-adapter](https://github.com/solana-labs/wallet-adapter) and [@solana/web3.js](https://solana-labs.github.io/solana-web3.js) for interactions with wallets & blockchain.
- Tailwind CSS (with [daisyUI](https://daisyui.com/))

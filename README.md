# Farm and Stake by Adi

Mini Project done for the purpose of submitting as Assignment to Ratio Finance Team

## How to Use Front End (already set Base User Keypair)

Base User Secret Key (devnet) : [228,58,206,71,19,155,76,229,76,89,205,92,153,40,211,253,171,165,82,93,205,224,153,148,250,12,91,10,40,213,78,46,25,223,190,247,22,14,9,221,180,27,193,7,183,70,93,105,179,20,174,55,99,226,87,246,196,103,57,3,155,107,16,188]

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
![Addresses to copy]((https://i.ibb.co/RhtZTYs/terminal.png))
4. edit app/src/views/HomeView/index.tsx and input these addresses correspondingly
![Addresses to input]((https://i.ibb.co/k90bJgf/index.png))
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

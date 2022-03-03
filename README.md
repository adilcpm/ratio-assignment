# Farming program assignment

This is assignment is designed to help our team evaluate proficiency with the Solana programing model, focusing on the Anchor framework

This involves a building an integrated application, consisting of a frontend (React app) and a Solana program

Estimated time to complete is between 2-3 weeks

## Components to build

1. Create base-user and super-user accounts
1. Build out `platform` program to spec
   1. Global State (PDA)
   1. `pool` for `testToken` (PDA)
   1. Deposit function: user -> `pool`
   1. Withdraw function: `pool` -> user
1. Create a second program called `farm-program`
   1. `farm` (PDA)
   1. Stake function: `pool` -> `farm`
   1. Harvest function (calls Reward Calculation function): `farm` -> user
   1. Unstake function (calls Harvest function): `farm` -> `pool`
   1. Reward Calculation function
   - This calculates (time elapsed since Staking \* rewards per sec)
1. Create React app (with Typescript) for UI, with the ability to use all of the functionality described + sign and send transactions

## Tests to be run

1. Create `farm` (this can be done at any step before "Stake" test)
1. Create global state
   1. Should __fail__ if base-user tries to call this
1. Create token (mint) thru Anchor Typescript, called `testToken`
1. Super-user creates `pool`
1. Super-user mints `testToken` to `pool`
1. Super-user mints `testToken` to base-user
1. Base-user deposits `testToken` to `pool`
1. Base-user should __fail__ to withdraw more than token amount the base-user deposited to `pool`
1. Base-user stakes `testToken` from `pool` to `farm` via CPI
1. Base-user harvests rewards (in the form of `testToken`) from `farm` to `user` via CPI
1. Base-user unstakes `testToken` from `farm` to `pool` via CPI, also harvesting rewards
1. Base-user withdraws `testToken` from `pool`

## Requirements

- There should be a base-user and a super-user
- Typescript must be used for React app and unit-testing Solana program code
- The tester needs to be able to:
  1.  clone the repo
  1.  run `anchor test` and all tests need to pass
  1.  click through each feature without failing
  1.  sign and send transactions without failing

### Guidelines:

- Clone repo
- Create new branch
- Create the React app in the `app` directory, this must use typescript
- Commits should be made often, and they should be small, preferably at each feature addition/update
- Submit PR (`git push`)


## questions & answers

1. How could you get the real-world market price of token in the contract?

1. How do you call another contract's function in your contract?

1. How can you get account information in your contract?

1. How do you deposit SOL to your contract?

1. What is difference between devnet & testnet on Solana?

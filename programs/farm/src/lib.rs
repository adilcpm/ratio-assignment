use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, CloseAccount, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("6mMVWS9wvoME4hg3DdytZGVMQT7f6hX2KKPQMRMhe7iv");

#[program]
pub mod farm {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, bump: u8) -> Result<()> {
        msg!("CREATING FARM!");

        let farm_account = &mut ctx.accounts.farm_account;

        farm_account.pool_test_token = ctx.accounts.pool_account.key();
        farm_account.time_elapsed = 0;
        farm_account.staked = 0;
        farm_account.bump = bump;
        farm_account.authority = ctx.accounts.authority.key();

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub global_state_account: Box<Account<'info, GlobalStateAccount>>,
    #[account(init,
        seeds = [global_state_account.key().as_ref() , pool_account.key().as_ref()],
        bump,
        payer = authority,
        space = FarmAccount::LEN + 8
    )]
    pub farm_account: Box<Account<'info, FarmAccount>>,
    #[account(
        token::mint = global_state_account.mint_test_token,
        token::authority = authority,
    )]
    pub pool_account: Box<Account<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct GlobalStateAccount {
    pub state_name: [u8; 10], // 10
    pub state_bump: u8,       // 1
    pub authority: Pubkey,    // 32

    pub pool_name: [u8; 10],     // 10
    pub pool_bump: u8,           // 1
    pub pool_test_token: Pubkey, // 32
    pub mint_test_token: Pubkey, // 32
    pub total_deposits: u64,     //8
    pub total_farmed: u64,       //8
}

#[account]
pub struct FarmAccount {
    pub authority: Pubkey,       // 32
    pub bump: u8,                // 1
    pub time_elapsed: u64,       // 8
    pub staked: u64,             // 8
    pub pool_test_token: Pubkey, // 32
}

impl FarmAccount {
    pub const LEN: usize = 32 + 8 + 8 + 32 + 1;
}

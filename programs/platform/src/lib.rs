use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, CloseAccount, Mint, MintTo, Token, TokenAccount, Transfer};
use farm::cpi::accounts::Initialize;
use farm::program::Farm;
use farm::{self, FarmAccount};

declare_id!("9LhUyaj7hcpBMZVrigHUyrsq5tysdD47NgEzsXB9Nt4z");

#[program]
pub mod platform {
    use super::*;
    pub fn initialize_global_state(
        ctx: Context<InitializeGlobalState>,
        bump: u8,
    ) -> Result<()> {
        msg!("INITIALIZE GLOBAL STATE");

        let global_state_account = &mut ctx.accounts.global_state_account;

        global_state_account.authority = *ctx.accounts.authority.key;
        global_state_account.state_bump = bump;
        global_state_account.total_deposits = 0;

        Ok(())
    }

    pub fn create_pool(
        ctx: Context<CreatePool>,
        bump: u8,
    ) -> Result<()> {
        msg!("CREATING POOL!");

        let global_state_account = &mut ctx.accounts.global_state_account;

        global_state_account.pool_test_token = ctx.accounts.pool_account.key();
        global_state_account.mint_test_token = ctx.accounts.mint_test_token.key();
        global_state_account.total_deposits = 0;
        global_state_account.total_farmed = 0;
        global_state_account.pool_bump = bump;

        Ok(())
    }

    pub fn create_farm(ctx: Context<CreateFarm>, farm_bump: u8) -> Result<()> {

        let cpi_accounts = Initialize{
            authority: ctx.accounts.authority.to_account_info(),
            farm_account: ctx.accounts.farm_account.to_account_info(),
            global_state_account: ctx.accounts.global_state_account.to_account_info(),
            pool_account: ctx.accounts.pool_account.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info()
        };
        let cpi_program = ctx.accounts.farm_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        farm::cpi::initialize(cpi_ctx, farm_bump)?;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        ctx.accounts.global_state_account.total_deposits += amount;
        let cpi_accounts = Transfer {
            from: ctx.accounts.base_user_test_token_account.to_account_info(),
            to: ctx.accounts.pool_account.to_account_info(),
            authority: ctx.accounts.base_user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let global_state_authority = ctx.accounts.global_state_account.authority;
        let seeds = [
            global_state_authority.as_ref(),
            &[ctx.accounts.global_state_account.state_bump],
        ];
        let signers = &[&seeds[..]];

        if ctx.accounts.global_state_account.total_deposits < amount {
            return Err(ErrorCode::InsufficientFund.into());
        }
        ctx.accounts.global_state_account.total_deposits -= amount;
        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_account.to_account_info(),
            to: ctx.accounts.base_user_test_token_account.to_account_info(),
            authority: ctx.accounts.global_state_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signers);
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeGlobalState<'info> {
    // Global State Authority account
    #[account(mut)]
    pub authority: Signer<'info>,

    // Global State Account
    #[account(init,
        seeds = [authority.key().as_ref()],
        bump,
        payer = authority,
        space = GlobalStateAccount::LEN + 8
    )]
    pub global_state_account: Box<Account<'info, GlobalStateAccount>>,
   
    // Programs and Sysvars
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreatePool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    // Global State Account
    #[account(
        mut,
        has_one = authority,
        seeds = [authority.key().as_ref()],
        bump
    )]
    pub global_state_account: Box<Account<'info, GlobalStateAccount>>,
    
    #[account(
        init,
        seeds = [global_state_account.key().as_ref()],
        bump,
        token::mint = mint_test_token,
        token::authority = global_state_account,
        payer = authority
    )]
    pub pool_account: Box<Account<'info, TokenAccount>>,
    pub mint_test_token: Box<Account<'info, Mint>>,

    // Programs and Sysvars
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateFarm<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    // Global State Account
    #[account(
        mut, 
        has_one = authority,
        seeds = [authority.key().as_ref()],
        bump,
    )]
    pub global_state_account: Box<Account<'info, GlobalStateAccount>>,
    /// CHECK: Checked when doing CPI to farm program
    #[account(mut)]
    pub farm_account: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [global_state_account.key().as_ref()],
        bump,
        token::mint = global_state_account.mint_test_token,
        token::authority = global_state_account,
    )]
    pub pool_account: Box<Account<'info, TokenAccount>>,

    // Programs and Sysvars
    pub system_program: Program<'info, System>,
    
    pub farm_program: Program<'info, Farm>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub base_user: Signer<'info>,

    #[account(mut,
        seeds = [global_state_account.key().as_ref()],
        bump,
        token::mint = global_state_account.mint_test_token,
        token::authority = global_state_account,
    )]
    pub pool_account: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        token::mint = global_state_account.mint_test_token,
        token::authority = base_user,
    )]
    pub base_user_test_token_account: Box<Account<'info, TokenAccount>>,

    // Global State Account
    #[account(
        mut,
        seeds = [global_state_account.authority.key().as_ref()],
        bump,
    )]
    pub global_state_account: Box<Account<'info, GlobalStateAccount>>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub base_user: Signer<'info>,

    #[account(mut,
        seeds = [global_state_account.key().as_ref()],
        bump,
        token::mint = global_state_account.mint_test_token,
        token::authority = global_state_account,
    )]
    pub pool_account: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        token::mint = global_state_account.mint_test_token,
        token::authority = base_user,
    )]
    pub base_user_test_token_account: Box<Account<'info, TokenAccount>>,

    // Global State Account
    #[account(
        mut,
        seeds = [global_state_account.authority.key().as_ref()],
        bump,
    )]
    pub global_state_account: Box<Account<'info, GlobalStateAccount>>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct GlobalStateAccount {
    pub state_bump: u8,   // 1
    pub authority: Pubkey, // 32
    
    pub pool_bump: u8,   // 1
    pub pool_test_token: Pubkey, // 32
    pub mint_test_token: Pubkey,  // 32
    pub total_deposits: u64, //8
    pub total_farmed: u64, //8
}

impl GlobalStateAccount {
    pub const LEN: usize =  1 + 32 + 1 + (2 * 32) + 8 + 8;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Trying to Withdraw more than what you have !")]
    InsufficientFund,
}
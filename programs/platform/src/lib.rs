use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_lang::solana_program::clock::Clock;
use farm::program::Farm;
use farm;

declare_id!("9LhUyaj7hcpBMZVrigHUyrsq5tysdD47NgEzsXB9Nt4z");

#[program]
pub mod platform {
    use super::*;
    pub fn initialize_global_state(
        ctx: Context<InitializeGlobalState>,
        state_bump: u8,
    ) -> Result<()> {
        msg!("INITIALIZE GLOBAL STATE");

        let global_state_account = &mut ctx.accounts.global_state_account;

        global_state_account.authority = *ctx.accounts.authority.key;
        global_state_account.user = *ctx.accounts.user.key;
        global_state_account.state_bump = state_bump;
        global_state_account.total_deposits = 0;

        Ok(())
    }

    pub fn create_pool(
        ctx: Context<CreatePool>,
        pool_bump: u8,
    ) -> Result<()> {
        msg!("CREATING POOL!");

        let global_state_account = &mut ctx.accounts.global_state_account;

        global_state_account.pool_test_token = ctx.accounts.pool_account.key();
        global_state_account.mint_test_token = ctx.accounts.mint_test_token.key();
        global_state_account.total_deposits = 0;
        global_state_account.total_staked = 0;
        global_state_account.pool_bump = pool_bump;

        Ok(())
    }
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        ctx.accounts.global_state_account.total_deposits += amount;
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.pool_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        if amount >  ctx.accounts.global_state_account.total_deposits {
            return Err(ErrorCode::InsufficientFundForWithdrawal.into());
        }
        ctx.accounts.global_state_account.total_deposits -= amount;
        
        let global_state_authority = ctx.accounts.global_state_account.authority;
        let seeds = [
            global_state_authority.as_ref(),
            &[ctx.accounts.global_state_account.state_bump],
        ];
        let signers = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.global_state_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signers);
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn create_farm(ctx: Context<CreateFarm>, farm_bump: u8, rewards_per_second: i64) -> Result<()> {
        let global_state_account = &mut ctx.accounts.global_state_account;
        global_state_account.farm_bump = farm_bump;
        global_state_account.rewards_per_seconds = rewards_per_second;
        global_state_account.total_staked = 0;

        let pool_account_key = ctx.accounts.pool_account.key();
        let seeds1 = [
            pool_account_key.as_ref(),
            &[farm_bump],
        ];

        let global_state_account_key = ctx.accounts.global_state_account.key();
        let pool_bump = ctx.accounts.global_state_account.pool_bump;
        let seeds2 = [
            global_state_account_key.as_ref(),
            &[pool_bump]
        ];

        let signers = &[&seeds1[..],&seeds2[..]];

        let cpi_accounts = farm::cpi::accounts::CreateFarm{
            authority: ctx.accounts.authority.to_account_info(),
            farm_account: ctx.accounts.farm_account.to_account_info(),
            global_state_account: ctx.accounts.global_state_account.to_account_info(),
            pool_account: ctx.accounts.pool_account.to_account_info(),
            mint_test_token: ctx.accounts.mint_test_token.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };

        let cpi_program = ctx.accounts.farm_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signers);
        farm::cpi::create_farm(cpi_ctx)?;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        if amount > ctx.accounts.global_state_account.total_deposits {
            return Err(ErrorCode::InsufficientFundForStaking.into());
        }
        ctx.accounts.global_state_account.total_staked += amount;
        ctx.accounts.global_state_account.time_of_initial_staking = Clock::get()?.unix_timestamp;

        let global_state_authority_key = ctx.accounts.global_state_account.authority.key();
        let user_key = ctx.accounts.user.key();
        let seeds = [
            global_state_authority_key.as_ref(),
            user_key.as_ref(),
            &[ctx.accounts.global_state_account.state_bump],
        ];
        
        let signers = &[&seeds[..]];
        let cpi_accounts = farm::cpi::accounts::Stake{
            farm_account: ctx.accounts.farm_account.to_account_info(),
            pool_account: ctx.accounts.pool_account.to_account_info(),
            global_state_account: ctx.accounts.global_state_account.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        };
        let cpi_program = ctx.accounts.farm_program.to_account_info();
        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signers);
        farm::cpi::stake(cpi_context, amount)?;
        Ok(())
    }

    pub fn harvest(ctx: Context<Harvest>) -> Result<()> {
        let time_of_initial_staking = ctx.accounts.global_state_account.time_of_initial_staking;
        let rewards_per_second = ctx.accounts.global_state_account.rewards_per_seconds;

        let global_state_authority_key = ctx.accounts.global_state_account.authority.key();
        let user_key = ctx.accounts.user.key();
        let seeds = [
            global_state_authority_key.as_ref(),
            user_key.as_ref(),
            &[ctx.accounts.global_state_account.state_bump],
        ];
        
        let signers = &[&seeds[..]];
        let cpi_accounts = farm::cpi::accounts::Harvest{
            global_state_account: ctx.accounts.global_state_account.to_account_info(),
            farm_account: ctx.accounts.farm_account.to_account_info(),
            pool_account: ctx.accounts.pool_account.to_account_info(),
            user_token_account: ctx.accounts.user_token_account.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        };
        let cpi_program = ctx.accounts.farm_program.to_account_info();
        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signers);
        farm::cpi::harvest(cpi_context, time_of_initial_staking, rewards_per_second)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeGlobalState<'info> {
    // Super User Account
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: Just storing the info
    pub user: AccountInfo<'info>,

    // Global State Account
    #[account(init,
        seeds = [authority.key().as_ref(),user.key().as_ref()],
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
    // Super User Account
    #[account(mut)]
    pub authority: Signer<'info>,

    // Global State Account
    #[account(
        mut,
        has_one = authority,
        seeds = [authority.key().as_ref(), global_state_account.user.key().as_ref()],
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
    // Super User Account
    #[account(mut)]
    pub authority: Signer<'info>,

    // Global State Account
    #[account(
        mut, 
        has_one = authority,
        seeds = [authority.key().as_ref(),global_state_account.user.key().as_ref()],
        bump,
    )]
    pub global_state_account: Box<Account<'info, GlobalStateAccount>>,

    /// CHECK: Checked when doing CPI to farm program
    #[account(mut)]
    pub farm_account: UncheckedAccount<'info>,

    #[account(
        seeds = [global_state_account.key().as_ref()],
        bump,
        token::mint = global_state_account.mint_test_token,
        token::authority = global_state_account,
    )]
    pub pool_account: Box<Account<'info, TokenAccount>>,
    pub mint_test_token: Box<Account<'info, Mint>>,


    // Programs and Sysvars
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub farm_program: Program<'info, Farm>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    // Base User Account
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut,
        seeds = [global_state_account.key().as_ref()],
        bump,
        token::mint = global_state_account.mint_test_token,
        token::authority = global_state_account,
    )]
    pub pool_account: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        token::mint = global_state_account.mint_test_token,
        token::authority = user,
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    // Global State Account
    #[account(
        mut,
        seeds = [global_state_account.authority.key().as_ref(),user.key().as_ref()],
        bump,
    )]
    pub global_state_account: Box<Account<'info, GlobalStateAccount>>,

    // Programs and sysvars
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    // Base User Account
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut,
        seeds = [global_state_account.key().as_ref()],
        bump,
        token::mint = global_state_account.mint_test_token,
        token::authority = global_state_account,
    )]
    pub pool_account: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        token::mint = global_state_account.mint_test_token,
        token::authority = user,
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    // Global State Account
    #[account(
        mut,
        seeds = [global_state_account.authority.key().as_ref(),user.key().as_ref()],
        bump,
    )]
    pub global_state_account: Box<Account<'info, GlobalStateAccount>>,

    // Programs and sysvars
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    // Base User Account
    pub user: Signer<'info>,

    #[account(mut,
        seeds = [pool_account.key().as_ref()],
        bump,
        token::mint = global_state_account.mint_test_token,
        token::authority = pool_account,
    )]
    pub farm_account: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        seeds = [global_state_account.key().as_ref()],
        bump,
        token::mint = global_state_account.mint_test_token,
        token::authority = global_state_account,
    )]
    pub pool_account: Box<Account<'info, TokenAccount>>,

    // Global State Account
    #[account(
        mut,
        seeds = [global_state_account.authority.key().as_ref(),user.key().as_ref()],
        bump,
    )]
    pub global_state_account: Box<Account<'info, GlobalStateAccount>>,

    // Programs and Sysvars
    pub token_program: Program<'info, Token>,
    pub farm_program: Program<'info, Farm>,
}

#[derive(Accounts)]
pub struct Harvest<'info> {
    // Base User Account
    pub user: Signer<'info>,

    #[account(mut,
        seeds = [pool_account.key().as_ref()],
        bump,
        token::mint = global_state_account.mint_test_token,
        token::authority = pool_account,
    )]
    pub farm_account: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        seeds = [global_state_account.key().as_ref()],
        bump,
        token::mint = global_state_account.mint_test_token,
        token::authority = global_state_account,
    )]
    pub pool_account: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        token::mint = global_state_account.mint_test_token,
        token::authority = user,
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    // Global State Account
    #[account(mut,
        seeds = [global_state_account.authority.key().as_ref(),user.key().as_ref()],
        bump,
    )]
    pub global_state_account: Box<Account<'info, GlobalStateAccount>>,

    // Programs and Sysvars
    pub token_program: Program<'info, Token>,
    pub farm_program: Program<'info, Farm>,
}

#[account]
pub struct GlobalStateAccount {
    pub state_bump: u8,   // 1
    pub authority: Pubkey, // 32
    pub user: Pubkey, //32
    
    pub pool_bump: u8,   // 1
    pub pool_test_token: Pubkey, // 32
    pub mint_test_token: Pubkey,  // 32
    pub total_deposits: u64, //8


    pub farm_bump: u8, //1
    pub total_staked: u64, //8
    pub time_of_initial_staking: i64, //8
    pub rewards_per_seconds: i64, //8
}

impl GlobalStateAccount {
    pub const LEN: usize =  1 + 32 + 32 + 1 + (2 * 32) + 8 + 1 + 8 + 8 + 8;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Trying to Withdraw more than what you have !")]
    InsufficientFundForWithdrawal,
    #[msg("Trying to Stake more than what you have deposited!")]
    InsufficientFundForStaking,
}
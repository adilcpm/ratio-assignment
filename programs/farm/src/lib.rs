use anchor_lang::prelude::*;
use anchor_spl::token::{ self, Transfer, Mint, Token, TokenAccount};

declare_id!("6mMVWS9wvoME4hg3DdytZGVMQT7f6hX2KKPQMRMhe7iv");

#[program]
pub mod farm {
    use super::*;

    pub fn create_farm(_ctx: Context<CreateFarm>) -> Result<()> {
        msg!("CREATING FARM !");

        Ok(())
    }

    pub fn stake_farm(ctx: Context<Stake>, amount: u64) -> Result<()> {
        msg!("STAKING : {}", amount);

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_account.to_account_info(),
            to: ctx.accounts.farm_account.to_account_info(),
            authority: ctx.accounts.global_state_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn un_stake_farm(ctx: Context<UnStake>, amount: u64) -> Result<()> {
        msg!("UNSTAKING : {}", amount);

        let cpi_accounts = Transfer {
            from: ctx.accounts.farm_account.to_account_info(),
            to: ctx.accounts.pool_account.to_account_info(),
            authority: ctx.accounts.pool_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn harvest_farm(ctx: Context<Harvest>, time_of_initial_staking: i64, rewards_per_second: f32) -> Result<()> {
        let reward_amount: i64 = reward_calculation(ctx.accounts.farm_account.amount, time_of_initial_staking, rewards_per_second).try_into().unwrap();
        let cpi_accounts = Transfer {
            from: ctx.accounts.harvest_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.harvest_signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, reward_amount.try_into().unwrap())?;
        msg!("HARVESTING : {}", reward_amount);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateFarm<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: checks done at caller prior to CPI
    // Global State Account
    #[account(mut)]
    pub global_state_account: UncheckedAccount<'info>,
    
    #[account(
        init,
        token::mint = mint_test_token,
        token::authority = pool_account,
        payer = authority
    )]
    pub farm_account: Box<Account<'info, TokenAccount>>,

    // TODO check whether function can be called from client directly
    pub pool_account: Box<Account<'info, TokenAccount>>,
    pub mint_test_token: Box<Account<'info, Mint>>,

    // Programs and Sysvars
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    /// CHECK: checks done at caller prior to CPI
    // Global State Account
    #[account(signer)]
    pub global_state_account: AccountInfo<'info>,
    
    #[account(mut)]
    pub farm_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub pool_account: Box<Account<'info, TokenAccount>>,

    // Programs and Sysvars
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UnStake<'info> {
    
    #[account(mut)]
    pub farm_account: Box<Account<'info, TokenAccount>>,
    #[account(signer, mut)]
    pub pool_account: Box<Account<'info, TokenAccount>>,

    // Programs and Sysvars
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Harvest<'info> {
    
    #[account(mut)]
    pub farm_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub harvest_account: Box<Account<'info, TokenAccount>>,
    /// CHECK: checks done at caller prior to CPI
    #[account(signer)]
    pub harvest_signer: AccountInfo<'info>,

    #[account(mut)]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    // Programs and Sysvars
    pub token_program: Program<'info, Token>,
}

fn reward_calculation(staked_amount: u64,time_of_initial_staking: i64, rewards_per_second: f32) -> i64 {
    let staked_amount = staked_amount.try_into().unwrap();
    let current_time = Clock::get().unwrap().unix_timestamp;
    let time_elapsed = current_time.checked_sub(time_of_initial_staking).unwrap();
    let reward: i64 = (rewards_per_second as f64 * (time_elapsed.checked_mul(staked_amount).unwrap()) as f64).round() as i64;
    msg!("Time of Last Harvest: {}\nCurrent Time: {}\nTime Elapsed: {}\nReward amount: {}",time_of_initial_staking,current_time,time_elapsed,reward);
    msg!("Rewards Per Second: {}",rewards_per_second);
    return reward
}


use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction;
use rand::Rng;
use std::mem::size_of;
use std::ops::Range;

declare_id!("Cn1Tm9zWUaggGKPeRjG28sRYu2Yw8Ps5bg7Y7UphpZUh");

const RANGE: Range<u64> = 80000..100000;

#[account]
#[derive(InitSpace)]
pub struct Betmux {
    pub total_bets: u64,   // Total number of bets created
    pub total_volume: u64, // Total amount of lamports bet
    pub participated: u64,
    pub admin: Pubkey, // Program admin
}

#[account]
pub struct Registry {
    pub betting_events: Vec<Pubkey>, // List of BettingEvent account addresses
    pub users: Vec<Pubkey>,
}

#[account]
pub struct BettingEvent {
    pub event_id: u64,             // Unique identifier for the betting event
    pub owner: Pubkey,             // Creator of the bet
    pub bet_amount: u64,           // Amount to bet in lamports
    pub simulated_price: u64,      // Randomly generated Bitcoin price
    pub outcome: Option<bool>,     // True for up, False for down, None if undecided
    pub participants: Vec<Pubkey>, // List of participating users
}

#[account]
pub struct UserAccount {
    pub name: String,
}

#[account]
pub struct Bet {
    pub event_id: u64,    // ID of the betting event
    pub prediction: bool, // User's prediction: True (up), False (down)
    pub amount: u64,      // Bet amount
    pub user_account: Pubkey,
}

#[derive(Accounts)]
pub struct InitializeProgram<'info> {
    #[account(init, payer = admin, space = 8 + size_of::<Betmux>())]
    // Adjust size based on Betmux fields
    pub betmux: Account<'info, Betmux>,

    #[account(init, payer = admin, space = 8 + size_of::<Registry>() * 100)]
    // Adjust size for the Registry, Max = 100 Bets
    pub registry: Account<'info, Registry>,

    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateUser<'info> {
    #[account(init, payer = user, space = 8 + size_of::<UserAccount>())]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub registry: Account<'info, Registry>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateBet<'info> {
    #[account(init, payer = user, space = 8 + size_of::<BettingEvent>())]
    pub betting_event: Account<'info, BettingEvent>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub registry: Account<'info, Registry>,
    pub betmux: Account<'info, Betmux>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub betting_event: Account<'info, BettingEvent>,
    #[account(init, payer = user, space = 8 + size_of::<Bet>())]
    bet: Account<'info, Bet>,
    #[account(mut)]
    pub user: Signer<'info>,
    // pub user_account: Account<'info, UserAccount>,
    pub registry: Account<'info, Registry>,
    pub betmux: Account<'info, Betmux>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveBet<'info> {
    #[account(mut)]
    pub betting_event: Account<'info, BettingEvent>,
    pub registry: Account<'info, Registry>,
    pub betmux: Account<'info, Betmux>,
    #[account(signer)]
    pub owner: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[program]
pub mod betmux {
    use super::*;

    pub fn initialize(_ctx: Context<InitializeProgram>) -> Result<()> {
        Ok(())
    }

    pub fn create_user(ctx: Context<CreateUser>, name: String) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        let registry = &mut ctx.accounts.registry;
        // Ensure the name doesn't exceed the maximum length
        if name.len() > 32 {
            msg!("Name Should not Exceed 32 Characters!");
            return Err(ProgramError::InvalidArgument.into());
        }

        user_account.name = name;
        registry.users.push(user_account.key());

        Ok(())
    }

    pub fn create_bet(ctx: Context<CreateBet>, bet_amount: u64) -> Result<()> {
        let betting_event = &mut ctx.accounts.betting_event;
        let registry = &mut ctx.accounts.registry;
        let betmux = &mut ctx.accounts.betmux;

        betting_event.event_id = Clock::get()?.unix_timestamp as u64;
        betting_event.owner = betmux.key();
        betting_event.bet_amount = bet_amount;
        betting_event.simulated_price = rand::thread_rng().gen_range(RANGE); // Random BTC price
        betting_event.outcome = None;
        betting_event.participants = Vec::new();
        registry.betting_events.push(betting_event.key());
        Ok(())
    }

    pub fn place_bet(ctx: Context<PlaceBet>, user_account: Pubkey, prediction: bool) -> Result<()> {
        let betting_event = &mut ctx.accounts.betting_event;
        // let user_account = &mut ctx.accounts.user_account;
        let bet = &mut ctx.accounts.bet;
        // let registry = &mut ctx.accounts.registry;
        let betmux = &mut ctx.accounts.betmux;

        // Add user to participants
        betting_event.participants.push(user_account.key());

        // Save user's bet
        // bet.user = "";
        bet.user_account = user_account.key();
        bet.event_id = betting_event.event_id;
        bet.prediction = prediction;
        bet.amount = betting_event.bet_amount;

        betmux.participated += 1;
        betmux.total_bets += 1;
        betmux.total_volume += betting_event.bet_amount;

        // Transfer bet amount to the program's escrow
        invoke(
            &system_instruction::transfer(
                &ctx.accounts.user.key(),
                betting_event.to_account_info().key,
                betting_event.bet_amount,
            ),
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.betting_event.to_account_info(),
            ],
        )?;
        Ok(())
    }

    pub fn resolve_bet(ctx: Context<ResolveBet>) -> Result<()> {
        let betting_event = &mut ctx.accounts.betting_event;
    
        // Generate new simulated price
        let new_price = rand::thread_rng().gen_range(RANGE);
        let outcome = new_price > betting_event.simulated_price; // True if up, False if down
        betting_event.outcome = Some(outcome);
    
        // Ensure there are enough remaining accounts for all participants
        if betting_event.participants.len() > ctx.remaining_accounts.len() {
            return Err(ProgramError::NotEnoughAccountKeys.into());
        }
    
        // Iterate over the participants and remaining accounts together
        let remaining_accounts = &ctx.remaining_accounts;

        for participant in &betting_event.participants {
            // Get the next account info
            let bet_data = next_account_info(&mut remaining_accounts.iter())?;
            // Try converting the bet_data to a Bet account
            let the_bet = Account::<Bet>::try_from(bet_data)?;
    
            // Ensure the bet account corresponds to this participant and event
            if the_bet.user_account != *participant || the_bet.event_id != betting_event.event_id {
                return Err(ProgramError::InvalidAccountData.into());
            }
    
            // Check if the participant's prediction was correct
            if the_bet.prediction == outcome {
                // Reward the winner
                invoke(
                    &system_instruction::transfer(
                        betting_event.to_account_info().key,
                        &the_bet.user_account,
                        the_bet.amount * 2, // Winner gets double their bet
                    ),
                    &[
                        betting_event.to_account_info(),
                        ctx.accounts.system_program.to_account_info(),
                    ],
                )?;
            }
        }
    
        Ok(())
    }
    
}
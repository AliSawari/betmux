#![allow(clippy::result_large_err)]


use anchor_lang::prelude::*;

declare_id!("Cn1Tm9zWUaggGKPeRjG28sRYu2Yw8Ps5bg7Y7UphpZUh");


#[program]
pub mod betmux {
    use super::*;

  pub fn close(_ctx: Context<CloseBetmux>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.betmux.count = ctx.accounts.betmux.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.betmux.count = ctx.accounts.betmux.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializeBetmux>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.betmux.count = value.clone();
    Ok(())
  }

}

#[derive(Accounts)]
pub struct InitializeBetmux<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + Betmux::INIT_SPACE,
  payer = payer
  )]
  pub betmux: Account<'info, Betmux>,
  pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct CloseBetmux<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub betmux: Account<'info, Betmux>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub betmux: Account<'info, Betmux>,
}

#[account]
#[derive(InitSpace)]
pub struct Betmux {
  count: u8,
}

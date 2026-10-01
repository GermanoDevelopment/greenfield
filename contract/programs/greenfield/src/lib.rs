use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

declare_id!("DFebMWgv4WEJgzodxnQwvXavUeFKXT3mPPMXtMrWyoRv");

#[program]
pub mod greenfield {
    use super::*;

    /// Cria o Tesouro Comunitário para um mint de USDC. `authority` é a chave
    /// controlada pelo backend, responsável por criar bounties e autorizar claims
    /// depois de verificar o merge do PR fora da chain.
    pub fn initialize_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        treasury.authority = ctx.accounts.authority.key();
        treasury.mint = ctx.accounts.mint.key();
        treasury.vault = ctx.accounts.vault.key();
        treasury.total_deposited = 0;
        treasury.total_reserved = 0;
        treasury.total_claimed = 0;
        treasury.bump = ctx.bumps.treasury;
        Ok(())
    }

    /// Deposita USDC no Tesouro. Qualquer conta pode financiar o pool comunitário.
    pub fn fund_treasury(ctx: Context<FundTreasury>, amount: u64) -> Result<()> {
        require!(amount > 0, GreenfieldError::InvalidAmount);

        token::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.funder_token_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.funder.to_account_info(),
                },
            ),
            amount,
            ctx.accounts.mint.decimals,
        )?;

        ctx.accounts.treasury.total_deposited = ctx
            .accounts
            .treasury
            .total_deposited
            .checked_add(amount)
            .ok_or(GreenfieldError::MathOverflow)?;

        Ok(())
    }

    /// Registra uma bounty e reserva `amount` do Tesouro (Invariante 4 — solvência).
    /// O valor fica imutável a partir daqui (Invariante 2).
    pub fn create_bounty(ctx: Context<CreateBounty>, bounty_id: u64, amount: u64) -> Result<()> {
        require!(amount > 0, GreenfieldError::InvalidAmount);

        let treasury = &mut ctx.accounts.treasury;
        let available = treasury
            .total_deposited
            .checked_sub(treasury.total_reserved)
            .ok_or(GreenfieldError::MathOverflow)?;
        require!(available >= amount, GreenfieldError::InsufficientTreasuryBalance);

        treasury.total_reserved = treasury
            .total_reserved
            .checked_add(amount)
            .ok_or(GreenfieldError::MathOverflow)?;

        let bounty = &mut ctx.accounts.bounty;
        bounty.treasury = treasury.key();
        bounty.bounty_id = bounty_id;
        bounty.maintainer = ctx.accounts.maintainer.key();
        bounty.developer = None;
        bounty.amount = amount;
        bounty.status = BountyStatus::Open;
        bounty.bump = ctx.bumps.bounty;

        Ok(())
    }

    /// Atribui o desenvolvedor responsável por resolver a Issue da bounty.
    pub fn assign_developer(ctx: Context<AssignDeveloper>, developer: Pubkey) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty;
        require!(bounty.status == BountyStatus::Open, GreenfieldError::InvalidBountyStatus);
        require!(bounty.developer.is_none(), GreenfieldError::DeveloperAlreadyAssigned);

        bounty.developer = Some(developer);
        Ok(())
    }

    /// Autorização do Claim: chamada pelo backend após verificar que o PR foi
    /// mergeado (Invariante 1). Sem essa chamada o desenvolvedor não consegue sacar.
    pub fn approve_claim(ctx: Context<ApproveClaim>) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty;
        require!(bounty.status == BountyStatus::Open, GreenfieldError::InvalidBountyStatus);
        require!(bounty.developer.is_some(), GreenfieldError::DeveloperNotAssigned);

        bounty.status = BountyStatus::ReadyToClaim;
        Ok(())
    }

    /// O desenvolvedor assina a transação e recebe o USDC reservado para a bounty.
    /// Protegido contra double-claim (Invariante 3) pelo status `Claimed` terminal.
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let bounty = &ctx.accounts.bounty;
        require!(bounty.status == BountyStatus::ReadyToClaim, GreenfieldError::InvalidBountyStatus);
        require!(
            bounty.developer == Some(ctx.accounts.developer.key()),
            GreenfieldError::DeveloperMismatch
        );

        let mint_key = ctx.accounts.mint.key();
        let treasury_bump = ctx.accounts.treasury.bump;
        let signer_seeds: &[&[u8]] = &[b"treasury", mint_key.as_ref(), &[treasury_bump]];

        token::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.developer_token_account.to_account_info(),
                    authority: ctx.accounts.treasury.to_account_info(),
                },
                &[signer_seeds],
            ),
            bounty.amount,
            ctx.accounts.mint.decimals,
        )?;

        let amount = bounty.amount;

        let treasury = &mut ctx.accounts.treasury;
        treasury.total_reserved = treasury
            .total_reserved
            .checked_sub(amount)
            .ok_or(GreenfieldError::MathOverflow)?;
        treasury.total_claimed = treasury
            .total_claimed
            .checked_add(amount)
            .ok_or(GreenfieldError::MathOverflow)?;

        let bounty = &mut ctx.accounts.bounty;
        bounty.status = BountyStatus::Claimed;

        Ok(())
    }

    /// Cancela uma bounty ainda não reivindicada e libera a reserva de volta ao pool.
    pub fn cancel_bounty(ctx: Context<CancelBounty>) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty;
        require!(
            bounty.status == BountyStatus::Open || bounty.status == BountyStatus::ReadyToClaim,
            GreenfieldError::InvalidBountyStatus
        );

        let treasury = &mut ctx.accounts.treasury;
        treasury.total_reserved = treasury
            .total_reserved
            .checked_sub(bounty.amount)
            .ok_or(GreenfieldError::MathOverflow)?;

        bounty.status = BountyStatus::Cancelled;
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum BountyStatus {
    Open,
    ReadyToClaim,
    Claimed,
    Cancelled,
}

#[account]
#[derive(InitSpace)]
pub struct Treasury {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub total_deposited: u64,
    pub total_reserved: u64,
    pub total_claimed: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Bounty {
    pub treasury: Pubkey,
    pub bounty_id: u64,
    pub maintainer: Pubkey,
    pub developer: Option<Pubkey>,
    pub amount: u64,
    pub status: BountyStatus,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        space = 8 + Treasury::INIT_SPACE,
        seeds = [b"treasury", mint.key().as_ref()],
        bump,
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        init,
        payer = authority,
        seeds = [b"vault", treasury.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = treasury,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundTreasury<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,

    #[account(mut)]
    pub funder_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"treasury", mint.key().as_ref()],
        bump = treasury.bump,
        has_one = mint,
        has_one = vault,
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(bounty_id: u64)]
pub struct CreateBounty<'info> {
    #[account(mut, address = treasury.authority @ GreenfieldError::Unauthorized)]
    pub authority: Signer<'info>,

    /// CHECK: apenas registrado como referência do mantenedor da bounty.
    pub maintainer: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"treasury", treasury.mint.as_ref()],
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        init,
        payer = authority,
        space = 8 + Bounty::INIT_SPACE,
        seeds = [b"bounty", treasury.key().as_ref(), bounty_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub bounty: Account<'info, Bounty>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AssignDeveloper<'info> {
    #[account(address = treasury.authority @ GreenfieldError::Unauthorized)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"treasury", treasury.mint.as_ref()],
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        mut,
        has_one = treasury,
        seeds = [b"bounty", treasury.key().as_ref(), bounty.bounty_id.to_le_bytes().as_ref()],
        bump = bounty.bump,
    )]
    pub bounty: Account<'info, Bounty>,
}

#[derive(Accounts)]
pub struct ApproveClaim<'info> {
    #[account(address = treasury.authority @ GreenfieldError::Unauthorized)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"treasury", treasury.mint.as_ref()],
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        mut,
        has_one = treasury,
        seeds = [b"bounty", treasury.key().as_ref(), bounty.bounty_id.to_le_bytes().as_ref()],
        bump = bounty.bump,
    )]
    pub bounty: Account<'info, Bounty>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub developer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"treasury", mint.key().as_ref()],
        bump = treasury.bump,
        has_one = mint,
        has_one = vault,
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        mut,
        has_one = treasury,
        seeds = [b"bounty", treasury.key().as_ref(), bounty.bounty_id.to_le_bytes().as_ref()],
        bump = bounty.bump,
    )]
    pub bounty: Account<'info, Bounty>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = developer,
        associated_token::mint = mint,
        associated_token::authority = developer,
    )]
    pub developer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelBounty<'info> {
    #[account(address = treasury.authority @ GreenfieldError::Unauthorized)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"treasury", treasury.mint.as_ref()],
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        mut,
        has_one = treasury,
        seeds = [b"bounty", treasury.key().as_ref(), bounty.bounty_id.to_le_bytes().as_ref()],
        bump = bounty.bump,
    )]
    pub bounty: Account<'info, Bounty>,
}

#[error_code]
pub enum GreenfieldError {
    #[msg("O valor precisa ser maior que zero.")]
    InvalidAmount,
    #[msg("Saldo do tesouro insuficiente para criar a bounty.")]
    InsufficientTreasuryBalance,
    #[msg("Status da bounty inválido para esta operação.")]
    InvalidBountyStatus,
    #[msg("Esta bounty já possui um desenvolvedor atribuído.")]
    DeveloperAlreadyAssigned,
    #[msg("Nenhum desenvolvedor foi atribuído a esta bounty.")]
    DeveloperNotAssigned,
    #[msg("A carteira que assinou o claim não é o desenvolvedor atribuído.")]
    DeveloperMismatch,
    #[msg("Apenas a autoridade do tesouro pode executar esta ação.")]
    Unauthorized,
    #[msg("Overflow aritmético.")]
    MathOverflow,
}

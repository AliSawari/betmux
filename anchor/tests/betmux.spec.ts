import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair} from '@solana/web3.js'
import {Betmux} from '../target/types/betmux'

describe('betmux', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Betmux as Program<Betmux>

  const betmuxKeypair = Keypair.generate()

  it('Initialize Betmux', async () => {
    await program.methods
      .initialize()
      .accounts({
        betmux: betmuxKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([betmuxKeypair])
      .rpc()

    const currentCount = await program.account.betmux.fetch(betmuxKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment Betmux', async () => {
    await program.methods.increment().accounts({ betmux: betmuxKeypair.publicKey }).rpc()

    const currentCount = await program.account.betmux.fetch(betmuxKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment Betmux Again', async () => {
    await program.methods.increment().accounts({ betmux: betmuxKeypair.publicKey }).rpc()

    const currentCount = await program.account.betmux.fetch(betmuxKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement Betmux', async () => {
    await program.methods.decrement().accounts({ betmux: betmuxKeypair.publicKey }).rpc()

    const currentCount = await program.account.betmux.fetch(betmuxKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set betmux value', async () => {
    await program.methods.set(42).accounts({ betmux: betmuxKeypair.publicKey }).rpc()

    const currentCount = await program.account.betmux.fetch(betmuxKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the betmux account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        betmux: betmuxKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.betmux.fetchNullable(betmuxKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})

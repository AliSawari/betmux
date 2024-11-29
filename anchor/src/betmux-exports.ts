// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import BetmuxIDL from '../target/idl/betmux.json'
import type { Betmux } from '../target/types/betmux'

// Re-export the generated IDL and type
export { Betmux, BetmuxIDL }

// The programId is imported from the program IDL.
export const BETMUX_PROGRAM_ID = new PublicKey(BetmuxIDL.address)

// This is a helper function to get the Betmux Anchor program.
export function getBetmuxProgram(provider: AnchorProvider) {
  return new Program(BetmuxIDL as Betmux, provider)
}

// This is a helper function to get the program ID for the Betmux program depending on the cluster.
export function getBetmuxProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Betmux program on devnet and testnet.
      return new PublicKey('CounNZdmsQmWh7uVngV9FXW2dZ6zAgbJyYsvBpqbykg')
    case 'mainnet-beta':
    default:
      return BETMUX_PROGRAM_ID
  }
}

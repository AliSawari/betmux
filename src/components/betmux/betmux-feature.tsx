import { useWallet } from '@solana/wallet-adapter-react'
import { ExplorerLink } from '../cluster/cluster-ui'
import { WalletButton } from '../solana/solana-provider'
import { AppHero, ellipsify } from '../ui/ui-layout'
import { useBetmuxProgram } from './betmux-data-access'
import { BetmuxCreate, BetmuxList } from './betmux-ui'

export default function BetmuxFeature() {
  const { publicKey } = useWallet()
  const { programId } = useBetmuxProgram()

  return publicKey ? (
    <div>
      <AppHero
        title="Betmux"
        subtitle={
          'Create a new account by clicking the "Create" button. The state of a account is stored on-chain and can be manipulated by calling the program\'s methods (increment, decrement, set, and close).'
        }
      >
        <p className="mb-6">
          <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
        </p>
        <BetmuxCreate />
      </AppHero>
      <BetmuxList />
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}

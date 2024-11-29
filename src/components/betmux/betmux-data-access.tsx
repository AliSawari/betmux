import { getBetmuxProgram, getBetmuxProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'

import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export function useBetmuxProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getBetmuxProgramId(cluster.network as Cluster), [cluster])
  const program = getBetmuxProgram(provider)

  const accounts = useQuery({
    queryKey: ['betmux', 'all', { cluster }],
    queryFn: () => program.account.betmux.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['betmux', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) => {
      // my playground and u cant do shit about it 
      return program.methods.initialize().accounts({ betmux: keypair.publicKey }).signers([keypair]).rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useBetmuxProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useBetmuxProgram()

  const accountQuery = useQuery({
    queryKey: ['betmux', 'fetch', { cluster, account }],
    queryFn: () => program.account.betmux.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['betmux', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ betmux: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['betmux', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ betmux: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['betmux', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ betmux: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['betmux', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ betmux: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}

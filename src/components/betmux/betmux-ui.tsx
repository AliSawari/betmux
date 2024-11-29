import { Keypair, PublicKey } from '@solana/web3.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ExplorerLink } from '../cluster/cluster-ui'
import { ellipsify } from '../ui/ui-layout'
import { useBetmuxProgram, useBetmuxProgramAccount } from './betmux-data-access'

export function BetmuxCreate() {
  const { initialize, program, programId } = useBetmuxProgram()
  const [programData, setData] = useState();


  return <>
    <h3 className='text-pretty text-center'>Program ID :  <span className='font-bold text-blue-500'>{programId.toString()} </span> </h3>
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => initialize.mutateAsync(Keypair.generate())}
      disabled={initialize.isPending}
    >
      Create {initialize.isPending && '...'}
    </button>
    <br />
    <button className='btn btn-xs lg:btn-md btn-secondary' onClick={() => {

    }}>
      Dev
    </button>
  </>
}

export function BetmuxList() {
  const { accounts, getProgramAccount } = useBetmuxProgram()

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }
  return (
    <div className={'space-y-6'}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <BetmuxCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  )
}

function BetmuxCard({ account }: { account: PublicKey }) {
  const { accountQuery, incrementMutation, setMutation, decrementMutation, closeMutation } = useBetmuxProgramAccount({
    account,
  })

  const count = useMemo(() => accountQuery.data?.count ?? 0, [accountQuery.data?.count])
  const [insertMode, setInsertMode] = useState(false);
  const insertedValue = useRef<HTMLInputElement>();


  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content">
      <div className="card-body items-center text-center">
        <div className="space-y-6">

          {
            !insertMode && <h2 className="card-title justify-center text-3xl cursor-pointer" onClick={() => setInsertMode(!insertMode)}>
              {count}
            </h2>
          }

          {insertMode && <input className='rounded border-spacing-2' type="number" ref={insertedValue} defaultValue={count} />}

          <div className="card-actions justify-around">

            {!insertMode && <button
              className="btn btn-xs lg:btn-md btn-outline"
              onClick={() => incrementMutation.mutateAsync()}
              disabled={incrementMutation.isPending}
            >
              Increment
            </button>}

            {insertMode &&
              <button
                className="btn btn-xs lg:btn-md btn-outline"
                onClick={() => {
                  const value = insertedValue?.current?.value;
                  const toInt = parseInt(value as string);
                  if (typeof toInt === 'number') {
                    setInsertMode(!insertMode);
                    return setMutation.mutateAsync(toInt)
                  }

                }}
              // disabled={setMutation.isPending}
              >
                Set
              </button>
            }

            {!insertMode && <button
              className="btn btn-xs lg:btn-md btn-outline"
              onClick={() => decrementMutation.mutateAsync()}
              disabled={decrementMutation.isPending}
            >
              Decrement
            </button>}

          </div>
          <div className="text-center space-y-4">
            <p>
              <ExplorerLink path={`account/${account}`} label={ellipsify(account.toString())} />
            </p>
            <button
              className="btn btn-xs btn-secondary btn-outline"
              onClick={() => {
                if (!window.confirm('Are you sure you want to close this account?')) {
                  return
                }
                return closeMutation.mutateAsync()
              }}
              disabled={closeMutation.isPending}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

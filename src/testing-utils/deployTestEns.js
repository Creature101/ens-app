import fs from 'fs'
import solc from 'solc'

export default async function deployENS({ web3, accounts }) {
  let ensRoot
  let reverseRegistrar
  let publicResolver
  let reverseRegistrarInstance

  // This code compiles the deployer contract directly
  // If the deployer contract needs updating you can run
  // `npm run compile` to compile it to ensContracts.json
  //
  let source = fs.readFileSync('./src/api/__tests__/ens.sol').toString()
  let compiled = solc.compile(source, 1)
  // let compiled = JSON.parse(
  //   fs.readFileSync('./src/api/__tests__/ensContracts.json')
  // )

  let deployer = compiled.contracts[':DeployENS']
  let reverseRegistrarABI = compiled.contracts[':ReverseRegistrar'].interface
  let deployensContract = web3.eth.contract(JSON.parse(deployer.interface))

  // Deploy the contract
  const deployens = await new Promise((resolve, reject) => {
    deployensContract.new(
      {
        from: accounts[0],
        data: deployer.bytecode,
        gas: 4700000
      },
      (err, contract) => {
        if (err) {
          reject(err)
        }
        if (contract.address !== undefined) {
          resolve(contract)
        }
      }
    )
  })

  // Fetch the address of the ENS registry
  ensRoot = await new Promise((resolve, reject) => {
    deployens.ens.call((err, value) => {
      expect(err).toBe(null)
      resolve(value)
    })
  })

  reverseRegistrar = await new Promise((resolve, reject) => {
    deployens.reverseregistrar.call((err, value) => {
      expect(err).toBe(null)
      resolve(value)
    })
  })

  publicResolver = await new Promise((resolve, reject) => {
    deployens.publicresolver.call((err, value) => {
      expect(err).toBe(null)
      resolve(value)
    })
  })

  reverseRegistrarInstance = web3.eth
    .contract(JSON.parse(reverseRegistrarABI))
    .at(reverseRegistrar)

  const ensAddress = await new Promise((resolve, reject) => {
    reverseRegistrarInstance.ens.call((err, value) => {
      if (err) throw new Error(err)
      resolve(value)
    })
  })

  if (ensAddress !== ensRoot) {
    throw new Error(`${ensAddress} does not match ${ensRoot}`)
  }

  return {
    ensAddress,
    reverseRegistrar,
    deployer: deployens
  }
}

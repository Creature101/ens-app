const fs = require('fs')

module.exports = async function deployENS({ web3, accounts }) {
  const { sha3 } = web3.utils
  function deploy(contractJSON, ...args) {
    const contract = new web3.eth.Contract(JSON.parse(contractJSON.interface))
    return contract
      .deploy({
        data: contractJSON.bytecode,
        arguments: args
      })
      .send({
        from: accounts[0],
        gas: 4700000
      })
  }

  function namehash(name) {
    let node =
      '0x0000000000000000000000000000000000000000000000000000000000000000'
    if (name !== '') {
      let labels = name.split('.')
      for (let i = labels.length - 1; i >= 0; i--) {
        node = sha3(node + sha3(labels[i]).slice(2), {
          encoding: 'hex'
        })
      }
    }
    return node.toString()
  }

  // This code compiles the deployer contract directly
  // If the deployer contract needs updating you can run
  // `npm run compile2` to compile it to ./src/testing-utils/contracts/ENS.json
  //
  // let source = fs.readFileSync('./src/api/__tests__/ens.sol').toString()
  // let compiled = solc.compile(source, 1)
  const { contracts } = JSON.parse(
    fs.readFileSync('./src/testing-utils/contracts/ENS.json')
  )

  const registryJSON = contracts['ENSRegistry.sol:ENSRegistry']
  const resolverJSON = contracts['PublicResolver.sol:PublicResolver']
  const reverseRegistrarJSON =
    contracts['ReverseRegistrar.sol:ReverseRegistrar']

  const ens = await deploy(registryJSON)
  const resolver = await deploy(resolverJSON, ens._address)
  const reverseRegistrar = await deploy(
    reverseRegistrarJSON,
    ens._address,
    resolver._address
  )

  const ensContract = ens.methods
  const resolverContract = resolver.methods
  const reverseRegistrarContract = reverseRegistrar.methods

  console.log('ens registry address', ens._address)
  console.log('resolver', resolver._address)
  console.log('reverseRegistrar', reverseRegistrar._address)

  const tld = 'eth'
  await ensContract.setSubnodeOwner('0x', sha3(tld), accounts[0]).send({
    from: accounts[0]
  })

  await ensContract.setSubnodeOwner('0x', sha3('reverse'), accounts[0]).send({
    from: accounts[0]
  })

  await ensContract
    .setSubnodeOwner(
      namehash('reverse'),
      sha3('addr'),
      reverseRegistrar._address
    )
    .send({
      from: accounts[0]
    })

  const tx = await ensContract
    .setSubnodeOwner(namehash('eth'), sha3('resolver'), accounts[0])
    .send({
      from: accounts[0]
    })

  console.log(tx)

  await ensContract.setResolver(namehash('eth'), resolver._address).send({
    from: accounts[0]
  })

  await ensContract
    .setResolver(namehash('resolver.eth'), resolver._address)
    .send({
      from: accounts[0]
    })

  await resolverContract
    .setAddr(namehash('resolver.eth'), resolver._address)
    .send({
      from: accounts[0]
    })

  console.log(reverseRegistrarContract)

  try {
    await reverseRegistrarContract
      .setName('deployer.eth')
      .send({ from: accounts[0] })
  } catch (e) {
    console.log(e)
  }

  const addrReverseOwner = await ensContract
    .owner(namehash('resolver.eth'))
    .call({ from: accounts[0] })

  const resolverAddr = await resolverContract
    .addr(namehash('resolver.eth'))
    .call({ from: accounts[0] })

  console.log('owner', addrReverseOwner)
  console.log('resolverAddr', resolverAddr)

  // // Fetch the address of the ENS registry
  // ensRoot = await new Promise((resolve, reject) => {
  //   deployens.ens.call((err, value) => {
  //     if (err) reject('deploy registry failed')
  //     resolve(value)
  //   })
  // })

  // reverseRegistrar = await new Promise((resolve, reject) => {
  //   deployens.reverseregistrar.call((err, value) => {
  //     if (err) reject('reverse registrar failed')
  //     resolve(value)
  //   })
  // })

  // publicResolver = await new Promise((resolve, reject) => {
  //   deployens.publicresolver.call((err, value) => {
  //     if (err) reject('public resolver failed')
  //     resolve(value)
  //   })
  // })

  // reverseRegistrarInstance = web3.eth
  //   .contract(JSON.parse(reverseRegistrarABI))
  //   .at(reverseRegistrar)

  // const ensAddress = await new Promise((resolve, reject) => {
  //   reverseRegistrarInstance.ens.call((err, value) => {
  //     if (err) throw new Error(err)
  //     resolve(value)
  //   })
  // })

  // if (ensAddress !== ensRoot) {
  //   throw new Error(`${ensAddress} does not match ${ensRoot}`)
  // }

  return {
    ensAddress: ens._address
    // reverseRegistrar,
    // deployer: deployens
  }
}

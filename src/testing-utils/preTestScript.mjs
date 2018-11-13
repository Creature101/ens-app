import deployTestEns from './deployTestEns.js'
import Web3 from 'web3'
import fs from 'fs'

let web3
let provider

export async function getAccounts(web3) {
  return new Promise((resolve, reject) => {
    web3.eth.getAccounts((err, accounts) => {
      if (err) reject(err)
      resolve(accounts)
    })
  })
}

async function setupWeb3(customProvider) {
  return new Promise(function(resolve, reject) {
    if (customProvider) {
      //for testing
      web3 = new Web3(customProvider)
      provider = customProvider
      web3.version.getNetwork(function(err, networkId) {
        console.log('Custom testing provider')
        resolve({
          web3,
          networkId: parseInt(networkId, 10)
        })
      })
      return
    }
  })
}

async function init() {
  const ENV = process.argv[2]

  switch (ENV) {
    case 'GANACHE_GUI':
      var provider = new Web3.providers.HttpProvider('http://localhost:7545')
      var { web3 } = await setupWeb3(provider)
      break
    case 'GANACHE_CLI':
      var provider = new Web3.providers.HttpProvider('http://localhost:8545')
      var { web3 } = await setupWeb3(provider)
      break
    default:
      const options = ENVIRONMENTS.join(' or ')
      throw new Error(`ENV not set properly, please pick from ${options}`)
  }

  const accounts = await getAccounts(web3)

  const { ensAddress } = await deployTestEns({ web3, accounts })

  fs.writeFile('./env.local', `REACT_APP_ENS_ADDRESS=${ensAddress}`, err => {
    if (err) throw err
    console.log('Wrote address ' + ensAddress + ' to env.json')
  })
}

init()

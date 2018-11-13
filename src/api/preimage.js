import 'cross-fetch/polyfill'

const rootUrl = 'https://preimagedb.appspot.com/keccak256/query'

export async function decryptHashes(...hashes) {
  let trimmedHashes = hashes.map(hash => hash.slice(2))

  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/json')

  try {
    const res = await fetch(rootUrl, {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(trimmedHashes)
    })
    if (res.status === 'error') {
      return hashes.map(h => null)
    }
    const json = await res.json()
    return json.data
  } catch (e) {
    console.log('Error', e)
    return hashes.map(h => null)
  }
}

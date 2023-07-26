// const tokenId = ''
// Keychain.set('byu_api_tokenId', tokenId)

const com = importModule('../modules/common')

async function refresh_token() {
  let headers = {
    'Cookie': (Keychain.contains('byu_api_cookie')) ? Keychain.get('byu_api_cookie') : '',
    'User-Agent': 'okhttp/4.2.2',
    'source': 'app',
    'platform': 'ios',
    'provider': 'google',
  }
  const tokenId = Keychain.get('byu_api_tokenId')
  var req = await com.request('GET', `https://api.byu.id/api/ciam/getCode?csrf=${tokenId}`, headers)
  var body = JSON.parse(`${req.body}\n`)
  if (body.status === 1) { 
    com.setCookies(req, ['TS0136054f'], 'byu_api_cookie')
    const locations = com.urlParamToJSON(body.data)
    if (locations.code === undefined) { 
      console.warn('session is expired, refresh tokenId')
      return false 
    }
    else {
      var req = await com.request('GET', body.data, headers)
      var body = JSON.parse(`${req.body}\n`)
      if (body.status === 0) { return false }
      com.setCookies(req, ['TS0136054f'], 'byu_api_cookie')
      Keychain.set('byu_api_token', JSON.stringify(body.data))
      var req = await api('https://api.byu.id/api/ciam/login')
      if (req.body.status === 1) {
        console.log('token is valid, refresh success')
        return true
      }
      else {
        console.warn('token is invalid, refresh tokenId')
        return false
      }
    }
  }
  return false
}

async function api(location) {
  if (!Keychain.contains('byu_api_token')) { await refresh_token() }
  const token = JSON.parse(Keychain.get('byu_api_token'))
  let headers = {
    'Authorization': `Bearer ${token.refresh_token}`,
    'User-Agent': 'okhttp/4.2.2',
  }
  let req = await com.request('GET', location, headers)
  let body = JSON.parse(req.body)
  if (body.status !== 1) { //invalid token)
    if ((await refresh_token()) === true) {
      let req = await api(location)
      return req
    }
    return refreshtoken
  }
  return {'response': req.response, 'body': JSON.parse(req.body)}
}
module.exports.api = api
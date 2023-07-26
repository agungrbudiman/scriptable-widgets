// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: magic;

const com = importModule('../modules/common')

let device_id = ''
if (!Keychain.contains('xl_device_id')) {
  device_id = com.randString(16) + com.randString(40)
  Keychain.set('xl_device_id', device_id)
}
else {
  device_id = Keychain.get('xl_device_id')
}

const client_id = 'a80c1af52aae62d1166b73796ae5f378'

const url = {
  'auth': 'https://ciam-rajaampat.xl.co.id/am/json/realms/xl/authenticate',
  'token': 'https://ciam-rajaampat.xl.co.id/am/oauth2/realms/xl/access_token',
  'authorize': 'https://ciam-rajaampat.xl.co.id/am/oauth2/realms/xl/authorize',
  'balance': 'https://api.myxl.xlaxiata.co.id/api/v1/packages/balance-and-credit',
  'login': 'https://api.myxl.xlaxiata.co.id/api/v1/auth/login',
  'quotasummary': 'https://api.myxl.xlaxiata.co.id/api/v1/packages/quota-summary',
  'profile': 'https://api.myxl.xlaxiata.co.id/api/v1/profile',
  'quotadetails': 'https://api.myxl.xlaxiata.co.id/api/v1/packages/quota-details',
  'onlinestatus': 'https://api.myxl.xlaxiata.co.id/misc/api/v1/check-online-status',
}

const stage = {
  'MSISDN': '6280000000000',
  'DEVICE': device_id,
  'VALIDATE': 1,
  'OTP': '123456',
}


Alert.prototype.input = function(stage) {
  const type = {
    'OTP': {
      'title': 'OTP', 'message': 'OTP has been sent to your phone', 'textfield': '123456'
    },
    'MSISDN': {
      'title': 'Phone Number', 'message': 'International format without +', 'textfield': '628xxx'
    },
  }
  this.title = type[stage].title
  this.message = type[stage].message
  this.addTextField(type[stage].textfield)
  this.addAction('Submit')
  this.addCancelAction('Cancel')
  return this
}

async function pre_login() {
  const headers = {
    'User-Agent': 'okhttp/4.3.1',
    'Content-type': com.mime.json,
  }
  var req = await com.request('POST', `${url.auth}?authIndexType=service&authIndexValue=otp`, headers)
  var body = JSON.parse(req.body)
  var maxTries = 5
  while (body.tokenId === undefined && maxTries >= 0) {
    body.authId = body.authId
    body.stage = body.callbacks[0].output[0].value.stage
    body.callbacks[1].input[0].value = stage[body.stage]
    if (body.stage === 'OTP' || body.stage === 'MSISDN') {
      var alert = new Alert().input(body.stage)
      const index = await alert.presentAlert()
      if (index === -1) {
        break
      }
      body.callbacks[1].input[0].value = alert.textFieldValue(0)
    }
    req = await com.request('POST', url.auth, headers, JSON.stringify(body))
    body = JSON.parse(req.body)
    maxTries--
  }
  com.setCookies(req, ['iPlanetDirectoryPro'], 'xl_api_cookie')
  return body.tokenId !== undefined ? body.tokenId : false
}

async function get_token(tokenId) {
  const headers = {
    'Cookie': Keychain.contains('xl_api_cookie') ? Keychain.get('xl_api_cookie') : '',
    'User-Agent': 'okhttp/4.3.1',
    'Content-type': com.mime.json,
  }
  const pkce = com.genPKCE()
  const code_verifier = pkce.code_verifier
  const code_challenge = pkce.code_challenge
  var payload = `iPlanetDirectoryPro=${tokenId}&client_id=${client_id}&scope=openid+profile&response_type=code&redirect_uri=https%3A%2F%2Fmy.xl.co.id&code_challenge=${code_challenge}&code_challenge_method=S256`
  var req = await com.request('GET', `${url.authorize}?${payload}`, headers)
  const code =  com.urlParamToJSON(req.response.headers.Location).code

  if (code !== undefined) {
    headers['Content-type'] = com.mime.urlencoded
    var payload = `client_id=${client_id}&code=${code}&redirect_uri=https%3A%2F%2Fmy.xl.co.id&grant_type=authorization_code&code_verifier=${code_verifier}`
    var req = await com.request('POST', url.token, headers, payload)
    var body = JSON.parse(req.body)
    if (body.access_token !== undefined) {
      Keychain.set('xl_api_token', JSON.stringify(body))
      return true
    }
  }
  return false
}

async function refresh_token() {
  const headers = {
    'Cookie': Keychain.contains('xl_api_cookie') ? Keychain.get('xl_api_cookie') : '',
    'User-Agent': 'okhttp/4.3.1',
    'Content-type': com.mime.urlencoded,
  }
  const token = Keychain.contains('xl_api_token') ? JSON.parse(Keychain.get('xl_api_token')) : {}
  var payload = `scope=openid+profile&client_id=${client_id}&grant_type=refresh_token&response_type=code&refresh_token=${token.refresh_token}`
  var req = await com.request('POST', url.token, headers, payload)
  if (req.body.access_token !== undefined) {
    for (const key in token) {
      if (req.body[key] !== undefined) {
        token[key] = req.body[key]
      }
    }
    Keychain.set('xl_api_token', JSON.stringify(req.body))
    return true
  }
  return false
}

async function api(location) {
  const token = Keychain.contains('xl_api_token') ? JSON.parse(Keychain.get('xl_api_token')) : {}
  const headers = {
    'Authorization': `Bearer ${token.id_token}`,
    'Cookie': Keychain.contains('xl_api_cookie') ? Keychain.get('xl_api_cookie') : '',
    'User-Agent': 'okhttp/4.3.1',
    'Content-type': com.mime.json,
  }
  const payload = {'access_token': token.access_token}
  let req = await com.request('POST', url[location], headers, JSON.stringify(payload))
  return {'response': req.response, 'body': JSON.parse(req.body)}
}
module.exports.api = api

async function login() {
  const res = await api('profile')
  if (res.body.status === 'FAILED') { // access token is expired
    console.warn('access token is expired')
      const res = await refresh_token()
      if (res === false) { // refresh token failed
        console.warn('refresh token failed')
        const tokenId = await pre_login()
        if (tokenId !== undefined) { // otp login sequence success
            if (!await get_token(tokenId)) { // get new token failed
              console.error("can't get new token")
              return false
            }
        }
        else {
          console.error('otp login failed')
          return false
        }
    }
  }
  return true
}
module.exports.login = login

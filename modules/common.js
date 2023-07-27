const hash = importModule('sha256.js')
const base64 = importModule('base64.js')

const mime = {
  'json': 'application/json',
  'html': 'text/html',
  'urlencoded': 'application/x-www-form-urlencoded',
  'text': 'text/plain',
}
module.exports.mime = mime

ListWidget.prototype.addTexts = function(value, fontsize, Color, spacer=0, minScale=1, center=false) {
  var t = this.addText(value)
  this.addSpacer(spacer)
  t.font = new Font('', fontsize)
  t.textColor = Color
  t.minimumScaleFactor = minScale
  if (center) { t.centerAlignText() }
  return t
}
module.exports.ListWidget = ListWidget

function randString(length) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    let counter = 0
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
      counter += 1
    }
    return result
}
module.exports.randString = randString

function genPKCE() {
  const code_verifier = randString(43)
  const digest = hash.sha256.arrayBuffer(code_verifier);
  const encoded = base64.encode(String.fromCharCode.apply(null, new Uint8Array(digest)), true)
  .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return {'code_verifier': code_verifier, 'code_challenge': encoded}
}
module.exports.genPKCE = genPKCE

function genSignature(key, string) {
  const nonce = randString(16)
  const timestamp = Date.now()
  const digest = hash.sha256.hmac.update(key, timestamp + nonce + string).digest()
  const encoded = base64.encode(String.fromCharCode.apply(null, new Uint8Array(digest)), true)
  return {'nonce': nonce, 'timestamp': timestamp, 'signature': encoded}
}
module.exports.genSignature = genSignature

// https://www.example.org?param1=xyz&param2=123 -> { param1: xyz, param2: 123 }
function urlParamToJSON(url) {
  let json = {}
  url.split('?')[1].split('&').forEach(param => {
      const p = param.split('=')
      json[p[0]] = p[1]
  })
  return json
}
module.exports.urlParamToJSON = urlParamToJSON

function setCookies(req, cookieNames, keychainName) {
  let cookieString = ''
  const cookies = req.response.headers['Set-Cookie'].split(', ')
  cookies.forEach(cookie => {
    cookieNames.forEach(cookieName => {
      if (cookie.includes(`${cookieName}=`)) {
        cookieString += cookie + ','
      }
    })
  })
  if (cookieString !== '') {
    Keychain.set(keychainName, cookieString)
    return cookieString
  }
  else {
    return false
  }
}
module.exports.setCookies = setCookies

// https://stackoverflow.com/a/15289883
function dateDiff(date) {
  const _MS_PER_HOUR = 1000 * 60 * 60;
  const utc1 = Date.now();
  const utc2 = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

  const TotalHours = Math.floor((utc2 - utc1) / _MS_PER_HOUR)
  const days = Math.floor(TotalHours / 24)
  const hours = TotalHours % 24

  return {'days': days, 'hours': hours}
}
module.exports.dateDiff = dateDiff

async function request(method, location, headers, payload) {
  let request = new Request(location)
  request.method = method
  request.headers = headers
  request.body = payload
  request.onRedirect = null
  let body = await request.loadString()
  return {'response': request.response, 'body': body}
}
module.exports.request = request

function byteToGiB(byte) {
  return parseFloat((byte / 1074000000).toFixed(1))
}
module.exports.byteToGiB = byteToGiB
function secToMin(second) {
  return parseFloat((second / 60).toFixed(1))
}
module.exports.secToMin = secToMin

// https://stackoverflow.com/q/18883601
function getDistanceFromLatLonInKm(coordinate1, coordinate2) {
  let c1 = coordinate1.split(',')
  let lat1 = c1[0]; let lon1 = c1[1]
  let c2 = coordinate2.split(',')
  let lat2 = c2[0]; let lon2 = c2[1]
  var R = 6371; // Radius of the earth in km
  var dLat = (lat2-lat1) * (Math.PI/180);
  var dLon = (lon2-lon1) * (Math.PI/180); 
  var a = 
  Math.sin(dLat/2) * Math.sin(dLat/2) +
  Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
  Math.sin(dLon/2) * Math.sin(dLon/2)
  ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}
module.exports.getDistanceFromLatLonInKm = getDistanceFromLatLonInKm
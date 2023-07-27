const com = importModule('modules/common')

async function getAccount() {
	const headers = {
		'Authorization': 'Basic bXlJbmRpaG9tZVg6Nkw3MUxPdWlubGloOWJuWkhBSUtKMjFIc3Qxcg==',
		'Content-type': 'application/json',
		'X-Gateway-APIKey': '070bb926-44d4-449e-9f88-b96c87392964',
	}
	const url = 'https://apigw.telkom.co.id:7777/gateway/telkom-myihxmbe-identityserver/1.0/user/login'
	var alert = new Alert()
	alert.title = 'Login'
	alert.addTextField('email')
	alert.addSecureTextField('password')
	alert.addAction('Submit')
	alert.addCancelAction('Cancel')
	if ( (await alert.presentAlert()) !== -1 ) {
		const email = alert.textFieldValue(0)
		const password = alert.textFieldValue(1)
		Keychain.set('indihome_password', password)
		payload = { 'email': email, 'password': password }
		let req = await com.request('POST', url, headers, JSON.stringify(payload))
		let body = JSON.parse(req.body)
		if (body.ok) {
			return body.data
		}
		else {
			console.warn('account not found')
			return false
		}
	}
}

async function sendOTP(email, mobile) {
	const headers = {
		'Authorization': 'Basic bXlJbmRpaG9tZVg6Nkw3MUxPdWlubGloOWJuWkhBSUtKMjFIc3Qxcg==',
		'Content-type': 'application/json',
		'X-Gateway-APIKey': '070bb926-44d4-449e-9f88-b96c87392964',
	}
	const url = 'https://apigw.telkom.co.id:7777/gateway/telkom-myihxmbe-identityserver/1.0/otp/send'
	const sig = com.genSignature('U7TjN_HSaYznv6Ky', mobile + email)
	const payload = {
		'channel': 'sms',
		'email': email,
		'mobile': mobile,
		'nonce': sig.nonce,
		'signature': sig.signature,
		'timeStamp': sig.timestamp, 
	}
	let req = await com.request('POST', url, headers, JSON.stringify(payload))
	let body = JSON.parse(req.body)
	if (body.ok === false) { console.warn('cannot send OTP') }
	return body.ok
}

async function getToken(email, mobile) {
	const headers = {
		'Authorization': 'Basic bXlJbmRpaG9tZVg6Nkw3MUxPdWlubGloOWJuWkhBSUtKMjFIc3Qxcg==',
		'Content-type': 'application/json',
		'X-Gateway-APIKey': '070bb926-44d4-449e-9f88-b96c87392964',
	}
	var alert = new Alert()
	alert.title = 'OTP'
	alert.addTextField('')
	alert.addAction('Submit')
	await alert.presentAlert()
	const otp = alert.textFieldValue(0)
	const url = `https://apigw.telkom.co.id:7777/gateway/telkom-myihxmbe-identityserver/1.0/otp/verify/${otp}/direct`
	const payload = {
		'channel': 'sms',
		'email': email,
		'mobile': mobile,
		'password': Keychain.get('indihome_password'),
	}
	let req = await com.request('POST', url, headers, JSON.stringify(payload))
	let body = JSON.parse(req.body)
	if (body.ok) {
		Keychain.set('indihome_token', JSON.stringify(body.data))
	}
	else {
		console.warn('OTP is invalid')
	}
	return body.ok
}

async function refresh_token() {
	const token = JSON.parse(Keychain.get('indihome_token'))
	const headers = {
		'Authorization': 'Basic bXlJbmRpaG9tZVg6Nkw3MUxPdWlubGloOWJuWkhBSUtKMjFIc3Qxcg==',
		'Content-type': 'application/json',
		'X-Gateway-APIKey': '070bb926-44d4-449e-9f88-b96c87392964',
	}
	const url = 'https://apigw.telkom.co.id:7777/gateway/telkom-myihxmbe-identityserver/1.0/user/token'
	const payload = { 'refreshToken': token.refreshToken }
	let req = await com.request('POST', url, headers, JSON.stringify(payload))
	let body = JSON.parse(req.body)
	if (body.ok) {
		for (const key in token) {
	      if (body.data[key] !== undefined) {
	        token[key] = body.data[key]
	      }
	    }
		Keychain.set('indihome_token', JSON.stringify(body.data))
	}
	else {
		console.warn('cannot refresh token')
		if (!(await login())) { 
			return false 
		}
		else {
			return true
		}
	}
	return body.ok
}

async function login() {
	const account = await getAccount()
	if (account === false) { return false }
	const otp = await sendOTP(account.email, account.mobile)
	if (otp === false) { return false }
	const token = await getToken(account.email, account.mobile)
	if (token === false) { return false }
	return true
}

async function api(url) {
	if (!Keychain.contains('indihome_token')) {
		if (!(await login())) { return false }
	}
	const token = JSON.parse(Keychain.get('indihome_token'))
	const headers = {
		'Authorization': `Bearer ${token.token}`,
		'X-Gateway-APIKey': '070bb926-44d4-449e-9f88-b96c87392964',
	}
	let req = await com.request('GET', url, headers)
	let body = JSON.parse(req.body)
	if (!body.ok) {
		if ((await refresh_token())) {
			return ((await api(url)))
		}
		return false
	}
	return body
}

async function getProfile() {
	const url = 'https://apigw.telkom.co.id:7777/gateway/telkom-myihxmbe-account/1.0/user/profile'
	return ((await api(url)))
}
module.exports.getProfile = getProfile

async function getUsage(accounts) {
	const indihomeNum = accounts.find(account => account.isDefault).indiHomeNum
	const url = `https://apigw.telkom.co.id:7777/gateway/telkom-myihxmbe-productinfosubscription/1.0/product-subscription/packages/usage/${indihomeNum}`
	return ((await api(url)))
}
module.exports.getUsage = getUsage
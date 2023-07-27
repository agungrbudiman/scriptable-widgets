// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
const com = importModule('modules/common')
const kota = 'Yogyakarta'
const coordinate = '-7.813914033900404, 110.92707092343569'

function showWidget(gempa) {
	let distance = com.getDistanceFromLatLonInKm(coordinate, gempa.Coordinates)
	var widget = new com.ListWidget()
	widget.spacing = 1
	widget.addTexts('Gempa Terkini', 16)
	widget.addTexts(formatDate(gempa.DateTime), 14)
	widget.addTexts(`${gempa.Magnitude} ritcher`, 14, Color.green())
	widget.addTexts(`${gempa.Kedalaman} depth`, 14, Color.green())
	widget.addTexts(`${distance.toFixed(0)} km distance`, 14, null, 10)
	widget.addTexts(`${new Date().toLocaleTimeString().slice(0,5)}`, 10, Color.lightGray(), 0, 1, true)
	widget.presentSmall()
}

function formatDate(dateString) {
	const date = new Date(dateString)
	return `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear().toString().slice(-2)} ${date.getHours()}:${date.getMinutes()}`
}


let req = await com.request('GET', 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json')
let data = JSON.parse(req.body)
const gempa = data.Infogempa.gempa.find(gempa => gempa.Dirasakan.includes(kota))
if (gempa !== undefined) {
	if (Keychain.contains('gempa_cache')) {
		const cache = JSON.parse(Keychain.get('gempa_cache'))
		if (Date.parse(gempa.DateTime) > Date.parse(cache.DateTime)) {
			var notif = new Notification()
			notif.title = 'Gempa Terkini'
			notif.body = gempa.Wilayah
			notif.sound = 'default'
			notif.openURL = 'https://www.bmkg.go.id/gempabumi-dirasakan.html'
			notif.schedule()
		}
	}
	Keychain.set('gempa_cache', JSON.stringify(gempa))
	showWidget(gempa)
}
else {
	if (Keychain.contains('gempa_cache')) {
		showWidget(JSON.parse(Keychain.get('gempa_cache')))
	}
	else {
		var widget = new com.ListWidget()
		widget.addTexts('NO DATA', 18, Color.red(), 0, 1, true)
		widget.presentSmall()
	}
}

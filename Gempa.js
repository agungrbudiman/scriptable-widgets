// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
const com = importModule('modules/common')
var param = args.widgetParameter
if (param === null) {
	param = 'Wonigiri;-7.81,110.92'
}
const kota = param.split(';')[0]
const coordinate = param.split(';')[1]

function showWidget(gempa) {
	let distance = com.getDistanceFromLatLonInKm(coordinate, gempa.Coordinates)
	let relativeDate = new RelativeDateTimeFormatter().string(new Date(gempa.DateTime), new Date())
	var widget = new com.ListWidget()
	widget.spacing = 1
	widget.addTexts(kota, 18, null, null, 1, true)
	widget.addTexts(relativeDate, 14)
	widget.addTexts(`${gempa.Magnitude} magnitude`, 16, Color.green())
	widget.addTexts(`${gempa.Kedalaman} depth`, 16, Color.green())
	widget.addTexts(`${distance.toFixed(0)} km distance`, 14, null, 10)
	widget.addTexts(`${new Date().toLocaleTimeString().slice(0,5)}`, 10, Color.lightGray(), 0, 1, true)
	widget.presentSmall()
}

function showNotif(gempa) {
	var notif = new Notification()
	notif.title = `Gempa Terkini di ${kota}`
	notif.body = gempa.Wilayah
	notif.sound = 'default'
	notif.openURL = 'https://www.bmkg.go.id/gempabumi-dirasakan.html'
	notif.schedule()
}

let req = await com.request('GET', 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json')
let data = JSON.parse(req.body)
let nearest = { 'distance': Infinity }
for ([key, gempa] of data.Infogempa.gempa.entries()) {
	let distance = com.getDistanceFromLatLonInKm(coordinate, gempa.Coordinates)
	if (distance < nearest.distance) {
		nearest.key = key
		nearest.gempa = gempa
		nearest.distance = distance
	}
}
if (Keychain.contains(`gempa_${kota}`)) {
	const cache = JSON.parse(Keychain.get(`gempa_${kota}`))
	if (Date.parse(nearest.gempa.DateTime) > Date.parse(cache.DateTime)) {
		showNotif(nearest.gempa)
	}
}
Keychain.set(`gempa_${kota}`, JSON.stringify(nearest.gempa))
showWidget(nearest.gempa)

// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: magic;
const workdir = `${FileManager.iCloud().documentsDirectory()}/INDIHOME_API`
const indihome = importModule('INDIHOME_API/indihome_api_modules')
const com = importModule('modules/common')

const profile = await indihome.getProfile()
if (profile !== false) {
	const usage = await indihome.getUsage(profile.data.accounts)
	const remainingQuota = parseFloat(usage.data.dataUsage.usage.remainingQuota)
	const totalQuota = parseFloat(usage.data.dataUsage.usage.totalQuota)
	const packageName = usage.data.internetPackage.name
	const unit = usage.data.dataUsage.usage.unit
	var widget = new com.ListWidget()
	widget.backgroundImage = Image.fromFile(workdir+'/indihome_api_background.jpg')
	widget.addTexts('IndiHome', 20, Color.white())
	widget.addTexts(packageName, 10, Color.lightGray(), 5)
	widget.addTexts(`${remainingQuota} ${unit}`, 18, Color.green())
	widget.addTexts(`${totalQuota} ${unit}`, 18, Color.white(), 10)
	widget.addTexts(`updated @ ${new Date().toLocaleTimeString().slice(0,5)}`, 10, Color.lightGray(), 0, 1, true)
	widget.presentSmall()
}

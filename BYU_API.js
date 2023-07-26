// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: magic;

const workdir = `${FileManager.iCloud().documentsDirectory()}/BYU_API`
const byu = importModule('BYU_API/byu_api_modules')
const com = importModule('modules/common')

var req = await byu.api('https://api.byu.id/api/v2/planRemaining')
if (req != false) {
  var widget = new com.ListWidget()
  widget.backgroundImage = Image.fromFile(workdir+'/byu_api_background.jpg')
  const credit = req.body.data.total.credit.total_offering
  const expdate = req.body.data.detail.data_plan[0].expiryDate
  const diff = com.dateDiff(new Date(expdate))
  const plan = req.body.data.total.data_plan
  const addon = req.body.data.total.data_addon
  const voice = req.body.data.total.voice

  widget.addTexts(`IDR ${credit}`, 18, Color.green(), 2)
  widget.addTexts('Data', 10, Color.lightGray())
  widget.addTexts(`${com.byteToGiB(plan.used_byte)} GB / ${com.byteToGiB(plan.remaining_byte)} GB`, 14, Color.white(), 2)
  widget.addTexts('Addon', 10, Color.lightGray())
  widget.addTexts(`${com.byteToGiB(addon.used_byte)} GB / ${com.byteToGiB(addon.remaining_byte)} GB`, 14, Color.white(), 2)
  widget.addTexts('Voice', 10, Color.lightGray())
  widget.addTexts(`${voice.used} ${voice.unit_en.slice(0,3)} / ${voice.total_offering - voice.used} ${voice.unit_en.slice(0,3)}`, 14, Color.white(), 5)
  widget.addTexts(`By.U @ ${new Date().toLocaleTimeString().slice(0,5)} | ${diff.days} days`, 8, Color.lightGray(), 0, 1, true)
  widget.presentSmall()
}
else {
  var widget = new com.ListWidget()
  widget.addTexts('TOKEN EXPIRED', 16, Color.red(), 0, 1, true)
  widget.presentSmall()
  console.error('Token is missing or expired')
}
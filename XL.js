// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: magic;

const workdir = `${FileManager.iCloud().documentsDirectory()}/XL_API`
const xl = importModule('XL_API/xl_api_modules')
const com = importModule('modules/common')

const session = await xl.login()
if (session === true) {
  var widget = new com.ListWidget()
  widget.backgroundImage = Image.fromFile(`${workdir}/xl_api_background.jpg`)

  xl.api('balance').then((req) => {
    const balance = req.body.data.balance.remaining
    const expdate = new Date(req.body.data.balance.expired_at * 1000)
    const diff = com.dateDiff(expdate)
    widget.addTexts(`IDR ${balance}`, 18, Color.green(), 2)

    xl.api('quotadetails').then((req) => {
      var quota = {
        'global': { 'remaining': 0, 'total': 0, 'used': 0, 'unit': 'byte' },
        'local': { 'remaining': 0, 'total': 0, 'used': 0 , 'unit': 'byte' },
        'voice': { 'remaining': 0, 'total': 0, 'used': 0 , 'unit': 'second' },
      }
      req.body.data.quotas.forEach(q => {
        q.benefits.forEach((benefit) => {
          if (benefit.data_type === 'DATA') {
            if (benefit.id.includes("_MAIN")) {
              quota.global.total += benefit.total
              quota.global.remaining += benefit.remaining
              quota.global.used = quota.global.total - quota.global.remaining
            }
            if (benefit.benefit_type === 'REGIONAL') {
              quota.local.total += benefit.total
              quota.local.remaining += benefit.remaining
              quota.local.used = quota.local.total - quota.local.remaining
              quota.local.info = benefit.information.slice(3)
            }
          }
          else if (benefit.data_type === 'VOICE'){
            quota.voice.total += benefit.total
            quota.voice.remaining += benefit.remaining
            quota.voice.used = quota.voice.total - quota.voice.remaining
          }
        })
      })
      widget.addTexts('Data', 10, Color.lightGray())
      widget.addTexts(`${com.byteToGiB(quota.global.remaining)} GB / ${com.byteToGiB(quota.global.total)} GB`, 14, Color.white(), 2)
      widget.addTexts(quota.local.info, 10, Color.lightGray())
      widget.addTexts(`${com.byteToGiB(quota.local.remaining)} GB / ${com.byteToGiB(quota.local.total)} GB`, 14, Color.white(), 2)
      widget.addTexts('Voice', 10, Color.lightGray())
      widget.addTexts(`${com.secToMin(quota.voice.remaining)} Min / ${com.secToMin(quota.voice.total)} Min`, 14, Color.white(), 5)
      widget.addTexts(`XL @ ${new Date().toLocaleTimeString().slice(0,5)} | ${diff.days} days`, 8, Color.white(), 0, 1, true)
      widget.presentSmall()
    })
  })
}
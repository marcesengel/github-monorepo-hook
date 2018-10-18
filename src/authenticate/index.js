const crypto = require('crypto')
const compare = require('safe-compare')

module.exports = (token = '', body = {}) => {
  const hmac = crypto.createHmac('sha1', process.env.GITHUB_SECRET)

  hmac.update(JSON.stringify(body))
  const hash = hmac.digest('hex')

  return compare('sha1=' + hash, token)
}

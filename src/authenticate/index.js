const crypto = require('crypto')
const compare = require('safe-compare')

module.exports = (token = '', body = {}) => {
  const secret = process.env.GITHUB_SECRET
  if (!secret) {
    return true
  }

  const hmac = crypto.createHmac('sha1', secret)

  hmac.update(JSON.stringify(body))
  const hash = hmac.digest('hex')

  return compare('sha1=' + hash, token)
}

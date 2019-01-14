const authenticate = require('./authenticate')
const getUpdatedPackages = require('./getUpdatedPackages')

module.exports = async (event, options = {}) => {
  const { headers = {}, body = {} } = event
  const token = headers['x-hub-signature']

  if (!authenticate(token, body)) {
    return false
  }

  const {
    packagePath = 'packages/',
    branch = false
  } = options
  const { before, after, ref, repository = {} } = body

  if (branch && ref !== 'refs/heads/' + branch) {
    return []
  }

  return getUpdatedPackages({
    before,
    after,
    repositoryName: repository.full_name,
    packagePath
  })
}

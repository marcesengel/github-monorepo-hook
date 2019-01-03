const authenticate = require('./authenticate')
const getUpdatedPackages = require('./getUpdatedPackages')

module.exports = async (event, packages = [], options = {}) => {
  const { headers = {}, body = {} } = event
  const token = headers['x-hub-signature']

  if (!authenticate(token, body)) {
    return false
  }

  const {
    packagePath = 'packages/'
  } = options
  const { before, after, ref, repository = {} } = body

  if (options.branch && ref !== '/refs/heads/' + options.branch) {
    return []
  }

  return getUpdatedPackages({
    before,
    after,
    repositoryName: repository.full_name,
    packagePath
  })
}

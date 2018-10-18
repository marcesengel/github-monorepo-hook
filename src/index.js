const authenticate = require('./authenticate')
const getUpdatedPackages = require('./getUpdatedPackages')

module.exports = async (event, packages = [], options = {}) => {
  const { headers = {}, body = {} } = event
  const token = headers['X-Hub-Signature']

  if (!authenticate(token, body)) {
    return false
  }

  const {
    packagePath = 'packages/'
  } = options
  const { before, repository = {} } = body

  const updatedPackages = await getUpdatedPackages({
    before,
    repositoryName: repository.full_name,
    packagePath,
    packages
  })

  if (updatedPackages.length === 0) {
    return false
  }
}

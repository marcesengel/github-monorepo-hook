const authenticate = require('./authenticate')
const getUpdatedPackages = require('./getUpdatedPackages')

const { join } = require('path')

module.exports = async (event, packages = [], options = {}) => {
  const { headers = {}, body = {} } = event
  const token = headers['x-hub-signature']

  if (!authenticate(token, body)) {
    return false
  }

  const {
    packagePath = 'packages/'
  } = options
  const { before, head, ref, repository = {} } = body

  if (options.branch && ref !== '/refs/heads/' + options.branch) {
    return []
  }

  return getUpdatedPackages({
    before,
    head,
    repositoryName: repository.full_name,
    packages: packages.map(({ name, dependencies = [] }) => [
      join(packagePath, name),
      ...dependencies.map((dependency) => join(packagePath, dependency))
    ])
  })
    .then((packageIndexes) => packageIndexes.map(
      (index) => packages[index].name
    ))
}

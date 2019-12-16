const GitHub = require('github-api')
const { posix } = require('path')
const deepEqual = require('fast-deep-equal')
const picomatch = require('picomatch')

const getTreeRecursive = require('./getTreeRecursive')
const validatePackagesFile = require('./validatePackagesFile')
const getIgnoredPaths = require('./getIgnoredPaths')

const filterTreeByPath = (tree, path, excludeFnc) => tree.filter(
  ({ path: filePath }) => filePath.startsWith(path) && !excludeFnc(filePath)
)

const treeToFileShas = (result, { path, sha }) => {
  result[path] = sha
  return result
}

module.exports = async ({ before: shaBefore, after: shaAfter, repositoryName, packagePath } = {}) => {
  const ghToken = process.env.GITHUB_TOKEN
  const repository = new GitHub(ghToken && {
    token: ghToken
  }).getRepo(repositoryName)

  const [ treeBeforeCommit, treeAfterCommit ] = await Promise.all([
    repository.getCommit(shaBefore),
    repository.getCommit(shaAfter)
  ])
    .then((responses) => responses.map(({ data }) => data))
    .then((commits) => commits.map(({ tree }) => tree.sha))
    .then((treeShas) => Promise.all(
      treeShas.map((treeSha) => getTreeRecursive(repository, treeSha))
    ))

  const packagesFile = treeAfterCommit.find(({ path }) => path === 'packages.json')
  if (!packagesFile) {
    throw new Error('Target repository does not contain "packages.json".')
  }

  const packages = await repository.getBlob(packagesFile.sha)
    .then((res) => res.data)
  
  validatePackagesFile(packages)

  const packagesFileBeforeCommit = treeBeforeCommit.find(({ path }) => path === 'packages.json')
  if (!packagesFileBeforeCommit) {
    return packages
  }

  let packagesWithChangedConfigByName = []
  if (packagesFile.sha !== packagesFileBeforeCommit.sha) {
    const packagesBeforeCommit = await repository.getBlob(packagesFileBeforeCommit.sha)
      .then((res) => res.data)

    packagesWithChangedConfigByName = packages.reduce((changedPackages, packageConfig) => {
      const oldPackageConfig = packagesBeforeCommit.find(
        ({ name }) => name === packageConfig.name
      )

      if (!oldPackageConfig || !deepEqual(packageConfig, oldPackageConfig)) {
        return changedPackages.concat(packageConfig.name)
      }

      return changedPackages
    }, [])
  }

  const ignoredPaths = await getIgnoredPaths(repository, treeAfterCommit)
  const shouldIgnoreFile = picomatch(ignoredPaths.concat('**/' + getIgnoredPaths.ignoreFileName))

  return packages.reduce((changedPackages, packageConfig) => {
    if (packagesWithChangedConfigByName.includes(packageConfig.name)) {
      return changedPackages.concat(packageConfig)
    }

    const packageDependencyPaths = [
      posix.join(packagePath, packageConfig.name),
      ...(packageConfig.dependencies || []).map((dependency) => posix.join(packagePath, dependency))
    ]

    const changed = packageDependencyPaths.reduce((changed, path) => {
      if (changed) {
        return true
      }

      const fileShasBeforeCommit = filterTreeByPath(
        treeBeforeCommit,
        path,
        shouldIgnoreFile
      ).reduce(treeToFileShas, {})

      const fileShasAfterCommit = filterTreeByPath(
        treeAfterCommit,
        path,
        shouldIgnoreFile
      ).reduce(treeToFileShas, {})

      if (Object.keys(fileShasBeforeCommit).length !== Object.keys(fileShasAfterCommit).length) {
        return true
      }

      return Object.keys(fileShasAfterCommit).reduce((changed, path) => {
        if (changed) {
          return true
        }

        return fileShasBeforeCommit[path] !== fileShasAfterCommit[path]
      }, false)
    }, false)

    return changed
      ? changedPackages.concat(packageConfig)
      : changedPackages
  }, [])
}

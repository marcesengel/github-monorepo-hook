const GitHub = require('github-api')
const { join } = require('path')

const getTreeRecursive = async (repository, treeSha) => {
  const recursiveRequest = await repository._request(
    'GET',
    `/repos/${repository.__fullname}/git/trees/${treeSha}?recursive=1`,
    null
  )

  if (!recursiveRequest.truncated) {
    return recursiveRequest.tree
  }

  const { tree, truncated } = await repository.getTree(treeSha)
  if (truncated) {
    throw new Error(`Tree layer with SHA ${treeSha} exceeded the limit of 100.000 items!`)
  }

  const subTrees = await Promise.all(
    tree
      .filter(({ type }) => type === 'tree')
      .map(async ({ sha, path }) => {
        const tree = await getTreeRecursive(repository, sha)

        return tree.map(({ path: entryPath, ...entry }) => ({
          path: join(path, entryPath),
          ...entry
        }))
      })
  )

  return tree.concat(subTrees)
}

module.exports = async ({ before: shaBefore, head: shaAfter, repositoryName } = {}) => {
  const ghToken = process.env.GITHUB_TOKEN
  const repository = new GitHub(ghToken && {
    token: ghToken
  }).getRepo(repositoryName)

  const [ treeBeforeCommit, treeAfterCommit ] = await Promise.all([
    repository.getCommit(shaBefore),
    repository.getCommit(shaAfter)
  ])
    .then((commits) => commits.map(({ commit }) => commit.tree.sha))
    .then((treeShas) => Promise.all(
      treeShas.map((treeSha) => getTreeRecursive(repository, treeSha))
    ))

  const packagesFile = treeAfterCommit.find(({ path }) => path === 'packages.json')
  if (!packagesFile) {
    throw new Error('Target repository does not contain "packages.json".')
  }

  const packages = await repository.getBlob(packagesFile.sha)
    .then((blob) => {
      const buffer = new Buffer(blob.content, blob.encoding)

      return JSON.parse(buffer.toString())
    })
    .then((packages) => packages.map(
      ({ name, dependencies = [] }) => [
        join(packagePath, name),
        ...dependencies.map((dependency) => join(packagePath, dependency))
      ]
    ))

  const filterTreeByPath = (tree, path) => tree.filter(
    ({ path: filePath }) => filePath.startsWith(path)
  )

  const treeToFileShas = (result, { path, sha }) => {
    result[path] = sha
    return result
  }

  return packages.reduce((changedPackageIndexes, packageDependencyPaths, packageIndex) => {
    const changed = packageDependencyPaths.reduce((changed, path) => {
      if (changed) {
        return true
      }

      const fileShasBeforeCommit = filterTreeByPath(
        treeBeforeCommit,
        path
      ).reduce(treeToFileShas, {})

      const fileShasAfterCommit = filterTreeByPath(
        treeAfterCommit,
        path
      ).reduce(treeToFileShas, {})

      if (filesBeforeCommit.length !== filesAfterCommit.length) {
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
      ? changedPackageIndexes.concat(packageIndex)
      : changedPackageIndexes
  }, [])
}

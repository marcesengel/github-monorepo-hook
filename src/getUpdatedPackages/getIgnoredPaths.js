const { posix } = require('path')

const ignoreFileName = '.deployignore'

const getIgnoredPaths = async (repository, tree) => {
  const ignoreFiles = await Promise.all(
    tree
      .filter(({ path }) => (
        path === ignoreFileName || path.endsWith('/' + ignoreFileName)
      ))
      .map(async ({ sha, path }) => {
        const { data } = await repository.getBlob(sha)

        return { dir: posix.parse(path).dir, data }
      })
  )

  return ignoreFiles.reduce((ignoredPaths, ignoreFile) => (
    ignoredPaths.concat(ignoreFile.data.split('\n').filter((s) => s !== '').map(
      (relativePath) => {
        const absolutePath = posix.join(ignoreFile.dir, relativePath)
        if (absolutePath.startsWith('..')) {
          // eslint-disable-next-line no-console
          console.warn(`Out of directory path in "${posix.join(ignoreFile.dir, ignoreFileName)}": "${absolutePath}"`)
        }

        return absolutePath
      }
    ))
  ), [])
}

module.exports = getIgnoredPaths

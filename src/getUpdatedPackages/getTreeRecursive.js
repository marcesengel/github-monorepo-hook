const getTreeRecursive = async (repository, treeSha) => {
  const recursiveRequest = await repository._request(
    'GET',
    `/repos/${repository.__fullname}/git/trees/${treeSha}?recursive=1`,
    null
  )
    .then((res) => res.data)

  if (!recursiveRequest.truncated) {
    return recursiveRequest.tree
  }

  const { tree, truncated } = await repository.getTree(treeSha)
    .then((res) => res.data)
  if (truncated) {
    throw new Error(`Tree layer with SHA ${treeSha} exceeded the limit of 100.000 items.`)
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

module.exports = getTreeRecursive

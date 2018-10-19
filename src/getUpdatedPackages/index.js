const GitHub = require('github-api')

module.exports = async ({ before: shaBefore, repositoryName, packages = [] } = {}) => {
  const ghToken = process.env.GITHUB_TOKEN
  const repository = new GitHub(ghToken && {
    token: ghToken
  }).getRepo(repositoryName)

  const packagesHaveCommits = await Promise.all(
    packages.map((pkg) => (
      repository.listCommits({
        sha: shaBefore,
        path: pkg
      })
        .then((response) => response.data)
        .then((commits) => commits.filter(
          (commit) => commit.sha !== shaBefore
        ))
        .then((commits) => commits.length > 0)
    ))
  )

  return packages.filter(
    (_, index) => packagesHaveCommits[index]
  )
}

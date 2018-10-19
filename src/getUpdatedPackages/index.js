const GitHub = require('github-api')

module.exports = async ({ before, repositoryName, packages }) => {
  const ghToken = process.env.GITHUB_TOKEN
  const gh = new GitHub(ghToken && {
    token: ghToken
  }).getRepo()

  const packagesHaveCommits = await Promise.all(
    packages.map((repo) => (
      gh.listCommits({
        sha: shaBefore,
        path: packagePath + repo
      })
        .then((commits) => commits.filter(
          (commit) => commit.sha !== shaBefore
        ))
        .then((commits) => commits.length > 1)
    ))
  )

  return packages.filter(
    (_, index) => packagesHaveCommits[index]
  )
}

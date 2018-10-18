module.exports = async () => {
  // const repositoriesHaveCommits = await Promise.all(
  //   repositories.map((repo) => (
  //     gh.listCommits({
  //       sha: shaBefore,
  //       path: packagePath + repo
  //     })
  //       .then((commits) => commits.filter(
  //         (commit) => commit.sha !== shaBefore
  //       ))
  //       .then((commits) => commits.length > 1)
  //   ))
  // )
  //
  // return repositories.filter(
  //   (_, index) => repositoriesHaveCommits[index]
  // )
}

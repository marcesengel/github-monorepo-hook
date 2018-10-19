const casual = require('casual')

jest.mock('github-api')

const getUpdatedPackages = require('../../getUpdatedPackages')
const GitHub = require('github-api')

describe('getUpdatedPackages()', () => {
  let ghTokenBefore
  const listCommits = jest.fn().mockResolvedValue({
    data: []
  })
  const getRepo = jest.fn().mockReturnValue({
    listCommits
  })

  beforeAll(() => {
    ghTokenBefore = process.env.GITHUB_TOKEN
    process.env.GITHUB_TOKEN = casual.uuid

    GitHub.mockImplementation(() => ({
      getRepo
    }))
  })

  afterAll(() => {
    process.env.GITHUB_TOKEN = ghTokenBefore
  })

  beforeEach(() => {
    GitHub.mockClear()
    getRepo.mockClear()
    listCommits.mockClear()
  })

  it('constructs a new GitHub object using the credentials from process.env.GITHUB_TOKEN', async () => {
    await getUpdatedPackages()

    expect(GitHub).toHaveBeenCalledTimes(1)
    expect(GitHub).toHaveBeenCalledWith({
      token: process.env.GITHUB_TOKEN
    })
  })

  it('constructs a new GitHub object using no authentication if process.env.GITHUB_TOKEN is empty', async () => {
    let ghTokenBefore = process.env.GITHUB_TOKEN
    delete process.env.GITHUB_TOKEN

    await getUpdatedPackages()

    expect(GitHub).toHaveBeenCalledTimes(1)
    expect(GitHub).toHaveBeenCalledWith(undefined)

    process.env.GITHUB_TOKEN = ghTokenBefore
  })

  it('fetches the repo specified by { repositoryName }', async () => {
    const repositoryName = `${casual.word}/${casual.word}`

    await getUpdatedPackages({ repositoryName })

    expect(getRepo).toHaveBeenCalledTimes(1)
    expect(getRepo).toHaveBeenCalledWith(repositoryName)
  })

  it('calls Repository.listCommits() with { sha = before, path = pkg } for every package', async () => {
    const packages = [
      casual.word,
      casual.word
    ]
    const before = casual.uuid

    await getUpdatedPackages({ before, packages })

    expect(listCommits).toHaveBeenCalledTimes(packages.length)
    packages.forEach((pkg) => {
      expect(listCommits.mock.calls).toContainEqual([ {
        sha: before,
        path: pkg
      } ])
    })
  })

  it('filters the packages by wheter or not listCommits() returned commits relating to them (despite the commit from before the push)', async () => {
    const before = casual.uuid
    const commitBefore = {
      sha: before
    }

    const packages = [
      casual.word,
      casual.word
    ]

    listCommits.mockResolvedValueOnce({
      data: [ commitBefore ]
    })
    listCommits.mockResolvedValueOnce({
      data: [ commitBefore, {
        sha: casual.uuid
      } ]
    })

    const result = await getUpdatedPackages({ before, packages })

    expect(result).toEqual(packages.slice(1))
  })
})

const casual = require('casual')

jest.doMock('../authenticate')
jest.doMock('../getUpdatedPackages')

const handler = require('..')

const authenticate = require('../authenticate')
const getUpdatedPackages = require('../getUpdatedPackages')

describe('facemurphy-backend-deploy', () => {
  beforeEach(() => {
    authenticate.mockClear()
    getUpdatedPackages.mockClear()
  })

  describe('getUpdatedPackages', () => {
    beforeEach(() => {
      authenticate.mockReturnValueOnce(true)
    })

    it('gets called with an object containing before, repositoryName, packagePath and packages', async () => {
      getUpdatedPackages.mockResolvedValueOnce([])

      const body = {
        before: casual.uuid,
        repository: {
          full_name: `${casual.username}/${casual.word}`
        }
      }

      const packages = [ casual.word, casual.word, casual.word ]
      const packagePath = `${casual.word}/`

      await handler({ body }, packages, { packagePath })

      expect(getUpdatedPackages).toHaveBeenCalledTimes(1)
      expect(getUpdatedPackages).toHaveBeenCalledWith({
        before: body.before,
        repositoryName: body.repository.full_name,
        packages: packages.map((pkg) => packagePath + pkg)
      })
    })

    it('returns false if getUpdatedPackages returns an empty array', async () => {
      getUpdatedPackages.mockResolvedValueOnce([])

      const result = await handler({})

      expect(getUpdatedPackages).toHaveBeenCalledTimes(1)
      expect(result).toBe(false)
    })
  })

  describe('authenticate', () => {
    it('passes the X-Hub-Signature header as the first argument', async () => {
      const token = casual.uuid
      const headers = {
        ['X-Hub-Signature']: token
      }

      await handler({ headers })

      expect(authenticate).toHaveBeenCalledTimes(1)
      expect(authenticate.mock.calls[0][0]).toBe(token)
    })

    it('passes the body as the second argument', async () => {
      const body = {
        id: casual.uuid
      }

      await handler({ body })

      expect(authenticate).toHaveBeenCalledTimes(1)
      expect(authenticate.mock.calls[0][1]).toBe(body)
    })

    it('returns false and does not call getUpdatedPackages() if authenticate() returns false', async () => {
      authenticate.mockReturnValueOnce(false)

      const result = await handler({})

      expect(authenticate).toHaveBeenCalledTimes(1)
      expect(result).toBe(false)

      expect(getUpdatedPackages).toHaveBeenCalledTimes(0)
    })
  })
})

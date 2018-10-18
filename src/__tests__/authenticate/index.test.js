const casual = require('casual')

jest.doMock('crypto')
jest.doMock('safe-compare')

const authenticate = require('../../authenticate')

const crypto = require('crypto')
const safeCompare = require('safe-compare')

describe('authenticate()', () => {
  crypto.createHmac.mockImplementation(() => ({
    update: jest.fn(),
    digest: jest.fn(() => casual.uuid)
  }))
  safeCompare.mockImplementation(() => casual.uuid)

  beforeEach(() => {
    crypto.createHmac.mockClear()
    safeCompare.mockClear()
  })

  describe('createHmac', () => {
    it('gets only called once', () => {
      authenticate()

      expect(crypto.createHmac).toHaveBeenCalledTimes(1)
    })

    it('gets passed sha1 for the algorithm', () => {
      authenticate()

      expect(crypto.createHmac.mock.calls[0][0]).toBe('sha1')
    })

    it('gets passed GITHUB_SECRET from process.env as the secret', () => {
      const oldSecret = process.env.GITHUB_SECRET
      process.env.GITHUB_SECRET = casual.word

      authenticate()

      expect(crypto.createHmac.mock.calls[0][1]).toBe(
        process.env.GITHUB_SECRET
      )

      process.env.GITHUB_SECRET = oldSecret
    })
  })

  it('calls hmac.update() with the stringified body from the arguments', () => {
    const body = {
      name: casual.name
    }
    const stringifySpy = jest.spyOn(JSON, 'stringify')

    authenticate('', body)

    expect(stringifySpy).toHaveBeenCalledTimes(1)

    const hmac = crypto.createHmac.mock.results[0].value
    expect(hmac.update).toHaveBeenCalledTimes(1)
    expect(hmac.update).toHaveBeenCalledWith(
      stringifySpy.mock.results[0].value
    )

    stringifySpy.mockRestore()
  })

  it('calls hmac.digest() with hexadecimal encoding', () => {
    authenticate()

    const hmac = crypto.createHmac.mock.results[0].value
    expect(hmac.digest).toHaveBeenCalledTimes(1)
    expect(hmac.digest).toHaveBeenCalledWith('hex')
  })

  it('returns the result of safeCompare(\'sha1=\' + hash, token)', () => {
    const token = casual.uuid

    const result = authenticate(token)

    const hmac = crypto.createHmac.mock.results[0].value
    const hash = hmac.digest.mock.results[0].value

    expect(safeCompare).toHaveBeenCalledTimes(1)
    expect(safeCompare).toHaveBeenCalledWith('sha1=' + hash, token)

    expect(result).toBe(
      safeCompare.mock.results[0].value
    )
  })
})

/*
  TODO:

*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')

// Library under test.
const Derivation = require('../../src/commands/derivation')
// const config = require('../../config')

// Mock data
const testwallet = require('../mocks/testwallet.json')
const { bitboxMock } = require('../mocks/bitbox')
// const utilMocks = require('../mocks/util')

// Inspect utility used for debugging.
const util = require('util')
util.inspect.defaultOptions = {
  showHidden: true,
  colors: true,
  depth: 1
}

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = 'unit'

describe('#derivation', () => {
  let BITBOX
  let mockedWallet
  let derivation
  let sandbox

  beforeEach(() => {
    // By default, use the mocking library instead of live calls.
    BITBOX = bitboxMock
    mockedWallet = Object.assign({}, testwallet) // Clone the testwallet

    sandbox = sinon.createSandbox()

    derivation = new Derivation()
    derivation.BITBOX = BITBOX
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags', () => {
    it('should throw error if name is not supplied.', () => {
      try {
        derivation.validateFlags({})
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet with the -n flag',
          'Expected error message.'
        )
      }
    })

    it('should throw error if save argument is not an integer', () => {
      try {
        const flags = {
          name: 'testwallet',
          save: 'abc'
        }

        derivation.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'Derivation path must be an integer',
          'Expected error message.'
        )
      }
    })
  })

  describe('#saveDerivation', () => {
    it('should catch errors', async () => {
      try {
        derivation.saveDerivation()
        assert(true, false, 'Unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Cannot read pro')
      }
    })

    it('should save the new derivation path to the wallet file', () => {
      const filename = `${__dirname.toString()}/../../wallets/test123.json`

      const flags = {
        name: 'test123',
        save: '245'
      }

      const result = derivation.saveDerivation(flags, filename, mockedWallet)

      assert.equal(result, true, 'Successful save expected')
    })
  })

  describe('#run', () => {
    it('should catch errors', async () => {
      try {
        sandbox.stub(derivation, 'parse').throws(new Error('test error'))

        await derivation.run()
        // console.log(`burnConfig: ${JSON.stringify(burnConfig, null, 2)}`)
        assert(true, false, 'Unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'test error')
      }
    })

    it('should run the run method', async () => {
      const flags = {
        name: 'test123',
        save: '245'
      }
      sandbox.stub(derivation, 'parse').returns({
        flags: flags
      })

      await derivation.run(flags)
    })
  })
})

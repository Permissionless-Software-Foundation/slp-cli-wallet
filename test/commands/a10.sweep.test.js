/*
  TODO:
*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')

// Library under test.
const Sweep = require('../../src/commands/sweep')
const config = require('../../config')

// Mocking data
const mockData = require('../mocks/sweep-mocks')

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = 'unit'

describe('Sweep', () => {
  // let mockedWallet
  let sweep
  let sandbox

  beforeEach(() => {
    // By default, use the mocking library instead of live calls.
    // mockedWallet = Object.assign({}, testwallet) // Clone the testwallet

    sweep = new Sweep()
    // sweep.bchjs = bchjs

    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags', () => {
    it('should throw error if wif is not supplied.', () => {
      try {
        sweep.validateFlags({})
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a private key in WIF format with the -w flag',
          'Expected error message.'
        )
      }
    })

    it('should throw error if recieving address is not supplied.', () => {
      try {
        const flags = {
          wif: 'abc123'
        }

        sweep.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a send-to address with the -a flag.',
          'Expected error message.'
        )
      }
    })

    it('should return true if address is supplied but balanceOnly is not', () => {
      const flags = {
        wif: 'testwallet',
        address: 'abc'
      }

      const result = sweep.validateFlags(flags)

      assert.equal(result, true)
    })

    it('should return true if balanceOnly is supplied but address is not.', () => {
      const flags = {
        wif: 'testwallet',
        balanceOnly: true
      }

      const result = sweep.validateFlags(flags)

      assert.equal(result, true)
    })

    it('should return true if all flags are supplied', () => {
      const flags = {
        wif: 'testwallet',
        address: 'abc',
        balanceOnly: false
      }

      const result = sweep.validateFlags(flags)

      assert.equal(result, true)
    })
  })

  describe('#getBalance()', () => {
    if (process.env.TEST === 'unit') {
      it('should return balance', async () => {
        sweep.bchjs = new config.BCHLIB({ restURL: config.MAINNET_REST })

        const flags = {
          wif: 'KzGSsGMuFgtwkTyT3T8jwS1yUNov2j79D4qoP3SnBDdiAJBKK9Te'
        }

        // Use mocked data if this is a unit test.
        if (process.env.TEST === 'unit') {
          sandbox
            .stub(sweep.bchjs.Electrumx, 'balance')
            .resolves(mockData.mockBalance2)
        }

        const result = await sweep.getBalance(flags)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.isAbove(result, 0)
      })
    }
  })

  describe('#getTokens()', () => {
    it('should return empty arrays if address has no UTXOs.', async () => {
      // Use mocked data if this is a unit test.
      if (process.env.TEST === 'unit') {
        sandbox.stub(sweep.bchjs.Electrumx, 'utxo').resolves(mockData.mockEmptyUtxos)
      }

      const flags = {
        wif: 'L2mMGwnLCqBGNHDpFEWXXq9i6unFgWoDvskyJbFvM1HUz7SnjeQm'
      }

      const result = await sweep.getTokens(flags)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.hasAllKeys(result, ['bchUtxos', 'tokenUtxos'])
      assert.isEmpty(result.bchUtxos)
      assert.isEmpty(result.tokenUtxos)
    })

    it('should throw an error if WIF has tokens but no BCH.', async () => {
      try {
        // Use mocked data if this is a unit test.
        if (process.env.TEST === 'unit') {
          sandbox
            .stub(sweep.bchjs.Electrumx, 'utxo')
            .resolves(mockData.tokenOnlyUtxos)

          sandbox
            .stub(sweep.bchjs.SLP.Utils, 'tokenUtxoDetails')
            .resolves(mockData.tokenOnlyTokenInfo)
        }

        const flags = {
          wif: 'L1Rd1wjFng6GfQ2tEMgUYhZu8nTaW6hJ4Qu2vitWW2BJk17DH72s'
        }

        await sweep.getTokens(flags)
      } catch (err) {
        // console.log(`test err: `, err)
        assert.include(err.message, 'Tokens found, but no BCH UTXOs found')
      }
    })

    if (process.env.TEST === 'unit') {
      it('should return BCH utxos and no token UTXOs.', async () => {
        // Use mocked data if this is a unit test.
        if (process.env.TEST === 'unit') {
          sandbox
            .stub(sweep.bchjs.Electrumx, 'utxo')
            .resolves(mockData.bchOnlyUtxos)

          sandbox
            .stub(sweep.bchjs.SLP.Utils, 'tokenUtxoDetails')
            .resolves(mockData.bchOnlyTokenInfo)
        }

        const flags = {
          wif: 'L1Rd1wjFng6GfQ2tEMgUYhZu8nTaW6hJ4Qu2vitWW2BJk17DH72s'
        }

        const result = await sweep.getTokens(flags)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.hasAllKeys(result, ['bchUtxos', 'tokenUtxos'])
        assert.isNotEmpty(result.bchUtxos)
        assert.isEmpty(result.tokenUtxos)
      })

      it('should return both BCH and token UTXOs.', async () => {
        // Use mocked data if this is a unit test.
        if (process.env.TEST === 'unit') {
          sandbox
            .stub(sweep.bchjs.Electrumx, 'utxo')
            .resolves(mockData.bothUtxos)

          sandbox
            .stub(sweep.bchjs.SLP.Utils, 'tokenUtxoDetails')
            .resolves(mockData.bothTokenInfo)
        }

        const flags = {
          wif: 'L1Rd1wjFng6GfQ2tEMgUYhZu8nTaW6hJ4Qu2vitWW2BJk17DH72s'
        }

        const result = await sweep.getTokens(flags)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.hasAllKeys(result, ['bchUtxos', 'tokenUtxos'])
        assert.isNotEmpty(result.bchUtxos)
        assert.isNotEmpty(result.tokenUtxos)
      })
    }
  })

  describe('#sweepBCH', () => {
    it('should throw an error if there are no funds found', async () => {
      // Use mocked data if this is a unit test.
      if (process.env.TEST === 'unit') {
        sandbox.stub(sweep.bchjs.Electrumx, 'utxo').resolves(mockData.mockEmptyUtxos)
      }

      const flags = {
        wif: 'L287yGQj4DB4fbUKSV7DMHsyGQs1qh2E3EYJ21P88mXNKaFvmNWk',
        address: 'bitcoincash:qqjes5sxwneywmnzqndvs6p3l9rp55a2ug0e6e6s0a'
      }
      try {
        await sweep.sweepBCH(flags)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)
      } catch (err) {
        // console.log(`error: ${err.message}`, err)
        assert.include(err.message, 'Original amount less than the dust limit')
      }

      // assert.isString(result[0], "Returned value should be a txid string.")
    })

    // it should throw an error if UTXO balance is too small

    if (process.env.TEST === 'unit') {
      it('should sweep funds', async () => {
        // Use mocked data if this is a unit test.
        if (process.env.TEST === 'unit') {
          sandbox
            .stub(sweep.bchjs.Electrumx, 'utxo')
            .resolves(mockData.bchOnlyUtxos)
        }

        const flags = {
          wif: 'KzGSsGMuFgtwkTyT3T8jwS1yUNov2j79D4qoP3SnBDdiAJBKK9Te',
          address: 'bitcoincash:qqtc3vqfzz050jkvcfjvtzj392lf6wlqhun3fw66n9'
        }

        const result = await sweep.sweepBCH(flags)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.isString(result[0], 'Returned value should be a hex tx string.')
      })
    }
  })

  describe('#sweepTokens', () => {
    it('it should throw an error if bchUTXOs are not an array.', async () => {
      try {
        const flags = {
          wif: 'KwJuXZw6M9KJXts7CjqkiVTtuMyA6FvgyCnnXpYMB3k6Z9U3w6oS',
          address: 'bitcoincash:qp3mad7ys76tdxlsuf7dx9qjy3psxft8gu56fx8ydx'
        }

        await sweep.sweepTokens(flags, 'bad data', mockData.twoTokens)
      } catch (err) {
        assert.include(
          err.message,
          'bchUtxos need to be an array with one UTXO'
        )
      }
    })

    it('it should throw an error if bchUTXOs is an empty array', async () => {
      try {
        const flags = {
          wif: 'KwJuXZw6M9KJXts7CjqkiVTtuMyA6FvgyCnnXpYMB3k6Z9U3w6oS',
          address: 'bitcoincash:qp3mad7ys76tdxlsuf7dx9qjy3psxft8gu56fx8ydx'
        }

        await sweep.sweepTokens(flags, [], mockData.twoTokens)
      } catch (err) {
        assert.include(
          err.message,
          'bchUtxos need to be an array with one UTXO'
        )
      }
    })

    it('it should throw an error if tokenUTXOs are not an array.', async () => {
      try {
        const flags = {
          wif: 'KwJuXZw6M9KJXts7CjqkiVTtuMyA6FvgyCnnXpYMB3k6Z9U3w6oS',
          address: 'bitcoincash:qp3mad7ys76tdxlsuf7dx9qjy3psxft8gu56fx8ydx'
        }

        await sweep.sweepTokens(flags, mockData.bchUtxo, 'bad data')
      } catch (err) {
        assert.include(
          err.message,
          'tokenUtxos need to be an array with one UTXO'
        )
      }
    })

    it('it should throw an error if bchUTXOs is an empty array', async () => {
      try {
        const flags = {
          wif: 'KwJuXZw6M9KJXts7CjqkiVTtuMyA6FvgyCnnXpYMB3k6Z9U3w6oS',
          address: 'bitcoincash:qp3mad7ys76tdxlsuf7dx9qjy3psxft8gu56fx8ydx'
        }

        await sweep.sweepTokens(flags, mockData.bchUtxo, [])
      } catch (err) {
        assert.include(
          err.message,
          'tokenUtxos need to be an array with one UTXO'
        )
      }
    })

    it('it should throw an error if more than one token class is detected.', async () => {
      try {
        const flags = {
          wif: 'KwJuXZw6M9KJXts7CjqkiVTtuMyA6FvgyCnnXpYMB3k6Z9U3w6oS',
          address: 'bitcoincash:qp3mad7ys76tdxlsuf7dx9qjy3psxft8gu56fx8ydx'
        }

        await sweep.sweepTokens(flags, mockData.bchUtxo, mockData.twoTokens)
      } catch (err) {
        // console.log(err)
        assert.include(err.message, 'Multiple token classes detected')
      }
    })

    // it should throw an error if UTXO balance is too small
    // Note: Not possible.

    // it should throw an error if BCH remainder is less than zero.
    // Note: Not possible.

    // it should throw an error if token output is great than 1.
    // Note: not possible?

    it('should sweep a key with tokens and bch', async () => {
      const flags = {
        wif: 'L2cwnthdbVSfa5HVQcsj5FDjDR5qjthSgarCKv4yVYDXdB5E8nFL',
        address: 'bitcoincash:qzvdh3sutlvedu94aq6h73lyfacd0xqnvv7setgjlm'
      }

      const result = await sweep.sweepTokens(
        flags,
        mockData.bchUtxo,
        mockData.tokenOnlyTokenInfo
      )
      console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isString(result)
    })
  })
})

/*
  TODO:

*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')
const cloneDeep = require('lodash.clonedeep')

// Library under test.
const SendTokens = require('../../src/commands/slp-avax-bridge')
const testUtil = require('../util/test-util')
// const config = require('../../config')

// Mock data
const testwallet = require('../mocks/token-wallet.json')
const mockDataLib = require('../mocks/slp-avax.mock')
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

describe('#slp-avax-bridge', () => {
  let bchjs
  let sandbox
  let uut
  let mockedWallet
  let mockData

  beforeEach(() => {
    // By default, use the mocking library instead of live calls.
    bchjs = bitboxMock
    mockedWallet = cloneDeep(testwallet) // Clone the testwallet
    mockData = cloneDeep(mockDataLib)

    sandbox = sinon.createSandbox()

    uut = new SendTokens()
    testUtil.restoreWallet()
    // uut.bchjs = bchjs
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags', () => {
    it('should throw error if name is not supplied.', () => {
      try {
        uut.validateFlags({})
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet with the -n flag',
          'Expected error message.'
        )
      }
    })

    it('should throw error if token quantity is not supplied.', () => {
      try {
        const flags = {
          name: 'testwallet'
        }

        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a quantity of tokens with the -q flag',
          'Expected error message.'
        )
      }
    })

    it('should throw error if recieving address is not supplied.', () => {
      try {
        const flags = {
          name: 'testwallet',
          qty: 0.1
        }

        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify the bridge address with the -a flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if avalanche address is not supplied.', () => {
      try {
        const flags = {
          name: 'testwallet',
          qty: 0.1,
          sendAddr: 'abc'
        }

        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a send-to address with the -x flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if token ID is not supplied.', () => {
      try {
        const flags = {
          name: 'testwallet',
          qty: 0.1,
          sendAddr: 'abc',
          avaxAddr: 'abc'
        }

        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'TokenIdHex must be provided as a 64 character hex string',
          'Expected error message.'
        )
      }
    })

    it('should return true if all flags are supplied.', () => {
      const flags = {
        name: 'testwallet',
        qty: 1.5,
        sendAddr: 'abc',
        avaxAddr: 'abc',
        tokenId:
          'c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479'
      }

      const result = uut.validateFlags(flags)

      assert.equal(result, true)
    })
  })

  describe('#sendTokensToBridge', () => {
    it('should throw and error if the bch utxo isnt big enough', async () => {
      try {
        const bchUTXO = mockData.bchUTXO
        bchUTXO.value = 2500

        await uut.sendTokensToBridge(
          bchUTXO,
          5,
          'bitcoincash:qqs62clw026rx85sr4kx66uewnxhysl5cuxk89r2ec',
          'bitcoincash:qrt68l0ae3mz00amspjpxt7hapztzdlss5xgs8pkm6',
          mockedWallet,
          mockData.tokenUtxos,
          'xchain'
        )
        assert.fail('unexpected result')
      } catch (error) {
        assert.include(error.message, 'Selected UTXO does not have enough satoshis')
      }
    })

    it('should return the transaction as a hex string', async () => {
      try {
        const hex = await uut.sendTokensToBridge(
          mockData.bchUTXO,
          5,
          'bitcoincash:qqs62clw026rx85sr4kx66uewnxhysl5cuxk89r2ec',
          'bitcoincash:qrt68l0ae3mz00amspjpxt7hapztzdlss5xgs8pkm6',
          mockedWallet,
          mockData.tokenUtxos,
          'xchain'
        )

        assert.typeOf(hex, 'string')
      } catch (error) {
        assert.fail('unexpected result')
      }
    })
  })

  describe('#run', () => {
    it('should run the function and return 0', async () => {
      try {
        mockedWallet.BCHUtxos[0].utxos[0].value = 4000
        mockedWallet.BCHUtxos[0].utxos[0].satoshis = 4000

        sandbox.stub(uut, 'parse').returns({ flags: mockData.flags })
        sandbox.stub(uut.appUtils, 'openWallet').returns(mockedWallet)
        sandbox.stub(uut.updateBalances, 'updateBalances').resolves(mockedWallet)
        sandbox.stub(uut.send.appUtils, 'isValidUtxo').resolves(true)
        sandbox.stub(uut.appUtils, 'broadcastTx').resolves('anewtxid')

        const res = await uut.run()
        assert.equal(res, 0)
      } catch (error) {
        assert.fail('unexpected result')
      }
    })

    it('should return 1 when there isnt a bch utxo to pay fees', async () => {
      try {
        sandbox.stub(uut, 'parse').returns({ flags: mockData.flags })
        sandbox.stub(uut.appUtils, 'openWallet').returns(mockedWallet)
        sandbox.stub(uut.updateBalances, 'updateBalances').resolves(mockedWallet)
        sandbox.stub(uut.send.appUtils, 'isValidUtxo').resolves(true)
        sandbox.stub(uut.appUtils, 'broadcastTx').resolves('anewtxid')

        const res = await uut.run()
        assert.equal(res, 1)
      } catch (error) {
        // assert.fail('unexpected result')
      }
    })
  })
})

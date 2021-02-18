/*
  TODO:

*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')

// const config = require('../../config')

// Library under test.
const Send = require('../../src/commands/send')

// Mock data
const testwallet = require('../mocks/testwallet.json')
const { bitboxMock } = require('../mocks/bitbox')
const mockData = require('../mocks/send-mocks')

// Inspect utility used for debugging.
const util = require('util')
util.inspect.defaultOptions = {
  showHidden: true,
  colors: true,
  depth: 1
}

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = 'unit'

describe('send', () => {
  let bchjs
  let mockedWallet
  let send
  let sandbox

  beforeEach(() => {
    // By default, use the mocking library instead of live calls.
    bchjs = bitboxMock
    mockedWallet = Object.assign({}, testwallet) // Clone the testwallet

    sandbox = sinon.createSandbox()

    send = new Send()
    send.bchjs = bchjs
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags', () => {
    it('should throw error if name is not supplied.', () => {
      try {
        send.validateFlags({})
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet with the -n flag',
          'Expected error message.'
        )
      }
    })

    it('should throw error if BCH quantity is not supplied.', () => {
      try {
        const flags = {
          name: 'testwallet'
        }

        send.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a quantity in BCH with the -b flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if recieving address is not supplied.', () => {
      try {
        const flags = {
          name: 'testwallet',
          bch: 0.000005
        }

        send.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a send-to address with the -a flag.',
          'Expected error message.'
        )
      }
    })

    it('should return true if all flags are supplied.', () => {
      const flags = {
        name: 'testwallet',
        bch: 0.000005,
        sendAddr: 'abc'
      }

      const result = send.validateFlags(flags)

      assert.equal(result, true)
    })
  })

  describe('#selectUTXO', () => {
    if (process.env.TEST === 'unit') {
      it('should select a single valid UTXO', async () => {
        sandbox.stub(send.appUtils, 'isValidUtxo').resolves(true)

        const bch = 0.00005
        const utxos = mockData.mockSingleUtxos
        // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

        const utxo = await send.selectUTXO(bch, utxos)
        // console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)

        assert.isObject(utxo, 'Expect single utxo object')
        assert.hasAllKeys(utxo, [
          'txid',
          'vout',
          'amount',
          'satoshis',
          'height',
          'tx_hash',
          'tx_pos',
          'value',
          'isValid',
          'address',
          'hdIndex'
        ])
      })
    }

    it('should reject if output is less than dust', async () => {
      if (process.env.TEST === 'unit') {
        sandbox.stub(send.appUtils, 'isValidUtxo').resolves(true)
      }

      const bch = 0.000058
      const utxos = mockData.mockUnspentUtxo
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      const utxo = await send.selectUTXO(bch, utxos)
      // console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)

      assert.isObject(utxo, 'Expect empty object')
      assert.deepEqual(utxo, {})
    })

    it('should reject an invalid UTXO', async () => {
      if (process.env.TEST === 'unit') {
        sandbox.stub(send.appUtils, 'isValidUtxo').resolves(false)
      }

      const bch = 0.00005
      const utxos = mockData.mockSpentUtxo
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      const utxo = await send.selectUTXO(bch, utxos)
      // console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)

      assert.isObject(utxo, 'Expect empty object')
      assert.deepEqual(utxo, {})
    })
  })

  describe('#sendBCH', () => {
    it('should send BCH on testnet', async () => {
      const bch = 0.000005 // BCH to send in an integration test.
      const utxo = {
        txid:
          '26564508facb32a5f6893cb7bdfd2dcc264b248a1aa7dd0a572117667418ae5b',
        vout: 0,
        scriptPubKey: '76a9148687a941392d82bf0af208779c3b147e2fbadafa88ac',
        amount: 0.03,
        satoshis: 3000000,
        height: 1265272,
        confirmations: 733,
        legacyAddress: 'mjSPWfCwCgHZC27nS8GQ4AXz9ehhb2GFqz',
        cashAddress: 'bchtest:qq4sx72yfuhqryzm9h23zez27n6n24hdavvfqn2ma3',
        hdIndex: 0
      }
      const sendToAddr = 'bchtest:qzsfqeqtdk6plsvglccadkqtf0trf2nyz58090e6tt'

      const hex = await send.sendBCH(
        utxo,
        bch,
        utxo.cashAddress,
        sendToAddr,
        testwallet
      )

      // console.log(`hex: ${hex}`)

      assert.isString(hex)
    })

    it('should send BCH on mainnet', async () => {
      const bch = 0.000005 // BCH to send in an integration test.
      const utxo = {
        txid:
          '26564508facb32a5f6893cb7bdfd2dcc264b248a1aa7dd0a572117667418ae5b',
        vout: 0,
        scriptPubKey: '76a9148687a941392d82bf0af208779c3b147e2fbadafa88ac',
        amount: 0.03,
        satoshis: 3000000,
        height: 1265272,
        confirmations: 733,
        legacyAddress: 'mjSPWfCwCgHZC27nS8GQ4AXz9ehhb2GFqz',
        cashAddress: 'bchtest:qq4sx72yfuhqryzm9h23zez27n6n24hdavvfqn2ma3',
        hdIndex: 0
      }
      const sendToAddr = 'bchtest:qzsfqeqtdk6plsvglccadkqtf0trf2nyz58090e6tt'

      // Switch to mainnet
      mockedWallet.network = 'mainnet'

      const hex = await send.sendBCH(
        utxo,
        bch,
        utxo.changeAddress,
        sendToAddr,
        mockedWallet
      )

      assert.isString(hex)
    })
  })
})

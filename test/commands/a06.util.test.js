/*
  TODO:
*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')
const stdout = require('test-console').stdout
const mock = require('mock-fs')

// File under test.
const AppUtils = require('../../src/util')
const config = require('../../config')

// Mocking data
const utilMocks = require('../mocks/util')

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = 'unit'

describe('#util.js', () => {
  let appUtils
  let sandbox

  beforeEach(() => {
    appUtils = new AppUtils()

    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('constructor', () => {
    it('should set bchjs from the config', () => {
      const newConfig = {
        bchjs: new config.BCHLIB({ restURL: 'https://example.com' })
      }
      const newAppUtils = new AppUtils(newConfig)

      assert.equal(newAppUtils.bchjs.restURL, 'https://example.com')
    })
  })

  describe('#broadcastTx', () => {
    it('should throw error on invalid hex', async () => {
      try {
        sandbox
          .stub(appUtils.bchjs.RawTransactions, 'sendRawTransaction')
          .rejects({ error: 'TX decode failed' })

        await appUtils.broadcastTx('somehex')

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.error, 'TX decode failed')
      }
    })

    it('should broadcast raw transaction', async () => {
      try {
        sandbox
          .stub(appUtils.bchjs.RawTransactions, 'sendRawTransaction')
          .rejects({ error: 'Missing inputs' })

        const hex =
          '020000000142a5b1ed30b64801d78597871cfe8355e475c45bce138fe76650cdd1fb28f4b70000000048473044022078138d100e90055f2b7deeba2fe21787e61728e0494323c675fce8e1c33bf594022078dddf8cceaf4225fd313afb107e89c09133e37da0185936dfff8fde8dea846841ffffffff017a2000000000000023210383bc181a0c8d19939dba7400cffb28666580e75531448b2060e968a753620dafac00000000'

        await appUtils.broadcastTx(hex)
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.error, 'Missing inputs')
      }
    })

    it('should return txid', async () => {
      sandbox
        .stub(appUtils.bchjs.RawTransactions, 'sendRawTransaction')
        .resolves('sometxid')
      const result = await appUtils.broadcastTx('somehex')
      assert.equal(result, 'sometxid')
    })
  })

  // describe('#getUTXOs', () => {
  //   it('should get all UTXOs in wallet', async () => {
  //     // Unit test mocking.
  //     if (process.env.TEST === 'unit') {
  //       sandbox
  //         .stub(appUtils.bchjs.Blockbook, 'utxo')
  //         .resolves(utilMocks.mockSpentUtxo)
  //     }
  //
  //     const utxos = await appUtils.getUTXOs(utilMocks.mainnetWallet)
  //     // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)
  //
  //     assert.isArray(utxos, 'Expect array of utxos')
  //     if (utxos.length > 0) {
  //       assert.property(utxos[0], 'txid')
  //       assert.property(utxos[0], 'vout')
  //       assert.property(utxos[0], 'satoshis')
  //       assert.property(utxos[0], 'height')
  //       assert.property(utxos[0], 'confirmations')
  //       assert.property(utxos[0], 'hdIndex')
  //       assert.property(utxos[0], 'value')
  //       assert.property(utxos[0], 'cashAddr')
  //       assert.property(utxos[0], 'legacyAddr')
  //       assert.property(utxos[0], 'slpAddr')
  //     }
  //   })
  // })

  describe('#openWallet', () => {
    it('should throw error if wallet file not found.', () => {
      try {
        appUtils.openWallet('doesnotexist')
      } catch (err) {
        assert.include(err.message, 'Could not open', 'Expected error message.')
      }
    })
  })

  describe('#saveWallet', () => {
    it('should save a wallet without error', async () => {
      const filename = `${__dirname.toString()}/../../wallets/test123.json`

      await appUtils.saveWallet(filename, utilMocks.mockWallet)
    })
    it('should throw error on file write problems', async () => {
      mock()
      try {
        await appUtils.saveWallet(null, utilMocks.mockWallet)
        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'The "path" argument must be of type string'
        )
      }
      mock.restore()
    })
  })

  describe('#changeAddrFromMnemonic', () => {
    it('should return a change address', async () => {
      appUtils.bchjs = new config.BCHLIB({
        restURL: config.TESTNET_REST
      })

      const result = await appUtils.changeAddrFromMnemonic(
        utilMocks.mockWallet,
        0
      )
      // console.log(`result: ${util.inspect(result)}`)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.hasAnyKeys(result, ['keyPair', 'chainCode', 'index'])
    })

    it('should throw exception on missing derivation', async () => {
      try {
        const badWallet = Object.assign({}, utilMocks.mockWallet)
        delete badWallet.derivation
        await appUtils.changeAddrFromMnemonic(badWallet, 0)
      } catch (err) {
        assert.include(
          err.message,
          'walletInfo must have integer derivation value'
        )
      }
    })

    it('should throw exception on negative index', async () => {
      try {
        await appUtils.changeAddrFromMnemonic(utilMocks.mockWallet, null)
      } catch (err) {
        assert.include(err.message, 'index must be a non-negative integer.')
      }
    })
  })

  describe('#validateUtxo', () => {
    it('should throw error on empty input', async () => {
      try {
        await appUtils.isValidUtxo({})
      } catch (err) {
        assert.include(err.message, 'utxo does not have a txid property')
      }
    })

    it('should throw error on malformed utxo', async () => {
      try {
        await appUtils.isValidUtxo({ txid: 'sometxid' })
      } catch (err) {
        assert.include(err.message, 'utxo does not have a vout property')
      }
    })

    it('should return false for a spent UTXO', async () => {
      // Unit test mocking.
      if (process.env.TEST === 'unit') {
        sandbox.stub(appUtils.bchjs.Blockchain, 'getTxOut').resolves(null)
      }

      const result = await appUtils.isValidUtxo(utilMocks.mockSpentUtxo[0])
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result, false)
    })

    it('should return true for an unspent UTXO', async () => {
      // Unit test mocking.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(appUtils.bchjs.Blockchain, 'getTxOut')
          .resolves(utilMocks.mockTxOut)
      }

      const result = await appUtils.isValidUtxo(utilMocks.mockUnspentUtxo[0])
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result, true)
    })
  })

  describe('#generateAddress', () => {
    it('should generate an address accurately.', async () => {
      // updateBalances.bchjs = new config.BCHLIB({
      //   restURL: config.TESTNET_REST
      // })

      const addr = await appUtils.generateAddress(utilMocks.mockWallet, 3, 1)
      // console.log(`addr: ${util.inspect(addr)}`)

      assert.isArray(addr)
      assert.equal(addr.length, 1)
      assert.equal(
        addr[0],
        'bchtest:qqkng037s5pjhhk38mkaa3c6grl3uep845evtxvyse'
      )
    })
    it('should generate the first 20 addresses', async () => {
      appUtils.bchjs = new config.BCHLIB({
        restURL: config.TESTNET_REST
      })

      const addr = await appUtils.generateAddress(utilMocks.mockWallet, 0, 20)
      // console.log(`addr: ${util.inspect(addr)}`)

      assert.isArray(addr)
      assert.equal(addr.length, 20)
      assert.equal(addr[0], utilMocks.mockWallet.rootAddress)
    })
    it('should throw error on empty mnemonic', async () => {
      try {
        const badWallet = Object.assign({}, utilMocks.mockWallet)
        delete badWallet.mnemonic
        await appUtils.generateAddress(badWallet, 0, 20)
      } catch (err) {
        assert.include(err.message, 'mnemonic is undefined!')
      }
    })
  })

  describe('#getIndex', () => {
    it('should throw an error if walletInfo is not included', async () => {
      try {
        await appUtils.getIndex('abc')

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'walletInfo object does not have nextAddress property'
        )
      }
    })

    it('should throw an error if walletInfo does not have an addresses property', async () => {
      try {
        await appUtils.getIndex('abc', { nextAddress: 2 })

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'walletInfo object does not have an addresses property'
        )
      }
    })

    it('should return false if address is not included in wallet', async () => {
      const result = await appUtils.getIndex('abc', utilMocks.mockWallet)

      assert.equal(result, false)
    })

    it('should get index', async () => {
      const addr = 'bchtest:qp6dyeslwkslzruaf29vvtv6lg7lez8csca90lg6a0'
      const result = await appUtils.getIndex(addr, utilMocks.mockWallet)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result, 2)
    })
  })

  describe('#getIndex', () => {
    it('should throw an error if walletInfo is not included', async () => {
      try {
        await appUtils.getIndex('abc')

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'walletInfo object does not have nextAddress property'
        )
      }
    })

    it('should return false if address is not included in wallet', async () => {
      const result = await appUtils.getIndex('abc', utilMocks.mockWallet)

      assert.equal(result, false)
    })

    it('should get index', async () => {
      const addr = 'bchtest:qp6dyeslwkslzruaf29vvtv6lg7lez8csca90lg6a0'
      const result = await appUtils.getIndex(addr, utilMocks.mockWallet)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result, 2)
    })
  })
  describe('#generateIndex', () => {
    it('should throw an error if walletInfo is not included', async () => {
      try {
        await appUtils.generateIndex('abc')

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'walletInfo object does not have nextAddress property'
        )
      }
    })
    it('should generate wallet addresses from walletInfo', async () => {
      const addr = 'bchtest:qp6dyeslwkslzruaf29vvtv6lg7lez8csca90lg6a0'
      const result = await appUtils.generateIndex(addr, utilMocks.mockWallet)
      assert.equal(result, 2)
    })
  })
  describe('#displayTxid', () => {
    it('should display tx for mainnet', async () => {
      const output = stdout.inspectSync(function () {
        appUtils.displayTxid('sometxid', 'mainnet')
      })
      assert.include(output[1], 'TXID: sometxid\n')
      assert.include(
        output[2],
        'View on the block explorer: https://explorer.bitcoin.com/bch/tx/sometxid\n'
      )
    })
    it('should display tx for testnet', async () => {
      const output = stdout.inspectSync(function () {
        appUtils.displayTxid('sometxid', 'testnet')
      })
      assert.include(output[1], 'TXID: sometxid\n')
      assert.include(
        output[2],
        'View on the block explorer: https://explorer.bitcoin.com/tbch/tx/sometxid\n'
      )
    })
  })
  describe('#sleep', () => {
    it('should return promise', async () => {
      await appUtils.sleep(10)
      assert.equal(true, true)
    })
  })
})

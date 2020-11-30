/*
  TODO:

*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')

// Library under test.
const BurnTokens = require('../../src/commands/burn-tokens')
// const config = require('../../config')

// Mock data
const testwallet = require('../mocks/testwallet.json')
const mainwallet = require('../mocks/mainwallet.json')
const { bitboxMock } = require('../mocks/bitbox')
// const utilMocks = require('../mocks/util')
const burnMocks = require('../mocks/burn-mocks')
// const mockWalletFilename = `${__dirname}/../../wallets/test123.json`

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = 'unit'

describe('#burn-tokens', () => {
  let BITBOX
  // let mockedWallet
  let burnTokens
  let sandbox

  beforeEach(() => {
    // By default, use the mocking library instead of live calls.
    BITBOX = bitboxMock
    // mockedWallet = Object.assign({}, testwallet) // Clone the testwallet

    sandbox = sinon.createSandbox()

    burnTokens = new BurnTokens()
    burnTokens.BITBOX = BITBOX
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags', () => {
    it('should throw error if name is not supplied.', () => {
      try {
        burnTokens.validateFlags({})
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

        burnTokens.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a quantity of tokens with the -q flag',
          'Expected error message.'
        )
      }
    })

    it('should throw error if token ID is not supplied.', () => {
      try {
        const flags = {
          name: 'testwallet',
          qty: 0.1
        }

        burnTokens.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specifcy the SLP token ID',
          'Expected error message.'
        )
      }
    })

    it('should throw error if token ID is not valid.', () => {
      try {
        const flags = {
          name: 'testwallet',
          qty: 0.1,
          tokenId: 'abc'
        }

        burnTokens.validateFlags(flags)
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
        tokenId:
          'c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479'
      }

      const result = burnTokens.validateFlags(flags)

      assert.equal(result, true)
    })
  })

  describe('#burnTokens', () => {
    it('should generate tx hex to burn tokens on mainnet', async () => {
      const sendToAddr =
        'bitcoincash:qp72leshv5h4uw8nj500ljwjqq6tqxgsguduwe9zz8'

      const burnConfig = {
        utxo: burnMocks.bchUtxo,
        qty: 1,
        tokenChangeAddress: sendToAddr,
        bchChangeAddress: sendToAddr,
        walletInfo: mainwallet,
        tokenUtxos: burnMocks.tokenUtxo
      }

      const hex = await burnTokens.burnTokens(burnConfig)

      // console.log(`hex: ${hex}`)

      assert.isString(hex)
    })

    it('should generate tx hex to burn tokens on testnet', async () => {
      const sendToAddr = 'bchtest:qpsqatupevgezquvwg29jm0es2m4996655vhxxa8ac'

      const burnConfig = {
        utxo: burnMocks.bchUtxo,
        qty: 1,
        tokenChangeAddress: sendToAddr,
        bchChangeAddress: sendToAddr,
        walletInfo: testwallet,
        tokenUtxos: burnMocks.tokenUtxo
      }

      const hex = await burnTokens.burnTokens(burnConfig)

      // console.log(`hex: ${hex}`)

      assert.isString(hex)
    })

    it('should throw error if not enough funds', async () => {
      try {
        const sendToAddr =
          'bitcoincash:qp72leshv5h4uw8nj500ljwjqq6tqxgsguduwe9zz8'

        const burnConfig = {
          utxo: burnMocks.bchUtxo,
          qty: 1,
          tokenChangeAddress: sendToAddr,
          bchChangeAddress: sendToAddr,
          walletInfo: mainwallet,
          tokenUtxos: burnMocks.tokenUtxo
        }
        burnConfig.utxo.satoshis = 1000

        await burnTokens.burnTokens(burnConfig)

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        // console.log(`err.message: ${err.message}`)
        assert.include(err.message, 'Selected UTXO does not have enough satoshis')
      }
    })
  })

  describe('#prepBurnTokens', () => {
    if (process.env.TEST === 'unit') {
      it('should generate a burnConfig object for mainnet', async () => {
        // Mock network calls if this is a unit test.

        sandbox
          .stub(burnTokens.updateBalances, 'updateBalances')
          .resolves(mainwallet)
        sandbox
          .stub(burnTokens.sendTokens, 'getTokenUtxos')
          .resolves(burnMocks.tokenUtxo)
        // sandbox
        //   .stub(burnTokens.sendTokens, 'getBchUtxos')
        //   .resolves(burnMocks.bchUtxo)
        sandbox.stub(burnTokens.send, 'selectUTXO').resolves(burnMocks.bchUtxo)
        sandbox
          .stub(burnTokens.getAddress, 'getAddress')
          .resolves('bchtest:qpsqatupevgezquvwg29jm0es2m4996655vhxxa8ac')

        const flags = {
          name: 'test123',
          qty: 1,
          tokenId: '1234'
        }

        const burnConfig = await burnTokens.prepBurnTokens(flags)
        // console.log(`burnConfig: ${JSON.stringify(burnConfig, null, 2)}`)

        assert.property(burnConfig, 'utxo')
        assert.property(burnConfig, 'qty')
        assert.property(burnConfig, 'tokenChangeAddress')
        assert.property(burnConfig, 'bchChangeAddress')
        assert.property(burnConfig, 'walletInfo')
      })

      it('should generate a burnConfig object for testnet', async () => {
        // Mock network calls if this is a unit test.

        sandbox
          .stub(burnTokens.updateBalances, 'updateBalances')
          .resolves(testwallet)
        sandbox
          .stub(burnTokens.sendTokens, 'getTokenUtxos')
          .resolves(burnMocks.tokenUtxo)
        // sandbox
        //   .stub(burnTokens.sendTokens, 'getBchUtxos')
        //   .resolves(burnMocks.bchUtxo)
        sandbox.stub(burnTokens.send, 'selectUTXO').resolves(burnMocks.bchUtxo)
        sandbox
          .stub(burnTokens.getAddress, 'getAddress')
          .resolves('bchtest:qpsqatupevgezquvwg29jm0es2m4996655vhxxa8ac')

        const flags = {
          name: 'test123',
          qty: 1,
          tokenId: '1234'
        }

        const burnConfig = await burnTokens.prepBurnTokens(flags)
        // console.log(`burnConfig: ${JSON.stringify(burnConfig, null, 2)}`)

        assert.property(burnConfig, 'utxo')
        assert.property(burnConfig, 'qty')
        assert.property(burnConfig, 'tokenChangeAddress')
        assert.property(burnConfig, 'bchChangeAddress')
        assert.property(burnConfig, 'walletInfo')
      })
    }

    it('should return false if no spendable utxo found', async () => {
      sandbox
        .stub(burnTokens.updateBalances, 'updateBalances')
        .resolves(testwallet)
      sandbox
        .stub(burnTokens.sendTokens, 'getTokenUtxos')
        .resolves(burnMocks.tokenUtxo)
      // sandbox
      //   .stub(burnTokens.sendTokens, 'getBchUtxos')
      //   .resolves(burnMocks.bchUtxo)
      sandbox.stub(burnTokens.send, 'selectUTXO').resolves([])

      const flags = {
        name: 'test123',
        qty: 1,
        tokenId: '1234'
      }

      const burnConfig = await burnTokens.prepBurnTokens(flags)
      // console.log(`burnConfig: ${JSON.stringify(burnConfig, null, 2)}`)

      assert.equal(false, burnConfig)
    })

    it('should catch errors', async () => {
      try {
        sandbox
          .stub(burnTokens.updateBalances, 'updateBalances')
          .throws(new Error('test error'))

        const flags = {
          name: 'test123',
          qty: 1,
          tokenId: '1234'
        }

        await burnTokens.prepBurnTokens(flags)
        // console.log(`burnConfig: ${JSON.stringify(burnConfig, null, 2)}`)

        assert(true, false, 'Unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#run', () => {
    it('should run the run() function', async () => {
      const flags = {
        name: 'test123',
        qty: 1,
        tokenId:
          '40cac7db1e6131e27e7f4170868c8d747d8a7f41132febd7a8bc092717c371f2'
      }

      // Mock methods that will be tested elsewhere.
      sandbox.stub(burnTokens, 'parse').returns({ flags: flags })
      sandbox
        .stub(burnTokens, 'prepBurnTokens')
        .resolves({ walletInfo: { network: 'mainnet' } })
      sandbox.stub(burnTokens, 'burnTokens').resolves('abc123')
      sandbox.stub(burnTokens.appUtils, 'broadcastTx').resolves('abc123')

      await burnTokens.run(flags)
    })

    it('should catch errors', async () => {
      try {
        sandbox.stub(burnTokens, 'parse').throws(new Error('test error'))

        const flags = {
          name: 'test123',
          qty: 1,
          tokenId: '1234'
        }

        await burnTokens.run(flags)
        // console.log(`burnConfig: ${JSON.stringify(burnConfig, null, 2)}`)

        assert(true, false, 'Unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'test error')
      }
    })

    it('should return 0 prepBurnTokens returns false', async () => {
      const flags = {
        name: 'test123',
        qty: 1,
        tokenId:
          '40cac7db1e6131e27e7f4170868c8d747d8a7f41132febd7a8bc092717c371f2'
      }

      // Mock methods that will be tested elsewhere.
      sandbox.stub(burnTokens, 'parse').returns({ flags: flags })
      sandbox.stub(burnTokens, 'prepBurnTokens').resolves(false)

      const result = await burnTokens.run(flags)

      assert.equal(result, 0)
    })
  })
})

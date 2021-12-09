/*
  Create wallet
*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')
const fs = require('fs')
const CreateWallet = require('../../src/commands/create-wallet')
const config = require('../../config')

const { bitboxMock } = require('../mocks/bitbox')
const filename = `${__dirname.toString()}/../../wallets/test123.json`

// Inspect utility used for debugging.
const util = require('util')
util.inspect.defaultOptions = {
  showHidden: true,
  colors: true,
  depth: 1
}

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = 'unit'

// Used to delete testing wallet files.
const deleteFile = () => {
  const prom = new Promise((resolve, reject) => {
    fs.unlink(filename, () => {
      resolve(true)
    }) // Delete wallets file
  })
  return prom
}

describe('create-wallet', () => {
  let createWallet
  let sandbox

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    createWallet = new CreateWallet()

    // By default, use the mocking library instead of live calls.
    createWallet.bchjs = bitboxMock

    await deleteFile()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#createWallet()', () => {
    it('should exit with error status if called without a filename.', async () => {
      try {
        await createWallet.createWallet(undefined, undefined)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(
          err.message,
          'filename required.',
          'Should throw expected error.'
        )
      }
    })

    it('Should exit with error status if called with a filename that already exists.', async () => {
      try {
        // Force the error for testing purposes.
        sandbox.stub(createWallet.fs, 'existsSync').returns(true)

        await createWallet.createWallet(filename, 'testnet')

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(
          err.message,
          'filename already exist',
          'Should throw expected error.'
        )
      }
    })

    it('should create a mainnet wallet file with the given name', async () => {
      // Use the real library if this is not a unit test.
      if (process.env.TEST !== 'unit') {
        createWallet.bchjs = new config.BCHLIB({ restURL: config.MAINNET_REST })
      }

      const walletData = await createWallet.createWallet(filename, undefined)
      // console.log(`walletData: ${JSON.stringify(walletData, null, 2)}`)

      assert.equal(walletData.network, 'mainnet', 'Expecting mainnet address')
      assert.hasAllKeys(walletData, [
        'network',
        'mnemonic',
        'balance',
        'nextAddress',
        'hasBalance',
        'rootAddress',
        'derivation',
        'addresses',
        'description'
      ])

      // hasBalance is an array of objects. Each object represents an address with
      // a balance.
      assert.isArray(walletData.hasBalance)

      // For an integration test, ensure the rootAddress actually reflects mainnet.
      if (process.env.TEST !== 'unit') {
        assert.equal(walletData.rootAddress.indexOf('bitcoincash') > -1, true)
      }
    })

    it('should create a mainnet wallet file when testnet is false', async () => {
      // Use the real library if this is not a unit test.
      if (process.env.TEST !== 'unit') {
        createWallet.bchjs = new config.BCHLIB({ restURL: config.MAINNET_REST })
      }

      const walletData = await createWallet.createWallet(filename, false)

      assert.equal(walletData.network, 'mainnet', 'Expecting mainnet address')
      assert.hasAllKeys(walletData, [
        'network',
        'mnemonic',
        'balance',
        'nextAddress',
        'hasBalance',
        'rootAddress',
        'derivation',
        'addresses',
        'description'
      ])

      // hasBalance is an array of objects. Each object represents an address with
      // a balance.
      assert.isArray(walletData.hasBalance)

      // For an integration test, ensure the rootAddress actually reflects mainnet.
      if (process.env.TEST !== 'unit') {
        assert.equal(walletData.rootAddress.indexOf('bitcoincash') > -1, true)
      }
    })

    it('should create a testnet wallet file with the given name', async () => {
      // Use the real library if this is not a unit test.
      if (process.env.TEST !== 'unit') {
        createWallet.bchjs = new config.BCHLIB({ restURL: config.TESTNET_REST })
      }

      const walletData = await createWallet.createWallet(filename, 'testnet')

      assert.equal(walletData.network, 'testnet', 'Expecting testnet address')
      assert.hasAllKeys(walletData, [
        'network',
        'mnemonic',
        'balance',
        'nextAddress',
        'hasBalance',
        'rootAddress',
        'derivation',
        'addresses',
        'description'
      ])

      // hasBalance is an array of objects. Each object represents an address with
      // a balance.
      assert.isArray(walletData.hasBalance)

      // For an integration test, ensure the rootAddress actually reflects mainnet.
      if (process.env.TEST !== 'unit') {
        assert.equal(walletData.rootAddress.indexOf('bchtest') > -1, true)
      }
    })
  })

  describe('#validateFlags()', () => {
    it('validateFlags() should return true if name is supplied.', () => {
      assert.equal(
        createWallet.validateFlags({ name: 'test' }),
        true,
        'return true'
      )
    })

    it('validateFlags() should throw error if name is not supplied.', () => {
      try {
        createWallet.validateFlags({})
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet with the -n flag',
          'Expected error message.'
        )
      }
    })
  })

  describe('#run()', () => {
    it('should run the run() function', async () => {
      const flags = {
        name: 'test123'
      }
      // Mock methods that will be tested elsewhere.
      sandbox.stub(createWallet, 'parse').returns({ flags: flags })

      const walletData = await createWallet.run()

      assert.equal(walletData.network, 'mainnet', 'Expecting mainnet address')
      assert.hasAllKeys(walletData, [
        'network',
        'mnemonic',
        'balance',
        'nextAddress',
        'hasBalance',
        'rootAddress',
        'derivation',
        'addresses',
        'description'
      ])
      // console.log(`data: ${util.inspect(walletData)}`)
    })

    it('should adjust if testnet wallet is used', async () => {
      const flags = {
        name: 'test123',
        testnet: true
      }

      // Mock methods that will be tested elsewhere.
      sandbox.stub(createWallet, 'parse').returns({ flags: flags })
      sandbox.stub(createWallet.localConfig, 'BCHLIB').returns(bitboxMock)

      const walletData = await createWallet.run()

      assert.equal(walletData.network, 'testnet', 'Expecting mainnet address')
      assert.hasAllKeys(walletData, [
        'network',
        'mnemonic',
        'balance',
        'nextAddress',
        'hasBalance',
        'rootAddress',
        'derivation',
        'addresses',
        'description'
      ])
      // console.log(`data: ${util.inspect(walletData)}`)
    })

    it('should return 0 and display error.message on empty flags', async () => {
      sandbox.stub(createWallet, 'parse').returns({ flags: {} })

      const result = await createWallet.run()

      assert.equal(result, 0)
    })

    it('should handle an error without a message', async () => {
      sandbox.stub(createWallet, 'parse').throws({})

      const result = await createWallet.run()

      assert.equal(result, 0)
    })
  })
})

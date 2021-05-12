/*
  TODO:
*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')

const CreateWallet = require('../../src/commands/create-wallet')
const GetKey = require('../../src/commands/get-key')
const config = require('../../config')

const { bitboxMock } = require('../mocks/bitbox')
const fs = require('fs')

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
const deleteFile = () => {
  const prom = new Promise((resolve, reject) => {
    fs.unlink(filename, () => {
      resolve(true)
    }) // Delete wallets file
  })
  return prom
}
describe('get-key', () => {
  let BITBOX
  let getKey
  let sandbox

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    getKey = new GetKey()

    // By default, use the mocking library instead of live calls.
    BITBOX = bitboxMock
    getKey.BITBOX = BITBOX
    await deleteFile()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('run(): should run the function', async () => {
    const flags = {
      name: 'test123',
      testnet: true
    }
    // Mock methods that will be tested elsewhere.
    sandbox.stub(getKey, 'parse').returns({ flags: flags })

    const newWallet = new CreateWallet()
    await newWallet.createWallet(filename, 'testnet')
    const result = await getKey.run()
    assert.include(result.cashAddress, 'bchtest:')
    assert.include(result.slpAddress, 'slptest:')
  })

  it('run(): should run the function in mainnet', async () => {
    const flags = {
      name: 'test123'
    }
    // Mock methods that will be tested elsewhere.
    sandbox.stub(getKey, 'parse').returns({ flags: flags })

    const newWallet = new CreateWallet()
    await newWallet.createWallet(filename, false)
    const result = await getKey.run()
    assert.include(result.cashAddress, 'bitcoincash:')
    assert.include(result.slpAddress, 'simpleledger:')
  })

  it('run(): should return 0 and display error.message on empty flags', async () => {
    sandbox.stub(getKey, 'parse').returns({ flags: {} })

    const result = await getKey.run()
    assert.equal(result, null)
  })

  it('run(): should handle an error without a message', async () => {
    sandbox.stub(getKey, 'parse').throws({})

    const result = await getKey.run()
    assert.equal(result, null)
  })

  // getKey can be called directly by other programs, so this is tested separately.
  it('getKey should throw error if name is not supplied.', async () => {
    try {
      await getKey.getPair(undefined)
    } catch (err) {
      assert.include(err.message, 'Could not open', 'Expected error message.')
    }
  })

  // This validation function is called when the program is executed from the command line.
  it('validateFlags() should throw error if name is not supplied.', () => {
    try {
      getKey.validateFlags({})
    } catch (err) {
      assert.include(
        err.message,
        'You must specify a wallet with the -n flag',
        'Expected error message.'
      )
    }
  })

  it('should return on proper flags passed', () => {
    assert.equal(getKey.validateFlags({ name: 'test' }), true, 'return true')
  })

  it('should throw error if wallet file not found.', async () => {
    try {
      await getKey.getPair('doesnotexist')
    } catch (err) {
      assert.include(err.message, 'Could not open', 'Expected error message.')
    }
  })

  it('create keys pair for mainnet', async () => {
    if (process.env.TEST !== 'unit') {
      getKey.BITBOX = new config.BCHLIB({ restURL: config.MAINNET_REST })
    }
    // Create a mainnet wallet
    const newWallet = new CreateWallet()
    await newWallet.createWallet(filename, false)
    // Generate a new address
    const result = await getKey.getPair(filename)
    assert.include(result.pub, 'bitcoincash:')
  })

  it('increments the nextAddress property of the wallet.', async () => {
    // Use the real library if this is not a unit test
    if (process.env.TEST !== 'unit') {
      getKey.BITBOX = new config.BCHLIB({ restURL: config.TESTNET_REST })
    }

    // Create a testnet wallet
    const createWallet = new CreateWallet()
    const initialWalletInfo = await createWallet.createWallet(
      filename,
      'testnet'
    )
    // console.log(`initialWalletInfo: ${util.inspect(initialWalletInfo)}`)

    // Record the initial nextAddress property. This is going to be 1 for a new wallet.
    const firstAddressIndex = initialWalletInfo.nextAddress

    // Generate a new address
    await getKey.getPair(filename)

    // Delete the cached copy of the wallet. This allows testing of list-wallets.
    delete require.cache[require.resolve('../../wallets/test123')]

    // Read in the wallet file.
    const walletInfo = require('../../wallets/test123')
    // console.log(`walletInfo: ${util.inspect(walletInfo)}`)

    assert.equal(
      walletInfo.nextAddress,
      firstAddressIndex + 1,
      'nextAddress property should increment'
    )
  })
})

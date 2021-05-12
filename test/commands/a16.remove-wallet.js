/*
  Tests for the remove-wallet command.
*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')

const CreateWallet = require('../../src/commands/create-wallet')
const RemoveWallet = require('../../src/commands/remove-wallet')
// const config = require('../../config')

const { bitboxMock } = require('../mocks/bitbox')
const fs = require('fs')
// const mock = require('mock-fs')

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
describe('remove-wallet', () => {
  let BITBOX
  let removeWallet
  let sandbox

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    removeWallet = new RemoveWallet()

    // By default, use the mocking library instead of live calls.
    BITBOX = bitboxMock
    removeWallet.BITBOX = BITBOX
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
    sandbox.stub(removeWallet, 'parse').returns({ flags: flags })

    const newWallet = new CreateWallet()
    await newWallet.createWallet(filename, 'testnet')
    const result = await removeWallet.run()
    assert.equal(result.code, 0)
    assert.equal(result.stdout, '')
    assert.equal(result.stderr, null)
  })
  it('run(): should run the function in mainnet', async () => {
    const flags = {
      name: 'test123'
    }
    // Mock methods that will be tested elsewhere.
    sandbox.stub(removeWallet, 'parse').returns({ flags: flags })

    const newWallet = new CreateWallet()
    await newWallet.createWallet(filename, false)
    const result = await removeWallet.run()
    assert.equal(result.code, 0)
    assert.equal(result.stdout, '')
    assert.equal(result.stderr, null)
  })

  it('should display error on non-existing wallet', async () => {
    const flags = {
      name: 'test121',
      testnet: true
    }
    // Mock methods that will be tested elsewhere.
    sandbox.stub(removeWallet, 'parse').returns({ flags: flags })

    const newWallet = new CreateWallet()
    await newWallet.createWallet(filename, 'testnet')
    try {
      await removeWallet.run()
    } catch (err) {
      assert.include(
        err.message,
        'rm: no such file or directory',
        'Expected error message.'
      )
    }
  })

  it('validateFlags() should throw error if name is not supplied.', () => {
    try {
      removeWallet.validateFlags({})
    } catch (err) {
      assert.include(
        err.message,
        'You must specify a wallet with the -n flag',
        'Expected error message.'
      )
    }
  })

  it('should throw error on invalid flags (missing name)', async () => {
    // Mock methods that will be tested elsewhere.
    sandbox.stub(removeWallet, 'parse').returns({})

    const newWallet = new CreateWallet()
    await newWallet.createWallet(filename, 'testnet')
    try {
      await removeWallet.run()
    } catch (err) {
      assert.include(
        err.message,
        "Cannot read property 'name' of undefined",
        'Expected error message.'
      )
    }
  })

  it('should remove wallet file', async () => {
    const newWallet = new CreateWallet()
    await newWallet.createWallet(filename, 'testnet')
    await removeWallet.removeWallet(filename)
    assert.equal(fs.existsSync(filename), false)
  })

  it('should throw error on shell command execution error', async () => {
    try {
      await removeWallet.removeWallet(undefined)
    } catch (err) {
      assert.include(
        err.message,
        'rm: no paths given',
        'Expected error message.'
      )
    }
  })

  it('should throw error on non-existing file', async () => {
    try {
      await removeWallet.removeWallet('non-existing')
    } catch (err) {
      assert.include(
        err.message,
        'rm: no such file or directory: non-existing',
        'Expected error message.'
      )
    }
  })
})

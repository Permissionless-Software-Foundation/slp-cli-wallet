/*
  TODO:
*/

'use strict'

const assert = require('chai').assert

// const CreateWallet = require('../../src/commands/create-wallet')
const SignMessage = require('../../src/commands/sign-message')
const config = require('../../config')

const { bitboxMock } = require('../mocks/bitbox')
const bchjs = new config.BCHLIB({ restURL: config.MAINNET_REST })

// Inspect utility used for debugging.
const util = require('util')
util.inspect.defaultOptions = {
  showHidden: true,
  colors: true,
  depth: 1
}

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = 'unit'

describe('sign-message', () => {
  let signMessage

  beforeEach(() => {
    signMessage = new SignMessage()

    // By default, use the mocking library instead of live calls.
    signMessage.bchjs = bitboxMock
  })

  // signMessage can be called directly by other programs, so this is tested separately.
  it('signMessage should throw error if name is not supplied.', async () => {
    try {
      await signMessage.sign(undefined)
    } catch (err) {
      assert.include(err.message, 'Could not open', 'Expected error message.')
    }
  })

  // This validation function is called when the program is executed from the command line.
  describe('#validateFlags', () => {
    it('should throw error if name is not supplied.', () => {
      try {
        signMessage.validateFlags({})
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet with the -n flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if index of address is not supplied.', () => {
      try {
        const flags = {
          name: 'testwallet'
        }

        signMessage.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a address index with the -i flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if sign is not supplied.', () => {
      try {
        const flags = {
          name: 'testwallet',
          sendAddrIndex: 1
        }
        signMessage.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a sign with the -s flag.',
          'Expected error message.'
        )
      }
    })

    it('should return true if all flags are supplied.', () => {
      const flags = {
        name: 'testwallet',
        sendAddrIndex: 1,
        message: 'abcd'
      }

      const result = signMessage.validateFlags(flags)

      assert.equal(result, true)
    })
  })

  it('should throw error if wallet file, index of address and message not found.', async () => {
    try {
      await signMessage.sign('doesnotexist')
    } catch (err) {
      assert.include(err.message, 'Could not open', 'Expected error message.')
    }
  })

  it('should return true if signature can be verified.', async () => {
    const pubKeyAddrr = 'bitcoincash:qpdgdyadcygcfc2utks3rv2wwfzw394dygdrw0j53s'
    const signature =
      'H6PDQ0BXrFzSJwkhT/pk2LcOtvTqNv8N3Sx3oZl4+d/PD+OzIicaZ54K9j8vjxjG19GGFMcT0TeENT+4D+VpmvA='
    const message = 'my_first_signature'

    const result = bchjs.BitcoinCash.verifyMessage(
      pubKeyAddrr,
      signature,
      message
    )
    assert.equal(result, true)
  })
})

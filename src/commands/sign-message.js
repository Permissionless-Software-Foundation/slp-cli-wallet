/*
  Cryptographically sign a message with a specific address of the wallet.
*/

'use strict'

// const qrcode = require('qrcode-terminal')

const AppUtils = require('../util')
const appUtils = new AppUtils()

const config = require('../../config')

// Mainnet by default.
const BITBOX = new config.BCHLIB({ restURL: config.MAINNET_REST })

// Used for debugging and iterrogating JS objects.
const util = require('util')
util.inspect.defaultOptions = { depth: 2 }

const { Command, flags } = require('@oclif/command')

// let _this

class SignMessage extends Command {
  constructor (argv, config) {
    super(argv, config)

    this.BITBOX = BITBOX
  }

  async run () {
    try {
      const { flags } = this.parse(SignMessage)

      // Validate input flags
      this.validateFlags(flags)

      // Determine if this is a testnet wallet or a mainnet wallet.
      if (flags.testnet) {
        this.BITBOX = new config.BCHLIB({ restURL: config.TESTNET_REST })
      }

      // Generate an absolute filename from the name.
      const filename = `${__dirname}/../../wallets/${flags.name}.json`

      const signM = await this.sign(
        filename,
        flags.sendAddrIndex,
        flags.signTheMessage
      )
      // console.log(signM)
      const mySignature = signM.sign

      // Display the signature to the user.
      this.log(`${mySignature}`)
    } catch (err) {
      if (err.message) console.log(err.message)
      else console.log('Error in SignMessage.run: ', err)
    }
  }

  async sign (filename, sendAddrIndex, signTheMessage) {
    try {
      // const filename = `${__dirname}/../../wallets/${name}.json`
      const walletInfo = appUtils.openWallet(filename)
      // console.log(`walletInfo: ${JSON.stringify(walletInfo, null, 2)}`)

      // root seed buffer
      const rootSeed = await this.BITBOX.Mnemonic.toSeed(walletInfo.mnemonic)

      // master HDNode
      let masterHDNode
      if (walletInfo.network === 'testnet') {
        masterHDNode = this.BITBOX.HDNode.fromSeed(rootSeed, 'testnet')
      } else masterHDNode = this.BITBOX.HDNode.fromSeed(rootSeed)

      // HDNode of BIP44 account
      const account = this.BITBOX.HDNode.derivePath(
        masterHDNode,
        `m/44'/${walletInfo.derivation}'/0'`
      )
      // derive an external change address HDNode
      const change = this.BITBOX.HDNode.derivePath(
        account,
        `0/${sendAddrIndex}`
      )

      // get the cash address
      // const pubKeyAddr = this.BITBOX.HDNode.toCashAddress(change)
      // get the private key
      const privKeyWIF = this.BITBOX.HDNode.toWIF(change)
      // sign and verify
      const signature = BITBOX.BitcoinCash.signMessageWithPrivKey(
        privKeyWIF,
        signTheMessage
      )

      return {
        sign: signature
      }
    } catch (err) {
      console.log('Error in sign().')
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if wallet is not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet with the -n flag.')
    }

    const sendAddrIndex = flags.sendAddrIndex
    if (isNaN(Number(sendAddrIndex))) {
      throw new Error('You must specify a address index with the -i flag.')
    }

    const signTheMessage = flags.signTheMessage
    if (!signTheMessage || signTheMessage === '') {
      throw new Error('You must specify a sign with the -s flag.')
    }

    return true
  }
}

SignMessage.description = 'Sign message'

SignMessage.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  sendAddrIndex: flags.string({ char: 'i', description: 'Address index' }),
  signTheMessage: flags.string({ char: 's', description: 'Sign message' })
}

module.exports = SignMessage

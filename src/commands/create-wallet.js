/*
  Creates a new HD wallet. Save the 12-word Mnemonic private key to a .json file.
  https://developer.bitcoin.com/mastering-bitcoin-cash/3-keys-addresses-wallets/#mnemonic-code-words

*/

'use strict'

const AppUtils = require('../util')
const appUtils = new AppUtils()

const config = require('../../config')

// Mainnet by default
const BITBOX = new config.BCHLIB({
  restURL: config.MAINNET_REST,
  apiToken: config.JWT
})

const { Command, flags } = require('@oclif/command')

const fs = require('fs')

// let _this

class CreateWallet extends Command {
  constructor (argv, config) {
    super(argv, config)
    // _this = this

    this.BITBOX = BITBOX
  }

  async run () {
    try {
      const { flags } = this.parse(CreateWallet)

      // Validate input flags
      this.validateFlags(flags)

      // Determine if this is a testnet wallet or a mainnet wallet.
      if (flags.testnet) { this.BITBOX = new config.BCHLIB({ restURL: config.TESTNET_REST }) }

      const filename = `${__dirname}/../../wallets/${flags.name}.json`

      if (!flags.description) flags.description = ''

      return this.createWallet(filename, flags.testnet, flags.description)
    } catch (err) {
      if (err.message) console.log(err.message)
      else console.log('Error in create-wallet.js/run(): ', err)
    }
  }

  // testnet is a boolean.
  async createWallet (filename, testnet, desc) {
    try {
      if (!filename || filename === '') throw new Error('filename required.')
      if (fs.existsSync(filename)) throw new Error('filename already exist')

      // console.log(filename)
      // Initialize the wallet data object that will be saved to a file.
      const walletData = {}
      if (testnet) walletData.network = 'testnet'
      else walletData.network = 'mainnet'

      // create 128 bit (12 word) BIP39 mnemonic
      const mnemonic = this.BITBOX.Mnemonic.generate(
        128,
        this.BITBOX.Mnemonic.wordLists().english
      )
      walletData.mnemonic = mnemonic

      // root seed buffer
      let rootSeed
      if (config.RESTAPI === 'bitcoin.com') { rootSeed = this.BITBOX.Mnemonic.toSeed(mnemonic) } else rootSeed = await this.BITBOX.Mnemonic.toSeed(mnemonic)

      // master HDNode
      let masterHDNode = this.BITBOX.HDNode.fromSeed(rootSeed)
      if (testnet) { masterHDNode = this.BITBOX.HDNode.fromSeed(rootSeed, 'testnet') }

      // Use the 245 derivation path by default.
      walletData.derivation = 245

      // HDNode of BIP44 account
      const account = this.BITBOX.HDNode.derivePath(
        masterHDNode,
        `m/44'/${walletData.derivation}'/0'`
      )

      // derive the first external change address HDNode which is going to spend utxo
      const change = this.BITBOX.HDNode.derivePath(account, '0/0')

      // get the cash address
      walletData.rootAddress = this.BITBOX.HDNode.toCashAddress(change)

      // Initialize other data.
      walletData.balance = 0
      walletData.nextAddress = 1
      walletData.hasBalance = []
      walletData.addresses = []
      walletData.description = desc

      // Write out the basic information into a json file for other apps to use.
      // const filename = `${__dirname}/../../wallets/${name}.json`
      await appUtils.saveWallet(filename, walletData)

      return walletData
    } catch (err) {
      if (err.code !== 'EEXIT') console.log('Error in createWallet().')
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') { throw new Error('You must specify a wallet with the -n flag.') }

    return true
  }
}

CreateWallet.description = 'Generate a new HD Wallet.'

CreateWallet.flags = {
  testnet: flags.boolean({ char: 't', description: 'Create a testnet wallet' }),
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  description: flags.string({ char: 'd', description: 'Description of the wallet' })
}

module.exports = CreateWallet

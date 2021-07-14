/*
  oclif command to list NFT tokens to an address.
*/

'use strict'

const UpdateBalances = require('./update-balances')
const config = require('../../config')

const AppUtils = require('../util')
const appUtils = new AppUtils()

const bchjs = new config.BCHLIB({
  restURL: config.MAINNET_REST,
  apiToken: config.JWT
})

const nftjs = new config.NFTLIB({ bchjs })

// Used for debugging and error reporting.
const util = require('util')
util.inspect.defaultOptions = { depth: 2 }

const { Command, flags } = require('@oclif/command')
const { cli } = require('cli-ux')

class NftListAddr extends Command {
  constructor (argv, config) {
    super(argv, config)

    this.bchjs = bchjs
    this.nftjs = nftjs
    this.appUtils = appUtils
  }

  hasBalance (info, address) {
    const bchAddress = this.bchjs.SLP.Address.toCashAddress(address)
    const has = info.filter(i => i.cashAddress === bchAddress)[0]
    return has ? has.balance : 0.0
  }

  async run () {
    try {
      const { flags } = this.parse(NftListAddr)

      // Ensure flags meet qualifiying critieria.
      this.validateFlags(flags)

      const name = flags.name // Name of the wallet.

      cli.action.start('Get address info')
      // Open the wallet data file.
      const filename = `${__dirname.toString()}/../../wallets/${name}.json`
      let walletInfo = appUtils.openWallet(filename)
      const updateBalances = new UpdateBalances()
      updateBalances.bchjs = this.bchjs
      walletInfo = await updateBalances.updateBalances(flags)
      cli.action.stop()

      const columns = {
        index: {
          minWidth: '4',
          get: row => row[0]
        },
        address: {
          name: 'SLP Address',
          get: row => this.bchjs.SLP.Address.toSLPAddress(row[1])
        },
        tokens: {
          name: 'Have SLP tokens?',
          get: row => walletInfo.SLPUtxos.filter(utxo => utxo.address === row[1])[0] ? 'yes' : 'no'
        },
        bch: {
          name: 'BCH Balance',
          get: row => this.hasBalance(walletInfo.hasBalance, row[1])
        }
      }
      cli.table(walletInfo.addresses, columns, {})
    } catch (err) {
      console.log('Error in nft-list-addr.js/run(): ', err)
    }
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // console.log(`flags: ${JSON.stringify(flags, null, 2)}`)

    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet with the -n flag.')
    }

    return true
  }
}

NftListAddr.description = `List addresses inside the wallet
...
Will return a list of available addresses
`

NftListAddr.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' })
}

module.exports = NftListAddr

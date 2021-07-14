/*
  oclif command to list NFT tokens to an address.
*/

'use strict'

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

class NftCreateGroup extends Command {
  constructor (argv, config) {
    super(argv, config)

    this.bchjs = bchjs
    this.nftjs = nftjs
    this.appUtils = appUtils
  }

  async run () {
    try {
      const { flags } = this.parse(NftCreateGroup)

      // Ensure flags meet qualifiying critieria.
      this.validateFlags(flags)

      const name = flags.name
      const index = flags.index
      const feeIndex = flags.funder

      const groupConfig = {
        name: flags.group || 'NFT CLI Wallet Group',
        ticker: flags.ticker || 'CLIG',
        amount: flags.amount || 100,
        url: flags.url || undefined,
        hash: flags.hash || undefined
      }

      // Open the wallet data file.
      const filename = `${__dirname.toString()}/../../wallets/${name}.json`
      const walletInfo = appUtils.openWallet(filename)

      if (index < 0 || index > walletInfo.nextAddress) {
        throw new Error(`You must specify an index between 0 and ${walletInfo.nextAddress - 1}.`)
      }

      if (feeIndex && (feeIndex < 0 || feeIndex > walletInfo.nextAddress)) {
        throw new Error(`You must specify a funder index between 0 and ${walletInfo.nextAddress - 1}.`)
      }

      cli.action.start(`Create NFT group '${groupConfig.ticker}'`)
      const nftInfo = await appUtils.nftInfo(walletInfo, index)
      if (feeIndex) {
        const feeInfo = await appUtils.nftInfo(walletInfo, feeIndex)
        groupConfig.funder = { address: feeInfo.cashAddress, wif: feeInfo.WIF }
      }
      const groupTxId = await nftjs.NFT.createNftGroup(nftInfo, groupConfig)
      cli.action.stop()

      console.log(`TxId: ${groupTxId}`)
    } catch (err) {
      console.log('Error in nft-create-group.js/run(): ', err)
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

    const index = flags.index
    if (isNaN(Number(index))) {
      throw new Error('You must specify an address index with the -i flag.')
    }

    return true
  }
}

NftCreateGroup.description = `Create NFT Group
...
Will create NFT group with specified name, ticker and amount
`

NftCreateGroup.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  index: flags.string({ char: 'i', description: 'Address index in the wallet' }),
  funder: flags.string({ char: 'f', description: 'Fee funder address index in the wallet' }),
  group: flags.string({ char: 'g', description: 'Name of the group' }),
  ticker: flags.string({ char: 't', description: 'Ticker of the group' }),
  amount: flags.string({ char: 'a', decription: 'Amount of tokens in the group' }),
  url: flags.string({ char: 'u', description: 'Document URL of the group' }),
  hash: flags.string({ char: 'h', description: 'Document hash of the group' })
}

module.exports = NftCreateGroup

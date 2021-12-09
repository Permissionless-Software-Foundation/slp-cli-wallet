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

class NftRemoveChild extends Command {
  constructor (argv, config) {
    super(argv, config)

    this.bchjs = bchjs
    this.nftjs = nftjs
    this.appUtils = appUtils
  }

  async run () {
    try {
      const { flags } = this.parse(NftRemoveChild)

      // Ensure flags meet qualifiying critieria.
      this.validateFlags(flags)

      const name = flags.name
      const index = flags.index
      const feeIndex = flags.funder

      const removeConfig = {
        remove: flags.tokenId
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

      cli.action.start(`Remove NFT child '${flags.tokenId}'`)
      const nftInfo = await appUtils.nftInfo(walletInfo, index)
      if (feeIndex) {
        const feeInfo = await appUtils.nftInfo(walletInfo, feeIndex)
        removeConfig.funder = { address: feeInfo.cashAddress, wif: feeInfo.WIF }
      }
      const burnTxId = await nftjs.NFT.removeNftChild(nftInfo, removeConfig)
      cli.action.stop()

      console.log(`TxId: ${burnTxId}`)
    } catch (err) {
      console.log('Error in nft-remove-child.js/run(): ', err)
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

    const tokenId = flags.tokenId
    if (!tokenId || tokenId === '') {
      throw new Error('You must specifcy the NFT child tokenId')
    }

    // check Group Id should be hexademical chracters.
    const re = /^([A-Fa-f0-9]{2}){32,32}$/
    if (typeof tokenId !== 'string' || !re.test(tokenId)) {
      throw new Error(
        'tokenId must be provided as a 64 character hex string.'
      )
    }

    return true
  }
}

NftRemoveChild.description = `Remove NFT child token
...
Will remove NFT child token (type = 65) with specified tokenId
`

NftRemoveChild.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  index: flags.string({ char: 'i', description: 'Address index in the wallet' }),
  funder: flags.string({ char: 'f', description: 'Fee funder address index in the wallet' }),
  tokenId: flags.string({ char: 't', description: 'NFT child tokenId' })
}

module.exports = NftRemoveChild

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

class NftListTokens extends Command {
  constructor (argv, config) {
    super(argv, config)

    this.bchjs = bchjs
    this.nftjs = nftjs
    this.appUtils = appUtils
  }

  async run () {
    try {
      const { flags } = this.parse(NftListTokens)

      // Ensure flags meet qualifiying critieria.
      this.validateFlags(flags)

      const name = flags.name // Name of the wallet.
      const index = flags.index

      // Open the wallet data file.
      const filename = `${__dirname.toString()}/../../wallets/${name}.json`
      const walletInfo = appUtils.openWallet(filename)

      if (index < 0 || index > walletInfo.nextAddress) {
        throw new Error(`You must specify an index between 0 and ${walletInfo.nextAddress - 1}.`)
      }

      const nftInfo = await appUtils.nftInfo(walletInfo, index)

      cli.action.start(`Get NFT ${flags.groups ? 'groups' : 'tokens'} list`)
      const tokens = flags.groups ? await nftjs.NFT.listAllGroups(nftInfo) : await nftjs.NFT.listTokens(nftInfo)
      cli.action.stop()
      console.log(JSON.stringify(tokens, null, 2))
    } catch (err) {
      console.log('Error in nft-list-tokens.js/run(): ', err)
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

NftListTokens.description = `List NFT tokens in a wallet address
...
Will return a JSON formated list of available NFT tokens
`

NftListTokens.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  index: flags.string({ char: 'i', description: 'Address index in the wallet' }),
  groups: flags.boolean({ char: 'g', description: 'List only NFT groups' })
}

module.exports = NftListTokens

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

class NftCreateChild extends Command {
  constructor (argv, config) {
    super(argv, config)

    this.bchjs = bchjs
    this.nftjs = nftjs
    this.appUtils = appUtils
  }

  async run () {
    try {
      const { flags } = this.parse(NftCreateChild)

      // Ensure flags meet qualifiying critieria.
      this.validateFlags(flags)

      const name = flags.name
      const index = flags.index
      const feeIndex = flags.funder

      const childConfig = {
        group: flags.groupId,
        name: flags.child || 'NFT CLI Wallet Token',
        ticker: flags.ticker || 'CLIC',
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

      if (flags.receiver) {
        const valid = await appUtils.validAddress(flags.receiver)
        if (!valid) {
          throw new Error(`Invalid receiver address: ${flags.receiver}`)
        }
        childConfig.receiver = flags.receiver
      }

      cli.action.start(`Create NFT child '${childConfig.ticker}'`)
      const nftInfo = await appUtils.nftInfo(walletInfo, index)
      if (feeIndex) {
        const feeInfo = await appUtils.nftInfo(walletInfo, feeIndex)
        childConfig.funder = { address: feeInfo.cashAddress, wif: feeInfo.WIF }
      }
      const childTxId = await nftjs.NFT.createNftChild(nftInfo, childConfig)
      cli.action.stop()

      console.log(`TxId: ${childTxId}`)
    } catch (err) {
      console.log('Error in nft-create-child.js/run(): ', err)
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

    const groupId = flags.groupId
    if (!groupId || groupId === '') {
      throw new Error('You must specifcy the NFT group ID')
    }

    // check Group Id should be hexademical chracters.
    const re = /^([A-Fa-f0-9]{2}){32,32}$/
    if (typeof groupId !== 'string' || !re.test(groupId)) {
      throw new Error(
        'groupId must be provided as a 64 character hex string.'
      )
    }

    return true
  }
}

NftCreateChild.description = `Create NFT child
...
Will create NFT child token in a specified NFT group (groupId parameter)
`

NftCreateChild.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  index: flags.string({ char: 'i', description: 'Address index in the wallet' }),
  funder: flags.string({ char: 'f', description: 'Fee funder address index in the wallet' }),
  groupId: flags.string({ char: 'g', description: 'NFT Group ID' }),
  child: flags.string({ char: 'c', description: 'Name of the child' }),
  ticker: flags.string({ char: 't', description: 'Ticker of the child' }),
  url: flags.string({ char: 'u', description: 'Document URL of the group' }),
  hash: flags.string({ char: 'h', description: 'Document hash of the group' }),
  receiver: flags.string({ char: 'r', description: 'Address to send the token' })
}

module.exports = NftCreateChild

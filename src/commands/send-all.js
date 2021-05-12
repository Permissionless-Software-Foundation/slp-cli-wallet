/*
  oclif command to send all BCH in a wallet to a single address.

  This can be used to consolidate UTXOs or transfer all BCH to
  another wallet.

  This command has a negative effect on the users privacy by
  linking all addresses and UTXOs. This effectively deanonymize users.

  The order of operations matter. The code below complete the following steps
  *in order*:
  -Add each UTXO as an input to the TX
  -Calculate the TX fee
  -Add the output
  -Loop through each input and sign
  -Build the transaction
  -Broadcast the transaction

  Note: This will not send any tokens. If you run this before running
  send-all-tokens, the wallet will not have enough BCH to send the tokens.

  TO-DO: once sending tokens is implemented, this command should send all
  tokens first, then send BCH.
*/

'use strict'

const UpdateBalances = require('./update-balances')
const config = require('../../config')

const AppUtils = require('../util')
const appUtils = new AppUtils()

// Mainnet by default
const bchjs = new config.BCHLIB({
  restURL: config.MAINNET_REST,
  apiToken: config.JWT
})

// Used for debugging and error reporting.
const util = require('util')
util.inspect.defaultOptions = { depth: 2 }

const { Command, flags } = require('@oclif/command')

class SendAll extends Command {
  constructor (argv, config) {
    super(argv, config)
    // _this = this

    this.bchjs = bchjs
    this.appUtils = appUtils
  }

  async run () {
    try {
      const { flags } = this.parse(SendAll)

      // Ensure flags meet qualifiying critieria.
      this.validateFlags(flags)

      const name = flags.name // Name of the wallet.
      const sendToAddr = flags.sendAddr // The address to send to.

      // Open the wallet data file.
      const filename = `${__dirname.toString()}/../../wallets/${
        flags.name
      }.json`
      let walletInfo = appUtils.openWallet(filename)
      walletInfo.name = name

      // Determine if this is a testnet wallet or a mainnet wallet.
      if (walletInfo.network === 'testnet') {
        this.bchjs = new config.BCHLIB({ restURL: config.TESTNET_REST })
        this.appUtils = new AppUtils({ bchjs: this.bchjs })
      }

      // console.log(`walletInfo: ${JSON.stringify(walletInfo, null, 2)}`)

      // Update balances before sending.
      const updateBalances = new UpdateBalances(undefined, {
        bchjs: this.bchjs
      })
      walletInfo = await updateBalances.updateBalances(flags)

      // Get all UTXOs controlled by this wallet.
      let utxos = walletInfo.BCHUtxos

      // Burn tokens if the -i flag is used.
      if (flags.ignoreTokens) {
        // console.log(`walletInfo: ${JSON.stringify(walletInfo, null, 2)}`)
        utxos = walletInfo.BCHUtxos.concat(walletInfo.SLPUtxos)
      }

      // console.log(`utxos: ${util.inspect(utxos)}`)

      // Send the BCH, transfer change to the new address
      const hex = await this.sendAllBCH(utxos, sendToAddr, walletInfo)
      // console.log('hex: ', hex)

      const txid = await this.appUtils.broadcastTx(hex)

      console.log(`TXID: ${txid}`)

      // Display link to block explorer.
      console.log('View on block explorer:')
      if (walletInfo.network === 'testnet') {
        console.log(`https://explorer.bitcoin.com/tbch/tx/${txid}`)
      } else console.log(`https://explorer.bitcoin.com/bch/tx/${txid}`)
    } catch (err) {
      // if (err.message) console.log(err.message)
      // else console.log(`Error in .run: `, err)
      console.log('Error in send-all.js/run: ', err)
    }
  }

  // Sends all BCH in a wallet to a new address.
  async sendAllBCH (utxos, sendToAddr, walletInfo) {
    try {
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      if (!Array.isArray(utxos)) throw new Error('utxos must be an array.')

      if (utxos.length === 0) throw new Error('No utxos found.')

      // instance of transaction builder
      let transactionBuilder
      if (walletInfo.network === 'testnet') {
        transactionBuilder = new this.bchjs.TransactionBuilder('testnet')
      } else transactionBuilder = new this.bchjs.TransactionBuilder()

      let originalAmount = 0
      let numUtxos = 0

      // Calulate the original amount in the wallet and add all UTXOs to the
      // transaction builder.
      for (let i = 0; i < utxos.length; i++) {
        // Loop through each address.
        const addr = utxos[i]
        for (let j = 0; j < addr.utxos.length; j++) {
          // Loop through each UTXO in the address.
          const utxo = addr.utxos[j]
          // console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)

          originalAmount = originalAmount + utxo.value

          transactionBuilder.addInput(utxo.tx_hash, utxo.tx_pos)

          numUtxos++
        }
      }

      if (originalAmount < 1) {
        throw new Error('Original amount is zero. No BCH to send.')
      }

      // original amount of satoshis in vin
      // console.log(`originalAmount: ${originalAmount}`)

      // get byte count to calculate fee. paying 1 sat/byte
      const byteCount = this.bchjs.BitcoinCash.getByteCount(
        { P2PKH: numUtxos },
        { P2PKH: 1 }
      )
      const fee = Math.ceil(1.1 * byteCount)
      // console.log(`fee: ${byteCount}`)

      // amount to send to receiver. It's the original amount - 1 sat/byte for tx size
      const sendAmount = originalAmount - fee
      // console.log(`sendAmount: ${sendAmount}`)

      // add output w/ address and amount to send
      transactionBuilder.addOutput(
        this.bchjs.Address.toLegacyAddress(sendToAddr),
        sendAmount
      )

      let redeemScript
      let inputCnt = 0

      // Loop through each input and sign
      // Loop through each address.
      for (let i = 0; i < utxos.length; i++) {
        const addr = utxos[i]

        // Loop through each utxo within the address.
        for (let j = 0; j < addr.utxos.length; j++) {
          const utxo = addr.utxos[j]
          // console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)

          // Generate a keypair for the current address.
          const change = await this.appUtils.changeAddrFromMnemonic(
            walletInfo,
            utxo.hdIndex
          )
          const keyPair = this.bchjs.HDNode.toKeyPair(change)

          transactionBuilder.sign(
            inputCnt,
            keyPair,
            redeemScript,
            transactionBuilder.hashTypes.SIGHASH_ALL,
            utxo.value
          )

          inputCnt++
        }
      }

      // build tx
      const tx = transactionBuilder.build()

      // output rawhex
      const hex = tx.toHex()
      // console.log(`Transaction raw hex: ${hex}`)

      return hex
    } catch (err) {
      console.log('Error in sendAllBCH()')
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet with the -n flag.')
    }

    const sendAddr = flags.sendAddr
    if (!sendAddr || sendAddr === '') {
      throw new Error('You must specify a send-to address with the -a flag.')
    }

    return true
  }
}

SendAll.description = `Send all BCH in a wallet to another address. **Degrades Privacy**
Send all BCH in a wallet to another address.

This method has a negative impact on privacy by linking all addresses in a
wallet. If privacy of a concern, CoinJoin should be used.
This is a good article describing the privacy concerns:
https://bit.ly/2TnhdVc
`

SendAll.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  sendAddr: flags.string({ char: 'a', description: 'Cash address to send to' }),
  ignoreTokens: flags.boolean({
    char: 'i',
    description: 'Ignore and burn tokens'
  })
}

module.exports = SendAll

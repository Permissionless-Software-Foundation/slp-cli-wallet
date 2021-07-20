/*
  oclif command to send SLP tokens to an address.

  This command is optimized for privacy the same way the 'send' command is. See
  that command for details.

  Spends all token UTXOs for the same token and will send token change to the
  same address the BCH change.

  Basic workflow of sending an SLP token:
  - Inputs:
    - token Id, amount, input token UTXOs, input BCH payment UTXO, token output addr, token change addr, bch change addr
    - Note: All UTXOs for the same token should be spent. This will consolidate token UTXOs.
  - Validate inputs
  - Generate the OP_RETURN transaction
  - Generate the second OP_RETURN with the avax address
*/

'use strict'

const GetAddress = require('./get-address')
const UpdateBalances = require('./update-balances')
const SendTokens = require('./send-tokens')
const Send = require('./send')
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

class SlpAvaxBridge extends Command {
  constructor (argv, config) {
    super(argv, config)
    // _this = this

    this.bchjs = bchjs
    this.appUtils = appUtils // Allows for easy mocking for unit tests.
    this.sendTokens = new SendTokens()
    this.updateBalances = new UpdateBalances()
    this.appUtils = appUtils
    this.send = new Send()
  }

  async run () {
    try {
      const { flags } = this.parse(SlpAvaxBridge)

      // Ensure flags meet qualifiying critieria.
      this.validateFlags(flags)

      const name = flags.name // Name of the wallet.
      const qty = flags.qty // token amount to send.
      const sendAddr = flags.sendAddr // The bridge address to send to.
      const avaxAddr = flags.avaxAddr // the avax address
      const tokenId = flags.tokenId // SLP token ID.

      // Open the wallet data file.
      const filename = `${__dirname}/../../wallets/${name}.json`
      let walletInfo = this.appUtils.openWallet(filename)
      walletInfo.name = name

      // Update balances before sending.
      this.updateBalances.bchjs = this.bchjs
      walletInfo = await this.updateBalances.updateBalances(flags)

      // Get a list of token UTXOs from the wallet for this token.
      const tokenUtxos = this.sendTokens.getTokenUtxos(tokenId, walletInfo)

      // Instatiate the Send class so this function can reuse its selectUTXO() code.

      const utxo = await this.send.selectUTXO(0.000032, walletInfo.BCHUtxos)
      // 3200 satoshis for all the dust required (546 * 3 rounded up plus flat 1500 fee)

      // Exit if there is no UTXO big enough to fulfill the transaction.
      if (!utxo.amount) {
        throw new Error('Could not find a UTXO big enough for this transaction. More BCH needed.')
      }

      // Generate a new address, for sending change to.
      const getAddress = new GetAddress()
      getAddress.bchjs = this.bchjs
      const changeAddress = await getAddress.getAddress(filename)

      // Send the token, transfer change to the new address
      const hex = await this.sendTokensToBridge(
        utxo,
        qty,
        changeAddress,
        sendAddr,
        walletInfo,
        tokenUtxos,
        avaxAddr
      )
      console.log(`hex: ${hex}`)

      const txid = await this.appUtils.broadcastTx(hex)
      appUtils.displayTxid(txid, walletInfo.network)
      return 0
    } catch (err) {
      console.log('Error in send-tokens.js/run(): ', err)
      return 1
    }
  }

  // Generates the SLP transaction in hex format, ready to broadcast to network.
  async sendTokensToBridge (
    utxo,
    amount,
    changeAddress,
    bridgeAddress,
    walletInfo,
    tokenUtxos,
    avaxAddress
  ) {
    try {
      // instance of transaction builder
      const transactionBuilder = new this.bchjs.TransactionBuilder()

      const originalAmount = utxo.value
      const vout = utxo.tx_pos
      const txid = utxo.tx_hash

      const message = `avax ${avaxAddress.trim()}`

      // add input utxo to pay for transaction.
      transactionBuilder.addInput(txid, vout)

      // add each token UTXO as an input.
      for (let i = 0; i < tokenUtxos.length; i++) {
        transactionBuilder.addInput(tokenUtxos[i].txid, tokenUtxos[i].vout)
      }

      const txFee = 500
      const dustAmount = 546

      // amount to send back to the sending address. It's the original amount - 1 sat/byte for tx size
      const remainder = originalAmount - txFee - (dustAmount * 3)
      if (remainder < 546) {
        throw new Error('Selected UTXO does not have enough satoshis')
      }

      const {
        script: slpData,
        outputs
      } = this.bchjs.SLP.TokenType1.generateSendOpReturn(tokenUtxos, amount)

      // console.log(`slpData`)

      // Add OP_RETURN as first output.
      transactionBuilder.addOutput(slpData, 0)

      // Send dust transaction representing tokens being sent.
      transactionBuilder.addOutput(
        this.bchjs.SLP.Address.toLegacyAddress(bridgeAddress),
        546
      )

      // Return any token change back to the sender.
      if (outputs > 1) {
        transactionBuilder.addOutput(
          this.bchjs.SLP.Address.toLegacyAddress(changeAddress),
          546
        )
      }

      // send the change back to the wallet.
      transactionBuilder.addOutput(
        this.bchjs.SLP.Address.toLegacyAddress(changeAddress),
        remainder
      )

      // Add the last output with the message OP_RETURN
      // Add the OP_RETURN to the transaction.
      const script = [
        this.bchjs.Script.opcodes.OP_RETURN,
        Buffer.from('6d02', 'hex'), // Makes message comply with the memo.cash protocol.
        Buffer.from(message)
      ]
      // Compile the script array into a bitcoin-compliant hex encoded string.
      const data = this.bchjs.Script.encode(script)

      // Add the OP_RETURN output.
      transactionBuilder.addOutput(data, 0)
      transactionBuilder.addOutput(
        bchjs.SLP.Address.toLegacyAddress(changeAddress),
        dustAmount
      )

      // Generate a keypair from the change address.
      console.log(utxo.hdIndex)
      const change = await appUtils.changeAddrFromMnemonic(
        walletInfo,
        utxo.hdIndex
      )
      const keyPair = this.bchjs.HDNode.toKeyPair(change)

      // Sign the transaction with the private key for the UTXO paying the fees
      let redeemScript
      transactionBuilder.sign(
        0,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        originalAmount
      )

      // Sign each token UTXO being consumed
      for (let i = 0; i < tokenUtxos.length; i++) {
        const thisUtxo = tokenUtxos[i]
        console.log(thisUtxo.hdIndex)
        // Generate a keypair to sign the SLP UTXO.
        const slpChangeAddr = await appUtils.changeAddrFromMnemonic(
          walletInfo,
          thisUtxo.hdIndex
        )

        const slpKeyPair = this.bchjs.HDNode.toKeyPair(slpChangeAddr)

        transactionBuilder.sign(
          1 + i,
          slpKeyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          thisUtxo.value
        )
      }

      // build tx
      const tx = transactionBuilder.build()

      // output rawhex
      const hex = tx.toHex()

      return hex
    } catch (err) {
      console.log('Error in sendTokensToBridge() ', err)
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

    const qty = flags.qty
    if (isNaN(Number(qty))) {
      throw new Error('You must specify a quantity of tokens with the -q flag.')
    }

    const sendAddr = flags.sendAddr
    if (typeof sendAddr !== 'string' || sendAddr.trim() === '') {
      throw new Error('You must specify the bridge address with the -a flag.')
    }

    const avaxAddr = flags.avaxAddr
    if (typeof avaxAddr !== 'string' || avaxAddr === '') {
      throw new Error('You must specify a send-to address with the -x flag.')
    }

    // check Token Id should be hexademical chracters.
    const tokenId = flags.tokenId
    const re = /^([A-Fa-f0-9]{2}){32,32}$/
    if (typeof tokenId !== 'string' || !re.test(tokenId)) {
      throw new Error(
        'TokenIdHex must be provided as a 64 character hex string.'
      )
    }

    return true
  }
}

SlpAvaxBridge.description = 'Send SLP tokens.'

SlpAvaxBridge.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  tokenId: flags.string({
    char: 't',
    description: 'Token ID',
    default: 'c43eb59134473addee345df4172f4432bd09a8f087ba683462f0d66f8d221213'
  }),
  sendAddr: flags.string({
    char: 'a',
    description: 'Cash or SimpleLedger bridge address',
    default: 'bitcoincash:qrmjjjhz0a7dhp46ymw36l9zd0wcfryahq3s4989yj'
  }),
  avaxAddr: flags.string({
    char: 'x',
    description: 'Avalanche address to send tokens to from the bridge'
  }),
  qty: flags.string({ char: 'q', decription: 'Quantity of tokens to send' })
}

module.exports = SlpAvaxBridge

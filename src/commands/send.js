/*
  oclif command to send BCH to an address.

  The spending of UTXOs is optimized for privacy. The UTXO selected is equal to
  or bigger than the amount specified, but as close to it as possible. Change is
  always sent to a new address.

  This method of selecting UTXOs can leave a lot of dust UTXOs lying around in
  the wallet. It is assumed the user will consolidate the dust UTXOs periodically
  with an online service like Consolidating CoinJoin or CashShuffle, as
  described here:
  https://gist.github.com/christroutner/8d54597da652fe2affa5a7230664bc45
*/

'use strict'

const GetAddress = require('./get-address')
const UpdateBalances = require('./update-balances')
const config = require('../../config')

const AppUtils = require('../util')
const appUtils = new AppUtils()

// Mainnet by default
const bchjs = new config.BCHLIB({
  restURL: config.MAINNET_REST,
  apiToken: config.JWT
})

const { Command, flags } = require('@oclif/command')

class Send extends Command {
  constructor (argv, config) {
    super(argv, config)
    // _this = this

    this.bchjs = bchjs
    this.appUtils = appUtils
  }

  async run () {
    try {
      const { flags } = this.parse(Send)

      // Ensure flags meet qualifiying critieria.
      this.validateFlags(flags)

      const name = flags.name // Name of the wallet.
      const bch = flags.bch // Amount to send in BCH.
      const sendToAddr = flags.sendAddr // The address to send to.

      // Open the wallet data file.
      const filename = `${__dirname.toString()}/../../wallets/${name}.json`
      let walletInfo = this.appUtils.openWallet(filename)
      walletInfo.name = name

      // Determine if this is a testnet wallet or a mainnet wallet.
      if (walletInfo.network === 'testnet') {
        this.bchjs = new config.BCHLIB({ restURL: config.TESTNET_REST })
        this.appUtils = new AppUtils({ bchjs: this.bchjs })
      }

      // Update balances before sending.
      const updateBalances = new UpdateBalances(undefined, {
        bchjs: this.bchjs
      })
      updateBalances.bchjs = this.bchjs
      walletInfo = await updateBalances.updateBalances(flags)

      // Get info on UTXOs controlled by this wallet.
      // const utxos = await this.appUtils.getUTXOs(walletInfo)
      const utxos = walletInfo.BCHUtxos
      // console.log(`send utxos: ${JSON.stringify(utxos, null, 2)}`)

      // Select optimal UTXO
      const utxo = await this.selectUTXO(bch, utxos)
      // console.log(`selected utxo: ${util.inspect(utxo)}`)

      // Exit if there is no UTXO big enough to fulfill the transaction.
      if (!utxo.amount) {
        this.log('Could not find a UTXO big enough for this transaction.')
        return
      }

      // Generate a new address, for sending change to.
      const getAddress = new GetAddress()
      getAddress.bchjs = this.bchjs
      const changeAddress = await getAddress.getAddress(filename)
      // console.log(`changeAddress: ${changeAddress}`)

      // Send the BCH, transfer change to the new address
      const hex = await this.sendBCH(
        utxo,
        bch,
        changeAddress,
        sendToAddr,
        walletInfo
      )
      // console.log(`hex: ${hex}`)

      const txid = await this.appUtils.broadcastTx(hex)

      this.appUtils.displayTxid(txid, walletInfo.network)
    } catch (err) {
      // if (err.message) console.log(err.message)
      // else console.log(`Error in .run: `, err)
      console.log('Error in send.js/run(): ', err)
    }
  }

  // Sends BCH to
  async sendBCH (utxo, bch, changeAddress, sendToAddr, walletInfo) {
    try {
      // console.log(`utxo: ${util.inspect(utxo)}`)

      sendToAddr = this.bchjs.SLP.Address.toCashAddress(sendToAddr)

      // instance of transaction builder
      let transactionBuilder
      if (walletInfo.network === 'testnet') {
        transactionBuilder = new this.bchjs.TransactionBuilder('testnet')
      } else transactionBuilder = new this.bchjs.TransactionBuilder()

      const satoshisToSend = Math.floor(bch * 100000000)
      // console.log(`Amount to send in satoshis: ${satoshisToSend}`)
      const originalAmount = utxo.satoshis

      const vout = utxo.vout
      const txid = utxo.txid

      // add input with txid and index of vout
      transactionBuilder.addInput(txid, vout)

      // get byte count to calculate fee. paying 1 sat/byte
      const byteCount = this.bchjs.BitcoinCash.getByteCount(
        { P2PKH: 1 },
        { P2PKH: 2 }
      )
      // console.log(`byteCount: ${byteCount}`)
      const satoshisPerByte = 1.1
      const txFee = Math.floor(satoshisPerByte * byteCount)
      // console.log(`txFee: ${txFee} satoshis\n`)

      // amount to send back to the sending address. It's the original amount - 1 sat/byte for tx size
      const remainder = originalAmount - satoshisToSend - txFee
      // console.log(`remainder: ${remainder}`)

      // Debugging.
      /*
      console.log(
        `Sending original UTXO amount of ${originalAmount} satoshis from address ${changeAddress}`
      )
      console.log(
        `Sending ${satoshisToSend} satoshis to recieving address ${sendToAddr}`
      )
      console.log(
        `Sending remainder amount of ${remainder} satoshis to new address ${changeAddress}`
      )
      console.log(`Paying a transaction fee of ${txFee} satoshis`)
      */

      // add output w/ address and amount to send
      transactionBuilder.addOutput(
        this.bchjs.Address.toLegacyAddress(sendToAddr),
        satoshisToSend
      )
      transactionBuilder.addOutput(
        this.bchjs.Address.toLegacyAddress(changeAddress),
        remainder
      )

      // Generate a keypair from the change address.
      const change = await this.appUtils.changeAddrFromMnemonic(
        walletInfo,
        utxo.hdIndex
      )
      // console.log(`change: ${JSON.stringify(change, null, 2)}`)
      const keyPair = this.bchjs.HDNode.toKeyPair(change)

      // Sign the transaction with the HD node.
      let redeemScript
      transactionBuilder.sign(
        0,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        originalAmount
      )

      // build tx
      const tx = transactionBuilder.build()

      // output rawhex
      const hex = tx.toHex()
      // console.log(`Transaction raw hex: `)
      // console.log(hex)

      return hex
    } catch (err) {
      console.log('Error in sendBCH()')
      throw err
    }
  }

  // Selects a UTXO from an array of UTXOs based on this optimization criteria:
  // 1. The UTXO must be larger than or equal to the amount of BCH to send.
  // 2. The UTXO should be as close to the amount of BCH as possible.
  //    i.e. as small as possible
  // 3. Full node must validate that the UTXO has not been spent.
  // Returns a single UTXO object.
  async selectUTXO (bch, utxos) {
    let candidateUTXO = {}

    const bchSatoshis = bch * 100000000
    const total = bchSatoshis + 250 // Add 250 satoshis to cover TX fee.

    // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

    // Loop through each address.
    for (let i = 0; i < utxos.length; i++) {
      const thisAddr = utxos[i]

      // Loop through each UTXO for each address.
      for (let j = 0; j < thisAddr.utxos.length; j++) {
        const thisUTXO = thisAddr.utxos[j]

        // Ensure the Electrumx or Blockbook UTXO has a satoshis property.
        if (thisUTXO.value && !thisUTXO.satoshis) {
          thisUTXO.satoshis = Number(thisUTXO.value)
        }

        // The UTXO must be greater than or equal to the send amount.
        if (thisUTXO.satoshis >= total) {
          // console.log(`thisUtxo: ${JSON.stringify(thisUTXO, null, 2)}`)

          // Skip if the UTXO is invalid
          const isValid = await this.appUtils.isValidUtxo(thisUTXO)
          if (!isValid) {
            console.log(
              'warning: invalid UTXO found. You may need to wait for the indexer to catch up.'
            )
            // console.log(`thisUTXO: ${JSON.stringify(thisUTXO, null, 2)}`)
            continue
          }
          // console.log(`isValid: `, isValid)

          // Skip if change would less than the dust amount.
          if (thisUTXO.satoshis - bchSatoshis < 546) continue

          // Automatically assign if the candidateUTXO is an empty object.
          if (!candidateUTXO.satoshis) {
            candidateUTXO = thisUTXO
            continue

            // Replace the candidate if the current UTXO is closer to the send amount.
          } else if (candidateUTXO.satoshis > thisUTXO.satoshis) {
            candidateUTXO = thisUTXO
          }
        }
      }
    }

    if (candidateUTXO.satoshis) {
      candidateUTXO.amount = candidateUTXO.satoshis / 100000000
    }

    return candidateUTXO
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet with the -n flag.')
    }

    const bch = flags.bch
    if (isNaN(Number(bch))) {
      throw new Error('You must specify a quantity in BCH with the -b flag.')
    }

    const sendAddr = flags.sendAddr
    if (!sendAddr || sendAddr === '') {
      throw new Error('You must specify a send-to address with the -a flag.')
    }

    return true
  }
}

Send.description = 'Send an amount of BCH'

Send.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  bch: flags.string({ char: 'b', description: 'Quantity in BCH' }),
  sendAddr: flags.string({ char: 'a', description: 'Cash address to send to' })
}

module.exports = Send

/*
  Allows sweeping of a Compressed WIF private key. This function is required
  to retrieve funds from a 'paper wallet'.

  Workflow:
  - Generate address (public key) from private key.
  - Check balance of address.
  - Exit if balance === 0.
  - Combine all UTXOs into a transaction and send to user-provided address.

  TO-DO:
  - Add support for testnet.
  - Add support for multiple tokens. Right now if multiple tokens are saved to
  the same paper wallet, only one of them will be accurently sent. The rest will
  be burned.
*/

'use strict'

const { Command, flags } = require('@oclif/command')

const config = require('../../config')

// const SendTokens = require('./send-tokens')
// const sendTokens = new SendTokens()

// Mainnet by default.
const bchjs = new config.BCHLIB({
  restURL: config.MAINNET_REST,
  apiToken: config.JWT
})

// Used for debugging and error reporting.
const util = require('util')
util.inspect.defaultOptions = { depth: 2 }

class Sweep extends Command {
  constructor (argv, config) {
    super(argv, config)
    // _this = this

    this.bchjs = bchjs
  }

  async run () {
    try {
      const { flags } = this.parse(Sweep)

      // Ensure flags meet qualifiying critieria.
      this.validateFlags(flags)

      // Retrieve the balance of the private key. If empty, exit.
      const balance = await this.getBalance(flags)
      this.log(`balance: ${balance} satoshis`)

      // Get UTXOs and analyze them for SLP tokens
      const { bchUtxos, tokenUtxos } = await this.getTokens(flags)
      // console.log(`bchUtxos: ${JSON.stringify(bchUtxos, null, 2)}`)
      // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)

      // If there are tokens, summarize and display the data for each token found.
      if (tokenUtxos.length > 0) {
        // this.log(`token UTXOs: ${JSON.stringify(tokenUtxos, null, 2)}`)
        for (let i = 0; i < tokenUtxos.length; i++) {
          const token = tokenUtxos[i]
          console.log(
            `token: ${token.tokenTicker}, qty: ${token.tokenQty}, token ID: ${token.tokenId}`
          )
        }
      }

      // Exit if only the balance needed to be retrieved.
      if (flags.balanceOnly) return
      if (balance === 0) {
        console.log('No BCH balance found on paper wallet, aborting sweep.')
        return
      }

      console.log('Sweeping...')
      let hex

      if (tokenUtxos.length === 0) hex = await this.sweepBCH(flags)
      else hex = await this.sweepTokens(flags, bchUtxos, tokenUtxos)

      const txid = await this.bchjs.RawTransactions.sendRawTransaction([hex])
      console.log(`txid: ${txid}`)
    } catch (err) {
      if (err.message) console.log(err.message)
      else console.log('Error in sweep.js/run(): ', err)
    }
  }

  async sweepTokens (flags, bchUtxos, tokenUtxos) {
    try {
      // Input validation
      if (!Array.isArray(bchUtxos) || bchUtxos.length === 0) {
        throw new Error('bchUtxos need to be an array with one UTXO.')
      }
      if (!Array.isArray(tokenUtxos) || tokenUtxos.length === 0) {
        throw new Error('tokenUtxos need to be an array with one UTXO.')
      }

      if (flags.testnet) {
        this.bchjs = new config.BCHLIB({ restURL: config.TESTNET_REST })
      }

      // Ensure there is only one class of token in the wallet. Throw an error if
      // there is more than one.
      let tokenId = tokenUtxos[0].tokenId
      const otherTokens = tokenUtxos.filter(x => x.tokenId !== tokenId)

      let filteredTokenUtxos = tokenUtxos

      if (otherTokens.length > 0) {
        if (!flags.tokenId) {
          throw new Error(
            'Multiple token classes detected. Use the -i flag to choose a specific token ID.'
          )
        } else {
          // Sweep the tokens UTXOs with the user-provided token ID.
          tokenId = flags.tokenId
          filteredTokenUtxos = tokenUtxos.filter(x => x.tokenId === tokenId)
        }
      }

      const wif = flags.wif
      const toAddr = flags.address

      const ecPair = this.bchjs.ECPair.fromWIF(wif)

      // const fromAddr = this.bchjs.ECPair.toCashAddress(ecPair)

      // instance of transaction builder
      let transactionBuilder
      if (flags.testnet) {
        transactionBuilder = new this.bchjs.TransactionBuilder('testnet')
      } else transactionBuilder = new this.bchjs.TransactionBuilder()

      // Combine all the UTXOs into a single array.
      const allUtxos = bchUtxos.concat(filteredTokenUtxos)
      // console.log(`allUtxos: ${JSON.stringify(allUtxos, null, 2)}`)

      // Loop through all UTXOs.
      let originalAmount = 0
      for (let i = 0; i < allUtxos.length; i++) {
        const utxo = allUtxos[i]

        originalAmount = originalAmount + Number(utxo.value)

        transactionBuilder.addInput(utxo.txid, utxo.vout)
      }

      if (originalAmount < 300) {
        throw new Error(
          'Not enough BCH to send. Send more BCH to the wallet to pay miner fees.'
        )
      }

      // get byte count to calculate fee. paying 1 sat
      // Note: This may not be totally accurate. Just guessing on the byteCount size.
      // const byteCount = this.bchjs.BitcoinCash.getByteCount(
      //   { P2PKH: 3 },
      //   { P2PKH: 5 }
      // )
      // //console.log(`byteCount: ${byteCount}`)
      // const satoshisPerByte = 1.1
      // const txFee = Math.floor(satoshisPerByte * byteCount)
      // console.log(`txFee: ${txFee} satoshis\n`)
      const txFee = 600

      // amount to send back to the sending address. It's the original amount - 1 sat/byte for tx size
      const remainder = originalAmount - txFee - 546
      if (remainder < 546) {
        throw new Error('Selected UTXO does not have enough satoshis')
      }
      console.log(`remainder: ${remainder}`)

      // Tally up the quantity of tokens
      let tokenQty = 0
      for (let i = 0; i < filteredTokenUtxos.length; i++) {
        tokenQty += Number(filteredTokenUtxos[i].tokenQty)
      }
      // console.log(`tokenQty: ${tokenQty}`)

      // Generate the OP_RETURN entry for an SLP SEND transaction.
      // console.log(`Generating op-return.`)
      // const { script, outputs } = sendTokens.generateOpReturn(
      //   tokenUtxos,
      //   tokenQty
      // )
      const {
        script,
        outputs
      } = this.bchjs.SLP.TokenType1.generateSendOpReturn(filteredTokenUtxos, tokenQty)
      // console.log(`token outputs: ${outputs}`)

      // Since we are sweeping all tokens from the WIF, there generateOpReturn()
      // function should only compute 1 token output. If it returns 2, then there
      // is something unexpected happening.
      if (outputs > 1) {
        throw new Error(
          "token outputs are greater than 1 and shouldn't be. Unexpected error."
        )
      }

      // Add OP_RETURN as first output.
      const data = bchjs.Script.encode(script)
      transactionBuilder.addOutput(data, 0)

      // Send dust transaction representing tokens being sent.
      transactionBuilder.addOutput(
        this.bchjs.Address.toLegacyAddress(toAddr),
        546
      )

      // Last output: send remaining BCH
      transactionBuilder.addOutput(
        this.bchjs.Address.toLegacyAddress(toAddr),
        remainder
      )
      // console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)

      // Sign each UTXO being consumed.
      let redeemScript
      for (let i = 0; i < allUtxos.length; i++) {
        const thisUtxo = allUtxos[i]
        // console.log(`thisUtxo: ${JSON.stringify(thisUtxo, null, 2)}`)

        transactionBuilder.sign(
          i,
          ecPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          Number(thisUtxo.value)
        )
      }

      // build tx
      const tx = transactionBuilder.build()

      // output rawhex
      const hex = tx.toHex()
      // console.log(`Transaction raw hex: `)
      // console.log(hex)

      return hex
    } catch (err) {
      console.error('Error in sweep.js/sweepTokens(): ', err)
      throw err
    }
  }

  // Sweep the private key and send funds to the address specified.
  async sweepBCH (flags) {
    try {
      if (flags.testnet) {
        this.bchjs = new config.BCHLIB({ restURL: config.TESTNET_REST })
      }

      const wif = flags.wif
      const toAddr = flags.address

      const ecPair = this.bchjs.ECPair.fromWIF(wif)

      const fromAddr = this.bchjs.ECPair.toCashAddress(ecPair)

      // Get the UTXOs for that address.
      const utxoData = await this.bchjs.Electrumx.utxo(fromAddr)
      let utxos = utxoData.utxos
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      // Ensure all utxos have the satoshis property.
      utxos = utxos.map(x => {
        x.satoshis = Number(x.value)
        return x
      })
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      // instance of transaction builder
      let transactionBuilder
      if (flags.testnet) {
        transactionBuilder = new this.bchjs.TransactionBuilder('testnet')
      } else transactionBuilder = new this.bchjs.TransactionBuilder()

      let originalAmount = 0

      // Loop through all UTXOs.
      for (let i = 0; i < utxos.length; i++) {
        const utxo = utxos[i]

        originalAmount = originalAmount + utxo.value

        transactionBuilder.addInput(utxo.tx_hash, utxo.tx_pos)
      }

      if (originalAmount < 546) {
        throw new Error(
          'Original amount less than the dust limit. Not enough BCH to send.'
        )
      }

      // get byte count to calculate fee. paying 1 sat/byte
      const byteCount = this.bchjs.BitcoinCash.getByteCount(
        { P2PKH: utxos.length },
        { P2PKH: 1 }
      )
      const fee = Math.ceil(1.1 * byteCount)

      // amount to send to receiver. It's the original amount - 1 sat/byte for tx size
      const sendAmount = originalAmount - fee

      // add output w/ address and amount to send
      transactionBuilder.addOutput(
        this.bchjs.Address.toLegacyAddress(toAddr),
        sendAmount
      )

      // Loop through each input and sign
      let redeemScript
      for (let i = 0; i < utxos.length; i++) {
        const utxo = utxos[i]

        transactionBuilder.sign(
          i,
          ecPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.value
        )
      }

      // build tx
      const tx = transactionBuilder.build()

      // output rawhex
      const hex = tx.toHex()
      return hex
    } catch (err) {
      console.log('Error in sweep.js/sweepBCH()')
      throw err
    }
  }

  // Retrieve the balance of the address associated with the private key.
  async getBalance (flags) {
    try {
      if (flags.testnet) {
        this.bchjs = new config.BCHLIB({ restURL: config.TESTNET_REST })
      }

      const wif = flags.wif

      const ecPair = this.bchjs.ECPair.fromWIF(wif)

      const fromAddr = this.bchjs.ECPair.toCashAddress(ecPair)

      const balances = await this.bchjs.Electrumx.balance(fromAddr)
      // console.log(`balances: ${JSON.stringify(balances, null, 2)}`)
      const balance = balances.balance.confirmed + balances.balance.unconfirmed

      return Number(balance)
    } catch (err) {
      console.log('Error in sweep.js/getBalance()')
      throw err
    }
  }

  // Analyzes the utxos to see if the WIF controls any SLP tokens.
  async getTokens (flags) {
    try {
      if (flags.testnet) {
        this.bchjs = new config.BCHLIB({ restURL: config.TESTNET_REST })
      }

      const wif = flags.wif

      const ecPair = this.bchjs.ECPair.fromWIF(wif)

      const fromAddr = this.bchjs.ECPair.toCashAddress(ecPair)

      // get BCH balance for the public address.
      const utxoData = await this.bchjs.Electrumx.utxo(fromAddr)
      // console.log(`utxoData: ${JSON.stringify(utxoData, null, 2)}`)
      const utxos = utxoData.utxos

      const tokenUtxos = []
      const bchUtxos = []

      // Exit if there are no UTXOs.
      if (utxos.length === 0) return { bchUtxos, tokenUtxos }

      // Figure out which UTXOs are associated with SLP tokens.
      const isTokenUtxo = await this.bchjs.SLP.Utils.tokenUtxoDetails(utxos)
      // console.log(`isTokenUtxo: ${JSON.stringify(isTokenUtxo, null, 2)}`)

      // Separate the bch and token UTXOs.
      for (let i = 0; i < isTokenUtxo.length; i++) {
        // Filter based on isTokenUtxo.
        if (!isTokenUtxo[i].isValid) bchUtxos.push(isTokenUtxo[i])
        else tokenUtxos.push(isTokenUtxo[i])
      }

      // Throw error if no BCH to move tokens.
      if (bchUtxos.length === 0 && tokenUtxos.length > 0) {
        throw new Error(
          'Tokens found, but no BCH UTXOs found. Add BCH to wallet to move tokens.'
        )
      }

      return { bchUtxos, tokenUtxos }
    } catch (err) {
      console.log('Error in sweep.js/getTokens()')
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if private key is not specified.
    const wif = flags.wif
    if (!wif || wif === '') {
      throw new Error(
        'You must specify a private key in WIF format with the -w flag'
      )
    }

    // Address must be specified if balanceOnly flag is not set.
    if (!flags.balanceOnly) {
      const addr = flags.address
      if (!addr || addr === '') {
        throw new Error('You must specify a send-to address with the -a flag.')
      }
    }

    return true
  }
}

Sweep.description = `Sweep a private key
...
Sweeps a private key in WIF format.
Supports SLP token sweeping, but only one token class at a time. It will throw
an error if a WIF contains more than one class of token.
`

Sweep.flags = {
  wif: flags.string({ char: 'w', description: 'WIF private key' }),
  testnet: flags.boolean({ char: 't', description: 'Testnet' }),
  balanceOnly: flags.boolean({
    char: 'b',
    description: 'Balance only, no claim.'
  }),
  address: flags.string({
    char: 'a',
    description: 'Address to sweep funds to.'
  }),
  tokenId: flags.string({
    char: 'i',
    description: 'The token ID to sweep when there are multiple tokens'
  })
}

module.exports = Sweep

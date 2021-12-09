/*
  This config file contains settings shared across files.

  Toolset and REST API can be selected with this file, or by setting the RESTAPI
  environment variable. By default, Bitcoin.com's infrastructure is used.

  You can run your own infrastructure. See bchjs.cash for details.
*/

'use strict'

// By default choose a local rest API.
let RESTAPI = 'fullstack.cash'
// let RESTAPI = 'local'

// Override the RESTAPI setting if envronment variable is set.
if (process.env.RESTAPI && process.env.RESTAPI !== '') {
  RESTAPI = process.env.RESTAPI
}

// console.log(`process.env.RESTAPI: ${process.env.RESTAPI}`)

// Ensure bch-js can pick up the env var.
process.env.RESTAPI = RESTAPI

const BCHJS = require('@psf/bch-js')
const BCHJSNFT = require('bch-js-nft')

const config = {}

// Set the JWT access token.
config.JWT = '' // default value
if (process.env.BCHJSTOKEN) config.JWT = process.env.BCHJSTOKEN

if (RESTAPI === 'fullstack.cash') {
  // config.BCHLIB = BCHJS.BitboxShim()
  config.BCHLIB = BCHJS
  config.NFTLIB = BCHJSNFT
  config.MAINNET_REST = 'https://bchn.fullstack.cash/v5/'
  // config.MAINNET_REST = 'https://abc.fullstack.cash/v4/'
  config.TESTNET_REST = 'https://testnet3.fullstack.cash/v5/'
  config.RESTAPI = 'bchjs'
}

// Use bch-js with local infrastructure.
if (RESTAPI === 'local') {
  config.BCHLIB = BCHJS
  config.NFTLIB = BCHJSNFT
  // config.MAINNET_REST = `http://192.168.0.36:12400/v4/`
  // config.TESTNET_REST = `http://192.168.0.38:13400/v4/`
  config.MAINNET_REST = 'http://127.0.0.1:3000/v5/'
  // config.TESTNET_REST = `http://decatur.hopto.org:13400/v4/`
  // config.TESTNET_REST = `https://testnet.bchjs.cash/v4/`
  config.TESTNET_REST = 'http://127.0.0.1:4000/v5/'
  config.RESTAPI = 'local'
}

// Use bch-js with decatur infrastructure.
if (RESTAPI === 'decatur') {
  config.BCHLIB = BCHJS
  config.NFTLIB = BCHJSNFT
  config.MAINNET_REST = 'http://decatur.hopto.org:12400/v4/'
  config.TESTNET_REST = 'http://decatur.hopto.org:13400/v4/'
  config.RESTAPI = 'decatur'
}

module.exports = config

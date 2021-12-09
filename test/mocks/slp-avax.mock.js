const bchUTXO = {
  height: 0,
  tx_hash: '55107cde5b1d9fdc5c82e796c896fec5ecb72c27e3fd30b19b4c944a7d637151',
  tx_pos: 0,
  value: 1035950,
  satoshis: 1035950,
  txid: '55107cde5b1d9fdc5c82e796c896fec5ecb72c27e3fd30b19b4c944a7d637151',
  vout: 0,
  isValid: false,
  address: 'bitcoincash:qqs62clw026rx85sr4kx66uewnxhysl5cuxk89r2ec',
  hdIndex: 1,
  amount: 0.0103595
}

const tokenUtxos = [
  {
    height: 694531,
    tx_hash: 'fa2641cf1158dae1e57d935ddc9d59efdab05a6a7ba97343aa34a151debe7823',
    tx_pos: 2,
    value: 546,
    txid: 'fa2641cf1158dae1e57d935ddc9d59efdab05a6a7ba97343aa34a151debe7823',
    vout: 2,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    tokenTicker: 'PSID',
    tokenName: 'Psidium',
    tokenDocumentUrl: '',
    tokenDocumentHash: '',
    decimals: 8,
    tokenType: 1,
    isValid: true,
    tokenQty: '983.6',
    address: 'bitcoincash:qr9twxwx76sxhlvfhmurvjfmwn5jnzvpgszt9axpu9',
    hdIndex: 2
  }
]

const flags = {
  name: 'test123',
  qty: 2,
  sendAddr: 'bitcoincash:qrt68l0ae3mz00amspjpxt7hapztzdlss5xgs8pkm6',
  avaxAddr: 'xchain',
  tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
}

module.exports = {
  bchUTXO,
  tokenUtxos,
  flags
}

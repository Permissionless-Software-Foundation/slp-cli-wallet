/*
  Mocks for the send-tokens command unit tests.
*/

const mockUtxosWithMintingBaton = [
  {
    address: 'bitcoincash:qpan6clgy8vjkv8anz683phflsacrtx3xqvksf5569',
    utxos: [
      {
        height: 668448,
        tx_hash:
          '60993abdac4016f86a2df03d96e994640880f064a84e59501349319a3a12cb49',
        tx_pos: 2,
        value: 546,
        satoshis: 546,
        txid:
          '60993abdac4016f86a2df03d96e994640880f064a84e59501349319a3a12cb49',
        vout: 2,
        utxoType: 'token',
        transactionType: 'send',
        tokenId:
          'd1c16867b41d77e6196e2680173b3afc9dff1968118ad1b829b3c8b9b921328d',
        tokenTicker: 'SLPTEST',
        tokenName: 'SLP Test Token',
        tokenDocumentUrl: 'https://FullStack.cash',
        tokenDocumentHash: '',
        decimals: 8,
        tokenType: 1,
        tokenQty: 99,
        isValid: true,
        address: 'bitcoincash:qpan6clgy8vjkv8anz683phflsacrtx3xqvksf5569',
        hdIndex: 0
      },
      {
        height: 668448,
        tx_hash:
          'd1c16867b41d77e6196e2680173b3afc9dff1968118ad1b829b3c8b9b921328d',
        tx_pos: 2,
        value: 546,
        satoshis: 546,
        txid:
          'd1c16867b41d77e6196e2680173b3afc9dff1968118ad1b829b3c8b9b921328d',
        vout: 2,
        utxoType: 'minting-baton',
        tokenId:
          'd1c16867b41d77e6196e2680173b3afc9dff1968118ad1b829b3c8b9b921328d',
        tokenTicker: 'SLPTEST',
        tokenName: 'SLP Test Token',
        tokenDocumentUrl: 'https://FullStack.cash',
        tokenDocumentHash: '',
        decimals: 8,
        tokenType: 1,
        isValid: true,
        address: 'bitcoincash:qpan6clgy8vjkv8anz683phflsacrtx3xqvksf5569',
        hdIndex: 0
      }
    ]
  }
]

module.exports = {
  mockUtxosWithMintingBaton
}

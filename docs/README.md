This directory contains documentation on the design concepts behind this wallet.
Bitcoin wallets all work slightly differently because of the trade-offs the
designers made between convenience, privacy, and technology available at the
time.

The slp-cli-wallet is optimized for privacy. As such, it does not combine UTXOs
in the background, as many modern wallets do. Combining UTXOs is convenient for
the user, but can de-anonymize them too.

For example, the [send command](../src/commands/send.js) will return this message:

`Could not find a UTXO big enough for this transaction.`

...if it cannot find a confirmed UTXO larger than the amount-to-send. It will not combine
UTXOs to make the payment. The `send-all` command is the only command that will
combine UTXOs, and it will warn the user when it does so.

The Roadmap for this
project includes integration to privacy technology like
[Collaborative CoinJoin](https://github.com/Permissionless-Software-Foundation/specifications/blob/master/ps004-collaborative-coinjoin.md), in
order to combine UTXOs in a way that does not degrade the users privacy.

Additional information on the design decisions and trade-offs will be documented
here and in the header of each commands .js file.

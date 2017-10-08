# flending - lending dapp

This is part of my bachelor thesis. I implemented a dapp which manages lended
items and associated fees.

## Requirements

* npm
* Mist v0.8.10
* geth v1.7.1

Please run `npm install` to install all node dependencies.
This code is incompatible to Mist version 0.9.x or newer.

## Running

```
# Start private blockchain (leave it running in the background)
./scripts/start_private_net.sh

# Deploying smart contract and upload frontend to swarm
make
```

## License

This code is licensed under the MIT License. See License.md for details.

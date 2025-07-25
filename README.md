# Pool Unlocker

Unlocker / Payer module for [open-cpuchain-pool](https://github.com/cpuchain/open-cpuchain-pool) ( or [open-ethereum-pool](https://github.com/sammy007/open-ethereum-pool) ) pool

### Usage

Install with `yarn`

```
yarn
```

Run with the following

```
yarn start
```

or

```
yarn start custom.config.json
```

Make sure that you have the correct config.json file, it is compatible with open-ethereum-pool config.json but with more values.

The unlocker should be connected with unlocked node with correct coinbase account specified.

Refer `config.minimal.json` or `config.example.json` for config.
# Uniswap V3 Subgraph

A production-ready subgraph indexing Uniswap V3 on Ethereum mainnet using [The Graph Protocol](https://thegraph.com). Tracks pools, swaps, liquidity events, flash loans, and token data in real time.

## Architecture

```
uniswap-v3-subgraph/
|-- abis/
|   |-- ERC20.json              # Standard ERC-20 ABI (name, symbol, decimals, totalSupply)
|   |-- UniswapV3Factory.json   # Factory ABI (PoolCreated event)
|   +-- UniswapV3Pool.json      # Pool ABI (Swap, Mint, Burn, Flash, Collect, Initialize)
|-- src/
|   +-- mappings/
|       |-- factory.ts          # Handles PoolCreated, creates Pool + Token entities
|       |-- pool.ts             # Handles all pool events (Swap, Mint, Burn, Flash, Collect)
|       +-- utils/
|           |-- constants.ts    # FACTORY_ADDRESS, ZERO_BI, ZERO_BD, token whitelist
|           |-- token.ts        # ERC20 contract calls (symbol, name, decimals, totalSupply)
|           +-- pricing.ts      # sqrtPriceX96 conversion, decimal math helpers
|-- schema.graphql              # GraphQL schema: Token, Pool, Swap, Mint, Burn, Flash, Transaction
|-- subgraph.yaml               # Manifest: Factory datasource + Pool template
+-- package.json                # graph-cli + graph-ts dependencies
```

## Entities

| Entity | Description |
|--------|-------------|
| Factory | Global Uniswap V3 stats: pool count, total volume, TVL |
| Pool | Individual liquidity pool: token pair, fee tier, liquidity, price, volume |
| Token | ERC-20 token metadata and aggregated stats (volume, TVL, fees) |
| Swap | Individual swap event with amounts, price, tick, sender, recipient |
| Mint | Liquidity provision event: tick range, amounts, owner |
| Burn | Liquidity removal event: tick range, amounts, owner |
| Flash | Flash loan event: amounts borrowed and fees paid |
| Transaction | Block-level transaction wrapper (block number, timestamp, gas) |

## Contract Details

| Parameter | Value |
|-----------|-------|
| Network | Ethereum Mainnet |
| Factory Address | `0x1F98431c8aD98523631AE4a59f267346ea31F984` |
| Start Block | `12369621` (Uniswap V3 deployment) |
| Spec Version | `0.0.5` |
| API Version | `0.0.7` |

## Setup

**Prerequisites:** Node.js >= 16, `@graphprotocol/graph-cli`

```bash
git clone https://github.com/harshitdabra/uniswap-v3-subgraph.git
cd uniswap-v3-subgraph
npm install
```

**Generate types from ABI + schema:**

```bash
npm run codegen
```

**Build (compiles to WASM):**

```bash
npm run build
```

**Deploy to The Graph Studio:**

```bash
graph auth --studio <YOUR_DEPLOY_KEY>
npm run deploy
```

**Local development with Graph Node:**

```bash
docker-compose up -d
npm run create-local
npm run deploy-local
```

## Sample Queries

**Top pools by TVL:**

```graphql
{
  pools(first: 10, orderBy: totalValueLockedUSD, orderDirection: desc) {
    id
    token0 { symbol }
    token1 { symbol }
    feeTier
    totalValueLockedUSD
    volumeUSD
    txCount
  }
}
```

**Recent swaps on a pool:**

```graphql
{
  swaps(
    first: 20
    orderBy: timestamp
    orderDirection: desc
    where: { pool: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8" }
  ) {
    id
    timestamp
    sender
    recipient
    amount0
    amount1
    amountUSD
  }
}
```

**Factory global stats:**

```graphql
{
  factories(first: 1) {
    poolCount
    txCount
    totalVolumeUSD
    totalValueLockedUSD
    totalFeesUSD
  }
}
```

**Token volume and fees:**

```graphql
{
  tokens(first: 10, orderBy: volumeUSD, orderDirection: desc) {
    id
    symbol
    name
    decimals
    volumeUSD
    feesUSD
    totalValueLockedUSD
    poolCount
  }
}
```

## Tech Stack

- [The Graph Protocol](https://thegraph.com) - decentralized indexing infrastructure
- AssemblyScript - typed superset of TypeScript compiled to WASM
- GraphQL - query language for the indexed data
- Ethereum Mainnet - Uniswap V3 smart contracts

## How It Works

The `Factory` contract is the static data source. When a new pool is created, `handlePoolCreated` dynamically spins up a `Pool` template instance to start indexing that pool's events. Each pool gets its own event listeners. All data is stored in a PostgreSQL-compatible store via Graph Node and queryable via GraphQL.

## License

MIT - built by [Harshit Dabra](https://github.com/harshitdabra)

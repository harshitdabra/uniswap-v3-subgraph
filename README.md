# Uniswap V3 Subgraph

A production-ready subgraph indexing **Uniswap V3** on Ethereum mainnet using [The Graph Protocol](https://thegraph.com/). Tracks pools, swaps, liquidity events, flash loans, and token data in real time.

## Architecture

```
uniswap-v3-subgraph/
├── abis/
│   ├── ERC20.json                    # Standard ERC-20 ABI (name, symbol, decimals, totalSupply)
│   ├── UniswapV3Factory.json         # Factory ABI (PoolCreated event)
│   └── UniswapV3Pool.json            # Pool ABI (Swap, Mint, Burn, Flash, Collect, Initialize)
├── src/
│   └── mappings/
│       ├── factory.ts                # Handles PoolCreated → creates Pool + Token entities
│       ├── pool.ts                   # Handles all pool events (Swap, Mint, Burn, Flash, Collect)
│       └── utils/
│           └── constants.ts          # FACTORY_ADDRESS, ZERO_BI, ZERO_BD, token whitelist
├── schema.graphql                    # GraphQL schema: Token, Pool, Swap, Mint, Burn, Flash, Transaction, Factory
├── subgraph.yaml                     # Manifest: Factory datasource + Pool template
└── package.json                      # Graph CLI + graph-ts dependencies
```

## Entities

| Entity | Description |
|--------|-------------|
| `Factory` | Global Uniswap V3 factory stats — pool count, total volume, TVL |
| `Pool` | Individual liquidity pool — token pair, fee tier, liquidity, price, volume |
| `Token` | ERC-20 token metadata and aggregated stats (volume, TVL, fees) |
| `Swap` | Individual swap event with amounts, price, tick, sender, recipient |
| `Mint` | Liquidity provision event — tick range, amounts, owner |
| `Burn` | Liquidity removal event — tick range, amounts, owner |
| `Flash` | Flash loan event — amounts borrowed and fees paid |
| `Transaction` | Block-level transaction wrapper (block number, timestamp, gas) |

## Contract Details

| Parameter | Value |
|-----------|-------|
| Network | Ethereum Mainnet |
| Factory Address | `0x1F98431c8aD98523631AE4a59f267346ea31F984` |
| Start Block | `12369621` (Uniswap V3 deployment) |
| Spec Version | `0.0.5` |
| API Version | `0.0.7` |

## Setup & Installation

### Prerequisites
- Node.js >= 16
- `@graphprotocol/graph-cli` (installed via npm)

### Install Dependencies

```bash
git clone https://github.com/harshitdabra/uniswap-v3-subgraph.git
cd uniswap-v3-subgraph
npm install
```

### Generate Types

```bash
npm run codegen
```

This runs `graph codegen` which generates AssemblyScript types from the ABI files and GraphQL schema.

### Build

```bash
npm run build
```

This compiles the subgraph and outputs WASM binaries to the `build/` directory.

### Deploy to The Graph Studio

```bash
graph auth --studio <YOUR_DEPLOY_KEY>
npm run deploy
```

### Local Development (Graph Node)

```bash
# Start local graph node (requires Docker)
docker-compose up -d

# Create the subgraph locally
npm run create-local

# Deploy locally
npm run deploy-local
```

## Sample GraphQL Queries

### Top Pools by TVL

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

### Recent Swaps on a Pool

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

### Factory Global Stats

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

### Token Volume and Fees

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

- **The Graph Protocol** — decentralized indexing infrastructure
- **AssemblyScript** — typed superset of TypeScript compiled to WASM
- **GraphQL** — query language for the indexed data
- **Ethereum Mainnet** — Uniswap V3 smart contracts

## Key Concepts

**Data Sources**: The `Factory` contract is the static datasource. When a new pool is created, the `handlePoolCreated` handler dynamically creates a `Pool` template instance to start indexing that pool's events.

**Templates**: The `Pool` template in `subgraph.yaml` allows dynamic contract creation — each pool gets its own event listeners once created by the factory.

**Entities**: All data is stored in a PostgreSQL-compatible store via the Graph Node and queryable via GraphQL.

## License

MIT — built by [Harshit Dabra](https://github.com/harshitdabra)

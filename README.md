# Uniswap V3 Subgraph

A subgraph indexing Uniswap V3 activity on Ethereum mainnet through The Graph. It tracks pools, swaps, mints, burns, flash loans and token data in real time.

## How it works

The Factory contract is the static data source. When a new pool gets created, `handlePoolCreated` spins up a Pool template to start indexing that pool's own events, so each pool ends up with its own set of listeners. Everything lands in a Postgres backed store through Graph Node and you query it over GraphQL.

Layout wise, the ABIs live in `abis/`, the actual event handlers (`factory.ts`, `pool.ts`) are in `src/mappings/`, and `src/utils/` has the constants, token helpers and pricing math. Entities are defined in `schema.graphql`, and `subgraph.yaml` is the manifest tying it all together.

Entities tracked: Factory (global stats), Pool, Token, Swap, Mint, Burn, Flash, and Transaction.

Deployed on Ethereum mainnet starting from block 12369621 (Uniswap V3's deployment block), factory address `0x1F98431c8aD98523631AE4a59f267346ea31F984`.

## Setup

Needs Node 16+ and `@graphprotocol/graph-cli`.

```
git clone https://github.com/harshitdabra/uniswap-v3-subgraph.git
cd uniswap-v3-subgraph
npm install
npm run codegen
npm run build
```

To deploy to The Graph Studio:

```
graph auth --studio <YOUR_DEPLOY_KEY>
npm run deploy
```

Or run it locally against a Graph Node with docker-compose:

```
docker-compose up -d
npm run create-local
npm run deploy-local
```

## Example query

```graphql
{
  pools(first: 10, orderBy: totalValueLockedUSD, orderDirection: desc) {
    id
    token0 { symbol }
    token1 { symbol }
    feeTier
    totalValueLockedUSD
    volumeUSD
  }
}
```

MIT licensed.

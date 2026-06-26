import { PoolCreated } from '../../generated/Factory/UniswapV3Factory'
import { Pool as PoolTemplate } from '../../generated/templates'
import { Pool, Token, Factory } from '../../generated/schema'
import { FACTORY_ADDRESS, ZERO_BI, ONE_BI, ZERO_BD } from './utils/constants'
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals, fetchTokenTotalSupply } from './utils/token'
import { BigInt, log } from '@graphprotocol/graph-ts'

export function handlePoolCreated(event: PoolCreated): void {
  // Load or create factory
  let factory = Factory.load(FACTORY_ADDRESS)
  if (factory === null) {
    factory = new Factory(FACTORY_ADDRESS)
    factory.poolCount = ZERO_BI
    factory.txCount = ZERO_BI
    factory.totalVolumeUSD = ZERO_BD
    factory.totalVolumeETH = ZERO_BD
    factory.totalFeesUSD = ZERO_BD
    factory.totalFeesETH = ZERO_BD
    factory.untrackedVolumeUSD = ZERO_BD
    factory.totalValueLockedUSD = ZERO_BD
    factory.totalValueLockedETH = ZERO_BD
    factory.owner = FACTORY_ADDRESS
  }

  factory.poolCount = factory.poolCount.plus(ONE_BI)
  factory.save()

  // Load or create token0
  let token0 = Token.load(event.params.token0.toHexString())
  if (token0 === null) {
    token0 = new Token(event.params.token0.toHexString())
    token0.symbol = fetchTokenSymbol(event.params.token0)
    token0.name = fetchTokenName(event.params.token0)
    token0.decimals = fetchTokenDecimals(event.params.token0)
    token0.totalSupply = fetchTokenTotalSupply(event.params.token0)
    token0.derivedETH = ZERO_BD
    token0.poolCount = ZERO_BI
    token0.txCount = ZERO_BI
    token0.totalValueLocked = ZERO_BD
    token0.totalValueLockedUSD = ZERO_BD
    token0.feesUSD = ZERO_BD
    token0.volume = ZERO_BD
    token0.volumeUSD = ZERO_BD
    token0.untrackedVolumeUSD = ZERO_BD
    token0.whitelistPools = []
    token0.save()
  }

  // Load or create token1
  let token1 = Token.load(event.params.token1.toHexString())
  if (token1 === null) {
    token1 = new Token(event.params.token1.toHexString())
    token1.symbol = fetchTokenSymbol(event.params.token1)
    token1.name = fetchTokenName(event.params.token1)
    token1.decimals = fetchTokenDecimals(event.params.token1)
    token1.totalSupply = fetchTokenTotalSupply(event.params.token1)
    token1.derivedETH = ZERO_BD
    token1.poolCount = ZERO_BI
    token1.txCount = ZERO_BI
    token1.totalValueLocked = ZERO_BD
    token1.totalValueLockedUSD = ZERO_BD
    token1.feesUSD = ZERO_BD
    token1.volume = ZERO_BD
    token1.volumeUSD = ZERO_BD
    token1.untrackedVolumeUSD = ZERO_BD
    token1.whitelistPools = []
    token1.save()
  }

  // Create the pool
  let pool = new Pool(event.params.pool.toHexString())
  pool.createdAtTimestamp = event.block.timestamp
  pool.createdAtBlockNumber = event.block.number
  pool.token0 = token0.id
  pool.token1 = token1.id
  pool.feeTier = BigInt.fromI32(event.params.fee)
  pool.liquidity = ZERO_BI
  pool.sqrtPrice = ZERO_BI
  pool.token0Price = ZERO_BD
  pool.token1Price = ZERO_BD
  pool.observationIndex = ZERO_BI
  pool.volumeToken0 = ZERO_BD
  pool.volumeToken1 = ZERO_BD
  pool.volumeUSD = ZERO_BD
  pool.untrackedVolumeUSD = ZERO_BD
  pool.feesUSD = ZERO_BD
  pool.txCount = ZERO_BI
  pool.collectedFeesToken0 = ZERO_BD
  pool.collectedFeesToken1 = ZERO_BD
  pool.collectedFeesUSD = ZERO_BD
  pool.totalValueLockedToken0 = ZERO_BD
  pool.totalValueLockedToken1 = ZERO_BD
  pool.totalValueLockedETH = ZERO_BD
  pool.totalValueLockedUSD = ZERO_BD
  pool.save()

  // Create the tracked contract based on the pool
  PoolTemplate.create(event.params.pool)

  token0.poolCount = token0.poolCount.plus(ONE_BI)
  token1.poolCount = token1.poolCount.plus(ONE_BI)
  token0.save()
  token1.save()

  log.info('Pool {} created for tokens {} and {}', [
    event.params.pool.toHexString(),
    event.params.token0.toHexString(),
    event.params.token1.toHexString()
  ])
}

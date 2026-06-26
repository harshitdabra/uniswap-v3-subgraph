import {
  Initialize,
  Swap as SwapEvent,
  Mint as MintEvent,
  Burn as BurnEvent,
  Flash as FlashEvent,
  Collect
} from '../../generated/templates/Pool/UniswapV3Pool'
import { Pool, Token, Swap, Mint, Burn, Flash, Transaction, Factory } from '../../generated/schema'
import { FACTORY_ADDRESS, ZERO_BD, ZERO_BI, ONE_BI } from './utils/constants'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { exponentToBigDecimal, sqrtPriceX96ToTokenPrices } from './utils/pricing'

export function handleInitialize(event: Initialize): void {
  let pool = Pool.load(event.address.toHexString())
  if (pool === null) return

  pool.sqrtPrice = event.params.sqrtPriceX96
  pool.tick = BigInt.fromI32(event.params.tick)

  let prices = sqrtPriceX96ToTokenPrices(pool.sqrtPrice, 18, 18)
  pool.token0Price = prices[0]
  pool.token1Price = prices[1]
  pool.save()
}

export function handleSwap(event: SwapEvent): void {
  let pool = Pool.load(event.address.toHexString())
  if (pool === null) return

  let factory = Factory.load(FACTORY_ADDRESS)
  if (factory === null) return

  // Update pool state
  pool.sqrtPrice = event.params.sqrtPriceX96
  pool.liquidity = event.params.liquidity
  pool.tick = BigInt.fromI32(event.params.tick)
  pool.txCount = pool.txCount.plus(ONE_BI)

  let amount0 = event.params.amount0.toBigDecimal().div(exponentToBigDecimal(18))
  let amount1 = event.params.amount1.toBigDecimal().div(exponentToBigDecimal(18))
  let absAmount0 = amount0 < ZERO_BD ? amount0.neg() : amount0
  let absAmount1 = amount1 < ZERO_BD ? amount1.neg() : amount1

  pool.volumeToken0 = pool.volumeToken0.plus(absAmount0)
  pool.volumeToken1 = pool.volumeToken1.plus(absAmount1)
  pool.save()

  factory.txCount = factory.txCount.plus(ONE_BI)
  factory.save()

  // Load/create transaction
  let transaction = loadOrCreateTransaction(event.transaction.hash.toHexString(), event)

  let swap = new Swap(event.transaction.hash.toHexString().concat('-').concat(event.logIndex.toString()))
  swap.transaction = transaction.id
  swap.timestamp = event.block.timestamp
  swap.pool = pool.id
  swap.token0 = pool.token0
  swap.token1 = pool.token1
  swap.sender = event.params.sender
  swap.recipient = event.params.recipient
  swap.origin = event.transaction.from
  swap.amount0 = amount0
  swap.amount1 = amount1
  swap.amountUSD = ZERO_BD
  swap.sqrtPriceX96 = event.params.sqrtPriceX96
  swap.tick = BigInt.fromI32(event.params.tick)
  swap.logIndex = event.logIndex
  swap.save()
}

export function handleMint(event: MintEvent): void {
  let pool = Pool.load(event.address.toHexString())
  if (pool === null) return

  pool.txCount = pool.txCount.plus(ONE_BI)
  pool.save()

  let transaction = loadOrCreateTransaction(event.transaction.hash.toHexString(), event)
  let mint = new Mint(event.transaction.hash.toHexString().concat('-').concat(event.logIndex.toString()))
  mint.transaction = transaction.id
  mint.timestamp = event.block.timestamp
  mint.pool = pool.id
  mint.token0 = pool.token0
  mint.token1 = pool.token1
  mint.owner = event.params.owner
  mint.sender = event.params.sender
  mint.origin = event.transaction.from
  mint.amount = event.params.amount
  mint.amount0 = event.params.amount0.toBigDecimal().div(exponentToBigDecimal(18))
  mint.amount1 = event.params.amount1.toBigDecimal().div(exponentToBigDecimal(18))
  mint.amountUSD = ZERO_BD
  mint.tickLower = BigInt.fromI32(event.params.tickLower)
  mint.tickUpper = BigInt.fromI32(event.params.tickUpper)
  mint.logIndex = event.logIndex
  mint.save()
}

export function handleBurn(event: BurnEvent): void {
  let pool = Pool.load(event.address.toHexString())
  if (pool === null) return

  pool.txCount = pool.txCount.plus(ONE_BI)
  pool.save()

  let transaction = loadOrCreateTransaction(event.transaction.hash.toHexString(), event)
  let burn = new Burn(event.transaction.hash.toHexString().concat('-').concat(event.logIndex.toString()))
  burn.transaction = transaction.id
  burn.pool = pool.id
  burn.token0 = pool.token0
  burn.token1 = pool.token1
  burn.timestamp = event.block.timestamp
  burn.owner = event.params.owner
  burn.origin = event.transaction.from
  burn.amount = event.params.amount
  burn.amount0 = event.params.amount0.toBigDecimal().div(exponentToBigDecimal(18))
  burn.amount1 = event.params.amount1.toBigDecimal().div(exponentToBigDecimal(18))
  burn.amountUSD = ZERO_BD
  burn.tickLower = BigInt.fromI32(event.params.tickLower)
  burn.tickUpper = BigInt.fromI32(event.params.tickUpper)
  burn.logIndex = event.logIndex
  burn.save()
}

export function handleFlash(event: FlashEvent): void {
  let pool = Pool.load(event.address.toHexString())
  if (pool === null) return

  let transaction = loadOrCreateTransaction(event.transaction.hash.toHexString(), event)
  let flash = new Flash(event.transaction.hash.toHexString().concat('-').concat(event.logIndex.toString()))
  flash.transaction = transaction.id
  flash.timestamp = event.block.timestamp
  flash.pool = pool.id
  flash.sender = event.params.sender
  flash.recipient = event.params.recipient
  flash.amount0 = event.params.amount0.toBigDecimal().div(exponentToBigDecimal(18))
  flash.amount1 = event.params.amount1.toBigDecimal().div(exponentToBigDecimal(18))
  flash.amountUSD = ZERO_BD
  flash.amount0Paid = event.params.paid0.toBigDecimal().div(exponentToBigDecimal(18))
  flash.amount1Paid = event.params.paid1.toBigDecimal().div(exponentToBigDecimal(18))
  flash.logIndex = event.logIndex
  flash.save()
}

export function handleCollect(event: Collect): void {
  let pool = Pool.load(event.address.toHexString())
  if (pool === null) return

  let collectedAmount0 = event.params.amount0.toBigDecimal().div(exponentToBigDecimal(18))
  let collectedAmount1 = event.params.amount1.toBigDecimal().div(exponentToBigDecimal(18))

  pool.collectedFeesToken0 = pool.collectedFeesToken0.plus(collectedAmount0)
  pool.collectedFeesToken1 = pool.collectedFeesToken1.plus(collectedAmount1)
  pool.save()
}

function loadOrCreateTransaction(transactionHash: string, event: any): Transaction {
  let transaction = Transaction.load(transactionHash)
  if (transaction === null) {
    transaction = new Transaction(transactionHash)
    transaction.blockNumber = event.block.number
    transaction.timestamp = event.block.timestamp
    transaction.gasUsed = event.transaction.gasUsed
    transaction.gasPrice = event.transaction.gasPrice
    transaction.save()
  }
  return transaction as Transaction
}

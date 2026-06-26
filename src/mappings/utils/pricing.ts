import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let result = BigDecimal.fromString('1')
  let ten = BigDecimal.fromString('10')
  for (let i = 0; i < decimals; i++) {
    result = result.times(ten)
  }
  return result
}

export function sqrtPriceX96ToTokenPrices(
  sqrtPriceX96: BigInt,
  token0Decimals: i32,
  token1Decimals: i32
): BigDecimal[] {
  let Q192 = BigDecimal.fromString('6277101735386680763835789423207666416102355444464034512896')
  let sqrtPrice = sqrtPriceX96.toBigDecimal()
  let price = sqrtPrice.times(sqrtPrice).div(Q192)

  let decimalAdjust = exponentToBigDecimal(token0Decimals).div(exponentToBigDecimal(token1Decimals))
  let token0Price = price.times(decimalAdjust)
  let token1Price = token0Price.equals(BigDecimal.fromString('0'))
    ? BigDecimal.fromString('0')
    : BigDecimal.fromString('1').div(token0Price)

  return [token0Price, token1Price]
}

export function tokenAmountToDecimal(amount: BigInt, decimals: BigInt): BigDecimal {
  if (decimals.equals(BigInt.fromI32(0))) return amount.toBigDecimal()
  return amount.toBigDecimal().div(exponentToBigDecimal(decimals.toI32()))
}

export function safeDiv(a: BigDecimal, b: BigDecimal): BigDecimal {
  if (b.equals(BigDecimal.fromString('0'))) return BigDecimal.fromString('0')
  return a.div(b)
}

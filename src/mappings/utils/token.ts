import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { ERC20 } from '../../../generated/Factory/ERC20'

export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress)
  let result = contract.try_symbol()
  if (result.reverted) return 'unknown'
  return result.value
}

export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress)
  let result = contract.try_name()
  if (result.reverted) return 'unknown'
  return result.value
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  let contract = ERC20.bind(tokenAddress)
  let result = contract.try_decimals()
  if (result.reverted) return BigInt.fromI32(18)
  return BigInt.fromI32(result.value)
}

export function fetchTokenTotalSupply(tokenAddress: Address): BigDecimal {
  let contract = ERC20.bind(tokenAddress)
  let result = contract.try_totalSupply()
  if (result.reverted) return BigDecimal.fromString('0')
  return result.value.toBigDecimal()
}

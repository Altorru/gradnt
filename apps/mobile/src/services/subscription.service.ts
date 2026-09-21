import { Platform } from 'react-native'
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases'

export type { PurchasesPackage }

export const PREMIUM_ENTITLEMENT = 'premium'

let configuredFor: string | null = null

function apiKey(): string | null {
  const value = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY?.trim()
  return value || null
}

export async function configureSubscriptions(userId: string): Promise<boolean> {
  if (Platform.OS !== 'android') return false
  const key = apiKey()
  if (!key) return false
  if (configuredFor === userId) return true
  Purchases.configure({ apiKey: key, appUserID: userId })
  configuredFor = userId
  return true
}

export async function loadPremiumState(userId: string): Promise<{
  configured: boolean
  active: boolean
  package: PurchasesPackage | null
}> {
  const configured = await configureSubscriptions(userId)
  if (!configured) return { configured: false, active: false, package: null }
  const [customerInfo, offerings] = await Promise.all([
    Purchases.getCustomerInfo(),
    Purchases.getOfferings(),
  ])
  return {
    configured: true,
    active: isPremiumActive(customerInfo),
    package: offerings.current?.availablePackages[0] ?? null,
  }
}

export function isPremiumActive(customerInfo: CustomerInfo): boolean {
  return typeof customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== 'undefined'
}

export async function purchasePremium(
  userId: string,
  packageToPurchase: PurchasesPackage,
): Promise<boolean> {
  if (!(await configureSubscriptions(userId))) return false
  const result = await Purchases.purchasePackage(packageToPurchase)
  return isPremiumActive(result.customerInfo)
}

export async function restorePremium(userId: string): Promise<boolean> {
  if (!(await configureSubscriptions(userId))) return false
  return isPremiumActive(await Purchases.restorePurchases())
}

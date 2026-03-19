/**
 * US Attorneys - Custom Hooks (v2)
 */

export { useAuth } from './useAuth'
export {
  useDebounce,
  useDebounce as useDebounceValue,
  useDebouncedCallback,
  useThrottledCallback,
} from './useDebounce'
export { useIntersectionObserver, useInfiniteScroll, useLazyLoad } from './useIntersectionObserver'
export { useProvider } from './useProvider'
export type { Provider, AttorneyStats } from './useProvider'
export { useToast } from './useToast'
export type { ToastType, Toast } from './useToast'
export { useLocalStorage } from './use-local-storage'
export { useMediaQuery, useIsMobile, useIsDesktop } from './use-media-query'
export { useCompare } from './useCompare'
export type { CompareProvider } from './useCompare'
export { useFavorites } from './useFavorites'
export { useGeolocation } from './useGeolocation'
export type { GeolocationState, UseGeolocationOptions } from './useGeolocation'
export { useMapSearchCache } from './useMapSearchCache'
export { default as usePushNotifications } from './usePushNotifications'
export { useRealTimeAvailability } from './useRealTimeAvailability'
export type { Slot } from './useRealTimeAvailability'
export { useReducedMotion } from './useReducedMotion'

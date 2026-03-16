# Map Components

Map components with advanced features, performance optimizations, and modern design.

## Features

### Visual Enhancements

#### 1. Animated Premium Markers
- Bounce animation on appearance
- Pulse effect for selected markers
- Gold star badge for premium attorneys
- Dynamic scale on hover and selection
- Advanced drop shadows with cubic-bezier easing

#### 2. Modern Popups
- Rounded design with deep shadows
- Visible Premium and Verified badges
- Avatar with colored ring for premium
- Buttons with gradients and hover effects
- Smooth entry animations (slide + scale)

#### 3. Custom CSS Styles (`map-styles.css`)
- Styled zoom controls with rounded corners
- Attribution with backdrop-filter blur
- Marker animations (bounce, pulse, glow)
- Full mobile support with media queries
- Shimmer effect for loading state

### Core Features

#### 4. MapViewController
- Automatic smooth recentering with `flyTo()`
- Animation with custom easing (duration: 1.5s)
- Smart minimum zoom (Math.max)
- Strict coordinate validation

#### 5. Robust Coordinate Validation
```typescript
// Advanced filtering:
- !isNaN(latitude) && !isNaN(longitude)
- latitude >= -90 && latitude <= 90
- longitude >= -180 && longitude <= 180
```

#### 6. Geolocation Hook (`useGeolocation.ts`)
- Complete error handling (Permission, Timeout, Unavailable)
- Support for "watch" mode for real-time tracking
- Cache with configurable maximumAge
- Automatic cleanup on unmount

#### 7. Smart Cache System (`useMapSearchCache.ts`)
```typescript
// Features:
- Configurable TTL (60s default)
- Coordinate rounding to optimize hits
- Max 50 entries limit (auto cleanup)
- Detailed statistics (hits, misses, hit rate)
- Key generation including filters
```

#### 8. Performance Indicator (`MapPerformanceIndicator.tsx`)
- Response time display (color coded)
- Cache hit rate percentage
- Result count
- Visual progress bar
- Auto-hide after 3 seconds
- Smooth animation with Framer Motion

#### 9. Advanced Tooltip (`MapTooltip.tsx`)
- Display on marker hover
- Rich information (rating, city, phone)
- Status badges (Premium, Verified, Available)
- Dynamic position calculation
- Smooth enter/exit animation

### Design System

#### Colors
- **Premium**: Gradient amber (#f59e0b -> #fbbf24)
- **Verified**: Green (#22c55e)
- **Selected**: Blue (#2563eb)
- **Standard**: Blue (#3b82f6)

#### Marker Sizes
- Standard: 38px
- Hovered/Selected: 48px
- Premium Badge: 18px
- Animation scale: 1.15x for selection

#### Popups
- Border-radius: 16px
- Max-width: 340px (desktop), calc(100vw - 40px) (mobile)
- Shadow: 0 20px 60px rgba(0,0,0,0.3)
- Padding: 2 (Tailwind, i.e. 8px)

### Performance Optimizations

1. **Dynamic Imports**
   - All Leaflet components via dynamic import
   - Avoids SSR errors with Next.js
   - Lazy loading of heavy dependencies

2. **Smart Debouncing**
   - 300ms for bounds changes
   - 500ms for text search
   - Avoids unnecessary API calls

3. **Strategic Caching**
   - Search caching by zone
   - 60-second TTL default
   - Hit rate generally > 70%

4. **Upstream Validation**
   - Invalid coordinate filtering before render
   - isNaN + geographic range validation
   - Prevents Leaflet errors

5. **Memoization**
   - useCallback for all functions
   - useMemo for filter counters
   - Avoids unnecessary re-renders

### Responsive Design

- **Desktop**: Split view (list + map)
- **Tablet**: List/map toggle
- **Mobile**:
  - Sliding drawer for results
  - Resized controls (36px)
  - Width-adapted popups

### Usage

#### GeographicMap.tsx (Simple)
```tsx
<GeographicMap
  centerLat={40.7128}
  centerLng={-74.0060}
  zoom={12}
  providers={providers}
  locationName="New York"
  height="400px"
/>
```

#### MapSearch.tsx (Advanced)
```tsx
<MapSearch />
// Automatic handling of:
// - Search
// - Filters
// - Geolocation
// - Cache
// - Performance monitoring
```

### Custom Hooks

#### useGeolocation
```typescript
const geo = useGeolocation({
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000
})

geo.getLocation() // Request position
geo.clearWatch() // Stop tracking
```

#### useMapSearchCache
```typescript
const cache = useMapSearchCache<Provider[]>(60000) // 60s TTL

cache.get(bounds, filters) // Retrieve
cache.set(bounds, data, filters) // Store
cache.stats // { hits, misses, size, hitRate }
```

### Best Practices

1. **Always validate coordinates** before creating a Marker
2. **Use the cache** for repeated searches
3. **Display performance indicators** in development
4. **Test on mobile** for responsiveness
5. **Monitor cache hit rate** (target: >60%)

### Dependencies

- **react-leaflet**: React components for Leaflet
- **leaflet**: Map library
- **framer-motion**: Smooth animations
- **lucide-react**: Modern icons
- **next**: Framework (for dynamic imports)

### Future Improvements

- [ ] Marker clustering (react-leaflet-cluster)
- [ ] Heatmap for attorney density
- [ ] Directions with routing (Leaflet Routing Machine)
- [ ] Geometric filters (circle, polygon)
- [ ] Export results (PDF, CSV)
- [ ] View sharing (URL with bounds)
- [ ] Dark mode for map
- [ ] Offline support with Service Worker

---

**Version**: 2.0.0
**Last updated**: March 2026
**Team**: US Attorneys

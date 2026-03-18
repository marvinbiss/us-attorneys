/**
 * Map Components — Unit Tests
 *
 * Tests for Map.tsx (leaflet map wrapper), CarteAvecListe.tsx (map + list layout),
 * and MapResultsList.tsx (sidebar, mobile toggle, mobile drawer).
 *
 * Leaflet and react-leaflet are fully mocked since jsdom lacks Canvas/WebGL.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'

// ── Mock leaflet ─────────────────────────────────────────────────────
vi.mock('leaflet', () => {
  const divIcon = vi.fn(() => ({ options: {} }))
  return {
    default: { divIcon },
    divIcon,
    Map: vi.fn(),
    map: vi.fn(),
  }
})

vi.mock('leaflet/dist/leaflet.css', () => ({}))

// ── Mock react-leaflet ───────────────────────────────────────────────
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="map-container" className={className}>{children}</div>
  ),
  TileLayer: ({ url }: { url: string }) => <div data-testid="tile-layer" data-url={url} />,
  Marker: ({ children, position, eventHandlers }: {
    children: React.ReactNode
    position: [number, number]
    eventHandlers?: Record<string, () => void>
  }) => (
    <div
      data-testid="map-marker"
      data-lat={position[0]}
      data-lng={position[1]}
      onClick={eventHandlers?.click}
      onMouseOver={eventHandlers?.mouseover}
      onMouseOut={eventHandlers?.mouseout}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-popup">{children}</div>
  ),
  useMap: vi.fn(() => ({
    setView: vi.fn(),
  })),
}))

// ── Mock next/dynamic (used by CarteAvecListe) ──────────────────────
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    // Return a component that renders the mocked version directly
    const DynamicComponent = (props: Record<string, unknown>) => {
      // We already mock react-leaflet above, so just render from the mock
      const name = loader.toString()
      if (name.includes('MapContainer')) {
        return <div data-testid="map-container" {...props}>{(props as { children?: React.ReactNode }).children}</div>
      }
      if (name.includes('TileLayer')) {
        return <div data-testid="tile-layer" />
      }
      if (name.includes('Marker')) {
        return <div data-testid="map-marker">{(props as { children?: React.ReactNode }).children}</div>
      }
      if (name.includes('Popup')) {
        return <div data-testid="map-popup">{(props as { children?: React.ReactNode }).children}</div>
      }
      return null
    }
    DynamicComponent.displayName = 'DynamicComponent'
    return DynamicComponent
  },
}))

// ── Mock next/link ───────────────────────────────────────────────────
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// ── Mock next/image ──────────────────────────────────────────────────
vi.mock('next/image', () => ({
  default: ({ alt, src, ...props }: { alt: string; src: string; [key: string]: unknown }) => (
    <img alt={alt} src={src} {...props} />
  ),
}))

// ── Mock lucide-react ────────────────────────────────────────────────
vi.mock('lucide-react', () => {
  const factory = (name: string) => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid={`icon-${name}`} className={className} />
    )
    Icon.displayName = name
    return Icon
  }
  return {
    Star: factory('Star'),
    Phone: factory('Phone'),
    ChevronDown: factory('ChevronDown'),
    ChevronUp: factory('ChevronUp'),
    Loader2: factory('Loader2'),
    X: factory('X'),
    Shield: factory('Shield'),
    Heart: factory('Heart'),
    ExternalLink: factory('ExternalLink'),
    MapPin: factory('MapPin'),
  }
})

// ── Mock framer-motion ───────────────────────────────────────────────
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: Record<string, unknown>) => (
      <div className={className as string} data-testid="motion-div" onClick={props.onClick as undefined} onMouseEnter={props.onMouseEnter as undefined} onMouseLeave={props.onMouseLeave as undefined}>
        {children as React.ReactNode}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ── Mock hooks ───────────────────────────────────────────────────────
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

// ── Mock utils ───────────────────────────────────────────────────────
vi.mock('@/lib/utils', () => ({
  getAttorneyUrl: ({ stable_id, slug }: { stable_id?: string; slug?: string }) =>
    `/attorney/${stable_id || slug || 'unknown'}`,
  getAvatarColor: () => 'from-blue-400 to-blue-600',
}))

// ── Mock AttorneyCard ────────────────────────────────────────────────
vi.mock('@/components/AttorneyCard', () => ({
  default: ({ provider, isHovered }: { provider: { name: string; id: string }; isHovered?: boolean }) => (
    <div data-testid={`attorney-card-${provider.id}`} data-hovered={isHovered}>
      {provider.name}
    </div>
  ),
}))

// ── Imports after mocks ──────────────────────────────────────────────
import Map from '@/components/Map'
import {
  DesktopResultsSidebar,
  MobileResultsToggle,
  MobileResultsDrawer,
  type MapProvider,
} from '@/components/maps/MapResultsList'

// ── Test data factories ──────────────────────────────────────────────

function mockLegacyProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prov-1',
    name: 'Jane Doe',
    slug: 'jane-doe',
    stable_id: 'stable-1',
    latitude: 40.7128,
    longitude: -74.006,
    is_verified: false,
    address_city: 'New York',
    address_zip: '10001',
    phone: '(555) 111-2222',
    rating_average: 4.5,
    review_count: 12,
    ...overrides,
  }
}

function mockMapProvider(overrides: Partial<MapProvider> = {}): MapProvider {
  return {
    id: 'mp-1',
    name: 'John Smith',
    slug: 'john-smith',
    stable_id: 'stable-mp-1',
    latitude: 40.7128,
    longitude: -74.006,
    rating_average: 4.7,
    review_count: 20,
    address_city: 'Manhattan',
    phone: '(555) 333-4444',
    services: ['Criminal Defense'],
    specialty: 'Criminal Defense',
    is_verified: true,
    ...overrides,
  }
}

// =====================================================================
//  Map.tsx
// =====================================================================

describe('Map component', () => {
  it('renders map container (mocked leaflet loads synchronously)', () => {
    // In jsdom with mocked react-leaflet, useEffect fires synchronously
    // so isMounted becomes true immediately -> MapContainer renders
    render(
      <Map
        providers={[]}
        center={[40.7128, -74.006]}
      />
    )
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('renders map container after mount', async () => {
    render(
      <Map
        providers={[]}
        center={[40.7128, -74.006]}
      />
    )
    // useEffect sets isMounted -> re-renders with MapContainer
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })
  })

  it('renders tile layer', async () => {
    render(
      <Map
        providers={[]}
        center={[40.7128, -74.006]}
      />
    )
    await waitFor(() => {
      expect(screen.getByTestId('tile-layer')).toBeInTheDocument()
    })
  })

  it('renders markers for providers with valid coordinates', async () => {
    const providers = [
      mockLegacyProvider({ id: 'p1', latitude: 40.71, longitude: -74.0 }),
      mockLegacyProvider({ id: 'p2', latitude: 40.72, longitude: -74.01 }),
    ]
    render(
      <Map
        providers={providers as never[]}
        center={[40.7128, -74.006]}
      />
    )
    await waitFor(() => {
      const markers = screen.getAllByTestId('map-marker')
      expect(markers).toHaveLength(2)
    })
  })

  it('filters out providers with missing coordinates', async () => {
    const providers = [
      mockLegacyProvider({ id: 'p1', latitude: 40.71, longitude: -74.0 }),
      mockLegacyProvider({ id: 'p2', latitude: null, longitude: null }),
      mockLegacyProvider({ id: 'p3', latitude: undefined, longitude: undefined }),
    ]
    render(
      <Map
        providers={providers as never[]}
        center={[40.7128, -74.006]}
      />
    )
    await waitFor(() => {
      const markers = screen.getAllByTestId('map-marker')
      expect(markers).toHaveLength(1)
    })
  })

  it('filters out providers with NaN coordinates', async () => {
    const providers = [
      mockLegacyProvider({ id: 'p1', latitude: NaN, longitude: NaN }),
    ]
    render(
      <Map
        providers={providers as never[]}
        center={[40.7128, -74.006]}
      />
    )
    await waitFor(() => {
      expect(screen.queryByTestId('map-marker')).not.toBeInTheDocument()
    })
  })

  it('handles empty providers array', async () => {
    render(
      <Map
        providers={[]}
        center={[40.7128, -74.006]}
      />
    )
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
      expect(screen.queryByTestId('map-marker')).not.toBeInTheDocument()
    })
  })

  it('renders popup with provider name', async () => {
    const providers = [mockLegacyProvider({ name: 'Alice Attorney' })]
    render(
      <Map
        providers={providers as never[]}
        center={[40.7128, -74.006]}
      />
    )
    await waitFor(() => {
      expect(screen.getByText('Alice Attorney')).toBeInTheDocument()
    })
  })

  it('renders popup with city and zip', async () => {
    const providers = [mockLegacyProvider({ address_city: 'Chicago', address_zip: '60601' })]
    render(
      <Map
        providers={providers as never[]}
        center={[40.7128, -74.006]}
      />
    )
    await waitFor(() => {
      expect(screen.getByText('60601 Chicago')).toBeInTheDocument()
    })
  })

  it('renders phone link in popup when provider has phone', async () => {
    const providers = [mockLegacyProvider({ phone: '(312) 555-0199' })]
    render(
      <Map
        providers={providers as never[]}
        center={[40.7128, -74.006]}
      />
    )
    await waitFor(() => {
      const phoneLink = screen.getByText('(312) 555-0199')
      expect(phoneLink.closest('a')).toHaveAttribute('href', 'tel:(312) 555-0199')
    })
  })

  it('calls onMarkerClick when marker is clicked', async () => {
    const handleClick = vi.fn()
    const providers = [mockLegacyProvider()]
    render(
      <Map
        providers={providers as never[]}
        center={[40.7128, -74.006]}
        onMarkerClick={handleClick}
      />
    )
    await waitFor(() => {
      const marker = screen.getByTestId('map-marker')
      fireEvent.click(marker)
    })
    expect(handleClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'prov-1' }))
  })

  it('uses default zoom of 12', async () => {
    render(
      <Map
        providers={[]}
        center={[40.7128, -74.006]}
      />
    )
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })
  })
})

// =====================================================================
//  MapResultsList — DesktopResultsSidebar
// =====================================================================

describe('DesktopResultsSidebar', () => {
  const defaultProps = {
    providers: [] as MapProvider[],
    loading: false,
    selectedProvider: null,
    hoveredProvider: null,
    viewMode: 'split' as const,
    favorites: new Set<string>(),
    listRef: { current: null },
    onSelectProvider: vi.fn(),
    onHoverProvider: vi.fn(),
    onToggleFavorite: vi.fn(),
  }

  it('renders attorney count', () => {
    const providers = [mockMapProvider({ id: 'a' }), mockMapProvider({ id: 'b' })]
    render(<DesktopResultsSidebar {...defaultProps} providers={providers} />)
    expect(screen.getByText('2 attorneys')).toBeInTheDocument()
    expect(screen.getByText('in this area')).toBeInTheDocument()
  })

  it('renders provider names in the list', () => {
    const providers = [
      mockMapProvider({ id: '1', name: 'Alice Brown' }),
      mockMapProvider({ id: '2', name: 'Bob White' }),
    ]
    render(<DesktopResultsSidebar {...defaultProps} providers={providers} />)
    expect(screen.getByText('Alice Brown')).toBeInTheDocument()
    expect(screen.getByText('Bob White')).toBeInTheDocument()
  })

  it('shows loading spinner when loading is true', () => {
    render(<DesktopResultsSidebar {...defaultProps} loading={true} />)
    expect(screen.getByTestId('icon-Loader2')).toBeInTheDocument()
  })

  it('shows empty state when providers is empty and not loading', () => {
    render(<DesktopResultsSidebar {...defaultProps} providers={[]} loading={false} />)
    expect(screen.getByText('No attorneys found')).toBeInTheDocument()
    expect(screen.getByText('Move the map or adjust your filters')).toBeInTheDocument()
  })

  it('shows loading skeletons when loading with no providers', () => {
    const { container } = render(
      <DesktopResultsSidebar {...defaultProps} providers={[]} loading={true} />
    )
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders verified badge for verified providers', () => {
    const providers = [mockMapProvider({ is_verified: true })]
    render(<DesktopResultsSidebar {...defaultProps} providers={providers} />)
    expect(screen.getByText('Verified')).toBeInTheDocument()
  })

  it('does not render verified badge for unverified providers', () => {
    const providers = [mockMapProvider({ is_verified: false })]
    render(<DesktopResultsSidebar {...defaultProps} providers={providers} />)
    expect(screen.queryByText('Verified')).not.toBeInTheDocument()
  })

  it('shows phone button when provider has phone', () => {
    const providers = [mockMapProvider({ phone: '(555) 111-2222' })]
    render(<DesktopResultsSidebar {...defaultProps} providers={providers} />)
    const phoneLink = screen.getByRole('link', { name: '' }) // the phone <a> has no text, just icon
    // Check at least one link has tel:
    const allLinks = screen.getAllByRole('link')
    const telLink = allLinks.find(l => l.getAttribute('href')?.startsWith('tel:'))
    expect(telLink).toBeDefined()
  })

  it('hides phone button when provider has no phone', () => {
    const providers = [mockMapProvider({ phone: undefined })]
    render(<DesktopResultsSidebar {...defaultProps} providers={providers} />)
    const allLinks = screen.getAllByRole('link')
    const telLink = allLinks.find(l => l.getAttribute('href')?.startsWith('tel:'))
    expect(telLink).toBeUndefined()
  })

  it('renders "View profile" link for each provider', () => {
    const providers = [mockMapProvider({ id: '1', name: 'Test Attorney' })]
    render(<DesktopResultsSidebar {...defaultProps} providers={providers} />)
    expect(screen.getByText('View profile')).toBeInTheDocument()
  })

  it('does not render when viewMode is map', () => {
    const providers = [mockMapProvider()]
    const { container } = render(
      <DesktopResultsSidebar {...defaultProps} providers={providers} viewMode="map" />
    )
    expect(screen.queryByText('attorneys')).not.toBeInTheDocument()
  })

  it('renders rating and review count', () => {
    const providers = [mockMapProvider({ rating_average: 4.9, review_count: 50 })]
    render(<DesktopResultsSidebar {...defaultProps} providers={providers} />)
    expect(screen.getByText('4.9')).toBeInTheDocument()
    expect(screen.getByText('(50)')).toBeInTheDocument()
  })

  it('renders specialty text', () => {
    const providers = [mockMapProvider({ specialty: 'Family Law' })]
    render(<DesktopResultsSidebar {...defaultProps} providers={providers} />)
    expect(screen.getByText('Family Law')).toBeInTheDocument()
  })

  it('renders "Attorney" when specialty is missing', () => {
    const providers = [mockMapProvider({ specialty: undefined })]
    render(<DesktopResultsSidebar {...defaultProps} providers={providers} />)
    expect(screen.getByText('Attorney')).toBeInTheDocument()
  })

  it('calls onToggleFavorite when heart button clicked', () => {
    const onToggleFavorite = vi.fn()
    const providers = [mockMapProvider({ id: 'fav-1' })]
    render(
      <DesktopResultsSidebar
        {...defaultProps}
        providers={providers}
        onToggleFavorite={onToggleFavorite}
      />
    )
    // Find the heart button (contains Heart icon)
    const heartButtons = screen.getAllByRole('button')
    const heartBtn = heartButtons.find(btn => btn.querySelector('[data-testid="icon-Heart"]'))
    expect(heartBtn).toBeDefined()
    fireEvent.click(heartBtn!)
    expect(onToggleFavorite).toHaveBeenCalledWith('fav-1')
  })

  it('shows filled heart for favorited providers', () => {
    const providers = [mockMapProvider({ id: 'fav-1' })]
    const favorites = new Set(['fav-1'])
    render(
      <DesktopResultsSidebar {...defaultProps} providers={providers} favorites={favorites} />
    )
    const heartIcon = screen.getByTestId('icon-Heart')
    expect(heartIcon.className).toContain('fill-red-500')
  })

  it('renders city with MapPin icon', () => {
    const providers = [mockMapProvider({ address_city: 'Brooklyn' })]
    render(<DesktopResultsSidebar {...defaultProps} providers={providers} />)
    expect(screen.getByText('Brooklyn')).toBeInTheDocument()
  })
})

// =====================================================================
//  MapResultsList — MobileResultsToggle
// =====================================================================

describe('MobileResultsToggle', () => {
  it('renders attorney count', () => {
    render(
      <MobileResultsToggle
        attorneyCount={15}
        mobileDrawerOpen={false}
        onToggle={vi.fn()}
      />
    )
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('attorneys found')).toBeInTheDocument()
  })

  it('shows ChevronUp when drawer is closed', () => {
    render(
      <MobileResultsToggle
        attorneyCount={5}
        mobileDrawerOpen={false}
        onToggle={vi.fn()}
      />
    )
    expect(screen.getByTestId('icon-ChevronUp')).toBeInTheDocument()
  })

  it('shows ChevronDown when drawer is open', () => {
    render(
      <MobileResultsToggle
        attorneyCount={5}
        mobileDrawerOpen={true}
        onToggle={vi.fn()}
      />
    )
    expect(screen.getByTestId('icon-ChevronDown')).toBeInTheDocument()
  })

  it('calls onToggle when button clicked', () => {
    const onToggle = vi.fn()
    render(
      <MobileResultsToggle
        attorneyCount={5}
        mobileDrawerOpen={false}
        onToggle={onToggle}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('renders zero count correctly', () => {
    render(
      <MobileResultsToggle
        attorneyCount={0}
        mobileDrawerOpen={false}
        onToggle={vi.fn()}
      />
    )
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})

// =====================================================================
//  MapResultsList — MobileResultsDrawer
// =====================================================================

describe('MobileResultsDrawer', () => {
  it('renders provider list when open', () => {
    const providers = [
      mockMapProvider({ id: '1', name: 'Alice' }),
      mockMapProvider({ id: '2', name: 'Bob' }),
    ]
    render(
      <MobileResultsDrawer
        providers={providers}
        mobileDrawerOpen={true}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    const providers = [mockMapProvider({ id: '1', name: 'Alice' })]
    render(
      <MobileResultsDrawer
        providers={providers}
        mobileDrawerOpen={false}
        onClose={vi.fn()}
      />
    )
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('shows provider count in header', () => {
    const providers = [mockMapProvider({ id: '1' }), mockMapProvider({ id: '2' })]
    render(
      <MobileResultsDrawer
        providers={providers}
        mobileDrawerOpen={true}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText('2 attorneys')).toBeInTheDocument()
  })

  it('calls onClose when X button clicked', () => {
    const onClose = vi.fn()
    render(
      <MobileResultsDrawer
        providers={[mockMapProvider()]}
        mobileDrawerOpen={true}
        onClose={onClose}
      />
    )
    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders provider initials as avatar', () => {
    const providers = [mockMapProvider({ name: 'Zara Kingsley' })]
    render(
      <MobileResultsDrawer
        providers={providers}
        mobileDrawerOpen={true}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText('Z')).toBeInTheDocument()
  })

  it('renders specialty for each provider', () => {
    const providers = [mockMapProvider({ specialty: 'Tax Law' })]
    render(
      <MobileResultsDrawer
        providers={providers}
        mobileDrawerOpen={true}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText('Tax Law')).toBeInTheDocument()
  })

  it('renders rating for each provider', () => {
    const providers = [mockMapProvider({ rating_average: 4.3 })]
    render(
      <MobileResultsDrawer
        providers={providers}
        mobileDrawerOpen={true}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText('4.3')).toBeInTheDocument()
  })

  it('handles empty providers array when open', () => {
    render(
      <MobileResultsDrawer
        providers={[]}
        mobileDrawerOpen={true}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText('0 attorneys')).toBeInTheDocument()
  })
})

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, ChevronUp, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from '@/lib/utils';

interface Publication {
  id: number;
  name: string;
  image: string;
  genres: string[];
  price: number;
  da: number;
  tat: string;
  region: string;
  sponsored: boolean;
  indexed: boolean;
  do_follow: boolean;
  example_image: boolean;
  niches: string[];
  type: string;
  lifespan: string;
  mention_type: string;
  status: string;
  has_image: boolean;
}

interface TableData {
  publications: Publication[];
  filters: {
    genres: string[];
    regions: string[];
    types: string[];
    lifespans: string[];
    sponsored: string[];
    indexed: string[];
    do_follow: string[];
    niches: string[];
  };
  columns: string[];
}

// Logo display component with enhanced fallback badge
const LogoDisplay: React.FC<{ src: string; alt: string; size: 'sm' | 'md' }> = ({ src, alt, size }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [errored, setErrored] = useState(false);
  
  const initials = useMemo(() => {
    const words = alt.split(' ').filter(Boolean);
    if (words.length >= 2) return words[0][0] + words[1][0];
    if (words.length === 1) return words[0][0];
    return '?';
  }, [alt]);

  useEffect(() => {
    setImgSrc(src);
    setErrored(false);
  }, [src]);

  if (errored || !imgSrc) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded font-bold',
          'bg-gradient-to-br from-blue-500 to-teal-500 text-white',
          'shadow-sm border border-blue-600/20',
          size === 'sm' ? 'h-10 w-10 text-base' : 'h-12 w-12 text-lg'
        )}
      >
        {initials.toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={cn(
        'rounded object-cover',
        size === 'sm' ? 'h-10 w-10' : 'h-12 w-12'
      )}
      onError={() => setErrored(true)}
    />
  );
};

export default function Home() {
  const [data, setData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedSponsored, setSelectedSponsored] = useState<string>('');
  const [selectedIndexed, setSelectedIndexed] = useState<string>('');
  const [selectedDoFollow, setSelectedDoFollow] = useState<string>('');
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(85000);
  const [sortColumn, setSortColumn] = useState<string>('price');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({
    price: true,
    genres: false,
    regions: false,
    sponsored: false,
    indexed: false,
    doFollow: false,
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'bestSellers'>('all');
  const [bestSellerSet, setBestSellerSet] = useState<Set<string> | null>(null);
  const [bestSellerLoading, setBestSellerLoading] = useState(false);
  const [bestSellerError, setBestSellerError] = useState<string | null>(null);

  const asideRef = useRef<HTMLElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const [filtersStyle, setFiltersStyle] = useState<{
    left?: string;
    width?: string;
    top?: string;
    maxHeight?: string;
  }>({});
  const [tableScrollStyle, setTableScrollStyle] = useState<{ maxHeight?: string }>({});

  // Calculate filters box position for fixed positioning (desktop only)
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 1024px)').matches) return;

    const updateFiltersPosition = () => {
      if (asideRef.current) {
        const rect = asideRef.current.getBoundingClientRect();
        const counterTopPx = counterRef.current?.getBoundingClientRect().top ?? 125;
        setFiltersStyle({
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          top: `${counterTopPx}px`,
          maxHeight: `calc(100vh - ${counterTopPx}px)`,
        });
      }
    };

    // Initial calculation
    updateFiltersPosition();
    
    // Recalculate on resize
    window.addEventListener('resize', updateFiltersPosition);
    window.addEventListener('scroll', updateFiltersPosition, true);
    
    // Also recalculate after a short delay to catch any layout shifts after data loads
    const timeoutId = setTimeout(updateFiltersPosition, 100);
    
    return () => {
      window.removeEventListener('resize', updateFiltersPosition);
      window.removeEventListener('scroll', updateFiltersPosition, true);
      clearTimeout(timeoutId);
    };
  }, [data]); // Recalculate when data loads (layout may change)

  // Calculate table scroll container height so only the database scrolls (sticky thead)
  useEffect(() => {
    const updateTableScrollHeight = () => {
      const counterBottomPx = counterRef.current?.getBoundingClientRect().bottom ?? 161;
      setTableScrollStyle({
        maxHeight: `calc(100vh - ${counterBottomPx}px)`,
      });
    };

    updateTableScrollHeight();
    window.addEventListener('resize', updateTableScrollHeight);
    const timeoutId = setTimeout(updateTableScrollHeight, 100);

    return () => {
      window.removeEventListener('resize', updateTableScrollHeight);
      clearTimeout(timeoutId);
    };
  }, [data]); // Recalculate when data loads

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Use the complete data file with deep extraction
        const response = await fetch('/table_data_complete.json');
        const jsonData = await response.json();
        setData(jsonData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load table data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const normalizeName = (s: string) =>
    s
      // split camelCase before lowercasing (e.g. VentureBeat -> Venture Beat)
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const ensureBestSellersLoaded = async () => {
    if (bestSellerSet || bestSellerLoading) return;
    try {
      setBestSellerLoading(true);
      setBestSellerError(null);
      const res = await fetch('/best_sellers.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load best sellers (${res.status})`);
      const json = await res.json();
      const names: string[] = Array.isArray(json?.names) ? json.names : [];
      setBestSellerSet(new Set(names.map(normalizeName)));
    } catch (e) {
      console.error(e);
      setBestSellerError('Could not load best sellers list.');
      setBestSellerSet(new Set());
    } finally {
      setBestSellerLoading(false);
    }
  };

  const handleResetAll = () => {
    resetFilters();
    setViewMode('all');
    setBestSellerError(null);
    // don't clear cached set; reuse it next time
  };

  const basePublications = useMemo(() => {
    if (!data) return [];
    if (viewMode !== 'bestSellers') return data.publications;
    if (!bestSellerSet) return data.publications;
    return data.publications.filter((p) => bestSellerSet.has(normalizeName(p.name)));
  }, [data, viewMode, bestSellerSet]);

  const baseCount = basePublications.length;

  const bestSellerMissingCount = useMemo(() => {
    if (viewMode !== 'bestSellers' || !bestSellerSet || !data) return 0;
    const all = new Set(data.publications.map((p) => normalizeName(p.name)));
    let missing = 0;
    for (const n of bestSellerSet) if (!all.has(n)) missing++;
    return missing;
  }, [viewMode, bestSellerSet, data]);

  // Filter and sort publications
  const filteredPublications = useMemo(() => {
    if (!data) return [];

    let filtered = basePublications.filter((pub) => {
      // Search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = pub.name.toLowerCase().includes(term);
        const matchesGenre = pub.genres.some((g) =>
          g.toLowerCase().includes(term)
        );
        if (!matchesName && !matchesGenre) return false;
      }

      // Genre filter
      if (selectedGenres.length > 0) {
        const hasGenre = selectedGenres.some((g) => pub.genres.includes(g));
        if (!hasGenre) return false;
      }

      // Region filter
      if (selectedRegions.length > 0) {
        if (!selectedRegions.includes(pub.region)) return false;
      }

      // Price filter
      if (pub.price < priceMin || pub.price > priceMax) return false;

      // Sponsored filter
      if (selectedSponsored) {
        const isSponsored = selectedSponsored === 'Yes';
        if (pub.sponsored !== isSponsored) return false;
      }

      // Indexed filter
      if (selectedIndexed) {
        const isIndexed = selectedIndexed === 'Yes';
        if (pub.indexed !== isIndexed) return false;
      }

      // Do-follow filter
      if (selectedDoFollow) {
        const isDoFollow = selectedDoFollow === 'Yes';
        if (pub.do_follow !== isDoFollow) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Publication];
      let bVal: any = b[sortColumn as keyof Publication];

      // Handle null/undefined
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      // Special handling for TAT (Turnaround Time)
      if (sortColumn === 'tat') {
        // Convert TAT strings to comparable numbers (approximate days)
        const parseTAT = (tat: string) => {
          if (!tat) return 999; // Put empty at end
          const lower = tat.toLowerCase();
          if (lower.includes('day')) {
            const nums = lower.match(/\d+/);
            return nums ? parseInt(nums[0]) : 1;
          }
          if (lower.includes('week')) {
            const nums = lower.match(/\d+/);
            return nums ? parseInt(nums[0]) * 7 : 7;
          }
          if (lower.includes('month')) {
            const nums = lower.match(/\d+/);
            return nums ? parseInt(nums[0]) * 30 : 30;
          }
          return 999;
        };
        
        aVal = parseTAT(String(aVal));
        bVal = parseTAT(String(bVal));
      }
      // Handle strings
      else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    data,
    viewMode,
    bestSellerSet,
    basePublications,
    searchTerm,
    selectedGenres,
    selectedRegions,
    priceMin,
    priceMax,
    selectedSponsored,
    selectedIndexed,
    selectedDoFollow,
    sortColumn,
    sortDirection,
  ]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedGenres([]);
    setSelectedRegions([]);
    setPriceMin(0);
    setPriceMax(85000);
    setSelectedSponsored('');
    setSelectedIndexed('');
    setSelectedDoFollow('');
  };

  const activeFiltersCount =
    selectedGenres.length +
    selectedRegions.length +
    (selectedSponsored ? 1 : 0) +
    (selectedIndexed ? 1 : 0) +
    (selectedDoFollow ? 1 : 0);

  const FiltersPanel = (
    <div className="space-y-4">
      {/* Price Filter - Moved to Top */}
      <div>
        <button
          onClick={() =>
            setExpandedFilters((prev) => ({
              ...prev,
              price: !prev.price,
            }))
          }
          className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-900 hover:text-primary transition-colors"
        >
          <span>Price Range</span>
          {expandedFilters.price ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedFilters.price && (
          <div className="mt-4 space-y-3 pl-2">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Min: ${priceMin.toLocaleString()}
              </label>
              <input
                type="range"
                min="0"
                max="85000"
                value={priceMin}
                onChange={(e) => setPriceMin(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Max: ${priceMax.toLocaleString()}
              </label>
              <input
                type="range"
                min="0"
                max="85000"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* Genres Filter */}
      <div className="border-t border-slate-200 pt-4">
        <button
          onClick={() =>
            setExpandedFilters((prev) => ({
              ...prev,
              genres: !prev.genres,
            }))
          }
          className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-900 hover:text-primary transition-colors"
        >
          <span>Genres</span>
          {expandedFilters.genres ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedFilters.genres && (
          <div className="mt-2 space-y-2 pl-2 max-h-48 overflow-y-auto">
            {data?.filters.genres.map((genre) => (
              <label
                key={genre}
                className="flex items-center space-x-2 cursor-pointer group relative"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(genre)}
                    onChange={() => toggleGenre(genre)}
                    className="w-4 h-4 bg-white border border-[#9da6b3] appearance-none focus:ring-primary cursor-pointer rounded"
                  />
                  {selectedGenres.includes(genre) && (
                    <span className="absolute left-0 top-0 w-4 h-4 flex items-center justify-center text-black text-xs font-bold pointer-events-none">
                      ✓
                    </span>
                  )}
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  {genre}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Regions Filter */}
      <div className="border-t border-slate-200 pt-4">
        <button
          onClick={() =>
            setExpandedFilters((prev) => ({
              ...prev,
              regions: !prev.regions,
            }))
          }
          className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-900 hover:text-primary transition-colors"
        >
          <span>Regions</span>
          {expandedFilters.regions ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedFilters.regions && (
          <div className="mt-2 space-y-2 pl-2 max-h-48 overflow-y-auto">
            {data?.filters.regions.map((region) => (
              <label
                key={region}
                className="flex items-center space-x-2 cursor-pointer group relative"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={selectedRegions.includes(region)}
                    onChange={() => toggleRegion(region)}
                    className="w-4 h-4 bg-white border border-[#9da6b3] appearance-none focus:ring-primary cursor-pointer rounded"
                  />
                  {selectedRegions.includes(region) && (
                    <span className="absolute left-0 top-0 w-4 h-4 flex items-center justify-center text-black text-xs font-bold pointer-events-none">
                      ✓
                    </span>
                  )}
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  {region}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Sponsored Filter */}
      <div className="border-t border-slate-200 pt-4">
        <button
          onClick={() =>
            setExpandedFilters((prev) => ({
              ...prev,
              sponsored: !prev.sponsored,
            }))
          }
          className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-900 hover:text-primary transition-colors"
        >
          <span>Sponsored</span>
          {expandedFilters.sponsored ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedFilters.sponsored && (
          <div className="mt-2 space-y-2 pl-2">
            {['Yes', 'No'].map((option) => (
              <label
                key={option}
                className="flex items-center space-x-2 cursor-pointer group relative"
              >
                <div className="relative">
                  <input
                    type="radio"
                    name="sponsored"
                    value={option}
                    checked={selectedSponsored === option}
                    onChange={(e) => setSelectedSponsored(e.target.value)}
                    className="w-4 h-4 bg-white border border-[#9da6b3] appearance-none focus:ring-primary cursor-pointer rounded"
                  />
                  {selectedSponsored === option && (
                    <span className="absolute left-0 top-0 w-4 h-4 flex items-center justify-center text-black text-xs font-bold pointer-events-none">
                      ✓
                    </span>
                  )}
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  {option}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Indexed Filter */}
      <div className="border-t border-slate-200 pt-4">
        <button
          onClick={() =>
            setExpandedFilters((prev) => ({
              ...prev,
              indexed: !prev.indexed,
            }))
          }
          className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-900 hover:text-primary transition-colors"
        >
          <span>Indexed</span>
          {expandedFilters.indexed ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedFilters.indexed && (
          <div className="mt-2 space-y-2 pl-2">
            {['Yes', 'No'].map((option) => (
              <label
                key={option}
                className="flex items-center space-x-2 cursor-pointer group relative"
              >
                <div className="relative">
                  <input
                    type="radio"
                    name="indexed"
                    value={option}
                    checked={selectedIndexed === option}
                    onChange={(e) => setSelectedIndexed(e.target.value)}
                    className="w-4 h-4 bg-white border border-[#9da6b3] appearance-none focus:ring-primary cursor-pointer rounded"
                  />
                  {selectedIndexed === option && (
                    <span className="absolute left-0 top-0 w-4 h-4 flex items-center justify-center text-black text-xs font-bold pointer-events-none">
                      ✓
                    </span>
                  )}
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  {option}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Backlink Filter */}
      <div className="border-t border-slate-200 pt-4">
        <button
          onClick={() =>
            setExpandedFilters((prev) => ({
              ...prev,
              doFollow: !prev.doFollow,
            }))
          }
          className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-900 hover:text-primary transition-colors"
        >
          <span>Backlink</span>
          {expandedFilters.doFollow ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedFilters.doFollow && (
          <div className="mt-2 space-y-2 pl-2">
            {['Yes', 'No'].map((option) => (
              <label
                key={option}
                className="flex items-center space-x-2 cursor-pointer group relative"
              >
                <div className="relative">
                  <input
                    type="radio"
                    name="doFollow"
                    value={option}
                    checked={selectedDoFollow === option}
                    onChange={(e) => setSelectedDoFollow(e.target.value)}
                    className="w-4 h-4 bg-white border border-[#9da6b3] appearance-none focus:ring-primary cursor-pointer rounded"
                  />
                  {selectedDoFollow === option && (
                    <span className="absolute left-0 top-0 w-4 h-4 flex items-center justify-center text-black text-xs font-bold pointer-events-none">
                      ✓
                    </span>
                  )}
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  {option}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading publications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-full px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-start gap-8 mb-6">
                <div className="flex flex-col items-start gap-4">
                  <img
                    src="/images/1st-impression-media-list.png"
                    alt="1st Impression Media List"
                    className="h-20"
                  />
                  <img
                    src="/images/pricing1.svg"
                    alt="Pricing"
                    className="h-20"
                  />
                </div>
              </div>
              <p className="text-slate-600">
                Browse {baseCount} publications
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('ascendAuth');
                  window.location.href = '/login';
                }}
                className="text-sm font-medium"
              >
                Log out
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4486EC]" />
            <Input
              type="text"
              placeholder="Search by publication..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-2 w-full border-slate-300 focus:border-primary focus:ring-primary"
            />
          </div>

          {/* Mobile Filters Button */}
          <div className="mt-3 lg:hidden">
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Filters</span>
                  <span className="text-slate-600 text-sm">
                    {activeFiltersCount > 0 ? `${activeFiltersCount} active` : 'None'}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0">
                <SheetHeader className="border-b border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <SheetTitle>Filters</SheetTitle>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleResetAll();
                          setMobileFiltersOpen(false);
                        }}
                        className="h-7 px-2 text-xs font-medium"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>
                </SheetHeader>
                <div className="p-4 overflow-y-auto overscroll-contain appScroll">
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await ensureBestSellersLoaded();
                        setViewMode('bestSellers');
                        setMobileFiltersOpen(false);
                      }}
                      disabled={bestSellerLoading}
                      className="text-sm font-medium"
                    >
                      Best Sellers
                    </Button>
                  </div>
                  {bestSellerError && (
                    <div className="text-xs text-red-600 mb-2">{bestSellerError}</div>
                  )}
                  {viewMode === 'bestSellers' && bestSellerSet && bestSellerMissingCount > 0 && (
                    <div className="text-xs text-amber-700 mb-2">
                      {bestSellerMissingCount} best-seller name(s) didn’t match any publication in the dataset.
                    </div>
                  )}
                  {FiltersPanel}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="max-w-full px-4 py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
          {/* Filters Sidebar */}
          <aside ref={asideRef} className="hidden lg:block">
            <div 
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 fixed overflow-y-auto overscroll-contain z-20 appScroll"
              style={filtersStyle}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetAll}
                  className="h-7 px-2 text-xs font-medium"
                >
                  <X className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>

              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await ensureBestSellersLoaded();
                    setViewMode('bestSellers');
                  }}
                  disabled={bestSellerLoading}
                  className="text-sm font-medium"
                >
                  Best Sellers
                </Button>
              </div>
              {bestSellerError && (
                <div className="text-xs text-red-600 mb-2">{bestSellerError}</div>
              )}
              {viewMode === 'bestSellers' && bestSellerSet && bestSellerMissingCount > 0 && (
                <div className="text-xs text-amber-700 mb-2">
                  {bestSellerMissingCount} best-seller name(s) didn’t match any publication in the dataset.
                </div>
              )}

              <div className="space-y-4">
                {/* Price Filter - Moved to Top */}
                <div>
                  <button
                    onClick={() =>
                      setExpandedFilters((prev) => ({
                        ...prev,
                        price: !prev.price,
                      }))
                    }
                    className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-900 hover:text-primary transition-colors"
                  >
                    <span>Price Range</span>
                    {expandedFilters.price ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedFilters.price && (
                    <div className="mt-4 space-y-3 pl-2">
                      <div>
                        <label className="text-xs font-medium text-slate-600">
                          Min: ${priceMin.toLocaleString()}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="85000"
                          value={priceMin}
                          onChange={(e) => setPriceMin(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">
                          Max: ${priceMax.toLocaleString()}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="85000"
                          value={priceMax}
                          onChange={(e) => setPriceMax(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Genres Filter */}
                <div className="border-t border-slate-200 pt-4">
                  <button
                    onClick={() =>
                      setExpandedFilters((prev) => ({
                        ...prev,
                        genres: !prev.genres,
                      }))
                    }
                    className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-900 hover:text-primary transition-colors"
                  >
                    <span>Genres</span>
                    {expandedFilters.genres ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedFilters.genres && (
                    <div className="mt-2 space-y-2 pl-2">
                      {data?.filters.genres.map((genre) => (
                        <label
                          key={genre}
                          className="flex items-center space-x-2 cursor-pointer group relative"
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedGenres.includes(genre)}
                              onChange={() => toggleGenre(genre)}
                              className="w-4 h-4 bg-white border border-[#9da6b3] appearance-none focus:ring-primary cursor-pointer rounded"
                            />
                            {selectedGenres.includes(genre) && (
                              <span className="absolute left-0 top-0 w-4 h-4 flex items-center justify-center text-black text-xs font-bold pointer-events-none">
                                ✓
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                            {genre}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Regions Filter */}
                <div className="border-t border-slate-200 pt-4">
                  <button
                    onClick={() =>
                      setExpandedFilters((prev) => ({
                        ...prev,
                        regions: !prev.regions,
                      }))
                    }
                    className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-900 hover:text-primary transition-colors"
                  >
                    <span>Regions</span>
                    {expandedFilters.regions ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedFilters.regions && (
                    <div className="mt-2 space-y-2 pl-2">
                      {data?.filters.regions.map((region) => (
                        <label
                          key={region}
                          className="flex items-center space-x-2 cursor-pointer group relative"
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedRegions.includes(region)}
                              onChange={() => toggleRegion(region)}
                              className="w-4 h-4 bg-white border border-[#9da6b3] appearance-none focus:ring-primary cursor-pointer rounded"
                            />
                            {selectedRegions.includes(region) && (
                              <span className="absolute left-0 top-0 w-4 h-4 flex items-center justify-center text-black text-xs font-bold pointer-events-none">
                                ✓
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                            {region}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sponsored Filter */}
                <div className="border-t border-slate-200 pt-4">
                  <button
                    onClick={() =>
                      setExpandedFilters((prev) => ({
                        ...prev,
                        sponsored: !prev.sponsored,
                      }))
                    }
                    className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-900 hover:text-primary transition-colors"
                  >
                    <span>Sponsored</span>
                    {expandedFilters.sponsored ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedFilters.sponsored && (
                    <div className="mt-2 space-y-2 pl-2">
                      {['Yes', 'No'].map((option) => (
                        <label
                          key={option}
                          className="flex items-center space-x-2 cursor-pointer group relative"
                        >
                          <div className="relative">
                            <input
                              type="radio"
                              name="sponsored"
                              value={option}
                              checked={selectedSponsored === option}
                              onChange={(e) => setSelectedSponsored(e.target.value)}
                              className="w-4 h-4 bg-white border border-[#9da6b3] appearance-none focus:ring-primary cursor-pointer rounded"
                            />
                            {selectedSponsored === option && (
                              <span className="absolute left-0 top-0 w-4 h-4 flex items-center justify-center text-black text-xs font-bold pointer-events-none">
                                ✓
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Indexed Filter */}
                <div className="border-t border-slate-200 pt-4">
                  <button
                    onClick={() =>
                      setExpandedFilters((prev) => ({
                        ...prev,
                        indexed: !prev.indexed,
                      }))
                    }
                    className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-900 hover:text-primary transition-colors"
                  >
                    <span>Indexed</span>
                    {expandedFilters.indexed ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedFilters.indexed && (
                    <div className="mt-2 space-y-2 pl-2">
                      {['Yes', 'No'].map((option) => (
                        <label
                          key={option}
                          className="flex items-center space-x-2 cursor-pointer group relative"
                        >
                          <div className="relative">
                            <input
                              type="radio"
                              name="indexed"
                              value={option}
                              checked={selectedIndexed === option}
                              onChange={(e) => setSelectedIndexed(e.target.value)}
                              className="w-4 h-4 bg-white border border-[#9da6b3] appearance-none focus:ring-primary cursor-pointer rounded"
                            />
                            {selectedIndexed === option && (
                              <span className="absolute left-0 top-0 w-4 h-4 flex items-center justify-center text-black text-xs font-bold pointer-events-none">
                                ✓
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Backlink Filter */}
                <div className="border-t border-slate-200 pt-4">
                  <button
                    onClick={() =>
                      setExpandedFilters((prev) => ({
                        ...prev,
                        doFollow: !prev.doFollow,
                      }))
                    }
                    className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-900 hover:text-primary transition-colors"
                  >
                    <span>Backlink</span>
                    {expandedFilters.doFollow ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedFilters.doFollow && (
                    <div className="mt-2 space-y-2 pl-2">
                      {['Yes', 'No'].map((option) => (
                        <label
                          key={option}
                          className="flex items-center space-x-2 cursor-pointer group relative"
                        >
                          <div className="relative">
                            <input
                              type="radio"
                              name="doFollow"
                              value={option}
                              checked={selectedDoFollow === option}
                              onChange={(e) => setSelectedDoFollow(e.target.value)}
                              className="w-4 h-4 bg-white border border-[#9da6b3] appearance-none focus:ring-primary cursor-pointer rounded"
                            />
                            {selectedDoFollow === option && (
                              <span className="absolute left-0 top-0 w-4 h-4 flex items-center justify-center text-black text-xs font-bold pointer-events-none">
                                ✓
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Table Section */}
          <main className="min-w-0">
            {/* Dynamic Publication Counter - Sticky */}
            <div
              ref={counterRef}
              className="mb-0 sticky top-[120px] sm:top-[125px] lg:top-[135px] z-20 bg-gradient-to-br from-slate-50 to-slate-100 pb-2 -mx-4 px-4"
            >
              <h2 className="text-base lg:text-lg font-semibold text-slate-900">
                Showing {filteredPublications.length} of {baseCount} Publications
              </h2>
            </div>

            {/* Results */}
            {filteredPublications.length > 0 ? (
              <>
                {/* Mobile cards */}
                <div className="lg:hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-900">Sort</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Sort options
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSort('price', 'desc')}>Price: High-to-Low</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('price', 'asc')}>Price: Low-to-High</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('name', 'asc')}>Publication: A-Z</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('name', 'desc')}>Publication: Z-A</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('tat', 'asc')}>TAT: Quickest-to-Slowest</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('tat', 'desc')}>TAT: Slowest-to-Quickest</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    {filteredPublications.map((pub) => (
                      <div
                        key={pub.id}
                        className="bg-white rounded-lg border border-slate-200 shadow-sm p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="shrink-0">
                            <LogoDisplay src={pub.image} alt={pub.name} size="md" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 leading-snug break-words">
                                  {pub.name}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {(pub.genres || []).slice(0, 4).map((g) => (
                                    <Badge key={g} variant="outline" className="text-[10px]">
                                      {g}
                                    </Badge>
                                  ))}
                                  {pub.genres.length > 4 && (
                                    <span className="text-[10px] text-slate-500">
                                      +{pub.genres.length - 4}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="text-primary font-semibold">
                                  ${pub.price.toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500">Price</div>
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-500">DA</span>
                                <span className="font-medium text-slate-900">{pub.da || '-'}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-500">TAT</span>
                                <span className="font-medium text-slate-900">{pub.tat || '-'}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-500">Region</span>
                                <span className="font-medium text-slate-900 truncate">{pub.region || '-'}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-500">Sponsored</span>
                                <span className="font-medium text-slate-900">
                                  {pub.sponsored ? '✓' : '-'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-500">Indexed</span>
                                <span className="font-medium text-slate-900">
                                  {pub.indexed ? '✓' : '-'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-500">Backlink</span>
                                <span className="font-medium text-slate-900">
                                  {pub.do_follow ? '✓' : '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop table */}
                <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="overflow-y-auto overscroll-contain appScroll" style={tableScrollStyle}>
                      <table className="w-full table-fixed">
                      <colgroup>
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '256px' }} />
                        <col style={{ width: '192px' }} />
                        <col style={{ width: '96px' }} />
                        <col style={{ width: '64px' }} />
                        <col style={{ width: '128px' }} />
                        <col style={{ width: '128px' }} />
                        <col style={{ width: '112px' }} />
                        <col style={{ width: '96px' }} />
                        <col style={{ width: '96px' }} />
                      </colgroup>

                      <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                        <tr>
                          <th className="px-4 py-4 text-left text-base font-semibold text-slate-900 align-middle">
                          </th>
                          <th className="px-4 py-4 text-left text-base font-semibold text-slate-900 align-middle">
                            <div className="flex items-center gap-2">
                              Publication
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem onClick={() => handleSort('name', 'asc')}>
                                    Sort A-Z
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSort('name', 'desc')}>
                                    Sort Z-A
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </th>
                          <th className="px-4 py-4 text-center text-base font-semibold text-slate-900 align-middle">
                            Genres
                          </th>
                          <th className="px-4 py-4 text-center text-base font-semibold text-slate-900 align-middle">
                            <div className="flex items-center gap-2 justify-center">
                              Price
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem onClick={() => handleSort('price', 'asc')}>
                                    Low-to-High
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSort('price', 'desc')}>
                                    High-to-Low
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </th>
                          <th className="px-4 py-4 text-center text-base font-semibold text-slate-900 align-middle">
                            DA
                          </th>
                          <th className="px-4 py-4 text-center text-base font-semibold text-slate-900 align-middle">
                            <div className="flex items-center gap-2 justify-center">
                              TAT
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem onClick={() => handleSort('tat', 'asc')}>
                                    Quickest-to-Slowest
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSort('tat', 'desc')}>
                                    Slowest-to-Quickest
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </th>
                          <th className="px-4 py-4 text-center text-base font-semibold text-slate-900 align-middle">
                            Region
                          </th>
                          <th className="px-4 py-4 text-center text-base font-semibold text-slate-900 align-middle">
                            Sponsored
                          </th>
                          <th className="px-4 py-4 text-center text-base font-semibold text-slate-900 align-middle">
                            Indexed
                          </th>
                          <th className="px-4 py-4 text-center text-base font-semibold text-slate-900 align-middle">
                            Backlink
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                      {filteredPublications.map((pub, idx) => (
                      <tr
                        key={pub.id}
                        className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <LogoDisplay src={pub.image} alt={pub.name} size="sm" />
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {pub.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-center">
                          {pub.genres.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {pub.genres.map((genre) => (
                                <Badge
                                  key={genre}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {genre}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-primary text-center">
                          ${pub.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium text-center">
                          {pub.da || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium text-center">
                          {pub.tat || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-center">
                          {pub.region || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {pub.sponsored ? (
                            <span className="text-green-600 font-semibold">✓</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {pub.indexed ? (
                            <span className="text-green-600 font-semibold">✓</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {pub.do_follow ? (
                            <span className="text-green-600 font-semibold">✓</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                      </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-600 text-lg mb-4">
                  No publications found matching your filters.
                </p>
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="text-primary"
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

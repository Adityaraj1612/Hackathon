import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DangerZoneMap } from "@/components/DangerZoneMap";
import { EmergencyAlertModal } from "@/components/EmergencyAlertModal";
import { PeriodicSafetyCheck } from "@/components/PeriodicSafetyCheck";
import { DangerZoneAlertModal } from "@/components/DangerZoneAlertModal";
import { useLocationSafety } from "@/hooks/use-location-safety";
import { useDangerZoneAlert } from "@/hooks/use-danger-zone-alert";
import { audioManager } from "@/lib/audio-utils";
import { 
  Search, 
  ExternalLink, 
  Filter, 
  ShieldCheck, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  MapPin,
  TrendingUp,
  Users,
  Navigation
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CrimeData {
  state: string;
  district?: string;
  year: number;
  rape: number;
  kidnapping: number;
  dowryDeath: number;
  assaultOnWomen: number;
  assaultOnModesty: number;
  domesticViolence: number;
  trafficking: number;
  totalCrimes: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  highestCrimeType: string;
  highestCrimeCount: number;
  location: { lat: number; lng: number };
}

function WomenSafety() {
  const [activeTab, setActiveTab] = useState('risk-zones');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [safeZones, setSafeZones] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [crimeCurrentPage, setCrimeCurrentPage] = useState(1);
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(false);
  const [safeTimers, setSafeTimers] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const itemsPerPage = 10;
  const crimeItemsPerPage = 12;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      safeTimers.forEach(timer => clearTimeout(timer));
    };
  }, [safeTimers]);

  // SOS Emergency Call Function
  const triggerSOS = useCallback(() => {
    console.log('🚨 EMERGENCY SOS TRIGGERED - Calling 112');
    audioManager.stopAlarm();
    window.location.href = 'tel:112';
  }, []);

  // Fetch schemes from API
  const { data: allSchemes = [], isLoading: schemesLoading } = useQuery({
    queryKey: ['/api/schemes'],
  });

  // Fetch crime zones data
  const { data: crimeZones = [], isLoading: crimesLoading } = useQuery<CrimeData[]>({
    queryKey: ['/api/crime-zones'],
  });

  // Location safety tracking
  const { safetyStatus, trackingActive, startTracking, stopTracking } = useLocationSafety(
    crimeZones,
    locationTrackingEnabled
  );

  // Disable automatic danger zone alert - using custom flow
  // const { inDangerZone, dangerZoneInfo, stopAlarm } = useDangerZoneAlert();
  const [showDangerAlert, setShowDangerAlert] = useState(false);

  // Disable the old danger zone alert system - we use our custom flow now
  // useEffect(() => {
  //   if (inDangerZone && dangerZoneInfo) {
  //     setShowDangerAlert(true);
  //   }
  // }, [inDangerZone, dangerZoneInfo]);

  // Handle alert close
  const handleDangerAlertClose = () => {
    setShowDangerAlert(false);
    // stopAlarm(); // Disabled since we're not using the old system
  };

  // Zone detection and notification system - ONLY when tracking is enabled
  useEffect(() => {
    // Only proceed if automated tracking is enabled AND actively tracking
    if (locationTrackingEnabled && trackingActive && safetyStatus.currentZone) {
      const zoneKey = `${safetyStatus.currentZone.state}-${safetyStatus.currentZone.riskLevel}`;
      const isRedZone = safetyStatus.currentZone.riskLevel === 'critical' || safetyStatus.currentZone.riskLevel === 'high';
      
      // Send notification for ANY zone entry
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`📍 ${safetyStatus.currentZone.riskLevel.toUpperCase()} ZONE ALERT`, {
          body: `You are in ${safetyStatus.currentZone.state} - a ${safetyStatus.currentZone.riskLevel} risk area.`,
          icon: '/icon.png',
          tag: 'zone-alert',
          requireInteraction: false,
        });
      }
      
      // Only trigger emergency flow for RED ZONES
      if (isRedZone && !showEmergencyAlert) {
        // Check if we should show alert (not in safe zones)
        const shouldShowAlert = !safeZones.has(zoneKey);
        
        if (shouldShowAlert) {
          // Start 30-second countdown modal for red zones
          setShowEmergencyAlert(true);
          console.log(`RED ZONE DETECTED: ${zoneKey} - Starting emergency flow`);
        }
      }
    }
  }, [locationTrackingEnabled, trackingActive, safetyStatus.currentZone, showEmergencyAlert, safeZones]);

  // Filter schemes
  const filteredSchemes = (allSchemes as any[]).filter((scheme: any) => {
    const matchesSearch = searchQuery === '' || 
      scheme.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.details?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || scheme.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter crime zones with pagination
  const filteredCrimes = crimeZones
    .filter(zone => {
      const matchesSearch = searchQuery === '' || 
        zone.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (zone.district && zone.district.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRisk = riskFilter === 'all' || zone.riskLevel === riskFilter;
      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => b.totalCrimes - a.totalCrimes);

  // Pagination for crime zones
  const totalCrimePages = Math.ceil(filteredCrimes.length / crimeItemsPerPage);
  const startCrimeIndex = (crimeCurrentPage - 1) * crimeItemsPerPage;
  const paginatedCrimes = filteredCrimes.slice(startCrimeIndex, startCrimeIndex + crimeItemsPerPage);

  // Pagination for schemes
  const totalSchemesPages = Math.ceil(filteredSchemes.length / itemsPerPage);
  const startSchemeIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSchemes = filteredSchemes.slice(startSchemeIndex, startSchemeIndex + itemsPerPage);

  // Reset to page 1 when filters change or tab changes
  useEffect(() => {
    setCurrentPage(1);
    setCrimeCurrentPage(1);
    setSearchQuery('');
  }, [activeTab, categoryFilter, riskFilter]);

  const categories = ['all', ...Array.from(new Set((allSchemes as any[]).map((s: any) => s.category).filter(Boolean)))];

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBadgeVariant = (riskLevel: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (riskLevel) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-safe/5">
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-3 animate-slide-up">
          <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center animate-float">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-safe bg-clip-text text-transparent">Women Safety & Empowerment</h1>
            <p className="text-muted-foreground mt-1">Crime risk zones and government support schemes</p>
          </div>
        </div>

        {/* Location Tracking & Emergency Alert Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className={locationTrackingEnabled ? "border-safe/50 bg-safe/5" : "border-warning/50 bg-warning/5"}>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className={locationTrackingEnabled ? "w-5 h-5 text-safe animate-pulse" : "w-5 h-5 text-muted-foreground"} />
                  <span className="font-semibold">Automated Location Tracking</span>
                </div>
                <Badge variant={trackingActive ? "default" : "outline"}>
                  {trackingActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {locationTrackingEnabled 
                  ? "Monitoring your location for danger zones. You'll be alerted automatically."
                  : "Enable to receive automatic alerts when entering high-crime areas."
                }
              </p>
              <Button 
                onClick={() => {
                  if (locationTrackingEnabled) {
                    stopTracking();
                    setLocationTrackingEnabled(false);
                  } else {
                    // Request notification permission
                    if ('Notification' in window && Notification.permission === 'default') {
                      Notification.requestPermission();
                    }
                    setLocationTrackingEnabled(true);
                    startTracking();
                  }
                }}
                variant={locationTrackingEnabled ? "outline" : "default"}
                className={locationTrackingEnabled ? "border-safe text-safe hover:bg-safe/10" : ""}
                data-testid="button-toggle-tracking"
              >
                {locationTrackingEnabled ? "Stop Tracking" : "Start Tracking"}
              </Button>
              {safetyStatus.currentZone && (
                <div className="mt-3 p-2 bg-background rounded-md border">
                  <p className="text-xs font-semibold">Nearest Zone: {safetyStatus.currentZone.state}</p>
                  <p className="text-xs text-muted-foreground">
                    Risk: {safetyStatus.currentZone.riskLevel} | Distance: {safetyStatus.distance?.toFixed(1)} km
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <span className="font-semibold">Emergency Alert Testing</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Test the automated emergency alert system with countdown, alarm, and SOS features.
              </p>
              <Button 
                onClick={() => {
                  console.log('Manual test of emergency alert system');
                  setShowEmergencyAlert(true);
                }}
                variant="outline"
                className="border-warning text-warning hover:bg-warning/10"
                data-testid="button-test-emergency"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Test Emergency Alert
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="risk-zones" data-testid="tab-risk-zones">
              <MapPin className="w-4 h-4 mr-2" />
              Risk Area Zones
            </TabsTrigger>
            <TabsTrigger value="schemes" data-testid="tab-schemes">
              <Users className="w-4 h-4 mr-2" />
              Government Schemes
            </TabsTrigger>
          </TabsList>

          {/* Risk Area Zones Tab */}
          <TabsContent value="risk-zones" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <h2 className="text-2xl font-semibold">High-Crime Risk States</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search states..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-states"
                  />
                </div>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-full sm:w-40" data-testid="select-risk-filter">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Loading State */}
            {crimesLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading crime data...</span>
              </div>
            )}

            {/* Crime Statistics Cards */}
            {!crimesLoading && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedCrimes.map((zone, index) => (
                    <Card key={`${zone.state}-${zone.district || index}`} className="card-3d group relative overflow-hidden animate-slide-up hover-elevate" style={{animationDelay: `${index * 0.05}s`}} data-testid={`card-crime-${index}`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardHeader className="space-y-3 relative z-10">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg leading-tight">
                              {zone.district ? `${zone.district}, ${zone.state}` : zone.state}
                            </CardTitle>
                          </div>
                          <Badge variant={getRiskBadgeVariant(zone.riskLevel)} className="shrink-0">
                            {zone.riskLevel.toUpperCase()}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>Year: {zone.year}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 relative z-10">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Total Crimes:</span>
                            <span className="text-lg font-bold text-destructive">{(zone.totalCrimes || 0).toLocaleString()}</span>
                          </div>
                          <div className="h-px bg-border" />
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Highest:</span>
                              <span className="font-semibold">{zone.highestCrimeType || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Count:</span>
                              <span className="font-semibold">{(zone.highestCrimeCount || 0).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="h-px bg-border" />
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Rape</p>
                              <p className="font-semibold">{zone.rape || 0}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Kidnapping</p>
                              <p className="font-semibold">{zone.kidnapping || 0}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Domestic Violence</p>
                              <p className="font-semibold">{zone.domesticViolence || 0}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Assault</p>
                              <p className="font-semibold">{zone.assaultOnWomen || 0}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {paginatedCrimes.length === 0 && (
                    <Card className="p-12 col-span-full">
                      <div className="text-center space-y-2">
                        <p className="text-lg font-semibold">No crime data found</p>
                        <p className="text-muted-foreground">Try adjusting your search or filters</p>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Crime Zones Pagination */}
                {totalCrimePages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-muted-foreground">
                      Showing {startCrimeIndex + 1}-{Math.min(startCrimeIndex + crimeItemsPerPage, filteredCrimes.length)} of {filteredCrimes.length} states
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCrimeCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={crimeCurrentPage === 1}
                        data-testid="button-crime-prev-page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalCrimePages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={crimeCurrentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCrimeCurrentPage(page)}
                              className="w-8 h-8 p-0"
                              data-testid={`button-crime-page-${page}`}
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCrimeCurrentPage(prev => Math.min(totalCrimePages, prev + 1))}
                        disabled={crimeCurrentPage === totalCrimePages}
                        data-testid="button-crime-next-page"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Danger Zone Map */}
            <DangerZoneMap />
          </TabsContent>

          {/* Government Schemes Tab */}
          <TabsContent value="schemes" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <h2 className="text-2xl font-semibold">Government Schemes</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search schemes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-schemes"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-40" data-testid="select-category-filter">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Loading State */}
            {schemesLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading schemes...</span>
              </div>
            )}

            {/* Schemes Grid */}
            {!schemesLoading && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedSchemes.map((scheme: any, index: number) => (
                    <Card key={String(scheme.slug || index)} className="card-3d group relative overflow-hidden animate-slide-up hover-elevate" style={{animationDelay: `${index * 0.1}s`}} data-testid={`card-scheme-${index}`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardHeader className="space-y-3 relative z-10">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">{scheme.name}</CardTitle>
                          <Badge variant="outline" className="shrink-0 group-hover:scale-105 transition-transform">{scheme.category}</Badge>
                        </div>
                        <CardDescription className="text-sm line-clamp-2">
                          {scheme.details}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 relative z-10">
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="font-semibold text-foreground">Benefits:</p>
                            <p className="text-muted-foreground">{String(scheme.benefits || 'N/A')}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Eligibility:</p>
                            <p className="text-muted-foreground">{String(scheme.eligibility || 'N/A')}</p>
                          </div>
                        </div>
                        <Button 
                          className="w-full group-hover:scale-105 transition-transform" 
                          variant="default"
                          onClick={() => window.open(scheme.applicationUrl || scheme.application || 'https://india.gov.in', '_blank')}
                          data-testid={`button-apply-${index}`}
                        >
                          Apply Now
                          <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}

                  {paginatedSchemes.length === 0 && (
                    <Card className="p-12 col-span-full">
                      <div className="text-center space-y-2">
                        <p className="text-lg font-semibold">No schemes found</p>
                        <p className="text-muted-foreground">Try adjusting your search or filters</p>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Pagination */}
                {totalSchemesPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-muted-foreground">
                      Showing {startSchemeIndex + 1}-{Math.min(startSchemeIndex + itemsPerPage, filteredSchemes.length)} of {filteredSchemes.length} schemes
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalSchemesPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                              data-testid={`button-page-${page}`}
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalSchemesPages, prev + 1))}
                        disabled={currentPage === totalSchemesPages}
                        data-testid="button-next-page"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Emergency Alert Modal */}
        <EmergencyAlertModal 
          open={showEmergencyAlert}
          onClose={(markedSafe?: boolean) => {
            setShowEmergencyAlert(false);
            // If user marked themselves safe, stop alarm and handle based on zone risk level
            if (markedSafe) {
              // Stop any playing alarm immediately
              audioManager.stopAlarm();
              
              if (safetyStatus.currentZone) {
              const zoneKey = `${safetyStatus.currentZone.state}-${safetyStatus.currentZone.riskLevel}`;
              const isRedZone = safetyStatus.currentZone.riskLevel === 'critical' || safetyStatus.currentZone.riskLevel === 'high';
              
              setSafeZones(prev => new Set(Array.from(prev).concat(zoneKey)));
              
              if (isRedZone) {
                // RED ZONE: Set 2-minute timer to repeat entire flow
                setSafeZones(prev => new Set(Array.from(prev).concat(zoneKey)));
                
                const existingTimer = safeTimers.get(zoneKey);
                if (existingTimer) {
                  clearTimeout(existingTimer);
                }
                
                const timer = setTimeout(() => {
                  setSafeZones(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(zoneKey);
                    return newSet;
                  });
                  setSafeTimers(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(zoneKey);
                    return newMap;
                  });
                  console.log(`RED ZONE 2-minute timer expired for ${zoneKey} - will repeat alert flow`);
                }, 2 * 60 * 1000); // 2 minutes
                
                setSafeTimers(prev => new Map(prev.set(zoneKey, timer)));
                console.log(`User marked safe in RED ZONE: ${zoneKey} - will repeat in 2 minutes`);
              } else {
                // NON-RED ZONE: Permanently mark as safe
                setSafeZones(prev => new Set(Array.from(prev).concat(zoneKey)));
                console.log(`NON-RED ZONE marked as permanently safe: ${zoneKey}`);
              }
            }
            }
          }}
          location={safetyStatus.userLocation || { lat: 28.7041, lng: 77.1025 }}
          onSOS={triggerSOS}
        />
        
        {/* Periodic Safety Check */}
        <PeriodicSafetyCheck enabled={locationTrackingEnabled} />

        {/* Old Danger Zone Alert Modal - Disabled for custom flow */}
        {/* <DangerZoneAlertModal
          open={showDangerAlert}
          onClose={handleDangerAlertClose}
          dangerZone={dangerZoneInfo}
        /> */}
      </div>
    </div>
  );
}

export default WomenSafety;

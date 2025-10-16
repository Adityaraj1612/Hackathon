import { HeroSlider } from "@/components/HeroSlider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CloudRain, Sprout, MapPin, Bell, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { WeatherWidget } from "@/components/WeatherWidget";
import { ThreeScene } from "@/components/ThreeScene";

export default function Home() {
  const { user } = useAuth();
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Check permission status
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state as any);
        if (result.state === 'granted') {
          getCurrentLocation();
        }
      });
    }
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        setLocationPermission('granted');
        setLocationError(null);
        
        // Simple address approximation based on coordinates
        const getApproximateLocation = (lat: number, lng: number) => {
          if (lat >= 8 && lat <= 37 && lng >= 68 && lng <= 97) {
            return `India (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          }
          return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        };
        
        setCurrentLocation(prev => prev ? {
          ...prev,
          address: getApproximateLocation(latitude, longitude)
        } : null);
      },
      (error) => {
        setLocationPermission('denied');
        setLocationError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const requestLocation = () => {
    getCurrentLocation();
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-8 max-w-7xl">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Location Permission Banner */}
      {locationPermission !== 'granted' && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-warning" />
              <div>
                <CardTitle className="text-base">Enable Location Access</CardTitle>
                <CardDescription>
                  Location access is required for danger zone alerts and emergency features
                </CardDescription>
                {locationError && (
                  <p className="text-sm text-destructive mt-1">{locationError}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={requestLocation} 
              variant="outline" 
              className="border-warning text-warning hover:bg-warning/10"
              data-testid="button-enable-location"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {locationPermission === 'denied' ? 'Retry Location Access' : 'Enable Location'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Welcome Section */}
      <div className="space-y-2">
        <h2 className="text-3xl md:text-4xl font-bold">
          Welcome back, {user?.displayName?.split(' ')[0] || 'User'}
        </h2>
        <p className="text-lg text-muted-foreground">
          Your personalized safety dashboard with AI-powered predictions
        </p>
      </div>

      {/* Main Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Women Safety Card */}
        <Link href="/women-safety">
          <Card className="cursor-pointer card-3d h-full group relative overflow-hidden" data-testid="card-women-safety">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="space-y-3 relative z-10">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl group-hover:text-primary transition-colors">Women Safety & Empowerment</CardTitle>
              <CardDescription className="text-base">
                Access government schemes and real-time danger zone alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bell className="w-4 h-4" />
                  <span>Live danger zone tracking</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span>100+ schemes available</span>
                </div>
              </div>
              <Button className="mt-4 w-full" data-testid="button-explore-women-safety">
                Explore Features
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Disaster Management Card */}
        <Link href="/disaster">
          <Card className="cursor-pointer card-3d h-full group relative overflow-hidden" data-testid="card-disaster">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="space-y-3 relative z-10">
              <div className="w-12 h-12 rounded-md bg-warning/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float" style={{animationDelay: '0.5s'}}>
                <CloudRain className="w-6 h-6 text-warning" />
              </div>
              <CardTitle className="text-xl group-hover:text-warning transition-colors">Disaster Management</CardTitle>
              <CardDescription className="text-base">
                Weather forecasts and disaster risk zone mapping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bell className="w-4 h-4" />
                  <span>Real-time weather alerts</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>Risk zone mapping</span>
                </div>
              </div>
              <Button className="mt-4 w-full" data-testid="button-explore-disaster">
                View Forecast
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Farmers Support Card */}
        <Link href="/farmers">
          <Card className="cursor-pointer card-3d h-full group relative overflow-hidden" data-testid="card-farmers">
            <div className="absolute inset-0 bg-gradient-to-br from-safe/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="space-y-3 relative z-10">
              <div className="w-12 h-12 rounded-md bg-safe/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float" style={{animationDelay: '1s'}}>
                <Sprout className="w-6 h-6 text-safe" />
              </div>
              <CardTitle className="text-xl group-hover:text-safe transition-colors">Farmers Support</CardTitle>
              <CardDescription className="text-base">
                AI crop recommendations and disease detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span>Crop profitability analysis</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CloudRain className="w-4 h-4" />
                  <span>Weather-based suggestions</span>
                </div>
              </div>
              <Button className="mt-4 w-full" data-testid="button-explore-farmers">
                Get Recommendations
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Weather Widget */}
      {currentLocation && (
        <WeatherWidget location={currentLocation} />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Alerts</CardDescription>
            <CardTitle className="text-3xl">3</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Schemes Available</CardDescription>
            <CardTitle className="text-3xl">150+</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Risk Zones</CardDescription>
            <CardTitle className="text-3xl">12</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Safety Check-ins</CardDescription>
            <CardTitle className="text-3xl">47</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Current Location Map */}
      {currentLocation && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Your Current Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentLocation.address ? (
                <p className="text-sm">{currentLocation.address}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Getting address...</p>
              )}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <Badge variant="outline">
                  Lat: {currentLocation.lat.toFixed(6)}
                </Badge>
                <Badge variant="outline">
                  Lng: {currentLocation.lng.toFixed(6)}
                </Badge>
              </div>
              <div className="h-64 w-full rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentLocation.lng-0.01},${currentLocation.lat-0.01},${currentLocation.lng+0.01},${currentLocation.lat+0.01}&layer=mapnik&marker=${currentLocation.lat},${currentLocation.lng}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

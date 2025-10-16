import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CloudRain, 
  Wind, 
  Droplets, 
  ThermometerSun, 
  AlertTriangle,
  MapPin,
  Calendar
} from "lucide-react";

// Sample weather data - will be replaced with API data
const sampleWeather = {
  location: "New Delhi",
  temperature: 32,
  condition: "Partly Cloudy",
  humidity: 65,
  windSpeed: 12,
  forecast: [
    { day: "Today", temp: 32, condition: "Partly Cloudy", icon: CloudRain },
    { day: "Tomorrow", temp: 34, condition: "Sunny", icon: ThermometerSun },
    { day: "Wed", temp: 30, condition: "Rainy", icon: CloudRain },
    { day: "Thu", temp: 28, condition: "Stormy", icon: Wind },
    { day: "Fri", temp: 31, condition: "Cloudy", icon: CloudRain },
  ]
};

// Sample disaster zones
const disasterZones = [
  {
    id: '1',
    location: 'Bihar - Flood Risk',
    type: 'Flood',
    severity: 'High',
    description: 'Heavy monsoon predicted. Rivers above danger level.',
    date: '2024-07-15',
    affected: '~500,000 people'
  },
  {
    id: '2',
    location: 'Rajasthan - Drought Warning',
    type: 'Drought',
    severity: 'Moderate',
    description: 'Below average rainfall. Water scarcity expected.',
    date: '2024-06-20',
    affected: '~300,000 people'
  },
  {
    id: '3',
    location: 'Odisha - Cyclone Alert',
    type: 'Cyclone',
    severity: 'Critical',
    description: 'Severe cyclonic storm approaching coastal areas.',
    date: '2024-08-01',
    affected: '~1,000,000 people'
  },
];

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical': return 'border-emergency text-emergency';
    case 'high': return 'border-warning text-warning';
    case 'moderate': return 'border-yellow-500 text-yellow-500';
    case 'low': return 'border-safe text-safe';
    default: return 'border-border text-foreground';
  }
};

export default function DisasterManagement() {
  const [activeTab, setActiveTab] = useState('weather');
  
  // Fetch weather data from API
  const { data: weatherData, isLoading: weatherLoading } = useQuery({
    queryKey: ['/api/weather'],
    refetchInterval: 300000, // Refetch every 5 minutes
  });
  
  const weather = weatherData || sampleWeather;

  return (
    <div className="container mx-auto px-4 py-6 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-md bg-warning/10 flex items-center justify-center">
          <CloudRain className="w-6 h-6 text-warning" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Disaster Management</h1>
          <p className="text-muted-foreground mt-1">Weather forecasts and disaster risk mapping</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="weather" data-testid="tab-weather">
            <ThermometerSun className="w-4 h-4 mr-2" />
            Weather Forecast
          </TabsTrigger>
          <TabsTrigger value="risk" data-testid="tab-risk-mapping">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Risk Mapping
          </TabsTrigger>
        </TabsList>

        {/* Weather Forecast Tab */}
        <TabsContent value="weather" className="space-y-6">
          {weatherLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading weather data...</span>
            </div>
          )}
          
          {!weatherLoading && (
            <>
          {/* Current Weather */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Current Weather</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <MapPin className="w-4 h-4" />
                    {sampleWeather.location}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-5xl font-bold">{weather.temperature}°C</p>
                  <p className="text-muted-foreground">{weather.condition}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Droplets className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{weather.humidity}%</p>
                    <p className="text-xs text-muted-foreground">Humidity</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Wind className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{weather.windSpeed}</p>
                    <p className="text-xs text-muted-foreground">km/h Wind</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <ThermometerSun className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">UV 7</p>
                    <p className="text-xs text-muted-foreground">UV Index</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <CloudRain className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">30%</p>
                    <p className="text-xs text-muted-foreground">Rain Chance</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5-Day Forecast */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">5-Day Forecast</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {weather.forecast?.map((day: any, index: number) => {
                const Icon = day.icon;
                return (
                  <Card key={index} className="text-center hover-elevate" data-testid={`card-forecast-${index}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{day.day}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <CloudRain className="w-12 h-12 mx-auto text-primary" />
                      <p className="text-2xl font-bold">{day.temp}°C</p>
                      <p className="text-sm text-muted-foreground">{day.condition}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
          </>
          )}
        </TabsContent>

        {/* Risk Mapping Tab */}
        <TabsContent value="risk" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {disasterZones.map((zone) => (
              <Card key={zone.id} className="hover-elevate" data-testid={`card-disaster-${zone.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{zone.location}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {zone.date}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={getSeverityColor(zone.severity)}>
                      {zone.severity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      <span className="font-semibold text-sm">Type: {zone.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{zone.description}</p>
                    <p className="text-sm font-medium">
                      Affected Population: <span className="text-warning">{zone.affected}</span>
                    </p>
                  </div>
                  <Button className="w-full" variant="outline" data-testid={`button-view-details-${zone.id}`}>
                    View Detailed Alert
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Map Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Disaster Risk Zones Map</CardTitle>
              <CardDescription>Color-coded zones showing flood, drought, and storm risks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-muted/30 rounded-lg flex items-center justify-center border border-dashed">
                <div className="text-center space-y-2">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Interactive disaster risk map</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Badge variant="outline" className="border-emergency text-emergency">Flood Zones</Badge>
                    <Badge variant="outline" className="border-warning text-warning">Drought Areas</Badge>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-500">Storm Paths</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sprout, Search, Thermometer, Droplets, Zap } from "lucide-react";

interface CropInfoData {
  crop: string;
  requirements: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    temperature: number;
    humidity: number;
    ph: number;
    rainfall: number;
  };
  relatedCrops: string[];
}

export default function CropInfo() {
  const [location, setLocation] = useLocation();
  const [searchCrop, setSearchCrop] = useState('');
  
  const { data: cropInfo, isLoading, error } = useQuery<CropInfoData>({
    queryKey: ['/api/crop-info', searchCrop],
    queryFn: async () => {
      const response = await fetch(`/api/crop-info?crop=${encodeURIComponent(searchCrop)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch crop information');
      }
      return response.json();
    },
    enabled: searchCrop.length > 0,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const crop = urlParams.get('crop');
    if (crop) {
      setSearchCrop(crop);
    }
  }, [location]);

  const handleSearch = () => {
    if (searchCrop.trim()) {
      setLocation(`/crop-info?crop=${encodeURIComponent(searchCrop.trim())}`);
    }
  };

  const handleRelatedCropClick = (crop: string) => {
    setSearchCrop(crop);
    setLocation(`/crop-info?crop=${encodeURIComponent(crop)}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation('/farmers')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-md bg-safe/10 flex items-center justify-center">
            <Sprout className="w-6 h-6 text-safe" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Crop Information</h1>
            <p className="text-muted-foreground mt-1">Detailed crop requirements and recommendations</p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Crop</CardTitle>
          <CardDescription>Enter crop name to get detailed information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter crop name (e.g., rice, wheat, maize)..."
              value={searchCrop}
              onChange={(e) => setSearchCrop(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading crop information...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/20">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Failed to load crop information. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!isLoading && searchCrop && !cropInfo && !error && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No information found for "{searchCrop}". Try searching for: rice, wheat, maize, cotton, apple, banana
            </p>
          </CardContent>
        </Card>
      )}

      {/* Crop Information Display */}
      {cropInfo && (
        <div className="space-y-6">
          {/* Crop Header */}
          <Card className="bg-gradient-to-r from-safe/10 to-primary/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Sprout className="w-8 h-8 text-safe" />
                <div>
                  <CardTitle className="text-3xl capitalize">{cropInfo.crop}</CardTitle>
                  <CardDescription className="text-lg">Complete growing requirements</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* NPK Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">Nitrogen (N)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">{cropInfo.requirements.nitrogen}</p>
                <p className="text-sm text-muted-foreground">kg/ha required</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <CardTitle className="text-lg">Phosphorus (P)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600">{cropInfo.requirements.phosphorus}</p>
                <p className="text-sm text-muted-foreground">kg/ha required</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg">Potassium (K)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600">{cropInfo.requirements.potassium}</p>
                <p className="text-sm text-muted-foreground">kg/ha required</p>
              </CardContent>
            </Card>
          </div>

          {/* Environmental Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-red-500" />
                  <CardTitle className="text-lg">Temperature</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{cropInfo.requirements.temperature}°C</p>
                <p className="text-sm text-muted-foreground">Average required</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg">Humidity</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{cropInfo.requirements.humidity}%</p>
                <p className="text-sm text-muted-foreground">Relative humidity</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">pH Level</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{cropInfo.requirements.ph}</p>
                <p className="text-sm text-muted-foreground">Soil pH</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">Rainfall</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{cropInfo.requirements.rainfall}</p>
                <p className="text-sm text-muted-foreground">mm annually</p>
              </CardContent>
            </Card>
          </div>

          {/* Related Crops */}
          {cropInfo.relatedCrops.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Related Crops</CardTitle>
                <CardDescription>Similar crops you might want to consider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {cropInfo.relatedCrops.map((relatedCrop, index) => (
                    <Card 
                      key={index}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-primary/20 hover:border-primary/40 hover:scale-105"
                      onClick={() => handleRelatedCropClick(relatedCrop)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-safe/10 flex items-center justify-center">
                            <Sprout className="w-5 h-5 text-safe" />
                          </div>
                          <div>
                            <p className="font-semibold capitalize">{relatedCrop}</p>
                            <p className="text-xs text-muted-foreground">Click to view details</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sprout, 
  TrendingUp, 
  MapPin, 
  Cloud, 
  Droplets,
  Search,
  Sparkles,
  AlertCircle,
  Leaf,
  Bug
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Sample crop data for Punjab districts
const punjabDistricts = [
  {
    id: '1',
    district: 'Ludhiana',
    fertilityRating: 9.2,
    soilType: 'Alluvial Loam',
    recommendedCrops: ['Wheat', 'Rice', 'Maize', 'Cotton'],
    profitabilityScore: 88,
    bestSeason: 'Rabi & Kharif',
    weatherOutlook: 'Favorable rainfall expected'
  },
  {
    id: '2',
    district: 'Amritsar',
    fertilityRating: 8.7,
    soilType: 'Sandy Loam',
    recommendedCrops: ['Wheat', 'Rice', 'Vegetables'],
    profitabilityScore: 85,
    bestSeason: 'Rabi',
    weatherOutlook: 'Good monsoon predicted'
  },
  {
    id: '3',
    district: 'Jalandhar',
    fertilityRating: 8.9,
    soilType: 'Alluvial',
    recommendedCrops: ['Rice', 'Wheat', 'Sugarcane'],
    profitabilityScore: 82,
    bestSeason: 'Kharif',
    weatherOutlook: 'Adequate water availability'
  },
  {
    id: '4',
    district: 'Patiala',
    fertilityRating: 8.5,
    soilType: 'Clay Loam',
    recommendedCrops: ['Cotton', 'Wheat', 'Pulses'],
    profitabilityScore: 79,
    bestSeason: 'Rabi',
    weatherOutlook: 'Moderate rainfall'
  },
  {
    id: '5',
    district: 'Bathinda',
    fertilityRating: 7.8,
    soilType: 'Sandy',
    recommendedCrops: ['Cotton', 'Bajra', 'Guar'],
    profitabilityScore: 75,
    bestSeason: 'Kharif',
    weatherOutlook: 'Below average rainfall'
  },
];

interface CropDiseaseData {
  crop: string;
  disease: string;
  description: string;
  symptoms: string;
  prevention: string;
  cure: string;
}

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

const getFertilityColor = (rating: number) => {
  if (rating >= 9) return 'text-safe';
  if (rating >= 8) return 'text-primary';
  if (rating >= 7) return 'text-warning';
  return 'text-muted-foreground';
};

export default function FarmersSupport() {
  const [activeTab, setActiveTab] = useState('soil-recommendations');
  const [selectedDistrict, setSelectedDistrict] = useState(punjabDistricts[0].id);
  const [searchCrop, setSearchCrop] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [diseaseResult, setDiseaseResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  
  const selectedData = punjabDistricts.find(d => d.id === selectedDistrict) || punjabDistricts[0];

  // Fetch crop diseases
  const { data: cropDiseases = [] } = useQuery<CropDiseaseData[]>({
    queryKey: ['/api/crop-diseases', selectedCrop],
    enabled: !!selectedCrop,
  });

  const handleCropSearch = () => {
    if (searchCrop.trim()) {
      setLocation(`/crop-info?crop=${encodeURIComponent(searchCrop.trim())}`);
    }
  };

  // Disease detection mutation
  const diseaseDetection = useMutation({
    mutationFn: async (imageData: string) => {
      const response = await fetch('/api/analyze-crop-disease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
      });
      
      if (!response.ok) {
        throw new Error('Disease detection failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setDiseaseResult(data);
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setUploadedImage(base64String);
      setDiseaseResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeImage = () => {
    if (uploadedImage) {
      diseaseDetection.mutate(uploadedImage);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-md bg-safe/10 flex items-center justify-center">
          <Sprout className="w-6 h-6 text-safe" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Farmers Support</h1>
          <p className="text-muted-foreground mt-1">AI-powered crop recommendations and health monitoring</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="soil-recommendations">
            <MapPin className="w-4 h-4 mr-2" />
            Soil-Based Recommendations
          </TabsTrigger>
          <TabsTrigger value="crop-health">
            <Leaf className="w-4 h-4 mr-2" />
            Crop Health & Search
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Soil-Based Recommendations */}
        <TabsContent value="soil-recommendations" className="space-y-6">
          {/* District Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Select Your District</CardTitle>
              <CardDescription>Currently showing data for Punjab state</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                <SelectTrigger className="w-full md:w-80">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Choose district" />
                </SelectTrigger>
                <SelectContent>
                  {punjabDistricts.map(district => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.district} - Fertility: {district.fertilityRating}/10
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Fertility and Soil Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover-elevate">
              <CardHeader className="pb-3">
                <CardDescription>Fertility Rating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-bold ${getFertilityColor(selectedData.fertilityRating)}`}>
                      {selectedData.fertilityRating}
                    </span>
                    <span className="text-muted-foreground">/10</span>
                  </div>
                  <Progress value={selectedData.fertilityRating * 10} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {selectedData.fertilityRating >= 9 ? 'Excellent' : 
                     selectedData.fertilityRating >= 8 ? 'Very Good' :
                     selectedData.fertilityRating >= 7 ? 'Good' : 'Fair'} fertility
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader className="pb-3">
                <CardDescription>Soil Type</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{selectedData.soilType}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Ideal for diverse crop cultivation
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader className="pb-3">
                <CardDescription>Profitability Score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <span className="text-4xl font-bold text-primary">{selectedData.profitabilityScore}</span>
                  <span className="text-muted-foreground">/100</span>
                </div>
                <Progress value={selectedData.profitabilityScore} className="h-2 mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* AI Crop Recommendations */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">AI-Powered Crop Recommendations</CardTitle>
              </div>
              <CardDescription>
                Based on soil fertility, profitability analysis, and 3-month weather predictions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold">Recommended Crops for {selectedData.district}</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedData.recommendedCrops.map((crop, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="px-4 py-2 text-base border-safe text-safe"
                    >
                      <Sprout className="w-4 h-4 mr-2" />
                      {crop}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Cloud className="w-4 h-4 text-primary" />
                    Best Season
                  </div>
                  <p className="text-lg font-bold">{selectedData.bestSeason}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Droplets className="w-4 h-4 text-primary" />
                    Weather Outlook
                  </div>
                  <p className="text-lg font-bold">{selectedData.weatherOutlook}</p>
                </div>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-primary">💡 AI Insight</p>
                <p className="text-sm text-foreground">
                  Based on current soil conditions and upcoming weather patterns, 
                  <span className="font-semibold"> {selectedData.recommendedCrops[0]} </span>
                  shows the highest profitability potential for this season. Consider crop rotation with 
                  <span className="font-semibold"> {selectedData.recommendedCrops[1]} </span>
                  to maintain soil health.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Crop Health & Search */}
        <TabsContent value="crop-health" className="space-y-6">
          {/* Crop Search Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Search Crop Information</CardTitle>
              <CardDescription>
                Find detailed information about crops including nutrition requirements, soil needs, and related crops
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter crop name (e.g., rice, wheat, maize)..."
                  value={searchCrop}
                  onChange={(e) => setSearchCrop(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      console.log('Enter pressed, searching for:', e.currentTarget.value);
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={handleCropSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground mt-2">
                <p>Available crops: rice, maize, chickpea, kidneybeans, pomegranate, banana, mango, grapes, watermelon, muskmelon, apple, orange, papaya, coconut, cotton, jute, lentil, coffee</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Disease Detection with Image Upload */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-xl">AI Disease Detection</CardTitle>
              </div>
              <CardDescription>
                Upload a photo of your crop leaf to detect diseases and get treatment recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
                
                {uploadedImage && (
                  <div className="space-y-4">
                    <div className="relative w-full max-w-md mx-auto">
                      <img 
                        src={uploadedImage} 
                        alt="Uploaded crop" 
                        className="w-full rounded-lg border-2 border-primary/20"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleAnalyzeImage}
                      disabled={diseaseDetection.isPending}
                      className="w-full md:w-auto"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {diseaseDetection.isPending ? 'Analyzing...' : 'Analyze Image'}
                    </Button>
                  </div>
                )}

                {diseaseResult && diseaseResult.success && (
                  <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl capitalize">{diseaseResult.plant}</CardTitle>
                        <Badge variant={diseaseResult.severity === 'High' ? 'destructive' : 'outline'}>
                          {diseaseResult.confidence}% Confidence
                        </Badge>
                      </div>
                      <CardDescription className="text-lg font-semibold text-orange-600">
                        {diseaseResult.disease}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-semibold mb-2">Description:</p>
                        <p className="text-sm">{diseaseResult.description}</p>
                      </div>
                      
                      <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                        <p className="text-sm font-semibold mb-2 text-orange-600">Prevention:</p>
                        <p className="text-sm">{diseaseResult.prevention}</p>
                      </div>
                      
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <p className="text-sm font-semibold mb-2 text-safe">Cure/Treatment:</p>
                        <p className="text-sm">{diseaseResult.cure}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-primary" />
                        <p className="text-sm text-muted-foreground">
                          Severity: <span className="font-semibold">{diseaseResult.severity}</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {diseaseResult && !diseaseResult.success && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">
                      {diseaseResult.error || 'Failed to analyze image. Please try again.'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Crop Disease Database */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-xl">Disease Database Search</CardTitle>
              </div>
              <CardDescription>
                Search for crop diseases by name in our database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter crop name to check diseases (e.g., tomato, rice, wheat)..."
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && selectedCrop.trim() && setSelectedCrop(selectedCrop.trim())}
                  className="flex-1"
                />
                <Button 
                  onClick={() => {
                    if (selectedCrop.trim()) {
                      setSelectedCrop(selectedCrop.trim());
                    }
                  }}
                  disabled={!selectedCrop.trim()}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Search Diseases
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Available crops: tomato, rice, wheat, potato, maize, cotton, apple, mango, grapes, banana</p>
              </div>

              {cropDiseases.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold text-lg">Diseases Found for {selectedCrop}:</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {cropDiseases.map((disease, index) => (
                      <Card key={index} className="border-orange-200 dark:border-orange-900 hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <Bug className="w-5 h-5 text-orange-600" />
                            <CardTitle className="text-lg text-orange-600">{disease.disease}</CardTitle>
                          </div>
                          <CardDescription className="capitalize font-medium">{disease.crop}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <p className="text-sm font-semibold mb-2 text-blue-700 dark:text-blue-300">Description:</p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">{disease.description}</p>
                          </div>
                          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                            <p className="text-sm font-semibold mb-2 text-orange-700 dark:text-orange-300">Symptoms:</p>
                            <p className="text-sm text-orange-800 dark:text-orange-200">{disease.symptoms}</p>
                          </div>
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                            <p className="text-sm font-semibold mb-2 text-purple-700 dark:text-purple-300">Prevention:</p>
                            <p className="text-sm text-purple-800 dark:text-purple-200">{disease.prevention}</p>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <p className="text-sm font-semibold mb-2 text-green-700 dark:text-green-300">Treatment/Cure:</p>
                            <p className="text-sm text-green-800 dark:text-green-200">{disease.cure}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {selectedCrop && cropDiseases.length === 0 && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    No diseases found for "{selectedCrop}". Try searching for: tomato, rice, wheat, potato, maize, cotton, apple, mango
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

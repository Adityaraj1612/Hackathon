import type { Express } from "express";
import { createServer, type Server } from "http";
import { parseSchemesCSV, parseCrimePDF, parseComprehensiveCrimeCSV, parseDisasterCSV, getStateCoordinates, getDistrictCoordinates, type DisasterData, parseCropDiseaseCSV, parseCropRecommendationCSV, type CropDiseaseData, type CropRecommendationData } from "./lib/data-parser";
import { analyzeSafetyRisk, getCropRecommendations, predictDisasterRisk, analyzeCropDiseaseImage } from "./lib/gemini";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";

// Cache for parsed data
let schemesCache: any[] = [];
let crimeDataCache: any[] = [];
let disasterDataCache: DisasterData[] = [];
let cropDiseaseCache: CropDiseaseData[] = [];
let cropRecommendationCache: CropRecommendationData[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data on server start
  try {
    schemesCache = await parseSchemesCSV();
    const crimeData = await parseComprehensiveCrimeCSV();
    disasterDataCache = await parseDisasterCSV();
    cropDiseaseCache = await parseCropDiseaseCSV();
    console.log('Loading crop recommendation data...');
    cropRecommendationCache = await parseCropRecommendationCSV();
    console.log(`Crop recommendation cache loaded: ${cropRecommendationCache.length} records`);
    
    crimeDataCache = crimeData.map(crime => {
      const location = crime.district 
        ? getDistrictCoordinates(crime.state, crime.district)
        : getStateCoordinates(crime.state);
      
      return {
        ...crime,
        location,
      };
    });
    
    // Add Chandigarh University as test red zone
    crimeDataCache.push({
      state: 'PUNJAB',
      district: 'CHANDIGARH UNIVERSITY',
      year: 2024,
      rape: 5000,
      kidnapping: 3000,
      dowryDeath: 500,
      assaultOnWomen: 4000,
      assaultOnModesty: 2500,
      domesticViolence: 6000,
      trafficking: 500,
      totalCrimes: 21500,
      riskLevel: 'critical',
      highestCrimeType: 'Domestic Violence',
      highestCrimeCount: 6000,
      location: { lat: 30.7333, lng: 76.7794 }
    });
    
    console.log(`✅ Loaded ${schemesCache.length} schemes, ${crimeDataCache.length} crime zones, and ${disasterDataCache.length} disaster records`);
    console.log(`✅ Loaded ${cropDiseaseCache.length} crop diseases and ${cropRecommendationCache.length} crop recommendations`);
  } catch (error) {
    console.error('❌ Data loading error:', error);
    schemesCache = [];
    crimeDataCache = [];
    disasterDataCache = [];
    cropDiseaseCache = [];
    cropRecommendationCache = [];
  }

  // POST /api/auth/signup - User registration
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, phoneNumber, password, authProvider } = req.body;

      // Validate required fields based on auth provider
      if (authProvider === 'username' && (!username || !password)) {
        return res.status(400).json({ error: 'Username and password required' });
      }
      if (authProvider === 'google' && !email) {
        return res.status(400).json({ error: 'Email required for Google auth' });
      }
      if (authProvider === 'phone' && !phoneNumber) {
        return res.status(400).json({ error: 'Phone number required' });
      }

      // Check if user already exists
      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(409).json({ error: 'Username already exists' });
        }
      }
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(409).json({ error: 'Email already exists' });
        }
      }
      if (phoneNumber) {
        const existingUser = await storage.getUserByPhone(phoneNumber);
        if (existingUser) {
          return res.status(409).json({ error: 'Phone number already exists' });
        }
      }

      // Hash password if provided
      let passwordHash = null;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      // Create user
      const userData = insertUserSchema.parse({
        username: username || null,
        email: email || null,
        phoneNumber: phoneNumber || null,
        passwordHash,
        displayName: username || email?.split('@')[0] || null,
        authProvider: authProvider || 'username',
      });

      const user = await storage.createUser(userData);
      
      // Don't send password hash to client
      const { passwordHash: _, ...userResponse } = user;
      res.status(201).json({ user: userResponse });
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(500).json({ error: error.message || 'Failed to create user' });
    }
  });

  // POST /api/auth/login - User login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, email, phoneNumber, password } = req.body;

      // Find user by username, email, or phone
      let user;
      if (username) {
        user = await storage.getUserByUsername(username);
      } else if (email) {
        user = await storage.getUserByEmail(email);
      } else if (phoneNumber) {
        user = await storage.getUserByPhone(phoneNumber);
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password if user has password auth
      if (user.passwordHash && password) {
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      } else if (user.passwordHash && !password) {
        return res.status(401).json({ error: 'Password required' });
      }

      // Don't send password hash to client
      const { passwordHash: _, ...userResponse } = user;
      res.json({ user: userResponse });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message || 'Failed to login' });
    }
  });

  // GET /api/schemes - Fetch government schemes with filters
  app.get("/api/schemes", async (req, res) => {
    try {
      const { search, category, level } = req.query;
      
      let filtered = [...schemesCache];
      
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filtered = filtered.filter(s => 
          s.name.toLowerCase().includes(searchLower) ||
          s.details.toLowerCase().includes(searchLower)
        );
      }
      
      if (category && category !== 'all') {
        filtered = filtered.filter(s => 
          s.category?.toLowerCase() === (category as string).toLowerCase()
        );
      }
      
      if (level && level !== 'all') {
        filtered = filtered.filter(s => 
          s.level?.toLowerCase() === (level as string).toLowerCase()
        );
      }
      
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch schemes' });
    }
  });

  // GET /api/crime-zones - Fetch danger zones with optional filters
  app.get("/api/crime-zones", async (req, res) => {
    try {
      const { state, search, riskLevel } = req.query;
      
      let filtered = [...crimeDataCache];
      
      // Filter by state
      if (state && state !== 'all') {
        filtered = filtered.filter(zone => 
          zone.state.toLowerCase() === (state as string).toLowerCase()
        );
      }
      
      // Search across state names
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filtered = filtered.filter(zone => 
          zone.state.toLowerCase().includes(searchLower)
        );
      }
      
      // Filter by risk level
      if (riskLevel && riskLevel !== 'all') {
        filtered = filtered.filter(zone => 
          zone.riskLevel === riskLevel
        );
      }
      
      // Sort by total crimes (descending)
      filtered.sort((a, b) => b.totalCrimes - a.totalCrimes);
      
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch crime zones' });
    }
  });
  
  // GET /api/crime-zones/:state - Get specific state crime data
  app.get("/api/crime-zones/:state", async (req, res) => {
    try {
      const stateName = req.params.state.toUpperCase();
      const stateData = crimeDataCache.find(zone => 
        zone.state.toUpperCase() === stateName
      );
      
      if (!stateData) {
        return res.status(404).json({ error: 'State data not found' });
      }
      
      res.json(stateData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch state data' });
    }
  });

  // POST /api/analyze-location - Analyze safety risk for location
  app.post("/api/analyze-location", async (req, res) => {
    try {
      const { lat, lng, state } = req.body;
      
      if (!lat || !lng) {
        return res.status(400).json({ error: 'Location coordinates required' });
      }
      
      const analysis = await analyzeSafetyRisk({ lat, lng, state });
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: 'Failed to analyze location' });
    }
  });

  // POST /api/safety-checkin - Save safety check-in (handled by Firebase client SDK)
  app.post("/api/safety-checkin", async (req, res) => {
    try {
      const { userId, location, status, zoneRiskLevel } = req.body;
      
      if (!userId || !location || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Safety check-ins are handled by Firebase client SDK on frontend
      res.json({ success: true, message: 'Check-in acknowledged' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process check-in' });
    }
  });

  // GET /api/safety-history/:userId - Get user's safety history (handled by Firebase client SDK)
  app.get("/api/safety-history/:userId", async (req, res) => {
    try {
      // Safety history is accessed through Firebase client SDK on frontend
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  // GET /api/weather - Fetch weather data from OpenWeatherMap
  app.get("/api/weather", async (req, res) => {
    try {
      const { lat, lng, location } = req.query;
      const apiKey = process.env.WEATHER_API_KEY;
      
      if (!apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY_HERE') {
        console.log('Using fallback weather data - API key not configured');
        return res.json({
          location: location || 'New Delhi, IN',
          temperature: 28,
          condition: 'Clear',
          description: 'clear sky',
          humidity: 65,
          windSpeed: 12,
          pressure: 1013,
          visibility: 10,
          icon: '01d',
          coords: { lat: lat || 28.7041, lng: lng || 77.1025 }
        });
      }
      
      let weatherUrl;
      if (lat && lng) {
        weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
      } else if (location) {
        weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;
      } else {
        weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=New Delhi&appid=${apiKey}&units=metric`;
      }
      
      const response = await fetch(weatherUrl);
      if (!response.ok) {
        throw new Error('Weather API request failed');
      }
      
      const data = await response.json();
      
      const weatherData = {
        location: data.name + ', ' + data.sys.country,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6),
        pressure: data.main.pressure,
        visibility: data.visibility ? Math.round(data.visibility / 1000) : null,
        icon: data.weather[0].icon,
        coords: { lat: data.coord.lat, lng: data.coord.lon }
      };
      
      res.json(weatherData);
    } catch (error) {
      console.error('Weather API error:', error);
      const { lat, lng, location } = req.query;
      res.json({
        location: (location as string) || 'New Delhi, IN',
        temperature: 28,
        condition: 'Clear',
        description: 'clear sky',
        humidity: 65,
        windSpeed: 12,
        pressure: 1013,
        visibility: 10,
        icon: '01d',
        coords: { lat: parseFloat((lat as string) || '28.7041'), lng: parseFloat((lng as string) || '77.1025') }
      });
    }
  });

  // GET /api/weather/forecast - Get 5-day forecast  
  app.get("/api/weather/forecast", async (req, res) => {
    try {
      const { lat, lng, location } = req.query;
      const apiKey = process.env.WEATHER_API_KEY;
      
      if (!apiKey) {
        return res.json({ forecast: [] });
      }
      
      let forecastUrl;
      if (lat && lng) {
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
      } else if (location) {
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}&units=metric`;
      } else {
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=New Delhi&appid=${apiKey}&units=metric`;
      }
      
      const response = await fetch(forecastUrl);
      if (!response.ok) {
        throw new Error('Weather forecast API request failed');
      }
      
      const data = await response.json();
      const forecast = data.list.slice(0, 40).map((item: any) => ({
        date: item.dt_txt,
        temperature: Math.round(item.main.temp),
        condition: item.weather[0].main,
        description: item.weather[0].description,
        humidity: item.main.humidity,
        windSpeed: Math.round(item.wind.speed * 3.6),
        icon: item.weather[0].icon
      }));
      
      res.json({ forecast });
    } catch (error) {
      console.error('Weather forecast API error:', error);
      res.json({ forecast: [] });
    }
  });

  // GET /api/disasters - Get disaster history
  app.get("/api/disasters", async (req, res) => {
    try {
      const { location, type, riskLevel, limit = 50 } = req.query;
      
      let filtered = [...disasterDataCache];
      
      if (location) {
        const searchLower = (location as string).toLowerCase();
        filtered = filtered.filter(d => 
          d.location.toLowerCase().includes(searchLower)
        );
      }
      
      if (type && type !== 'all') {
        filtered = filtered.filter(d => 
          d.disasterType === type || d.disasterSubtype === type
        );
      }
      
      if (riskLevel && riskLevel !== 'all') {
        filtered = filtered.filter(d => d.riskLevel === riskLevel);
      }
      
      res.json(filtered.slice(0, parseInt(limit as string)));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch disasters' });
    }
  });

  // POST /api/predict-disaster - AI disaster prediction
  app.post("/api/predict-disaster", async (req, res) => {
    try {
      const { location, temperature, humidity, rainfall } = req.body;
      
      const prediction = await predictDisasterRisk({
        location,
        temperature,
        humidity,
        rainfall
      });
      
      res.json(prediction);
    } catch (error) {
      res.status(500).json({ error: 'Failed to predict disaster' });
    }
  });

  // GET /api/crop-recommendations - Get AI crop recommendations
  app.get("/api/crop-recommendations", async (req, res) => {
    try {
      const { district, state, soilType, fertilityRating } = req.query;
      
      if (!district || !state) {
        return res.status(400).json({ error: 'District and state required' });
      }
      
      const recommendations = await getCropRecommendations({
        district: district as string,
        state: state as string,
        soilType: (soilType as string) || 'Loam',
        fertilityRating: parseFloat(fertilityRating as string) || 8.0
      });
      
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get recommendations' });
    }
  });

  // POST /api/analyze-crop-disease - AI-powered crop disease detection from image using Gemini
  app.post("/api/analyze-crop-disease", async (req, res) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ error: 'No image data provided' });
      }
      
      const result = await analyzeCropDiseaseImage(imageData, cropDiseaseCache);
      res.json(result);
      
    } catch (error: any) {
      console.error('Disease detection error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Disease detection failed' 
      });
    }
  });

  // GET /api/crop-diseases - Get crop disease information by crop name
  app.get("/api/crop-diseases", async (req, res) => {
    try {
      const { crop } = req.query;
      
      console.log(`🔍 Disease search request: "${crop}"`); 
      console.log(`📊 Total diseases in cache: ${cropDiseaseCache.length}`);
      
      const dataSource = cropDiseaseCache;
      
      if (!crop) {
        // Return all diseases if no crop specified
        res.json(dataSource);
        return;
      }
      
      const cropLower = (crop as string).toLowerCase().trim();
      const diseases = dataSource.filter(d => 
        d.crop.toLowerCase().includes(cropLower) ||
        d.crop.toLowerCase() === cropLower
      );
      
      console.log(`✅ Found ${diseases.length} diseases for crop: ${crop}`);
      res.json(diseases);
    } catch (error) {
      console.error('Crop diseases error:', error);
      res.status(500).json({ error: 'Failed to get crop diseases' });
    }
  });

  // GET /api/crop-info - Search crop information from recommendations dataset
  app.get("/api/crop-info", async (req, res) => {
    try {
      const { crop } = req.query;
      
      console.log(`🔍 Crop search request: "${crop}"`); 
      console.log(`📊 Total crops in cache: ${cropRecommendationCache.length}`);
      
      // Fallback data if cache is empty
      const fallbackData = [
        { N: 90, P: 42, K: 43, temperature: 20.87, humidity: 82.00, ph: 6.50, rainfall: 202.93, label: 'rice' },
        { N: 85, P: 58, K: 41, temperature: 21.77, humidity: 80.31, ph: 7.03, rainfall: 226.65, label: 'rice' },
        { N: 71, P: 54, K: 16, temperature: 22.61, humidity: 63.69, ph: 5.74, rainfall: 87.75, label: 'maize' },
        { N: 61, P: 44, K: 17, temperature: 26.10, humidity: 71.57, ph: 6.93, rainfall: 102.26, label: 'maize' },
        { N: 40, P: 72, K: 77, temperature: 17.02, humidity: 16.98, ph: 7.48, rainfall: 88.55, label: 'chickpea' },
        { N: 23, P: 72, K: 84, temperature: 19.02, humidity: 17.13, ph: 6.92, rainfall: 79.92, label: 'chickpea' },
        { N: 13, P: 60, K: 25, temperature: 17.13, humidity: 20.59, ph: 5.68, rainfall: 128.25, label: 'kidneybeans' },
        { N: 25, P: 70, K: 16, temperature: 19.63, humidity: 18.90, ph: 5.75, rainfall: 106.35, label: 'kidneybeans' },
        { N: 3, P: 24, K: 38, temperature: 24.55, humidity: 91.63, ph: 5.92, rainfall: 111.96, label: 'pomegranate' },
        { N: 6, P: 18, K: 37, temperature: 19.65, humidity: 89.93, ph: 5.93, rainfall: 108.04, label: 'pomegranate' },
        { N: 91, P: 94, K: 46, temperature: 29.36, humidity: 76.24, ph: 6.14, rainfall: 92.82, label: 'banana' },
        { N: 105, P: 95, K: 50, temperature: 27.33, humidity: 83.67, ph: 5.84, rainfall: 101.04, label: 'banana' },
        { N: 2, P: 40, K: 27, temperature: 29.73, humidity: 47.54, ph: 5.95, rainfall: 90.09, label: 'mango' },
        { N: 39, P: 24, K: 31, temperature: 33.55, humidity: 53.72, ph: 4.75, rainfall: 98.67, label: 'mango' },
        { N: 24, P: 130, K: 195, temperature: 29.99, humidity: 81.54, ph: 6.11, rainfall: 67.12, label: 'grapes' },
        { N: 13, P: 144, K: 204, temperature: 30.72, humidity: 82.42, ph: 6.09, rainfall: 68.38, label: 'grapes' },
        { N: 119, P: 25, K: 51, temperature: 26.47, humidity: 80.92, ph: 6.28, rainfall: 53.65, label: 'watermelon' },
        { N: 119, P: 19, K: 55, temperature: 25.18, humidity: 83.44, ph: 6.81, rainfall: 46.87, label: 'watermelon' },
        { N: 115, P: 17, K: 55, temperature: 27.57, humidity: 94.11, ph: 6.77, rainfall: 28.08, label: 'muskmelon' },
        { N: 114, P: 27, K: 48, temperature: 27.82, humidity: 93.03, ph: 6.52, rainfall: 26.32, label: 'muskmelon' },
        { N: 24, P: 128, K: 196, temperature: 22.75, humidity: 90.69, ph: 5.52, rainfall: 110.43, label: 'apple' },
        { N: 7, P: 144, K: 197, temperature: 23.84, humidity: 94.34, ph: 6.13, rainfall: 114.05, label: 'apple' },
        { N: 22, P: 30, K: 12, temperature: 15.78, humidity: 92.51, ph: 6.35, rainfall: 119.03, label: 'orange' },
        { N: 37, P: 6, K: 13, temperature: 26.03, humidity: 91.50, ph: 7.51, rainfall: 101.28, label: 'orange' },
        { N: 61, P: 68, K: 50, temperature: 35.21, humidity: 91.49, ph: 6.79, rainfall: 243.07, label: 'papaya' },
        { N: 58, P: 46, K: 45, temperature: 42.39, humidity: 90.79, ph: 6.57, rainfall: 88.46, label: 'papaya' },
        { N: 18, P: 30, K: 29, temperature: 26.76, humidity: 92.86, ph: 6.42, rainfall: 224.59, label: 'coconut' },
        { N: 37, P: 23, K: 28, temperature: 25.61, humidity: 94.31, ph: 5.74, rainfall: 224.32, label: 'coconut' },
        { N: 133, P: 47, K: 24, temperature: 24.40, humidity: 79.19, ph: 7.23, rainfall: 90.80, label: 'cotton' },
        { N: 136, P: 36, K: 20, temperature: 23.09, humidity: 84.86, ph: 6.92, rainfall: 71.29, label: 'cotton' },
        { N: 89, P: 47, K: 38, temperature: 25.52, humidity: 72.24, ph: 6.00, rainfall: 151.88, label: 'jute' },
        { N: 60, P: 37, K: 39, temperature: 26.59, humidity: 82.94, ph: 6.03, rainfall: 161.24, label: 'jute' },
        { N: 32, P: 76, K: 15, temperature: 28.05, humidity: 63.49, ph: 7.60, rainfall: 43.35, label: 'lentil' },
        { N: 13, P: 61, K: 22, temperature: 19.44, humidity: 63.27, ph: 7.72, rainfall: 46.83, label: 'lentil' },
        { N: 91, P: 21, K: 26, temperature: 26.33, humidity: 57.36, ph: 7.26, rainfall: 191.65, label: 'coffee' },
        { N: 107, P: 21, K: 26, temperature: 26.45, humidity: 55.32, ph: 7.23, rainfall: 144.68, label: 'coffee' }
      ];
      
      const dataSource = cropRecommendationCache.length > 0 ? cropRecommendationCache : fallbackData;
      
      if (!crop) {
        // Return unique crop list
        const uniqueCrops = Array.from(new Set(dataSource.map(c => c.label)));
        console.log(`📋 Available crops: ${uniqueCrops.join(', ')}`);
        res.json({ crops: uniqueCrops });
        return;
      }
      
      const cropLower = (crop as string).toLowerCase();
      console.log(`🔍 Searching for: "${cropLower}"`);
      
      const cropData = dataSource.filter(c => 
        c.label.toLowerCase() === cropLower
      );
      
      console.log(`📊 Found ${cropData.length} matches for "${cropLower}"`);
      
      if (cropData.length === 0) {
        // Try partial match
        const partialMatches = dataSource.filter(c => 
          c.label.toLowerCase().includes(cropLower)
        );
        console.log(`🔍 Partial matches found: ${partialMatches.length}`);
        
        if (partialMatches.length > 0) {
          console.log(`📋 Partial matches: ${partialMatches.map(c => c.label).slice(0, 5).join(', ')}`);
          // Use first partial match
          const matchedCrop = partialMatches[0];
          const relatedCrops = dataSource
            .filter(c => c.label.toLowerCase() !== matchedCrop.label.toLowerCase())
            .slice(0, 5)
            .map(c => c.label);
          
          return res.json({
            crop: matchedCrop.label,
            requirements: {
              nitrogen: Math.round(matchedCrop.N * 10) / 10,
              phosphorus: Math.round(matchedCrop.P * 10) / 10,
              potassium: Math.round(matchedCrop.K * 10) / 10,
              temperature: Math.round(matchedCrop.temperature * 10) / 10,
              humidity: Math.round(matchedCrop.humidity * 10) / 10,
              ph: Math.round(matchedCrop.ph * 100) / 100,
              rainfall: Math.round(matchedCrop.rainfall * 10) / 10
            },
            relatedCrops
          });
        }
        
        return res.status(404).json({ error: 'Crop not found' });
      }
      
      // Calculate averages for the crop
      const avgN = cropData.reduce((sum, c) => sum + c.N, 0) / cropData.length;
      const avgP = cropData.reduce((sum, c) => sum + c.P, 0) / cropData.length;
      const avgK = cropData.reduce((sum, c) => sum + c.K, 0) / cropData.length;
      const avgTemp = cropData.reduce((sum, c) => sum + c.temperature, 0) / cropData.length;
      const avgHumidity = cropData.reduce((sum, c) => sum + c.humidity, 0) / cropData.length;
      const avgPh = cropData.reduce((sum, c) => sum + c.ph, 0) / cropData.length;
      const avgRainfall = cropData.reduce((sum, c) => sum + c.rainfall, 0) / cropData.length;
      
      // Find related crops based on similar NPK values
      const relatedCrops = dataSource
        .filter(c => c.label.toLowerCase() !== cropLower)
        .map(c => ({
          crop: c.label,
          similarity: Math.abs(c.N - avgN) + Math.abs(c.P - avgP) + Math.abs(c.K - avgK)
        }))
        .sort((a, b) => a.similarity - b.similarity)
        .slice(0, 5)
        .map(c => c.crop);
      
      const uniqueRelated = Array.from(new Set(relatedCrops));
      
      res.json({
        crop: crop as string,
        requirements: {
          nitrogen: Math.round(avgN * 10) / 10,
          phosphorus: Math.round(avgP * 10) / 10,
          potassium: Math.round(avgK * 10) / 10,
          temperature: Math.round(avgTemp * 10) / 10,
          humidity: Math.round(avgHumidity * 10) / 10,
          ph: Math.round(avgPh * 100) / 100,
          rainfall: Math.round(avgRainfall * 10) / 10
        },
        relatedCrops: uniqueRelated
      });
    } catch (error) {
      console.error('Crop info error:', error);
      res.status(500).json({ error: 'Failed to get crop information' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

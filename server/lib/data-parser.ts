// Data parsing utilities for CSV and PDF datasets
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

export interface SchemeData {
  name: string;
  slug: string;
  details: string;
  benefits: string;
  eligibility: string;
  applicationUrl?: string;
  documents?: string;
  level?: string;
  category?: string;
  tags?: string[];
}

export interface CrimeData {
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
}

export interface DisasterData {
  location: string;
  state?: string;
  disasterType: string;
  disasterSubtype: string;
  year: number;
  month?: number;
  deaths: number;
  affected: number;
  latitude?: number;
  longitude?: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
}

// Parse schemes CSV (simple format: name, description alternating lines)
export async function parseSchemesCSV(): Promise<SchemeData[]> {
  const csvPath = path.join(process.cwd(), 'attached_assets', 'updated_data[1]_1760544223833.csv');
  
  try {
    if (!fs.existsSync(csvPath)) {
      console.warn('CSV file not found, using fallback data');
      return getFallbackSchemes();
    }
    
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    const schemes: SchemeData[] = [];
    
    // Parse pairs of lines: name, description, name, description...
    for (let i = 0; i < lines.length; i += 2) {
      if (i + 1 < lines.length) {
        const name = lines[i].trim();
        const details = lines[i + 1].trim();
        
        if (name && details) {
          schemes.push({
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, ''),
            details,
            benefits: 'Financial and social support',
            eligibility: 'Eligible women and families',
            applicationUrl: 'https://india.gov.in',
            documents: '',
            level: 'Central',
            category: determineCategoryFromName(name),
            tags: []
          });
        }
      }
    }
    
    return schemes.length > 0 ? schemes : getFallbackSchemes();
  } catch (error) {
    console.error('CSV parsing error:', error);
    return getFallbackSchemes();
  }
}

// Fallback schemes data - 100 schemes
function getFallbackSchemes(): SchemeData[] {
  const baseSchemes = [
    { name: 'Beti Bachao Beti Padhao', category: 'Education', details: 'Government scheme to save and educate girl children', benefits: 'Financial support for girl child education', eligibility: 'Families with girl children' },
    { name: 'Pradhan Mantri Matru Vandana Yojana', category: 'Health', details: 'Maternity benefit scheme for pregnant mothers', benefits: 'Cash incentive of Rs 5000', eligibility: 'Pregnant mothers' },
    { name: 'Sukanya Samriddhi Yojana', category: 'Financial', details: 'Savings scheme for girl child', benefits: 'High interest savings account', eligibility: 'Girl child under 10 years' },
    { name: 'Mahila Shakti Kendra', category: 'Empowerment', details: 'Women empowerment program', benefits: 'Skill development and training', eligibility: 'Rural women' },
    { name: 'One Stop Centre', category: 'Safety', details: 'Support for women facing violence', benefits: 'Legal aid and counseling', eligibility: 'Women in distress' },
    { name: 'Women Helpline', category: 'Safety', details: '24x7 helpline for women', benefits: 'Emergency support', eligibility: 'All women' },
    { name: 'Ujjawala Scheme', category: 'Safety', details: 'Prevention of trafficking', benefits: 'Rehabilitation support', eligibility: 'Trafficked women' },
    { name: 'Swadhar Greh', category: 'Safety', details: 'Shelter for women in distress', benefits: 'Temporary accommodation', eligibility: 'Homeless women' },
    { name: 'Working Women Hostel', category: 'Safety', details: 'Safe accommodation for working women', benefits: 'Affordable housing', eligibility: 'Working women' },
    { name: 'Mahila Police Volunteers', category: 'Safety', details: 'Community policing program', benefits: 'Safety awareness', eligibility: 'Women volunteers' }
  ];
  
  const schemes: SchemeData[] = [];
  for (let i = 0; i < 100; i++) {
    const base = baseSchemes[i % baseSchemes.length];
    schemes.push({
      name: `${base.name} ${Math.floor(i/10) + 1}`,
      slug: `${base.name.toLowerCase().replace(/\s+/g, '-')}-${i+1}`,
      details: base.details,
      benefits: base.benefits,
      eligibility: base.eligibility,
      applicationUrl: 'https://india.gov.in',
      level: 'Central',
      category: base.category
    });
  }
  return schemes;
}

// Helper function to determine category from scheme name
function determineCategoryFromName(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('education') || lowerName.includes('padhao') || lowerName.includes('school')) {
    return 'Education';
  } else if (lowerName.includes('health') || lowerName.includes('matru') || lowerName.includes('medical')) {
    return 'Health';
  } else if (lowerName.includes('safety') || lowerName.includes('violence') || lowerName.includes('protection')) {
    return 'Safety';
  } else if (lowerName.includes('shakti') || lowerName.includes('empowerment')) {
    return 'Empowerment';
  } else if (lowerName.includes('entrepreneur') || lowerName.includes('loan') || lowerName.includes('stand up')) {
    return 'Entrepreneurship';
  } else if (lowerName.includes('savings') || lowerName.includes('samriddhi') || lowerName.includes('financial')) {
    return 'Financial';
  }
  
  return 'General';
}

// Parse comprehensive crime CSV data (2001-2014)
export async function parseComprehensiveCrimeCSV(): Promise<CrimeData[]> {
  const csvPath = path.join(process.cwd(), 'attached_assets', 'crimes_against_women_2001-2014_1760601891621.csv');
  
  try {
    if (!fs.existsSync(csvPath)) {
      console.warn('Comprehensive crime CSV not found, using fallback');
      return getFallbackCrimeData();
    }
    
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const result = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    const crimeData: CrimeData[] = [];
    const stateDistrictMap = new Map<string, CrimeData[]>();
    
    for (const row of result.data as any[]) {
      if (!row['STATE/UT'] || !row.Year) continue;
      
      const state = String(row['STATE/UT']).toUpperCase().trim();
      const district = row.DISTRICT ? String(row.DISTRICT).toUpperCase().trim() : undefined;
      const year = parseInt(row.Year);
      
      const rape = parseInt(row.Rape) || 0;
      const kidnapping = parseInt(row['Kidnapping and Abduction']) || 0;
      const dowryDeath = parseInt(row['Dowry Deaths']) || 0;
      const assaultOnWomen = parseInt(row['Assault on women with intent to outrage her modesty']) || 0;
      const assaultOnModesty = parseInt(row['Insult to modesty of Women']) || 0;
      const domesticViolence = parseInt(row['Cruelty by Husband or his Relatives']) || 0;
      const trafficking = parseInt(row['Importation of Girls']) || 0;
      
      const totalCrimes = rape + kidnapping + dowryDeath + assaultOnWomen + 
                          assaultOnModesty + domesticViolence + trafficking;
      
      if (totalCrimes === 0) continue;
      
      const crimes = [
        { type: 'Rape', count: rape },
        { type: 'Kidnapping & Abduction', count: kidnapping },
        { type: 'Dowry Deaths', count: dowryDeath },
        { type: 'Assault on Women', count: assaultOnWomen },
        { type: 'Assault on Modesty', count: assaultOnModesty },
        { type: 'Domestic Violence', count: domesticViolence },
        { type: 'Trafficking', count: trafficking }
      ];
      const highestCrime = crimes.reduce((max, crime) => 
        crime.count > max.count ? crime : max
      );
      
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (totalCrimes < 500) riskLevel = 'low';
      else if (totalCrimes < 2000) riskLevel = 'medium';
      else if (totalCrimes < 5000) riskLevel = 'high';
      else riskLevel = 'critical';
      
      const crimeEntry: CrimeData = {
        state,
        district,
        year,
        rape,
        kidnapping,
        dowryDeath,
        assaultOnWomen,
        assaultOnModesty,
        domesticViolence,
        trafficking,
        totalCrimes,
        riskLevel,
        highestCrimeType: highestCrime.type,
        highestCrimeCount: highestCrime.count
      };
      
      const key = district ? `${state}:${district}` : state;
      if (!stateDistrictMap.has(key)) {
        stateDistrictMap.set(key, []);
      }
      stateDistrictMap.get(key)!.push(crimeEntry);
    }
    
    // Get the latest year data for each state/district
    for (const [key, entries] of Array.from(stateDistrictMap.entries())) {
      const latest = entries.reduce((max: CrimeData, entry: CrimeData) => 
        entry.year > max.year ? entry : max
      );
      crimeData.push(latest);
    }
    
    console.log(`✅ Parsed ${crimeData.length} crime records from comprehensive dataset`);
    return crimeData.length > 0 ? crimeData : getFallbackCrimeData();
  } catch (error) {
    console.error('Comprehensive crime CSV parsing error:', error);
    return getFallbackCrimeData();
  }
}

// Parse disaster CSV data
export async function parseDisasterCSV(): Promise<DisasterData[]> {
  const csvPath = path.join(process.cwd(), 'attached_assets', 'disasterIND_1760601997610.csv');
  
  try {
    if (!fs.existsSync(csvPath)) {
      console.warn('Disaster CSV not found, using fallback');
      return [];
    }
    
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const result = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    const disasterData: DisasterData[] = [];
    const locationMap = new Map<string, DisasterData[]>();
    
    for (const row of result.data as any[]) {
      if (!row['Disaster Type'] || !row['Start Year']) continue;
      
      const location = row.Location ? String(row.Location).trim() : 'Unknown';
      const disasterType = String(row['Disaster Type']).trim();
      const disasterSubtype = row['Disaster Subtype'] ? String(row['Disaster Subtype']).trim() : disasterType;
      const year = parseInt(row['Start Year']);
      const month = row['Start Month'] ? parseInt(row['Start Month']) : undefined;
      const deaths = parseFloat(row['Total Deaths']) || 0;
      const affected = parseFloat(row['Total Affected']) || parseFloat(row['No. Affected']) || 0;
      const latitude = row.Latitude ? parseFloat(row.Latitude) : undefined;
      const longitude = row.Longitude ? parseFloat(row.Longitude) : undefined;
      
      let riskLevel: 'low' | 'moderate' | 'high' | 'severe';
      if (deaths < 10 && affected < 1000) riskLevel = 'low';
      else if (deaths < 100 && affected < 10000) riskLevel = 'moderate';
      else if (deaths < 1000 && affected < 100000) riskLevel = 'high';
      else riskLevel = 'severe';
      
      const disasterEntry: DisasterData = {
        location,
        disasterType,
        disasterSubtype,
        year,
        month,
        deaths,
        affected,
        latitude,
        longitude,
        riskLevel
      };
      
      if (!locationMap.has(location)) {
        locationMap.set(location, []);
      }
      locationMap.get(location)!.push(disasterEntry);
    }
    
    // Get all disasters, sorted by year (most recent first)
    for (const entries of Array.from(locationMap.values())) {
      disasterData.push(...entries);
    }
    
    disasterData.sort((a, b) => b.year - a.year);
    
    console.log(`✅ Parsed ${disasterData.length} disaster records`);
    return disasterData;
  } catch (error) {
    console.error('Disaster CSV parsing error:', error);
    return [];
  }
}

// Parse crime data from PDF - using actual dataset structure
export async function parseCrimePDF(): Promise<CrimeData[]> {
  const pdfPath = path.join(process.cwd(), 'attached_assets', 'Crimes_1760597839379.pdf');
  
  try {
    if (!fs.existsSync(pdfPath)) {
      console.warn('Crime PDF not found, using fallback data');
      return getFallbackCrimeData();
    }
    
    const fileContent = fs.readFileSync(pdfPath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    const crimeData: CrimeData[] = [];
    
    // Parse the data - format: State, Year, Rape, K&A, DD, AoW, AoM, DV, WT
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      
      // Skip header and invalid lines
      if (parts.length < 9 || parts.includes('State') || parts.includes('Year')) {
        continue;
      }
      
      // Find where the state name ends and numbers begin
      let stateEndIndex = 0;
      for (let i = 0; i < parts.length; i++) {
        if (!isNaN(parseInt(parts[i])) && parseInt(parts[i]) > 1900) {
          stateEndIndex = i;
          break;
        }
      }
      
      if (stateEndIndex === 0) continue;
      
      const stateName = parts.slice(0, stateEndIndex).join(' ').toUpperCase();
      const year = parseInt(parts[stateEndIndex]);
      
      // Extract crime counts
      const rape = parseInt(parts[stateEndIndex + 1]) || 0;
      const kidnapping = parseInt(parts[stateEndIndex + 2]) || 0;
      const dowryDeath = parseInt(parts[stateEndIndex + 3]) || 0;
      const assaultOnWomen = parseInt(parts[stateEndIndex + 4]) || 0;
      const assaultOnModesty = parseInt(parts[stateEndIndex + 5]) || 0;
      const domesticViolence = parseInt(parts[stateEndIndex + 6]) || 0;
      const trafficking = parseInt(parts[stateEndIndex + 7]) || 0;
      
      const totalCrimes = rape + kidnapping + dowryDeath + assaultOnWomen + 
                          assaultOnModesty + domesticViolence + trafficking;
      
      // Determine highest crime type
      const crimes = [
        { type: 'Rape', count: rape },
        { type: 'Kidnapping & Abduction', count: kidnapping },
        { type: 'Dowry Deaths', count: dowryDeath },
        { type: 'Assault on Women', count: assaultOnWomen },
        { type: 'Assault on Modesty', count: assaultOnModesty },
        { type: 'Domestic Violence', count: domesticViolence },
        { type: 'Women Trafficking', count: trafficking }
      ];
      const highestCrime = crimes.reduce((max, crime) => 
        crime.count > max.count ? crime : max
      );
      
      // Calculate risk level based on total crimes
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (totalCrimes < 2000) riskLevel = 'low';
      else if (totalCrimes < 5000) riskLevel = 'medium';
      else if (totalCrimes < 10000) riskLevel = 'high';
      else riskLevel = 'critical';
      
      crimeData.push({
        state: stateName,
        year,
        rape,
        kidnapping,
        dowryDeath,
        assaultOnWomen,
        assaultOnModesty,
        domesticViolence,
        trafficking,
        totalCrimes,
        riskLevel,
        highestCrimeType: highestCrime.type,
        highestCrimeCount: highestCrime.count
      });
    }
    
    // Group by state and get latest year data for each state
    const stateMap = new Map<string, CrimeData>();
    for (const data of crimeData) {
      const existing = stateMap.get(data.state);
      if (!existing || data.year > existing.year) {
        stateMap.set(data.state, data);
      }
    }
    
    const result = Array.from(stateMap.values());
    return result.length > 0 ? result : getFallbackCrimeData();
  } catch (error) {
    console.error('Crime PDF parsing error:', error);
    return getFallbackCrimeData();
  }
}

// Fallback crime data
function getFallbackCrimeData(): CrimeData[] {
  return [
    { state: 'DELHI', year: 2020, rape: 1200, kidnapping: 800, dowryDeath: 100, assaultOnWomen: 500, assaultOnModesty: 300, domesticViolence: 1500, trafficking: 100, totalCrimes: 4500, riskLevel: 'critical', highestCrimeType: 'Domestic Violence', highestCrimeCount: 1500 },
    { state: 'MAHARASHTRA', year: 2020, rape: 1400, kidnapping: 900, dowryDeath: 120, assaultOnWomen: 600, assaultOnModesty: 350, domesticViolence: 1800, trafficking: 80, totalCrimes: 5250, riskLevel: 'critical', highestCrimeType: 'Domestic Violence', highestCrimeCount: 1800 },
    { state: 'UTTAR PRADESH', year: 2020, rape: 2000, kidnapping: 1200, dowryDeath: 200, assaultOnWomen: 800, assaultOnModesty: 500, domesticViolence: 2500, trafficking: 100, totalCrimes: 7300, riskLevel: 'critical', highestCrimeType: 'Domestic Violence', highestCrimeCount: 2500 },
    { state: 'WEST BENGAL', year: 2020, rape: 1100, kidnapping: 700, dowryDeath: 90, assaultOnWomen: 450, assaultOnModesty: 280, domesticViolence: 1400, trafficking: 80, totalCrimes: 4100, riskLevel: 'high', highestCrimeType: 'Domestic Violence', highestCrimeCount: 1400 },
    { state: 'KARNATAKA', year: 2020, rape: 600, kidnapping: 400, dowryDeath: 50, assaultOnWomen: 250, assaultOnModesty: 150, domesticViolence: 800, trafficking: 50, totalCrimes: 2300, riskLevel: 'medium', highestCrimeType: 'Domestic Violence', highestCrimeCount: 800 },
  ];
}

// Map state to approximate coordinates (comprehensive)
export function getStateCoordinates(state: string): { lat: number; lng: number } {
  const stateCoords: Record<string, { lat: number; lng: number }> = {
    'DELHI': { lat: 28.7041, lng: 77.1025 },
    'MAHARASHTRA': { lat: 19.7515, lng: 75.7139 },
    'UTTAR PRADESH': { lat: 26.8467, lng: 80.9462 },
    'WEST BENGAL': { lat: 22.9868, lng: 87.8550 },
    'KARNATAKA': { lat: 15.3173, lng: 75.7139 },
    'TAMIL NADU': { lat: 11.1271, lng: 78.6569 },
    'BIHAR': { lat: 25.0961, lng: 85.3131 },
    'GUJARAT': { lat: 22.2587, lng: 71.1924 },
    'PUNJAB': { lat: 31.1471, lng: 75.3412 },
    'RAJASTHAN': { lat: 27.0238, lng: 74.2179 },
    'ANDHRA PRADESH': { lat: 15.9129, lng: 79.7400 },
    'ASSAM': { lat: 26.2006, lng: 92.9376 },
    'CHHATTISGARH': { lat: 21.2787, lng: 81.8661 },
    'GOA': { lat: 15.2993, lng: 74.1240 },
    'HARYANA': { lat: 29.0588, lng: 76.0856 },
    'HIMACHAL PRADESH': { lat: 31.1048, lng: 77.1734 },
    'JAMMU & KASHMIR': { lat: 33.7782, lng: 76.5762 },
    'JHARKHAND': { lat: 23.6102, lng: 85.2799 },
    'KERALA': { lat: 10.8505, lng: 76.2711 },
    'MADHYA PRADESH': { lat: 22.9734, lng: 78.6569 },
    'MEGHALAYA': { lat: 25.4670, lng: 91.3662 },
    'ODISHA': { lat: 20.9517, lng: 85.0985 },
    'TELANGANA': { lat: 18.1124, lng: 79.0193 },
    'TRIPURA': { lat: 23.9408, lng: 91.9882 },
    'UTTARAKHAND': { lat: 30.0668, lng: 79.0193 },
    'ARUNACHAL PRADESH': { lat: 28.2180, lng: 94.7278 },
    'MANIPUR': { lat: 24.6637, lng: 93.9063 },
    'MIZORAM': { lat: 23.1645, lng: 92.9376 },
    'NAGALAND': { lat: 26.1584, lng: 94.5624 },
    'SIKKIM': { lat: 27.5330, lng: 88.5122 },
    'CHANDIGARH': { lat: 30.7333, lng: 76.7794 },
  };

  const upperState = state.toUpperCase().trim();
  return stateCoords[upperState] || { lat: 20.5937, lng: 78.9629 };
}

// Get district coordinates (approximate based on major districts)
export function getDistrictCoordinates(state: string, district: string): { lat: number; lng: number } {
  const districtCoords: Record<string, { lat: number; lng: number }> = {
    'CHANDIGARH:CHANDIGARH': { lat: 30.7333, lng: 76.7794 },
    'PUNJAB:MOHALI': { lat: 30.7046, lng: 76.7179 },
    'PUNJAB:PATIALA': { lat: 30.3398, lng: 76.3869 },
    'PUNJAB:LUDHIANA': { lat: 30.9010, lng: 75.8573 },
    'HARYANA:GURGAON': { lat: 28.4595, lng: 77.0266 },
    'HARYANA:FARIDABAD': { lat: 28.4089, lng: 77.3178 },
    'DELHI:NEW DELHI': { lat: 28.6139, lng: 77.2090 },
    'DELHI:SOUTH DELHI': { lat: 28.5244, lng: 77.1855 },
    'UTTAR PRADESH:NOIDA': { lat: 28.5355, lng: 77.3910 },
    'UTTAR PRADESH:LUCKNOW': { lat: 26.8467, lng: 80.9462 },
    'MAHARASHTRA:MUMBAI': { lat: 19.0760, lng: 72.8777 },
    'MAHARASHTRA:PUNE': { lat: 18.5204, lng: 73.8567 },
    'KARNATAKA:BANGALORE': { lat: 12.9716, lng: 77.5946 },
    'TAMIL NADU:CHENNAI': { lat: 13.0827, lng: 80.2707 },
  };
  
  const key = `${state.toUpperCase().trim()}:${district.toUpperCase().trim()}`;
  if (districtCoords[key]) {
    return districtCoords[key];
  }
  
  // If district not found, return state coordinates with small offset
  const stateCoord = getStateCoordinates(state);
  return {
    lat: stateCoord.lat + (Math.random() - 0.5) * 0.5,
    lng: stateCoord.lng + (Math.random() - 0.5) * 0.5
  };
}

// Crop Disease Data Interface
export interface CropDiseaseData {
  crop: string;
  disease: string;
  description: string;
  symptoms: string;
  prevention: string;
  cure: string;
}

// Crop Recommendation Data Interface
export interface CropRecommendationData {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
  label: string;
}

// Parse crop disease CSV
export async function parseCropDiseaseCSV(): Promise<CropDiseaseData[]> {
  const csvPath = path.join(process.cwd(), 'server', 'crop_disease_dataset.csv');
  
  try {
    if (!fs.existsSync(csvPath)) {
      console.warn('Crop disease CSV not found, using fallback data');
      return getFallbackDiseaseData();
    }
    
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const result = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false
    });
    
    const diseaseData: CropDiseaseData[] = [];
    
    for (const row of result.data as any[]) {
      if (row['Crop'] && row['Disease']) {
        diseaseData.push({
          crop: String(row['Crop']).trim(),
          disease: String(row['Disease']).trim(),
          description: String(row['Description'] || '').trim(),
          symptoms: String(row['Symptoms'] || '').trim(),
          prevention: String(row['Prevention'] || '').trim(),
          cure: String(row['Cure'] || '').trim(),
        });
      }
    }
    
    console.log(`✅ Parsed ${diseaseData.length} crop disease records`);
    return diseaseData.length > 0 ? diseaseData : getFallbackDiseaseData();
  } catch (error) {
    console.error('Crop disease CSV parsing error:', error);
    return getFallbackDiseaseData();
  }
}

// Fallback disease data
function getFallbackDiseaseData(): CropDiseaseData[] {
  return [
    { crop: 'Tomato', disease: 'Late Blight', description: 'Fungal infection by Phytophthora infestans', symptoms: 'Dark lesions on leaves and stems', prevention: 'Remove infected plants', cure: 'Apply fungicide like Ridomil' },
    { crop: 'Tomato', disease: 'Early Blight', description: 'Fungal disease caused by Alternaria solani', symptoms: 'Concentric rings on leaves', prevention: 'Crop rotation', cure: 'Use mancozeb spray' },
    { crop: 'Rice', disease: 'Bacterial Leaf Blight', description: 'Bacterial infection caused by Xanthomonas oryzae', symptoms: 'Pale yellow lesions that turn brown', prevention: 'Proper field sanitation', cure: 'Apply copper-based bactericides' },
    { crop: 'Rice', disease: 'Brown Spot', description: 'Fungal disease', symptoms: 'Small brown spots on leaves', prevention: 'Use balanced fertilizer', cure: 'Apply fungicide' },
    { crop: 'Wheat', disease: 'Rust', description: 'Fungal disease caused by Puccinia spp.', symptoms: 'Orange pustules on stems', prevention: 'Use resistant varieties', cure: 'Apply fungicide spray' },
    { crop: 'Potato', disease: 'Early Blight', description: 'Fungal disease', symptoms: 'Concentric rings on leaves and stems', prevention: 'Crop rotation', cure: 'Apply mancozeb' },
    { crop: 'Maize', disease: 'Turcicum Leaf Blight', description: 'Fungal infection', symptoms: 'Gray-green lesions on leaves', prevention: 'Resistant hybrids', cure: 'Fungicide application' },
    { crop: 'Cotton', disease: 'Leaf Curl Virus', description: 'Viral disease', symptoms: 'Leaf curling and stunting', prevention: 'Use resistant varieties', cure: 'Remove infected plants' },
    { crop: 'Apple', disease: 'Apple Scab', description: 'Fungal infection by Venturia inaequalis', symptoms: 'Dark spots on leaves and fruits', prevention: 'Prune trees', cure: 'Apply captan spray' },
    { crop: 'Banana', disease: 'Panama Wilt', description: 'Fungal disease', symptoms: 'Foliage yellowing and wilting', prevention: 'Use resistant cultivars', cure: 'Soil treatment with fungicide' }
  ];
}

// Parse crop recommendation CSV
export async function parseCropRecommendationCSV(): Promise<CropRecommendationData[]> {
  const csvPath = path.join(process.cwd(), 'server', 'crop_recommendations_clean.csv');
  
  try {
    if (!fs.existsSync(csvPath)) {
      console.warn('Crop recommendation CSV not found');
      return [];
    }
    
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    
    const result = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    const cropData: CropRecommendationData[] = [];
    
    for (const row of result.data as any[]) {
      if (row.N !== undefined && row.label) {
        cropData.push({
          N: parseFloat(row.N),
          P: parseFloat(row.P),
          K: parseFloat(row.K),
          temperature: parseFloat(row.temperature),
          humidity: parseFloat(row.humidity),
          ph: parseFloat(row.ph),
          rainfall: parseFloat(row.rainfall),
          label: String(row.label).trim()
        });
      }
    }
    
    console.log(`✅ Parsed ${cropData.length} crop recommendation records`);
    return cropData;
  } catch (error) {
    console.error('Crop recommendation CSV parsing error:', error);
    return [];
  }
}

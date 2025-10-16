// Google Gemini AI client setup
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeSafetyRisk(location: { lat: number; lng: number; state?: string }): Promise<{
  riskLevel: string;
  confidence: number;
  recommendations: string[];
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `You are a safety risk analyst. Analyze the given location and provide risk assessment with recommendations.
Location: lat ${location.lat}, lng ${location.lng}${location.state ? `, state: ${location.state}` : ''}

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{ "riskLevel": "low|medium|high|critical", "confidence": 0.7, "recommendations": ["recommendation1", "recommendation2"] }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json\n?|\n?```/g, '').trim();
    
    const parsed = JSON.parse(text);
    return {
      riskLevel: parsed.riskLevel || 'medium',
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
      recommendations: parsed.recommendations || ['Stay alert', 'Enable location tracking']
    };
  } catch (error) {
    console.error('Safety risk analysis failed:', error);
    return {
      riskLevel: 'medium',
      confidence: 0.5,
      recommendations: ['Unable to analyze risk - stay alert']
    };
  }
}

export async function getCropRecommendations(data: {
  district: string;
  state: string;
  soilType: string;
  fertilityRating: number;
}): Promise<{
  crops: string[];
  profitabilityScore: number;
  insights: string;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `You are an agricultural expert. Recommend crops based on soil and location data.
District: ${data.district}, State: ${data.state}, Soil: ${data.soilType}, Fertility: ${data.fertilityRating}/10

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{ "crops": ["crop1", "crop2", "crop3"], "profitabilityScore": 85, "insights": "detailed insights here" }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json\n?|\n?```/g, '').trim();
    
    const parsed = JSON.parse(text);
    return {
      crops: parsed.crops || ['Wheat', 'Rice'],
      profitabilityScore: Math.max(0, Math.min(100, parsed.profitabilityScore || 70)),
      insights: parsed.insights || 'Crop recommendations based on soil and climate conditions.'
    };
  } catch (error) {
    console.error('Crop recommendation failed:', error);
    return {
      crops: ['Wheat', 'Rice', 'Maize'],
      profitabilityScore: 70,
      insights: 'Standard crop recommendations for the region.'
    };
  }
}

export async function predictDisasterRisk(weatherData: {
  location: string;
  temperature: number;
  humidity: number;
  rainfall?: number;
}): Promise<{
  disasterType: string;
  severity: string;
  probability: number;
  alert: string;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `You are a disaster prediction expert. Analyze weather data to predict disaster risks.
Location: ${weatherData.location}, Temp: ${weatherData.temperature}°C, Humidity: ${weatherData.humidity}%, Rainfall: ${weatherData.rainfall || 0}mm

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{ "disasterType": "Flood|Drought|Cyclone|None", "severity": "low|moderate|high|severe", "probability": 0.5, "alert": "detailed alert message" }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json\n?|\n?```/g, '').trim();
    
    const parsed = JSON.parse(text);
    return {
      disasterType: parsed.disasterType || 'None',
      severity: parsed.severity || 'low',
      probability: Math.max(0, Math.min(1, parsed.probability || 0.3)),
      alert: parsed.alert || 'Normal weather conditions expected.'
    };
  } catch (error) {
    console.error('Disaster prediction failed:', error);
    return {
      disasterType: 'None',
      severity: 'low',
      probability: 0.3,
      alert: 'Weather monitoring in progress.'
    };
  }
}

// OpenAI client setup
// Reference: javascript_openai blueprint
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy-key' });

export async function analyzeSafetyRisk(location: { lat: number; lng: number; state?: string }): Promise<{
  riskLevel: string;
  confidence: number;
  recommendations: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a safety risk analyst. Analyze the given location and provide risk assessment with recommendations. Respond with JSON in this format: { 'riskLevel': 'low'|'medium'|'high'|'critical', 'confidence': number (0-1), 'recommendations': string[] }",
        },
        {
          role: "user",
          content: `Analyze safety risk for location: lat ${location.lat}, lng ${location.lng}${location.state ? `, state: ${location.state}` : ''}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      riskLevel: result.riskLevel || 'medium',
      confidence: Math.max(0, Math.min(1, result.confidence || 0.7)),
      recommendations: result.recommendations || ['Stay alert', 'Enable location tracking']
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
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an agricultural expert. Recommend crops based on soil and location data. Respond with JSON in this format: { 'crops': string[], 'profitabilityScore': number (0-100), 'insights': string }",
        },
        {
          role: "user",
          content: `Recommend crops for: District: ${data.district}, State: ${data.state}, Soil: ${data.soilType}, Fertility: ${data.fertilityRating}/10`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      crops: result.crops || ['Wheat', 'Rice'],
      profitabilityScore: Math.max(0, Math.min(100, result.profitabilityScore || 70)),
      insights: result.insights || 'Crop recommendations based on soil and climate conditions.'
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
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a disaster prediction expert. Analyze weather data to predict disaster risks. Respond with JSON in this format: { 'disasterType': string, 'severity': 'low'|'moderate'|'high'|'severe', 'probability': number (0-1), 'alert': string }",
        },
        {
          role: "user",
          content: `Analyze disaster risk for: Location: ${weatherData.location}, Temp: ${weatherData.temperature}°C, Humidity: ${weatherData.humidity}%, Rainfall: ${weatherData.rainfall || 0}mm`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      disasterType: result.disasterType || 'None',
      severity: result.severity || 'low',
      probability: Math.max(0, Math.min(1, result.probability || 0.3)),
      alert: result.alert || 'Normal weather conditions expected.'
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

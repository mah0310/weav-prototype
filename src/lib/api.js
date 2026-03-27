// Open-Meteo: free, no API key needed
export async function getWeather(lat, lng) {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`
    )
    const d = await r.json()
    const code = d.current.weather_code
    const temp = Math.round(d.current.temperature_2m)
    const weather = code <= 1 ? 'sunny' : code <= 48 ? 'cloudy' : 'rainy'
    return { temp, weather }
  } catch {
    return { temp: 15, weather: 'sunny' }
  }
}

// Mapbox Geocoding API for reverse geocoding
export async function getArea(lat, lng, token) {
  try {
    const r = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=neighborhood,district,locality&language=ja&access_token=${token}`
    )
    const d = await r.json()
    return d.features?.[0]?.text || d.features?.[0]?.place_name?.split(',')[0] || '不明'
  } catch {
    return '不明'
  }
}

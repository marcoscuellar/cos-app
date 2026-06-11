import { useEffect, useState } from "react";

// Tiny weather chip for the sidebar. Uses Open-Meteo (free, no key, CORS-ok).
// Defaults to Chicago (home timezone) so it never triggers a location prompt.
const CHICAGO = { lat: 41.8781, lon: -87.6298, place: "Chicago" };

const COND: Record<number, string> = {
  0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Fog", 51: "Drizzle", 53: "Drizzle", 55: "Drizzle",
  56: "Freezing drizzle", 57: "Freezing drizzle", 61: "Rain", 63: "Rain", 65: "Heavy rain",
  66: "Freezing rain", 67: "Freezing rain", 71: "Snow", 73: "Snow", 75: "Heavy snow",
  77: "Snow", 80: "Showers", 81: "Showers", 82: "Heavy showers",
  85: "Snow showers", 86: "Snow showers", 95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
};
const EMOJI: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌦️", 56: "🌧️", 57: "🌧️",
  61: "🌧️", 63: "🌧️", 65: "🌧️", 66: "🌧️", 67: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "❄️", 77: "🌨️",
  80: "🌦️", 81: "🌧️", 82: "⛈️", 85: "🌨️", 86: "🌨️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

export function Weather() {
  const [wx, setWx] = useState<{ temp: number; code: number; place: string } | null>(null);

  useEffect(() => {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${CHICAGO.lat}&longitude=${CHICAGO.lon}` +
      `&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d?.current) setWx({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code, place: CHICAGO.place });
      })
      .catch(() => {});
  }, []);

  if (!wx) return null;
  return (
    <div className="sb-weather" title={`${COND[wx.code] ?? "Weather"} · ${wx.place}`}>
      <span className="wx-emoji">{EMOJI[wx.code] ?? "🌡️"}</span>
      <span className="wx-temp">{wx.temp}°</span>
      <span className="wx-cond">{COND[wx.code] ?? ""}</span>
    </div>
  );
}

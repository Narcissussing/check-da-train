import axios from "axios";

const IDFM_API_KEY = process.env.IDFM_API_KEY;

const URLs = {
  OM: "https://api.open-meteo.com/v1",
  IDFM: "https://prim.iledefrance-mobilites.fr/marketplace",
};
const TIMEOUT_MS = 10_000;

// === Clients HTTP ===

const idfmClient = axios.create({
  baseURL: URLs.IDFM,
  headers: { apikey: IDFM_API_KEY },
  timeout: TIMEOUT_MS,
});

const openMeteoClient = axios.create({
  baseURL: URLs.OM,
  timeout: TIMEOUT_MS,
});

// === IDFM : trains & trafic Ligne P ===

export async function recupererProchainsPassages(monitoringRef) {
  const { data } = await idfmClient.get("/stop-monitoring", {
    params: { MonitoringRef: monitoringRef },
  });
  return data;
}

export async function recupererInfosTrafic() {
  const { data } = await idfmClient.get("/disruptions_bulk/disruptions/v2", {
    params: { LineRef: "STIF:Line::C01730:" },
  });
  return data;
}

// === Open-Meteo — météo ===

// Une seule requête par ville, évite de multiplier les appels à Open-Meteo.
export async function recupererDonneesMeteo(ville) {
  const { data } = await openMeteoClient.get("/forecast", {
    params: {
      latitude: ville.latitude,
      longitude: ville.longitude,
      current:
        "temperature_2m,apparent_temperature,weather_code,precipitation,is_day,relative_humidity_2m,wind_speed_10m",
      daily: "sunrise,sunset,temperature_2m_min,temperature_2m_max",
      hourly: "temperature_2m,precipitation,cloud_cover,weather_code",
      timezone: "Europe/Paris",
    },
  });
  return data;
}

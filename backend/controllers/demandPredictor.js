import express from 'express'
Router

// Disease and outbreak data
const diseaseMap = [
  { disease: 'Dengue', medicines: ['Paracetamol', 'ORS'] },
  { disease: 'Typhoid', medicines: ['Cefixime', 'ORS'] },
  { disease: 'Malaria', medicines: ['Artemether', 'Lumefantrine'] },
  { disease: 'Common Cold', medicines: ['Cetirizine', 'Paracetamol'] },
  { disease: 'Flu', medicines: ['Azithromycin', 'Paracetamol'] }
];

const outbreakData = [
  { state: 'Maharashtra', district: 'Pune', disease: 'Dengue', cases: 34, deaths: 1, week: 27, year: 2025, latitude: 18.5204, longitude: 73.8567 },
  { state: 'Gujarat', district: 'Ahmedabad', disease: 'Typhoid', cases: 25, deaths: 0, week: 27, year: 2025, latitude: 23.0225, longitude: 72.5714 },
  { state: 'Maharashtra', district: 'Nagpur', disease: 'Common Cold', cases: 40, deaths: 0, week: 27, year: 2025, latitude: 21.1458, longitude: 79.0882 },
  { state: 'Punjab', district: 'Amritsar', disease: 'Flu', cases: 20, deaths: 0, week: 27, year: 2025, latitude: 31.6340, longitude: 74.8723 },
  { state: 'Gujarat', district: 'Surat', disease: 'Malaria', cases: 15, deaths: 0, week: 27, year: 2025, latitude: 21.1702, longitude: 72.8311 },
  { state: 'Punjab', district: 'Ludhiana', disease: 'Dengue', cases: 18, deaths: 1, week: 27, year: 2025, latitude: 30.9010, longitude: 75.8573 },
  { state: 'Maharashtra', district: 'Nashik', disease: 'Typhoid', cases: 22, deaths: 0, week: 27, year: 2025, latitude: 19.9975, longitude: 73.7898 }
];

// Routes
app.get('/api/diseases', (req, res) => {
  res.json(diseaseMap);
});

app.get('/api/outbreaks', (req, res) => {
  res.json(outbreakData);
});

app.post('/api/outbreaks/nearby', (req, res) => {
  const { latitude, longitude, radius = 20 } = req.body;
  
  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const filteredOutbreaks = outbreakData.filter(outbreak => {
    const distance = haversine(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(outbreak.latitude),
      parseFloat(outbreak.longitude)
    );
    return distance <= radius;
  });

  res.json(filteredOutbreaks);
});

// Haversine distance function
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value) {
  return value * Math.PI / 180;
}

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
import { OUTBREAK_DATA } from '../config/constants.js';
import { haversine } from '../services/geo.js';

export const getOutbreaks = (req, res) => {
  try {
    console.log("Outbreak data",OUTBREAK_DATA);
    
    res.json(OUTBREAK_DATA);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch outbreak data' });
  }
};

export const getNearbyOutbreaks = (req, res) => {
  try {

    const { latitude, longitude, radius = 20 } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const filteredOutbreaks = OUTBREAK_DATA.filter(outbreak => {
      const distance = haversine(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(outbreak.latitude),
        parseFloat(outbreak.longitude)
      );
      return distance <= radius;
    });
console.log("Nearby Outbreaks", filteredOutbreaks);

    res.json(filteredOutbreaks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate nearby outbreaks' });
  }
};
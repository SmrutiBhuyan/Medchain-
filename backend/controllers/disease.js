import { DISEASE_MAP } from '../config/constants.js';

export const getDiseases = (req, res) => {
  try {
    res.json(DISEASE_MAP);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch disease data' });
  }
};
import { config } from '../config/index.js';

export function getAllDisks() {
  return config.diskList || [];
}

export function getDiskById(id) {
  if (!id) return null;
  return getAllDisks().find((d) => d.id === id) || null;
}

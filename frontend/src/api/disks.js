import http from './http';

export function fetchDisks() {
  return http.get('/disks');
}

import http from './http';

export function fetchResources({ diskId, category = 'all', folder = '', page = 1, pageSize = 50, mode = 'list' }) {
  return http.get(`/disks/${diskId}/resources`, {
    params: { category, folder, page, pageSize, mode },
  });
}

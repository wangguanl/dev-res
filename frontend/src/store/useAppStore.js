import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    disks: [],
    currentDiskId: '',
    category: 'all',
    resources: {
      total: 0,
      page: 1,
      pageSize: 50,
      items: [],
    },
    loading: false,
    error: null,
  }),
  actions: {
    setDisks(disks) {
      this.disks = disks;
      if (!this.currentDiskId && disks.length > 0) {
        this.currentDiskId = disks[0].id;
      }
    },
    setError(err) {
      this.error = err?.message || String(err);
    },
  },
});

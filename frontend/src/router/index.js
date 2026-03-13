import { createRouter, createWebHistory } from 'vue-router';

import Home from '../pages/Home.vue';
import Preview from '../pages/Preview.vue';

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/preview', name: 'Preview', component: Preview, props: true },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

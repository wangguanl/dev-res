import { createRouter, createWebHistory } from 'vue-router';

import Home from '../pages/Home.vue';
import Preview from '../pages/Preview.vue';

const routes = [
  { path: '/', redirect: '/list' },
  { path: '/list', name: 'List', component: Home },
  { path: '/tree', name: 'Tree', component: Home },
  { path: '/preview', name: 'Preview', component: Preview, props: true },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

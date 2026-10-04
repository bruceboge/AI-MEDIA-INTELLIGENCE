/**
 * Apify 24-Hour Cached Social Media Radar (ES Module)
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const apifyService = require('../services/apifyService.cjs');

export function getCacheStatus() {
  return apifyService.getCacheStatus();
}

export function getPosts(category = 'All', risk = 'All', limit = 50) {
  let posts = (apifyService.data && apifyService.data.posts) ? [...apifyService.data.posts] : [];
  if (category && category !== 'All') {
    posts = posts.filter(p => p.category === category);
  }
  if (risk && risk !== 'All') {
    posts = posts.filter(p => p.initialRisk === risk);
  }
  return posts.slice(0, limit);
}

export function getAccounts() {
  return apifyService.getCategorizedAccounts();
}

export async function harvest(force = false) {
  return await apifyService.harvestAllAccounts(force);
}

export function resetCache() {
  if (apifyService && apifyService.data) {
    apifyService.data.expiresAt = new Date(0).toISOString();
    apifyService.data.lastHarvestedAt = new Date(0).toISOString();
    if (typeof apifyService.saveTweetsDatabase === 'function') {
      apifyService.saveTweetsDatabase(apifyService.data);
    }
  }
}


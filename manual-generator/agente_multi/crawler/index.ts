// Crawler module exports
export * from './routeDiscovery';
export * from './elementHeuristics';
export * from './smartCrawler';

// Re-export main classes and functions for convenience
export { SmartCrawler, quickCrawl } from './smartCrawler';
export { discoverRoutes, interactiveDiscovery } from './routeDiscovery';
export { analyzeCurrentPage, extractPagePurpose, extractMainActions } from './elementHeuristics';

// Types
export type { RouteInfo, DiscoveryOptions } from './routeDiscovery';
export type { ElementAction, PageAnalysis } from './elementHeuristics';
export type { CrawlResult, CrawlOptions } from './smartCrawler';
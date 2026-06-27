/**
 * Unified Catalog — Source Registry
 *
 * Defines the common interface for all catalog data sources.
 * Each source fetches items from an external public API and normalizes
 * them into a UnifiedCatalogItem shape.
 */

/**
 * @typedef {'skill' | 'mcp' | 'plugin'} CatalogItemType
 * @typedef {'skill' | 'mcp' | 'plugin'} CatalogItemInstallType
 */

/**
 * @typedef {Object} UnifiedCatalogItem
 * @property {string} id
 * @property {CatalogItemType} type
 * @property {string} name
 * @property {string} description
 * @property {string} [longDescription]
 * @property {string} source
 * @property {string} sourceId
 * @property {string} category
 * @property {string[]} tags
 * @property {number} popularity
 * @property {string} [version]
 * @property {string} [author]
 * @property {boolean} official
 * @property {Object} installConfig
 * @property {string} [setupGuideUrl]
 * @property {string[]} [installSteps]
 * @property {ConfigField[]} [configFields]
 */

/**
 * @typedef {Object} ConfigField
 * @property {string} key
 * @property {string} label
 * @property {'text' | 'password' | 'textarea' | 'select'} type
 * @property {boolean} [required]
 * @property {string} [placeholder]
 * @property {string} [description]
 */

/**
 * @typedef {Object} CatalogSourceResult
 * @property {UnifiedCatalogItem[]} items
 * @property {string|null} nextCursor
 */

/**
 * @typedef {Object} CatalogSource
 * @property {string} id
 * @property {string} label
 * @property {boolean} enabled
 * @property {(options: { query?: string, cursor?: string, category?: string }) => Promise<CatalogSourceResult>} fetchItems
 * @property {(id: string) => Promise<UnifiedCatalogItem|null>} fetchItem
 */

/** @type {CatalogSource[]} */
const registeredSources = [];

/**
 * Register a catalog source.
 * @param {CatalogSource} source
 */
export function registerSource(source) {
  registeredSources.push(source);
}

/**
 * Get all registered sources.
 * @returns {CatalogSource[]}
 */
export function getSources() {
  return registeredSources.slice();
}

/**
 * Get a source by ID.
 * @param {string} id
 * @returns {CatalogSource|undefined}
 */
export function getSourceById(id) {
  return registeredSources.find((s) => s.id === id);
}

/**
 * Generate a deterministic global ID from source + sourceId.
 * @param {string} source
 * @param {string} sourceId
 * @returns {string}
 */
export function generateGlobalId(source, sourceId) {
  const input = `${source}:${sourceId}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `${source}-${Math.abs(hash).toString(36)}`;
}

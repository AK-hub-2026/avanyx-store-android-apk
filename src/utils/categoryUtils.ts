/**
 * Normalized category matching for AVANYX Store v3.0.
 * Ensures consistent filtering regardless of casing, slug variations, or category identifiers.
 */
export function matchesAppCategory(
  app: {
    category?: string;
    categoryId?: string;
    isGame?: boolean;
    tags?: string[];
    recommended?: boolean;
    isFeatured?: boolean;
    verified?: boolean;
    securityScore?: number;
  },
  selectedCategory: string
): boolean {
  if (!selectedCategory || selectedCategory === 'ALL') return true;

  const target = selectedCategory.trim().toLowerCase();
  const appCat = (app.category || '').trim().toLowerCase();
  const appCatId = (app.categoryId || '').trim().toLowerCase();

  // 1. Recommended category / section
  if (target === 'recommended') {
    return app.recommended === true || app.isFeatured === true;
  }

  // 2. Trusted Apps category / section
  if (target === 'trusted' || target === 'trusted apps' || target === 'verified') {
    return app.verified === true || (typeof app.securityScore === 'number' && app.securityScore >= 95);
  }

  // 3. Games category matching: category:"Games"
  if (target === 'games' || target === 'game') {
    if (app.isGame) return true;
    if (appCat === 'games' || appCat === 'game' || appCatId === 'games' || appCatId === 'game') return true;
    if (['casual', 'arcade', 'action', 'racing', 'simulation', 'rpg', 'puzzle'].includes(appCat)) return true;
    if ((app.tags || []).some((t) => t.toLowerCase() === 'game' || t.toLowerCase() === 'games')) return true;
    return false;
  }

  // 4. AI Apps matching: category:"AI"
  if (target === 'ai' || target === 'ai apps' || target === 'ai_agents') {
    if (appCat === 'ai' || appCat === 'ai_agents' || appCatId === 'ai' || appCatId === 'ai_agents') return true;
    if ((app.tags || []).some((t) => ['ai', 'intelligence', 'copilot', 'llm', 'assistant', 'neural', 'machine learning'].includes(t.toLowerCase()))) return true;
    return false;
  }

  // 5. Education matching: category:"Education"
  if (target === 'education' || target === 'academic' || target === 'learning') {
    if (appCat === 'education' || appCatId === 'education') return true;
    if ((app.tags || []).some((t) => ['education', 'academic', 'study', 'school', 'learning'].includes(t.toLowerCase()))) return true;
    return false;
  }

  // 6. Tools matching: category:"Tools"
  if (target === 'tools' || target === 'utilities') {
    if (appCat === 'tools' || appCat === 'utilities' || appCatId === 'tools' || appCatId === 'utilities') return true;
    if ((app.tags || []).some((t) => ['tools', 'utilities', 'sdk', 'dev', 'utility'].includes(t.toLowerCase()))) return true;
    return false;
  }

  // 7. Direct match on category name or category ID
  if (appCatId === target || appCat === target) {
    return true;
  }

  // 8. Productivity matching
  if (target === 'productivity') {
    return appCat === 'productivity' || appCatId === 'productivity' || (app.tags || []).some((t) => t.toLowerCase() === 'productivity');
  }

  // 9. Entertainment & Media matching
  if (target === 'entertainment' || target === 'media') {
    return appCat === 'entertainment' || appCat === 'media' || appCatId === 'entertainment' || appCatId === 'media';
  }

  // 10. Security & Privacy matching
  if (target === 'security') {
    return appCat === 'security' || appCatId === 'security';
  }

  // 11. Finance matching
  if (target === 'finance') {
    return appCat === 'finance' || appCatId === 'finance';
  }

  // 12. Social matching
  if (target === 'social') {
    return appCat === 'social' || appCatId === 'social';
  }

  return false;
}

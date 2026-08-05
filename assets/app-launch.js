/* SwissRescue OmniMed — ouverture DÉTERMINISTE de l'application (v2, anti-downgrade).
 *
 * ┌─ RÈGLE IMPARABLE ────────────────────────────────────────────────────────────┐
 * │ • Bouton « Ouvrir l'application complète »  → app.html        → TOUJOURS la LOURDE│
 * │ • Bouton « Ouvrir la version légère »       → app-light.html  → la LÉGÈRE, sur ce  │
 * │   bouton UNIQUEMENT.                                                            │
 * └──────────────────────────────────────────────────────────────────────────────┘
 *
 * ON / OFF-LINE :
 *   • EN LIGNE   : le serveur renvoie app.html (stratégie « réseau d'abord » du sw.js).
 *   • HORS-LIGNE : le service worker (sw.js v3) sert app.html DEPUIS LE CACHE.
 *                  → la LOURDE s'ouvre même sans réseau, JAMAIS un downgrade vers la légère.
 *                  → la légère n'est servie qu'en repli d'une navigation réellement hors-ligne
 *                    et non mise en cache — et JAMAIS sous l'URL app.html.
 *
 * POURQUOI CE FICHIER NE FAIT (VOLONTAIREMENT) AUCUNE INTERCEPTION :
 *   L'ancienne version basculait `navigator.onLine ? app.html : app-light.html` sur TOUS les
 *   liens app.html — y compris le bouton « complète ». `navigator.onLine` est peu fiable
 *   (souvent `false` alors que le réseau répond) : c'est CE code qui faisait « toujours ouvrir
 *   la légère ». Il est SUPPRIMÉ. Désormais le `href` est la seule source de vérité, et le
 *   comportement hors-ligne est confié au service worker (déterministe, testé).
 *
 * Continuité : garde-fou passif ci-dessous — si un lien « complète » avait été recâblé par
 * erreur vers la légère, on le rétablit sur app.html. On ne downgrade JAMAIS dans l'autre sens.
 */
(function () {
  "use strict";
  try {
    var complets = document.querySelectorAll('a[data-app="complete"]');
    for (var i = 0; i < complets.length; i++) {
      if (complets[i].getAttribute("href") !== "app.html") complets[i].setAttribute("href", "app.html");
    }
  } catch (e) { /* ne jamais casser l'ouverture */ }
  /* Aucune bascule navigator.onLine. Aucun downgrade. Les <a href> décident, le SW gère l'offline. */
})();

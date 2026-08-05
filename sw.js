/* SwissRescue OmniMed — service worker v4 (auto-update, anti-cache-figé).
   Strategie : RESEAU D'ABORD (network-first). En ligne, on sert toujours la
   version a jour depuis le serveur — donc l'app COMPLETE quand elle est demandee.
   Le cache ne sert qu'en REPLI hors-ligne, et ne fait JAMAIS descendre app.html
   vers app-light.html (bug corrige). Aucune requete tierce, meme origine.

   Auto-update : nouveau nom de cache => purge des anciens ; skipWaiting +
   clients.claim => la nouvelle version prend la main sans geste utilisateur ;
   la page se recharge une fois via 'controllerchange'. */

var CACHE = 'srom-noyau-v4';
/* Allowlist des caches autorisés à SURVIVRE. Tout cache absent de cette liste
   (ex. les anciens 'srom-noyau-v2'/'v3') est supprimé à l'activation → refresh toujours propre,
   plus aucun ancien cache ne peut resservir l'app légère. */
var ALLOWLIST = [CACHE];

/* Noyau vital pre-cache : l'app COMPLETE et la legere doivent repondre hors-ligne. */
var NOYAU = [
  'app.html',
  'app-light.html',
  'applications.html',
  'index.html'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(NOYAU).catch(function () { /* un fichier manquant ne casse pas l'installation */ });
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (noms) {
      /* Purge TOTALE : tout cache hors allowlist courante est supprimé (v2 et tout autre ancien). */
      return Promise.all(noms.map(function (n) { if (ALLOWLIST.indexOf(n) < 0) return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Permet a la page de forcer l'activation immediate d'une nouvelle version. */
self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') { self.skipWaiting(); }
});

function estAppComplete(url) {
  var p = url.pathname;
  return p === '/app.html' || p.endsWith('/app.html');
}

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) return;

  e.respondWith(
    fetch(r).then(function (net) {
      if (net && net.status === 200 && net.type === 'basic') {
        var copie = net.clone();
        caches.open(CACHE).then(function (c) { c.put(r, copie); });
      }
      return net;
    }).catch(function () {
      /* Hors ligne : cache d'abord. */
      return caches.match(r).then(function (rep) {
        if (rep) return rep;
        /* Jamais de downgrade silencieux : si l'app COMPLETE est demandee, on tente
           le cache de app.html ; on ne renvoie app-light QUE pour ses propres URL. */
        if (estAppComplete(u)) return caches.match('app.html');
        if (r.mode === 'navigate') return caches.match('app-light.html');
        return undefined;
      });
    })
  );
});

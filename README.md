# Beatelo Audio Converter – test d'hébergement

Ceci est un **prototype indépendant** du convertisseur Audio de Beatelo, pas une copie du site complet.
Le design du reste de Beatelo n'a pas été transféré. Ne remplace pas le site Unbounce avec ces fichiers.

## Déploiement sans installation sur ton ordinateur
1. Crée un nouveau dépôt GitHub et ajoute les fichiers de ce dossier (en conservant `scripts/copy-ffmpeg.mjs`).
2. Connecte le dépôt à Netlify : **Add new project > Import an existing project > GitHub**.
3. Paramètres : Build command `npm run build`, Publish directory `dist` (ou laisse Netlify lire `netlify.toml`).
4. Lance le déploiement. Netlify téléchargera les dépendances npm, puis copiera automatiquement le moteur FFmpeg dans le dossier publié.
5. Ouvre le site Netlify et teste MP3 > WAV avec un petit fichier.

## Pourquoi cette architecture
- Le Worker de `@ffmpeg/ffmpeg` est traité par Vite et inclus dans le site construit, plutôt que lancé depuis un CDN externe.
- Les fichiers `ffmpeg-core.js` et `ffmpeg-core.wasm` sont servis par le même site, via `/ffmpeg-core/`.
- Le moteur est lourd (~31 Mo) et certains navigateurs ou hébergeurs peuvent encore bloquer son chargement.
- Le projet doit être lancé via un serveur HTTP(S), pas simplement en ouvrant `index.html` depuis un dossier local.
- Certains formats dépendent des encodeurs inclus dans la version de FFmpeg.

## Intégration dans le vrai Beatelo
Ne pas remplacer `index.html` de ton site actuel par ce prototype : cela ferait disparaître les autres outils.
Pour intégrer dans le site complet, exporte depuis Unbounce les fichiers HTML et CSS, puis adapte le composant de conversion en conservant les identifiants de ton interface. Le projet actuel permet de tester le moteur indépendamment avant cette intégration.

## Limites
Code fourni sans test de conversion réel dans un navigateur déployé : pas d'accès à Netlify/GitHub ni d'installation npm dans cet environnement. Les bibliothèques seront téléchargées lors du build Netlify.

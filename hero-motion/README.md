# ASMBL — Le temps prend forme.

Proposition de motion design pour le Hero : clair-obscur, métal brossé, reflets champagne, cadrage macro et typographie éditoriale.

## Statut de l’analyse

L’accès à `https://asmbl.watch` et `https://www.asmbl.watch` a été refusé par le proxy réseau (HTTP 403). Le dépôt `Oxxmo/OpenAI-ASMBL` était vide. Aucune observation sur les couleurs, les produits, la navigation ou les performances du site existant n’est donc présentée comme un fait.

Cette livraison est une **direction créative de concept**, indépendante de l’identité actuelle du site. Le mécanisme est une image générée, sans référence produit fournie ; il ne représente pas un calibre ou une montre ASMBL vérifiés. Avant publication commerciale, remplacer ou valider ce visuel à partir des produits réels. Aucun label de fabrication, caractéristique technique ou origine n’a été inventé.

## Livrables

| Fichier | Usage |
| --- | --- |
| `index.html` | Maquette du Hero avec titre HTML, animation interactive, pause et dialogue de téléchargement |
| `integration.html` | Exemple minimal utilisant les MP4, sans dépendance WebGL |
| `assets/asmbl-hero.mp4` | Film sans texte, 1920 × 1080, 30 images/s, 12 secondes, H.264, muet |
| `assets/asmbl-hero-mobile.mp4` | Cadrage vertical, 1080 × 1350, mêmes durée et cadence |
| `assets/asmbl-hero.webm` | Variante VP9 du master horizontal |
| `assets/poster.webp`, `assets/poster-mobile.webp` | Images de repli, y compris pour les visiteurs préférant réduire les mouvements |
| `assets/keyvisual.png` | Visuel de concept original |
| `assets/keyvisual.webp` | Texture optimisée pour la maquette interactive |
| `motion.js` | Animation 2,5D déterministe et exportable, sans bibliothèque externe |
| `tools/render.cjs` | Génération des MP4 à partir de l’animation |

## Intention de mouvement

La caméra s’approche lentement du mécanisme puis retrouve sa position initiale. Une lumière douce parcourt les reflets existants ; des décalages très légers suggèrent la profondeur entre les composants suspendus. Le temps et les vitesses sont périodiques pour raccorder les extrémités de la boucle de 12 secondes.

Il s’agit d’une animation 2,5D d’un visuel, pas d’une simulation mécanique ni d’un modèle CAO. Les éléments ne se ferment pas pour former une montre complète. Le traitement évite de revendiquer un assemblage techniquement exact.

Le texte reste dans la page, hors du film : il demeure lisible, traduisible et adaptable. Le noir à gauche laisse un espace calme pour le message et le bouton. Sur mobile, le mécanisme est recadré et le titre descend dans la partie basse.

## Voir la maquette

Depuis le répertoire de livraison :

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Ouvrir la page `index.html` via ce serveur dans un navigateur. Ne pas ouvrir en `file://` : les règles de chargement des textures WebGL varient entre navigateurs. Le serveur local sert uniquement à la prévisualisation et n’est pas un déploiement du site.

La maquette nécessite WebGL pour l’animation ; elle conserve son image de repli si ce moteur n’est pas disponible. Le bouton de pause, les téléchargements et le dialogue sont utilisables au clavier. La préférence système de réduction des mouvements est respectée. Les processus du serveur doivent être relancés dans une nouvelle session.

## Intégrer dans le site

Utiliser `integration.html` comme exemple, ou reprendre son élément `<video>` et son script. Copier les deux MP4 et les deux posters dans le répertoire d’assets du site puis adapter les chemins. La sélection mobile est faite **avant** le chargement afin de télécharger uniquement le bon fichier. `muted`, `playsinline` et `loop` conviennent à un fond de Hero ; le script tente la lecture et propose un bouton si le navigateur la bloque.

Le mode économie de données et la préférence de réduction des mouvements affichent le poster sans télécharger le film. Le film se met en pause quand l’onglet devient invisible. Prévoir un bouton visible de pause/reprise si l’animation est intégrée ailleurs.

Pour un Hero très haut, préserver le mécanisme à droite sur ordinateur ; le cadrage mobile dédié est préférable au recadrage centré du film horizontal. Le point de rupture de l’exemple est de 700 px. Le contenu, le logo typographique provisoire et la destination du bouton devront être adaptés à votre site réel. Aucun code du site en production n’a été modifié ou publié.

## Recréer les films

Outils nécessaires : Node.js, Playwright, Chromium et FFmpeg avec libx264. Le rendu a été exécuté avec les outils déjà disponibles dans cet environnement. Aucun paquet n’est nécessaire au fonctionnement de la maquette ou à son intégration.

Lancer le serveur ci-dessus, puis dans un second terminal :

```sh
node tools/render.cjs desktop
node tools/render.cjs mobile
ffmpeg -y -i assets/asmbl-hero.mp4 -an -c:v libvpx-vp9 -b:v 0 -crf 32 -row-mt 1 -threads 4 assets/asmbl-hero.webm
```

Le chemin Chromium par défaut est `/usr/bin/chromium`. Le remplacer via `CHROMIUM_PATH` si nécessaire ; le port est configurable via `PORT`. Chaque export contient 360 images. La première et la dernière image ne sont pas dupliquées : l’image suivant la dernière correspond à l’instant de départ.

## Suite de l’analyse du site

Les domaines `asmbl.watch` et `www.asmbl.watch` ont été ajoutés au brouillon de configuration réseau de l’environnement. Cet enregistrement n’a pas débloqué la machine actuelle et ne publie pas le site. Après enregistrement et publication de la configuration dans les paramètres de l’environnement, revalider l’accès au site avant de prétendre à une analyse visuelle réelle. Des captures et des photos officielles des montres permettront également d’ajuster la création à l’identité et au produit.

## Vérifications effectuées

- Les deux MP4 ont été rendus puis relus : H.264, 30 images/s, 360 images, durée 12,000 s, dimensions conformes. Aucun son. Les fichiers pèsent respectivement 4,76 Mo et 4,40 Mo ; la version WebM horizontale pèse environ 1,7 Mo.
- Dans Chromium, les MP4 se chargent et se lisent dans l’exemple d’intégration ; le bon fichier est sélectionné sur ordinateur et mobile. La pause fonctionne et aucune erreur JavaScript n’a été relevée.
- Avec la réduction des mouvements activée, l’exemple vidéo ne demande aucun fichier MP4 ; la maquette WebGL reste en pause.
- La maquette a été contrôlée à 1440 × 900, 768 × 1024, 390 × 844 et 320 × 740 : aucun débordement horizontal. À 320 × 740, sa hauteur minimale entraîne un défilement vertical normal de 40 px.
- Ouverture du dialogue, fermeture par Échap et retour du focus au bouton d’origine vérifiés. Le poster reste visible lorsque WebGL est indisponible.
- Le rendu source aux instants 0 et 12 secondes est strictement identique. Le dernier photogramme encodé est à 11,9667 s pour éviter de dupliquer le premier.
- La lecture n’a pas été testée sur un appareil iOS physique ni dans Safari. L’intégration dans le site en production reste à faire.

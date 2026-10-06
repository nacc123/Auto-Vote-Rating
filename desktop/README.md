# AVR Desktop V1

Prototype Electron Windows dédié à serveur-prive.net.

## Fonctionnalités
- session Chromium persistante `persist:serveur-prive`
- page de vote intégrée
- détection vote disponible / cooldown / succès
- détection de la vérification e-mail
- CAPTCHA et code e-mail manuels
- génération d'un installateur Windows avec electron-builder

## Lancer en développement

```bash
cd desktop
npm install
npm start
```

## Construire l'EXE

```bash
npm run dist
```

L'installateur est généré dans `desktop/dist/`.

## Sécurité
La V1 n'extrait ni ne soumet automatiquement les codes de vérification ou CAPTCHA.

# MoroApp - Mobile Verstärker Management 📱

React Native App (Expo) für Techniker im Außendienst.

## Features

- **Home Screen:**
  - Live-Statistik aus Supabase DB
  - Verstärker-Anzahl nach HUBs
  - Schnellzugriff "Neuer Verstärker"

- **Neuer Verstärker:**
  - Mobile-optimiertes Formular
  - Pflichtfelder: HUB, Node, Verstärkerbezeichnung, Straße, Hnr, PLZ, Ort, FSK
  - Sync mit MoroWeb DB
  - Email-Benachrichtigung (TODO)

## Setup

```bash
# Dependencies installieren
npm install

# App starten
npx expo start

# Im Browser oder Expo Go App (Smartphone) öffnen
```

## Design-System

Analog zu MoroWeb:
- **Weiß/Metallic Silber** (Dominant)
- **Schwarz** (Akzente)
- **Gold** (Highlights/Actions)

## Tech-Stack

- React Native (Expo)
- TypeScript
- Supabase (gleiche DB wie MoroWeb)
- @react-native-picker/picker

## TODO

- [ ] Email-Versand via Supabase Edge Function
- [ ] Suche implementieren
- [ ] Offline-Modus
- [ ] Fotos hochladen (Wartung)

# PRODUCT REQUIREMENTS DOCUMENT

**Brazza Transport** (Guide des transports en commun de Brazzaville)

| Champ | Valeur |
|---|---|
| Produit | Brazza Transport (MVP Web App) |
| Version de ce document | V1.1 — données terrain intégrées |
| Statut | Validé pour développement (Sprint 1) |
| Auteur | Product Manager |
| Cible de livraison MVP | Lundi 15h00 |

> **Changelog V1.0 → V1.1** : les données d'exemple fictives des sections 3, 6 et 7
> (lignes L01-L03 « Centre-ville–Marché Total », « Bacongo–Poto-Poto »,
> « Makélékélé–Centre-ville ») ont été **remplacées par les données réelles de
> l'enquête terrain** (`Résultats_Recherche_Terrain.xlsx`), qui couvre 8 lignes.
> Voir section 7 pour le détail et les écarts constatés avec les hypothèses initiales.

---

## 1. Vision produit & Contexte

### 1.1 Pitch

Un guide web simple qui répond à une seule question, bien : « Comment je vais de X à Y en transport en commun, et ça coûte combien ? »

### 1.2 Le problème

Brazzaville n'a ni carte ni application des transports collectifs. Les lignes de bus et taxis collectifs existent dans la tête des chauffeurs et des habitants, mais nulle part sous forme écrite et centralisée. Deux phénomènes de terrain aggravent cette opacité :

- **Le tronçonnage aux heures de pointe** : les chauffeurs découpent artificiellement une ligne en 2 ou 3 tronçons pour multiplier les tarifs, ce qui rend le prix d'un même trajet imprévisible selon l'heure.
- **Les crises d'approvisionnement en carburant** : les tarifs réglementaires sautent, entraînant une spéculation et des variations de prix imprévisibles pour l'usager.

> ⚠️ **Nuance confirmée par le terrain (voir section 7)** : le tronçonnage n'affecte
> pas systématiquement toutes les lignes. Sur les 8 lignes enquêtées, seules 3
> (L01, L05, L06) montrent un doublement effectif du tarif en heure de pointe ;
> les 5 autres restent au tarif normal même en heure de pointe. Le produit doit
> donc afficher l'info ligne par ligne, jamais une règle générale appliquée à tout.

Conséquences concrètes pour les usagers :

- Les nouveaux arrivants et étudiants perdent du temps à demander leur chemin, souvent avec des réponses contradictoires.
- Les usagers se font parfois surfacturer, faute de connaître le tarif de référence, encore plus en période de pointe ou de crise carburant.
- Personne ne sait où se trouvent les correspondances possibles entre lignes.

### 1.3 Énoncé du problème à résoudre

Comment permettre à un habitant ou un visiteur de Brazzaville de trouver instantanément le bon trajet, y compris avec une correspondance et une estimation réaliste du tarif (normal vs heure de pointe vs crise carburant) sur un corridor prioritaire clairement délimité ?

### 1.4 Ce que le produit n'est PAS (pour cadrer le MVP)

- Ce n'est pas un GPS temps réel (pas de géolocalisation des véhicules).
- Ce n'est pas une billetterie ni un moyen de paiement (pas de Mobile Money).
- Ce n'est pas une cartographie interactive type Google Maps / OpenStreetMap (poids technique trop élevé pour le sprint).
- Ce n'est pas exhaustif au lancement.

---

## 2. Personas

| Persona | Besoin principal | Contexte d'usage |
|---|---|---|
| **Claude**, étudiante à Akiéni Academy | Trouver le trajet le moins cher / le plus direct entre son quartier et le campus | Sur mobile, souvent avec peu de data |
| **Gilbert**, nouvel arrivant à Brazzaville | Comprendre le système de transport de zéro : lignes, tarifs, usages (nuit/pluie/heure de pointe) | Consultation posée, sur ordinateur ou mobile |
| **Emma**, usager régulier soucieux de son budget | Voir le tarif réel selon l'heure ou le contexte de crise, pour préparer la monnaie exacte et éviter les mauvaises surprises | Consultation rapide juste avant de monter dans le véhicule |
| **Mardochée**, usager contributeur | Signaler une erreur (tarif changé, ligne modifiée, tronçonnage abusif) | Formulaire rapide, ponctuel, en 2 clics |

---

## 3. Arbitrage de périmètre — corridor prioritaire

Le piège à éviter : vouloir cartographier « toutes les lignes de la ville » en une semaine. C'est impossible et ça dilue la qualité des données.

### 3.1 Décision consolidée du périmètre — **mise à jour avec les données terrain**

L'enquête terrain a livré **8 lignes bus déjà vérifiées** (L01 à L08, voir section 7),
soit davantage que le périmètre initialement prévu pour le Jalon 1. Le taxi collectif
est hors périmètre du produit de façon permanente (décision du 2026-09-17, voir
amendement section 7.2) — la « couverture corridor complet » s'entend donc pour
le bus uniquement.

- **Jalon 1 : Sprint 1** (cette semaine, livrable vendredi 18h) — **proposition** :
  3 lignes noyau parmi les 8 vérifiées, choisies pour leur point de correspondance
  réel avéré : **L01, L03 et L08**, qui se croisent toutes autour du pôle
  Moungali (Marché Moungali / Rond-point Moungali — voir section 7.1 pour le détail
  des correspondances). *Ce choix est une recommandation technique à valider par
  le PM avant le début du sprint — le PRD ne tranche pas seul cet arbitrage produit.*
- **Jalon 2 : Fin de MVP** — les 5 lignes restantes (L02, L04, L05, L06, L07) sont
  déjà collectées et prêtes à être intégrées sans travail terrain supplémentaire.
  Reste à couvrir en V2 : Mfilou, Madibou, Djiri, et une première collecte sur les
  taxis collectifs.

### 3.2 Justification du choix de corridor

- Ce sont des trajets à forte fréquence et forte douleur (les étudiants/nouveaux arrivants sont justement la cible primaire).
- Ces lignes forment un corridor cohérent avec des points de correspondance naturels (on peut donc tester la fonctionnalité « avec correspondance », qui est le cœur technique du produit) — confirmé par les points de croisement réels identifiés en section 7.1.
- Un périmètre restreint mais 100% vérifié terrain vaut mieux qu'un périmètre large et invérifié — choix de qualité de la donnée plutôt que de couverture.
- L'extension à d'autres quartiers (Mfilou, Madibou, Djiri...) est planifiée en V2, une fois la méthode de collecte validée.

### 3.3 Règle de développement (non négociable)

Ne pas coder « en dur » l'idée qu'il n'y a que 3, 4 ou 8 quartiers / lignes. Le moteur de recherche doit fonctionner sur n'importe quel nombre de lignes/quartiers présents dans le JSON, pour que l'extension du Jalon 1 vers le Jalon 2 (puis la V2) ne nécessite aucun refactoring.

---

## 4. Périmètre fonctionnel (MoSCoW)

### 4.1 Objectif du Sprint 1

Délivrer une application web responsive permettant la recherche d'itinéraires (avec correspondance) et l'estimation tarifaire dynamique sur le corridor prioritaire (Jalon 1 : 3 lignes noyau), avec une note de clarté des specs > 90% côté dev (retours correctifs < 10%).

### 4.2 Inclus (Must Have)

- Consultation des lignes du corridor prioritaire (Jalon 1 : 3 lignes ; Jalon 2 : 8 lignes déjà collectées).
- Moteur de recherche « de [quartier/arrêt] à [quartier/arrêt] », avec gestion d'une correspondance.
- Algorithme d'estimation tarifaire dynamique (Mode Normal vs Heure de Pointe vs Mode Crise Carburant), **par ligne**, car toutes les lignes ne subissent pas le tronçonnage (voir section 1.2).
- Bandeau d'alerte globale d'information réseau (ex : pénurie de carburant, travaux).
- Module de signalement d'erreur (tarif, ligne, tronçonnage abusif) par l'usager.
- Fiche détaillée par ligne, avec badge de fraîcheur de la donnée.

### 4.3 Souhaitable (Should Have)

- Page « Tarifs de référence » (catégories générales, hors dynamique par ligne).
- Page d'accueil / liste de toutes les lignes, filtrable par quartier.

### 4.4 Exclu du Sprint / hors MVP (Won't Have)

- Cartographie interactive OpenStreetMap / Google Maps (poids technique trop élevé).
- Paiement Mobile Money / achat de tickets en ligne.
- Géolocalisation GPS en temps réel des véhicules.
- Compte utilisateur / authentification.
- Plus d'une correspondance dans les résultats de recherche.
- Couverture de tous les quartiers de Brazzaville.
- Application mobile native (le produit est un site web responsive).

---

## 5. Fonctionnalités du MVP

| # | Fonctionnalité | Priorité |
|---|---|---|
| F1 | Chargement des lignes depuis un JSON structuré | P0 |
| F2 | Recherche « de [quartier] à [quartier] », avec correspondance | P0 |
| F3 | Fiche détaillée par ligne (arrêts, tarifs, badge de fraîcheur) | P0 |
| F4 | Estimation tarifaire dynamique, **par ligne** (normal / heure de pointe / crise carburant) | P0 |
| F5 | Bandeau d'alerte réseau globale | P0 |
| F6 | Formulaire de signalement d'erreur | P0 |
| F7 | Page « Tarifs de référence » (catégories générales) | P1 |
| F8 | Page d'accueil / liste de toutes les lignes, filtrable (quartier, mode de transport) | P1 |

---

## 6. User Stories & Critères d'acceptation

### US-01 : Consultation de la liste des lignes du corridor

*En tant qu'usager des transports à Brazzaville, je veux consulter la liste des lignes disponibles sur le corridor prioritaire, afin de connaître immédiatement le terminus et les arrêts principaux traversés.*

**Scénario 1 : chargement de la page d'accueil**
```
Given que l'utilisateur arrive sur l'application,
When la page est chargée,
Then l'application affiche les cartes des lignes Must Have du Jalon 1
     (L01 Centre-ville ↔ Moungali, L03 CHU ↔ Ouenzé, L08 Moungali ↔ Moukondo)
     avec leur nom, origine, destination et type de véhicule (bus).
```

**Scénario 2 : affichage de la fraîcheur de donnée**
```
Given qu'une carte de ligne est affichée,
When l'utilisateur regarde les détails,
Then un badge visuel vert « Vérifié il y a moins de 24h » s'affiche avec la date
     du dernier relevé terrain.
```
> ⚠️ La date exacte de collecte terrain n'est pas présente dans le fichier
> `Résultats_Recherche_Terrain.xlsx` fourni. À demander à l'équipe terrain avant
> de renseigner `derniere_verification` dans `lignes.json` (voir section 7.1) —
> ne pas inventer de date.

### US-02 : Moteur de recherche d'itinéraire par arrêt ou quartier

*En tant qu'étudiant, je veux taper ou sélectionner le nom de mon arrêt ou quartier de départ/arrivée, afin de trouver le ou les trajets qui desservent cet endroit, y compris avec une correspondance.*

**Scénario 1 : recherche avec résultat existant**
```
Given que l'utilisateur est dans le champ de recherche,
When il saisit ou sélectionne « CHU »,
Then seules les lignes desservant le CHU (ex. L03) sont affichées, triées trajet
     direct d'abord puis 1 correspondance, par tarif total croissant.
```

**Scénario 2 : recherche sans résultat**
```
Given que l'utilisateur sélectionne un arrêt non couvert,
When la recherche s'exécute,
Then un message clair s'affiche : « Aucune ligne trouvée sur le corridor prioritaire.
     D'autres axes arrivent bientôt ! » avec un lien vers le formulaire de
     signalement (« Vous connaissez une ligne ? Aidez-nous »).
```

**Scénario 3 : plus d'une correspondance nécessaire**
```
Given qu'aucun trajet direct ni à 1 correspondance ne relie X à Y,
When la recherche s'exécute,
Then le résultat n'est pas affiché à l'utilisateur (hors scope MVP, pour ne pas
     donner une fausse impression de fiabilité), mais la recherche est loguée
     côté serveur pour prioriser la V2.
```

**Scénario 4 : quartier de départ = quartier d'arrivée**
```
Given que l'utilisateur sélectionne le même quartier au départ et à l'arrivée,
When il lance la recherche,
Then un message d'erreur de saisie s'affiche.
```

### US-03 : Estimation tarifaire dynamique (heure de pointe & crise carburant)

*En tant qu'usager soucieux de son budget, je veux voir le tarif estimé réel selon l'heure ou le contexte de crise, afin de préparer la monnaie exacte et éviter les mauvaises surprises avec le chauffeur.*

**Scénario 1 : consultation en heure creuse**
```
Given qu'il est 11h00 du matin et que le mode crise est inactif,
When l'utilisateur consulte la ligne L01 (Centre-ville ↔ Moungali),
Then l'application affiche le tarif normal (150 FCFA) avec un badge vert « Tarif normal ».
```

**Scénario 2 : consultation en heure de pointe, ligne avec tronçonnage**
```
Given qu'il est 17h30 (créneau 16h30-19h30 pour L01),
When l'utilisateur regarde le tarif de la ligne L01,
Then l'application affiche le tarif majoré (300 FCFA) avec un badge orange
     « Tarif heure de pointe (tronçonnage constaté) ».
```

**Scénario 2bis : consultation en heure de pointe, ligne SANS tronçonnage**
```
Given qu'il est 17h30 (créneau 16h00-19h00 pour L02),
When l'utilisateur regarde le tarif de la ligne L02 (Centre-ville ↔ Bacongo),
Then l'application affiche toujours 150 FCFA, éventuellement avec une mention
     neutre « Zone de bouchon signalée, tarif stable » plutôt qu'un badge
     d'alerte tarifaire — ne pas afficher de majoration qui n'existe pas.
```

**Scénario 3 : mode crise carburant activé**
```
Given que le paramètre global isFuelCrisisActive est réglé sur true,
When l'utilisateur ouvre la fiche de la ligne L01,
Then l'estimation affiche le tarif de crise relevé sur le terrain (450 FCFA)
     avec un bandeau rouge explicatif en haut d'écran.
```

### US-04 : Bandeau d'alerte réseau globale

*En tant qu'usager régulier, je veux être informé dès l'ouverture de l'application en cas de perturbation majeure (pénurie de carburant, travaux), afin de comprendre immédiatement pourquoi les tarifs sont modifiés.*

**Scénario 1 : présence d'une alerte active**
```
Given qu'une alerte réseau est paramétrée dans les données,
When l'utilisateur ouvre l'application,
Then un bandeau rouge fixe s'affiche en haut de la page : « Alerte trafic :
     fortes tensions sur le carburant à Brazzaville. Anticipez la hausse des tarifs. »
```

**Scénario 2 : alerte carburant sans crise tarifaire**
```
Given qu'une alerte de type penurie_carburant est active dans config_globale.json,
When isFuelCrisisActive vaut false,
Then le bandeau ne s'affiche pas.
```
> Ajouté le 2026-09-18. Les deux réglages étaient indépendants, si bien que
> l'application annonçait des tensions sur le carburant tout en affichant le
> tarif normal. Une alerte carburant ne s'affiche donc plus que si la crise est
> active côté tarifs. Les autres types d'alerte (travaux, etc.) restent pilotés
> par leur seul champ `actif`.

### US-05 : Formulaire de signalement d'erreur

*En tant qu'usager constatant un abus de tarif, un changement de trajet ou un tronçonnage abusif, je veux signaler une erreur en 2 clics depuis la fiche de la ligne, afin de contribuer à maintenir les informations de la communauté à jour.*

**Scénario 1 : envoi d'un signalement valide**
```
Given que l'utilisateur est sur la fiche d'une ligne,
When il clique sur « Signaler un tarif incorrect », sélectionne un motif
     (ex. « Tronçonnage abusif ») et valide,
Then un message de confirmation apparaît : « Merci ! Votre signalement a été
     transmis à l'équipe. » et un événement est enregistré pour le KPI
     « signalements reçus ».
```

### US-06 : Filtre par mode de transport — RETIRÉE (2026-09-17)

> ⚠️ **Cette user story n'a plus lieu d'être.** Le taxi collectif est hors
> périmètre du produit, de façon permanente (voir amendement section 7.2).
> Un filtre « Bus uniquement » n'a aucun sens quand le produit ne couvre que
> le bus — il n'y aurait rien à filtrer. F8 (page d'accueil) n'implémente donc
> **aucun filtre par mode de transport**.
>
> Conservé ci-dessous à titre d'historique uniquement.

*(Ancien contenu, non applicable) En tant qu'usager préférant les bus pour leur rapidité, je voulais filtrer la liste des lignes par mode de transport, afin de masquer les taxis collectifs quand je cherchais uniquement un bus.*

### US-07 : Détail des arrêts & repères visuels

*En tant qu'usager occasionnel ou nouveau venu à Brazzaville, je veux déplier la liste complète des arrêts intermédiaires avec leurs repères connus (ex. Marché Poto-Poto, CCF, Rond-point Moungali), afin de savoir exactement où descendre ou faire une correspondance.*

**Scénario 1 : consultation de l'itinéraire complet**
```
Given que l'utilisateur ouvre la fiche de la ligne L01,
When la page se charge,
Then la liste ordonnée des arrêts s'affiche sous forme de timeline verticale :
     La Gare → Marché Poto-Poto → Marché Moungali → Rond-point Moungali.
```
> Corrigé le 2026-09-18. Ce scénario décrivait un « mode réduit » avec un clic
> sur « Voir tous les arrêts ». La maquette validée le même jour place la version
> courte sur l'écran « Toutes les lignes » — carte « N arrêts » plus un lien
> « Voir » — et déplie la fiche entièrement. Le repli est donc devenu une
> navigation entre deux écrans, pas un accordéon. Vérifié sur L04 et ses
> 10 arrêts : la liste complète reste lisible en 390px. Le premier arrêt
> s'appelait « Gare Centrale », renommé « La Gare » dans lignes.json (voir #9).

### US-08 : Consultation des tarifs de référence (ajout PM)

*En tant qu'usager, je veux consulter un tableau simple des tarifs de référence par catégorie de transport, afin de négocier un prix juste même sur une ligne que je ne trouve pas dans le corridor documenté.*

**Scénario 1 : consultation de la page Tarifs**
```
Given que l'utilisateur accède à la page « Tarifs de référence »,
When la page se charge,
Then un tableau affiche le tarif jour bus urbain (150 FCFA, base observée sur
     les 8 lignes enquêtées) avec une note, la date de dernière mise à jour et
     une phrase de cadrage juridique précisant que ce sont des références
     collectées sur le terrain, pas des prix officiels réglementés.
```
> ⚠️ Le taxi collectif est hors périmètre du produit de façon permanente
> (2026-09-17) — la ligne « Taxi collectif » ne doit pas figurer dans
> `tarifs_reference.json` (section 7.5), ni maintenant ni après une éventuelle
> collecte terrain.

---

## 7. Modèle de données

### 7.1 lignes.json — **données réelles issues de l'enquête terrain**

Source : `Résultats_Recherche_Terrain.xlsx`, feuille « Résultat de recherche », 8 lignes.

Toutes les lignes enquêtées sont des **bus** — seule catégorie du périmètre
produit, voir amendement section 7.2. Le champ `crise_carburant` a été adapté : le terrain a relevé **un
tarif de crise unique observé** (pas une fourchette min/max comme supposé dans
la V1.0 du schéma) — voir le dictionnaire des champs révisé en 7.2.

```json
{
  "lignes": [
    {
      "id": "L01",
      "nom": "Centre-ville (La Gare) ↔ Moungali",
      "type": "bus",
      "mode": "bus_standard",
      "depart": "Centre-ville (La Gare)",
      "arrivee": "Moungali",
      "arrets_principaux": [
        { "nom": "Gare Centrale", "repere": null },
        { "nom": "Marché Poto-Poto", "repere": null },
        { "nom": "Marché Moungali", "repere": null },
        { "nom": "Rond-point Moungali", "repere": null }
      ],
      "tarification": {
        "normal": { "jour_fcfa": 150 },
        "heure_pointe": {
          "creneaux": [{ "debut": "07:00", "fin": "09:00" }, { "debut": "16:30", "fin": "19:30" }],
          "fcfa": 300,
          "note": "Tronçonnage constaté — bouchon Av. de France / Marché Poto-Poto"
        },
        "crise_carburant": { "fcfa": 450 }
      },
      "particularites": [
        "Bouchon récurrent : Avenue de France / Marché Poto-Poto aux heures de pointe"
      ],
      "correspondances_possibles": ["L02", "L03", "L04", "L07", "L08"],
      "derniere_verification": null,
      "statut_verification": "verifie"
    },
    {
      "id": "L02",
      "nom": "Centre-ville (La Gare) ↔ Bacongo (Marché Total)",
      "type": "bus",
      "mode": "bus_standard",
      "depart": "Centre-ville (La Gare)",
      "arrivee": "Bacongo (Marché Total)",
      "arrets_principaux": [
        { "nom": "La Gare", "repere": null },
        { "nom": "SNE", "repere": null },
        { "nom": "Congo Pharmacie", "repere": null },
        { "nom": "Ex Trésor", "repere": null },
        { "nom": "Central", "repere": null },
        { "nom": "CCF", "repere": null },
        { "nom": "La Milice", "repere": null },
        { "nom": "Marché Total", "repere": null }
      ],
      "tarification": {
        "normal": { "jour_fcfa": 150 },
        "heure_pointe": {
          "creneaux": [{ "debut": "06:30", "fin": "08:30" }, { "debut": "16:00", "fin": "19:00" }],
          "fcfa": 150,
          "note": "Pas de tronçonnage constaté sur cette ligne — bouchon signalé (Rond-Point La Coupole / Marché Total) mais tarif stable"
        },
        "crise_carburant": { "fcfa": 300 }
      },
      "particularites": [
        "Bouchon récurrent : Rond-Point La Coupole et Marché Total aux heures de pointe"
      ],
      "correspondances_possibles": ["L01", "L04", "L07"],
      "derniere_verification": null,
      "statut_verification": "verifie"
    },
    {
      "id": "L03",
      "nom": "CHU ↔ Ouenzé (Texaco)",
      "type": "bus",
      "mode": "bus_standard",
      "depart": "CHU",
      "arrivee": "Ouenzé (Texaco)",
      "arrets_principaux": [
        { "nom": "CHU-B", "repere": null },
        { "nom": "Ambassade", "repere": null },
        { "nom": "Métro", "repere": null },
        { "nom": "PSP", "repere": null },
        { "nom": "Marché Moungali", "repere": null },
        { "nom": "Koulounda", "repere": null },
        { "nom": "Bouemba", "repere": null },
        { "nom": "Texaco", "repere": null }
      ],
      "tarification": {
        "normal": { "jour_fcfa": 150 },
        "heure_pointe": {
          "creneaux": [{ "debut": "06:30", "fin": "09:00" }, { "debut": "16:00", "fin": "19:30" }],
          "fcfa": 150,
          "note": "Pas de tronçonnage constaté — bouchon signalé (Intersection Mbochi / Av. de la Paix) mais tarif stable"
        },
        "crise_carburant": { "fcfa": 300 }
      },
      "particularites": [
        "Bouchon récurrent : Intersection Mbochi / Avenue de la Paix aux heures de pointe"
      ],
      "correspondances_possibles": ["L01"],
      "derniere_verification": null,
      "statut_verification": "verifie"
    },
    {
      "id": "L04",
      "nom": "Centre-ville (La Gare) ↔ Mpila ↔ Talangaï",
      "type": "bus",
      "mode": "bus_standard",
      "depart": "Centre-ville (La Gare)",
      "arrivee": "Talangaï",
      "arrets_principaux": [
        { "nom": "La Gare", "repere": null },
        { "nom": "Station", "repere": null },
        { "nom": "Port ATC", "repere": null },
        { "nom": "Brasserie", "repere": null },
        { "nom": "ONEMO", "repere": null },
        { "nom": "Makiémba", "repere": null },
        { "nom": "Blacher", "repere": null },
        { "nom": "TP", "repere": null },
        { "nom": "La Mairie", "repere": null },
        { "nom": "Hôpital Talangaï", "repere": null }
      ],
      "tarification": {
        "normal": { "jour_fcfa": 150 },
        "heure_pointe": {
          "creneaux": [{ "debut": "06:00", "fin": "08:30" }, { "debut": "16:30", "fin": "19:30" }],
          "fcfa": 150,
          "note": "Pas de tronçonnage constaté — bouchon signalé (Rond-point Ebina / Hôpital Talangaï) mais tarif stable"
        },
        "crise_carburant": { "fcfa": 300 }
      },
      "particularites": [
        "Bouchon récurrent : Rond-point Ebina et Hôpital Talangaï aux heures de pointe"
      ],
      "correspondances_possibles": ["L01", "L02"],
      "derniere_verification": null,
      "statut_verification": "verifie"
    },
    {
      "id": "L05",
      "nom": "Marché Talangaï ↔ Kombo ↔ Soprogie",
      "type": "bus",
      "mode": "bus_standard",
      "depart": "Marché Talangaï",
      "arrivee": "Soprogie",
      "arrets_principaux": [
        { "nom": "Marché Talangaï", "repere": null },
        { "nom": "Liberté", "repere": null },
        { "nom": "Mikalou", "repere": null },
        { "nom": "Lycée", "repere": null },
        { "nom": "Kombo", "repere": null },
        { "nom": "Massengo", "repere": null },
        { "nom": "Soprogie", "repere": null }
      ],
      "tarification": {
        "normal": { "jour_fcfa": 150 },
        "heure_pointe": {
          "creneaux": [{ "debut": "07:00", "fin": "09:00" }, { "debut": "17:00", "fin": "19:30" }],
          "fcfa": 300,
          "note": "Tronçonnage constaté — bouchon Lycée Thoma et Marché Massengo"
        },
        "crise_carburant": { "fcfa": 450 }
      },
      "particularites": [
        "Bouchon récurrent : Lycée Thoma et Marché Massengo aux heures de pointe"
      ],
      "correspondances_possibles": ["L06"],
      "derniere_verification": null,
      "statut_verification": "verifie"
    },
    {
      "id": "L06",
      "nom": "Kombo ↔ Mazala",
      "type": "bus",
      "mode": "bus_standard",
      "depart": "Kombo",
      "arrivee": "Mazala",
      "arrets_principaux": [
        { "nom": "Kombo", "repere": null },
        { "nom": "Sima la télé", "repere": null },
        { "nom": "Mama Mapassa", "repere": null },
        { "nom": "ACK", "repere": null },
        { "nom": "Virage", "repere": null },
        { "nom": "Rond-point Mazala", "repere": null }
      ],
      "tarification": {
        "normal": { "jour_fcfa": 150 },
        "heure_pointe": {
          "creneaux": [{ "debut": "06:30", "fin": "08:30" }, { "debut": "16:00", "fin": "19:00" }],
          "fcfa": 300,
          "note": "Tronçonnage constaté — bouchon Rond-point Mazala"
        },
        "crise_carburant": { "fcfa": 300 }
      },
      "particularites": [
        "Bouchon récurrent : Rond-point Mazala aux heures de pointe"
      ],
      "correspondances_possibles": ["L05", "L08"],
      "derniere_verification": null,
      "statut_verification": "verifie"
    },
    {
      "id": "L07",
      "nom": "Marché Total ↔ Marché Ouenzé",
      "type": "bus",
      "mode": "bus_standard",
      "depart": "Marché Total",
      "arrivee": "Marché Ouenzé",
      "arrets_principaux": [
        { "nom": "Marché Total", "repere": null },
        { "nom": "CCF", "repere": null },
        { "nom": "Parquet", "repere": null },
        { "nom": "Nganga Edouard", "repere": null },
        { "nom": "Boulevard A", "repere": null },
        { "nom": "PSP Plateau", "repere": null },
        { "nom": "Rond-point Moungali", "repere": null },
        { "nom": "Jeanne Viale", "repere": null },
        { "nom": "Mampassi", "repere": null }
      ],
      "tarification": {
        "normal": { "jour_fcfa": 150 },
        "heure_pointe": {
          "creneaux": [{ "debut": "08:00", "fin": "11:00" }, { "debut": "16:00", "fin": "19:00" }],
          "fcfa": 300,
          "note": "Tronçonnage constaté — bouchon Jeanne Viale / Mampassi"
        },
        "crise_carburant": { "fcfa": 300 }
      },
      "particularites": [
        "Bouchon récurrent : Jeanne Viale / Mampassi aux heures de pointe"
      ],
      "correspondances_possibles": ["L01", "L02", "L08"],
      "derniere_verification": null,
      "statut_verification": "verifie"
    },
    {
      "id": "L08",
      "nom": "Moungali ↔ Moukondo",
      "type": "bus",
      "mode": "bus_standard",
      "depart": "Moungali",
      "arrivee": "Moukondo",
      "arrets_principaux": [
        { "nom": "Rond-point Moungali", "repere": null },
        { "nom": "Commune Moungali", "repere": null },
        { "nom": "Matsoua", "repere": null },
        { "nom": "La fleur", "repere": null },
        { "nom": "Marché Moukondo", "repere": null },
        { "nom": "Mazala", "repere": null }
      ],
      "tarification": {
        "normal": { "jour_fcfa": 150 },
        "heure_pointe": {
          "creneaux": [{ "debut": "06:00", "fin": "08:30" }, { "debut": "16:00", "fin": "19:00" }],
          "fcfa": 300,
          "note": "Tronçonnage constaté — bouchon Marché Moukondo / Mazala"
        },
        "crise_carburant": { "fcfa": 300 }
      },
      "particularites": [
        "Bouchon récurrent : Marché Moukondo / Mazala aux heures de pointe"
      ],
      "correspondances_possibles": ["L01", "L06", "L07"],
      "derniere_verification": null,
      "statut_verification": "verifie"
    }
  ]
}
```

> **Note sur `derniere_verification: null`** : le fichier terrain fourni ne
> contient pas de date de collecte. Ce champ est **obligatoire** dans le schéma
> (voir 7.2) — il faut la demander à l'équipe terrain avant la mise en
> production ; ne pas la remplacer par une date inventée. En attendant, l'app
> doit gérer proprement un badge de fraîcheur « Date de vérification manquante »
> plutôt que de planter ou d'afficher une fausse date.

> **Note sur `tarif_pointe.fcfa` unique (au lieu de `min_fcfa`/`max_fcfa`)** :
> contrairement à l'hypothèse de la V1.0 du PRD, l'enquête terrain rapporte un
> **tarif de pointe unique par ligne**, pas une fourchette. Idem pour
> `crise_carburant`. Le schéma ci-dessus reflète cette réalité. Si une future
> collecte identifie une vraie variabilité (plusieurs chauffeurs, plusieurs prix
> sur la même ligne), le champ pourra repasser à une fourchette `min_fcfa`/`max_fcfa` —
> mais on ne modélise pas une incertitude que les données actuelles ne montrent pas.

### 7.2 Dictionnaire des champs de lignes.json — révisé

> ⚠️ **Amendement du 2026-09-17** : le taxi collectif est retiré du périmètre du
> produit, de façon permanente — pas seulement « pas encore de données ». Le
> produit couvre uniquement le transport en bus. `type` et `mode` n'ont donc
> plus qu'une seule valeur possible chacun. Ceci corrige le tableau ci-dessous
> ainsi que les sections 7.5, 8.1, 8.3, US-01 et US-06 qui envisageaient encore
> une catégorie taxi collectif future.

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `id` | string | oui | Identifiant unique de la ligne (ex : L01) |
| `nom` | string | oui | Nom usuel de la ligne |
| `type` | enum | oui | `bus` — seule valeur du périmètre produit |
| `mode` | enum | oui | `bus_standard` — seule valeur du périmètre produit, utilisé par le filtre US-06 |
| `depart` / `arrivee` | string | oui | Quartiers/points de départ et arrivée |
| `arrets_principaux` | array[objet] | oui | Liste ordonnée des arrêts `{nom, repere}`, du départ à l'arrivée. Le champ `repere` (optionnel) alimente US-07 |
| `tarification.normal` | objet `{jour_fcfa}` | oui | Tarif de référence hors heure de pointe et hors crise. **Le terrain n'a pas collecté de tarif nuit distinct — champ `nuit_fcfa` retiré tant qu'il n'est pas confirmé, ne pas le dupliquer à partir du tarif jour.** |
| `tarification.heure_pointe` | objet `{creneaux, fcfa, note}` | non | Créneaux horaires concernés + **tarif unique observé** (pas de fourchette), si applicable à la ligne. Peut être identique au tarif normal (pas de tronçonnage constaté sur cette ligne). |
| `tarification.crise_carburant` | objet `{fcfa}` | non | **Tarif unique observé** appliqué quand la config globale `isFuelCrisisActive = true`. |
| `particularites` | array[string] | non | Infos utiles : bouchons connus, irrégularités constatées. **Les mentions nuit/pluie de la V1.0 étaient des hypothèses non vérifiées — retirées tant qu'une collecte ne les confirme pas.** |
| `correspondances_possibles` | array[id] | non | IDs des lignes partageant un arrêt réel (calculé à partir des arrêts communs relevés sur le terrain, voir liste en 7.1) |
| `derniere_verification` | date \| null | oui (valeur peut être `null` en attendant la donnée) | Date de la dernière vérification terrain. **Manquante dans le fichier source actuel — à ne jamais halluciner.** |
| `statut_verification` | enum | oui | `verifie` \| `a_verifier` \| `signale_incorrect` |

### 7.3 Barème du badge de fraîcheur

| Ancienneté de `derniere_verification` | Couleur du badge | Libellé affiché |
|---|---|---|
| `null` (date manquante) | Hachuré | Date de vérification à confirmer |
| < 24h | Vert | Vérifié il y a moins de 24h |
| < 30 jours | Vert | Vérifié le [date] |
| > 30 jours | Orange | Info à confirmer, vérifié le [date] |
| `statut_verification = signale_incorrect` | Rouge | Signalé comme incorrect, en attente de vérification |

> Corrigé le 2026-09-18. L'état « date manquante » était gris uni. Il passe au
> motif hachuré bordé de pointillés (classe `.badge-inconnu`), tel que dessiné
> dans la maquette : les trois autres états sont des statuts, celui-ci est une
> absence de donnée, et le gris uni les faisait lire pareil. C'est l'état des
> 8 lignes tant que #9 n'a pas livré les dates de collecte.

### 7.4 config_globale.json

```json
{
  "isFuelCrisisActive": false,
  "alertes_reseau": [
    {
      "id": "ALERT-01",
      "actif": true,
      "type": "penurie_carburant",
      "message": "Alerte trafic : fortes tensions sur le carburant à Brazzaville. Anticipez la hausse des tarifs.",
      "date_debut": null,
      "date_fin": null
    }
  ]
}
```
> `date_debut` était fixée en dur en V1.0 sans source terrain confirmée — remise
> à `null` en attendant une donnée réelle.

### 7.5 tarifs_reference.json — **corrigé, taxi collectif retiré**

```json
{
  "tarifs": [
    {
      "categorie": "Bus urbain",
      "tarif_jour_fcfa": 150,
      "note": "Tarif de base observé sur les 8 lignes enquêtées ; monte à 300 FCFA en heure de pointe sur les lignes avec tronçonnage constaté (voir fiche de chaque ligne)."
    }
  ],
  "derniere_mise_a_jour": null
}
```
> La catégorie « Taxi collectif » (1000/1500 FCFA) de la V1.0 était une donnée
> d'exemple non vérifiée sur le terrain — **retirée**.
>
> Mise à jour 2026-09-17 : elle ne sera **pas** réintégrée, même après une
> collecte terrain dédiée — le taxi collectif est définitivement hors périmètre
> du produit (voir amendement section 7.2). Ne pas laisser un tableau de
> « tarifs de référence » afficher un chiffre non vérifié à l'utilisateur : ça
> va directement à l'encontre du problème que le produit cherche à résoudre
> (surfacturation par manque de référence fiable).

---

## 8. Spécification détaillée des écrans

### 8.1 Page d'accueil

Objectif : amener l'utilisateur à la recherche en moins de 5 secondes.

- Bandeau d'alerte réseau globale en haut de page, si une alerte est active dans `config_globale.json` (US-04).
- Barre de recherche « De [quartier] → À [quartier] » bien visible, en haut.
- En dessous : accès rapide à « Voir toutes les lignes » et « Tarifs de référence ».
- Bandeau discret : « X lignes documentées et vérifiées » (donnée dynamique, issue du JSON — actuellement 8, ou 3 si le Jalon 1 restreint l'affichage initial).
- Lien « Signaler une erreur » toujours accessible (footer ou header).

### 8.2 Recherche « de X à Y »

**Comportement fonctionnel :**

1. L'utilisateur saisit ou sélectionne un quartier/arrêt de départ et d'arrivée (champ autocomplete basé sur les valeurs présentes dans le JSON, pas de saisie libre non contrôlée).
2. Le moteur cherche un trajet direct, puis un trajet avec une seule correspondance (via `correspondances_possibles` ou détection d'arrêt commun — ex. Marché Moungali relie L01 et L03).
3. Les résultats sont triés : trajet direct d'abord, puis 1 correspondance, triés par tarif total croissant (le tarif utilisé pour le tri est le tarif dynamique courant selon l'heure et le mode crise, F4).
4. Chaque résultat affiche : nom de la/les ligne(s), tarif total estimé (avec badge normal/pointe/crise), nombre de correspondances, bouton « Voir le détail ».

**Cas limites à gérer :**

- Aucun résultat trouvé → message clair + lien vers le formulaire de signalement.
- Plus d'une correspondance nécessaire → ne pas afficher, logger en interne pour le PM.
- Quartier de départ = quartier d'arrivée → message d'erreur de saisie.

### 8.3 Fiche détaillée d'une ligne

- Nom de la ligne + type et mode (bus standard).
- Trajet complet : liste ordonnée des arrêts principaux avec repères, affichage en timeline verticale (US-07).
- Bloc tarification dynamique : tarif normal mis en évidence, plus le tarif heure de pointe et/ou crise **uniquement si la ligne en a un enregistré et différent du tarif normal** (voir US-03 scénario 2bis — ne pas afficher un badge « heure de pointe » alarmant sur une ligne où le tarif ne bouge pas).
- Bloc « Particularités » : bouchons connus, affiché seulement si les données existent.
- Badge de fraîcheur selon le barème du 7.3 (avec état « à confirmer » si `derniere_verification` est `null`).
- Bouton « Signaler une erreur sur cette ligne » (pré-remplit le formulaire avec l'ID de la ligne et un motif suggéré, ex. « Tronçonnage abusif »).

### 8.4 Page « Tarifs de référence »

- Tableau simple : catégorie de transport / tarif jour / note (US-08). **Une seule catégorie disponible aujourd'hui (Bus urbain) — ne pas afficher de ligne « Taxi collectif » tant que la donnée n'existe pas.**
- Phrase d'intro claire : « Ces tarifs sont des références collectées sur le terrain, pas des prix officiels réglementés. Ils vous aident à négocier et éviter la surfacturation. » (Cadrage juridique : le produit ne prétend pas fixer les prix.)
- Date de dernière mise à jour visible (ou mention explicite si absente, voir 7.5).
- Lien vers le formulaire de signalement en bas de page.

### 8.5 Formulaire de signalement d'erreur

- Type de signalement (select) : Tarif incorrect | Tronçonnage abusif | Ligne/arrêt incorrect | Ligne n'existe plus | Autre.
- Ligne concernée (select, optionnel, pré-rempli si on arrive depuis une fiche ligne).
- Description libre (textarea, obligatoire).
- Contact (optionnel, pour recontacter si besoin de précision).

**Comportement :**

- Stockage simple (fichier JSON, base de données légère, ou export vers une feuille/Airtable en MVP).
- Message de confirmation clair après envoi (US-05).
- Ces signalements alimentent directement le KPI « signalements reçus/traités » et le processus de mise à jour terrain du PM.

### 8.6 Liste de toutes les lignes

- Liste/tableau filtrable par quartier. Pas de filtre par mode de transport : US-06 est retirée, le produit ne couvre que le bus.
- Lien vers chaque fiche détaillée.
- Utile pour l'exploration libre et pour le SEO/référencement local.

---

## 9. Exigences non fonctionnelles

| Catégorie | Exigence |
|---|---|
| Performance | Temps de chargement initial de l'application < 1,5 seconde sur un réseau 3G/4G local. |
| Design & ergonomie | Interface 100% Mobile-First (optimisée pour smartphone), lisibilité maximale des tarifs en plein soleil (contraste élevé). |
| Robustesse | Si la base de données ne répond pas, l'application doit utiliser les données mises en cache localement (JSON statique de secours). |
| Accessibilité | Contrastes de couleur conformes AA (important vu l'usage en extérieur, en plein soleil) ; tailles de police lisibles sans zoom sur petit écran. |
| Sobriété data | Poids de page minimal, pas d'images lourdes non essentielles, cohérent avec le persona « étudiante, souvent avec peu de data ». |
| Confidentialité | Le champ « Contact » du formulaire de signalement est optionnel et ne doit jamais être affiché publiquement ; à traiter comme une donnée personnelle minimale. |
| **Intégrité des données** *(ajouté V1.1)* | Aucune valeur (tarif, date, quartier) ne doit être générée ou déduite par le code/l'IA lorsqu'elle est absente du JSON source — afficher un état « à confirmer » plutôt qu'une valeur plausible mais fausse. |

---

## 10. KPIs

| KPI | Définition | Mesure côté dev |
|---|---|---|
| Clarté des specs (KPI de sprint) | Note de clarté des specs > 90%, retours correctifs dev < 10% | Suivi qualitatif en fin de sprint par le PM, sur retours dev |
| Lignes documentées et vérifiées | Nombre de lignes avec `statut_verification = verifie` | Compte simple sur le JSON, affiché en page d'accueil — actuellement 8 |
| % de recherches aboutissant à une fiche | (Recherches avec ≥1 résultat) / (Recherches totales) | Logger chaque recherche (départ, arrivée, nb résultats) côté serveur ou analytics simple |
| Signalements reçus | Nombre total de soumissions du formulaire | Compte sur la table/fichier de signalements |
| Signalements traités | Nombre de signalements ayant conduit à une mise à jour du JSON | Champ `statut` (nouveau \| traité), mis à jour manuellement par le PM |

---

## 11. Hors périmètre du MVP (explicitement exclu)

- Géolocalisation / carte interactive type Google Maps.
- Compte utilisateur / authentification.
- Plus d'une correspondance dans les résultats de recherche.
- Couverture de tous les quartiers de Brazzaville.
- Application mobile native (le MVP est un site web, responsive).
- Paiement ou réservation en ligne (Mobile Money inclus).

---

## 12. Pistes V2 (post-MVP)

- Extension du corridor à Mfilou, Madibou, Djiri (Ouenzé, Moungali et Talangaï sont **déjà couverts** par les 8 lignes terrain, voir section 7.1).
- Confirmation des dates de collecte manquantes (`derniere_verification`) pour les 8 lignes déjà enquêtées.
- Carte visuelle simple des lignes (SVG statique, pas de GPS temps réel).
- Notation/avis des usagers sur la fiabilité d'une ligne.
- Alertes saisonnières (ex. : routes impraticables en saison des pluies).
- Historisation des tarifs de crise pour objectiver la spéculation dans le temps.
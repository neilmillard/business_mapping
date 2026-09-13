# business_mapping

Maps businesses in a local area as an input/output/services graph — what raw
goods and services each business consumes and produces, and which
relationships (including likely imports from and exports to outside the
area) connect them.

Pilot area: BS23 / BS22 (Weston-super-Mare), see `config/areas.yaml`.

Related project: [townscan](https://github.com/neilmillard/townscan) — this
repo reuses its Companies House ingest pattern (hexagonal ports/adapters,
pure-function parsing, TDD) but is scoped to input/output mapping rather
than demand/supply scoring.

## Setup

```
npm install
cp .env.example .env   # fill in COMPANIES_HOUSE_API_KEY and GOOGLE_MAPS_API_KEY
```

## Pipeline (planned stages)

1. **Ingestion** — deduped business list for BS23/BS22 from three sources:
   - `npm run companies:fetch` — Companies House (registered office in BS23/BS22)
   - `npm run places:fetch` — Google Places, for businesses that never register
     a limited company
   - `npm run osm:fetch` — OpenStreetMap (Overpass), supplementary source
   - `npm run census:build` — dedupes all three sources into
     `reports/census_weston-super-mare.csv`
2. **Classification** — inputs/outputs/services per business.
3. **Relationship mapping** — business-to-business flows, import/export
   flagging.
4. **Visualization** — render the relationship graph.

## Development

- Tests first (TDD): `npm test`
- Lint before commit: `npm run lint`
- 2-space indentation throughout

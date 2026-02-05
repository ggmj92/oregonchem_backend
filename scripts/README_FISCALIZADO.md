# Fiscalizado Products Script

This script marks products as "fiscalizado" (government-controlled) based on the official list from **Decreto Supremo N° 268-2019-EF** (Peru).

## What are Fiscalizado Products?

Fiscalizado products are chemicals and compounds whose distribution is controlled by the Peruvian government. These include:

- **ANEXO 1**: Chemical inputs and fiscalized products (33 items)
- **ANEXO 2**: Hydrocarbons and petroleum derivatives (8 items)

## Usage

### Run the Script

```bash
cd scripts
node markFiscalizadoProducts.js
```

### What the Script Does

1. Connects to MongoDB
2. Fetches all products from the database
3. Compares each product name against the fiscalizado list
4. Marks matching products with `fiscalizado: true`
5. Provides a summary report

### Matching Logic

The script uses intelligent fuzzy matching:
- Normalizes text (removes accents, special characters)
- Checks for exact matches
- Checks for partial matches (e.g., "Ácido Sulfúrico 98%" matches "ácido sulfúrico")
- Case-insensitive comparison

### Example Output

```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📋 Fetching all products...
Found 350 products

🔍 Analyzing products...

✅ Marked as fiscalizado: Ácido Sulfúrico
✅ Marked as fiscalizado: Acetona Industrial
⏭️  Already marked: Tolueno
✅ Marked as fiscalizado: Hidróxido de Sodio

============================================================
📊 SUMMARY
============================================================
Total products analyzed: 350
Newly marked as fiscalizado: 12
Already marked as fiscalizado: 3
Total fiscalizado products: 15

📝 Newly marked products:
   1. Ácido Sulfúrico
   2. Acetona Industrial
   ...

✨ Script completed successfully!
```

## Fiscalizado Products List

### ANEXO 1 - Chemical Inputs
- Acetato de Etilo
- Acetato de n-Propilo
- Acetona
- Ácido Antranílico
- Ácido Clorhídrico
- Ácido Fórmico
- Ácido Nítrico
- Ácido Sulfúrico
- Amoníaco
- Anhídrido Acético
- Benceno
- Carbonato de Sodio
- Carbonato de Potasio
- Cloruro de Amonio
- Éter Etílico
- Hexano
- Hidróxido de Calcio
- Hipoclorito de Sodio
- Isosafrol
- Kerosene
- Metil Etil Cetona (MEK)
- Metil Isobutil Cetona (MIBK)
- Óxido de Calcio
- Permanganato de Potasio
- Piperonal
- Safrol
- Sulfato de Sodio
- Tolueno
- Xileno
- Ácido Sulfámico
- Cloruro de Calcio
- Hidróxido de Sodio
- Metabisulfito de Sodio

### ANEXO 2 - Hydrocarbons
- Diesel BX / Diesel BX S50 / Biodiesel
- Gasolinas y Gasoholes
- Hidrocarburo Alifático Liviano (HAL)
- Hidrocarburo Acídico Saturado (HAS)
- Kerosene de aviación (Turbo A1, Turbo JP5)
- Solvente N° 1 (Bencina)
- Solvente N° 3 (Varsol)

## Notes

- The script includes common alternative names and commercial denominations
- Products already marked as fiscalizado will be skipped
- The script is safe to run multiple times
- Non-destructive: only adds the fiscalizado flag, doesn't modify other data

## Legal Reference

Based on **Decreto Supremo N° 268-2019-EF** - Peruvian government regulation for controlled chemical substances.

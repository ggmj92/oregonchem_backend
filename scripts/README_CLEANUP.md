# Presentation Cleanup Script

## Before Running

1. **Save the Cilindro image** to the frontend project:
   - Save the cilindro barrel image as: `/Users/ggmj/.windsurf/worktrees/quimicaindustrial-frontend/quimicaindustrial-frontend-1e72bb6d/public/images/presentations/cilindro.png`

2. **Set the MongoDB URI** environment variable:
   ```bash
   export MONGODB_URI_PROD="mongodb+srv://oregonchemdigital:XRAbc4OBPLCYoLTi@oregonchem.3kemn.mongodb.net/?retryWrites=true&w=majority"
   ```

## Run the Script

```bash
cd /Users/ggmj/.windsurf/worktrees/oregonchem_backend/oregonchem_backend-1e72bb6d
node scripts/cleanupPresentations.js
```

## What It Will Do

1. **Analyze** current presentations and show what will be deleted
2. **Delete solid presentations under 20kg**:
   - Removes them from all products
   - Deletes the presentations from database
3. **Delete liquid presentations that aren't 14L or 20L**:
   - Removes them from all products  
   - Deletes the presentations from database
4. **Create "Cilindro" presentation**:
   - qty: 1
   - unit: "cilindro"
   - pretty: "Cilindro"
   - image: "/images/presentations/cilindro.png"
5. **Add Cilindro to all liquid products**

## Safety

- The script waits 5 seconds before executing to give you time to cancel (Ctrl+C)
- Shows a detailed analysis before making changes
- All operations are atomic (either all succeed or all fail)

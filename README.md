# Kitchen Buddy
 
Kitchen Buddy is an Expo React Native application written in TypeScript. It helps users keep track of kitchen ingredients, expiration dates, ripeness, quantities, dietary tags, and groceries, and nudges them toward the right shop when they're nearby.
 
## APIs And Libraries Used
 
- `AsyncStorage` from `@react-native-async-storage/async-storage`: persists ingredients, groceries, and the list of "handled" low-stock suggestions locally, through the `usePersistentState` hook.
- `expo-camera` (`CameraView`, `useCameraPermissions`): scans product barcodes (EAN-13, EAN-8, UPC-A, UPC-E, Code128).
- OpenFoodFacts API (`world.openfoodfacts.org`) with `fetch`: looks up product name, brand, category from a scanned barcode.
- `expo-location`: requests foreground permission and reads the current position once on app start, to detect a nearby shop.
- Overpass API (`overpass-api.de`), OpenStreetMap: queried with the user's coordinates to find real supermarkets, butchers, bakeries, fishmongers, and greengrocers within 500m; merged with a small hardcoded fallback shop list.
- `expo-linear-gradient`: powers the orange gradient app header.
- `react-navigation` (`@react-navigation/bottom-tabs`, `@react-navigation/stack`): bottom tabs plus a push-based edit screen reached from the Expiring and My Items lists.
- `react-native-safe-area-context`: keeps the UI away from notches and unsafe screen areas.
- `useWindowDimensions`: switches the Expiring and My Items/Grocery lists between a 1-column phone layout and a 2-column layout on wider screens (≥760px).
- `@expo/vector-icons` (Ionicons, MaterialCommunityIcons, FontAwesome6): icons throughout chips, buttons, and headers.

## Main Features
 
- Add and edit ingredients.
- Store name, brand, barcode, category, location, confection type, expiration, quantity, unit, ripeness, and dietary tags.
- Use `pcs`, `kg`, and `l` as quantity units, with a unit-aware step size (1 for `pcs`, 0.25 for `kg`/`l`).
- Track how much of an ingredient has been consumed with a 0/25/50/75/100% chip selector.
- Flag an ingredient as low stock once its consumed percentage reaches 75% or more.
- Suggest low-stock ingredients on the Grocery screen, and stop suggesting one once it's added to the list, bought, or removed.
- Create grocery items manually with quick add, or generate one automatically from a low-stock ingredient.
- Mark grocery items as bought, which creates a new ingredient in "My Items".
- Re-bought products reuse category, location, confection type, and other details from the most recent matching ingredient (by source ID, or by matching name if bought via quick add), but always start with a fresh quantity of 0 and 0% consumed.
- Re-bought products get an expiration date recalculated from how long the previous purchase of that same item actually lasted.
- Track recently bought ingredients (`isRecentlyBought`), surfaced via a "Recently Bought" query mode on the Items tab; the flag clears the first time that ingredient is edited.
- Mark an ingredient as **Open**, which pulls its expiration in to 4 days from now (only if that's sooner than what's already set), so it surfaces in Expiring Soon.
- Mark an ingredient as **Frozen** — available for Fresh and Packaged confection types — which moves it to the Freezer location and extends its expiration to at least 6 months out. Un-freezing it ("defrosting") resets its expiration to today and clears the freezer location, since a defrosted item should be used quickly. Switching confection type away from Fresh/Packaged automatically turns Frozen back off.
- Track ripeness for fresh ingredients (Green, Ripe, Advanced, Too Ripe) and flag when a check is due, based on how long it's been since the last check. Ripeness is only tracked for Fresh confection, unlike Frozen; switching away from Fresh clears any set ripeness.
- Tag ingredients with dietary needs (Vegan, Vegetarian, Halal, Kosher, Gluten-free, Lactose-free).
- Block saving an ingredient whose expiration date is already in the past, with a dedicated "Invalid Date" alert.
- Scan a barcode to prefill name, brand, category from OpenFoodFacts.
- Detect nearby shops in the background on launch (once, not continuously) and automatically switch to the Groceries tab when one is found.
- Sort the grocery list so items that fit the nearby shop's type appear first.

## Grocery Sorting
 
The grocery list is re-sorted whenever a nearby shop is detected. Matching uses either the item's stored `category` or a keyword match (English and Italian) against the item name:
 
- **Butcher**: category `meat`, or words like `meat`, `beef`, `chicken`, `pork`, `sausage`, `steak`, `carne`, `pollo`, `maiale`, `salsiccia`, `bistecca`.
- **Fishmonger**: category `fish`, or words like `fish`, `salmon`, `tuna`, `shrimp`, `seafood`, `pesce`, `salmone`, `tonno`, `gamberi`.
- **Bakery**: category `bakery`, or words like `bread`, `bagel`, `croissant`, `cake`, `pie`, `bun`, `pane`, `focaccia`, `brioche`, `torta`.
- **Greengrocer**: category `fruit`/`vegetable`, or words like `apple`, `banana`, `orange`, `tomato`, `carrot`, `onion`, `mela`, `arancia`, `carota`, `pomodoro`.
- **General supermarket**: category `fruit`, `vegetable`, `dairy`, `liquid`, `grains`, or `bakery`, plus dairy/pantry/bakery/fruit/vegetable keywords — the broadest match of the group. There's no dedicated shop type for grains, so grains-category items only match the general supermarket.
Items that match the current shop's type are sorted before items that don't; within each group, the most recently added item comes first. For example, if the grocery list contains `salmon`, `bread`, and `banana` and the user is near a fishmonger, `salmon` moves to the top while `bread` and `banana` stay visible underneath it.
 
The Grocery screen also shows a handful of ready-made suggestions for the detected shop type (e.g. `Meat, Chicken, Sausages` near a butcher), each tappable to quick-add it.
 
## Input Format And Sample Inputs
 
Only the ingredient name is required to save. Everything else can be filled in immediately or completed later from My Items (an incomplete ingredient is flagged with a "Missing details" badge).
 
Ingredient input format:
 
- Name: free text, for example `Salmon`, `Milk`, `Eggs`.
- Brand: optional free text, for example `Coop`, `Esselunga`.
- Barcode: optional numeric string; auto-filled by the barcode scanner, or typed manually.
- Category: selected from Fruit, Vegetable, Dairy, Fish, Meat, Grains, Bakery, Liquid, Other.
- Location: selected from Fridge, Freezer, or Pantry.
- Confection type: selected from Fresh, Canned, Frozen, Cured, or Packaged.
- Expiration: either an exact date (`DD/MM/YYYY` or `YYYY-MM-DD`) or a relative estimate such as `3 days`, `2 weeks`, or `1 month`. Dates already in the past are rejected on save.
- Quantity: numeric stepper plus unit. Supported units are `pcs`, `kg`, and `l`; for example `6 pcs`, `0.5 kg`, or `1 l`. Switching units resets the quantity to 0.
- Consumed: 0/25/50/75/100% chip, used to detect low stock.
- Ripeness: shown only for Fresh confection; values are Green, Ripe, Advanced, and Too Ripe.
- Dietary tags: any combination of Vegan, Vegetarian, Halal, Kosher, Gluten-free, Lactose-free.
- Open: boolean switch. If enabled, the expiration is pulled in to 4 days out (if that's sooner) and the item is included in Expiring Soon.
- Frozen: boolean switch, shown only for Fresh and Packaged confection. If enabled, moves the item to Freezer and extends expiration to 6 months; disabling it resets expiration to today and clears the Freezer location.
Sample inputs for AddScreen and EditScreen:
 
```text
Name: Salmon
Brand: Coop
Category: Fish
Location: Fridge -> (Freezer)
Confection: Fresh.       ^
Expiration: 1 week -> (6 months)
Quantity: 0.5 kg         ^
Ripeness: Ripe           |
Open: false              |
Frozen: true -------------
```
 
```text
Name: Milk
Brand: Mila
Category: Liquid
Location: Fridge
Confection: Packaged
Expiration: 10 days
Quantity: 1 l
Open: false
Frozen: false
```
 
```text
Name: Bacon
Brand: Esselunga
Category: Meat
Location: Fridge -> (Freezer)
Confection: Packaged.    ^
Expiration: 5 days -> (6 months)
Quantity: 300 g          ^
Ripeness: (not shown — Packaged has no ripeness)
Open: false              |
Frozen: true -------------
```
 
Sample input for GroceryScreen:
 
```text
Quick add grocery item: Pasta
```
 
## Test Data
 
The project has three separate sets of example data, used for different purposes and not connected to each other.
 
- `Sample inputs`
The example inputs shown above (Salmon, Milk, Bacon, etc.) exist only in this document. They illustrate the form's expected input format and make the Open/Frozen rules concrete (e.g. Frozen: true → expiration extended to 6 months). They are not present anywhere in the codebase.
 
- `DEFAULT_SHOPS`
Defined in `src/constants/options.ts`. Five shops with hardcoded coordinates, used as a fallback whenever the Overpass API returns nothing or the request fails/times out. Always active in production (for testing) — merged with the live API results on every app launch.
 
- `MOCK_RIPENESS_TEST_INGREDIENTS`
Defined in `src/constants/mockIngredients.ts`. Five fabricated ingredients built to manually test the "Check ripeness" badge logic:
 
- Avocado (Overdue Check)	- last checked 4 days ago -	shows expected badge
- Bananas (Never Checked) -	lastRipenessCheckAt: null	- shows expected badge
- Tomatoes (Up to Date)	- last checked 2 hours ago -	hidden
- Canned Beans - confectionType: 'canned', no ripeness -	hidden
- Strawberries (double badge) -	overdue check and missing data - both badges show

These are not wired into the running app. They're imported in AppContext.tsx but not otherwise referenced — the following block can be inserted to swap the persisted ingredient state for this fixed set, to test badge behavior without manually creating ingredients with specific dates:
 
```text
/* MOCK INGREDIENTS FOR TESTING
const [ingredients, setIngredients] = usePersistentState<Ingredient[]>(
  'kitchen-buddy-ingredients-v1',
  MOCK_RIPENESS_TEST_INGREDIENTS
);
*/
```
 
To use them during development, uncomment this block (and comment out the real usePersistentState call above it).
 
## Functional Programming
 
Most of the app's rules are pure functions that take data in and return new data, living in `src/utils/helpers.ts`:
 
- `parseExpiration(exp)`: converts an exact date or a relative estimate (`"1 week"`, `"10 days"`, `"1 month"`) into a display string and a timestamp.
- `isPastExpiration(exp)`: parses an expiration string and returns true if it falls before today. Used by `IngredientForm` to block saving an ingredient with a past expiration date.
- `buildIngredientFromDraft(draft)`: assembles a complete `Ingredient` from form input, applying the Open, Frozen, and Ripeness rules in sequence (`applyOpenRules`, `applyFrozenRules`, `applyRipenessRules`).
- `applyOpenRules(isOpen, wasOpen, finalExp, timestamp)`: applies the Open-item rule. Only fires on the transition into Open (`isOpen` true and `wasOpen` false/undefined) — toggling it on again or leaving it open on a later edit has no effect. When it fires, it pulls the expiration in to `OPEN_ITEM_DAYS` (4) days from now, but only if that's actually sooner than the expiration already set; it never pushes a nearer expiration further out.
- `applyFrozenRules(isFrozen, location, finalExp, timestamp)`: applies the Frozen-item rule at the data level — it doesn't check confection type itself (that gating happens in `IngredientForm`, see below). When `isFrozen` is true, forces `location` to `'freezer'` and extends the expiration to at least 6 months from now — again only if the current expiration is sooner than that floor. Runs after `applyOpenRules` in `buildIngredientFromDraft`, and works from the pre-Open expiration when the item is frozen, so freezing always wins over the Open shortening for the same save.
- `applyRipenessRules(confectionType, ripeness, previousIngredient)`: only keeps a ripeness value for Fresh confection items — everything else (including Packaged) is forced to `null`. When a ripeness level is set, it stamps `lastRipenessCheckAt` with the current time only if the value actually changed from the previous save; if it's unchanged, the previous check timestamp is kept, so simply re-saving the form without touching ripeness doesn't reset the 3-day check window.
- `isFreshConfection(confection)`: returns true only when `confectionType === 'fresh'`. Used to gate ripeness to fresh items, and — together with a `confection === 'packaged'` check inside `IngredientForm` — to decide whether the Frozen switch is shown at all.
- `getDaysUntilExpiration(timestamp)`: days remaining until an ingredient expires.
- `needsRipenessCheck(ingredient)`: true once more than 3 days have passed since the last ripeness check.
- `filterExpiringWithin(ingredients, days)`: ingredients expiring within the threshold, plus any that are Open or already ripe enough to use; frozen items are only included once they're genuinely within the window.
- `hasMissingDetails(ingredient)`: flags ingredients missing category, location, confection type, expiration, or (for fresh items) ripeness.
- `getRecentlyAdded(ingredients, limit)`: sorts by creation date, newest first.
- `filterRecentlyBoughtIngredients(ingredients)`: ingredients currently flagged `isRecentlyBought`.
- `filterIngredients(ingredients, search, location, category, confectionType)`: combined search/filter used by My Items.
- `getQuantityStep(unit)`: 0.25 for `kg`/`l`, 1 for `pcs`.
- `isLowOrEmpty(ingredient)`: true once `consumedPercentage >= 75` or `quantity = 0` for unit pcs and `quantity <= 0.25` for kg or l.
- `calculateSuggestedExpiry(name, allIngredients)`: derives a new expiration for a re-bought item from how long the most recent matching ingredient actually lasted (days between its `createdAt` and its expiration).
- `buildBoughtIngredient(groceryItem, allIngredients)`: builds the new `Ingredient` created when a grocery item is marked bought, reusing details (category, location, confection, etc.) from a source ingredient where possible. The new ingredient always starts at `quantity: 0` and 0% consumed, regardless of what the grocery item or the source ingredient had.
- `groceryFitsShop(item, shop)` / `sortGroceriesForShop(items, shop)`: shop-type keyword/category matching and the resulting sort order described above
- `nearbyStoreSuggestions(shop)`: the suggestion list shown for a given shop type.
The code favors `map`, `filter`, and `sort` over in-place mutation, and `AppContext` always updates state through the functional `setState` form (`setIngredients((current) => ...)`) so updates are based on the latest snapshot rather than a stale closure.
 
## Location And Battery Usage
 
The app does not use background or continuous location tracking. Location is read once, in the foreground, right after the app boots:
 
- App `status` switches to `'ready'` immediately when this effect starts, before permissions or location are resolved — the UI is never blocked waiting on the shop lookup; ingredients and groceries render right away from `AsyncStorage`, and `nearbyShop` simply stays `null` until it resolves in the background.
- `Location.requestForegroundPermissionsAsync()` asks for foreground permission on mount.
- If granted, `Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low })` reads the current position, raced against a 3-second timeout so a slow GPS fix can't hang the app.
- The resulting coordinates are sent to the Overpass API to fetch real nearby shops, with a 4-second abort timeout; a failed or slow request falls back to an empty list rather than blocking anything.
- The live Overpass results are merged with a handful of hardcoded `DEFAULT_SHOPS` (used for testing/demo purposes), and the nearest one within `min(shop.radiusMeters, 200m)` is kept.
- The effect runs exactly once, guarded by a `mounted` flag so it never sets state after the provider unmounts.
- There is no polling interval — if the user moves to a different shop after launch, the app won't notice until it's restarted.

This keeps the implementation simple and avoids any continuous GPS usage.
 
## Source Structure
 
```text
App.js
tsconfig.json
src/
  App.tsx
  types.ts
  components/
    BackButton.tsx
    BarcodeScannerModal.tsx
    ChipSelector.tsx
    DaysThresholdControl.tsx
    EstimateDatePicker.tsx
    GroceryItemCard.tsx
    Header.tsx
    IngredientCard.tsx
    IngredientForm.tsx
    IngredientList.tsx
    QuantityControl.tsx
    ShopLocationBanner.tsx
    SuccessMessage.tsx
  constants/
    options.ts
    mockIngredients.ts
  context/
    AppContext.tsx
  hooks/
    usePersistentState.ts
  navigation/
    AppNavigator.tsx
  screens/
    AddScreen.tsx
    EditScreen.tsx
    ExpiringScreen.tsx
    GroceryScreen.tsx
    MyItemsScreen.tsx
  services/
    openFoodFacts.ts
    shopApi.ts
  theme/
    styles.js
  utils/
    helpers.ts
```
 
Top-level files:
 
- `App.js`: Expo entry file, registered with `registerRootComponent`; re-exports `src/App.tsx`.
- `tsconfig.json`: extends `expo/tsconfig.base` with `strict: true`.
- `app.json`: Expo config (`Kitchen-Buddy-Unibz`), portrait-only, light `userInterfaceStyle`
- `src/App.tsx`: wraps the app with `SafeAreaProvider`, `AppProvider`, and `AppNavigator`.
- `src/types.ts`: shared TypeScript domain types (`Ingredient`, `GroceryItem`, `Shop`, and the union types for category/location/confection/ripeness/unit/dietary tag/query mode)

Folders:
 
- `src/components`: reusable UI building blocks.
- `src/constants`: fixed app data (chip options, default shops, query modes, mock test data) imported by the screens and form.
- `src/context`: global app state (`AppContext.tsx`) and the typed hooks screens use to read/mutate it.
- `src/hooks`: `usePersistentState`, the generic AsyncStorage-backed state hook.
- `src/navigation`: bottom tabs and the per-tab edit stacks.
- `src/screens`: the five full-screen views.
- `src/services`: the two external API integrations (OpenFoodFacts, Overpass).
- `src/theme`: shared colors and `StyleSheet` styles (`styles.js`).
- `src/utils`: pure business logic (`helpers.ts`)

## Source Files And Components
 
### `src/App.tsx`
 
Root wrapper: `SafeAreaProvider` → `AppProvider` → `AppNavigator`.
 
### `src/types.ts`
 
Central domain model for Typescript
 
### `src/components`
 
`BackButton.tsx`
 
- Props: `onPress: () => void`, `title?: string` (defaults to `"Go back"`).
- State: none.
- Purpose: orange header bar with a back arrow, used at the top of `EditScreen` and `BarcodeScannerModal`.

`BarcodeScannerModal.tsx`
 
- Props: `visible: boolean`, `onClose: () => void`, `onBarcodeScanned: (barcode: string) => void`.
- State: `permission` (from `useCameraPermissions()`), `scanned: boolean` (guards against double-firing the same scan).
- Purpose: full-screen camera modal that scans EAN/UPC/Code128 barcodes and reports the raw barcode string back to `AddScreen`, which does the OpenFoodFacts lookup.

`ChipSelector.tsx`
 
- Props (generic over `T extends string`): `options: Option[]`, `selectedValue: T | null | undefined`, `onSelect: (value: T | null) => void`.
- State: none.
- Purpose: reusable multi-icon chip row used for category, location, confection, and filters. Tapping the already-selected chip deselects it (sets `null`).

`DaysThresholdControl.tsx`
 
- Props: `value: number`, `onChange: (days: number) => void`.
- State: none.
- Purpose: 3/7/14-day toggle used at the top of `ExpiringScreen`.

`EstimateDatePicker.tsx`
 
- Props: `value: string`, `onChange: (value: string) => void`.
- State: none.
- Purpose: single text field for entering an exact date or a relative estimate like `3 days`.

`GroceryItemCard.tsx`
 
- Props: `item: GroceryItem`, `onBuy: (id: string) => void`, `onDelete: (id: string) => void`.
- State: none.
- Purpose: one row in the shopping list with Bought/Remove actions. Shows the item name only — quantity/unit is no longer displayed on this card.

`Header.tsx`
 
- Props: none.
- State: none.
- Purpose: orange gradient banner ("Kitchen Buddy — Your fridge, sorted.") shown at the top of Add, Expiring, My Items, and Grocery.

`IngredientCard.tsx`
 
- Props: `ingredient: Ingredient`, `onPress: (ingredient: Ingredient) => void`.
- State: none — derives `missingDetails` (via `hasMissingDetails`), `shouldCheckRipeness` (via `needsRipenessCheck`), and status tags (`FROZEN`/`OPEN`/ripeness label) inline.
- Purpose: card used by both `ExpiringScreen` and `MyItemsScreen` lists; visually distinct (`frozenCard` style) when frozen, with badges for missing data or a due ripeness check.

`IngredientForm.tsx`
 
- Props: `initialData?: Ingredient | null`, `onSave: (ingredient: Ingredient) => void`, `isEdit: boolean`, `onCancel?: () => void`, `prefillData?: BarcodeScanSuggestion | null`, `onDelete?: () => void`.
- State: a single `useReducer` (`FormState`/`FormAction`) covering every field — name, category, location, confection, expiration, quantity, unit, ripeness, open, frozen, brand, barcode, consumedPercentage, dietaryTags.
- Purpose: the shared add/edit form used by both `AddScreen` and `EditScreen`. The Frozen switch is only shown for Fresh and Packaged confection; switching to any other confection type auto-resets `isFrozen` to false, and switching away from Fresh also clears `ripeness`. Turning **Frozen** on sets location to Freezer (if unset); turning it off resets expiration to today and clears the Freezer location if it was set. Before saving, it blocks (with an alert, using `alert()` on web and `Alert.alert` elsewhere) if the name is empty or the expiration date is already in the past (via `isPastExpiration`), then calls `buildIngredientFromDraft` (which layers in the 4-day Open rule and 6-month Frozen floor) and hands the result to `onSave`.

`IngredientList.tsx`
 
- Props: `ingredients: Ingredient[]`, `onPress: (ingredient: Ingredient) => void`, `header?: ReactElement`, `numColumns?: number`.
- State: none.
- Purpose: reusable `FlatList` wrapper rendering `IngredientCard` rows, with a friendly empty state and an optional header slot used for search/filter controls.

`QuantityControl.tsx`
 
- Props: `value: number`, `unit: Unit`, `consumedPercentage?: number`, `onChangeQuantity`, `onChangeUnit`, `onChangeConsumed?`.
- State: none — fully controlled from the parent form.
- Purpose: unit chips (`pcs`/`kg`/`l`), a +/- stepper with a unit-aware step size, direct numeric text entry (comma-to-dot normalized), and the 0/25/50/75/100% consumed chip row.

`ShopLocationBanner.tsx`

- Props: `nearbyShop: Shop | null`.
- State: none.
- Purpose: banner at the top of `GroceryScreen` showing the detected shop's name and type, or "No nearby store detected".

`SuccessMessage.tsx`
 
- Props: `title: string`, `description: string`, `onContinue: () => void`.
- State: none.
- Purpose: shared checkmark/confirmation screen shown after adding, updating, or deleting an ingredient.

### `src/constants`
 
`options.ts`
 
- Purpose: the option lists actually used across the app — `CATEGORIES` (now including Grains and Bakery), `LOCATIONS`, `CONFECTIONS`, `RIPENESS_LEVELS` (each with icon + icon family), `DEFAULT_SHOPS` (five hardcoded shops used as a fallback/demo set), `QUERY_OPTIONS` (All / Recent / Recently Bought), plus `MS_PER_DAY` and `MAX_DISTANCE_METERS`.

`mockIngredients.ts`
 
- Purpose: `MOCK_RIPENESS_TEST_INGREDIENTS`, sample data for manually testing ripeness behavior. Currently only referenced from a commented-out alternate `usePersistentState` call in `AppContext.tsx`, not wired into the live app.

### `src/context`
 
`AppContext.tsx`
 
- Purpose: owns all global app state — `ingredients`, `groceries`, a persisted `handledLowStockIngredientIds` list, `nearbyShop`, and boot `status` — and exposes it through typed selector hooks: `useIngredients`, `useGroceries`, `useNearbyShop`, `useAppStatus`, plus the underlying `useAppContext`. Derives `activeIngredients` and `lowIngredients` with `useMemo` rather than storing them separately, and runs the one-time location/shop-detection effect described above.

### `src/hooks`
 
`usePersistentState.ts`
 
- Purpose: generic `useState`-shaped hook that hydrates from `AsyncStorage` on mount and persists on every change thereafter, deliberately delaying the first write until hydration completes so a fresh default state can't clobber previously saved data.

### `src/navigation`
 
`AppNavigator.tsx`
 
- Purpose: defines the bottom tab bar (Add, Expiring, My Items, Groceries) with per-route icons, and wraps Expiring and My Items in their own native stacks so tapping a card pushes `EditScreen`. Also watches `nearbyShop` via `useNearbyShop()` and imperatively navigates to the Groceries tab the first time a given shop is detected (tracked by shop id in `openedFromShop`, so it can fire again for a *different* shop later in the session). Shows a loading spinner while `status === 'booting'`.

### `src/screens`
 
`AddScreen.tsx`
 
- Purpose: hosts the "Scan Barcode" button and the `IngredientForm` for creating a new ingredient. Owns the barcode flow end-to-end: opens `BarcodeScannerModal`, calls `fetchProductByBarcode`, and distinguishes a genuine "not found" result from a network/server error (`BarcodeFetchError`) to show the right alert. On successful save, shows `SuccessMessage` before returning to a blank form.

`EditScreen.tsx`
 
- Purpose: edits an existing ingredient passed via route params. Has three internal views driven by local state: the edit form, a delete-confirmation prompt, and a success message (for both update and delete). Delegates to `updateIngredient`/`deleteIngredient` from `AppContext`.

`ExpiringScreen.tsx`
 
- Purpose: shows ingredients expiring within a selectable threshold (3/7/14 days via `DaysThresholdControl`), further narrowed by a free-text search, using `filterExpiringWithin`. Switches between 1 and 2 columns based on screen width.

`GroceryScreen.tsx`
 
- Purpose: the shopping list — `ShopLocationBanner`, tappable shop-specific suggestions, a quick-add input, the low-stock suggestion list (tap to add to groceries), and the sorted shopping list itself with Bought/Remove actions per item.

`MyItemsScreen.tsx`
 
- Purpose: full ingredient browser — free-text search, query mode (All / Recent / Recently Bought), and chip filters for location, category, and confection, all combined via `filterIngredients`. Switches between 1 and 2 columns based on screen width.

### `src/services`
 
`openFoodFacts.ts`
 
- Purpose: `fetchProductByBarcode(barcode)` queries OpenFoodFacts and maps a successful response into a `BarcodeScanSuggestion` (name, brand, category). Distinguishes three outcomes deliberately: a mapped suggestion, `null` for "no product on file" (a normal, expected case), and a thrown `BarcodeFetchError` for network/HTTP/parsing failures (a real error the caller should surface differently).

`shopApi.ts`
 
- Purpose: `fetchNearbyShops(lat, lon)` builds and POSTs an Overpass QL query for shops (`supermarket`, `convenience`, `butcher`, `seafood`/`fishmonger`, `greengrocer`, `bakery`) within 500m, and maps the raw OSM elements into the app's `Shop` type. Returns an empty array on any non-OK response rather than throwing.

### `src/theme`
 
`styles.js`
 
- Purpose: shared `COLORS` palette (orange primary, `#f97316`) and a single `StyleSheet.create` object (`styles`) used by every screen and component — cards, chips, buttons, form fields, the header gradient, badges, and layout containers.

### `src/utils`
 
`helpers.ts`
 
- Purpose: the bulk of the app's business logic — expiration parsing and validation, the Open/Frozen/Ripeness rules, filtering and querying, low-stock detection, rebuy logic, and shop-type matching/sorting. See Functional Programming above for the key exports.

## UI Tree
 
React Native does not use the browser DOM, but the UI is organized as a component tree.
 
```text
App
`- SafeAreaProvider
   `- AppProvider (State Owner)
      `- AppNavigator
         `- NavigationContainer
            `- BottomTabNavigator
               |- Add (Tab)
               |  `- AddScreen
               |     |- Header
               |     |- BarcodeScannerModal [cb: onBarcodeScanned -> AddScreen -> OpenFoodFacts lookup]
               |     |- IngredientForm [cb: onSave -> AddScreen -> addIngredient]
               |     |  |- ChipSelector (category / location / confection)
               |     |  |- RipenessSelector (fresh items only)
               |     |  |- DietaryCheckboxGroup
               |     |  |- EstimateDatePicker
               |     |  `- QuantityControl
               |     `- SuccessMessage (after save)
               |- Expiring (Tab)
               |  `- ExpiringStack
               |     |- ExpiringScreen
               |     |  |- Header
               |     |  |- DaysThresholdControl
               |     |  `- IngredientList
               |     |     `- IngredientCard [cb: onPress -> EditIngredient]
               |     `- EditScreen
               |        |- BackButton
               |        |- IngredientForm [cb: onSave -> updateIngredient]
               |        `- SuccessMessage / delete-confirmation view
               |- My Items (Tab)
               |  `- MyItemsStack
               |     |- MyItemsScreen
               |     |  |- Header
               |     |  |- ChipSelector (location / category / confection)
               |     |  `- IngredientList
               |     |     `- IngredientCard [cb: onPress -> EditIngredient]
               |     `- EditScreen (same as above)
               `- Groceries (Tab)
                  `- GroceryScreen
                     |- Header
                     |- ShopLocationBanner
                     |- low-stock suggestions [cb: addGroceryFromIngredient]
                     |- quick-add input [cb: quickAddGrocery]
                     `- GroceryItemCard list [cb: buyGrocery / deleteGrocery]
```
 
## Control Flow
 
### Global State
 
```text
App
  SafeAreaProvider
    AppProvider
      usePersistentState loads ingredients from AsyncStorage
        -> activeIngredients is a direct memoized pass-through of ingredients
        -> lowIngredients is derived: ingredients with consumedPercentage >= 75,
           excluding any already in the grocery list or already "handled"
      usePersistentState loads groceries from AsyncStorage
      usePersistentState loads handledLowStockIngredientIds from AsyncStorage
      one-time effect on mount:
        Location.requestForegroundPermissionsAsync()
        Location.getCurrentPositionAsync() (raced against a 3s timeout)
        fetchNearbyShops(lat, lon) via Overpass (4s abort timeout, falls back to [])
        merge with DEFAULT_SHOPS -> nearestShopFrom(...) -> setNearbyShop
      AppNavigator
        screens read data through useIngredients, useGroceries, useNearbyShop, useAppStatus
```
 
Derived lists are recalculated from the persisted arrays on every render via `useMemo`, so, for example, once an ingredient's consumed percentage reaches 75%, `lowIngredients` picks it up automatically and the Grocery tab can suggest it.
 
### Adding An Ingredient
 
```text
AddScreen
  receives addIngredient from useIngredients()
  IngredientForm
    keeps all fields in a single useReducer draft
    user presses "Add Ingredient"
      -> validates that name is non-empty
      -> validates that the expiration date is not in the past (isPastExpiration)
      -> buildIngredientFromDraft(draft) applies Open/Frozen/Ripeness rules
      -> calls onSave(ingredient)
AddScreen.onSave
  -> addIngredient(ingredient)
  -> shows SuccessMessage
AppProvider.addIngredient
  -> setIngredients((current) => [ingredient, ...current])
usePersistentState
  -> persists the new array to AsyncStorage
React
  -> recalculates activeIngredients and lowIngredients
  -> form resets to empty once the user continues past the success screen
```
 
### Editing An Ingredient
 
```text
ExpiringScreen or MyItemsScreen
  IngredientList
    IngredientCard
      user presses a card
        -> calls onPress(ingredient)
ExpiringScreen/MyItemsScreen.handlePress / openIngredient
  -> navigation.navigate('EditIngredient', { ingredient })
EditScreen
  -> receives ingredient from route.params
  -> passes it as initialData to IngredientForm
IngredientForm
  -> initializes its reducer from the existing ingredient (formStateFromIngredient)
  -> user edits fields (toggling Frozen off, for example, resets expiration to today
     and clears the Freezer location right in the reducer; changing confection type
     away from Fresh/Packaged auto-resets Frozen, and away from Fresh clears ripeness)
  -> buildIngredientFromDraft(draft, previousIngredient: initialData)
  -> calls onSave(updatedIngredient)
EditScreen.handleSave
  -> updateIngredient(updatedIngredient)
  -> shows SuccessMessage, then navigation.goBack() on continue
AppProvider.updateIngredient
  -> replaces the ingredient with the same id, and clears isRecentlyBought
  -> AsyncStorage saves the new list
React
  -> the originating list re-renders with the edited values
```
 
### Barcode Scanning
 
```text
AddScreen
  keeps isScannerVisible and prefillData in local state
  user presses "Scan Barcode"
    -> setIsScannerVisible(true)
BarcodeScannerModal
  -> asks camera permission via useCameraPermissions()
  -> CameraView detects a barcode -> onBarcodeScanned(barcode) -> onClose()
AddScreen.handleBarcodeScanned
  -> fetchProductByBarcode(barcode)
     - suggestion found -> setPrefillData({ ...suggestion, barcode })
     - null (genuinely not found) -> Alert "No product information was found"
     - BarcodeFetchError thrown -> Alert "Could not reach OpenFoodFacts..."
  -> finally: setIsScannerVisible(false)
IngredientForm
  -> receives prefillData as a prop
  -> useEffect dispatches { type: 'prefill', value: prefillData } into the reducer,
     filling name, brand, category, barcode
  user reviews/completes the rest of the form and presses "Add Ingredient"
    -> buildIngredientFromDraft(draft) -> onSave(ingredient)
AddScreen.onSave
  -> addIngredient(ingredient)
React
  -> lists and tabs re-render with the scanned product's data
```
 
### Grocery List And Rebuy
 
```text
AppProvider
  derives lowIngredients from ingredients + groceries + handledLowStockIngredientIds
GroceryScreen
  -> reads lowIngredients via useAppStatus()
  -> reads grocery callbacks via useGroceries()
  user taps a low-stock suggestion
    -> addGroceryFromIngredient(ingredient)
AppProvider.addGroceryFromIngredient
  -> marks the ingredient id as "handled" so the same suggestion won't reappear
  -> skips adding if an equivalent entry already exists (same source id or same name)
  -> otherwise prepends a new GroceryItem built from the ingredient
GroceryScreen
  -> the shopping list re-renders with the new item
  user presses "Bought" on a grocery item
    -> buyGrocery(id)
AppProvider.buyGrocery
  -> finds the grocery item; if it came from an ingredient, marks that id "handled"
  -> buildBoughtIngredient(groceryItem, currentIngredients):
       - finds a source ingredient (by sourceIngredientId, or by matching name
         among past ingredients) to copy category/location/confection/etc. from
       - calculateSuggestedExpiry(...) derives a new expiration from how long
         the previous purchase of that item actually lasted
       - always starts at 0% consumed and quantity 0
  -> prepends the new ingredient with isRecentlyBought: true
  -> removes the grocery item from the list
React
  -> My Items can show the new ingredient under "Recently Bought"
  -> the shopping list no longer shows the bought item
```
 
The old ingredient entry is never overwritten when the same product is bought again — a brand-new `Ingredient` is created instead, since the new purchase can have its own expiration date, quantity, and condition.
 
### Shop-Aware Grocery List
 
```text
AppProvider
  one-time effect on mount:
    Location.requestForegroundPermissionsAsync()
    Location.getCurrentPositionAsync() (Accuracy.Low, raced against a 3s timeout)
    fetchNearbyShops(lat, lon) via Overpass, merged with DEFAULT_SHOPS
    nearestShopFrom(lat, lon, shops) -> setNearbyShop(shop)
AppNavigator
  reads nearbyShop via useNearbyShop()
  if a new shop is detected (different from the last one auto-opened for)
    -> navigation.navigate('Groceries')
GroceryScreen
  reads nearbyShop via useNearbyShop()
  sortGroceriesForShop(groceries, nearbyShop)
    -> shop-matching items (by category or keyword) are sorted before the rest
  ShopLocationBanner shows the shop's name/type
  nearbyStoreSuggestions(nearbyShop) renders quick-add chips for that shop type
React
  -> GroceryScreen re-renders with the reordered list and suggestions
```
 
The app never tracks the user continuously in the background — it reads the position once on launch and uses that single result to decide whether to switch tabs and how to sort the list for the rest of the session.
 
### Query And Render Flow
 
```text
ExpiringScreen
  keeps daysThreshold and searchTerm in local state
  calls useWindowDimensions()
    -> width < 760 -> numColumns = 1
    -> width >= 760 -> numColumns = 2
  user picks a day threshold (3/7/14)
    -> setDaysThreshold(value)
  -> filterExpiringWithin(ingredients, daysThreshold)
  -> further narrowed by searchTerm if present
  -> IngredientList receives the filtered ingredients + numColumns
  IngredientList
    -> FlatList renders visible IngredientCard rows lazily, laid out in
       numColumns columns
  user presses an IngredientCard
    -> navigation.navigate('EditIngredient', { ingredient })
 
MyItemsScreen
  keeps searchTerm, queryMode, selectedLocation, selectedCategory,
  selectedConfection in local state
  calls useWindowDimensions() the same way as ExpiringScreen
  user picks a query mode (All / Recent / Recently Bought) or a filter chip
    -> setQueryMode / setSelectedLocation / setSelectedCategory / setSelectedConfection
  -> applyQueryMode(ingredients, queryMode) narrows by mode first
  -> filterIngredients(queryResult, searchTerm, location, category, confection)
  -> IngredientList receives the filtered ingredients + numColumns
  user presses "Clear"
    -> resets search, query mode, and all three filters at once
  user presses an IngredientCard
    -> navigation.navigate('EditIngredient', { ingredient })
```
 
## TypeScript Notes
 
The project uses TypeScript with:
 
- `strict: true` (via `extends: "expo/tsconfig.base"`).
- Typed domain models in `src/types.ts` (`Ingredient`, `GroceryItem`, `Shop`, `QueryOption`, and the supporting union types — `Category` includes `grains` and `bakery`).
- Typed navigation route params per stack (`ExpiringStackParamList`, `MyItemsStackParamList`, `EditStackParamList`), each carrying a typed `ingredient: Ingredient` param into `EditIngredient`.
- A narrowed `NavigationRef` interface in `AppNavigator.tsx` (exposing only `navigate`/`isReady`) instead of typing the nav ref as `any`.
- A dedicated `BarcodeFetchError` class in `openFoodFacts.ts` so callers can distinguish a technical failure from a legitimate "not found" (`null`) result.
- Typed component props on every component, and a generic `ChipSelector<T extends string>` so it can be reused for category, location, confection, and unit values without losing type safety.
- `useReducer` with a typed `FormState`/`FormAction` union driving the entire `IngredientForm`.
- `React.FC` used consistently for components.

## Running the project locally
 
```bash
npm install
npm start        # then choose a platform, or:
npm run android
npm run ios
npm run web
```
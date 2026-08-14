# Kitchen Buddy

Kitchen Buddy is a React Native + Expo + TypeScript application designed for smart kitchen inventory tracking, food waste prevention, and grocery list management.

## What the app does

The application supports the assignment's main workflow:

- **Add & Manage Ingredients**: Track items by name, category, storage location (Pantry, Fridge, Freezer), confection type, and expiration date.
- **Quantity & Consumption Tracking**: Define units, amounts, and track consumed quantities to monitor food usage.
- **Freshness & Ripeness**: Monitor the ripeness status for fresh ingredients. Every 3 days the ripeness is checked to prevent waste.
- **Smart Expiration Rules**:
  - Marking an item as *Open* automatically shortens the window and moves it to *Expiring Soon*.
  - Marking a fresh item as *Frozen* extends shelf-life up to 6 months in the freezer view, when deactivated, the item will be assigned with the expiring date of the day you defrost it, removing it from the freezer location.
- **Search, Filter & Sort**: Browse items using free-text search, chip selectors, missing data filters, recent entries, and quick edits for recently bought groceries.
- **Expiring Soon Hub**: Dedicated query screen with an adjustable dynamic threshold window (e.g., 3, 5, 7 days).
- **Automated Grocery Integration**:
  - Automatically identifies low-stock items and suggests them for purchase. Items with an amount consumed equal or more than 75% will be suggested as "Low stock suggestions".
  - Bought items automatically migrate into *My Items* with predicted expiring date derived from past entries.
- **Barcode Scanning & Fast Entry**: Quickly look up product details from barcodes using external product databases.
- **Proximity & Shop Detection**: Alerts the user when near grocery store locations.

## Project structure

The app follows a simple component tree:

Kitchen Buddy
├─ App
│  └─ AppProvider
│     └─ AppNavigator
│        ├─ AddScreen
│        │  └─ IngredientForm
│        │     ├─ ChipSelector
│        │     ├─ EstimateDatePicker
│        │     └─ QuantityControl
│        ├─ ExpiringScreen
│        │  ├─ DaysThresholdControl
│        │  └─ IngredientList
│        │     └─ IngredientCard
│        ├─ MyItemsScreen
│        │  ├─ ChipSelector
│        │  └─ IngredientList
│        └─ GroceryScreen
│           ├─ ShopLocationBanner
│           └─ GroceryItemCard

## Main components and responsibilities

### App
Root application wrapper. It only sets up the provider and navigation stack.

### AppProvider
Global single source of truth. It stores ingredients and grocery items, exposes mutation helpers, and computes derived values such as low-stock suggestions.

### AppNavigator
Creates the bottom tabs and the stack navigators used to move between the add, expiring, my items, and grocery flows.

### AddScreen
Dedicated screen for adding a new ingredient and launching the barcode scan workflow placeholder.

### ExpiringScreen
Shows all ingredients close to expiry, using the threshold selector.

### MyItemsScreen
Supports search and filter queries for ingredients by missing data, recent items, and chip-based selection.

### GroceryScreen
Contains quick-add input, low-stock suggestions, and shopping list actions.

### IngredientForm
Reusable add/edit form. It gathers the core ingredient fields and transforms them into the shared domain object.

### IngredientCard
Displays one ingredient entry with quick action affordances and status badges.

### IngredientList
Reusable FlatList renderer with a friendly empty-state message.

### ChipSelector
Reusable chip selector used for categories, locations, confections, and ripeness.

### EstimateDatePicker
Date field plus quick estimate shortcuts.

### QuantityControl
Counter for quantities and a unit picker.

### DaysThresholdControl
Small selector that switches the expiring window threshold.

### GroceryItemCard
Displays a grocery item row and its related purchase/delete action.

### ShopLocationBanner
Shows whether the user is near a detected shop.

## Control flow summary

- The user types data in IngredientForm.
- The form calls its save callback upward to the screen.
- The screen passes the ingredient into AppProvider.
- AppProvider updates the shared state immutably.
- Screens recompute their visible results from that state.

This structure follows the Thinking in React approach by keeping state in the closest shared parent and deriving lists from it rather than storing multiple copies.

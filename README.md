# Kitchen Buddy

Kitchen Buddy is a React Native + Expo + TypeScript app for tracking kitchen items and managing grocery needs.

## What the app does

The application supports the assignment's main workflow:

- add ingredients with name, category, location, confection, and expiration
- browse ingredients with text search and chip-based filtering
- inspect the expiring-soon query in a dedicated tab
- persist ingredients and grocery items across app restarts
- track ripeness and open/frozen flags
- manage grocery items with quick-add and low-stock suggestions

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

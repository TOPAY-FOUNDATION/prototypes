# CSS Styling System

## Overview

This project uses a structured CSS approach with separate files for different concerns:

- **theme.css**: Contains CSS variables and theme-specific styles for light and dark modes
- **components.css**: Reusable component styles like cards, buttons, and form elements
- **layout.css**: Layout utilities for spacing, positioning, and responsive design
- **utilities.css**: General utility classes for common styling needs

## How to Use

### Theme Variables

Use CSS variables for consistent theming across the application:

```css
/* Example using theme variables */
.my-element {
  background-color: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
}
```

These variables automatically adapt to light and dark modes.

### Component Classes

Use predefined component classes for consistent UI elements:

```jsx
// Example using component classes
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Card Title</h3>
  </div>
  <div className="card-body">
    <p>Card content goes here</p>
  </div>
  <div className="card-footer">
    <button className="btn btn-primary">Action</button>
  </div>
</div>
```

### Layout Classes

Use layout classes for structure and spacing:

```jsx
// Example using layout classes
<div className="container">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <div className="p-4">Column 1</div>
    <div className="p-4">Column 2</div>
    <div className="p-4">Column 3</div>
  </div>
</div>
```

### Utility Classes

Use utility classes for common styling needs:

```jsx
// Example using utility classes
<div className="flex justify-between items-center">
  <span className="text-primary font-bold">Important text</span>
  <button className="btn btn-secondary">Click me</button>
</div>
```

## Common Components

### Cards

```jsx
<div className="card">
  <div className="card-header">Header</div>
  <div className="card-body">Content</div>
  <div className="card-footer">Footer</div>
</div>
```

### Buttons

```jsx
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
```

### Data Display

```jsx
<div className="data-row">
  <span className="label">Label</span>
  <span className="value">Value</span>
</div>
```

### Address Display

```jsx
<div className="address-container">
  <span className="address-label address-from">From</span>
  <span className="address">0x1234...</span>
</div>
```

## Migrating from Inline Tailwind

When migrating from inline Tailwind classes to our CSS system:

1. Replace color-specific classes with theme variables:
   - `bg-white dark:bg-gray-800` → `card` or `bg-primary`
   - `text-gray-900 dark:text-white` → Use default text color

2. Replace component-specific classes with our component classes:
   - Complex card structures → `card`, `card-header`, etc.
   - Button styles → `btn`, `btn-primary`, etc.

3. Keep using layout utilities from Tailwind when needed:
   - `flex`, `grid`, `gap-4`, etc. are still available

4. Use our semantic classes for better readability:
   - `text-blue-600 hover:text-blue-800` → `link`
   - `text-gray-500 dark:text-gray-400` → `text-secondary`

## Example

Before:
```jsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Title</h3>
    <span className="text-sm text-gray-500 dark:text-gray-400">Subtitle</span>
  </div>
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Label:</span>
      <span className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono">Value</span>
    </div>
  </div>
</div>
```

After:
```jsx
<div className="card p-6">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-lg font-semibold">Title</h3>
    <span className="text-sm text-secondary">Subtitle</span>
  </div>
  <div className="space-y-3">
    <div className="data-row">
      <span className="label">Label:</span>
      <span className="hash">Value</span>
    </div>
  </div>
</div>
```
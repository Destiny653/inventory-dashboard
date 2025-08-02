# Flat Styling Guide

This guide explains how to use flat styling (no border radius, no shadows) across your application.

## Overview

All shadcn components now have **no border radius** and **no box shadows** by default. This creates a clean, flat design aesthetic.

## What's Been Implemented

### 1. **Global CSS Overrides**
- All shadcn components have `border-radius: 0` and `box-shadow: none`
- CSS variables updated to set `--radius: 0rem`
- Tailwind config updated to set all border radius values to 0

### 2. **Utility Classes**
- `.no-radius` - Removes border radius
- `.no-shadow` - Removes box shadow
- `.flat` - Removes both border radius and box shadow

### 3. **Wrapper Component**
- `FlatWrapper` - Wraps any component with flat styling
- `withFlatStyling` - HOC for applying flat styling

## How to Use

### Method 1: Global Default (Already Applied)
All shadcn components automatically have flat styling. No additional work needed.

### Method 2: Utility Classes
```tsx
// Remove border radius only
<div className="no-radius">Content</div>

// Remove shadow only
<div className="no-shadow">Content</div>

// Remove both
<div className="flat">Content</div>

// Combine with other classes
<Card className="flat bg-white">
  <CardContent>Flat card content</CardContent>
</Card>
```

### Method 3: FlatWrapper Component
```tsx
import { FlatWrapper } from '@/components/ui/flat-wrapper'

// Wrap any component
<FlatWrapper>
  <Card>
    <CardContent>This card will be flat</CardContent>
  </Card>
</FlatWrapper>

// Use with custom element
<FlatWrapper as="section" className="p-4">
  <h2>Flat section</h2>
</FlatWrapper>
```

### Method 4: Higher-Order Component
```tsx
import { withFlatStyling } from '@/components/ui/flat-wrapper'

const FlatCard = withFlatStyling(Card)

// Use the flat component
<FlatCard>
  <CardContent>This card is flat</CardContent>
</FlatCard>
```

## Components Affected

The following components now have flat styling by default:

### Layout Components
- `Card`, `CardHeader`, `CardContent`, `CardFooter`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`
- `Sheet`, `SheetContent`, `SheetHeader`, `SheetFooter`
- `Popover`, `PopoverContent`
- `HoverCard`, `HoverCardContent`

### Form Components
- `Input`, `Textarea`
- `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`
- `Button` (all variants)
- `Switch`, `SwitchThumb`, `SwitchTrack`
- `Checkbox`, `RadioGroup`, `RadioGroupItem`
- `Slider`, `SliderTrack`, `SliderRange`, `SliderThumb`

### Navigation Components
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `NavigationMenu` and all sub-components
- `Breadcrumb` and all sub-components
- `Menubar` and all sub-components

### Data Display Components
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- `Badge`
- `Progress`, `ProgressIndicator`
- `Calendar` and all sub-components

### Feedback Components
- `Alert`, `AlertDialog`
- `Toast`, `ToastViewport`
- `Tooltip`, `TooltipContent`
- `Skeleton`

### Overlay Components
- `DropdownMenu` and all sub-components
- `ContextMenu` and all sub-components
- `Command` and all sub-components

## Overriding Flat Styling

If you need border radius or shadows for specific components:

```tsx
// Add border radius back
<Card className="rounded-md">Content</Card>

// Add shadow back
<Card className="shadow-md">Content</Card>

// Add both back
<Card className="rounded-lg shadow-lg">Content</Card>
```

## Best Practices

### 1. **Consistency**
- Use flat styling consistently across your application
- Avoid mixing rounded and flat components unless intentional

### 2. **Visual Hierarchy**
- Use spacing, borders, and colors to create visual hierarchy
- Flat styling works well with subtle borders and background colors

### 3. **Accessibility**
- Ensure sufficient contrast without relying on shadows
- Use focus indicators that work with flat styling

### 4. **Performance**
- Flat styling reduces CSS complexity
- No border radius calculations improve rendering performance

## Migration from Rounded Components

If you have existing components with border radius:

1. **Remove explicit border radius classes**:
   ```tsx
   // Before
   <Card className="rounded-lg">Content</Card>
   
   // After (no change needed, automatically flat)
   <Card>Content</Card>
   ```

2. **Remove shadow classes if not needed**:
   ```tsx
   // Before
   <Card className="shadow-md">Content</Card>
   
   // After (automatically flat)
   <Card>Content</Card>
   ```

3. **Keep shadows only where necessary**:
   ```tsx
   // Keep shadow for elevation effect
   <Dialog className="shadow-xl">Content</Dialog>
   ```

## Troubleshooting

### Component Still Has Border Radius
1. Check if the component has explicit `rounded-*` classes
2. Remove any `border-radius` CSS properties
3. Use the `.no-radius` utility class

### Component Still Has Shadow
1. Check if the component has explicit `shadow-*` classes
2. Remove any `box-shadow` CSS properties
3. Use the `.no-shadow` utility class

### Global Styles Not Applied
1. Ensure `globals.css` is imported in your app
2. Check that Tailwind is properly configured
3. Clear browser cache and restart dev server

## Examples

### Flat Card Layout
```tsx
<Card className="flat">
  <CardHeader>
    <CardTitle>Flat Card</CardTitle>
  </CardHeader>
  <CardContent>
    <p>This card has no border radius or shadow.</p>
  </CardContent>
</Card>
```

### Flat Form
```tsx
<div className="space-y-4">
  <Input placeholder="Flat input" className="flat" />
  <Button className="flat">Flat Button</Button>
  <Select>
    <SelectTrigger className="flat">
      <SelectValue placeholder="Select option" />
    </SelectTrigger>
  </Select>
</div>
```

### Flat Dialog
```tsx
<Dialog>
  <DialogContent className="flat">
    <DialogHeader>
      <DialogTitle>Flat Dialog</DialogTitle>
    </DialogHeader>
    <p>This dialog has no border radius or shadow.</p>
  </DialogContent>
</Dialog>
``` 
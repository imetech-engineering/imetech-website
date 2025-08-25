# Component System Documentation

## Overview

The website now uses a modular component system where the header and footer are loaded dynamically from separate files. This allows you to make changes to the header or footer in one place and have them automatically applied to all pages.

## File Structure

```
components/
├── header.html     # Header template with placeholders
└── footer.html     # Footer template with placeholders

template.html       # Basic page template showing how to use components
script.js          # Enhanced with ComponentLoader class
```

## How It Works

1. **Component Templates**: The header and footer are stored as HTML templates in the `components/` folder with placeholder variables (e.g., `{BASE_URL}`, `{CONTACT_TEXT}`)

2. **Dynamic Loading**: JavaScript automatically loads and processes these templates, replacing placeholders with appropriate values based on:
   - Current page location (for relative paths)
   - Language (Dutch/English)
   - Page-specific content

3. **Automatic Initialization**: After components load, all navigation, mobile menu, and language switching functionality is automatically initialized.

## Using the Component System

### For New Pages

Use the `template.html` as a starting point:

```html
<!DOCTYPE html>
<html lang="nl">
<head>
  <!-- Your page head content -->
  <link rel="stylesheet" href="style.css?v=8" />
</head>
<body>
  <!-- Header will be loaded dynamically -->
  <div id="header-container"></div>

  <main>
    <!-- Your page content -->
  </main>

  <!-- Footer will be loaded dynamically -->
  <div id="footer-container"></div>

  <script src="script.js?v=8"></script>
</body>
</html>
```

### For Existing Pages

Replace the existing header and footer HTML with:

```html
<!-- Replace entire header section with: -->
<div id="header-container"></div>

<!-- Replace entire footer section with: -->
<div id="footer-container"></div>
```

## Making Changes

### To Update Header/Footer for All Pages

1. Edit `components/header.html` or `components/footer.html`
2. Use placeholder variables for dynamic content (see available variables below)
3. Changes will automatically apply to all pages

### Available Placeholder Variables

**Navigation & Contact:**
- `{BASE_URL}` - Relative path to site root
- `{CONTACT_TEXT}` - Contact button text
- `{NAV_HOME}`, `{NAV_ABOUT}`, etc. - Navigation labels
- `{NL_URL}`, `{EN_URL}` - Language switcher URLs

**Footer Content:**
- `{FOOTER_MISSION}` - Mission statement
- `{FOOTER_VALUE_1_TITLE}` - First value title
- `{FOOTER_CTA_TITLE}` - Call-to-action title
- And many more (see script.js for full list)

## Language Support

The system automatically detects page language based on URL path:
- Pages in `/en/` folder use English text
- All other pages use Dutch text

Language-specific content is automatically substituted from the text definitions in `script.js`.

## Technical Details

### ComponentLoader Class

- **Path Detection**: Automatically calculates relative paths based on current URL
- **Language Detection**: Determines language from URL structure
- **Template Processing**: Loads templates and replaces placeholders
- **Event Initialization**: Re-initializes all JavaScript functionality after loading

### File Paths

The system handles different directory depths automatically:
- Root pages: `""` (empty base URL)
- Subdirectory pages: `"../"` 
- Deep nested pages: `"../../"` etc.

## Benefits

1. **Single Source of Truth**: Update header/footer in one place
2. **Consistency**: All pages automatically have identical navigation
3. **Maintenance**: Much easier to make site-wide changes
4. **Multilingual**: Automatic language detection and content switching
5. **Flexibility**: Easy to add new pages using the template
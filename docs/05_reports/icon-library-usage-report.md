# Icon Library Usage Report

## Summary

The codebase currently uses **4 different icon libraries**, which creates inconsistency and increases bundle size. Here's the breakdown:

### 1. **lucide-react** (Most Used - 278 files)

- **Files using it**: 278 files
- **Status**: ⚠️ NOT in package.json but installed in node_modules
- **Most common icons**:
  - AlertTriangle (38 uses)
  - Clock (36 uses)
  - Loader2 (35 uses)
  - AlertCircle (35 uses)
  - Calendar (34 uses)
  - Plus (30 uses)
  - X (29 uses)
  - Trash2 (29 uses)
  - Edit (26 uses)
  - Filter (22 uses)

### 2. **@heroicons/react** (30 files)

- **Files using it**: 30 files
- **Status**: ✅ In package.json (v2.2.0)
- **Common icons**: XMarkIcon, PlusIcon, PencilIcon, TrashIcon, CheckIcon

### 3. **@mui/icons-material** (5 files)

- **Files using it**: 5 files
- **Status**: ✅ In package.json (v7.0.2)
- **Used in**: Leave management modules, dashboards

### 4. **@ant-design/icons** (6 files)

- **Files using it**: 6 files
- **Status**: ✅ In package.json (v6.0.0)
- **Common icons**: CalendarOutlined, SwapOutlined, InfoCircleOutlined

## Recommendation

**Standardize on lucide-react** for the following reasons:

1. **Already dominant**: Used in 278 files (90% of icon usage)
2. **Comprehensive icon set**: Has all commonly used icons
3. **Smaller bundle size**: Tree-shakeable and lightweight
4. **Consistent design**: Modern, clean icon style
5. **Active maintenance**: Regular updates and new icons

## Migration Plan

1. **Add lucide-react to package.json** (critical - it's missing!)
2. **Replace @heroicons/react** icons (30 files)
3. **Replace @mui/icons-material** icons (5 files)
4. **Replace @ant-design/icons** icons (6 files)
5. **Remove unused icon dependencies**

## Icon Mapping for Migration

### @heroicons/react → lucide-react

- XMarkIcon → X
- PlusIcon → Plus
- PencilIcon → Pencil
- TrashIcon → Trash2
- CheckIcon → Check
- ChevronDownIcon → ChevronDown
- ArrowsUpDownIcon → ArrowUpDown

### @mui/icons-material → lucide-react

- AddIcon → Plus
- DeleteIcon → Trash2
- EditIcon → Edit
- SaveIcon → Save
- InfoIcon → Info
- ExpandMoreIcon → ChevronDown

### @ant-design/icons → lucide-react

- CalendarOutlined → Calendar
- SwapOutlined → ArrowLeftRight
- InfoCircleOutlined → InfoIcon
- CheckCircleOutlined → CheckCircle
- CloseCircleOutlined → XCircle
- WarningOutlined → AlertTriangle

## Estimated Impact

- **Bundle size reduction**: ~50-100KB (removing 3 icon libraries)
- **Consistency improvement**: Single icon style across the app
- **Maintenance**: Easier to manage one library
- **Developer experience**: Single import source

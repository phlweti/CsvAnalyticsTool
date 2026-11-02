# CSV Analytics Tool — UI/UX Specification

**Document Version:** 1.0  
**Status:** Finalized UI/UX Direction  
**Product:** CSV Analytics Tool  
**Platform:** Web Application  
**Framework:** Angular  
**Hosting:** GitHub Pages  
**Design Direction:** Modern SaaS  
**Primary Experience:** Desktop-first, responsive  
**Architecture:** Local-first, backend-ready

---

# 1. Product Overview

## 1.1 Product Vision

CSV Analytics Tool is a browser-based data exploration and visualization application that allows users to upload CSV files, inspect their structure, analyze data, identify data-quality issues, create visualizations, and build dashboards.

The core product principle is:

> **Drop a CSV. Understand your data.**

The MVP operates entirely within the browser.

No account, backend, or cloud upload is required.

---

## 1.2 Product Positioning

CSV Analytics Tool sits between a basic CSV viewer and a full business-intelligence platform.

```text
CSV Viewer
    ↓
CSV Analytics Tool
    ↓
Spreadsheet
    ↓
BI Platform
```

The product should be significantly faster to start using than a traditional BI application.

The user should not need to:

- Create an account
- Create a project
- Configure a database
- Connect a data source
- Configure permissions
- Learn SQL

The primary workflow is:

```text
Upload CSV
    ↓
Explore
    ↓
Understand
    ↓
Analyze
    ↓
Visualize
    ↓
Build Dashboard
    ↓
Export
```

---

# 2. UX Principles

## 2.1 Local First

The application should communicate clearly that uploaded data remains in the user's browser.

Primary messaging:

> Your data stays in your browser.

Supporting messaging:

> No upload. No account. No server processing.

---

## 2.2 Immediate Value

Users should see useful information immediately after importing a dataset.

The application should automatically calculate:

- Row count
- Column count
- Missing values
- Duplicate rows
- Data types
- Basic statistics
- Potential data-quality issues
- Recommended visualizations
- Basic insights

---

## 2.3 Progressive Complexity

Do not expose advanced analytics before the user needs them.

Recommended progression:

```text
Overview
   ↓
Data Explorer
   ↓
Column Analysis
   ↓
Analytics
   ↓
Visualization
   ↓
Dashboard
```

Basic functionality should remain approachable while advanced capabilities can be progressively revealed.

---

## 2.4 Information Density Without Visual Clutter

The application is data-oriented, so information density is important.

However:

- Avoid excessive borders
- Avoid excessive colors
- Avoid unnecessary icons
- Avoid overly large cards
- Avoid decorative UI

Charts should provide most of the visual color.

---

## 2.5 Consistent Context

The currently loaded dataset should always remain visible.

Example:

```text
sales_data.csv
12,430 rows · 8 columns · 2.4 MB
```

This appears in the dataset header throughout the workspace.

---

# 3. Target Users

## 3.1 Developers

Use cases:

- Inspect API exports
- Explore database exports
- Validate generated CSV files
- Inspect test data
- Understand unfamiliar datasets
- Quickly visualize data

---

## 3.2 Data Analysts

Use cases:

- Exploratory data analysis
- Data profiling
- Data-quality checks
- Quick visualization
- Lightweight dashboard creation

---

## 3.3 Students and Researchers

Use cases:

- Coursework
- Research datasets
- Survey results
- Basic statistics
- Visualization

---

## 3.4 General Users

Users who have CSV files but don't want to install:

- Excel
- Python
- R
- Desktop analytics software

---

# 4. MVP Scope

## 4.1 Included

### Dataset

- CSV upload
- Drag & drop
- CSV parsing
- Automatic delimiter detection
- Encoding detection
- Header detection
- Automatic data-type detection
- Dataset metadata
- Local persistence

### Data Explorer

- Table view
- Search
- Sort
- Filter
- Column visibility
- Column resizing
- Pagination
- Column statistics

### Analytics

- Numeric statistics
- Distribution
- Aggregation
- Grouping
- Correlation
- Automatic insights

### Data Quality

- Missing values
- Duplicate rows
- Empty columns
- Mixed data types
- Invalid dates
- Invalid numeric values
- Potential anomalies

### Visualization

- Bar chart
- Line chart
- Area chart
- Pie / donut chart
- Scatter chart
- Histogram
- KPI

### Dashboard

- Add visualization
- Move visualization
- Resize visualization
- Delete visualization
- Save dashboard
- Dashboard preview

### Export

- Filtered CSV
- JSON
- Chart PNG
- Dashboard PNG

---

# 5. Out of Scope for MVP

The following should not be prioritized initially:

- User accounts
- Cloud storage
- Collaboration
- SQL editor
- Database connections
- Real-time data
- Scheduled imports
- Machine learning
- Advanced statistical modeling
- Enterprise permissions
- Multi-user workspaces
- Server-side processing
- AI-powered natural-language analytics

These are future roadmap capabilities.

---

# 6. Information Architecture

```text
CSV Analytics Tool
│
├── Home
│
├── Workspace
│   │
│   ├── Overview
│   ├── Data
│   ├── Analytics
│   ├── Visualize
│   ├── Dashboard
│   │
│   ├── Data Quality
│   └── Calculated Fields
│
├── Datasets
│
├── Saved Workspaces
│
└── Settings
```

---

# 7. Application Shell

## 7.1 Desktop Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ Global Top Bar                                               │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│               │                                             │
│   Sidebar     │              Main Content                    │
│               │                                             │
│               │                                             │
│               │                                             │
│               │                                             │
│               │                                             │
├───────────────┴─────────────────────────────────────────────┤
│ Optional status / contextual area                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 7.2 Sidebar

Recommended width:

```text
240px
```

Collapsed width:

```text
64px
```

Navigation groups:

### Primary

- Home
- Data
- Analytics
- Visualize
- Dashboard

### Tools

- Data Quality
- Calculated Fields

### Workspace

- Datasets
- Saved Workspaces

### Bottom

- Settings
- Help

---

# 8. Global Header

The global header contains:

```text
Logo
Global Search
Theme Toggle
User / Local Profile
```

Example:

```text
┌─────────────────────────────────────────────────────────────┐
│ CSV Analytics    [ Search data, columns, insights... ]  ☾ P │
└─────────────────────────────────────────────────────────────┘
```

---

## 8.1 Global Search

Search should eventually support:

- Column names
- Dataset names
- Saved charts
- Saved dashboards
- Insights

Example:

```text
Search data, columns, or insights...
```

Keyboard shortcut:

```text
⌘ K
```

or

```text
Ctrl K
```

---

# 9. Landing / Upload Screen

## 9.1 Purpose

Allow a user to start working with minimal friction.

---

## 9.2 Layout

```text
                    CSV Analytics

               Analyze your CSV data
                 without uploading it.

        ┌──────────────────────────────────────┐
        │                                      │
        │                 ↑                    │
        │                                      │
        │       Drop your CSV file here        │
        │                                      │
        │            or Browse Files           │
        │                                      │
        │       CSV files up to 100 MB         │
        │                                      │
        └──────────────────────────────────────┘

            🔒 Your data stays in your browser.

          No account · No upload · No server
```

---

## 9.3 Upload States

### Default

```text
Drop your CSV file here
or Browse Files
```

### Drag Over

```text
Drop your CSV to analyze
```

The drop zone should visually highlight.

### Processing

```text
Importing sales_data.csv

██████████████████░░░░

12,430 rows detected
8 columns detected

Detecting data types...
```

### Success

Automatically navigate to:

```text
Overview
```

### Error

Example:

```text
Unable to import this file.

The CSV structure could not be detected.

[ Try Again ]
```

---

# 10. Import Configuration

When automatic parsing requires confirmation, show:

```text
Import CSV

sales_data.csv
2.4 MB

Detected

Rows
12,430

Columns
8

Delimiter
Comma

Encoding
UTF-8

Options

☑ First row contains headers
☑ Trim whitespace
☑ Detect data types

[ Cancel ]          [ Import Dataset ]
```

---

# 11. Dataset Overview

## 11.1 Purpose

The Overview screen answers:

> What is in this dataset and what should I know about it?

---

## 11.2 Dataset Header

```text
CSV      sales_data.csv

         12,430 rows · 8 columns · 2.4 MB

[ Overview ] [ Data ] [ Analytics ] [ Visualize ] [ Dashboard ]

                                     [ Export ▼ ] [ ⚙ ]
```

---

# 12. KPI Cards

Four primary cards:

```text
┌──────────────┐
│ Total Rows   │
│              │
│ 12,430       │
│              │
│ Dataset size │
└──────────────┘
```

```text
┌──────────────┐
│ Columns      │
│              │
│ 8            │
│              │
│ 5 numeric    │
└──────────────┘
```

```text
┌──────────────┐
│ Missing      │
│              │
│ 243          │
│              │
│ 1.9% of data │
└──────────────┘
```

```text
┌──────────────┐
│ Duplicates   │
│              │
│ 37           │
│              │
│ 0.3% of rows │
└──────────────┘
```

---

# 13. Overview Grid

Recommended desktop layout:

```text
12-column grid
```

Suggested arrangement:

```text
8 columns                4 columns

┌───────────────────────┬───────────────────────┐
│ Revenue by Country    │ Quick Insights       │
│                       │                       │
│                       │                       │
├───────────────────────┤                       │
│ Revenue Trend         │                       │
│                       │                       │
├───────────────────────┼───────────────────────┤
│ Top Products          │ Data Quality          │
│                       │                       │
└───────────────────────┴───────────────────────┘

┌────────────────────────────────────────────────┐
│ Recent Data                                    │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Quick Actions                                  │
└────────────────────────────────────────────────┘
```

---

# 14. Quick Insights

## Purpose

Surface useful observations automatically.

Example:

```text
✨ Quick Insights

↗ Malaysia generated the highest revenue
  42% of total

📈 Revenue increased by 18%
  between January and March

👥 12% of customers have never placed
  an order

⚠ 3 columns contain missing values

🏷 Electronics is the top product category
  28% of total sales
```

---

## 14.1 Insight Types

### Positive

```text
Revenue increased 18%.
```

### Warning

```text
3 columns contain missing values.
```

### Pattern

```text
Malaysia accounts for 42% of revenue.
```

### Anomaly

```text
3 unusually large revenue values detected.
```

---

# 15. Data Quality Card

Display:

```text
Data Quality

        87
       Good

Missing Values       243
Duplicate Rows        37
Mixed Data Types        0
Other Issues            3

View Details →
```

The score should be treated as a UX summary rather than a scientifically authoritative quality measurement.

---

# 16. Recent Data

The Overview page displays only a preview.

Controls:

```text
[ Search ] [ Filter ] [ Sort ]
```

Table:

```text
┌───┬────────────┬──────────────┬──────────┬─────────┬──────────┐
│ # │ Date       │ Customer     │ Country  │ Revenue │ Status   │
├───┼────────────┼──────────────┼──────────┼─────────┼──────────┤
│ 1 │ 2026-05-12 │ John Tan     │ Malaysia │ $2,480  │ Complete │
│ 2 │ 2026-05-10 │ Sarah Lim    │ Singapore│ $1,320  │ Complete │
│ 3 │ 2026-05-08 │ Ahmad Rahman │ Malaysia │ $980    │ Pending  │
└───┴────────────┴──────────────┴──────────┴─────────┴──────────┘
```

---

# 17. Quick Actions

```text
Quick Actions

[ + Create Chart ]

[ ▦ Create Dashboard ]

[ ƒx Add Calculated Field ]

[ ↓ Export Data ]
```

The primary action should use the primary brand button style.

---

# 18. Data Explorer

## 18.1 Purpose

Provide a spreadsheet-like interface for inspecting the raw dataset.

---

## 18.2 Header

```text
Data

sales_data.csv
12,430 rows · 8 columns

[ Search ] [ Filter ] [ Sort ] [ Columns ]
```

---

## 18.3 Data Table

Requirements:

- Virtualized rendering
- Sticky header
- Horizontal scrolling
- Column resizing
- Column visibility
- Row selection
- Pagination
- Sort indicators

---

## 18.4 Table Header

Example:

```text
┌────┬──────────────┬──────────┬──────────┬─────────┬──────────┐
│ □  │ Customer     │ Country  │ Revenue  │ Orders  │ Date     │
├────┼──────────────┼──────────┼──────────┼─────────┼──────────┤
```

Clicking a header opens sorting options.

---

# 19. Column Profile

Clicking a column should open a contextual panel.

Example:

```text
Revenue

Type
Number

Values
12,418

Missing
12

Unique
8,941

────────────────────

Minimum
$12

Maximum
$48,920

Average
$1,842

Median
$1,205

────────────────────

Distribution

▂▃▅▇████▆▃▂

[ Analyze Column ]
```

---

# 20. Search

Global dataset search should search across visible columns.

Example:

```text
Search rows...

"Malaysia"
```

Results should update immediately.

Search should support:

- Text
- Numeric values
- Dates

---

# 21. Filter Builder

## Basic Filter

```text
Filters

Country
[ is ▼ ]
[ Malaysia ]

Revenue
[ greater than ▼ ]
[ 1000 ]

Created
[ after ▼ ]
[ 2026-01-01 ]

[ Apply Filters ]
```

---

## Multiple Conditions

```text
Country = Malaysia

AND

Revenue > 1000

AND

Status = Active
```

Future advanced filter:

```text
(Country = Malaysia OR Country = Singapore)
AND Revenue > 1000
```

---

# 22. Filter UX

Active filters should appear as chips:

```text
Country: Malaysia ×
Revenue > 1000 ×
Status: Active ×

[ Clear All ]
```

This provides clear visibility into why the displayed dataset is smaller than the original.

---

# 23. Column Visibility

Clicking:

```text
[ Columns ]
```

opens:

```text
Visible Columns

☑ Date
☑ Customer
☑ Country
☑ Revenue
☑ Orders
☐ Customer ID
☐ Internal Status

[ Reset ]
```

---

# 24. Analytics Screen

## 24.1 Purpose

Provide deeper statistical exploration.

---

## 24.2 Layout

```text
Analytics

Dataset Summary
────────────────────────────────

Revenue        Orders        Discount
$1,842 avg     4.2 avg       8.4% avg


Column Statistics
────────────────────────────────

Revenue
Min       $12
Max       $48,920
Average   $1,842
Median    $1,205


Distribution
────────────────────────────────

Revenue Distribution

        ▂▃▅▇████▆▃▂


Correlation
────────────────────────────────

          Revenue Orders Discount

Revenue     1.00    0.72   -0.14
Orders      0.72    1.00   -0.08
Discount   -0.14   -0.08    1.00
```

---

# 25. Analytics Features

## Numeric

Calculate:

- Count
- Missing
- Unique
- Min
- Max
- Sum
- Mean
- Median
- Standard deviation
- Percentiles

---

## Text

Calculate:

- Count
- Missing
- Unique
- Most common values
- Minimum length
- Maximum length

---

## Date

Calculate:

- Earliest
- Latest
- Missing
- Distribution over time

---

## Boolean

Calculate:

- True
- False
- Missing

---

# 26. Automatic Insights Engine

MVP insights should be rule-based.

Example rules:

```text
IF category_percentage > threshold
THEN generate dominance insight

IF time_series_growth > threshold
THEN generate growth insight

IF missing_percentage > threshold
THEN generate quality warning

IF duplicate_percentage > threshold
THEN generate duplicate warning

IF numeric_outlier_count > threshold
THEN generate anomaly insight
```

This keeps the feature:

- deterministic
- private
- fast
- inexpensive

---

# 27. Visualization

## 27.1 Supported Chart Types

MVP:

- Bar
- Line
- Area
- Pie
- Donut
- Scatter
- Histogram
- KPI

---

# 28. Visualization Builder

Use a two-panel layout.

```text
┌──────────────────────────┬─────────────────────────────────────┐
│ Configuration            │                                     │
│                          │                                     │
│ Chart Type               │                                     │
│ [ Bar Chart ▼ ]          │                                     │
│                          │                                     │
│ X Axis                   │           Chart Preview             │
│ [ Country ▼ ]            │                                     │
│                          │                                     │
│ Y Axis                   │                                     │
│ [ Revenue ▼ ]            │                                     │
│                          │                                     │
│ Aggregation              │                                     │
│ [ Sum ▼ ]                │                                     │
│                          │                                     │
│ Group By                 │                                     │
│ [ None ▼ ]               │                                     │
│                          │                                     │
│ [ Save Visualization ]   │                                     │
└──────────────────────────┴─────────────────────────────────────┘
```

---

# 29. Chart Configuration

Common controls:

### Chart Type

```text
Bar
Line
Area
Pie
Donut
Scatter
Histogram
KPI
```

### Dimension

Select a categorical/date column.

### Measure

Select numeric column.

### Aggregation

```text
Sum
Average
Count
Minimum
Maximum
Median
```

### Sorting

```text
Ascending
Descending
Original
```

### Limit

```text
Top 5
Top 10
Top 20
All
```

---

# 30. Recommended Visualizations

Automatically suggest charts based on data types.

Examples:

```text
Date + Number
→ Line Chart

Category + Number
→ Bar Chart

Category + Number
→ Donut Chart

Number + Number
→ Scatter Plot

Single Number
→ KPI

Number
→ Histogram
```

---

# 31. Dashboard Builder

## 31.1 Purpose

Allow users to combine visualizations into a reusable analytical dashboard.

---

## 31.2 Layout

Grid-based canvas:

```text
┌──────────────────────────────────────────────────────────┐
│ Dashboard                       Preview   Export   ⋮     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│ │ Revenue     │ │ Orders      │ │ Customers   │         │
│ │ $2.4M       │ │ 12,430      │ │ 8,921       │         │
│ └─────────────┘ └─────────────┘ └─────────────┘         │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Revenue Trend                                      │   │
│ │                                                    │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌───────────────────────┐ ┌──────────────────────────┐   │
│ │ Revenue by Country    │ │ Order Status             │   │
│ │                       │ │                          │   │
│ └───────────────────────┘ └──────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

# 32. Dashboard Interactions

Each widget supports:

```text
⋮
├── Configure
├── Duplicate
├── Rename
└── Delete
```

Widgets can be:

- dragged
- resized
- rearranged

---

# 33. Dashboard Edit Mode

Show a subtle grid while editing.

```text
┌───────┬───────┬───────┬───────┐
│       │       │       │       │
│       │       │       │       │
├───────┼───────┼───────┼───────┤
│       │       │       │       │
│       │       │       │       │
└───────┴───────┴───────┴───────┘
```

Hide the grid in presentation mode.

---

# 34. Dashboard Presentation Mode

Presentation mode should remove editing controls.

```text
Dashboard

Revenue Performance
────────────────────────────────────

[ KPI ] [ KPI ] [ KPI ]

[ Large Revenue Chart ]

[ Country Chart ] [ Category Chart ]
```

Use a clean, presentation-friendly layout.

---

# 35. Data Quality Screen

## Overview

```text
Data Quality

Overall Score

87 / 100
Good

────────────────────────────────

Issues

Missing Values
243

Duplicate Rows
37

Mixed Data Types
0

Invalid Dates
3

Potential Outliers
12
```

---

# 36. Quality Issue Details

Clicking an issue should reveal:

```text
Missing Values

243 missing values found.

Affected Columns

Customer Email       102
Phone Number           74
Discount               67

[ View Rows ]
```

The user can jump directly to the affected rows in Data Explorer.

---

# 37. Calculated Fields

## Create Calculated Field

```text
Create Calculated Field

Name

[ Profit Margin ]

Formula

[ profit / revenue * 100 ]

Detected Type

Number

Preview

32.4%
18.7%
41.2%

[ Cancel ] [ Create Field ]
```

---

## Common Formula Examples

```text
price * quantity

revenue - cost

profit / revenue * 100

first_name + " " + last_name
```

---

# 38. Dataset Library

The Dataset Library shows locally stored datasets.

```text
Datasets

[ Upload CSV ]

────────────────────────────────────────────

sales_data.csv
12,430 rows · 8 columns
Updated 2 hours ago

[ Open ] [ ⋮ ]

customers.csv
8,921 rows · 12 columns
Updated yesterday

[ Open ] [ ⋮ ]

orders.csv
42,300 rows · 14 columns
Updated 3 days ago

[ Open ] [ ⋮ ]
```

---

# 39. Saved Workspaces

```text
Saved Workspaces

Sales Analysis
sales_data.csv
5 charts · 1 dashboard
Updated today

Customer Analysis
customers.csv
3 charts · 1 dashboard
Updated yesterday
```

---

# 40. Settings

Settings should remain lightweight.

Sections:

### Appearance

- Light
- Dark
- System

### Data

- Default rows per page
- Default date format
- Number formatting

### Privacy

```text
Local processing
Enabled
```

### Storage

```text
Local storage used
12.4 MB

[ Clear Local Data ]
```

A destructive action should require confirmation.

---

# 41. Responsive Design

## Desktop

Minimum recommended width:

```text
1200px
```

Full layout:

```text
Sidebar
+
Main Content
+
Optional Insight Rail
```

---

## Tablet

At approximately:

```text
768px – 1199px
```

Behavior:

- Collapse sidebar
- Reduce dashboard columns
- Stack insight rail below main content
- Keep data table horizontally scrollable

---

## Mobile

Below approximately:

```text
768px
```

Behavior:

- Sidebar becomes drawer
- KPI cards become 2-column
- Charts become full-width
- Dashboard widgets become single-column
- Data table remains horizontally scrollable
- Complex chart configuration becomes a bottom sheet/modal

---

# 42. Accessibility

Target:

```text
WCAG 2.1 AA
```

Requirements:

- Keyboard navigation
- Visible focus states
- Semantic HTML
- Proper labels
- Sufficient color contrast
- Screen-reader-friendly controls
- Don't rely solely on color
- Accessible chart descriptions
- Accessible table headers
- Keyboard-accessible drag/drop alternatives

---

# 43. Loading States

Avoid blank screens.

Use skeletons:

```text
┌───────────────────────┐
│ ███████████           │
│                       │
│ ████████              │
│ ███████████████       │
└───────────────────────┘
```

For data processing:

```text
Analyzing dataset...

Reading rows
████████████░░░

Detecting columns

Calculating statistics
```

---

# 44. Empty States

Every major feature should have an intentional empty state.

Example:

```text
No visualizations yet

Create a chart to start exploring
your dataset visually.

[ Create Chart ]
```

Dashboard:

```text
Your dashboard is empty

Add charts, KPIs, or insights
to build your dashboard.

[ Add Visualization ]
```

---

# 45. Error States

Errors should explain:

1. What happened
2. Why it happened
3. What the user can do

Example:

```text
Unable to read CSV

The file appears to contain inconsistent
columns across several rows.

[ Review Import ]   [ Try Another File ]
```

Avoid technical errors such as:

```text
ParserError: Unexpected token at line 3921
```

unless the user opens technical details.

---

# 46. Toast Notifications

Use toast messages for lightweight feedback.

Examples:

```text
✓ Workspace saved

✓ Chart added to dashboard

✓ CSV exported

✓ Calculated field created

⚠ 243 missing values detected

✕ Unable to export dataset
```

Toast messages should not be used for critical errors requiring user action.

---

# 47. Modal Design

Use modals for:

- Import configuration
- Delete confirmation
- Calculated fields
- Export configuration
- Rename dashboard

Avoid using modals for:

- Data exploration
- Filtering
- Normal chart configuration

Prefer side panels or inline controls for those.

---

# 48. Design Tokens

## Colors

```css
--primary: #4f46e5;
--primary-hover: #4338ca;
--primary-soft: #eef2ff;

--background: #f8fafc;
--surface: #ffffff;
--surface-secondary: #f1f5f9;

--text-primary: #172033;
--text-secondary: #64748b;
--text-muted: #94a3b8;

--border: #e2e8f0;

--success: #16a34a;
--success-soft: #f0fdf4;

--warning: #d97706;
--warning-soft: #fffbeb;

--danger: #dc2626;
--danger-soft: #fef2f2;
```

---

# 49. Typography

Primary font:

```text
Inter
```

Recommended scale:

```text
Page Title       24–28px / 700
Section Title    16–18px / 600
Card Title       14–16px / 600
Body             14px / 400
Table            13px / 400
Metadata         12px / 400
```

---

# 50. Spacing System

Use a 4px base system.

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
```

Primary page padding:

```text
24px – 32px
```

Card padding:

```text
16px – 20px
```

---

# 51. Border Radius

```text
Small controls       6–8px
Cards                10–12px
Large containers     14–16px
Upload zone          16–20px
```

The design should feel modern but not excessively rounded.

---

# 52. Shadows

Use shadows sparingly.

Default cards should primarily use:

```text
1px border
```

rather than strong shadows.

Use shadows for:

- Dropdowns
- Modals
- Floating panels
- Dragged dashboard widgets

---

# 53. Iconography

Use a consistent line-icon library.

Recommended style:

- 18–20px navigation icons
- 16px control icons
- 20–24px KPI icons

Icons should support labels rather than replace them.

---

# 54. Chart Design

Charts should be:

- Minimal
- Highly readable
- Responsive
- Consistent
- Accessible

Avoid:

- 3D charts
- unnecessary gradients
- excessive grid lines
- decorative effects
- overly saturated colors

---

# 55. Chart Color Strategy

Use a semantic categorical palette.

Example conceptual sequence:

```text
Primary
Secondary
Tertiary
Accent
Neutral
```

Semantic colors:

```text
Success → green
Warning → amber
Error → red
```

Do not use red/green as the only way to distinguish chart values.

---

# 56. Data Table UX Rules

Tables should prioritize readability.

Rules:

- Right-align numbers
- Left-align text
- Center compact status indicators
- Use monospace optionally for IDs
- Keep header sticky
- Keep row height compact
- Highlight hovered rows subtly
- Don't use zebra striping excessively

---

# 57. Status Badges

Example:

```text
Completed
```

```text
Pending
```

```text
Cancelled
```

Use subtle background fills.

Avoid highly saturated badges.

---

# 58. Interaction Principles

## Hover

Provide subtle visual feedback.

## Click

Provide clear active state.

## Loading

Never leave the user wondering whether something is happening.

## Destructive Actions

Require confirmation.

## Long Operations

Display progress.

## Undo

Where practical, provide:

```text
Chart deleted.
[ Undo ]
```

---

# 59. Keyboard Shortcuts

Recommended:

```text
⌘ / Ctrl + K
Global Search

⌘ / Ctrl + O
Open Dataset

⌘ / Ctrl + S
Save Workspace

Esc
Close Modal / Panel

?
Show Keyboard Shortcuts
```

---

# 60. UX for Large CSV Files

The application should communicate processing state.

For example:

```text
Large dataset detected

This file contains 1.2 million rows.

Processing may take a little longer.

[ Continue ]
```

Technical implementation should use:

- Web Workers
- Virtualized tables
- Incremental parsing
- IndexedDB
- Lazy calculations

---

# 61. Privacy UX

The privacy message should appear in multiple strategic locations.

### Upload

```text
🔒 Your data stays in your browser.
```

### Dataset Workspace

```text
🔒 Local Processing
This dataset is being processed locally.
```

### Settings

```text
Privacy

Local processing
Enabled

Your CSV files are not uploaded
to a server in the current version.
```

---

# 62. First-Time User Experience

After upload, show a lightweight onboarding hint.

Example:

```text
Your dataset is ready.

Start by exploring your data,
or jump directly into analytics.

[ Explore Data ]    [ View Analytics ]
```

Do not create a multi-step onboarding wizard.

The product should be self-explanatory.

---

# 63. Recommended Primary CTA Hierarchy

### Primary

```text
Upload CSV
Create Chart
```

### Secondary

```text
Explore Data
Create Dashboard
```

### Tertiary

```text
View Details
Configure
Export
```

---

# 64. Angular Component Mapping

Recommended application structure:

```text
src/app/

core/
├── models/
├── services/
├── repositories/
├── utilities/
└── workers/

layout/
├── app-shell/
├── sidebar/
└── topbar/

shared/
├── components/
│   ├── stat-card/
│   ├── insight-card/
│   ├── quality-card/
│   ├── upload-zone/
│   ├── data-table/
│   ├── chart-card/
│   ├── empty-state/
│   ├── modal/
│   └── toast/
└── pipes/

features/
├── home/
├── dataset/
├── explorer/
├── analytics/
├── visualization/
├── dashboard/
├── quality/
├── calculated-fields/
├── datasets/
├── workspaces/
└── settings/
```

---

# 65. Core Domain Models

## Dataset

```typescript
interface Dataset {
  id: string;
  name: string;
  fileName: string;

  rowCount: number;
  columnCount: number;

  columns: DatasetColumn[];

  createdAt: string;
  updatedAt: string;
}
```

---

## Dataset Column

```typescript
interface DatasetColumn {
  id: string;
  name: string;

  dataType: DataType;

  nullable: boolean;

  uniqueCount: number;
  missingCount: number;
}
```

---

## Data Type

```typescript
type DataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'unknown';
```

---

# 66. Workspace Model

```typescript
interface AnalyticsWorkspace {
  id: string;
  name: string;

  datasetId: string;

  filters: Filter[];

  calculatedFields: CalculatedField[];

  visualizations: Visualization[];

  dashboards: Dashboard[];

  createdAt: string;
  updatedAt: string;
}
```

---

# 67. Visualization Model

```typescript
interface Visualization {
  id: string;

  type: ChartType;

  title: string;

  dimensions: VisualizationDimension[];

  measures: VisualizationMeasure[];

  configuration: ChartConfiguration;

  createdAt: string;
  updatedAt: string;
}
```

---

# 68. Repository Architecture

UI components should never directly depend on IndexedDB.

Recommended:

```text
Angular Component
       ↓
Feature Service
       ↓
Repository Interface
       ↓
Local Repository
       ↓
IndexedDB
```

Future backend:

```text
Angular Component
       ↓
Feature Service
       ↓
Repository Interface
       ↓
API Repository
       ↓
Backend API
```

This makes the application backend-ready from the beginning.

---

# 69. Local Storage Architecture

## IndexedDB

Store:

- Dataset metadata
- Parsed dataset data
- Workspaces
- Visualizations
- Dashboards
- Calculated fields

## LocalStorage

Store only lightweight preferences:

- Theme
- Sidebar state
- Table preferences
- Recent workspace ID
- UI preferences

---

# 70. Performance Architecture

Large CSV processing should be isolated from the UI thread.

Recommended:

```text
CSV File
   ↓
Parser Worker
   ↓
Typed Dataset
   ↓
Analytics Worker
   ↓
Statistics / Insights
   ↓
Angular UI
```

Use virtualized rendering for the Data Explorer.

Avoid recalculating statistics unnecessarily.

Cache computed results when possible.

---

# 71. MVP Screen List

The MVP should contain these primary screens:

```text
01  Home / Upload
02  Dataset Overview
03  Data Explorer
04  Column Profile
05  Data Quality
06  Analytics
07  Visualization Builder
08  Dashboard Builder
09  Dataset Library
10  Saved Workspaces
11  Settings
```

---

# 72. Screen Priority

## P0 — Must Have

```text
Upload
Overview
Data Explorer
Search
Sort
Filter
Column Profile
Data Quality
Basic Analytics
Chart Builder
Local Persistence
```

## P1 — Important

```text
Dashboard Builder
Calculated Fields
Automatic Insights
Export
Dataset Library
Saved Workspaces
```

## P2 — Future

```text
Excel
JSON
SQL
Cloud Storage
Authentication
AI Analyst
Collaboration
```

---

# 73. Complete Primary User Journey

```text
                    LANDING
                       │
                       ▼
                  Upload CSV
                       │
                       ▼
                Import Configuration
                       │
                       ▼
                  OVERVIEW
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
        DATA       ANALYTICS     QUALITY
          │            │            │
          │            │            │
          └────────────┼────────────┘
                       ▼
                  VISUALIZE
                       │
                       ▼
              Create Visualization
                       │
                       ▼
                 DASHBOARD
                       │
                       ▼
                    EXPORT
```

---

# 74. UX Success Criteria

A successful user should be able to:

### Within 10 seconds

Understand what the application does.

### Within 30 seconds

Upload a CSV.

### Within 60 seconds

Understand:

- number of rows
- number of columns
- missing data
- duplicate data
- available data types

### Within 2 minutes

Create a meaningful chart.

### Within 5 minutes

Create a basic dashboard.

The application should feel fast and intuitive without requiring documentation.

---

# 75. Product Personality

The UI should communicate:

```text
Fast
Private
Smart
Professional
Approachable
Data-focused
```

Avoid:

```text
Corporate
Over-engineered
Developer-only
Spreadsheet-like
Overly colorful
AI gimmicky
```

---

# 76. Final Visual Direction

The primary visual direction is:

> **Modern SaaS + Data Workspace**

Visual characteristics:

- Light neutral background
- White content surfaces
- Indigo primary accent
- Subtle colored states
- Thin borders
- Moderate corner radius
- Compact data tables
- Clean charts
- Strong typography hierarchy
- Generous whitespace around major sections
- High information density inside analytical components

The UI should feel like a product that a developer or analyst could comfortably keep open for several hours.

---

# 77. Future Product Evolution

The initial architecture should make the following evolution possible:

```text
                    CSV Analytics Tool
                           │
            ┌──────────────┴──────────────┐
            │                             │
        Local Mode                    Cloud Mode
            │                             │
        IndexedDB                     Backend API
            │                             │
            └──────────────┬──────────────┘
                           │
                    Analytics Engine
                           │
             ┌─────────────┼─────────────┐
             │             │             │
         Charts       Dashboards       AI
             │             │             │
             └─────────────┴─────────────┘
                           │
                    Data Platform
```

Potential future capabilities:

- Cloud datasets
- User accounts
- Team workspaces
- Shared dashboards
- Public dashboards
- Database connections
- Scheduled imports
- API integrations
- AI data analyst
- Advanced transformations
- SQL querying

---

# 78. Final UX Principle

The entire application should revolve around one simple mental model:

```text
┌───────────────────────────────────────────────┐
│                                               │
│              YOUR CSV                        │
│                  │                            │
│                  ▼                            │
│              EXPLORE                          │
│                  │                            │
│                  ▼                            │
│              ANALYZE                          │
│                  │                            │
│                  ▼                            │
│             VISUALIZE                         │
│                  │                            │
│                  ▼                            │
│              DASHBOARD                        │
│                  │                            │
│                  ▼                            │
│               EXPORT                          │
│                                               │
└───────────────────────────────────────────────┘
```

**The product should never make the user wonder what to do next.**

Every major screen should have one obvious next action, while still allowing experienced users to jump directly to the part of the workflow they need.
# CSV Analytics Tool — Application Requirements Specification

**Document Version:** 1.0  
**Status:** Draft for Development  
**Product:** CSV Analytics Tool  
**Application Type:** Browser-based Web Application  
**Framework:** Angular  
**Hosting:** GitHub Pages  
**Architecture:** Frontend-only, local-first, backend-ready  
**UI Direction:** Modern SaaS  
**Primary Data Format:** CSV  

---

# 1. Document Overview

## 1.1 Purpose

This document defines the functional and non-functional requirements for the CSV Analytics Tool.

It serves as the primary reference for:

- Application development
- System architecture
- Feature implementation
- Data modeling
- UI/UX implementation
- Testing and validation
- MVP planning
- Future backend integration

## 1.2 Product Vision

CSV Analytics Tool is a privacy-first, browser-based analytics application that allows users to import CSV files, explore datasets, identify data-quality issues, perform basic statistical analysis, create visualizations, and build dashboards.

The core product principle is:

> Drop a CSV. Understand your data.

The MVP should operate entirely within the user's browser without requiring an account, backend, or cloud upload.

## 1.3 Product Objectives

The application must:

1. Provide a simple and intuitive CSV import experience.
2. Automatically analyze imported datasets.
3. Allow users to explore, search, sort, and filter data.
4. Identify common data-quality issues.
5. Provide statistical summaries and basic analytics.
6. Generate useful data insights.
7. Allow users to create configurable visualizations.
8. Allow users to build and save dashboards.
9. Support local persistence of datasets and workspaces.
10. Export datasets, charts, and analytical results.
11. Provide a foundation for future backend integration.

---

# 2. Product Scope

## 2.1 MVP Scope

The MVP includes the following modules:

| Module | Description |
|---|---|
| Home / Upload | Import CSV files and access recent datasets |
| Dataset Management | Manage locally stored datasets |
| Dataset Overview | Display dataset summary and key metrics |
| Data Explorer | Explore, search, sort, and filter records |
| Column Analysis | Inspect individual column statistics |
| Data Quality | Detect common data-quality issues |
| Analytics | Perform basic statistical analysis |
| Insights | Generate rule-based analytical observations |
| Visualization Builder | Create configurable charts |
| Dashboard Builder | Arrange charts and KPI widgets |
| Calculated Fields | Create derived columns using formulas |
| Workspace Management | Save and restore analytical work |
| Export | Export data and visualizations |
| Settings | Configure application preferences |

## 2.2 Out of Scope for MVP

The following features are excluded from the initial release:

- User registration and authentication
- Cloud dataset storage
- Multi-user collaboration
- Real-time data synchronization
- Database connections
- SQL query editor
- Scheduled data imports
- Machine learning
- AI-powered natural-language analytics
- Advanced ETL pipelines
- Enterprise permissions
- Server-side analytics processing

These features may be considered in future versions.

---

# 3. Technology Requirements

## 3.1 Technology Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Angular |
| Language | TypeScript |
| Styling | CSS / SCSS |
| UI Architecture | Component-based |
| State Management | Angular Signals and feature services |
| Routing | Angular Router |
| CSV Parsing | Dedicated CSV parsing library |
| Data Visualization | Charting library |
| Table Rendering | Virtualized data table |
| Local Database | IndexedDB |
| Lightweight Preferences | LocalStorage |
| Background Processing | Web Workers |
| Hosting | GitHub Pages |
| Version Control | Git / GitHub |

Specific library selections should be finalized during technical design.

## 3.2 Hosting Requirements

The application must:

- Build as a static Angular application.
- Deploy to GitHub Pages.
- Support client-side routing.
- Work without a backend server.
- Support browser refresh on application routes.
- Avoid dependencies on server-side rendering.
- Provide a deployment process suitable for GitHub Actions.

## 3.3 Browser Compatibility

The application should support current versions of:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari

The application should use feature detection where browser capabilities differ.

---

# 4. System Architecture

## 4.1 High-Level Architecture

```text
┌───────────────────────────────────────────┐
│              Angular UI                  │
│                                           │
│ Home / Explorer / Analytics / Dashboard   │
└─────────────────────┬─────────────────────┘
                      │
┌─────────────────────▼─────────────────────┐
│          Application Services             │
│                                           │
│ Dataset / Analytics / Workspace / Export  │
└─────────────────────┬─────────────────────┘
                      │
┌─────────────────────▼─────────────────────┐
│             Domain Layer                  │
│                                           │
│ Dataset Models / Filters / Charts         │
│ Statistics / Calculated Fields            │
└─────────────────────┬─────────────────────┘
                      │
┌─────────────────────▼─────────────────────┐
│          Repository Interfaces            │
└─────────────────────┬─────────────────────┘
                      │
┌─────────────────────▼─────────────────────┐
│          Local Infrastructure             │
│                                           │
│ IndexedDB / LocalStorage / Web Workers    │
└───────────────────────────────────────────┘
```

## 4.2 Architectural Principles

The application must follow these principles:

1. Separate UI components from business logic.
2. Separate domain models from storage implementation.
3. Avoid direct IndexedDB access from UI components.
4. Use typed domain models.
5. Keep analytics logic independent from Angular components.
6. Keep CSV parsing independent from the visualization layer.
7. Support future replacement of local repositories with API repositories.
8. Keep heavy processing outside the main UI thread where practical.

## 4.3 Repository Pattern

The application must use repository interfaces for data persistence.

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

Future backend architecture:

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

---

# 5. Application Navigation

## 5.1 Primary Navigation

The application must provide the following navigation items:

| Navigation | Route | Purpose |
|---|---|---|
| Home | `/` | Upload CSV and access recent datasets |
| Overview | `/workspace/:id/overview` | Dataset summary |
| Data | `/workspace/:id/data` | Data Explorer |
| Analytics | `/workspace/:id/analytics` | Statistical analysis |
| Visualize | `/workspace/:id/visualize` | Visualization Builder |
| Dashboard | `/workspace/:id/dashboard` | Dashboard Builder |

## 5.2 Secondary Navigation

| Navigation | Route | Purpose |
|---|---|---|
| Data Quality | `/workspace/:id/quality` | Data-quality analysis |
| Calculated Fields | `/workspace/:id/calculated-fields` | Manage derived columns |
| Datasets | `/datasets` | Manage imported datasets |
| Saved Workspaces | `/workspaces` | Manage saved analytical work |
| Settings | `/settings` | Application preferences |

## 5.3 Navigation Requirements

- The application must display the active navigation item.
- Users must be able to navigate between workspace sections without reimporting the dataset.
- The currently active dataset must remain identifiable.
- Refreshing a workspace route must restore the correct workspace when locally available.
- Invalid or unavailable workspace routes must display an appropriate error or empty state.

---

# 6. Dataset Import Requirements

## 6.1 CSV Upload

**FR-IMP-001:** The application must allow users to upload CSV files using a file picker.

**FR-IMP-002:** The application must support drag-and-drop CSV upload.

**FR-IMP-003:** The application must validate the selected file before processing.

**FR-IMP-004:** The application must display the selected filename and file size.

**FR-IMP-005:** The application must provide an import progress indicator for processing operations.

**FR-IMP-006:** The application must allow users to cancel an import operation where technically possible.

**FR-IMP-007:** The application must display a meaningful error message when a file cannot be imported.

## 6.2 CSV Parsing

The application must support:

- Comma-delimited CSV
- Configurable delimiters
- Header detection
- UTF-8 encoding
- Quoted fields
- Escaped quotation marks
- Newlines inside quoted fields
- Empty fields
- Missing values
- Different row lengths with appropriate validation

The parser should automatically detect the delimiter where possible.

## 6.3 Import Configuration

Users must be able to configure:

| Setting | Default |
|---|---|
| Delimiter | Auto-detect |
| Encoding | UTF-8 |
| First row contains headers | Enabled |
| Trim whitespace | Enabled |
| Detect data types | Enabled |

## 6.4 Import Validation

The application must detect:

- Empty files
- Invalid file formats
- Missing headers when headers are required
- Inconsistent row structures
- Unsupported encoding
- Parsing failures
- Files exceeding configured limits

The application must not silently discard invalid records.

## 6.5 Import Completion

After a successful import, the application must:

1. Generate a dataset ID.
2. Create dataset metadata.
3. Detect column data types.
4. Calculate initial statistics.
5. Store the dataset locally when persistence is enabled.
6. Create or associate a workspace.
7. Navigate to the Dataset Overview.

---

# 7. Dataset Management Requirements

## 7.1 Dataset Library

**FR-DAT-001:** The application must display imported datasets.

**FR-DAT-002:** Each dataset must display its name, row count, column count, file size, and last updated time where available.

**FR-DAT-003:** Users must be able to open a dataset.

**FR-DAT-004:** Users must be able to rename a dataset.

**FR-DAT-005:** Users must be able to delete a dataset.

**FR-DAT-006:** The application must confirm destructive dataset deletion.

**FR-DAT-007:** The application must support multiple locally stored datasets.

## 7.2 Dataset Metadata

Each dataset must maintain:

- Unique ID
- Display name
- Original filename
- Row count
- Column count
- Column definitions
- Import configuration
- Creation timestamp
- Last updated timestamp
- Storage reference
- Dataset processing status

---

# 8. Dataset Overview Requirements

## 8.1 Overview Metrics

The Overview screen must display:

- Total rows
- Total columns
- Missing values
- Duplicate rows
- Numeric columns
- Text columns
- Date columns
- Boolean columns

## 8.2 Visualization Preview

The Overview screen should display recommended visualizations based on available data types.

Examples:

- Revenue by Country
- Revenue Trend
- Top Products
- Category Distribution

## 8.3 Quick Insights

The application should generate rule-based insights, including:

- Highest or lowest category values
- Largest category contribution
- Numeric trends
- Significant missing values
- Potential outliers
- Duplicate data observations

## 8.4 Quick Actions

The Overview screen must provide access to:

- Create Chart
- Create Dashboard
- Add Calculated Field
- Export Data

---

# 9. Data Explorer Requirements

## 9.1 Data Table

**FR-EXP-001:** The application must display imported records in a tabular format.

**FR-EXP-002:** The table must display column headers.

**FR-EXP-003:** The table must support horizontal scrolling.

**FR-EXP-004:** The table must support virtualized rendering for large datasets.

**FR-EXP-005:** The table must support column resizing.

**FR-EXP-006:** The table must support column visibility configuration.

**FR-EXP-007:** The table must support row selection where applicable.

**FR-EXP-008:** The table must support configurable pagination.

## 9.2 Search

Users must be able to:

- Search across visible columns.
- Search text values.
- Search numeric values.
- Search date values.
- Clear the search query.

Search results must update the displayed records without modifying the original dataset.

## 9.3 Sorting

The application must support:

- Ascending sort
- Descending sort
- Numeric sorting
- Text sorting
- Date sorting
- Multi-column sorting as a future enhancement

Sorting must not modify the underlying original dataset.

## 9.4 Filtering

The application must support filters for:

### Text

- Equals
- Does not equal
- Contains
- Does not contain
- Starts with
- Ends with
- Is empty
- Is not empty

### Numeric

- Equals
- Does not equal
- Greater than
- Greater than or equal to
- Less than
- Less than or equal to
- Between
- Is empty
- Is not empty

### Date

- Before
- After
- On
- Between
- Is empty
- Is not empty

### Boolean

- Is true
- Is false
- Is empty

## 9.5 Filter Behavior

- Multiple filters must be supported.
- Filters must support AND conditions.
- Active filters must be visible as filter chips.
- Users must be able to remove individual filters.
- Users must be able to clear all filters.
- Filters must affect analytics and visualizations when applied to the active workspace.
- The original dataset must remain unchanged.

---

# 10. Column Analysis Requirements

## 10.1 Column Profile

Users must be able to inspect an individual column.

The profile must display relevant statistics based on the detected data type.

## 10.2 Numeric Column Statistics

The application must calculate:

- Count
- Missing count
- Unique count
- Minimum
- Maximum
- Sum
- Average
- Median
- Standard deviation
- Percentiles

## 10.3 Text Column Statistics

The application must calculate:

- Count
- Missing count
- Unique count
- Most frequent values
- Minimum text length
- Maximum text length

## 10.4 Date Column Statistics

The application must calculate:

- Count
- Missing count
- Earliest date
- Latest date
- Date distribution

## 10.5 Boolean Column Statistics

The application must calculate:

- True count
- False count
- Missing count

---

# 11. Data Quality Requirements

## 11.1 Quality Checks

The application must detect:

| Issue | Description |
|---|---|
| Missing Values | Empty or null values |
| Duplicate Rows | Rows with identical values |
| Duplicate Values | Repeated values in a column |
| Empty Columns | Columns containing no meaningful values |
| Constant Columns | Columns containing only one unique value |
| Mixed Data Types | Columns containing inconsistent types |
| Invalid Numbers | Values that cannot be parsed as numbers |
| Invalid Dates | Values that cannot be parsed as dates |
| Whitespace Issues | Leading or trailing whitespace |
| Potential Outliers | Unusually distant numeric values |

## 11.2 Quality Summary

The Data Quality screen must display:

- Total detected issues
- Affected columns
- Issue counts
- Issue severity
- Relevant records

## 11.3 Quality Issue Navigation

Users must be able to navigate from a quality issue to the affected records in Data Explorer.

## 11.4 Data Quality Score

The application may provide an overall quality score.

The score must be based on documented rules and must not be presented as a scientifically authoritative measurement.

---

# 12. Analytics Requirements

## 12.1 Statistical Summary

The Analytics screen must provide summary statistics for available columns.

## 12.2 Aggregation

The application must support:

- Sum
- Average
- Count
- Minimum
- Maximum
- Median

## 12.3 Grouping

Users must be able to group data by categorical or date columns.

Example:

```text
Group By: Country
Measure: Revenue
Aggregation: Sum
```

## 12.4 Distribution Analysis

The application must support:

- Numeric distributions
- Category distributions
- Date distributions

## 12.5 Correlation

The application should support correlation analysis between numeric columns.

Correlation results must indicate when insufficient valid data is available.

## 12.6 Automatic Insights

The application must generate rule-based insights from available statistics.

Insights must be:

- Based on actual dataset values
- Reproducible
- Clearly explained
- Updated when relevant filters change

---

# 13. Visualization Requirements

## 13.1 Supported Chart Types

The MVP must support:

| Chart | Primary Use |
|---|---|
| Bar | Compare categories |
| Line | Display trends |
| Area | Display trends and magnitude |
| Pie | Display proportions |
| Donut | Display proportions |
| Scatter | Compare numeric variables |
| Histogram | Display numeric distributions |
| KPI | Display a single aggregated value |

## 13.2 Visualization Configuration

Users must be able to configure:

- Chart type
- Chart title
- Dimension fields
- Measure fields
- Aggregation
- Grouping
- Sorting
- Data limits
- Number formatting
- Chart legend
- Chart colors

## 13.3 Chart Validation

The application must validate chart configuration before rendering.

Examples:

- A line chart requires a suitable dimension and measure.
- A scatter chart requires numeric fields.
- A KPI requires an aggregation or selected value.
- A histogram requires a numeric field.

Invalid configurations must display helpful guidance.

## 13.4 Visualization Persistence

Users must be able to:

- Save a visualization
- Rename a visualization
- Edit a visualization
- Duplicate a visualization
- Delete a visualization
- Add a visualization to a dashboard

---

# 14. Dashboard Builder Requirements

## 14.1 Dashboard Creation

Users must be able to create dashboards within a workspace.

## 14.2 Dashboard Widgets

Supported widgets:

- KPI
- Bar chart
- Line chart
- Area chart
- Pie chart
- Donut chart
- Scatter chart
- Histogram

## 14.3 Dashboard Layout

The dashboard must support:

- Grid-based layout
- Drag-and-drop positioning
- Widget resizing
- Widget duplication
- Widget deletion
- Widget configuration
- Dashboard renaming

## 14.4 Dashboard Modes

The application must provide:

### Edit Mode

Users can modify the dashboard layout.

### Presentation Mode

Users can view the dashboard without editing controls.

## 14.5 Dashboard Persistence

Dashboard layout and widget configuration must be saved locally.

---

# 15. Calculated Fields Requirements

## 15.1 Field Creation

Users must be able to create calculated fields using supported formulas.

## 15.2 Formula Support

The MVP should support:

- Arithmetic operations
- Numeric expressions
- Text concatenation
- Basic functions
- References to existing columns

Examples:

```text
price * quantity

revenue - cost

profit / revenue * 100

first_name + " " + last_name
```

## 15.3 Formula Validation

The application must:

- Validate formula syntax.
- Detect invalid column references.
- Detect incompatible data types.
- Display formula errors.
- Preview calculated results.
- Prevent unsafe code execution.

## 15.4 Calculated Field Persistence

Calculated field definitions must be saved with the workspace.

---

# 16. Workspace Requirements

## 16.1 Workspace Creation

A workspace must be associated with a dataset.

## 16.2 Workspace Contents

A workspace must contain:

- Dataset reference
- Filters
- Calculated fields
- Saved visualizations
- Dashboards
- Workspace preferences

## 16.3 Workspace Persistence

The application must automatically save workspace changes where appropriate.

Users must receive clear feedback when saving succeeds or fails.

## 16.4 Workspace Restoration

Users must be able to reopen a previously saved workspace and continue their analysis.

---

# 17. Export Requirements

## 17.1 Data Export

The application must support:

- Original CSV export
- Filtered CSV export
- JSON export

## 17.2 Visualization Export

The application must support PNG export for individual charts.

## 17.3 Dashboard Export

The application should support PNG export for dashboards.

PDF export may be considered for a later release.

## 17.4 Export Configuration

Users must be able to choose:

- Export format
- Export filename
- Original or filtered data where applicable

## 17.5 Export Validation

The application must display an error if an export cannot be completed.

---

# 18. Settings Requirements

## 18.1 Appearance

Users must be able to select:

- Light theme
- Dark theme
- System theme

## 18.2 Data Preferences

Users should be able to configure:

- Default rows per page
- Date formatting
- Number formatting

## 18.3 Privacy

The application must explain the local-first processing model.

## 18.4 Storage

Users must be able to:

- View approximate local storage usage where supported.
- Delete stored datasets.
- Clear local application data.

Destructive actions must require confirmation.

---

# 19. Data Models

## 19.1 Dataset

```typescript
interface Dataset {
  id: string;
  name: string;
  fileName: string;

  rowCount: number;
  columnCount: number;

  columns: DatasetColumn[];

  importConfig: ImportConfig;

  createdAt: string;
  updatedAt: string;
}
```

## 19.2 Dataset Column

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

## 19.3 Data Type

```typescript
type DataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'unknown';
```

## 19.4 Workspace

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

## 19.5 Visualization

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

## 19.6 Dashboard

```typescript
interface Dashboard {
  id: string;
  name: string;

  workspaceId: string;

  widgets: DashboardWidget[];

  layout: DashboardLayout;

  createdAt: string;
  updatedAt: string;
}
```

## 19.7 Filter

```typescript
interface Filter {
  id: string;

  columnId: string;

  operator: FilterOperator;

  value?: unknown;

  logicalOperator?: 'AND' | 'OR';
}
```

## 19.8 Calculated Field

```typescript
interface CalculatedField {
  id: string;

  name: string;

  formula: string;

  dataType: DataType;

  createdAt: string;
}
```

---

# 20. Performance Requirements

## 20.1 General

The application should remain responsive during normal data exploration.

## 20.2 Large Dataset Support

The application should use:

- Virtualized tables
- Web Workers
- Incremental parsing
- IndexedDB
- Cached statistics
- Lazy calculations

## 20.3 Processing

Heavy processing must not unnecessarily block the main UI thread.

## 20.4 Initial Performance Targets

These are provisional MVP targets and must be validated through testing.

| Operation | Target |
|---|---|
| Application shell loading | Under 3 seconds on a typical connection |
| Small CSV import | Under 5 seconds |
| Search on moderate dataset | Under 500 ms |
| Sort on moderate dataset | Under 1 second |
| Basic chart rendering | Under 2 seconds |
| Workspace restoration | Under 3 seconds |

Performance depends on file size, browser, device, and dataset complexity.

---

# 21. Non-Functional Requirements

## 21.1 Privacy

- CSV processing must occur locally in the browser.
- The MVP must not upload imported data to a server.
- No authentication should be required.
- No external analytics service should receive dataset contents.
- The application must clearly communicate its privacy model.

## 21.2 Reliability

- Invalid files must not crash the application.
- Failed imports must not corrupt existing datasets.
- Failed workspace saves must provide feedback.
- Destructive operations must require confirmation.
- The application must handle browser storage limitations.

## 21.3 Maintainability

- Use modular Angular features.
- Use typed interfaces.
- Separate domain logic from UI.
- Use reusable components.
- Avoid duplicated business logic.
- Document public interfaces and complex logic.

## 21.4 Accessibility

The application should target WCAG 2.1 AA.

Requirements include:

- Keyboard navigation
- Visible focus indicators
- Semantic HTML
- Accessible forms
- Accessible tables
- Sufficient color contrast
- Accessible chart descriptions
- Non-color-only status indicators

## 21.5 Responsive Design

The application must support:

- Desktop
- Tablet
- Mobile

Desktop remains the primary experience.

## 21.6 Browser Storage

The application must handle:

- Storage quota limitations
- Storage failures
- Dataset deletion
- Workspace deletion
- Data restoration where supported

---

# 22. Security Requirements

## 22.1 CSV Processing

The application must treat imported CSV content as untrusted data.

## 22.2 Formula Processing

Calculated fields must use a safe expression evaluator.

The application must not execute arbitrary user-provided JavaScript.

## 22.3 HTML Rendering

Imported values must be rendered as text unless explicitly processed through a safe rendering mechanism.

## 22.4 Export Safety

CSV export should account for spreadsheet formula injection risks when exporting untrusted values.

## 22.5 Local Data

The application must clearly communicate that locally stored data may be accessible to anyone using the same browser profile.

---

# 23. Error Handling Requirements

The application must handle:

| Error | Expected Behavior |
|---|---|
| Invalid CSV | Display import error |
| Unsupported format | Explain supported formats |
| Parsing failure | Identify issue where possible |
| Storage failure | Display save error |
| Invalid formula | Display validation message |
| Invalid chart configuration | Display configuration guidance |
| Export failure | Display export error |
| Missing dataset | Display recovery or navigation option |
| Browser storage unavailable | Explain persistence limitation |

Error messages should explain:

1. What happened.
2. Why it happened, where known.
3. What the user can do next.

---

# 24. Acceptance Criteria

## 24.1 CSV Import

- [ ] User can upload a CSV using a file picker.
- [ ] User can drag and drop a CSV.
- [ ] Application detects rows and columns.
- [ ] Application detects data types.
- [ ] Application displays import progress.
- [ ] Application handles invalid CSV files gracefully.
- [ ] Successful import opens Dataset Overview.

## 24.2 Dataset Overview

- [ ] Dataset name is displayed.
- [ ] Row count is displayed.
- [ ] Column count is displayed.
- [ ] Missing values are calculated.
- [ ] Duplicate rows are calculated.
- [ ] Basic insights are displayed when available.
- [ ] Recommended charts are displayed when suitable data exists.

## 24.3 Data Explorer

- [ ] User can view dataset records.
- [ ] User can search records.
- [ ] User can sort columns.
- [ ] User can apply filters.
- [ ] User can remove filters.
- [ ] User can hide columns.
- [ ] User can inspect column statistics.

## 24.4 Data Quality

- [ ] Missing values are detected.
- [ ] Duplicate rows are detected.
- [ ] Mixed data types are detected.
- [ ] Invalid dates are detected.
- [ ] Quality issues are displayed.
- [ ] Users can navigate to affected records.

## 24.5 Analytics

- [ ] Numeric statistics are calculated.
- [ ] Aggregation is supported.
- [ ] Grouping is supported.
- [ ] Distribution analysis is available.
- [ ] Correlation analysis is available when applicable.
- [ ] Insights update when relevant filters change.

## 24.6 Visualization

- [ ] User can select a chart type.
- [ ] User can select dimension fields.
- [ ] User can select measure fields.
- [ ] User can select aggregation.
- [ ] Chart preview updates when configuration changes.
- [ ] User can save a visualization.
- [ ] User can edit a saved visualization.

## 24.7 Dashboard

- [ ] User can create a dashboard.
- [ ] User can add visualizations.
- [ ] User can rearrange widgets.
- [ ] User can resize widgets.
- [ ] User can save dashboard layout.
- [ ] User can reopen a saved dashboard.
- [ ] User can enter presentation mode.

## 24.8 Persistence

- [ ] Imported datasets can be stored locally.
- [ ] Workspaces can be stored locally.
- [ ] Application can restore saved workspaces.
- [ ] Users can delete stored datasets.
- [ ] Storage failures are handled gracefully.

## 24.9 Export

- [ ] User can export original CSV.
- [ ] User can export filtered CSV.
- [ ] User can export JSON.
- [ ] User can export individual charts as PNG.
- [ ] Export failures are handled gracefully.

---

# 25. Development Roadmap

## Phase 1 — Foundation

**Goal:** Establish the application architecture.

Tasks:

- [ ] Initialize Angular project.
- [ ] Configure GitHub Pages deployment.
- [ ] Implement application shell.
- [ ] Implement navigation.
- [ ] Implement theme system.
- [ ] Define domain models.
- [ ] Define repository interfaces.
- [ ] Implement IndexedDB persistence.
- [ ] Implement LocalStorage preferences.
- [ ] Establish reusable UI components.

## Phase 2 — CSV Import

**Goal:** Allow users to import and store datasets.

Tasks:

- [ ] Implement upload zone.
- [ ] Implement file picker.
- [ ] Implement drag-and-drop.
- [ ] Integrate CSV parser.
- [ ] Implement import configuration.
- [ ] Implement validation.
- [ ] Implement data-type detection.
- [ ] Implement dataset metadata generation.
- [ ] Implement local persistence.
- [ ] Implement import error handling.

## Phase 3 — Data Explorer

**Goal:** Allow users to inspect and manipulate the dataset view.

Tasks:

- [ ] Implement data table.
- [ ] Implement virtualized rendering.
- [ ] Implement search.
- [ ] Implement sorting.
- [ ] Implement filtering.
- [ ] Implement column visibility.
- [ ] Implement column resizing.
- [ ] Implement pagination.
- [ ] Implement column profile.

## Phase 4 — Data Quality and Analytics

**Goal:** Provide useful analytical capabilities.

Tasks:

- [ ] Implement missing-value detection.
- [ ] Implement duplicate detection.
- [ ] Implement data-type validation.
- [ ] Implement numeric statistics.
- [ ] Implement text statistics.
- [ ] Implement date statistics.
- [ ] Implement distributions.
- [ ] Implement aggregation.
- [ ] Implement grouping.
- [ ] Implement correlation.
- [ ] Implement rule-based insights.

## Phase 5 — Visualization Builder

**Goal:** Allow users to create reusable charts.

Tasks:

- [ ] Implement chart configuration.
- [ ] Implement chart preview.
- [ ] Implement bar chart.
- [ ] Implement line chart.
- [ ] Implement area chart.
- [ ] Implement pie and donut charts.
- [ ] Implement scatter chart.
- [ ] Implement histogram.
- [ ] Implement KPI visualization.
- [ ] Implement visualization persistence.
- [ ] Implement chart export.

## Phase 6 — Dashboard Builder

**Goal:** Allow users to combine visualizations into dashboards.

Tasks:

- [ ] Implement dashboard creation.
- [ ] Implement widget management.
- [ ] Implement drag-and-drop.
- [ ] Implement widget resizing.
- [ ] Implement dashboard persistence.
- [ ] Implement presentation mode.
- [ ] Implement dashboard export.

## Phase 7 — Calculated Fields and Polish

**Goal:** Complete the MVP experience.

Tasks:

- [ ] Implement formula editor.
- [ ] Implement formula validation.
- [ ] Implement calculated-field preview.
- [ ] Implement calculated-field persistence.
- [ ] Implement dataset library.
- [ ] Implement saved workspace library.
- [ ] Implement settings.
- [ ] Implement empty states.
- [ ] Implement loading states.
- [ ] Implement error states.
- [ ] Perform accessibility testing.
- [ ] Perform performance testing.
- [ ] Perform end-to-end testing.

---

# 26. Future Roadmap

## V2 — Advanced Data Analysis

Potential features:

- Excel import
- JSON import
- TSV import
- Pivot tables
- Advanced formulas
- Data transformations
- Dataset joins
- Advanced filtering
- More chart types

## V3 — Backend Integration

Potential features:

- User authentication
- Cloud dataset storage
- Cloud workspace storage
- REST API integration
- Dataset synchronization
- Cloud processing

## V4 — Collaboration

Potential features:

- Shared workspaces
- Shared dashboards
- Team collaboration
- Permissions
- Comments
- Public dashboards

## V5 — AI Analytics

Potential features:

- Natural-language data queries
- AI-generated charts
- AI-generated summaries
- Automated anomaly explanations
- Conversational analytics

---

# 27. MVP Definition of Done

The MVP is considered complete when a user can:

1. Open the application without registering.
2. Upload a CSV file.
3. View dataset metadata and summary statistics.
4. Explore records using search, sorting, and filtering.
5. Inspect column statistics.
6. Identify common data-quality issues.
7. Perform basic analytics.
8. Create and configure visualizations.
9. Build and save a dashboard.
10. Export data and visualizations.
11. Close the application and return to their locally saved workspace.
12. Complete the entire workflow without uploading dataset contents to a server.

---

# 28. Final Product Definition

CSV Analytics Tool is a:

> **Privacy-first, browser-based CSV analytics workspace that makes data exploration, analysis, visualization, and dashboard creation accessible without requiring a backend or specialized software.**

The MVP should prioritize:

- Ease of use
- Local-first processing
- Fast data exploration
- Meaningful analytical insights
- Reusable visualizations
- Reliable local persistence
- Backend-ready architecture

The product's defining user experience is:

```text
Upload
   ↓
Explore
   ↓
Understand
   ↓
Analyze
   ↓
Visualize
   ↓
Present
   ↓
Export
```

The application should provide immediate value after import while allowing users to progressively explore more advanced analytical capabilities.

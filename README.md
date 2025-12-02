# Dynamic Drill-down Grid

A lightweight, high-performance client-side web application for analyzing hierarchical data. This tool allows users to upload compact JSON datasets, dynamically configure aggregation levels, and interactively drill down from summary views to detailed records.

## Key Features

  * **⚡ Client-Side Processing**: fast parsing and rendering entirely in the browser using jQuery; no backend required.
  * **📂 Ultra-Compact JSON Support**: Optimized for large datasets using an "Array of Arrays" format to reduce file size.
  * **⚙️ Dynamic Configuration**:
      * Select up to 3 hierarchical grouping levels (e.g., Region -\> Customer -\> Project).
      * Smart column filtering: separates "Category" (dimensions) from "Aggregation" (metrics).
      * **Select All / Unselect All** controls for quick metric selection.
  * **📊 Interactive Grid**:
      * **Drill-down**: Click rows to dive deeper into the data.
      * **Breadcrumbs**: Easy navigation back to higher levels.
      * **Sorting**: Click headers to sort by text or numeric values.
      * **Aggregations**: Automatic summation of metric columns.
      * **Total Row**: Sticky footer showing column totals.
  * **🖥️ Responsive & Optimized UI**:
      * **Full-width layout** (95% screen width) utilizing Bootstrap 5.
      * **Smart Freezing**:
          * *Aggregation View*: Freezes the grouping column.
          * *Detail View*: Freezes all non-metric columns (categories).
      * **Sticky Header**: Headers remain visible while scrolling.
      * **No-Wrap Text**: Ensures data readability without row height shifts.

## Project Structure

Ensure your file structure looks like this:

```text
/project-root
│
├── index.html              # Main application file
├── README.md               # Documentation
│
├── css/
│   └── bootstrap.min.css   # Bootstrap 5 CSS
│
└── js/
    ├── jquery-3.6.0.min.js # jQuery Library
    └── bootstrap.bundle.min.js # Bootstrap 5 JS Bundle
```

## Getting Started

1.  **Download**: Clone the repository or download the files.
2.  **Dependencies**: Ensure `css/` and `js/` folders contain the required Bootstrap and jQuery files.
3.  **Run**: Simply open `index.html` in any modern web browser (Chrome, Edge, Firefox, etc.).
4.  **Test**: Use the `sample_data.json` format described below to test the application.

## Data Format (Ultra Compact JSON)

This tool requires a specific optimized JSON format to handle large datasets efficiently. The file must contain three specific keys: `columns`, `col_types`, and `data`.

### Format Specification

  * **`columns`** (Array of Strings): The names of the headers.
  * **`col_types`** (Array of Strings): Defines the role of each column. Must match the length of `columns`.
      * `"category"`: Text columns used for grouping (e.g., Customer, Region).
      * `"aggregation"`: Numeric columns used for summation (e.g., Sales, Qty).
  * **`data`** (Array of Arrays): The actual data. Each row is an array of values corresponding to the order of `columns`.

### Example `sample_data.json`

```json
{
  "columns": [
    "Region", "Customer", "Project", "Year",
    "Jan", "Feb", "Mar"
  ],
  "col_types": [
    "category", "category", "category", "category",
    "aggregation", "aggregation", "aggregation"
  ],
  "data": [
    ["North America", "Amazon", "Kuiper", 2026, 100, 200, 300],
    ["Asia Pacific", "Foxconn", "iPhone", 2026, 500, 600, "-"],
    ["Europe", "Nokia", "5G", 2025, 100, 100, 100]
  ]
}
```

> **Note**: The tool handles `"-"` or null values in aggregation columns by treating them as `0`.

## Usage Guide

1.  **Upload**: Click "Choose File" and select your `.json` file.
2.  **Reset (Optional)**: If you selected the wrong file, a "Reset Configuration" button will appear.
3.  **Configure Levels**:
      * Select how many levels you want to drill down (1, 2, or 3).
      * Choose the specific Category column for each level.
4.  **Select Metrics**:
      * Check the boxes for the aggregation columns you want to sum.
      * Use the "Select All" or "Unselect All" buttons for convenience.
5.  **Generate**: Click "Load Grid".
6.  **Interact**:
      * Click on any row to drill down to the next level.
      * Click table headers to sort.
      * Use the Breadcrumb bar (top) to navigate back.

## Technologies Used

  * **HTML5**
  * **Bootstrap 5** (Layout & Styling)
  * **jQuery 3.6.0** (DOM Manipulation & Logic)
  * **JavaScript (ES6+)**

## License

[MIT License](https://www.google.com/search?q=LICENSE) (or your preferred license)
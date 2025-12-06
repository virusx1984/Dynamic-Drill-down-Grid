# Dynamic Drill-down Grid

A powerful, lightweight client-side web application for analyzing hierarchical data. This tool allows users to upload optimized JSON datasets, configure dynamic aggregation levels, customize column styling, and interactively drill down from summary views to detailed records.

## 🚀 Key Features

  * **⚡ Client-Side Processing**: Fast parsing and rendering using jQuery; no backend required.
  * **📂 Ultra-Compact JSON Support**: Uses an "Array of Arrays" format to minimize file size for large datasets.
  * **🖱️ Drag & Drop Upload**: Support for dragging JSON files directly into the interface.
  * **🎨 Custom Column Styling**:
      * Set specific background colors for individual metric column headers.
      * **Batch Color Assignment**: Apply colors to multiple selected columns instantly.
  * **🔍 Advanced Filtering**:
      * Filter metric columns using **Text** or **Regex** (e.g., `Jan|Feb`).
      * "Select Visible" / "Unselect Visible" for quick batch operations.
  * **⚙️ Dynamic Configuration**:
      * Select up to 3 hierarchical grouping levels (Region -\> Customer -\> Project).
      * Smart filtering automatically separates "Category" columns from "Aggregation" columns.
  * **📊 Interactive Grid**:
      * **Drill-down**: Click rows to explore deeper levels.
      * **Back to Config**: Return to settings without losing your file.
      * **Sticky Headers & Columns**: Intelligent freezing of grouping columns and headers.
      * **Sorting**: Sort by text or numeric values.
      * **Totals**: Sticky footer row showing automatic summations.

## 🛠 Project Structure

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

## 📋 Data Format (Ultra Compact JSON)

To ensure high performance with large datasets, this tool uses a strict **Ultra Compact JSON** format. The file **must** contain three specific keys:

1.  `columns`: Array of strings (Header names).
2.  `col_types`: Array of strings (Data types).
3.  `data`: Array of Arrays (Row values).

### Format Specification

  * **`columns`**: List of all column headers.
  * **`col_types`**: Must correspond 1-to-1 with `columns`.
      * `"category"`: Text columns used for grouping (Dimensions).
      * `"aggregation"`: Numeric columns used for summation (Metrics).
  * **`data`**: Each row is an array of values, following the order of `columns`.

### Example `sample_data.json`

```json
{
  "columns": [
    "Region", "Customer", "Project",
    "2026 Jan", "2026 Feb", "2026 Mar"
  ],
  "col_types": [
    "category", "category", "category",
    "aggregation", "aggregation", "aggregation"
  ],
  "data": [
    ["North America", "Amazon", "Kuiper", 100, 200, 300],
    ["Asia Pacific", "Foxconn", "iPhone", 500, 600, "-"],
    ["Europe", "Nokia", "5G", 100, 100, 100]
  ]
}
```

> **Note**: `"-"` or `null` values in aggregation columns are treated as `0`.

## 📖 Usage Guide

1.  **Upload Data**:
      * Drag and drop your `.json` file into the upload zone, or click to browse.
2.  **Configure Levels**:
      * Choose the depth of analysis (1, 2, or 3 levels).
      * Select the specific **Category** columns for each level (e.g., Level 1: Region).
3.  **Select & Style Metrics**:
      * **Filter**: Use the search box to find columns (supports Regex, e.g., `Q1|Q2`).
      * **Select**: Check the metrics you want to analyze.
      * **Coloring**:
          * *Individual*: Use the color picker dropdown next to each column.
          * *Batch*: Select a color from the toolbar dropdown and click **"Set Color"** to apply it to all currently visible and selected columns.
4.  **Generate Grid**:
      * Click **"Load Grid"** to visualize the data.
5.  **Analyze**:
      * **Drill-down**: Click a row to see the next level of detail.
      * **Sort**: Click headers to sort ascending/descending.
      * **Modify**: Click **"\< Back to Configuration"** to adjust settings without re-uploading.

## 📦 Dependencies

  * **Bootstrap 5**: For responsive layout and styling.
  * **jQuery 3.6.0**: For DOM manipulation and event handling.

## 📄 License

[MIT License](https://www.google.com/search?q=LICENSE)
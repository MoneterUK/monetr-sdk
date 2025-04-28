# Advanced Documentation for monetr-sdk

This document provides extended documentation and examples for developers integrating the monetr-sdk into their applications. It covers installation, configuration, usage examples, and error handling to help you get the most out of the SDK.

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Configuration](#configuration)
5. [Using the SDK](#using-the-sdk)
   - [Single Report](#single-report)
   - [Batch Reports](#batch-reports)
6. [Advanced Examples and Integration](#advanced-examples-and-integration)
7. [Error Handling](#error-handling)
8. [License](#license)

---

## Overview

`monetr-sdk` is a lightweight JavaScript SDK used to report KPI values to [Monetr](https://app.monetr.co.uk). It supports both single reports and batch reporting with a simple API. The SDK is designed to work across different environments (`production`, `staging`, or `development`).

---

## Installation

Install the SDK via npm or yarn:

```bash
npm install @monetrcouk/monetr-sdk
```

or

```bash
yarn add @monetrcouk/monetr-sdk
```

---

## Quick Start

Here is a simple example to get you started with authenticating and reporting a single KPI value:

```javascript
const { monetr } = require("@monetrcouk/monetr-sdk");

// Set your API token
monetr.setToken('your-organization-token');

// Report a single KPI value
monetr.report(
  'a30580b4-607a-4adc-8a37-5c3747b73f45',
  '3fd4f2ab-74f8-47cb-a2d2-43e52f89f0dc',
  10,
  '2025-04-01'
);
```

The kpiId and the dimensionId can be found in app.monetr.co.uk, in the SDK details.

---

## Configuration

### Environment Configuration

Set the environment of your choice using `setEnvironment`. The SDK supports:
- `production` (default)
- `staging`
- `development`

```javascript
// Switch environment to staging
monetr.setEnvironment('staging');
```

### KPI & Dimension Mapping for Batch Reports

When reporting in batch, you must supply a configuration object that maps logical KPI names to their IDs and dimension IDs (found in app.monetr.co.uk). Keys are matched case-insensitively, so it is advised to use consistent naming (lowercase recommended).

Example configuration:

```javascript
const configuration = {
  visits: {
    kpi: "a30580b4-607a-4adc-8a37-5c3747b73f45",
    dimensions: {
      uk: "3fd4f2ab-74f8-47cb-a2d2-43e52f89f0dc",
      france: "54ff17bb-e20c-4729-8818-8fdba21c90aa",
    },
  },
  sales: {
    kpi: "b12345b4-607a-4adc-8a37-5c3747b73faa",
    dimensions: {
      online: "6fd4f2ab-74f8-47cb-a2d2-43e52f89f0dd",
      instore: "7gf4g2ab-74f8-47cb-a2d2-43e52f89f0ff",
    },
  },
};
```

---

## Using the SDK

### Single Report

The `report` method sends a single KPI value report.

#### Syntax

```javascript
monetr.report(kpiId, kpiDimensionId, value, date);
```

#### Parameters

- `kpiId` (string): The KPI's unique identifier.
- `kpiDimensionId` (string): The dimension's unique identifier.
- `value` (number): The numeric value to report.
- `date` (string, optional): ISO formatted date (e.g., `"2025-04-01"`). Defaults to the current date if not provided.

#### Example

```javascript
monetr.report(
  'a30580b4-607a-4adc-8a37-5c3747b73f45', 
  '3fd4f2ab-74f8-47cb-a2d2-43e52f89f0dc', 
  42, 
  '2025-04-01'
);
```

### Batch Reports

The `reportBatch` method allows you to report multiple KPI values in a single operation. It expects an array of data objects and a configuration mapping for resolving KPI and dimension IDs.

#### Syntax

```javascript
monetr.reportBatch(data, configuration);
```

#### Parameters

- `data` (array): Array of objects. Each object must include:
  - `key`: A string combining the KPI name and dimension name, separated by a dot (e.g., `"visits.uk"`).
  - `date`: The ISO formatted date when the report should be made.
  - `value`: The numeric value to report.
- `configuration` (object): Mapping of KPI names to their corresponding IDs and dimensions.

#### Example

```javascript
const data = [
  { key: "visits.uk", date: "2025-04-01", value: 1240 },
  { key: "visits.france", date: "2025-04-01", value: 132 },
  { key: "sales.online", date: "2025-04-01", value: 850 },
  { key: "sales.instore", date: "2025-04-01", value: 400 },
];

const configuration = {
  visits: {
    kpi: "a30580b4-607a-4adc-8a37-5c3747b73f45",
    dimensions: {
      uk: "3fd4f2ab-74f8-47cb-a2d2-43e52f89f0dc",
      france: "54ff17bb-e20c-4729-8818-8fdba21c90aa",
    },
  },
  sales: {
    kpi: "b12345b4-607a-4adc-8a37-5c3747b73faa",
    dimensions: {
      online: "6fd4f2ab-74f8-47cb-a2d2-43e52f89f0dd",
      instore: "7gf4g2ab-74f8-47cb-a2d2-43e52f89f0ff",
    },
  },
};

monetr.reportBatch(data, configuration);
```

The SDK preprocesses the configuration to ensure case-insensitive matching. For instance, both `"visits.uk"` and `"Visits.UK"` will correctly match the configuration mapped under the lowercase keys.

---

## Advanced Examples and Integration

### Integration with a Web Application

Below is an example of how to integrate the SDK in an Express web application to report KPI values based on an API endpoint request:

```javascript
const express = require("express");
const bodyParser = require("body-parser");
const { monetr } = require("@monetrcouk/monetr-sdk");

const app = express();
app.use(bodyParser.json());

// Configure monetr
monetr.setToken("your-organization-token");
monetr.setEnvironment("production");

app.post("/report", async (req, res) => {
  const { kpiId, dimensionId, value, date } = req.body;

  const success = await monetr.report(kpiId, dimensionId, value, date);
  if (success) {
    res.status(200).send({ message: "Report successful" });
  } else {
    res.status(500).send({ message: "Report failed" });
  }
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
```

### Integration with Data Pipelines

You may also integrate `monetr-sdk` as part of data processing scripts to report batch metrics. For example, a Node.js script that reads data from a CSV file, constructs data objects, and calls `reportBatch`:

```javascript
const fs = require("fs");
const csv = require("csv-parser");
const { monetr } = require("@monetrcouk/monetr-sdk");

monetr.setToken("your-organization-token");
monetr.setEnvironment("production");

const configuration = {
  performance: {
    kpi: "kpi-unique-id-for-performance",
    dimensions: {
      high: "dimension-id-high",
      low: "dimension-id-low",
    },
  },
};

const data = [];
fs.createReadStream("data.csv")
  .pipe(csv())
  .on("data", (row) => {
    // Assuming CSV headers: key, date, value
    data.push({
      key: row.key,  // e.g., "performance.high"
      date: row.date,
      value: parseInt(row.value, 10),
    });
  })
  .on("end", async () => {
    console.log("CSV file successfully processed");
    const result = await monetr.reportBatch(data, configuration);
    console.log("Batch reporting result:", result);
  });
```

Replace `"data.csv"` and the configuration with your actual file and KPI mapping.

---

## Error Handling

- Both `report` and `reportBatch` methods log errors to the console if any report fails.
- In production, it is recommended to implement additional error handling or logging mechanisms to capture and retry failed reports.

Example:

```javascript
try {
  const success = await monetr.report(kpiId, dimensionId, value, date);
  if (!success) {
    // Implement retry logic or additional logging
    console.error("Report failed for", { kpiId, dimensionId, value, date });
  }
} catch (error) {
  console.error("Unexpected error:", error);
}
```

---

## License

This SDK is licensed under the MIT License.

---

With these extended guidelines, you should be able to integrate and customize the monetr-sdk for your specific reporting requirements. Happy coding!
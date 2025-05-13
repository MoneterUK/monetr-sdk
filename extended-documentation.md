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

// Set your configuration
monetr.set({
  token: "your-organization-token", 
  organization: "your-organization-id",
});

// Report a single KPI value
monetr.report(
  'a30580b4-607a-4adc-8a37-5c3747b73f45',
  '3fd4f2ab-74f8-47cb-a2d2-43e52f89f0dc',
  10,
  '2025-04-01'
);
```

The token, kpiId and dimensionId can be found in app.monetr.co.uk, in the SDK details.

---

## Configuration

### Basic Configuration

Use the set method to configure the SDK with your credentials and preferences:


```javascript
monetr.set({
  token: "your-organization-token", // Required for authentication
  organization: "your-organization-id", // Required for batch operations
  createNewDimensions: false // Optional: whether to auto-create dimensions if they don't exist
});
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
monetr.reportBatch(data);
```

- **Parameters**:

  - `data` (array): An array of objects, where each object has the following structure:
    - `projectId` (string): The unique identifier for the project.
    - `kpiId` (string): The unique identifier for the Key Performance Indicator (KPI).
    - `dimension` (string): The specific dimension or category to filter or group data.    
    - `value` (number): The value to report.
    - `date` (string, optional): The date of the report in ISO format (e.g., `2025-04-01`).

#### Example

```javascript
// Define configuration object for ease of reference
const configuration = {
  "visits by country": "71a6fd04-8d58-4286-acaa-f476401eca2d",
  "kpis": {
    "visits": {
      "kpi": "fc635123-97f1-429d-b5d7-a5752fdd1e8e"
    }
  }
};

// Prepare the data array
const data = [
  { 
    projectId: configuration["visits by country"], 
    kpiId: configuration.kpis.visits.kpi, 
    dimension: "uk", 
    date: "2025-04-01", 
    value: 1240 
  },
  { 
    projectId: configuration["visits by country"], 
    kpiId: configuration.kpis.visits.kpi, 
    dimension: "france", 
    date: "2025-04-01", 
    value: 135 
  },
];

// Send the batch report
monetr.reportBatch(data);
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
monetr.set({
  token: "your-organization-token",
  organization: "your-organization-id"
});

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

Here's an example of integrating the SDK with a data processing system that generates batch reports:

```javascript
const { monetr } = require("@monetrcouk/monetr-sdk");
const dataProcessor = require("./your-data-processor");

// Configure SDK
monetr.set({
  token: "your-organization-token",
  organization: "your-organization-id",
  environment: "production"
});

// Define project and KPI configuration
const config = {
  projectId: "71a6fd04-8d58-4286-acaa-f476401eca2d",
  kpiId: "fc635123-97f1-429d-b5d7-a5752fdd1e8e"
};

// Process data and create batch reports
async function processDailyReports() {
  // Get processed data from your system
  const processedData = await dataProcessor.getDailyMetrics();
  
  // Transform into format expected by monetr-sdk
  const batchData = processedData.map(item => ({
    projectId: config.projectId,
    kpiId: config.kpiId,
    dimension: item.region,
    value: item.count,
    date: item.date
  }));
  
  // Send batch report
  const result = await monetr.reportBatch(batchData);
  console.log("Batch report result:", result);
}

// Run daily reporting
processDailyReports().catch(console.error);
```

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
# monetr-sdk

SDK for reporting values to [Monetr](https://app.monetr.co.uk)

## Installation

```bash
npm install @monetrcouk/monetr-sdk
```

or

```bash
yarn add @monetrcouk/monetr-sdk
```

## Usage

```javascript
const { monetr } = require("@monetrcouk/monetr-sdk");

monetr.set({
  token: "your-organization-token", // write your organization token here
  organization: "your-organization-id", // get from monetr
});

// Report a single KPI
monetr.report(
  "kpi-id", // The KPI ID
  "dimension-id", // The Dimension ID
  value, // The value to report
  date // (Optional) The date of the report in ISO format
);
```

### Methods

#### `set(options)`

The `set` method is used to configure the Monetr SDK with the necessary options for authentication and behavior.

- **Parameters**:

  - `options` (object): Configuration object containing the following properties:
    - `token` (string): Your organization token, used for authentication.
    - `organization` (string): The unique identifier of your organization (e.g., UUID).
    - `createNewDimensions` (boolean): A flag indicating whether to automatically create new dimensions if they do not exist.

- **Example**:
  ```javascript
  monetr.set({
    token: "your-organization-token", // write your organization token here
    organization: "e8d2f97e-46cf-41aa-9c44-d2c449bb12cf", // Your Organization, from app.monetr.co.uk
    createNewDimensions: false,
  });
  ```
  ```

  ```

#### `reportBatch(data)`

Reports multiple KPI values in a batch.

- **Parameters**:

  - `data` (array): An array of objects, where each object has the following structure:
    - `projectId` (string): The unique identifier for the project.
    - `kpiId` (string): The unique identifier for the Key Performance Indicator (KPI).
    - `dimension` (string): The specific dimension or category to filter or group data.    
    - `value` (number): The value to report.
    - `date` (string, optional): The date of the report in ISO format (e.g., `2025-04-01`).

- **Returns**:

  - `true` if all reports were successful.
  - `false` if any report failed.

- **Example**:

  ```javascript

  const configuration = {
    "visits by country": "71a6fd04-8d58-4286-acaa-f476401eca2d",
    "kpis": {
      "visits": {
        "kpi": "fc635123-97f1-429d-b5d7-a5752fdd1e8e"
      }
    }
  };

    const data = [
    { projectId: configuration["visits by country"], kpiId: configuration.kpi.visits, dimension: "uk", date: "2025-04-01", value: 1240 },
    { projectId: configuration["visits by country"], kpiId: configuration.kpi.visits, dimension: "france", date: "2025-04-01", value: 135 },
  ];


  monetr.reportBatch(data);
  ```

### Error Handling

Both `report` and `reportBatch` log errors to the console if a report fails. Ensure proper error handling in your application to handle these cases gracefully.

### License

This SDK is licensed under the MIT License.

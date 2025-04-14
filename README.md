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

monetr.setToken('your-organization-token');

// Report a single KPI
monetr.report(
  'kpi-id',        // The KPI ID
  'dimension-id',  // The Dimension ID
  value,           // The value to report
  date             // (Optional) The date of the report in ISO format
);
```

### Methods

#### `setToken(token)`
Sets the token for authenticating requests to the Monetr API.

- **Parameters**:
  - `token` (string): Your organization's token.

#### `setEnvironment(environment)`
Sets the environment for the SDK.

- **Parameters**:
  - `environment` (string): One of `production` or `staging`.

#### `report(kpiId, kpiDimensionId, value, date)`
Reports a single KPI value to the Monetr API.

- **Parameters**:
  - `kpiId` (string): The ID of the KPI to report.
  - `kpiDimensionId` (string): The ID of the dimension to report.
  - `value` (number): The value to report.
  - `date` (string, optional): The date of the report in ISO format (e.g., `2025-04-01`). Defaults to the current date if not provided.

- **Returns**:
  - `true` if the report was successful.
  - `false` if the report failed.

- **Example**:
  ```javascript
  monetr.report(
    'a30580b4-607a-4adc-8a37-5c3747b73f45', 
    '3fd4f2ab-74f8-47cb-a2d2-43e52f89f0dc', 
    10, 
    '2025-04-01'
  );
  ```

#### `reportBatch(data, configuration)`
Reports multiple KPI values in a batch.

- **Parameters**:
  - `data` (array): An array of objects, where each object has the following structure:
    - `key` (string): A concatenation of the KPI name and dimension name, separated by a dot (e.g., `visits.uk`).
    - `date` (string): The date of the report in ISO format (e.g., `2025-04-01`).
    - `value` (number): The value to report.
  - `configuration` (object): A configuration object mapping KPI names to their IDs and dimensions. Example:
    ```javascript
    const configuration = {
      visits: {
        kpi: "a30580b4-607a-4adc-8a37-5c3747b73f45",
        dimensions: {
          "uk": "3fd4f2ab-74f8-47cb-a2d2-43e52f89f0dc",
          "france": "54ff17bb-e20c-4729-8818-8fdba21c90aa",
        },
      },
    };
    ```

- **Returns**:
  - `true` if all reports were successful.
  - `false` if any report failed.

- **Example**:
  ```javascript
  const data = [
    { key: "visits.uk", date: "2025-04-01", value: 1240 },
    { key: "visits.france", date: "2025-04-01", value: 132 },
  ];

  const configuration = {
    visits: {
      kpi: "a30580b4-607a-4adc-8a37-5c3747b73f45",
      dimensions: {
        "uk": "3fd4f2ab-74f8-47cb-a2d2-43e52f89f0dc",
        "france": "54ff17bb-e20c-4729-8818-8fdba21c90aa",
      },
    },
  };

  monetr.reportBatch(data, configuration);
  ```

### Error Handling
Both `report` and `reportBatch` log errors to the console if a report fails. Ensure proper error handling in your application to handle these cases gracefully.

### License
This SDK is licensed under the MIT License.
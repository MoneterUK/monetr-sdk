# monetr-sdk

SDK for reporting values to https://app.monetr.co.uk

## Installation
``` 
npm install @monetrcouk/monetr-sdk
``` 
or
``` 
yarn add @monetrcouk/monetr-sdk
``` 

## Usage
``` 
const { monetr } = require("@monetrcouk/monetr-sdk"); 

monetr.setToken('your-organization-token');
              
// Report KPI
monetr.report(
'kpi-id', 
'dimension-id', 
value
); // value for "default"
``` 
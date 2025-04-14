const axios = require("axios");
let apiBase = "https://api-p.monetr.co.uk/api/v1";

const environments = {
  production: "https://api-p.monetr.co.uk/api/v1",
  staging: "https://api-s.monetr.co.uk/api/v1",
  development: "http://localhost:8080/api/v1",
};

let token = null;
const setToken = (token) => {
  this.token = token;
};

const setEnvironment = (environment) => {
  this.apiBase = environments[environment];
};

const report = async (kpiId, kpiDimensionId, value, date) => {
  try {
    const headers = {
      "monetr-sdk-token": this.token,
    };
    const apiBase = this.apiBase || environments.production;
    await axios.post(
      `${apiBase}/kpis/${kpiId}/values/report-realtime/${kpiDimensionId}`,
      { value, date },
      { headers }
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};
const preprocessConfiguration = (configuration) => {
  const lowercasedConfig = {};
  for (const [kpiKey, kpiValue] of Object.entries(configuration)) {
    const lowercasedDimensions = {};
    for (const [dimensionKey, dimensionValue] of Object.entries(kpiValue.dimensions)) {
      lowercasedDimensions[dimensionKey.toLowerCase()] = dimensionValue;
    }
    lowercasedConfig[kpiKey.toLowerCase()] = {
      kpi: kpiValue.kpi,
      dimensions: lowercasedDimensions,
    };
  }
  return lowercasedConfig;
};

const reportBatch = async (data, configuration) => {
  try {
    const normalizedConfig = preprocessConfiguration(configuration);

    for (const entry of data) {
      const [kpiKey, dimensionKey] = entry.key.toLowerCase().split(".");
      const kpiId = normalizedConfig[kpiKey]?.kpi;
      const dimensionId = normalizedConfig[kpiKey]?.dimensions[dimensionKey];

      if (!kpiId || !dimensionId) {
        console.error(`Invalid key: ${entry.key}`);
        continue;
      }

      const success = await report(kpiId, dimensionId, entry.value, entry.date);
      if (!success) {
        console.error(`Failed to report data for key: ${entry.key}`);
      }
    }
    console.log("Batch reporting completed successfully.");
    return true;
  } catch (e) {
    console.error("Error in reportBatch:", e);
    return false;
  }
};

exports.monetr = { setToken, setEnvironment, report, reportBatch };

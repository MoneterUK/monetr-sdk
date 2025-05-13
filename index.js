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

let createNewDimensions = false

let organization = ''

const set = (options) => {
  options.token && setToken(options.token);
  options.organization && (organization = options.organization);
  options.environment && setEnvironment(options.environment);
  options.createNewDimensions && (createNewDimensions = options.createNewDimensions);
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

const reportBatchApi = async (data) => {
  try {
    const headers = {
      "monetr-sdk-token": this.token,
      "monetr-data-organization": this.organization,
    };
    const apiBase = this.apiBase || environments.production;
    await axios.post(
      `${apiBase}/sdk/kpi-values/report`,
      data,
      { headers }
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

const reportBatch = async (data, configuration) => {
  try {
    const success = await reportBatchApi(data);
    if (!success) {
      console.error(`Failed to report data for key: ${entry.key}`);
    }
    else {
      console.log("Batch reporting completed successfully.");
    }
    return true;
  } catch (e) {
    console.error("Error in reportBulk:", e);
    return false;
  }
};

exports.monetr = { set, setToken, setEnvironment, report, reportBatch };

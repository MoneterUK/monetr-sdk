const axios = require("axios");
let apiBase = "https://api-p.monetr.co.uk/api/v1";

const environments = {
  production: "https://api-p.monetr.co.uk/api/v1",
  staging: "https://api-s.monetr.co.uk/api/v1",
  development: "http://localhost:8080/api/v1",
};

const batchSize = 200;

let token = null;
const setToken = (token) => {
  this.token = token;
};

const setEnvironment = (environment) => {
  this.apiBase = environments[environment];
};

let createNewDimensions = false;

let organization = "";

const set = (options) => {
  options.token && setToken(options.token);
  options.organization && (this.organization = options.organization);
  options.environment && setEnvironment(options.environment);
  options.createNewDimensions &&
    (this.createNewDimensions = options.createNewDimensions);
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
    await axios.post(`${apiBase}/sdk/kpi-values/report`, data, { headers });
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

const reportBatch = async (data, configuration) => {
  try {
    const distinctProjectId = data.reduce((acc, item) => {
      if (!acc.includes(item.projectId)) {
        acc.push(item.projectId);
      }
      return acc;
    }, []);

    let allSuccess = true;

    for (let j = 0; j < distinctProjectId.length; j++) {
      const projectId = distinctProjectId[j];
      const projectData = data.filter((item) => item.projectId === projectId);

      const blocks = Math.ceil(projectData.length / batchSize);

      for (let i = 0; i < blocks; i++) {
        const start = i * batchSize;
        const end = start + batchSize;
        const block = projectData.slice(start, end);
        if (this.createNewDimensions) {
          block.forEach((item) => {
            item.create = true;
          });
        }
        const success = await reportBatchApi(block);
        if (!success) {
          allSuccess = false;
          // Optionally, you can break here if you want to stop on first failure
          // break;
        }
      }
    }
    if (!allSuccess) {
      console.error("Failed to report one or more data blocks.");
    } else {
      console.log("Batch reporting completed successfully.");
    }
    return allSuccess;
  } catch (e) {
    console.error("Error in reportBatch:", e);
    return false;
  }
};

exports.monetr = { set, setToken, setEnvironment, report, reportBatch };

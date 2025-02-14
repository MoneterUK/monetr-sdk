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
    return { send: true };
  } catch (e) {
    //console.error(e);
    return e;
  }
};

exports.monetr = { setToken, setEnvironment, report };

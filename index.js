const axios = require("axios");

const environments = {
  production: "https://api-p.monetr.co.uk/api/v1",
  staging: "https://api-s.monetr.co.uk/api/v1",
  development: "http://localhost:8081/api/v1",
};

// Module-level state (not relying on `this`)
let token = null;
let apiBase = environments.production;
let organization = "";
let createNewDimensions = false;

const batchSize = 200;
const dashboardChunkSize = 500;

const set = (options) => {
  if (options.token) token = options.token;
  if (options.organization) organization = options.organization;
  if (options.environment) apiBase = environments[options.environment] || apiBase;
  if (options.createNewDimensions) createNewDimensions = options.createNewDimensions;
};

const setToken = (t) => { token = t; };
const setEnvironment = (env) => { apiBase = environments[env] || apiBase; };

// ── KPI Reporting ─────────────────────────────────────────

const report = async (kpiId, kpiDimensionId, value, date) => {
  try {
    const headers = { "monetr-sdk-token": token };
    await axios.post(
      `${apiBase}/kpis/${kpiId}/values/report-realtime/${kpiDimensionId}`,
      { value, date },
      { headers }
    );
    return true;
  } catch (e) {
    console.error(e.message || e);
    return false;
  }
};

const reportBatchApi = async (data) => {
  try {
    const headers = {
      "monetr-sdk-token": token,
      "monetr-data-organization": organization,
    };
    await axios.post(`${apiBase}/sdk/kpi-values/report`, data, { headers });
    return true;
  } catch (e) {
    console.error(e.message || e);
    return false;
  }
};

const reportBatch = async (data) => {
  try {
    const distinctProjectId = [...new Set(data.map((item) => item.projectId))];
    let allSuccess = true;

    for (const projectId of distinctProjectId) {
      const projectData = data.filter((item) => item.projectId === projectId);
      const blocks = Math.ceil(projectData.length / batchSize);

      for (let i = 0; i < blocks; i++) {
        const block = projectData.slice(i * batchSize, (i + 1) * batchSize);
        if (createNewDimensions) {
          block.forEach((item) => { item.create = true; });
        }
        const success = await reportBatchApi(block);
        if (!success) allSuccess = false;
      }
    }

    if (!allSuccess) console.error("Failed to report one or more data blocks.");
    else console.log("Batch reporting completed successfully.");
    return allSuccess;
  } catch (e) {
    console.error("Error in reportBatch:", e.message || e);
    return false;
  }
};

// ── Dashboard Data ────────────────────────────────────────

/**
 * Authenticate with email/password and store the JWT token.
 * Required for dashboard operations (they use user JWT, not SDK token).
 */
const authenticateWithCredentials = async (email, password) => {
  try {
    const response = await axios.post(`${apiBase}/auth/token`, { email, password });
    const jwt = response.data?.accessToken || response.data?.access_token || response.data?.token;
    if (!jwt) throw new Error("No token in auth response");
    token = jwt;
    return true;
  } catch (e) {
    console.error("Authentication failed:", e.message || e);
    return false;
  }
};

const dashboardHeaders = () => ({
  Authorization: `Bearer ${token}`,
});

/**
 * Delete all dashboard data for a project (summary, extras, turnaround).
 */
const deleteDashboardData = async (projectId) => {
  try {
    await axios.delete(
      `${apiBase}/projects/${projectId}/dashboard-data`,
      { headers: dashboardHeaders() }
    );
    return true;
  } catch (e) {
    console.error("Failed to delete dashboard data:", e.message || e);
    return false;
  }
};

/**
 * Upload dashboard data to a project.
 * Accepts { summaryRows, extraRows, turnaroundRows }.
 * Automatically deletes existing data first, then uploads in chunks.
 */
const reportDashboard = async (projectId, data) => {
  const { summaryRows = [], extraRows = [], turnaroundRows = [] } = data;
  const headers = dashboardHeaders();
  const base = `${apiBase}/projects/${projectId}`;
  const axiosOpts = { headers, maxContentLength: Infinity, maxBodyLength: Infinity };

  try {
    // 1. Clear existing data
    console.log(`Clearing existing data for project ${projectId}...`);
    await axios.delete(`${base}/dashboard-data`, { headers });

    // 2. Upload summary rows
    if (summaryRows.length > 0) {
      console.log(`Uploading ${summaryRows.length} summary rows...`);
      for (let i = 0; i < summaryRows.length; i += dashboardChunkSize) {
        const chunk = summaryRows.slice(i, i + dashboardChunkSize);
        await axios.post(`${base}/dashboard-data`, { rows: chunk }, axiosOpts);
      }
    }

    // 3. Upload extra charges
    if (extraRows.length > 0) {
      console.log(`Uploading ${extraRows.length} extra charge rows...`);
      for (let i = 0; i < extraRows.length; i += dashboardChunkSize) {
        const chunk = extraRows.slice(i, i + dashboardChunkSize);
        await axios.post(`${base}/dashboard-extra-charges`, { rows: chunk }, axiosOpts);
      }
    }

    // 4. Upload turnaround
    if (turnaroundRows.length > 0) {
      console.log(`Uploading ${turnaroundRows.length} turnaround rows...`);
      for (let i = 0; i < turnaroundRows.length; i += dashboardChunkSize) {
        const chunk = turnaroundRows.slice(i, i + dashboardChunkSize);
        await axios.post(`${base}/dashboard-turnaround`, { rows: chunk }, axiosOpts);
      }
    }

    console.log("Dashboard upload complete.");
    return true;
  } catch (e) {
    console.error("Dashboard upload failed:", e.message || e);
    return false;
  }
};

exports.monetr = {
  set,
  setToken,
  setEnvironment,
  report,
  reportBatch,
  authenticateWithCredentials,
  deleteDashboardData,
  reportDashboard,
};

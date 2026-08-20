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
// "organization" when `token` holds an organization SDK key, "jwt" when it
// holds a user JWT. Decides which headers the dashboard calls send.
let authMode = null;

const batchSize = 200;
const dashboardChunkSize = 500;

const set = (options) => {
  if (options.token) { token = options.token; authMode = "organization"; }
  if (options.organization) organization = options.organization;
  if (options.environment) apiBase = environments[options.environment] || apiBase;
  if (options.createNewDimensions) createNewDimensions = options.createNewDimensions;
};

const setToken = (t) => { token = t; authMode = "organization"; };
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
 * Use this for an interactive or user-owned caller. Scheduled jobs should
 * instead configure an organization key with
 * `set({ token, organization })` — see `dashboardHeaders`.
 */
const authenticateWithCredentials = async (email, password) => {
  try {
    const response = await axios.post(`${apiBase}/auth/token`, { email, password });
    const jwt = response.data?.accessToken || response.data?.access_token || response.data?.token;
    if (!jwt) throw new Error("No token in auth response");
    token = jwt;
    authMode = "jwt";
    return true;
  } catch (e) {
    console.error("Authentication failed:", e.message || e);
    return false;
  }
};

/**
 * The dashboard routes accept either credential. Send whichever one was
 * configured: an organization key goes in the same two headers the KPI
 * reporting calls use, a user JWT goes in the bearer.
 */
const dashboardHeaders = () =>
  authMode === "organization"
    ? { "monetr-sdk-token": token, "monetr-data-organization": organization }
    : { Authorization: `Bearer ${token}` };

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

/**
 * Upload WC booking rows to a WC_BOOKING project.
 * The API upserts by (project_id, order_id), so incremental re-uploads are
 * safe and no clearing is needed for a sync loop. Pass { clearFirst: true }
 * to wipe the project's rows before uploading (full rebuild).
 */
const reportWcBooking = async (projectId, rows, options = {}) => {
  const headers = dashboardHeaders();
  const base = `${apiBase}/projects/${projectId}/wc-booking-data`;
  const axiosOpts = { headers, maxContentLength: Infinity, maxBodyLength: Infinity };

  try {
    if (options.clearFirst) {
      console.log(`Clearing existing WC booking data for project ${projectId}...`);
      await axios.delete(base, { headers });
    }

    let uploaded = 0;
    for (let i = 0; i < rows.length; i += dashboardChunkSize) {
      const chunk = rows.slice(i, i + dashboardChunkSize);
      await axios.post(base, { rows: chunk }, axiosOpts);
      uploaded += chunk.length;
      console.log(`Uploaded ${uploaded}/${rows.length} WC booking rows...`);
    }

    console.log("WC booking upload complete.");
    return true;
  } catch (e) {
    console.error("WC booking upload failed:", e.message || e);
    return false;
  }
};

/**
 * Flag the orders a full pass did not return — the ones deleted upstream.
 *
 * `seenSince` must be a timestamp taken BEFORE the full pass started: the API
 * flags every row it has not stamped since then. Call this ONLY after a
 * complete, successful upload of every order. After a partial one it would
 * flag orders that are perfectly alive, which is why the API also refuses any
 * reconciliation that would touch more than a fifth of the project.
 *
 * Returns the API's answer ({ flagged, live, refused? }) or null on failure,
 * so the caller can log a refusal instead of treating it as success.
 */
const reconcileWcBooking = async (projectId, seenSince) => {
  const url = `${apiBase}/projects/${projectId}/wc-booking-data/reconcile`;
  try {
    const { data } = await axios.post(
      url,
      { seenSince },
      { headers: dashboardHeaders() }
    );
    if (data && data.refused) {
      console.error(`WC booking reconcile refused: ${data.refused}`);
    } else if (data) {
      console.log(`WC booking reconcile: flagged ${data.flagged} of ${data.live} orders.`);
    }
    return data ?? null;
  } catch (e) {
    console.error("WC booking reconcile failed:", e.message || e);
    return null;
  }
};

/**
 * Upload order notes. Upserts by (project_id, note_id), so re-sending is safe.
 *
 * There are several times more notes than orders — SunSkips holds ~46,000
 * against ~12,700 — so this chunks like the orders upload and reports progress.
 */
const reportWcBookingNotes = async (projectId, rows) => {
  if (!rows.length) return true;

  const headers = dashboardHeaders();
  const base = `${apiBase}/projects/${projectId}/wc-booking-notes`;
  const axiosOpts = { headers, maxContentLength: Infinity, maxBodyLength: Infinity };

  try {
    let uploaded = 0;
    for (let i = 0; i < rows.length; i += dashboardChunkSize) {
      const chunk = rows.slice(i, i + dashboardChunkSize);
      await axios.post(base, { rows: chunk }, axiosOpts);
      uploaded += chunk.length;
      console.log(`Uploaded ${uploaded}/${rows.length} order notes...`);
    }
    console.log("Order notes upload complete.");
    return true;
  } catch (e) {
    console.error("Order notes upload failed:", e.message || e);
    return false;
  }
};

/**
 * Upload order lines. Upserts by (project_id, item_id), so re-sending is safe.
 *
 * Every line travels, container included — the order row already denormalises
 * the container, but a line table that omitted it would be a trap for whoever
 * queries it next. Roughly one line per order plus a few hundred extras, so
 * this is a smaller payload than the notes.
 */
const reportWcBookingLines = async (projectId, rows) => {
  if (!rows.length) return true;

  const headers = dashboardHeaders();
  const base = `${apiBase}/projects/${projectId}/wc-booking-lines`;
  const axiosOpts = { headers, maxContentLength: Infinity, maxBodyLength: Infinity };

  try {
    let uploaded = 0;
    for (let i = 0; i < rows.length; i += dashboardChunkSize) {
      const chunk = rows.slice(i, i + dashboardChunkSize);
      await axios.post(base, { rows: chunk }, axiosOpts);
      uploaded += chunk.length;
      console.log(`Uploaded ${uploaded}/${rows.length} order lines...`);
    }
    console.log("Order lines upload complete.");
    return true;
  } catch (e) {
    console.error("Order lines upload failed:", e.message || e);
    return false;
  }
};

/**
 * Replace the sales rep roster — sent whole, because a rep removed upstream
 * should stop being offered as a filter.
 *
 * An empty list is refused here rather than sent: it almost always means the
 * source could not be read, and wiping the roster over a blip would empty a
 * filter the office relies on.
 */
const reportWcBookingSalesReps = async (projectId, reps) => {
  if (!reps.length) {
    console.error("Sales rep roster is empty — not sending, the existing one is kept.");
    return false;
  }

  try {
    await axios.post(
      `${apiBase}/projects/${projectId}/wc-booking-sales-reps`,
      { rows: reps },
      { headers: dashboardHeaders() }
    );
    console.log(`Sales rep roster updated (${reps.length} reps).`);
    return true;
  } catch (e) {
    console.error("Sales rep roster upload failed:", e.message || e);
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
  reportWcBooking,
  reconcileWcBooking,
  reportWcBookingNotes,
  reportWcBookingLines,
  reportWcBookingSalesReps,
};

/**
 * Prometheus Metrics Middleware
 * 
 * Exposes /api/metrics endpoint with HTTP request metrics.
 * Uses prom-client for Prometheus-compatible metrics.
 * Falls back to a lightweight custom implementation if prom-client is not installed.
 */

let client;
try {
  client = require("prom-client");
} catch {
  // prom-client not installed — use lightweight fallback
  client = null;
}

if (client) {
  // Collect default Node.js metrics (CPU, memory, event loop, etc.)
  client.collectDefaultMetrics({ prefix: "matrimony_" });
}

// Custom counters (lightweight fallback if prom-client is missing)
const metrics = {
  httpRequestsTotal: 0,
  httpRequestDurationSum: 0,
  httpRequestsByRoute: {},
  httpRequestsByStatus: {},
  activeConnections: 0,
};

/**
 * Middleware to track request metrics.
 */
const metricsMiddleware = (req, res, next) => {
  if (client) {
    // Using prom-client histograms
    if (!metricsMiddleware._histogram) {
      metricsMiddleware._histogram = new client.Histogram({
        name: "matrimony_http_request_duration_seconds",
        help: "Duration of HTTP requests in seconds",
        labelNames: ["method", "route", "status"],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      });

      metricsMiddleware._counter = new client.Counter({
        name: "matrimony_http_requests_total",
        help: "Total number of HTTP requests",
        labelNames: ["method", "route", "status"],
      });

      metricsMiddleware._activeGauge = new client.Gauge({
        name: "matrimony_active_connections",
        help: "Number of active connections",
      });
    }

    const end = metricsMiddleware._histogram.startTimer();
    metricsMiddleware._activeGauge.inc();

    res.on("finish", () => {
      const route = req.route?.path || req.path;
      const labels = { method: req.method, route, status: res.statusCode };
      end(labels);
      metricsMiddleware._counter.inc(labels);
      metricsMiddleware._activeGauge.dec();
    });
  } else {
    // Lightweight fallback
    const start = Date.now();
    metrics.httpRequestsTotal++;
    metrics.activeConnections++;

    res.on("finish", () => {
      const duration = (Date.now() - start) / 1000;
      metrics.httpRequestDurationSum += duration;
      metrics.activeConnections--;

      const route = req.route?.path || req.path;
      metrics.httpRequestsByRoute[route] = (metrics.httpRequestsByRoute[route] || 0) + 1;
      metrics.httpRequestsByStatus[res.statusCode] = (metrics.httpRequestsByStatus[res.statusCode] || 0) + 1;
    });
  }

  next();
};

/**
 * GET /api/metrics — Prometheus-compatible metrics endpoint.
 */
const metricsHandler = async (req, res) => {
  if (client) {
    res.set("Content-Type", client.register.contentType);
    const metricsData = await client.register.metrics();
    return res.end(metricsData);
  }

  // Lightweight fallback — plain text format
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();

  let output = `# HELP matrimony_http_requests_total Total HTTP requests\n`;
  output += `# TYPE matrimony_http_requests_total counter\n`;
  output += `matrimony_http_requests_total ${metrics.httpRequestsTotal}\n\n`;

  output += `# HELP matrimony_active_connections Active HTTP connections\n`;
  output += `# TYPE matrimony_active_connections gauge\n`;
  output += `matrimony_active_connections ${metrics.activeConnections}\n\n`;

  output += `# HELP matrimony_process_uptime_seconds Process uptime\n`;
  output += `# TYPE matrimony_process_uptime_seconds gauge\n`;
  output += `matrimony_process_uptime_seconds ${uptime.toFixed(2)}\n\n`;

  output += `# HELP matrimony_process_memory_rss_bytes RSS memory\n`;
  output += `# TYPE matrimony_process_memory_rss_bytes gauge\n`;
  output += `matrimony_process_memory_rss_bytes ${memUsage.rss}\n\n`;

  output += `# HELP matrimony_process_memory_heap_used_bytes Heap used\n`;
  output += `# TYPE matrimony_process_memory_heap_used_bytes gauge\n`;
  output += `matrimony_process_memory_heap_used_bytes ${memUsage.heapUsed}\n`;

  res.set("Content-Type", "text/plain");
  res.end(output);
};

module.exports = { metricsMiddleware, metricsHandler };

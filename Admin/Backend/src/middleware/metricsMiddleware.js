/**
 * Prometheus Metrics Middleware for Admin Backend
 */

let client;
try {
  client = require("prom-client");
} catch {
  client = null;
}

if (client) {
  // Collect default Node.js metrics for Admin process
  client.collectDefaultMetrics({ prefix: "matrimony_admin_" });
}

const metrics = {
  httpRequestsTotal: 0,
  activeConnections: 0,
};

const metricsMiddleware = (req, res, next) => {
  if (client) {
    if (!metricsMiddleware._histogram) {
      metricsMiddleware._histogram = new client.Histogram({
        name: "matrimony_admin_http_request_duration_seconds",
        help: "Duration of Admin HTTP requests in seconds",
        labelNames: ["method", "route", "status"],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      });

      metricsMiddleware._counter = new client.Counter({
        name: "matrimony_admin_http_requests_total",
        help: "Total number of Admin HTTP requests",
        labelNames: ["method", "route", "status"],
      });

      metricsMiddleware._activeGauge = new client.Gauge({
        name: "matrimony_admin_active_connections",
        help: "Number of active Admin connections",
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
    metrics.httpRequestsTotal++;
    metrics.activeConnections++;
    res.on("finish", () => {
      metrics.activeConnections--;
    });
  }
  next();
};

const metricsHandler = async (req, res) => {
  if (client) {
    res.set("Content-Type", client.register.contentType);
    const metricsData = await client.register.metrics();
    return res.end(metricsData);
  }

  // Fallback
  let output = `matrimony_admin_http_requests_total ${metrics.httpRequestsTotal}\n`;
  output += `matrimony_admin_active_connections ${metrics.activeConnections}\n`;
  res.set("Content-Type", "text/plain");
  res.end(output);
};

module.exports = { metricsMiddleware, metricsHandler };

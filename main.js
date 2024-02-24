/* eslint-disable @typescript-eslint/no-var-requires */
const http = require('http');
const httpProxy = require('http-proxy');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const proxyUrl = new URL(process.env.NEXT_PUBLIC_API_BASE_URL);
const proxyHost = proxyUrl.hostname;
const proxyPort = proxyUrl.port;
const apiBaseUrl = process.env.CORS_PROXY_API_BASE_URL;
const origin = process.env.CORS_PROXY_ORIGIN || apiBaseUrl;
const forwardHost = new URL(apiBaseUrl).hostname;

console.log(`Proxy server config: localHost: ${proxyHost} | localPort: ${proxyPort} | forwardHost: ${forwardHost}`);
console.log('Starting proxy server.');

const proxy = httpProxy.createProxyServer({});

let requestOrigin = '';

proxy.on('proxyReq', (proxyReq, request, response) => {
  console.log(`Proxying ${request.method} request to: ${proxyReq.path}`);
  if (request.method === 'OPTIONS') {
    response.setHeader('access-control-allow-origin', requestOrigin);
    response.setHeader('access-control-allow-methods', 'POST,GET,PUT,DELETE,OPTIONS');
    response.setHeader('access-control-allow-headers', proxyReq.getHeader('Access-Control-Request-Headers'));
    response.setHeader('access-control-allow-credentials', 'true');
    response.setHeader('access-control-max-age', '1728000');
    response.statusCode = 204;
    response.setHeader('Content-Length', '0');
    response.setHeader('Keep-Alive', '');
    response.end();
  }
});

proxy.on('proxyRes', function (proxyRes) {
  proxyRes.headers['access-control-allow-origin'] = requestOrigin;
});

const server = http.createServer((req, res) => {
  requestOrigin = req.headers.origin;
  req.headers.origin = origin;
  req.headers.referer = origin + '/';
  proxy.web(req, res, {
    target: apiBaseUrl,
    changeOrigin: true
  });
});

server.listen(proxyPort, proxyHost, () => {
  console.log(`Proxy server started on ${proxyHost}:${proxyPort}`);
});

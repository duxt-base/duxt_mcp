import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./server.js";
import { loadDocs, getAllDocs } from "./docs-loader.js";

const PORT = parseInt(process.env.PORT || "3000", 10);

// Load docs at startup
loadDocs();

const app = express();
app.use(express.json());

// Landing page
app.get("/", (_req, res) => {
  const docs = getAllDocs();
  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Duxt MCP Server</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #080c14;
      color: #e2e8f0;
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* Ambient background */
    .bg-glow {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 0;
    }
    .bg-glow::before {
      content: '';
      position: absolute;
      top: -20%; left: 50%; transform: translateX(-50%);
      width: 800px; height: 600px;
      background: radial-gradient(ellipse, rgba(0,192,232,0.08) 0%, rgba(0,192,232,0.02) 40%, transparent 70%);
    }
    .bg-glow::after {
      content: '';
      position: absolute;
      bottom: -10%; right: -5%;
      width: 600px; height: 500px;
      background: radial-gradient(ellipse, rgba(7,112,134,0.06) 0%, transparent 70%);
    }

    /* Grid pattern */
    .bg-grid {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
      background-size: 64px 64px;
      mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 100%);
      -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 100%);
    }

    .page { position: relative; z-index: 1; }

    .container {
      max-width: 680px;
      margin: 0 auto;
      padding: 4rem 2rem 3rem;
    }

    /* Hero */
    .hero {
      text-align: center;
      margin-bottom: 3.5rem;
    }
    .logo {
      margin-bottom: 1.5rem;
      opacity: 0; animation: fadeUp 0.6s ease forwards;
    }
    .logo svg { width: 180px; height: auto; filter: drop-shadow(0 0 30px rgba(0,192,232,0.15)); }

    .badge {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: rgba(0,192,232,0.08);
      border: 1px solid rgba(0,192,232,0.15);
      color: #22d3ee;
      font-size: 0.7rem; font-weight: 600;
      padding: 0.3rem 0.85rem;
      border-radius: 9999px;
      margin-bottom: 1.25rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      opacity: 0; animation: fadeUp 0.6s ease 0.1s forwards;
    }
    .badge::before {
      content: '';
      width: 6px; height: 6px;
      background: #22d3ee;
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(34,211,238,0.6);
      animation: pulse 2s ease-in-out infinite;
    }

    h1 {
      font-size: 2rem; font-weight: 700;
      margin-bottom: 0.75rem;
      color: #f8fafc;
      letter-spacing: -0.02em;
      line-height: 1.2;
      opacity: 0; animation: fadeUp 0.6s ease 0.15s forwards;
    }
    .subtitle {
      color: #7d8ba0;
      margin-bottom: 0;
      line-height: 1.65;
      font-size: 0.95rem;
      max-width: 520px;
      margin-left: auto; margin-right: auto;
      opacity: 0; animation: fadeUp 0.6s ease 0.2s forwards;
    }

    /* Stats */
    .stats {
      display: flex; justify-content: center; gap: 1rem;
      margin-bottom: 3rem;
      opacity: 0; animation: fadeUp 0.6s ease 0.25s forwards;
    }
    .stat {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px;
      padding: 1.1rem 2rem;
      min-width: 100px;
      text-align: center;
      transition: all 0.25s ease;
    }
    .stat:hover {
      background: rgba(0,192,232,0.04);
      border-color: rgba(0,192,232,0.12);
      transform: translateY(-2px);
    }
    .stat-value {
      font-size: 1.75rem; font-weight: 700;
      color: #22d3ee;
      line-height: 1;
    }
    .stat-label {
      font-size: 0.72rem; font-weight: 500;
      color: #5e6b7f;
      margin-top: 0.35rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    /* Section titles */
    .section-label {
      font-size: 0.68rem; font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
      text-align: center;
    }

    /* Primary setup card */
    .setup-primary {
      background: linear-gradient(135deg, rgba(0,192,232,0.06) 0%, rgba(7,112,134,0.04) 100%);
      border: 1px solid rgba(0,192,232,0.12);
      border-radius: 16px;
      padding: 1.5rem 1.75rem;
      margin-bottom: 1rem;
      opacity: 0; animation: fadeUp 0.6s ease 0.3s forwards;
    }
    .setup-header {
      display: flex; align-items: center; gap: 0.6rem;
      margin-bottom: 1rem;
    }
    .setup-icon {
      width: 32px; height: 32px;
      background: rgba(0,192,232,0.1);
      border: 1px solid rgba(0,192,232,0.15);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .setup-icon svg { width: 16px; height: 16px; }
    .setup-title { font-size: 0.85rem; font-weight: 600; color: #f1f5f9; }
    .setup-desc { font-size: 0.72rem; color: #5e6b7f; }

    /* Code blocks */
    .code-wrap { position: relative; }
    code {
      font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
      background: rgba(0,0,0,0.35);
      color: #67e8f9;
      padding: 0.7rem 2.8rem 0.7rem 1rem;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.04);
      display: block;
      font-size: 0.8rem;
      overflow-x: auto;
      white-space: nowrap;
    }
    .copy-btn {
      position: absolute; right: 0.6rem; top: 50%; transform: translateY(-50%);
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
      color: #475569;
      cursor: pointer;
      padding: 0.35rem;
      border-radius: 6px;
      transition: all 0.2s ease;
      display: flex; align-items: center; justify-content: center;
    }
    .copy-btn:hover { color: #22d3ee; background: rgba(0,192,232,0.08); border-color: rgba(0,192,232,0.15); }
    .copy-btn.copied { color: #34d399; background: rgba(52,211,153,0.08); border-color: rgba(52,211,153,0.15); }

    /* Editor grid */
    .editors {
      display: flex; flex-direction: column; gap: 0.6rem;
      margin-bottom: 3rem;
      opacity: 0; animation: fadeUp 0.6s ease 0.35s forwards;
    }
    .editor-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 14px;
      padding: 1.2rem 1.25rem;
      text-align: left;
      transition: all 0.25s ease;
    }
    .editor-card:hover {
      background: rgba(255,255,255,0.035);
      border-color: rgba(255,255,255,0.08);
      transform: translateY(-1px);
    }
    .editor-name {
      display: flex; align-items: center; gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .editor-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
    }
    .editor-card.claude .editor-dot { background: #d97757; box-shadow: 0 0 8px rgba(217,119,87,0.3); }
    .editor-card.cursor .editor-dot { background: #22d3ee; box-shadow: 0 0 8px rgba(34,211,238,0.3); }
    .editor-card.windsurf .editor-dot { background: #3b82f6; box-shadow: 0 0 8px rgba(59,130,246,0.3); }
    .editor-card.vscode .editor-dot { background: #0078d4; box-shadow: 0 0 8px rgba(0,120,212,0.3); }
    .editor-card h4 { font-size: 0.82rem; font-weight: 600; color: #e2e8f0; }
    .editor-card .editor-file {
      font-size: 0.68rem; color: #475569;
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 0.6rem;
    }
    .editor-card code { font-size: 0.72rem; padding: 0.5rem 2.4rem 0.5rem 0.75rem; }

    /* Capabilities */
    .capabilities {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;
      margin-bottom: 3rem;
      opacity: 0; animation: fadeUp 0.6s ease 0.4s forwards;
    }
    .cap-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 14px;
      padding: 1.25rem;
      text-align: center;
      transition: all 0.25s ease;
    }
    .cap-card:hover {
      background: rgba(255,255,255,0.035);
      border-color: rgba(255,255,255,0.08);
      transform: translateY(-2px);
    }
    .cap-icon {
      width: 40px; height: 40px;
      margin: 0 auto 0.75rem;
      background: rgba(0,192,232,0.06);
      border: 1px solid rgba(0,192,232,0.1);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: #22d3ee;
    }
    .cap-card h4 { font-size: 0.8rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.3rem; }
    .cap-card p { font-size: 0.72rem; color: #5e6b7f; line-height: 1.5; }

    /* Footer */
    .footer {
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid rgba(255,255,255,0.04);
      opacity: 0; animation: fadeUp 0.6s ease 0.45s forwards;
    }
    .footer-links { display: flex; justify-content: center; gap: 2rem; margin-bottom: 1rem; }
    .footer-links a {
      color: #5e6b7f;
      text-decoration: none;
      font-size: 0.82rem; font-weight: 500;
      transition: color 0.2s;
    }
    .footer-links a:hover { color: #22d3ee; }
    .footer-copy {
      font-size: 0.7rem;
      color: #334155;
    }

    /* Animations */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    @media (max-width: 600px) {
      .container { padding: 2.5rem 1.25rem 2rem; }
      h1 { font-size: 1.5rem; }
      .editors { gap: 0.5rem; }
      .capabilities { grid-template-columns: 1fr; }
      .stats { gap: 0.6rem; }
      .stat { padding: 0.8rem 1.2rem; min-width: 80px; }
    }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="bg-grid"></div>
  <div class="page">
    <div class="container">
      <!-- Hero -->
      <div class="hero">
        <div class="logo">
          <svg width="527" height="133" viewBox="0 0 527 133" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M189.191 116C191.401 116 193.191 117.791 193.191 120C193.191 122.209 191.401 124 189.191 124H105.191C102.982 124 101.191 122.209 101.191 120C101.191 117.791 102.982 116 105.191 116H189.191Z" fill="#00C0E8"/>
<path d="M140.096 30C141.546 30.0001 142.741 30.4696 143.68 31.4082C144.618 32.2615 145.088 33.4137 145.088 34.8643V95.0244C145.088 96.5602 144.618 97.7977 143.68 98.7363C142.741 99.5896 141.546 100.016 140.096 100.016C138.645 100.016 137.45 99.5895 136.512 98.7363C135.658 97.7977 135.232 96.5602 135.231 95.0244V90.6582C132.97 93.2658 130.241 95.4481 127.039 97.2002C122.517 99.5894 117.482 100.784 111.936 100.784C105.877 100.784 100.458 99.5468 95.6797 97.0723C90.901 94.5123 87.1031 90.7995 84.2871 85.9355C81.5566 81.0716 80.1914 75.1407 80.1914 68.1436V34.8643C80.1914 33.4989 80.6609 32.3469 81.5996 31.4082C82.5383 30.4695 83.6903 30 85.0557 30C86.5062 30.0001 87.701 30.4696 88.6396 31.4082C89.5782 32.3468 90.0479 33.499 90.0479 34.8643V68.1436C90.0479 73.4342 91.0285 77.7869 92.9912 81.2002C95.0392 84.6135 97.7703 87.1732 101.184 88.8799C104.682 90.5865 108.607 91.4404 112.959 91.4404C117.14 91.4404 120.896 90.6291 124.224 89.0078C127.637 87.3865 130.324 85.1675 132.287 82.3516C134.127 79.7117 135.105 76.7347 135.22 73.4199L135.231 72.752V34.8643C135.231 33.4136 135.658 32.2615 136.512 31.4082C137.45 30.4696 138.645 30 140.096 30Z" fill="#00C0E8"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M66.1758 0C67.6263 5.75914e-05 68.8212 0.469596 69.7598 1.4082C70.6983 2.26152 71.168 3.45632 71.168 4.99219V65.4082C70.9973 72.0641 69.3331 78.0801 66.1758 83.4561C63.1038 88.7466 58.8798 92.928 53.5039 96C48.2134 99.0719 42.2398 100.608 35.584 100.608C28.8427 100.608 22.7832 99.072 17.4072 96C12.0314 92.8427 7.76471 88.5761 4.60742 83.2002C1.5355 77.8243 7.32437e-05 71.723 0 64.8965C0 58.1552 1.49283 52.0957 4.47949 46.7197C7.55148 41.3438 11.6902 37.1198 16.8955 34.0479C22.1008 30.8905 27.9889 29.3115 34.5596 29.3115C40.2769 29.3115 45.4399 30.5498 50.0479 33.0244C54.6557 35.4137 58.3677 38.6135 61.1836 42.624V4.99219C61.1836 3.45619 61.6531 2.26154 62.5918 1.4082C63.5305 0.469564 64.7251 0 66.1758 0ZM35.584 38.2725C30.72 38.2725 26.3247 39.4236 22.3994 41.7275C18.4741 44.0315 15.3597 47.2321 13.0557 51.3281C10.7517 55.3388 9.59961 59.8618 9.59961 64.8965C9.59968 70.0162 10.7518 74.5813 13.0557 78.5918C15.3597 82.6025 18.4741 85.803 22.3994 88.1924C26.3247 90.4963 30.72 91.6484 35.584 91.6484C40.5331 91.6484 44.9277 90.4963 48.7676 88.1924C52.6929 85.803 55.7647 82.6025 57.9834 78.5918C60.2873 74.5813 61.4394 70.0162 61.4395 64.8965C61.4395 59.8618 60.2874 55.3388 57.9834 51.3281C55.7647 47.2321 52.6929 44.0315 48.7676 41.7275C44.9277 39.4237 40.5331 38.2725 35.584 38.2725Z" fill="#00C0E8"/>
<path d="M260.312 32.832C261.591 32.8321 262.658 33.259 263.512 34.1123C264.365 34.8802 264.791 35.9039 264.791 37.1836C264.791 38.3782 264.365 39.4026 263.512 40.2559C262.658 41.0238 261.591 41.4082 260.312 41.4082H245.848V75.584C245.848 79.936 247.127 83.5199 249.688 86.3359C252.247 89.0665 255.533 90.4315 259.543 90.4316H262.999C264.364 90.4316 265.474 90.9013 266.327 91.8398C267.18 92.7785 267.607 93.9732 267.607 95.4238C267.607 96.8745 267.095 98.0691 266.071 99.0078C265.047 99.8611 263.767 100.288 262.231 100.288H259.543C255.021 100.288 250.968 99.2211 247.384 97.0879C243.885 94.9546 241.111 92.0531 239.063 88.3838C237.016 84.6292 235.991 80.3626 235.991 75.584V41.4082H227.672C226.392 41.4082 225.325 41.0238 224.472 40.2559C223.618 39.4025 223.191 38.3783 223.191 37.1836C223.191 35.9038 223.618 34.8802 224.472 34.1123C225.325 33.259 226.392 32.832 227.672 32.832H260.312Z" fill="#00C0E8"/>
<path d="M208.848 30C210.298 30.0001 211.408 30.4696 212.176 31.4082C212.944 32.2615 213.285 33.3285 213.199 34.6084C213.199 35.8029 212.772 36.9552 211.919 38.0645L190.618 64.4248L212.432 92.3359C213.541 93.7011 214.01 94.9812 213.84 96.1758C213.669 97.3704 213.114 98.3095 212.176 98.9922C211.322 99.6749 210.426 100.016 209.487 100.016C208.463 100.016 207.61 99.8452 206.928 99.5039C206.33 99.1626 205.69 98.5652 205.008 97.7119L183.96 70.9463L162.256 98.4805C161.488 99.5043 160.336 100.016 158.8 100.016C157.435 100.016 156.325 99.5895 155.472 98.7363C154.704 97.883 154.277 96.8587 154.191 95.6641C154.191 94.4694 154.661 93.3173 155.6 92.208L177.715 64.5615L156.751 37.9355C155.813 36.8265 155.344 35.6748 155.344 34.4805C155.429 33.2859 155.855 32.2615 156.623 31.4082C157.391 30.4696 158.501 30.0001 159.951 30C161.402 30 162.639 30.5122 163.663 31.5361L184.333 57.9883L204.623 32.3037C205.22 31.4505 205.86 30.8531 206.543 30.5117C207.311 30.1704 208.08 30 208.848 30Z" fill="#00C0E8"/>
<path d="M371.424 103.128C369.547 103.128 367.968 102.531 366.688 101.336C365.493 100.056 364.896 98.4773 364.896 96.6V59.992C364.896 54.616 363.573 50.648 360.928 48.088C358.283 45.4427 354.827 44.12 350.56 44.12C346.123 44.12 342.453 45.656 339.552 48.728C336.736 51.8 335.328 55.7253 335.328 60.504H324.704C324.704 54.9573 325.899 50.0933 328.288 45.912C330.677 41.6453 334.005 38.3173 338.272 35.928C342.624 33.5387 347.573 32.344 353.12 32.344C357.984 32.344 362.293 33.4107 366.048 35.544C369.803 37.6773 372.704 40.8347 374.752 45.016C376.885 49.112 377.952 54.104 377.952 59.992V96.6C377.952 98.4773 377.355 100.056 376.16 101.336C374.965 102.531 373.387 103.128 371.424 103.128ZM286.048 103.128C284.171 103.128 282.592 102.531 281.312 101.336C280.117 100.056 279.52 98.4773 279.52 96.6V39.64C279.52 37.6773 280.117 36.0987 281.312 34.904C282.592 33.7093 284.171 33.112 286.048 33.112C288.011 33.112 289.589 33.7093 290.784 34.904C291.979 36.0987 292.576 37.6773 292.576 39.64V96.6C292.576 98.4773 291.979 100.056 290.784 101.336C289.589 102.531 288.011 103.128 286.048 103.128ZM328.8 103.128C326.923 103.128 325.344 102.531 324.064 101.336C322.869 100.056 322.272 98.4773 322.272 96.6V59.992C322.272 54.616 320.949 50.648 318.304 48.088C315.659 45.4427 312.203 44.12 307.936 44.12C303.499 44.12 299.829 45.656 296.928 48.728C294.027 51.8 292.576 55.7253 292.576 60.504H284.512C284.512 54.9573 285.621 50.0933 287.84 45.912C290.059 41.6453 293.131 38.3173 297.056 35.928C300.981 33.5387 305.461 32.344 310.496 32.344C315.36 32.344 319.669 33.4107 323.424 35.544C327.179 37.6773 330.08 40.8347 332.128 45.016C334.261 49.112 335.328 54.104 335.328 59.992V96.6C335.328 98.4773 334.731 100.056 333.536 101.336C332.341 102.531 330.763 103.128 328.8 103.128Z" fill="#077086"/>
<path d="M421.149 103.512C414.322 103.512 408.221 101.976 402.845 98.904C397.554 95.7467 393.373 91.5227 390.301 86.232C387.314 80.856 385.821 74.7973 385.821 68.056C385.821 61.144 387.314 55 390.301 49.624C393.288 44.248 397.384 40.0667 402.589 37.08C407.794 34.008 413.768 32.472 420.509 32.472C425.544 32.472 430.152 33.4533 434.333 35.416C438.514 37.2933 442.269 40.152 445.597 43.992C446.792 45.3573 447.218 46.7653 446.877 48.216C446.536 49.6667 445.597 50.9467 444.061 52.056C442.866 52.9093 441.544 53.208 440.093 52.952C438.642 52.6107 437.32 51.8427 436.125 50.648C431.944 46.2107 426.738 43.992 420.509 43.992C416.157 43.992 412.317 45.016 408.989 47.064C405.661 49.0267 403.058 51.8 401.181 55.384C399.304 58.968 398.365 63.192 398.365 68.056C398.365 72.664 399.304 76.76 401.181 80.344C403.144 83.928 405.832 86.7867 409.245 88.92C412.658 90.968 416.626 91.992 421.149 91.992C424.136 91.992 426.738 91.6507 428.957 90.968C431.261 90.2 433.352 89.048 435.229 87.512C436.594 86.4027 438.002 85.8053 439.453 85.72C440.904 85.5493 442.184 85.9333 443.293 86.872C444.744 88.0667 445.554 89.432 445.725 90.968C445.896 92.4187 445.384 93.7413 444.189 94.936C438.045 100.653 430.365 103.512 421.149 103.512Z" fill="#077086"/>
<path d="M462.568 132.952C460.691 132.952 459.112 132.312 457.832 131.032C456.637 129.837 456.04 128.301 456.04 126.424V68.056C456.125 61.3147 457.704 55.256 460.776 49.88C463.848 44.504 468.029 40.28 473.32 37.208C478.611 34.0507 484.584 32.472 491.24 32.472C497.981 32.472 503.997 34.0507 509.288 37.208C514.579 40.28 518.76 44.504 521.832 49.88C524.989 55.256 526.568 61.3147 526.568 68.056C526.568 74.7973 525.117 80.856 522.216 86.232C519.4 91.5227 515.517 95.7467 510.568 98.904C505.619 101.976 500.029 103.512 493.8 103.512C488.765 103.512 484.115 102.488 479.848 100.44C475.667 98.3067 472.083 95.448 469.096 91.864V126.424C469.096 128.301 468.499 129.837 467.304 131.032C466.109 132.312 464.531 132.952 462.568 132.952ZM491.24 91.992C495.592 91.992 499.475 90.968 502.888 88.92C506.301 86.7867 508.989 83.928 510.952 80.344C513 76.6747 514.024 72.5787 514.024 68.056C514.024 63.448 513 59.352 510.952 55.768C508.989 52.0987 506.301 49.24 502.888 47.192C499.475 45.0587 495.592 43.992 491.24 43.992C486.973 43.992 483.091 45.0587 479.592 47.192C476.179 49.24 473.491 52.0987 471.528 55.768C469.565 59.352 468.584 63.448 468.584 68.056C468.584 72.5787 469.565 76.6747 471.528 80.344C473.491 83.928 476.179 86.7867 479.592 88.92C483.091 90.968 486.973 91.992 491.24 91.992Z" fill="#077086"/>
</svg>
        </div>
        <span class="badge">Live</span>
        <h1>AI-Powered Framework Knowledge</h1>
        <p class="subtitle">Give Claude Code, Cursor, Windsurf, and other AI tools full access to Duxt framework documentation, code generation, and CLI helpers.</p>
      </div>

      <!-- Stats -->
      <div class="stats">
        <div class="stat"><div class="stat-value">${docs.length}</div><div class="stat-label">Docs</div></div>
        <div class="stat"><div class="stat-value">5</div><div class="stat-label">Tools</div></div>
        <div class="stat"><div class="stat-value">3</div><div class="stat-label">Prompts</div></div>
      </div>

      <!-- Quick setup -->
      <p class="section-label">Quick Setup</p>
      <div class="setup-primary">
        <div class="setup-header">
          <div class="setup-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="#22d3ee"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
          </div>
          <div>
            <div class="setup-title">Claude Code</div>
            <div class="setup-desc">Run in your terminal</div>
          </div>
        </div>
        <div class="code-wrap">
          <code id="cc-cmd">claude mcp add duxt --transport http https://mcp.duxt.dev/mcp</code>
          <button class="copy-btn" onclick="copyText('cc-cmd')" title="Copy">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
        </div>
      </div>

      <!-- Editor cards -->
      <div class="editors">
        <div class="editor-card claude">
          <div class="editor-name"><div class="editor-dot"></div><h4>Claude Desktop</h4></div>
          <div class="editor-file">claude_desktop_config.json</div>
          <div class="code-wrap">
            <code id="cd-cfg">{ "mcpServers": { "duxt": { "url": "https://mcp.duxt.dev/mcp" } } }</code>
            <button class="copy-btn" onclick="copyText('cd-cfg')" title="Copy">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
          </div>
        </div>
        <div class="editor-card cursor">
          <div class="editor-name"><div class="editor-dot"></div><h4>Cursor</h4></div>
          <div class="editor-file">.cursor/mcp.json</div>
          <div class="code-wrap">
            <code id="cur-cfg">{ "mcpServers": { "duxt": { "url": "https://mcp.duxt.dev/mcp" } } }</code>
            <button class="copy-btn" onclick="copyText('cur-cfg')" title="Copy">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
          </div>
        </div>
        <div class="editor-card windsurf">
          <div class="editor-name"><div class="editor-dot"></div><h4>Windsurf</h4></div>
          <div class="editor-file">~/.codeium/windsurf/mcp_config.json</div>
          <div class="code-wrap">
            <code id="ws-cfg">{ "mcpServers": { "duxt": { "serverUrl": "https://mcp.duxt.dev/mcp" } } }</code>
            <button class="copy-btn" onclick="copyText('ws-cfg')" title="Copy">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
          </div>
        </div>
        <div class="editor-card vscode">
          <div class="editor-name"><div class="editor-dot"></div><h4>VS Code + Copilot</h4></div>
          <div class="editor-file">.vscode/mcp.json</div>
          <div class="code-wrap">
            <code id="vs-cfg">{ "servers": { "duxt": { "type": "http", "url": "https://mcp.duxt.dev/mcp" } } }</code>
            <button class="copy-btn" onclick="copyText('vs-cfg')" title="Copy">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Capabilities -->
      <p class="section-label">Capabilities</p>
      <div class="capabilities">
        <div class="cap-card">
          <div class="cap-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <h4>Documentation</h4>
          <p>${docs.length} pages across CLI, ORM, HTML, Signals, and Icons</p>
        </div>
        <div class="cap-card">
          <div class="cap-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <h4>Code Generation</h4>
          <p>Models, pages, components, APIs, and layouts</p>
        </div>
        <div class="cap-card">
          <div class="cap-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h4>Smart Search</h4>
          <p>Full-text search with relevance scoring across all docs</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-links">
          <a href="https://duxt.dev">Docs</a>
          <a href="https://github.com/duxt-base/duxt">GitHub</a>
          <a href="https://pub.dev/packages/duxt">pub.dev</a>
          <a href="/health">Health</a>
        </div>
        <p class="footer-copy">duxt.dev</p>
      </div>
    </div>
  </div>
  <script>
    function copyText(id) {
      const el = document.getElementById(id);
      navigator.clipboard.writeText(el.textContent.trim());
      const btn = el.parentElement.querySelector('.copy-btn');
      btn.classList.add('copied');
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
      }, 1500);
    }
  </script>
</body>
</html>`);
});

// Health check
app.get("/health", (_req, res) => {
  const docs = getAllDocs();
  res.json({
    status: "ok",
    server: "duxt-mcp",
    version: "0.1.0",
    docs: docs.length,
  });
});

// MCP endpoint — stateless, JSON responses, no auth
app.post("/mcp", async (req, res) => {
  // Each request gets a fresh transport+server (stateless)
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session tracking
    enableJsonResponse: true, // JSON instead of SSE
  });

  const server = createMcpServer();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);

  // Clean up after response
  await server.close();
});

app.get("/mcp", async (req, res) => {
  // Stateless server doesn't support GET SSE streams
  res.status(405).json({ error: "Method not allowed. Use POST." });
});

app.delete("/mcp", async (req, res) => {
  // Stateless server doesn't support DELETE
  res.status(405).json({ error: "Method not allowed. Stateless server." });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  const docs = getAllDocs();
  console.log(`duxt-mcp server running on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  MCP:    http://localhost:${PORT}/mcp`);
  console.log(`  Docs loaded: ${docs.length}`);
});

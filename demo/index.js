import WindGL from "./WindGL.js";
import { GUI } from "https://cdn.jsdelivr.net/npm/lil-gui@0.16.1/dist/lil-gui.esm.min.js";

// util
export const fetchJSON = async (url) => (await fetch(url)).json();

export const addCSS = (css) => {
  const getStyle = () => {
    if (!document.styleSheets.length) {
      const style = document.createElement("style");
      document.head.appendChild(style);
    }
    return document.styleSheets[0];
  };
  const style = getStyle();
  style.insertRule(css);
};

// coast
const drawCoast = async () => {
  const urlCoastline = "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_coastline.geojson";
  const data = await fetchJSON(urlCoastline);
  const canvas = document.getElementById("coastline");
  canvas.width = canvas.clientWidth * pxRatio;
  canvas.height = canvas.clientHeight * pxRatio;

  const ctx = canvas.getContext("2d");
  ctx.lineWidth = pxRatio;
  ctx.lineJoin = ctx.lineCap = "round";
  ctx.strokeStyle = "white";
  ctx.beginPath();

  for (let i = 0; i < data.features.length; i++) {
    const line = data.features[i].geometry.coordinates;
    for (let j = 0; j < line.length; j++) {
      ctx[j ? "lineTo" : "moveTo"](
        (line[j][0] + 180) * canvas.width / 360,
        (-line[j][1] + 90) * canvas.height / 180
      );
    }
  }
  ctx.stroke();
};
drawCoast();

// wind
const canvas = document.getElementById("canvas");

const pxRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

const gl = canvas.getContext("webgl", { antialiasing: false });

const wind = window.wind = new WindGL(gl);
wind.numParticles = 65536;

const frame = () => {
  if (wind.windData) {
    wind.draw();
  }
  requestAnimationFrame(frame);
};
frame();

const gui = new GUI();
addCSS(".lil-gui.autoPlace { left: 15px; }");

gui.add(wind, "numParticles", 1024, 589824);
gui.add(wind, "fadeOpacity", 0.96, 0.999).step(0.001).updateDisplay();
gui.add(wind, "speedFactor", 0.05, 1.0);
gui.add(wind, "dropRate", 0, 0.1);
gui.add(wind, "dropRateBump", 0, 0.2);

const url = "https://github.com/taisukef/webgl-wind";

const meta = {
  "2021-06-27+h": 0,
  "retina resolution": true,
};
meta[url] = () => window.location = url;

const windFiles = {
   0: "2021062700",
  24: "2021062800",
  48: "2021062900",
  72: "2021063000",
  96: "2021070100",
};
const updateWind = async (name) => {
  const windData = await fetchJSON("wind/" + windFiles[name] + ".json");
  const windImage = new Image();
  windData.image = windImage;
  windImage.src = "wind/" + windFiles[name] + ".png";
  windImage.onload = () => wind.setWind(windData);
};
gui.add(meta, "2021-06-27+h", 0, 96, 24).onFinishChange(updateWind);

const updateRetina = () => {
  const ratio = meta["retina resolution"] ? pxRatio : 1;
  canvas.width = canvas.clientWidth * ratio;
  canvas.height = canvas.clientHeight * ratio;
  wind.resize();
};
if (pxRatio !== 1) {
  gui.add(meta, "retina resolution").onFinishChange(updateRetina);
}
gui.add(meta, url);
gui.close();

updateWind(0);
updateRetina();

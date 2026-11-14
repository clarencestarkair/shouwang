/* 录制演示素材：node record.js <scene>；输出 /tmp/sw-video/clips/<scene>*.webm 与 marks JSON */
const { chromium } = require("playwright");
const fs = require("fs");
const BASE = "http://localhost:3311";
const OUT = "/tmp/sw-video/clips";
const scene = process.argv[2];

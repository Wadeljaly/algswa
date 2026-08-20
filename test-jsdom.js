const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');

const dom = new JSDOM(html, {
    url: "http://localhost/", // Important for localStorage
    runScripts: "dangerously",
    resources: "usable"
});

dom.window.onerror = function (msg, file, line, col, error) {
    console.error("JSDOM Error:");
    console.error(msg, file, line, col);
    if(error) console.error(error);
};

// Wait for scripts to load and trigger load event
setTimeout(() => {
    console.log("App ready...");
}, 2000);

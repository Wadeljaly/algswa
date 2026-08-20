const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');

// Minimal mock to prevent Chart from crashing JSDOM missing Canvas methods
const scriptText = `
    window.Chart = function() {};
    window.Chart.getChart = function() { return undefined; };
`;

const dom = new JSDOM(html.replace('<head>', '<head><script>' + scriptText + '</script>'), {
    url: "http://localhost/", // Important for localStorage
    runScripts: "dangerously",
    resources: "usable"
});

dom.window.onerror = function (msg, file, line, col, error) {
    fs.appendFileSync('jsdom_errors.log', 'UI Error: ' + msg + ' at line ' + line + '\n');
};

setTimeout(() => {
    try {
        const w = dom.window;
        
        // Ensure Database matches localstorage
        if(w.db) w.db.init();

        // 1. Simulate login
        if (w.App) {
           w.App.init();
           w.App.login();
        }

        // 2. Try dashboard
        if (w.dashboardController) w.dashboardController.render(w.document.body);
        
        // 3. Try accounts
        if (w.accountsController) w.accountsController.render(w.document.body);

        // 4. Try products
        if (w.productsController) w.productsController.render(w.document.body);

        // 5. Try sales
        if (w.salesController) w.salesController.render(w.document.body);

        fs.appendFileSync('jsdom_errors.log', 'Render test passed successfully.\n');
    } catch (e) {
        fs.appendFileSync('jsdom_errors.log', 'Manual Render Error: ' + e.message + '\n' + e.stack + '\n');
    }
}, 3000);

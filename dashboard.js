window.dashboardController = {
    render(container) {
        const stats = this.calculateStats();
        const settings = db.getSettings();
        const companyName = settings.companyName || "نظام المبيعات";

        container.innerHTML = `
            <div id="dashboard-view" class="view-entry">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem;">
                    <div>
                        <h1 style="font-weight: 950; font-size: 2.2rem; margin: 0; color: var(--text-main);">مرحباً بك في ${companyName}</h1>
                        <p style="color: var(--text-secondary); font-weight: 700;">إليك ملخص أداء العمليات لليوم</p>
                    </div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card-nm">
                        <div class="icon" style="color: var(--success);"><i data-lucide="trending-up"></i></div>
                        <div class="details">
                            <h3>مبيعات اليوم</h3>
                            <p class="value">${stats.dailySales.toLocaleString()}</p>
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);">${settings.currency}</span>
                        </div>
                    </div>
                    <div class="stat-card-nm">
                        <div class="icon" style="color: var(--danger);"><i data-lucide="wallet"></i></div>
                        <div class="details">
                            <h3>منصرفات اليوم</h3>
                            <p class="value" style="color: var(--danger);">${stats.dailyExpenses.toLocaleString()}</p>
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);">${settings.currency}</span>
                        </div>
                    </div>
                    <div class="stat-card-nm">
                        <div class="icon" style="color: var(--primary-color);"><i data-lucide="calculator"></i></div>
                        <div class="details">
                            <h3>صافي الدخل</h3>
                            <p class="value" style="color: ${stats.dailyNetIncome >= 0 ? 'var(--primary-color)' : 'var(--danger)'};">${stats.dailyNetIncome.toLocaleString()}</p>
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);">${settings.currency}</span>
                        </div>
                    </div>
                    <div class="stat-card-nm">
                        <div class="icon" style="color: var(--warning);"><i data-lucide="alert-circle"></i></div>
                        <div class="details">
                            <h3>النواقص</h3>
                            <p class="value" style="color: var(--warning);">${stats.lowStockCount.toLocaleString()}</p>
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);">صنف يحتاج طلب</span>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 2.5rem;">
                    <div class="stat-card-nm">
                        <h3 style="margin-bottom: 1.5rem;">تحليل المبيعات الأسبوعي</h3>
                        <canvas id="salesChart" height="180"></canvas>
                    </div>
                    <div class="stat-card-nm">
                         <h3 style="margin-bottom: 1.5rem;">آخر إشعارات النظام</h3>
                         <div id="latest-alerts">
                             ${this.renderAlerts(stats.alerts)}
                         </div>
                    </div>
                </div>
            </div>
        `;

        this.initCharts();
        lucide.createIcons();
    },

    calculateStats() {
        const products = db.getCollection('products');
        const sales = db.getCollection('sales');
        const customers = db.getCollection('customers');
        const expenses = db.getCollection('expenses');
        const lowStockProducts = products.filter(p => p.quantity <= (p.minStock || 5));
        
        const today = new Date().toISOString().split('T')[0];
        
        const totalSalesToday = sales.filter(s => s.date.startsWith(today)).reduce((sum, s) => sum + s.total, 0);
        const totalExpensesToday = expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);
        const netIncomeToday = totalSalesToday - totalExpensesToday;

        return {
            dailySales: totalSalesToday,
            dailyExpenses: totalExpensesToday,
            dailyNetIncome: netIncomeToday,
            productCount: products.length,
            customerCount: customers.length,
            lowStockCount: lowStockProducts.length,
            alerts: lowStockProducts.slice(0, 4).map(p => `نفاد وشيك لمخزون: ${p.name}`)
        };
    },

    renderAlerts(alerts) {
        if (alerts.length === 0) return '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">لا توجد تنبيهات عاجلة حالياً</p>';
        return alerts.map(alert => `
            <div class="neumorph-inset" style="padding: 1.2rem; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 1rem; border-right: 5px solid var(--danger);">
               <i data-lucide="bell-ring" style="width: 18px; color: var(--danger)"></i>
               <span style="font-size: 0.9rem; font-weight: 700;">${alert}</span>
            </div>
        `).join('');
    },

    initCharts() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        const sales = db.getCollection('sales') || [];
        const weekData = [0, 0, 0, 0, 0, 0, 0];
        const now = new Date();
        
        sales.forEach(sale => {
            if (sale.date) {
                const saleDate = new Date(sale.date);
                const diffDays = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24); 
                if (diffDays >= 0 && diffDays <= 7) {
                    weekData[saleDate.getDay()] += sale.total || 0;
                }
            }
        });
        
        const chartData = [weekData[6], weekData[0], weekData[1], weekData[2], weekData[3], weekData[4], weekData[5]];

        try {
            if (window.salesChartInstance) window.salesChartInstance.destroy();
            window.salesChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
                    datasets: [{
                        data: chartData,
                        borderColor: '#0c56d0',
                        backgroundColor: 'rgba(12, 86, 208, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#0c56d0',
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            grid: { color: 'rgba(0,0,0,0.02)' },
                            ticks: { font: { family: 'Cairo' } }
                        },
                        x: { 
                            grid: { display: false },
                            ticks: { font: { family: 'Cairo' } }
                        }
                    }
                }
            });
        } catch (error) { console.error("Chart error:", error); }
    }
};

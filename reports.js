window.reportsController = {
    currentPeriod: 'all',

    render(container, activeTab = 'summary') {
        const sales = db.getCollection('sales');
        const purchases = db.getCollection('purchases');
        const expenses = db.getCollection('expenses');
        const products = db.getCollection('products');
        const customers = db.getCollection('customers');
        const suppliers = db.getCollection('suppliers');
        const settings = db.getSettings();

        // 1. Filter data based on currentPeriod
        const filteredSales = this.filterByPeriod(sales, this.currentPeriod);
        const filteredPurchases = this.filterByPeriod(purchases, this.currentPeriod);
        const filteredExpenses = this.filterByPeriod(expenses, this.currentPeriod);

        // 2. Financial Calculations for the selected period
        const totalSalesVal = filteredSales.reduce((s, i) => s + i.total, 0);
        const totalExpenses = filteredExpenses.reduce((s, i) => s + (i.amount || 0), 0);
        
        // Calculate Cost of Goods Sold (COGS) for accurate profit
        let totalCOGS = 0;
        filteredSales.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    // Use item.costPrice if saved with sale, else try to find product's current costPrice
                    const cost = item.costPrice !== undefined ? item.costPrice : (products.find(p => p.id === item.id)?.costPrice || item.price * 0.7); // fallback to 70% if no cost found
                    totalCOGS += (cost * item.quantity);
                });
            }
        });

        const grossProfit = totalSalesVal - totalCOGS;
        const netProfit = grossProfit - totalExpenses;

        // Inventory values (always current)
        const capital = products.reduce((s, p) => s + ((p.costPrice || p.price) * p.quantity), 0);
        
        const cashSales = filteredSales.filter(s => s.paymentMethod === 'cash').reduce((s, i) => s + i.total, 0);
        const bankakSales = filteredSales.filter(s => s.paymentMethod === 'bankak').reduce((s, i) => s + i.total, 0);

        // Debt Calculations (always current balances)
        const totalCustomerDebt = customers.reduce((s, c) => s + (c.balance || 0), 0);
        const totalSupplierDebt = suppliers.reduce((s, sup) => s + (sup.balance || 0), 0);

        container.style.padding = '0';
        container.style.overflow = 'hidden';

        container.innerHTML = `
            <div class="tager-pos-view view-entry">
                <div class="tager-top-tabs">
                    <div class="tager-tab ${activeTab === 'summary' ? 'active' : ''}" onclick="reportsController.render(document.getElementById('view-container'), 'summary')"><i data-lucide="bar-chart-2" style="width:14px;"></i> التقرير المالي</div>
                    <div class="tager-tab ${activeTab === 'expenses' ? 'active' : ''}" onclick="reportsController.render(document.getElementById('view-container'), 'expenses')"><i data-lucide="wallet" style="width:14px;"></i> سجل المنصرفات</div>
                    <div class="tager-tab ${activeTab === 'inventory' ? 'active' : ''}" onclick="reportsController.render(document.getElementById('view-container'), 'inventory')"><i data-lucide="package" style="width:14px;"></i> جرد المخزون</div>
                    <div class="tager-tab ${activeTab === 'debts' ? 'active' : ''}" onclick="reportsController.render(document.getElementById('view-container'), 'debts')"><i data-lucide="users" style="width:14px;"></i> الديون والمديونيات</div>
                </div>

                <div class="tager-main-layout">
                    <div class="tager-main-content">
                        ${activeTab === 'summary' ? this.renderSummary(totalSalesVal, totalCOGS, totalExpenses, netProfit, capital, settings, filteredSales, cashSales, bankakSales, totalCustomerDebt, totalSupplierDebt) : ''}
                        ${activeTab === 'expenses' ? this.renderExpenses(expenses, settings) : ''}
                        ${activeTab === 'inventory' ? this.renderInventory(products, settings) : ''}
                        ${activeTab === 'debts' ? this.renderDebts(customers, suppliers, settings) : ''}
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();
    },

    filterByPeriod(data, period) {
        if (!period || period === 'all') return data;
        
        const now = new Date();
        const todayAtZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        return data.filter(item => {
            const itemDate = new Date(item.date).getTime();
            
            if (period === 'daily') {
                return itemDate >= todayAtZero;
            } else if (period === 'weekly') {
                const weekAgo = todayAtZero - (7 * 24 * 60 * 60 * 1000);
                return itemDate >= weekAgo;
            } else if (period === 'monthly') {
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
                return itemDate >= monthAgo;
            } else if (period === 'yearly') {
                const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
                return itemDate >= yearAgo;
            }
            return true;
        });
    },

    setPeriod(period) {
        this.currentPeriod = period;
        this.render(document.getElementById('view-container'), 'summary');
    },

    renderSummary(totalSalesVal, totalCOGS, totalExpenses, netProfit, capital, settings, sales, cashSales, bankakSales, customerDebt, supplierDebt) {
        const periodLabels = {
            'all': 'كل الأوقات',
            'daily': 'تقرير اليوم',
            'weekly': 'تقرير الأسبوع',
            'monthly': 'تقرير الشهر',
            'yearly': 'تقرير السنة'
        };

        return `
            <div style="padding: 20px; overflow-y: auto; height: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <h1 style="font-weight: 900; margin:0; font-size: 1.8rem;">تحليل الأرباح والخلاصة</h1>
                        <p style="color: var(--text-secondary); font-weight: 700;">${periodLabels[this.currentPeriod]} - تحليل شامل للعمليات</p>
                    </div>

                    <div style="display: flex; gap: 5px; background: #e0e5ec; padding: 5px; border-radius: 12px; box-shadow: inset 3px 3px 6px #b8bec9, inset -3px -3px 6px #ffffff;">
                        <button class="period-btn ${this.currentPeriod === 'daily' ? 'active' : ''}" onclick="reportsController.setPeriod('daily')">يومي</button>
                        <button class="period-btn ${this.currentPeriod === 'weekly' ? 'active' : ''}" onclick="reportsController.setPeriod('weekly')">أسبوعي</button>
                        <button class="period-btn ${this.currentPeriod === 'monthly' ? 'active' : ''}" onclick="reportsController.setPeriod('monthly')">شهري</button>
                        <button class="period-btn ${this.currentPeriod === 'yearly' ? 'active' : ''}" onclick="reportsController.setPeriod('yearly')">سنوي</button>
                        <button class="period-btn ${this.currentPeriod === 'all' ? 'active' : ''}" onclick="reportsController.setPeriod('all')">الكل</button>
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <button class="tager-arrow-btn blue" style="padding: 0 1.5rem; height:45px;" onclick="reportsController.printFullReport()">
                            <i data-lucide="printer" style="width:16px;"></i> \u0637\u0628\u0627\u0639\u0629 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u0634\u0627\u0645\u0644
                        </button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1rem;">
                    ${this.kpiCard('database', 'رأس مال المخزون', capital, settings.currency, 'var(--info-color)')}
                    ${this.kpiCard('trending-up', 'إجمالي المبيعات', totalSalesVal, settings.currency, 'var(--primary-color)')}
                    ${this.kpiCard('shopping-bag', 'تكلفة المبيعات', totalCOGS, settings.currency, '#7f8c8d')}
                    ${this.kpiCard('dollar-sign', 'صافي الربح', netProfit, settings.currency, netProfit >= 0 ? 'var(--success)' : 'var(--danger-color)')}
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
                    ${this.kpiCard('wallet', 'إجمالي المنصرفات', totalExpenses, settings.currency, '#e67e22')}
                    ${this.kpiCard('users', 'ديون العملاء (لنا)', customerDebt, settings.currency, '#27ae60')}
                    ${this.kpiCard('truck', 'ديون الموردين (علينا)', supplierDebt, settings.currency, '#e74c3c')}
                </div>

                <style>
                    .period-btn {
                        border: none;
                        padding: 8px 15px;
                        border-radius: 8px;
                        font-family: 'Cairo', sans-serif;
                        font-weight: 800;
                        font-size: 0.8rem;
                        cursor: pointer;
                        transition: all 0.2s;
                        background: transparent;
                        color: var(--text-secondary);
                    }
                    .period-btn.active {
                        background: var(--primary-color);
                        color: white;
                        box-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                    }
                </style>

                <div class="stat-card-nm" style="padding: 1.5rem;">
                    <h3 style="font-weight: 900; font-size: 1.2rem; margin-bottom:1rem;">مبيعات هذه الفترة (${sales.length})</h3>
                    <div style="max-height: 400px; overflow-y: auto;">
                        <table class="erp-table">
                            <thead>
                                <tr>
                                    <th width="80">رقم</th>
                                    <th width="120">التاريخ</th>
                                    <th>العميل</th>
                                    <th width="150">الإجمالي</th>
                                    <th width="100">الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderRecentSales(sales, settings)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderExpenses(expenses, settings) {
        const today = new Date().toISOString().split('T')[0];
        const todayTotal = expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);

        return `
            <div style="padding: 0; display:flex; flex-direction:column; height:100%;">
                <div class="tager-main-header" style="height:auto; padding:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <div style="display:flex; gap:15px;">
                            <div style="background:#fff; border:1px solid #ddd; padding:5px 15px; border-radius:4px;">
                                <div style="font-size:0.7rem; color:#7f8c8d; font-weight:800;">منصرفات اليوم</div>
                                <div style="font-size:1.1rem; font-weight:900; color:#e74c3c;">${todayTotal.toLocaleString()} ${settings.currency}</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button class="tager-arrow-btn blue" onclick="expensesController.showAddModal()" style="padding:0 15px; height:40px;"><i data-lucide="plus" style="width:14px;"></i> إضافة منصرف</button>
                            <button class="tager-arrow-btn" onclick="expensesController.showCategoryModal()" style="padding:0 15px; height:40px;">إدارة البنود</button>
                        </div>
                    </div>
                </div>
                <div class="tager-table-container">
                    <table class="tager-grid">
                        <thead>
                            <tr>
                                <th width="50">م</th>
                                <th width="120">التاريخ</th>
                                <th width="140">البند</th>
                                <th>البيان</th>
                                <th width="120">المبلغ</th>
                                <th width="80">إجراء</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expenses.map((e, i) => `
                                <tr>
                                    <td>${i+1}</td>
                                    <td>${e.date}</td>
                                    <td style="font-weight:800;">${e.category}</td>
                                    <td>${e.notes || ''}</td>
                                    <td style="font-weight:900; color:#e74c3c;">${e.amount.toLocaleString()}</td>
                                    <td>
                                        <button class="tager-arrow-btn" style="width:24px; height:24px; padding:0; color:#e74c3c;" onclick="expensesController.handleDelete(${e.id})"><i data-lucide="trash-2" style="width:12px;"></i></button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderInventory(products, settings) {
        return `
            <div style="padding: 20px; overflow-y: auto; height: 100%;">
                <h3 style="font-weight: 900; margin-bottom: 1.5rem;">تقرير جرد المخزون الحالي</h3>
                <table class="erp-table">
                    <thead>
                        <tr>
                            <th>المنتج</th>
                            <th>التصنيف</th>
                            <th>الكمية المتوفرة</th>
                            <th>سعر البيع</th>
                            <th>إجمالي القيمة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(p => `
                            <tr>
                                <td style="font-weight:800;">${p.name}</td>
                                <td>${p.category}</td>
                                <td style="font-weight:900; color:${p.quantity <= (p.minStock || 5) ? 'var(--danger)' : 'var(--text-main)'}">${p.quantity}</td>
                                <td>${p.price.toLocaleString()}</td>
                                <td style="font-weight:900;">${(p.price * p.quantity).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderDebts(customers, suppliers, settings) {
        const cDebts = customers.filter(c => (c.balance || 0) > 0);
        const sDebts = suppliers.filter(s => (s.balance || 0) > 0);

        return `
            <div style="padding: 20px; overflow-y: auto; height: 100%;">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h3 style="font-weight: 900; margin-bottom: 1rem; color:#27ae60;">\u0645\u062f\u064a\u0648\u0646\u064a\u0627\u062a \u0627\u0644\u0637\u0644\u0627\u0628 (\u0644\u0646\u0627 \u0639\u0646\u062f \u0627\u0644\u0639\u0645\u0644\u0627\u0621)</h3>
                        <table class="erp-table">
                            <thead><tr><th>\u0627\u0644\u0639\u0645\u064a\u0644</th><th>\u0627\u0644\u0645\u0628\u0644\u063a</th></tr></thead>
                            <tbody>
                                ${cDebts.length ? cDebts.map(c => `<tr><td style="font-weight:800;">${c.name}</td><td style="font-weight:900; color:#27ae60;">${(c.balance || 0).toLocaleString()}</td></tr>`).join('') : '<tr><td colspan="2">\u0644\u0627 \u062a\u0648\u062c\u062f \u062f\u064a\u0648\u0646</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h3 style="font-weight: 900; margin-bottom: 1rem; color:#e74c3c;">\u0645\u062f\u064a\u0648\u0646\u064a\u0627\u062a \u0627\u0644\u0645\u0648\u0631\u062f\u064a\u0646 (\u0639\u0644\u064a\u0646\u0627 \u0644\u0644\u0645\u0648\u0631\u062f\u064a\u0646)</h3>
                        <table class="erp-table">
                            <thead><tr><th>\u0627\u0644\u0645\u0648\u0631\u062f</th><th>\u0627\u0644\u0645\u0628\u0644\u063a</th></tr></thead>
                            <tbody>
                                ${sDebts.length ? sDebts.map(s => `<tr><td style="font-weight:800;">${s.name}</td><td style="font-weight:900; color:#e74c3c;">${(s.balance || 0).toLocaleString()}</td></tr>`).join('') : '<tr><td colspan="2">\u0644\u0627 \u062a\u0648\u062c\u062f \u062f\u064a\u0648\u0646</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    kpiCard(icon, label, value, unit, color, isAmount = true) {
        const displayVal = isAmount
            ? `${value.toLocaleString('ar-EG', { maximumFractionDigits: 0 })}`
            : value.toLocaleString();

        return `
            <div class="stat-card-nm" style="padding: 1.2rem; gap: 0;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                    <span style="font-weight: 800; font-size: 0.9rem; color: var(--text-secondary);">${label}</span>
                    <div class="neumorph" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: ${color};">
                        <i data-lucide="${icon}" style="width: 18px;"></i>
                    </div>
                </div>
                <p style="font-size: 1.5rem; font-weight: 950; color: ${color}; line-height: 1;">${displayVal}</p>
                <span style="font-size: 0.8rem; font-weight: 800; color: var(--text-secondary); margin-top: 0.4rem;">${unit}</span>
            </div>
        `;
    },

    renderRecentSales(sales, settings) {
        if (sales.length === 0) {
            return `<tr><td colspan="5" style="text-align: center; padding: 4rem; color: var(--text-secondary); font-weight: 700;">\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0628\u064a\u0639\u0627\u062a \u0641\u064a \u0647\u0630\u0647 \u0627\u0644\u0641\u062a\u0631\u0629</td></tr>`;
        }

        const sorted = [...sales].reverse();
        const methodMap = { cash: '\u0646\u0642\u062f\u064a', bankak: '\u0628\u0646\u0643\u0643', credit: '\u0622\u062c\u0644' };
        const methodColor = { cash: 'var(--success)', bankak: 'var(--primary-color)', credit: 'var(--warning-color)' };

        return sorted.map(s => `
            <tr>
                <td style="font-weight: 850; color: var(--primary-color);">#${s.id}</td>
                <td style="font-weight: 700;">${new Date(s.date).toLocaleDateString('ar-EG')}</td>
                <td style="font-weight: 800;">${s.customerName || '\u0639\u0645\u064a\u0644 \u0646\u0642\u062f\u064a'}</td>
                <td style="font-weight: 950; font-size: 1rem;">${s.total.toLocaleString()} ${settings.currency}</td>
                <td>
                    <span style="padding: 4px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 900; border: 1.5px solid ${methodColor[s.paymentMethod] || 'var(--text-secondary)'}55; color: ${methodColor[s.paymentMethod] || 'var(--text-secondary)'};">
                        ${methodMap[s.paymentMethod] || s.paymentMethod}
                    </span>
                </td>
            </tr>
        `).join('');
    },

    printFullReport() {
        const products = db.getCollection('products');
        const customers = db.getCollection('customers');
        const suppliers = db.getCollection('suppliers');
        const expenses = db.getCollection('expenses');
        const sales = db.getCollection('sales');
        
        const filteredSales = this.filterByPeriod(sales, this.currentPeriod);
        const filteredExpenses = this.filterByPeriod(expenses, this.currentPeriod);
        
        const totalSalesVal = filteredSales.reduce((s, i) => s + i.total, 0);
        const totalExpVal = filteredExpenses.reduce((s, i) => s + (i.amount || 0), 0);
        const capital = products.reduce((s, p) => s + ((p.costPrice || p.price) * p.quantity), 0);
        const cDebt = customers.reduce((s, c) => s + (c.balance || 0), 0);
        const sDebt = suppliers.reduce((s, sup) => s + (sup.balance || 0), 0);
        
        const settings = db.getSettings();
        const storeName = settings.storeName || '\u0645\u0624\u0633\u0633\u0629 \u0627\u0644\u0642\u0635\u0648\u0627\u0621';
        const phone = settings.phone || '';
        
        const periodLabel = {
            'daily': '\u0627\u0644\u064a\u0648\u0645\u064a',
            'weekly': '\u0627\u0644\u0623\u0633\u0628\u0648\u0639\u064a',
            'monthly': '\u0627\u0644\u0634\u0647\u0631\u064a',
            'yearly': '\u0627\u0644\u0633\u0646\u0648\u064a',
            'all': '\u0627\u0644\u0639\u0627\u0645'
        }[this.currentPeriod] || '';

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u0642\u0635\u0648\u0627\u0621 - ${periodLabel}</title>
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Cairo', sans-serif; padding: 30px; color: #2c3e50; line-height: 1.6; background: #fff; }
                    .rep-header { background: #0c56d0; color: white; padding: 25px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; position: relative; overflow: hidden; }
                    .rep-header::after { content: ''; position: absolute; right: 0; top: 0; width: 300px; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05)); }
                    .rep-title h1 { margin: 0; font-size: 24px; font-weight: 900; }
                    .rep-title p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
                    
                    .section { margin-bottom: 40px; }
                    .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 8px; }
                    .section-header h2 { margin: 0; font-size: 18px; font-weight: 900; color: #0c56d0; }
                    
                    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
                    .kpi-card { background: #f8fbff; border: 1px solid #e1e8f0; padding: 15px; border-radius: 12px; text-align: center; }
                    .kpi-label { font-size: 13px; font-weight: 700; color: #7f8c8d; margin-bottom: 5px; }
                    .kpi-value { font-size: 20px; font-weight: 900; color: #0c56d0; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; border-radius: 10px; overflow: hidden; box-shadow: 0 0 0 1px #eee; }
                    th { background: #f0f4f8; color: #0c56d0; padding: 12px; font-weight: 900; font-size: 13px; text-align: center; border: 1px solid #eee; }
                    td { padding: 10px; text-align: center; border: 1px solid #eee; font-size: 13px; font-weight: 700; }
                    tr:nth-child(even) { background: #fafbfc; }
                    
                    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #95a5a6; border-top: 1px solid #eee; padding-top: 20px; }
                    @media print { 
                        body { padding: 0; } 
                        .rep-header { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        th { -webkit-print-color-adjust: exact !important; border: 1px solid #ddd !important; }
                    }
                </style>
            </head>
            <body>
                <div class="rep-header">
                    <div class="rep-title">
                        <h1>${storeName} - \u0627\u0644\u062a\u0642\u0631\u064a\u0631 ${periodLabel}</h1>
                        <p>\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0635\u062f\u0627\u0631: ${new Date().toLocaleString('ar-EG')}</p>
                    </div>
                    <div style="font-size: 14px; font-weight: bold; text-align: left;">
                        ${phone ? '<div>\u0647\u0627\u062a\u0641: ' + phone + '</div>' : ''}
                        <div>\u0646\u0638\u0627\u0645 \u0627\u0644\u0642\u0635\u0648\u0627\u0621 POS</div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-header"><h2>\u25fc \u0627\u0644\u0645\u0644\u062e\u0635 \u0627\u0644\u0645\u0627\u0644\u064a</h2></div>
                    <div class="kpi-grid">
                        <div class="kpi-card"><div class="kpi-label">\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0628\u064a\u063a\u0627\u062a</div><div class="kpi-value">${totalSalesVal.toLocaleString()} ${settings.currency}</div></div>
                        <div class="kpi-card"><div class="kpi-label">\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0646\u0635\u0631\u0641\u0627\u062a</div><div class="kpi-value" style="color:#e67e22;">${totalExpVal.toLocaleString()} ${settings.currency}</div></div>
                        <div class="kpi-card"><div class="kpi-label">\u0631\u0623\u0633 \u0627\u0644\u0645\u0627\u0644 (\u0628\u0636\u0627\u0639\u0629)</div><div class="kpi-value" style="color:#27ae60;">${capital.toLocaleString()} ${settings.currency}</div></div>
                    </div>
                    <div class="kpi-grid">
                        <div class="kpi-card"><div class="kpi-label">\u062f\u064a\u0648\u0646 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 (\u0644\u0646\u0627)</div><div class="kpi-value" style="color:#2980b9;">${cDebt.toLocaleString()}</div></div>
                        <div class="kpi-card"><div class="kpi-label">\u062f\u064a\u0648\u0646 \u0627\u0644\u0645\u0648\u0631\u062f\u064a\u0646 (\u0639\u0644\u064a\u0646\u0627)</div><div class="kpi-value" style="color:#e74c3c;">${sDebt.toLocaleString()}</div></div>
                        <div class="kpi-card"><div class="kpi-label">\u0635\u0627\u0641\u064a \u0627\u0644\u0631\u0628\u062d (\u062a\u0642\u0631\u064a\u0628\u064a)</div><div class="kpi-value" style="color:#0c56d0; background:#eef5ff; border-radius:8px;">${(totalSalesVal * 0.25 - totalExpVal).toLocaleString()} ${settings.currency}</div></div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-header"><h2>\u25fc \u062c\u0631\u062f \u0627\u0644\u0645\u062e\u0632\u0648\u0646 \u0627\u0644\u062d\u0627\u0644\u064a</h2></div>
                    <table>
                        <thead>
                            <tr>
                                <th>\u0627\u0644\u0635\u0646\u0641</th>
                                <th>\u0627\u0644\u062a\u0635\u0646\u064a\u0641</th>
                                <th>\u0627\u0644\u0643\u0645\u064a\u0629</th>
                                <th>\u0633\u0639\u0631 \u0627\u0644\u0628\u064a\u0632</th>
                                <th>\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0642\u064a\u0645\u0629</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products.map(p => `
                                <tr>
                                    <td style="text-align:right;">${p.name}</td>
                                    <td>${p.category}</td>
                                    <td style="color:${p.quantity <= 5 ? '#e74c3c' : 'inherit'}">${p.quantity}</td>
                                    <td>${p.price.toLocaleString()}</td>
                                    <td>${(p.price * p.quantity).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <div class="section-header"><h2>\u25fc \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0645\u062f\u064a\u0648\u0646\u064a\u0627\u062f (\u0644\u0646\u0627 \u0639\u0646\u062f \u0627\u0644\u0639\u0645\u0644\u0627\u0621)</h2></div>
                    <table>
                        <thead>
                            <tr>
                                <th>\u0627\u0644\u0639\u0645\u064a\u0644</th>
                                <th>\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u0633\u062a\u0641\u0642</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${customers.filter(c => (c.balance || 0) > 0).map(c => `
                                <tr>
                                    <td style="text-align:right;">${c.name}</td>
                                    <td style="color:#27ae60; font-weight:900;">${c.balance.toLocaleString()} ${settings.currency}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="footer">
                    \u062a\u0645 \u062a\u0648\u0644\u064a\u062f \u0647\u0630\u0627 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0622\u0644\u064a\u0627\u064b \u0628\u0648\u0627\u0633\u0637\u0629 \u0646\u0638\u0627\u0645 \u0627\u0644\u0642\u0635\u0648\u0627\u0621 POS - \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0642 \u0645\u062d\u0641\u0648\u0638\u0629.
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        // Wait for fonts/images
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
};

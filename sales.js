window.salesController = {
    cart: [],
    selectedCustomerId: 0,
    invoiceNumber: 1,
    selectedItemIndex: -1,
    editingInvoiceId: null,

    render(container) {
        const products = db.getCollection('products');
        const customers = db.getCollection('customers');
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD for date input
        const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

        // Remove container padding for full-screen feel
        container.style.padding = '0';
        container.style.overflow = 'hidden';

        const sales = db.getCollection('sales');
        if (sales.length > 0) {
            const maxId = Math.max(...sales.map(s => parseInt(s.id) || 0));
            this.invoiceNumber = maxId + 1;
        }

        container.innerHTML = `
            <div class="tager-pos-view view-entry">
                <!-- Edit Mode Banner -->
                ${this.editingInvoiceId ? `
                <div style="background: linear-gradient(135deg, #f39c12, #e67e22); color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; font-weight: 900; font-size: 0.95rem; animation: pulse-bg 2s infinite;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i data-lucide="edit-3" style="width:18px;"></i>
                        <span>⚠ وضع التعديل - أنت تقوم بتعديل الفاتورة رقم #${this.editingInvoiceId}</span>
                    </div>
                    <button onclick="salesController.cancelEdit()" style="background: rgba(255,255,255,0.25); border: 2px solid white; color: white; padding: 5px 20px; border-radius: 8px; font-family: Cairo, sans-serif; font-weight: 900; cursor: pointer; font-size: 0.85rem;">✕ إلغاء التعديل</button>
                </div>
                <style>
                    @keyframes pulse-bg { 0%,100%{opacity:1} 50%{opacity:0.85} }
                </style>
                ` : ''}

                <!-- Top Navigation Tabs -->
                <div class="tager-top-tabs">
                    <div class="tager-tab active"><i data-lucide="file-text" style="width:14px;"></i> ${this.editingInvoiceId ? 'تعديل فاتورة #' + this.editingInvoiceId : 'فاتورة بيع'}</div>
                </div>

                <div class="tager-main-layout">
                    <!-- Main Area -->
                    <div class="tager-main-content">
                        <!-- Header Section -->
                        <div class="tager-main-header">
                            <div class="tager-info-group">
                                <div class="tager-invoice-meta">
                                    <label>ف رقم</label>
                                    <div style="text-align:center;">${this.editingInvoiceId || this.invoiceNumber}</div>
                                    <label>التاريخ</label>
                                    <input type="date" id="invoice-date" value="${this.editingInvoiceId ? (db.getCollection('sales').find(s=>s.id==this.editingInvoiceId)?.date||today).split('T')[0] : today}"
                                        style="border:1px solid #ddd; border-radius:4px; background:#fff8e1; text-align:center; font-size:0.75rem; font-family:inherit; font-weight:800; color:#e67e22; padding:2px 4px; width:100%;">
                                    <label>الوقت</label>
                                    <div style="text-align:center; font-size:0.75rem;">${timeStr}</div>
                                </div>
                            </div>

                            <div class="tager-big-total-display" id="big-total-display">0</div>

                            <div class="tager-inputs-grid">
                                <div class="tager-input-row">
                                    <label>العميل</label>
                                    <div style="display:flex; flex-grow:1; gap:2px; align-items:center;">
                                        <select id="pos-customer" onchange="salesController.updateCustomer()" class="tager-classic-input">
                                            ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                        </select>
                                        <button onclick="salesController.quickAddCustomer()" class="tager-arrow-btn blue" style="width:24px; height:24px; font-size:1rem; padding:0;" title="إضافة عميل سريع">+</button>
                                    </div>
                                </div>
                                <div class="tager-input-row">
                                    <label>المرجع</label>
                                    <input type="text" id="invoice-ref" class="tager-classic-input" placeholder="رقم المرجع...">
                                     <div style="display:flex; gap:10px; margin-right:10px; border-right:1px solid #ddd; padding-right:10px;">
                                        <div style="display:flex; align-items:center; gap:4px;">
                                            <input type="radio" name="pay-mode" value="cash" checked id="pay-cash" onchange="salesController.onPaymentModeChange()">
                                            <label for="pay-cash" style="min-width:auto; font-size:0.75rem;">نقدي</label>
                                        </div>
                                        <div style="display:flex; align-items:center; gap:4px;">
                                            <input type="radio" name="pay-mode" value="bankak" id="pay-bankak" onchange="salesController.onPaymentModeChange()">
                                            <label for="pay-bankak" style="min-width:auto; font-size:0.75rem;">بنكك</label>
                                        </div>
                                        <div style="display:flex; align-items:center; gap:4px;">
                                            <input type="radio" name="pay-mode" value="credit" id="pay-credit" onchange="salesController.onPaymentModeChange()">
                                            <label for="pay-credit" style="min-width:auto; font-size:0.75rem;">أجل</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="tager-input-row" style="grid-column: 1 / -1;">
                                    <label>ملاحظات</label>
                                    <input type="text" id="invoice-notes" class="tager-classic-input" placeholder="اكتب ملاحظات إضافية هنا...">
                                </div>
                            </div>
                        </div>

                        <!-- Item Entry Bar -->
                        <div class="tager-item-entry-bar">
                            <div class="tager-entry-group" style="flex: 2;">
                                <label style="font-weight:800; font-size:0.85rem; color:#3498db;">1- ابحث عن صنف</label>
                                <input type="text" id="pos-search" class="tager-classic-input" style="background:#fff; border:1px solid #ccc; border-radius:4px;" oninput="salesController.filterProducts()" list="prod-suggestions" placeholder="الاسم أو الباركود (F2)">
                                <datalist id="prod-suggestions">
                                    ${products.map(p => `<option value="${p.name}">`).join('')}
                                </datalist>
                                <button class="tager-arrow-btn blue"><i data-lucide="search" style="width:16px;"></i></button>
                            </div>
                            
                            <div class="tager-entry-group" style="flex: 0.5;">
                                <label style="font-weight:800; font-size:0.8rem; color:#3498db;">2- الكمية</label>
                                <input type="number" id="pos-qty" value="1" class="tager-classic-input" style="background:#fff; border:1px solid #ccc; border-radius:4px; text-align:center;">
                            </div>
                            
                            <div class="tager-entry-group" style="flex: 0.7;">
                                <label style="font-weight:800; font-size:0.8rem; color:#3498db;">3- سعر البيع</label>
                                <input type="number" id="pos-price" class="tager-classic-input" style="background:#fff; border:1px solid #ccc; border-radius:4px; text-align:center;">
                            </div>
                            
                            <button class="tager-arrow-btn" onclick="salesController.addItemByInput()" title="إضافة (F3)">
                                <i data-lucide="plus" style="width:18px; margin-left:5px;"></i> أضف
                            </button>
                        </div>

                        <!-- Grid Section -->
                        <div class="tager-table-container">
                            <table class="tager-grid">
                                <thead>
                                    <tr>
                                        <th width="30">م</th>
                                        <th width="80">رقم الصنف</th>
                                        <th>اسم الصنف</th>
                                        <th width="60">الوحدة</th>
                                        <th width="80">الكمية</th>
                                        <th width="100">سعر البيع</th>
                                        <th width="100">الإجمالي</th>
                                        <th width="40">حذف</th>
                                    </tr>
                                </thead>
                                <tbody id="pos-items-body"></tbody>
                            </table>
                        </div>

                        <!-- Summary Bar -->
                        <div class="tager-summary-bar">
                            <div class="tager-summary-item">
                                <label>إجمالي الفاتورة</label>
                                <div class="value-box" id="sum-total">0</div>
                            </div>
                            <div class="tager-summary-item">
                                <label>المدفوع</label>
                                <input type="number" id="sum-paid" value="0" class="tager-classic-input" style="width:100px; text-align:center;" oninput="salesController.updateTotals()">
                            </div>
                            <div class="tager-summary-item">
                                <label>الباقي</label>
                                <div class="value-box" id="sum-change">0</div>
                            </div>
                        </div>

                        <!-- Bottom Footer -->
                        <div class="tager-status-footer">
                            <div style="display:flex; gap:10px; align-items:center;">
                                <span>المندوب</span>
                                <select><option>عام</option></select>
                            </div>
                            <div style="display:flex; gap:10px; align-items:center;">
                                <span>المخزن</span>
                                <select><option>المخزن الرئيسي</option></select>
                            </div>
                            <div style="display:flex; gap:10px; align-items:center;">
                                <span>الخزينة</span>
                                <select><option>الصندوق</option></select>
                            </div>
                            <div style="display:flex; gap:10px; align-items:center;">
                                <span>سعر البيع</span>
                                <select><option>سعر البيع</option></select>
                            </div>
                            <div style="display:flex; gap:10px; align-items:center;">
                                <span>حالة الفاتورة</span>
                                <select><option>مغلقة</option></select>
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar -->
                    <div class="tager-sidebar" style="padding: 8px; gap: 6px;">
                        <div class="tager-module-badge" style="font-size:0.7rem; padding:4px 8px;">${this.editingInvoiceId ? 'تعديل #' + this.editingInvoiceId : 'فاتورة بيع'}</div>

                        <div style="display:flex; flex-direction:column; gap:5px; width:100%; margin-top:6px;">

                            <!-- Save Only -->
                            <button onclick="salesController.handleCheckout(false)"
                                style="display:flex; align-items:center; gap:8px; width:100%; padding:8px 10px; border:none; border-radius:8px; background:#3498db; color:white; font-family:inherit; font-weight:900; font-size:0.78rem; cursor:pointer;">
                                <i data-lucide="save" style="width:14px; flex-shrink:0;"></i>
                                <span style="flex:1; text-align:right;">\u062d\u0641\u0638 \u0641\u0642\u0637</span>
                                <span style="opacity:0.7; font-size:0.65rem;">F12</span>
                            </button>

                            <!-- Save & Print -->
                            <button onclick="salesController.handleCheckout(true)"
                                style="display:flex; align-items:center; gap:8px; width:100%; padding:8px 10px; border:none; border-radius:8px; background:#1a252f; color:white; font-family:inherit; font-weight:900; font-size:0.78rem; cursor:pointer;">
                                <i data-lucide="printer" style="width:14px; flex-shrink:0;"></i>
                                <span style="flex:1; text-align:right;">\u062d\u0641\u0638 \u0648\u0637\u0628\u0627\u0639\u0629</span>
                                <span style="opacity:0.7; font-size:0.65rem;">F11</span>
                            </button>

                            <!-- New Invoice -->
                            <button onclick="salesController.newInvoice()"
                                style="display:flex; align-items:center; gap:8px; width:100%; padding:8px 10px; border:none; border-radius:8px; background:#27ae60; color:white; font-family:inherit; font-weight:900; font-size:0.78rem; cursor:pointer;">
                                <i data-lucide="file-plus" style="width:14px; flex-shrink:0;"></i>
                                <span style="flex:1; text-align:right;">\u0641\u0627\u062a\u0648\u0631\u0629 \u062c\u062f\u064a\u062f\u0629</span>
                                <span style="opacity:0.7; font-size:0.65rem;">F10</span>
                            </button>

                            <!-- Proforma -->
                            <button onclick="salesController.handleProforma()"
                                style="display:flex; align-items:center; gap:8px; width:100%; padding:8px 10px; border:none; border-radius:8px; background:#f39c12; color:white; font-family:inherit; font-weight:900; font-size:0.78rem; cursor:pointer;">
                                <i data-lucide="file-text" style="width:14px; flex-shrink:0;"></i>
                                <span style="flex:1; text-align:right;">\u0645\u0628\u062f\u0626\u064a\u0629</span>
                                <span style="opacity:0.7; font-size:0.65rem;">F6</span>
                            </button>

                            <!-- Save Draft -->
                            <button onclick="salesController.saveDraft()"
                                style="display:flex; align-items:center; gap:8px; width:100%; padding:8px 10px; border:none; border-radius:8px; background:#9b59b6; color:white; font-family:inherit; font-weight:900; font-size:0.78rem; cursor:pointer;">
                                <i data-lucide="archive" style="width:14px; flex-shrink:0;"></i>
                                <span style="flex:1; text-align:right;">\u0645\u0633\u0648\u062f\u0629</span>
                                <span style="opacity:0.7; font-size:0.65rem;">F4</span>
                            </button>

                            <!-- Invoices Log -->
                            <button onclick="App.switchView('invoices')"
                                style="display:flex; align-items:center; gap:8px; width:100%; padding:8px 10px; border:1px solid #ddd; border-radius:8px; background:#fff; color:#2c3e50; font-family:inherit; font-weight:900; font-size:0.78rem; cursor:pointer;">
                                <i data-lucide="list" style="width:14px; flex-shrink:0;"></i>
                                <span style="flex:1; text-align:right;">\u0633\u062c\u0644 \u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631</span>
                                <span style="opacity:0.7; font-size:0.65rem;">F9</span>
                            </button>

                            ${this.editingInvoiceId ? `
                            <!-- Cancel Edit -->
                            <button onclick="salesController.cancelEdit()"
                                style="display:flex; align-items:center; gap:8px; width:100%; padding:8px 10px; border:2px solid #e74c3c; border-radius:8px; background:#fdecea; color:#e74c3c; font-family:inherit; font-weight:900; font-size:0.78rem; cursor:pointer; margin-top:4px;">
                                <i data-lucide="x-circle" style="width:14px; flex-shrink:0;"></i>
                                <span style="flex:1; text-align:right;">\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062a\u0639\u062f\u064a\u0644</span>
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Bottom Actions Bar -->
                <div class="tager-final-actions">
                    <button class="tager-final-btn" onclick="salesController.handleCheckout(true)"><i data-lucide="printer" style="width:14px;"></i> حفظ وطباعة F11</button>
                    <button class="tager-final-btn" onclick="salesController.handleCheckout(false)"><i data-lucide="save" style="width:14px;"></i> حفظ فقط F12</button>
                    <button class="tager-final-btn" onclick="salesController.newInvoice()"><i data-lucide="file-plus" style="width:14px;"></i> جديد F10</button>
                    <button class="tager-final-btn" onclick="salesController.handleProforma()"><i data-lucide="file-text" style="width:14px;"></i> مبدئية F6</button>
                    <button class="tager-final-btn" onclick="App.switchView('invoices')"><i data-lucide="list" style="width:14px;"></i> سجل F9</button>
                    <button class="tager-final-btn" onclick="App.showView('dashboard')"><i data-lucide="power" style="width:14px;"></i> إغلاق</button>
                </div>

            </div>
        `;

        this.renderCart();
        lucide.createIcons();

        // Shortcuts
        document.onkeydown = (e) => {
            if (e.key === 'F11') { e.preventDefault(); this.handleCheckout(true); }
            if (e.key === 'F12') { e.preventDefault(); this.handleCheckout(false); }
            if (e.key === 'F6')  { e.preventDefault(); this.handleProforma(); }
            if (e.key === 'F4')  { e.preventDefault(); this.saveDraft(); }
            if (e.key === 'F9')  { e.preventDefault(); App.switchView('invoices'); }
            if (e.key === 'F10') { e.preventDefault(); this.newInvoice(); }
            if (e.key === 'F2')  { e.preventDefault(); document.getElementById('pos-search').focus(); }
        }
    },

    saveDraft() {
        if (this.cart.length === 0) return;
        
        const customerSelect = document.getElementById('pos-customer');
        const customerId = parseInt(customerSelect.value);
        
        const draftData = {
            id: Date.now(),
            date: new Date().toISOString(),
            customerId: customerId,
            customerName: customerId ? customerSelect.options[customerSelect.selectedIndex].text : 'عميل نقدي',
            items: [...this.cart],
            total: this.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0),
            notes: document.getElementById('pos-notes').value
        };
        
        db.addItem('drafts', draftData);
        App.showToast("تم حفظ المسودة بنجاح (F4)", "success");
        this.clearCart();
    },

    renderCart() {
        const body = document.getElementById('pos-items-body');
        if (!body) return;

        if (this.cart.length === 0) {
            body.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #999;">الفاتورة خالية</td></tr>';
            this.updateTotals();
            return;
        }

        body.innerHTML = this.cart.map((item, idx) => `
            <tr id="cart-row-${idx}" style="transition: background 0.2s;" onmouseenter="this.style.background='#f0f7ff'" onmouseleave="this.style.background=''">
                <td style="text-align:center; font-weight:800; color:#7f8c8d;">${idx + 1}</td>
                <td style="font-weight:700; color:var(--primary-color);">${item.id}</td>
                <td style="font-weight:900;">${item.name}</td>
                <td style="text-align:center; color:#7f8c8d;">${item.unit || 'قطعة'}</td>
                <td style="text-align:center;">
                    <input type="number" value="${item.quantity}" min="1"
                        onchange="salesController.updateItemQty(${idx}, this.value)"
                        style="width:60px; border:1px solid #ddd; border-radius:4px; background:#f9f9f9; text-align:center; font-weight:900; font-size:0.9rem; padding:2px 4px;">
                </td>
                <td style="text-align:center;">
                    <input type="number" value="${item.price}" min="0" step="0.01"
                        onchange="salesController.updateItemPrice(${idx}, this.value)"
                        style="width:80px; border:1px solid #ddd; border-radius:4px; background:#fff8e1; text-align:center; font-weight:900; font-size:0.9rem; padding:2px 4px; color:#e67e22;">
                </td>
                <td style="text-align:center; font-weight:950; font-size:1rem; color:var(--primary-color);">${(item.price * item.quantity).toLocaleString()}</td>
                <td style="text-align:center;">
                    <button onclick="salesController.removeFromCart(${idx})"
                        style="width:28px; height:28px; border:none; background:#fdecea; color:#e74c3c; border-radius:6px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;" title="حذف الصنف">
                        <i data-lucide="trash-2" style="width:13px;"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        lucide.createIcons();
        this.updateTotals();
    },

    addItemByInput() {
        const searchInput = document.getElementById('pos-search');
        const qtyInput = document.getElementById('pos-qty');
        const priceInput = document.getElementById('pos-price');

        const products = db.getCollection('products');
        const found = products.find(p => p.name === searchInput.value || (p.barcode && p.barcode === searchInput.value));

        if (!found) {
            App.showToast("الصنف غير موجود!", "error");
            return;
        }

        const qty = parseInt(qtyInput.value) || 1;
        const price = parseFloat(priceInput.value) || found.price;

        const cartIdx = this.cart.findIndex(i => i.id === found.id);
        if (cartIdx !== -1) {
            this.cart[cartIdx].quantity += qty;
        } else {
            this.cart.push({ ...found, quantity: qty, price: price, costPrice: found.costPrice || 0 });
        }

        searchInput.value = "";
        qtyInput.value = 1;
        priceInput.value = "";
        searchInput.focus();

        this.renderCart();
    },

    updateItemQty(idx, val) {
        const qty = parseInt(val);
        if (qty > 0) {
            this.cart[idx].quantity = qty;
            // Update only the total cell of this row without full re-render
            const totalCell = document.querySelector(`#cart-row-${idx} td:nth-child(7)`);
            if (totalCell) totalCell.innerText = (this.cart[idx].price * qty).toLocaleString();
            this.updateTotals();
        }
    },

    updateItemPrice(idx, val) {
        const price = parseFloat(val);
        if (price >= 0) {
            this.cart[idx].price = price;
            const totalCell = document.querySelector(`#cart-row-${idx} td:nth-child(7)`);
            if (totalCell) totalCell.innerText = (price * this.cart[idx].quantity).toLocaleString();
            this.updateTotals();
        }
    },

    removeFromCart(idx) {
        this.cart.splice(idx, 1);
        this.renderCart();
    },

    clearCart() {
        if (confirm("إفراغ الفاتورة الحالية؟")) {
            this.cart = [];
            this.renderCart();
        }
    },

    newInvoice() {
        if (this.cart.length > 0) {
            if (!confirm("\u0647\u0644 \u062a\u0631\u064a\u062f \u0628\u062f\u0621 \u0641\u0627\u062a\u0648\u0631\u0629 \u062c\u062f\u064a\u062f\u0629 \u0648\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062d\u0627\u0644\u064a\u0629\u061f")) return;
        }
        this.cart = [];
        this.editingInvoiceId = null;
        this.selectedCustomerId = 0;
        this.render(document.getElementById('view-container'));
        App.showToast("\u0641\u0627\u062a\u0648\u0631\u0629 \u062c\u062f\u064a\u062f\u0629", "info");
    },

    cancelEdit() {
        if (confirm("هل تريد إلغاء تعديل الفاتورة والعودة لفاتورة جديدة؟")) {
            this.editingInvoiceId = null;
            this.cart = [];
            this.render(document.getElementById('view-container'));
            App.showToast("تم إلغاء التعديل", "info");
        }
    },

    filterProducts() {
        const query = document.getElementById('pos-search').value;
        const products = db.getCollection('products');
        const p = products.find(prod => prod.name === query || (prod.barcode && prod.barcode === query));
        if (p) document.getElementById('pos-price').value = p.price;
    },

    updateCustomer() { this.selectedCustomerId = parseInt(document.getElementById('pos-customer').value); },

    quickAddCustomer() {
        const name = prompt("أدخل اسم العميل الجديد:");
        if (!name) return;
        const newCustomer = { id: Date.now(), name: name, balance: 0, dateAdded: new Date().toISOString() };
        db.addItem('customers', newCustomer);
        App.showToast("تمت إضافة العميل " + name, "success");
        this.render(document.getElementById('view-container'));
    },

    updateTotals() {
        const total = this.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

        const payModeEl = document.querySelector('input[name="pay-mode"]:checked');
        const payMode = payModeEl ? payModeEl.value : 'cash';
        const paidEl = document.getElementById('sum-paid');

        // Auto-fill paid when cash or bankak
        if (paidEl && (payMode === 'cash' || payMode === 'bankak')) {
            paidEl.value = total;
        }

        const paid = parseFloat(paidEl?.value) || 0;
        const change = paid - total;

        const sumTotalElem = document.getElementById('sum-total');
        const sumChangeElem = document.getElementById('sum-change');
        const bigTotalElem = document.getElementById('big-total-display');

        if (sumTotalElem) sumTotalElem.innerText = total.toLocaleString();
        if (sumChangeElem) sumChangeElem.innerText = change.toLocaleString();
        if (bigTotalElem) bigTotalElem.innerText = total.toLocaleString();
    },

    onPaymentModeChange() {
        const payModeEl = document.querySelector('input[name="pay-mode"]:checked');
        const payMode = payModeEl ? payModeEl.value : 'cash';
        const paidEl = document.getElementById('sum-paid');
        if (!paidEl) return;

        const total = this.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

        if (payMode === 'cash' || payMode === 'bankak') {
            paidEl.value = total;
            paidEl.disabled = false;
        } else {
            // Credit: zero paid, allow manual entry
            paidEl.value = 0;
            paidEl.disabled = false;
        }
        this.updateTotals();
    },


    handleCheckout(doPrint = true) {
        if (this.cart.length === 0) return;

        const total = this.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const paid = parseFloat(document.getElementById('sum-paid').value) || 0;

        const isEditing = !!this.editingInvoiceId;

        const saleData = {
            id: isEditing ? this.editingInvoiceId : this.invoiceNumber,
            date: (() => {
                const dateInput = document.getElementById('invoice-date');
                const dateVal = dateInput ? dateInput.value : null;
                return dateVal ? new Date(dateVal).toISOString() : new Date().toISOString();
            })(),
            customerId: parseInt(document.getElementById('pos-customer').value),
            customerName: document.getElementById('pos-customer').options[document.getElementById('pos-customer').selectedIndex].text,
            items: [...this.cart],
            total: total,
            paid: paid,
            paymentMethod: document.querySelector('input[name="pay-mode"]:checked').value,
            ref: document.getElementById('invoice-ref').value,
            notes: document.getElementById('invoice-notes').value
        };

        const products = db.getCollection('products');

        if (isEditing) {
            // --- EDIT MODE: Reverse old invoice then apply new one ---
            const oldSale = db.getCollection('sales').find(s => s.id == this.editingInvoiceId);

            // 1. Restore product quantities from the old invoice
            if (oldSale && oldSale.items) {
                oldSale.items.forEach(oldItem => {
                    const pIdx = products.findIndex(p => p.id === oldItem.id);
                    if (pIdx !== -1) {
                        products[pIdx].quantity = (products[pIdx].quantity || 0) + oldItem.quantity;
                    }
                });
            }

            // 2. Reverse old customer balance effect
            if (oldSale && oldSale.customerId != null) {
                const customers = db.getCollection('customers');
                const cIdx = customers.findIndex(c => c.id == oldSale.customerId);
                if (cIdx !== -1) {
                    const oldRemaining = (oldSale.total || 0) - (oldSale.paid || 0);
                    customers[cIdx].balance = Math.max(0, (customers[cIdx].balance || 0) - oldRemaining);
                    db.saveCollection('customers', customers);
                }
            }

            // 3. Update the invoice record in-place
            db.updateItem('sales', this.editingInvoiceId, saleData);
            App.showToast(`✔ تم تعديل الفاتورة #${this.editingInvoiceId} بنجاح`, 'success');

        } else {
            // --- NEW INVOICE MODE ---
            db.addItem('sales', saleData);
            App.showToast(`تم حفظ الفاتورة #${this.invoiceNumber}`, 'success');
        }

        // Apply new quantities to products
        this.cart.forEach(item => {
            const pIdx = products.findIndex(p => p.id === item.id);
            if (pIdx !== -1) {
                products[pIdx].quantity = Math.max(0, (products[pIdx].quantity || 0) - item.quantity);
                products[pIdx].price = item.price;
            }
        });
        db.saveCollection('products', products);

        // Apply new customer balance effect
        if (saleData.customerId != null) {
            const customers = db.getCollection('customers');
            const cIdx = customers.findIndex(c => c.id == saleData.customerId);
            if (cIdx !== -1) {
                const remaining = total - paid;
                customers[cIdx].balance = (customers[cIdx].balance || 0) + remaining;
                db.saveCollection('customers', customers);
            }
        }

        if (doPrint) {
            App.printInvoice(saleData, 'sales');
        }

        // Clear editing state
        this.editingInvoiceId = null;
        this.cart = [];
        this.render(document.getElementById('view-container'));
    },

    handleProforma() {
        if (this.cart.length === 0) return;
        const net = this.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const proformaData = {
            id: 'PR-' + Date.now().toString().slice(-6),
            date: new Date().toISOString(),
            items: [...this.cart],
            total: net,
            customerName: document.getElementById('pos-customer').options[document.getElementById('pos-customer').selectedIndex].text
        };
        db.addItem('proformas', proformaData);
        App.printInvoice(proformaData, 'proformas');
        App.showToast(`تم إصدار فاتورة مبدئية`, "success");
        this.cart = [];
        this.render(document.getElementById('view-container'));
    }
};

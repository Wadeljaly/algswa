window.purchasesController = {
    cart: [],
    selectedSupplierId: 0,
    invoiceNumber: 1,
    editingPurchaseId: null,

    render(container) {
        const products = db.getCollection('products');
        const suppliers = db.getCollection('suppliers');
        const today = new Date().toISOString().split('T')[0];
        const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

        // Remove container padding for full-screen feel
        container.style.padding = '0';
        container.style.overflow = 'hidden';

        const purchases = db.getCollection('purchases');
        if (purchases.length > 0) {
            const maxId = Math.max(...purchases.map(p => parseInt(p.id) || 0));
            this.invoiceNumber = maxId + 1;
        }

        container.innerHTML = `
            <div class="tager-pos-view view-entry">
                <!-- Edit Mode Banner -->
                ${this.editingPurchaseId ? `
                <div style="background: linear-gradient(135deg, #f39c12, #e67e22); color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; font-weight: 900; font-size: 0.95rem; animation: pulse-bg 2s infinite;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i data-lucide="edit-3" style="width:18px;"></i>
                        <span>\u26a0 \u0648\u0636\u0639 \u0627\u0644\u062a\u0639\u062f\u064a\u0644 - \u0623\u0646\u062a \u062a\u0642\u0648\u0645 \u062a\u0639\u062f\u064a\u0644 \u0641\u0627\u062a\u0648\u0631\u0629 \u0634\u0631\u0627\u0621 \u0631\u0642\u0645 #${this.editingPurchaseId}</span>
                    </div>
                    <button onclick="purchasesController.cancelEdit()" style="background: rgba(255,255,255,0.25); border: 2px solid white; color: white; padding: 5px 20px; border-radius: 8px; font-family: Cairo, sans-serif; font-weight: 900; cursor: pointer; font-size: 0.85rem;">\u2715 \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062a\u0639\u062f\u064a\u0644</button>
                </div>
                ` : ''}

                <!-- Top Navigation Tabs -->
                <div class="tager-top-tabs">
                    <div class="tager-tab active"><i data-lucide="shopping-bag" style="width:14px;"></i> ${this.editingPurchaseId ? '\u062a\u0631\u0642\u064a\u0645 \u0634\u0631\u0627\u0621 #' + this.editingPurchaseId : '\u0641\u0627\u062a\u0648\u0631\u0629 \u0645\u0634\u062a\u0631\u064a\u0627\u062a'}</div>
                </div>

                <div class="tager-main-layout">
                    <!-- Main Area -->
                    <div class="tager-main-content">
                        <!-- Header Section -->
                        <div class="tager-main-header">
                            <div class="tager-info-group">
                                <div class="tager-invoice-meta">
                                    <label>ف رقم</label>
                                    <div style="text-align:center;">${this.editingPurchaseId || this.invoiceNumber}</div>
                                    <label>التاريخ</label>
                                    <input type="date" id="pur-date" value="${this.editingPurchaseId ? (db.getCollection('purchases').find(p=>p.id==this.editingPurchaseId)?.date||today).split('T')[0] : today}"
                                        style="border:1px solid #ddd; border-radius:4px; background:#fff8e1; text-align:center; font-size:0.75rem; font-family:inherit; font-weight:800; color:#e67e22; padding:2px 4px; width:100%;">
                                    <label>الوقت</label>
                                    <div style="text-align:center; font-size:0.75rem;">${timeStr}</div>
                                </div>
                            </div>

                            <div class="tager-big-total-display" id="big-total-display">0</div>

                            <div class="tager-inputs-grid">
                                <div class="tager-input-row">
                                    <label>المورد</label>
                                    <div style="display:flex; flex-grow:1; gap:2px; align-items:center;">
                                        <select id="pur-supplier" onchange="purchasesController.updateSupplier()" class="tager-classic-input">
                                            <option value="">-- اختر مورد --</option>
                                            ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                                        </select>
                                        <button onclick="purchasesController.quickAddSupplier()" class="tager-arrow-btn blue" style="width:24px; height:24px; font-size:1rem; padding:0;" title="إضافة مورد">+</button>
                                    </div>
                                </div>
                                <div class="tager-input-row">
                                    <label>المرجع</label>
                                    <input type="text" id="pur-ref" class="tager-classic-input" placeholder="رقم فاتورة المورد...">
                                    <div style="display:flex; gap:10px; margin-right:10px; border-right:1px solid #ddd; padding-right:10px;">
                                        <div style="display:flex; align-items:center; gap:4px;">
                                            <input type="radio" name="pur-pay-mode" value="cash" checked id="pay-cash" onchange="purchasesController.onPaymentModeChange()">
                                            <label for="pay-cash" style="min-width:auto; font-size:0.75rem;">نقدي</label>
                                        </div>
                                        <div style="display:flex; align-items:center; gap:4px;">
                                            <input type="radio" name="pur-pay-mode" value="credit" id="pay-credit" onchange="purchasesController.onPaymentModeChange()">
                                            <label for="pay-credit" style="min-width:auto; font-size:0.75rem;">آجل</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="tager-input-row" style="grid-column: 1 / -1;">
                                    <label>ملاحظات</label>
                                    <input type="text" id="pur-notes" class="tager-classic-input" placeholder="اكتب ملاحظات إضافية هنا...">
                                </div>
                            </div>
                        </div>

                        <!-- Item Entry Bar -->
                        <div class="tager-item-entry-bar">
                            <div class="tager-entry-group" style="flex: 2;">
                                <label style="font-weight:800; font-size:0.85rem; color:#3498db;">1- ابحث عن صنف</label>
                                <input type="text" id="pur-search" class="tager-classic-input" style="background:#fff; border:1px solid #ccc; border-radius:4px;" oninput="purchasesController.filterProducts()" list="pur-prod-list" placeholder="الاسم أو الباركود (F2)">
                                <datalist id="pur-prod-list">
                                    ${products.map(p => `<option value="${p.name}">`).join('')}
                                </datalist>
                                <button class="tager-arrow-btn blue"><i data-lucide="search" style="width:16px;"></i></button>
                            </div>
                            
                            <div class="tager-entry-group" style="flex: 0.5;">
                                <label style="font-weight:800; font-size:0.8rem; color:#3498db;">2- الكمية</label>
                                <input type="number" id="pur-qty" value="1" class="tager-classic-input" style="background:#fff; border:1px solid #ccc; border-radius:4px; text-align:center;">
                            </div>
                            
                            <div class="tager-entry-group" style="flex: 0.7;">
                                <label style="font-weight:800; font-size:0.8rem; color:#3498db;">3- سعر الشراء</label>
                                <input type="number" id="pur-price" class="tager-classic-input" style="background:#fff; border:1px solid #ccc; border-radius:4px; text-align:center;">
                            </div>

                            <div class="tager-entry-group" style="flex: 0.7;">
                                <label style="font-weight:800; font-size:0.8rem; color:#e67e22;">4- سعر البيع</label>
                                <input type="number" id="pur-sell-price" class="tager-classic-input" style="background:#fff; border:1px solid #ccc; border-radius:4px; text-align:center;">
                            </div>
                            
                            <button class="tager-arrow-btn" onclick="purchasesController.addItem()" title="إضافة">
                                <i data-lucide="plus" style="width:18px; margin-left:5px;"></i> أضف
                            </button>
                        </div>

                        <!-- Grid Section -->
                        <div class="tager-table-container">
                            <table class="tager-grid">
                                <thead>
                                    <tr>
                                        <th width="30">\u0645</th>
                                        <th width="80">\u0631\u0642\u0645 \u0627\u0644\u0635\u0646\u0641</th>
                                        <th>\u0627\u0633\u0645 \u0627\u0644\u0635\u0646\u0641</th>
                                        <th width="60">\u0627\u0644\u0648\u062d\u062f\u0629</th>
                                        <th width="80">\u0627\u0644\u064a\u0643\u0645\u064a\u0629</th>
                                        <th width="100">\u0633\u0639\u0631 \u0627\u0644\u0634\u0631\u0627\u0621</th>
                                        <th width="100">\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a</th>
                                        <th width="40">\u062d\u0630\u0641</th>
                                    </tr>
                                </thead>
                                <tbody id="pur-items-body"></tbody>
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
                                <input type="number" id="pur-paid" value="0" class="tager-classic-input" style="width:100px; text-align:center;" oninput="purchasesController.updateTotals()">
                            </div>
                            <div class="tager-summary-item">
                                <label>الباقي</label>
                                <div class="value-box" id="sum-change">0</div>
                            </div>
                        </div>

                        <!-- Bottom Footer -->
                        <div class="tager-status-footer">
                            <div style="display:flex; gap:10px; align-items:center;">
                                <span>المخزن</span>
                                <select><option>المخزن الرئيسي</option></select>
                            </div>
                            <div style="display:flex; gap:10px; align-items:center;">
                                <span>الخزينة</span>
                                <select><option>الصندوق</option></select>
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar -->
                    <div class="tager-sidebar" style="padding: 8px; gap: 6px;">
                        <div class="tager-module-badge" style="font-size:0.7rem; padding:4px 8px;">${this.editingPurchaseId ? '\u062a\u0639\u062f\u064a\u0644 #' + this.editingPurchaseId : '\u0641\u0627\u062a\u0648\u0631\u0629 \u0634\u0631\u0627\u0621'}</div>
                        
                        <div style="display:flex; flex-direction:column; gap:5px; width:100%; margin-top:6px;">
                            
                            <!-- Save Only -->
                            <button onclick="purchasesController.handleSave(false)"
                                style="display:flex; align-items:center; gap:8px; width:100%; padding:8px 10px; border:none; border-radius:8px; background:#3498db; color:white; font-family:inherit; font-weight:900; font-size:0.78rem; cursor:pointer;">
                                <i data-lucide="save" style="width:14px; flex-shrink:0;"></i>
                                <span style="flex:1; text-align:right;">\u062d\u0641\u0638 \u0641\u0642\u0637</span>
                                <span style="opacity:0.7; font-size:0.65rem;">F12</span>
                            </button>

                            <!-- Save & Print -->
                            <button onclick="purchasesController.handleSave(true)"
                                style="display:flex; align-items:center; gap:8px; width:100%; padding:8px 10px; border:none; border-radius:8px; background:#1a252f; color:white; font-family:inherit; font-weight:900; font-size:0.78rem; cursor:pointer;">
                                <i data-lucide="printer" style="width:14px; flex-shrink:0;"></i>
                                <span style="flex:1; text-align:right;">\u062d\u0641\u0638 \u0648\u0637\u0628\u0627\u0639\u0629</span>
                                <span style="opacity:0.7; font-size:0.65rem;">F11</span>
                            </button>
                            
                            <!-- New Purchase -->
                            <button onclick="purchasesController.newPurchase()"
                                style="display:flex; align-items:center; gap:8px; width:100%; padding:8px 10px; border:none; border-radius:8px; background:#27ae60; color:white; font-family:inherit; font-weight:900; font-size:0.78rem; cursor:pointer;">
                                <i data-lucide="file-plus" style="width:14px; flex-shrink:0;"></i>
                                <span style="flex:1; text-align:right;">\u0641\u0627\u062a\u0648\u0631\u0629 \u062c\u062f\u064a\u062f\u0629</span>
                                <span style="opacity:0.7; font-size:0.65rem;">F10</span>
                            </button>

                            <!-- Log -->
                            <button onclick="App.switchView('invoices')"
                                style="display:flex; align-items:center; gap:8px; width:100%; padding:8px 10px; border:1px solid #ddd; border-radius:8px; background:#fff; color:#2c3e50; font-family:inherit; font-weight:900; font-size:0.78rem; cursor:pointer;">
                                <i data-lucide="list" style="width:14px; flex-shrink:0;"></i>
                                <span style="flex:1; text-align:right;">\u0633\u062c\u0644 \u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631</span>
                                <span style="opacity:0.7; font-size:0.65rem;">F9</span>
                            </button>

                            ${this.editingPurchaseId ? `
                            <button onclick="purchasesController.cancelEdit()"
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
                    <button class="tager-final-btn" onclick="purchasesController.handleSave(true)"><i data-lucide="printer" style="width:14px;"></i> \u062d\u0641\u0638 \u0648\u0637\u0628\u0627\u0639\u0629 F11</button>
                    <button class="tager-final-btn" onclick="purchasesController.handleSave(false)"><i data-lucide="save" style="width:14px;"></i> \u062d\u0641\u0638 \u0641\u0642\u0637 F12</button>
                    <button class="tager-final-btn" onclick="purchasesController.newPurchase()"><i data-lucide="file-plus" style="width:14px;"></i> \u062c\u062f\u064a\u062f F10</button>
                    <button class="tager-final-btn" onclick="App.switchView('invoices')"><i data-lucide="list" style="width:14px;"></i> \u0633\u062c\u0644 F9</button>
                    <button class="tager-final-btn" onclick="App.showView('dashboard')"><i data-lucide="power" style="width:14px;"></i> \u0625\u0644\u063a\u0627\u0642</button>
                </div>
            </div>
        `;

        this.renderCart();
        lucide.createIcons();

        // Shortcuts
        document.onkeydown = (e) => {
            if (e.key === 'F11') { e.preventDefault(); this.handleSave(true); }
            if (e.key === 'F12') { e.preventDefault(); this.handleSave(false); }
            if (e.key === 'F9')  { e.preventDefault(); App.switchView('invoices'); }
            if (e.key === 'F10') { e.preventDefault(); this.newPurchase(); }
            if (e.key === 'F2')  { e.preventDefault(); document.getElementById('pur-search').focus(); }
        }
    },

    filterProducts() {
        const query = document.getElementById('pur-search').value;
        const products = db.getCollection('products');
        const p = products.find(prod => prod.name === query || (prod.barcode && prod.barcode === query));
        if (p) {
            document.getElementById('pur-price').value = p.purchasePrice || 0;
            document.getElementById('pur-sell-price').value = p.price || 0;
        }
    },

    addItem() {
        const searchInput = document.getElementById('pur-search');
        const qtyInput = document.getElementById('pur-qty');
        const priceInput = document.getElementById('pur-price');
        const sellPriceInput = document.getElementById('pur-sell-price');

        const products = db.getCollection('products');
        const found = products.find(p => p.name === searchInput.value || (p.barcode && p.barcode === searchInput.value));

        if (!found) {
            App.showToast("الصنف غير موجود! أضفه إلى المنتجات أولاً.", "error");
            return;
        }

        const qty = parseInt(qtyInput.value) || 1;
        const price = parseFloat(priceInput.value) || 0;
        const sellPrice = parseFloat(sellPriceInput.value) || found.price;

        const cartIdx = this.cart.findIndex(i => i.id === found.id);
        if (cartIdx !== -1) {
            this.cart[cartIdx].quantity += qty;
            this.cart[cartIdx].price = price; 
            this.cart[cartIdx].newSellPrice = sellPrice;
        } else {
            this.cart.push({ ...found, quantity: qty, price: price, newSellPrice: sellPrice });
        }

        searchInput.value = "";
        qtyInput.value = 1;
        priceInput.value = "";
        sellPriceInput.value = "";
        searchInput.focus();

        this.renderCart();
    },

    renderCart() {
        const body = document.getElementById('pur-items-body');
        if (!body) return;

        if (this.cart.length === 0) {
            body.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #999;">\u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u062e\u0627\u0644\u064a\u0629</td></tr>';
            this.updateTotals();
            return;
        }

        body.innerHTML = this.cart.map((item, idx) => `
            <tr id="pur-row-${idx}" style="transition: background 0.2s;" onmouseenter="this.style.background='#f0f7ff'" onmouseleave="this.style.background=''">
                <td style="text-align:center; font-weight:800; color:#7f8c8d;">${idx + 1}</td>
                <td style="font-weight:700; color:var(--primary-color);">${item.id}</td>
                <td style="font-weight:900;">${item.name}</td>
                <td style="text-align:center; color:#7f8c8d;">${item.unit || '\u0642\u0637\u0639\u0629'}</td>
                <td style="text-align:center;">
                    <input type="number" value="${item.quantity}" min="1"
                        onchange="purchasesController.updateItemQty(${idx}, this.value)"
                        style="width:60px; border:1px solid #ddd; border-radius:4px; background:#f9f9f9; text-align:center; font-weight:900; font-size:0.9rem; padding:2px 4px;">
                </td>
                <td style="text-align:center;">
                    <input type="number" value="${item.price}" min="0" step="0.01"
                        onchange="purchasesController.updateItemPrice(${idx}, this.value)"
                        style="width:80px; border:1px solid #ddd; border-radius:4px; background:#fff8e1; text-align:center; font-weight:900; font-size:0.9rem; padding:2px 4px; color:#e67e22;">
                </td>
                <td style="text-align:center; font-weight:950; font-size:1rem; color:var(--primary-color);">${(item.price * item.quantity).toLocaleString()}</td>
                <td style="text-align:center;">
                    <button onclick="purchasesController.removeFromCart(${idx})"
                        style="width:28px; height:28px; border:none; background:#fdecea; color:#e74c3c; border-radius:6px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;" title="\u062d\u0630\u0641">
                        <i data-lucide="trash-2" style="width:13px;"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        lucide.createIcons();
        this.updateTotals();
    },

    updateItemQty(idx, val) {
        const qty = parseInt(val);
        if (qty > 0) {
            this.cart[idx].quantity = qty;
            const totalCell = document.querySelector(`#pur-row-${idx} td:nth-child(7)`);
            if (totalCell) totalCell.innerText = (this.cart[idx].price * qty).toLocaleString();
            this.updateTotals();
        }
    },

    updateItemPrice(idx, val) {
        const price = parseFloat(val);
        if (price >= 0) {
            this.cart[idx].price = price;
            const totalCell = document.querySelector(`#pur-row-${idx} td:nth-child(7)`);
            if (totalCell) totalCell.innerText = (price * this.cart[idx].quantity).toLocaleString();
            this.updateTotals();
        }
    },

    removeFromCart(idx) {
        this.cart.splice(idx, 1);
        this.renderCart();
    },

    clearCart() {
        if (confirm("\u0625\u0641\u0631\u0627\u063a \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629\u061f")) {
            this.cart = [];
            this.renderCart();
        }
    },

    newPurchase() {
        if (this.cart.length > 0) {
            if (!confirm("\u0647\u0644 \u062a\u0631\u064a\u062f \u0628\u062f\u0621 \u0641\u0627\u062a\u0648\u0631\u0629 \u0634\u0631\u0627\u0621 \u062c\u062f\u064a\u062f\u0629\u061f")) return;
        }
        this.cart = [];
        this.editingPurchaseId = null;
        this.selectedSupplierId = 0;
        this.render(document.getElementById('view-container'));
        App.showToast("\u0641\u0627\u062a\u0648\u0631\u0629 \u0634\u0631\u0627\u0621 \u062c\u062f\u064a\u062f\u0629", "info");
    },

    cancelEdit() {
        if (confirm("\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062a\u0639\u062f\u064a\u0644 \u0648\u0627\u0644\u0639\u0648\u062f\u0629 \u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u062c\u062f\u064a\u062f\u0629\u061f")) {
            this.editingPurchaseId = null;
            this.cart = [];
            this.render(document.getElementById('view-container'));
        }
    },

    updateSupplier() {
        this.selectedSupplierId = parseInt(document.getElementById('pur-supplier').value) || null;
    },

    quickAddSupplier() {
        const name = prompt("أدخل اسم المورد الجديد:");
        if (!name) return;
        const newSupplier = { id: Date.now(), name: name, balance: 0, dateAdded: new Date().toISOString() };
        db.addItem('suppliers', newSupplier);
        App.showToast("تمت إضافة المورد " + name, "success");
        this.render(document.getElementById('view-container'));
    },

    updateTotals() {
        const total = this.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const paidInput = document.getElementById('pur-paid');
        const payModeEl = document.querySelector('input[name="pur-pay-mode"]:checked');
        const payMode = payModeEl ? payModeEl.value : 'cash';
        
        if (paidInput && (payMode === 'cash')) {
            paidInput.value = total;
        }

        const paid = parseFloat(paidInput?.value) || 0;
        const change = paid - total;

        const sumTotalElem = document.getElementById('sum-total');
        const sumChangeElem = document.getElementById('sum-change');
        const bigTotalElem = document.getElementById('big-total-display');

        if (sumTotalElem) sumTotalElem.innerText = total.toLocaleString();
        if (sumChangeElem) sumChangeElem.innerText = change.toLocaleString();
        if (bigTotalElem) bigTotalElem.innerText = total.toLocaleString();
    },

    onPaymentModeChange() {
        const payModeEl = document.querySelector('input[name="pur-pay-mode"]:checked');
        const payMode = payModeEl ? payModeEl.value : 'cash';
        const paidEl = document.getElementById('pur-paid');
        if (!paidEl) return;
        
        const total = this.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        if (payMode === 'cash') {
            paidEl.value = total;
        } else {
            paidEl.value = 0;
        }
        this.updateTotals();
    },

    handleSave(doPrint = true) {
        if (this.cart.length === 0) return;
        
        const supplierSelect = document.getElementById('pur-supplier');
        const supplierId = parseInt(supplierSelect.value);
        const isCredit = document.querySelector('input[name="pur-pay-mode"]:checked').value === 'credit';
        
        if (isCredit && !supplierId) {
            App.showToast("\u064a\u062c\u0628 \u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0645\u0648\u0631\u062f \u0639\u0646\u062f \u0627\u0644\u0634\u0631\u0627\u0621 \u0627\u0644\u0622\u062c\u0644!", "error");
            return;
        }

        const total = this.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const paid = parseFloat(document.getElementById('pur-paid').value) || 0;
        const isEditing = !!this.editingPurchaseId;
        
        const purchaseData = {
            id: isEditing ? this.editingPurchaseId : this.invoiceNumber,
            date: (() => {
                const dateIn = document.getElementById('pur-date');
                return dateIn ? new Date(dateIn.value).toISOString() : new Date().toISOString();
            })(),
            supplierId: supplierId,
            supplierName: supplierId ? supplierSelect.options[supplierSelect.selectedIndex].text : '\u0646\u0642\u062f\u064a',
            items: [...this.cart],
            total: total,
            paid: paid,
            paymentMethod: document.querySelector('input[name="pur-pay-mode"]:checked').value,
            ref: document.getElementById('pur-ref').value,
            notes: document.getElementById('pur-notes').value
        };

        const products = db.getCollection('products');

        if (isEditing) {
            // --- EDIT MODE REVERSAL ---
            const oldPur = db.getCollection('purchases').find(p => p.id == this.editingPurchaseId);
            if (oldPur && oldPur.items) {
                // Remove old stock gain
                oldPur.items.forEach(oldItem => {
                    const pIdx = products.findIndex(p => p.id === oldItem.id);
                    if (pIdx !== -1) {
                        products[pIdx].quantity = Math.max(0, (products[pIdx].quantity || 0) - oldItem.quantity);
                    }
                });
            }
            if (oldPur && oldPur.supplierId) {
                // Reverse old credit balance
                const suppliers = db.getCollection('suppliers');
                const sIdx = suppliers.findIndex(s => s.id === oldPur.supplierId);
                if (sIdx !== -1) {
                    const oldRemaining = (oldPur.total || 0) - (oldPur.paid || 0);
                    suppliers[sIdx].balance = Math.max(0, (suppliers[sIdx].balance || 0) - oldRemaining);
                    db.saveCollection('suppliers', suppliers);
                }
            }
            db.updateItem('purchases', this.editingPurchaseId, purchaseData);
            App.showToast(`\u2714 \u062a\u0645 \u062a\u0639\u062f\u064a\u0644 \u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0644\u0634\u0631\u0627\u0621 #${this.editingPurchaseId}`, "success");
        } else {
            db.addItem('purchases', purchaseData);
            App.showToast(`\u062a\u0645 \u062d\u0641\u0638 \u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0644\u0634\u0631\u0627\u0621 #${this.invoiceNumber}`, "success");
        }

        // Apply Stock Gain
        this.cart.forEach(item => {
            const idx = products.findIndex(p => p.id === item.id);
            if (idx !== -1) {
                products[idx].quantity = (products[idx].quantity || 0) + item.quantity;
                products[idx].purchasePrice = item.price;
                if (item.newSellPrice) products[idx].price = item.newSellPrice;
            }
        });
        db.saveCollection('products', products);

        // Adjust Supplier Balance
        const remaining = total - paid;
        if (supplierId) {
            const suppliers = db.getCollection('suppliers');
            const sIdx = suppliers.findIndex(s => s.id === supplierId);
            if (sIdx !== -1) {
                suppliers[sIdx].balance = (suppliers[sIdx].balance || 0) + remaining;
                db.saveCollection('suppliers', suppliers);
            }
        }

        if (doPrint) {
            App.printInvoice(purchaseData, 'purchases');
        }
        
        this.editingPurchaseId = null;
        this.cart = [];
        this.render(document.getElementById('view-container'));
    }
};

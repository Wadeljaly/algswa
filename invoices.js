window.invoicesController = {
    currentTab: 'sales',

    render(container) {
        // Full screen style
        container.style.padding = '0';
        container.style.overflow = 'hidden';

        container.innerHTML = `
            <div class="tager-pos-view view-entry">
                <!-- Top Navigation Tabs -->
                <div class="tager-top-tabs">
                    <div class="tager-tab ${this.currentTab === 'sales' ? 'active' : ''}" onclick="invoicesController.switchTab('sales')"><i data-lucide="shopping-cart" style="width:14px;"></i> سجل المبيعات</div>
                    <div class="tager-tab ${this.currentTab === 'purchases' ? 'active' : ''}" onclick="invoicesController.switchTab('purchases')"><i data-lucide="shopping-bag" style="width:14px;"></i> سجل المشتريات</div>
                    <div class="tager-tab ${this.currentTab === 'proformas' ? 'active' : ''}" onclick="invoicesController.switchTab('proformas')"><i data-lucide="file-text" style="width:14px;"></i> عروض الأسعار</div>
                    <div class="tager-tab ${this.currentTab === 'drafts' ? 'active' : ''}" onclick="invoicesController.switchTab('drafts')"><i data-lucide="archive" style="width:14px;"></i> المسودات</div>
                </div>

                <div class="tager-main-layout">
                    <!-- Main Area -->
                    <div class="tager-main-content">
                        <!-- Header Section -->
                        <div class="tager-main-header" style="height:auto; min-height:60px; padding:10px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:20px;">
                                <div style="flex:1;">
                                    <h2 style="margin:0; font-size:1rem; font-weight:900; color:var(--primary-color);">أرشيف الفواتير - ${this.currentTab === 'sales' ? 'مبيعات' : this.currentTab === 'purchases' ? 'مشتريات' : 'عروض أسعار'}</h2>
                                </div>
                                <div class="tager-item-entry-bar" style="flex:2; margin:0; border:none; background:#f0f2f5;">
                                    <div class="tager-entry-group" style="flex:1; border:none;">
                                        <input type="text" id="inv-search" class="tager-classic-input" placeholder="بحث برقم الفاتورة أو اسم العميل / المورد..." oninput="invoicesController.filterInvoices()">
                                    </div>
                                    <button class="tager-arrow-btn blue"><i data-lucide="search" style="width:16px;"></i></button>
                                </div>
                                <div style="flex:1; text-align:left;">
                                    <button class="tager-arrow-btn" onclick="App.switchView('dashboard')">العودة للرئيسية</button>
                                </div>
                            </div>
                        </div>

                        <!-- Grid Section -->
                        <div class="tager-table-container">
                            <table class="tager-grid">
                                <thead>
                                    <tr>
                                        <th width="80">رقم الفاتورة</th>
                                        <th width="120">التاريخ</th>
                                        <th>الاسم</th>
                                        <th width="100">الإجمالي</th>
                                        <th width="100">المسدد</th>
                                        <th width="120">الحالة</th>
                                        <th width="150" style="text-align: center;">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody id="invoices-list-body">
                                    ${this.renderList()}
                                </tbody>
                            </table>
                        </div>

                        <!-- Footer Actions -->
                        <div class="tager-final-actions" style="position:relative; margin-top:auto;">
                            <button class="tager-final-btn" onclick="invoicesController.switchTab('sales')">عرض مبيعات اليوم</button>
                            <button class="tager-final-btn" onclick="invoicesController.switchTab('purchases')">عرض مشتريات اليوم</button>
                            <button class="tager-final-btn" onclick="App.switchView('dashboard')">إغلاق</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Invoice Detail Modal -->
            <div id="invoice-detail-modal" class="modal">
                <div class="modal-content" style="width: 850px; padding: 15px; background:#fff; border-radius:8px;">
                     <div id="inv-modal-body"></div>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    renderList(filtered) {
        const type = this.currentTab;
        const items = filtered || db.getCollection(type);
        const settings = db.getSettings();

        if (items.length === 0) {
            return `<tr><td colspan="7" style="text-align: center; padding: 5rem; color: var(--text-secondary); font-weight: 700;">لا توجد سجلات في هذه الفئة</td></tr>`;
        }

        return [...items].reverse().map(inv => {
            const remaining = (inv.total || 0) - (inv.paid || 0);
            const isSettled = remaining <= 0;

            let statusColor = 'var(--success)';
            let statusText = 'مكتمل';
            if (inv.paymentMethod === 'credit' && !isSettled) {
                statusColor = 'var(--danger-color)';
                statusText = `آجل (${remaining.toLocaleString()})`;
            } else if (inv.paymentMethod === 'bankak') {
                statusColor = 'var(--primary-color)';
                statusText = 'بنكك';
            } else if (inv.paymentMethod === 'credit' && isSettled) {
                statusText = 'آجل - مُخلَّص';
            }

            return `
            <tr>
                <td style="font-weight: 850; color: var(--primary-color);">#${inv.id}</td>
                <td style="font-weight: 700;">${new Date(inv.date).toLocaleDateString('ar-EG')}</td>
                <td style="font-weight: 800; color: var(--text-main);">${inv.customerName || inv.supplierName || 'عميل نقدي'}</td>
                <td style="font-weight: 950; font-size: 1.1rem;">${(inv.total || 0).toLocaleString()} ${settings.currency}</td>
                <td style="font-weight: 800; color: var(--text-secondary);">${(inv.paid || 0).toLocaleString()}</td>
                <td>
                    <span style="padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 900; background: rgba(0,0,0,0.03); color: ${statusColor}; border: 1.5px solid ${statusColor}55;">
                        ${statusText}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem; justify-content: center; align-items: center;">
                        <button class="neumorph-btn" style="width: 34px; height: 34px; color: var(--primary-color); border-radius: 10px;" onclick="invoicesController.viewDetail('${type}', '${inv.id}')" title="عرض الفاتورة"><i data-lucide="eye" style="width: 16px;"></i></button>
                        ${inv.paymentMethod === 'credit' && !isSettled ? `
                        <button class="neumorph-btn" style="width: 34px; height: 34px; color: var(--success); border-radius: 10px;" onclick="invoicesController.settleInvoice('${type}', '${inv.id}')" title="تحصيل"><i data-lucide="check-circle" style="width: 16px;"></i></button>
                        ` : ''}
                        <button class="neumorph-btn" style="width: 34px; height: 34px; color: var(--warning-color); border-radius: 10px;" onclick="invoicesController.editInvoice('${type}', '${inv.id}')" title="تعديل الفاتورة"><i data-lucide="edit-3" style="width: 16px;"></i></button>
                        <button class="neumorph-btn" style="width: 34px; height: 34px; color: var(--danger-color); border-radius: 10px;" onclick="invoicesController.deleteInvoice('${type}', '${inv.id}')" title="حذف"><i data-lucide="trash-2" style="width: 16px;"></i></button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    },

    filterInvoices() {
        const query = document.getElementById('inv-search').value.toLowerCase();
        const type = this.currentTab;
        const all = db.getCollection(type);
        const filtered = all.filter(inv =>
            inv.id.toString().includes(query) ||
            (inv.customerName && inv.customerName.toLowerCase().includes(query)) ||
            (inv.supplierName && inv.supplierName.toLowerCase().includes(query))
        );
        document.getElementById('invoices-list-body').innerHTML = this.renderList(filtered);
        lucide.createIcons();
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.render(document.getElementById('view-container'));
    },

    viewDetail(type, id) {
        const inv = db.getCollection(type).find(i => i.id == id);
        if (!inv) return;

        const modal = document.getElementById('invoice-detail-modal');
        const content = document.getElementById('inv-modal-body');
        const title = type === 'purchases' ? 'فاتورة شراء' : (type === 'proformas' ? 'عرض سعر' : 'فاتورة مبيعات');

        content.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 style="font-weight: 950;">تفاصيل الفاتورة #${id}</h2>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <button class="btn-primary-nm" style="padding: 0.8rem 2rem; display: flex; align-items: center; gap: 0.8rem;" onclick="invoicesController.printCurrentInvoice('${type}', '${id}')">
                        <i data-lucide="printer" style="width: 18px;"></i> طباعة
                    </button>
                    <button class="neumorph-btn" style="width: 45px; height: 45px; border-radius: 50%; font-size: 1.2rem;" onclick="invoicesController.closeModal()">&times;</button>
                </div>
            </div>
            <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: inset 0 0 20px rgba(0,0,0,0.05); overflow-x: auto;">
                ${App.generateInvoiceHTML(inv, title)}
            </div>
        `;

        modal.classList.add('active');
        lucide.createIcons();
    },

    closeModal() {
        const m = document.getElementById('invoice-detail-modal');
        if (m) m.classList.remove('active');
    },

    printCurrentInvoice(type, id) {
        const inv = db.getCollection(type).find(i => i.id == id);
        if (inv) App.printInvoice(inv, type);
    },

    deleteInvoice(type, id) {
        if (confirm("تحذير: سيتم حذف هذه الفاتورة نهائياً من السجلات. هل أنت متأكد؟")) {
            db.deleteItem(type, id);
            App.showToast("تم حذف الفاتورة بنجاح", "info");
            this.render(document.getElementById('view-container'));
        }
    },

    settleInvoice(type, id) {
        const inv = db.getCollection(type).find(i => i.id == id);
        if (!inv) return;

        const remaining = (inv.total || 0) - (inv.paid || 0);
        const settings = db.getSettings();
        const currency = settings.currency || 'ج.س';

        const overlay = document.createElement('div');
        overlay.id = 'settle-overlay';
        overlay.className = 'modal active';
        overlay.innerHTML = `
            <div class="modal-content stat-card-nm" style="width: 400px; padding: 2.5rem; max-height: auto;">
                <h2 style="font-weight: 950; color: var(--success); margin-bottom: 1.5rem;">تحصيل المستحق</h2>
                <div class="stat-card-nm" style="padding: 1.2rem; margin-bottom: 1.5rem; background: var(--surface-dim);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-weight:800;"><span>إجمالي الفاتورة:</span><span>${(inv.total||0).toLocaleString()} ${currency}</span></div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-weight:800;"><span>المدفوع سابقاً:</span><span>${(inv.paid||0).toLocaleString()} ${currency}</span></div>
                    <div style="display:flex; justify-content:space-between; font-weight:950; color:var(--danger-color);"><span>المتبقي الآن:</span><span>${remaining.toLocaleString()} ${currency}</span></div>
                </div>
                <label style="font-weight:800; display:block; margin-bottom:0.8rem;">المبلغ الواصل الآن:</label>
                <div class="input-wrapper neumorph-inset" style="margin-bottom: 2rem;">
                    <input type="number" id="settle-amount" value="${remaining}" max="${remaining}" style="font-weight: 950; font-size: 1.3rem; color: var(--primary-color);">
                </div>
                <div style="display:flex; gap:1rem;">
                    <button class="btn-primary-nm" onclick="invoicesController.confirmSettle('${type}','${id}')" style="flex:1; padding:1.2rem; background:var(--success);">تأكيد الدفع</button>
                    <button class="neumorph-btn" onclick="document.getElementById('settle-overlay').remove()" style="flex:1; padding:1.2rem; font-weight:800;">إلغاء</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    confirmSettle(type, id) {
        const amount = parseFloat(document.getElementById('settle-amount').value) || 0;
        if (amount <= 0) {
            App.showToast('يرجى إدخال مبلغ صحيح', 'warning');
            return;
        }

        const all = db.getCollection(type);
        const idx = all.findIndex(i => i.id == id);
        if (idx === -1) return;

        const inv = all[idx];
        const remaining = inv.total - (inv.paid || 0);
        const actualPaid = Math.min(amount, remaining);

        all[idx].paid = (inv.paid || 0) + actualPaid;
        db.saveCollection(type, all);

        if (type === 'sales' && inv.customerId) {
            const customers = db.getCollection('customers');
            const cIdx = customers.findIndex(c => c.id == inv.customerId);
            if (cIdx !== -1) {
                customers[cIdx].balance = Math.max(0, (customers[cIdx].balance || 0) - actualPaid);
                db.saveCollection('customers', customers);
            }
        } else if (type === 'purchases' && inv.supplierId) {
            const suppliers = db.getCollection('suppliers');
            const sIdx = suppliers.findIndex(s => s.id == inv.supplierId);
            if (sIdx !== -1) {
                suppliers[sIdx].balance = Math.max(0, (suppliers[sIdx].balance || 0) - actualPaid);
                db.saveCollection('suppliers', suppliers);
            }
        }

        const o = document.getElementById('settle-overlay');
        if (o) o.remove();
        App.showToast(`تم تحصيل ${actualPaid.toLocaleString()} وتحديث الحسابات`, 'success');
        this.render(document.getElementById('view-container'));
    },

    editInvoice(type, id) {
        const inv = db.getCollection(type).find(i => i.id == id);
        if (!inv) return;

        if (type === 'sales' || type === 'proformas' || type === 'drafts') {
            App.switchView('sales');
            const ctrl = window.salesController;
            ctrl.cart = JSON.parse(JSON.stringify(inv.items));
            ctrl.selectedCustomerId = inv.customerId;
            ctrl.editingInvoiceId = (type === 'sales') ? inv.id : null; // Track if we are editing a saved sale
            
            setTimeout(() => {
                const custEl = document.getElementById('pos-customer');
                const notesEl = document.getElementById('invoice-notes');
                const refEl = document.getElementById('invoice-ref');
                
                if (custEl) custEl.value = inv.customerId || 0;
                if (notesEl) notesEl.value = inv.notes || '';
                if (refEl) refEl.value = inv.ref || '';
                
                // Set payment mode
                const payMode = document.querySelector(`input[name="pay-mode"][value="${inv.paymentMethod || 'cash'}"]`);
                if (payMode) payMode.checked = true;

                // Set paid amount
                const paidEl = document.getElementById('sum-paid');
                if (paidEl) paidEl.value = inv.paid || 0;

                ctrl.updateTotals();
                ctrl.renderCart(); 
                
                if (ctrl.editingInvoiceId) {
                    App.showToast("أنت الآن تقوم بتعديل الفاتورة رقم #" + id, "warning");
                }
            }, 100);
        } else if (type === 'purchases') {
            App.switchView('purchases');
            const ctrl = window.purchasesController;
            ctrl.cart = JSON.parse(JSON.stringify(inv.items));
            ctrl.editingPurchaseId = inv.id;
            
            setTimeout(() => {
                const supEl = document.getElementById('p-supplier');
                const notesEl = document.getElementById('p-notes');
                if (supEl) supEl.value = inv.supplierId;
                if (notesEl) notesEl.value = inv.notes || inv.note || '';
                
                ctrl.updateTotals();
                ctrl.renderCart();
                App.showToast("تعديل فاتورة شراء #" + id, "warning");
            }, 100);
        }
    }
};

// Active tab style
const invStyleSheet = document.createElement("style");
invStyleSheet.innerText = `
    .active-tab { background: var(--surface-dim) !important; color: var(--primary-color) !important; box-shadow: var(--shadow-inset) !important; }
    #invoice-detail-modal .modal-content { max-height: 95vh; overflow-y: auto; }
`;
document.head.appendChild(invStyleSheet);

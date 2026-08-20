window.suppliersController = {
    render: function(container) {
        const suppliers = db.getCollection('suppliers');

        container.innerHTML = `
            <div id="suppliers-view" class="view-entry">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem;">
                    <div>
                        <h1 style="font-weight: 900; margin-bottom: 0.5rem;">إدارة الموردين</h1>
                        <p style="color: var(--text-secondary); font-weight: 700;">إدارة الشركات، المديونيات، وكشوفات الحساب التاريخية</p>
                    </div>
                    <button class="btn-primary-nm" style="width: auto; padding: 1rem 2.5rem; display: flex; align-items: center; gap: 1rem;" 
                            onclick="suppliersController.showAddModal()">
                        <i data-lucide="plus-circle"></i> إضافة مورد جديد
                    </button>
                </div>

                <div class="stat-card-nm" style="padding: 1.5rem; margin-bottom: 2.5rem;">
                    <div class="search-bar-nm" style="width: 100%;">
                        <i data-lucide="search" style="color: var(--primary-color);"></i>
                        <input type="text" id="supplier-search" placeholder="بحث باسم المورد أو رقم الهاتف..." oninput="suppliersController.filterSuppliers()">
                    </div>
                </div>

                <div class="stat-card-nm" style="padding: 1rem;">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th style="padding-right: 2rem;">اسم المورد / الشركة</th>
                                <th width="180">رقم الهاتف</th>
                                <th>العنوان</th>
                                <th width="200">المديونية</th>
                                <th width="240" style="text-align: center;">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="suppliers-list">
                            ${suppliersController.renderList(suppliers)}
                        </tbody>
                    </table>
                </div>

                <!-- Payment Modal -->
                <div id="payment-modal" class="modal">
                    <div class="modal-content stat-card-nm" style="width: 400px; padding: 2.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                            <h2 style="font-weight: 950; color: var(--success);">تسجيل دفعة</h2>
                            <button class="neumorph-btn" style="width: 40px; height: 40px; border-radius: 50%;" onclick="suppliersController.closePaymentModal()">&times;</button>
                        </div>
                        <form id="payment-form" onsubmit="suppliersController.handlePayment(event)" style="display: flex; flex-direction: column; gap: 1.5rem;">
                            <input type="hidden" id="pay-s-id">
                            <div class="input-group">
                                <label style="font-weight: 800; margin-bottom: 0.8rem; display: block;">اسم المورد</label>
                                <div class="input-wrapper neumorph-inset">
                                    <input type="text" id="pay-s-name" readonly style="color: var(--primary-color); font-weight: 900;">
                                </div>
                            </div>
                            <div class="input-group">
                                <label style="font-weight: 800; margin-bottom: 0.8rem; display: block;">المبلغ المدفوع</label>
                                <div class="input-wrapper neumorph-inset">
                                    <input type="number" id="pay-amount" required step="0.01" placeholder="0.00" style="font-weight: 950; font-size: 1.2rem; color: var(--success);">
                                </div>
                            </div>
                            <div class="input-group">
                                <label style="font-weight: 800; margin-bottom: 0.8rem; display: block;">طريقة السداد</label>
                                <div style="display: flex; gap: 1.5rem; margin-top: 0.5rem;">
                                     <div class="nav-item active" style="margin-bottom: 0; justify-content: center; flex: 1;">
                                        <input type="radio" name="pay-method" value="cash" checked id="pay-m-cash">
                                        <label for="pay-m-cash" style="margin-right: 0.5rem; font-weight: 800; cursor: pointer;">نقدي</label>
                                     </div>
                                     <div class="nav-item" style="margin-bottom: 0; justify-content: center; flex: 1;">
                                        <input type="radio" name="pay-method" value="bankak" id="pay-m-bank">
                                        <label for="pay-m-bank" style="margin-right: 0.5rem; font-weight: 800; cursor: pointer;">بنكك</label>
                                     </div>
                                </div>
                            </div>
                            <button type="submit" class="btn-primary-nm" style="background: var(--success); padding: 1.2rem; margin-top: 1rem;">تأكيد وصرف المبلغ</button>
                        </form>
                    </div>
                </div>

                <!-- Account Statement Modal -->
                <div id="statement-modal" class="modal">
                    <div class="modal-content stat-card-nm" style="width: 850px; padding: 2.5rem; max-height: 90vh; overflow-y: auto;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                            <h2 style="font-weight: 950;">كشف الحساب: <span id="statement-s-name" style="color: var(--primary-color);"></span></h2>
                            <button class="neumorph-btn" style="width: 40px; height: 40px; border-radius: 50%;" onclick="suppliersController.closeStatementModal()">&times;</button>
                        </div>
                        <div id="statement-content"></div>
                        <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
                            <button class="btn-primary-nm" style="width: auto; padding: 0.6rem 1.5rem; font-size: 0.85rem;" onclick="window.print()">
                                <i data-lucide="printer" style="margin-left: 8px; width: 16px;"></i> طباعة الحساب
                            </button>
                            <button class="neumorph-btn" style="width: auto; padding: 0.6rem 1.5rem; font-size: 0.85rem; font-weight: 850;" onclick="suppliersController.closeStatementModal()">إغلاق</button>
                        </div>
                    </div>
                </div>

                <!-- Supplier Modal -->
                <div id="supplier-modal" class="modal">
                    <div class="modal-content stat-card-nm" style="width: 450px; padding: 2.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                            <h2 id="supplier-modal-title" style="font-weight: 950; color: var(--primary-color);">إضافة مورد</h2>
                            <button class="neumorph-btn" style="width: 40px; height: 40px; border-radius: 50%;" onclick="suppliersController.closeModal()">&times;</button>
                        </div>
                        <form id="supplier-form" onsubmit="suppliersController.handleSave(event)" style="display: flex; flex-direction: column; gap: 1.5rem;">
                            <input type="hidden" id="s-id">
                            <div class="input-group">
                                <label style="font-weight: 800; margin-bottom: 0.8rem; display: block;">اسم المورد / الشركة</label>
                                <div class="input-wrapper neumorph-inset">
                                    <input type="text" id="s-name" required placeholder="مثال: شركة البركة للتجارة">
                                </div>
                            </div>
                            <div class="input-group">
                                <label style="font-weight: 800; margin-bottom: 0.8rem; display: block;">رقم الهاتف</label>
                                <div class="input-wrapper neumorph-inset">
                                    <input type="text" id="s-phone" required placeholder="09xxxxxxx">
                                </div>
                            </div>
                            <div class="input-group">
                                <label style="font-weight: 800; margin-bottom: 0.8rem; display: block;">العنوان</label>
                                <div class="input-wrapper neumorph-inset">
                                    <input type="text" id="s-address" placeholder="الخرطوم، المنطقة الصناعية...">
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                                <button type="submit" class="btn-primary-nm" style="flex: 1; padding: 1.2rem;">حفظ البيانات</button>
                                <button type="button" class="neumorph-btn" style="flex: 1; padding: 1.2rem; font-weight: 800;" onclick="suppliersController.closeModal()">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    renderList: function(suppliers) {
        if (!suppliers || suppliers.length === 0) {
            return `<tr><td colspan="5" style="text-align: center; padding: 5rem; color: var(--text-secondary); font-weight: 700;">لا يوجد موردين مسجلين حالياً</td></tr>`;
        }

        return suppliers.map(s => `
            <tr>
                <td style="padding-right: 2rem; font-weight: 850; color: var(--text-main); font-size: 1.1rem;">${s.name}</td>
                <td style="font-weight: 800;">${s.phone}</td>
                <td style="font-weight: 700; color: var(--text-secondary);">${s.address || '---'}</td>
                <td style="font-weight: 950; color: ${s.balance > 0 ? 'var(--danger-color)' : 'var(--success)'}; font-size: 1.15rem;">
                    ${(s.balance || 0).toLocaleString()}
                </td>
                <td>
                    <div style="display: flex; gap: 0.6rem; justify-content: center;">
                        <button class="neumorph-btn" style="width: 38px; height: 38px; border-radius: 12px; color: var(--primary-color);" onclick="suppliersController.showStatementModal(${s.id})" title="كشف حساب"><i data-lucide="file-text" style="width: 18px;"></i></button>
                        <button class="neumorph-btn" style="width: 38px; height: 38px; border-radius: 12px; color: var(--success);" onclick="suppliersController.showPaymentModal(${s.id})" title="سداد دفعة"><i data-lucide="banknote" style="width: 18px;"></i></button>
                        <button class="neumorph-btn" style="width: 38px; height: 38px; border-radius: 12px; color: var(--primary-color);" onclick="suppliersController.showEditModal(${s.id})" title="تعديل"><i data-lucide="edit-3" style="width: 18px;"></i></button>
                        <button class="neumorph-btn" style="width: 38px; height: 38px; border-radius: 12px; color: var(--danger-color);" onclick="suppliersController.handleDelete(${s.id})" title="حذف"><i data-lucide="trash-2" style="width: 18px;"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    filterSuppliers: function() {
        const query = document.getElementById('supplier-search').value.toLowerCase();
        const suppliers = db.getCollection('suppliers');
        const filtered = suppliers.filter(s => s.name.toLowerCase().includes(query) || s.phone.includes(query));
        document.getElementById('suppliers-list').innerHTML = suppliersController.renderList(filtered);
        lucide.createIcons();
    },

    showAddModal: function() {
        const modal = document.getElementById('supplier-modal');
        document.getElementById('supplier-modal-title').innerText = "إضافة مورد جديد";
        document.getElementById('supplier-form').reset();
        document.getElementById('s-id').value = "";
        modal.classList.add('active');
    },

    showEditModal: function(id) {
        const suppliers = db.getCollection('suppliers');
        const s = suppliers.find(s => s.id == id);
        if (!s) return;
        const modal = document.getElementById('supplier-modal');
        document.getElementById('supplier-modal-title').innerText = "تعديل بيانات المورد";
        document.getElementById('s-id').value = s.id;
        document.getElementById('s-name').value = s.name;
        document.getElementById('s-phone').value = s.phone;
        document.getElementById('s-address').value = s.address || "";
        modal.classList.add('active');
    },

    closeModal: function() { document.getElementById('supplier-modal').classList.remove('active'); },

    handleSave: function(e) {
        e.preventDefault();
        const id = document.getElementById('s-id').value;
        const supplierData = {
            name: document.getElementById('s-name').value,
            phone: document.getElementById('s-phone').value,
            address: document.getElementById('s-address').value
        };
        if (id) {
            db.updateItem('suppliers', id, supplierData);
            App.showToast("تم تحديث بيانات المورد", "success");
        } else {
            supplierData.balance = 0;
            db.addItem('suppliers', supplierData);
            App.showToast("تمت إضافة المورد لقاعدة البيانات", "success");
        }
        suppliersController.closeModal();
        suppliersController.render(document.getElementById('view-container'));
    },

    handleDelete: function(id) {
        if (confirm("هل أنت متأكد من حذف هذا المورد نهائياً؟")) {
            db.deleteItem('suppliers', id);
            App.showToast("تم حذف سجل المورد", "info");
            suppliersController.render(document.getElementById('view-container'));
        }
    },

    showPaymentModal: function(id) {
        const suppliers = db.getCollection('suppliers');
        const s = suppliers.find(s => s.id == id);
        if (!s) return;
        const modal = document.getElementById('payment-modal');
        document.getElementById('pay-s-id').value = s.id;
        document.getElementById('pay-s-name').value = s.name;
        document.getElementById('pay-amount').value = "";
        modal.classList.add('active');
    },

    closePaymentModal: function() { document.getElementById('payment-modal').classList.remove('active'); },

    handlePayment: function(e) {
        e.preventDefault();
        const id = document.getElementById('pay-s-id').value;
        const amount = parseFloat(document.getElementById('pay-amount').value);
        const method = document.querySelector('input[name="pay-method"]:checked').value;
        const methodAr = method === 'bankak' ? 'بنكك' : 'نقداً';
        if (!amount || amount <= 0) return;

        const suppliers = db.getCollection('suppliers');
        const sIdx = suppliers.findIndex(s => s.id == id);
        if (sIdx !== -1) {
            suppliers[sIdx].balance = (suppliers[sIdx].balance || 0) - amount;
            db.saveCollection('suppliers', suppliers);
            db.addItem('supplier_transactions', {
                id: Date.now(),
                supplierId: parseInt(id),
                type: 'payment',
                amount: amount,
                date: new Date().toISOString(),
                note: `دفعة (${methodAr})`
            });
            App.showToast(`تم سداد ${amount.toLocaleString()} للمورد ${suppliers[sIdx].name}`, "success");
        }
        suppliersController.closePaymentModal();
        suppliersController.render(document.getElementById('view-container'));
    },

    showStatementModal: function(id) {
        const suppliers = db.getCollection('suppliers');
        const s = suppliers.find(s => s.id == id);
        if (!s) return;

        const transactions = db.getCollection('supplier_transactions').filter(t => t.supplierId == id);
        const purchases = db.getCollection('purchases').filter(p => p.supplierId == id);
        const settings = db.getSettings();

        const allEvents = [
            ...transactions.map(t => ({ ...t })),
            ...purchases.map(p => ({ ...p, amount: p.total, note: `شراء فاتورة #${p.id}`, type: 'purchase' }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        const modal = document.getElementById('statement-modal');
        const content = document.getElementById('statement-content');
        
        // Update Modal Width & Header Style
        modal.querySelector('.modal-content').style.width = '950px';
        modal.querySelector('.modal-content').style.padding = '1.5rem';
        modal.querySelector('.modal-content').style.display = 'flex';
        modal.querySelector('.modal-content').style.flexDirection = 'column';
        
        document.getElementById('statement-s-name').innerText = s.name;
        
        content.innerHTML = `
            <!-- Compact Summary Bar -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.2rem;">
                <div class="neumorph-inset" style="padding: 0.8rem; text-align: center; background: #f0fdf4;">
                    <span style="font-size: 0.75rem; color: var(--success); font-weight: 850;">إجمالي المسدد للمورد</span>
                    <p style="font-size: 1.1rem; font-weight: 1000; color: var(--success); margin: 0;">${transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()} <small>${settings.currency}</small></p>
                </div>
                <div class="neumorph-inset" style="padding: 0.8rem; text-align: center; background: #fef2f2;">
                    <span style="font-size: 0.75rem; color: var(--danger-color); font-weight: 850;">إجمالي فواتير الأجل</span>
                    <p style="font-size: 1.1rem; font-weight: 1000; color: var(--danger-color); margin: 0;">${purchases.reduce((sum, p) => sum + p.total, 0).toLocaleString()} <small>${settings.currency}</small></p>
                </div>
                <div class="neumorph-inset" style="padding: 0.8rem; text-align: center; background: #f8fbff; border-bottom: 3px solid var(--primary-color);">
                    <span style="font-size: 0.75rem; color: var(--primary-color); font-weight: 850;">الرصيد المتبقي للمورد</span>
                    <p style="font-size: 1.2rem; font-weight: 1000; color: var(--primary-color); margin: 0;">${(s.balance || 0).toLocaleString()} <small>${settings.currency}</small></p>
                </div>
            </div>
            
            <div style="overflow-y: auto; flex-grow: 1; border-radius: 12px; border: 1px solid #eee; max-height: 55vh;">
                <table class="erp-table" style="font-size: 0.85rem;">
                    <thead style="position: sticky; top: 0; z-index: 5; background: var(--surface-dim);">
                        <tr>
                            <th width="150">التاريخ والوقت</th>
                            <th width="110">نوع الحركة</th>
                            <th>البيان / الملاحظات</th>
                            <th width="120" style="text-align: center;">المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allEvents.map(e => `
                            <tr>
                                <td style="font-weight: 800; font-size: 0.8rem;">
                                    ${new Date(e.date).toLocaleDateString('ar-EG')} 
                                    <span style="opacity:0.5; font-size: 0.7rem;">${new Date(e.date).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>
                                </td>
                                <td>
                                    <span style="padding: 2px 8px; border-radius: 20px; font-size: 0.75rem; background: ${e.type === 'payment' ? '#f0fdf4' : '#fff1f2'}; color: ${e.type === 'payment' ? '#15803d' : '#be123c'}; font-weight: 900; display: inline-block; width: 85px; text-align: center;">
                                        ${e.type === 'payment' ? 'سداد دفعة' : 'فاتورة شراء'}
                                    </span>
                                </td>
                                <td style="color: var(--text-secondary); font-weight: 700;">${e.note || '---'}</td>
                                <td style="font-weight: 950; text-align: center; color: var(--text-main); font-size: 1rem;">${e.amount.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        modal.classList.add('active');
        lucide.createIcons();
    },

    closeStatementModal: function() { document.getElementById('statement-modal').classList.remove('active'); }
};

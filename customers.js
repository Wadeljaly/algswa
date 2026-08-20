window.customersController = {
    render(container) {
        const customers = db.getCollection('customers');

        container.innerHTML = `
            <div id="customers-view" class="view-entry">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem;">
                    <div>
                        <h1 style="font-weight: 900; margin-bottom: 0.5rem;">إدارة العملاء</h1>
                        <p style="color: var(--text-secondary); font-weight: 700;">سجل العملاء، مديونياتهم، وبيانات التواصل الخاصة بهم</p>
                    </div>
                    <button class="btn-primary-nm" style="width: auto; padding: 1rem 2.5rem; display: flex; align-items: center; gap: 1rem;" 
                            onclick="customersController.showAddModal()">
                        <i data-lucide="user-plus"></i> إضافة عميل جديد
                    </button>
                </div>

                <div class="stat-card-nm" style="padding: 1.5rem; margin-bottom: 2.5rem;">
                    <div class="search-bar-nm" style="width: 100%;">
                        <i data-lucide="search" style="color: var(--primary-color);"></i>
                        <input type="text" id="customer-search" placeholder="بحث باسم العميل أو رقم الهاتف..." oninput="customersController.filterCustomers()">
                    </div>
                </div>

                <div class="stat-card-nm" style="padding: 1rem;">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th style="padding-right: 2rem;">اسم العميل</th>
                                <th width="180">رقم الهاتف</th>
                                <th>العنوان</th>
                                <th width="200">الرصيد / الدين</th>
                                <th width="120" style="text-align: center;">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="customers-list">
                            ${this.renderList(customers)}
                        </tbody>
                    </table>
                </div>

                <!-- Customer Modal -->
                <div id="customer-modal" class="modal">
                    <div class="modal-content stat-card-nm" style="width: 450px; padding: 2.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                            <h2 id="c-modal-title" style="font-weight: 950; color: var(--primary-color);">إضافة عميل</h2>
                            <button class="neumorph-btn" style="width: 40px; height: 40px; border-radius: 50%;" onclick="customersController.closeModal()">&times;</button>
                        </div>
                        <form id="customer-form" onsubmit="customersController.handleSave(event)" style="display: flex; flex-direction: column; gap: 1.5rem;">
                            <input type="hidden" id="c-id">
                            <div class="input-group">
                                <label style="font-weight: 800; margin-bottom: 0.8rem; display: block;">اسم العميل بالكامل</label>
                                <div class="input-wrapper neumorph-inset">
                                    <input type="text" id="c-name" required placeholder="أدخل اسم العميل">
                                </div>
                            </div>
                            <div class="input-group">
                                <label style="font-weight: 800; margin-bottom: 0.8rem; display: block;">رقم الهاتف</label>
                                <div class="input-wrapper neumorph-inset">
                                    <input type="text" id="c-phone" placeholder="09xxxxxxx">
                                </div>
                            </div>
                            <div class="input-group">
                                <label style="font-weight: 800; margin-bottom: 0.8rem; display: block;">العنوان أو المنطقة</label>
                                <div class="input-wrapper neumorph-inset">
                                    <input type="text" id="c-address" placeholder="الخرطوم، امدرمان...">
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                                <button type="submit" class="btn-primary-nm" style="flex: 1; padding: 1.2rem;">حفظ البيانات</button>
                                <button type="button" class="neumorph-btn" style="flex: 1; padding: 1.2rem; font-weight: 800;" onclick="customersController.closeModal()">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();
    },

    renderList(customers) {
        const settings = db.getSettings();
        if (customers.length === 0) return `<tr><td colspan="5" style="text-align: center; padding: 5rem; color: var(--text-secondary); font-weight: 700;">قائمة العملاء خالية حالياً</td></tr>`;

        return customers.map(c => `
            <tr>
                <td style="padding-right: 2rem; font-weight: 850; color: var(--text-main); font-size: 1.1rem;">${c.name}</td>
                <td style="font-weight: 800;">${c.phone || "---"}</td>
                <td style="font-weight: 700; color: var(--text-secondary);">${c.address || "---"}</td>
                <td style="font-weight: 950; color: ${c.balance > 0 ? 'var(--danger-color)' : 'var(--success)'}; font-size: 1.15rem;">
                    ${(c.balance || 0).toLocaleString()} ${settings.currency}
                </td>
                <td>
                    <div style="display: flex; gap: 0.8rem; justify-content: center;">
                        <button class="neumorph-btn" style="width: 38px; height: 38px; border-radius: 12px; color: var(--primary-color);" onclick="customersController.showStatementModal(${c.id})" title="كشف حساب"><i data-lucide="file-text" style="width: 18px;"></i></button>
                        <button class="neumorph-btn" style="width: 38px; height: 38px; border-radius: 12px; color: var(--success);" onclick="customersController.showSettleModal(${c.id})" title="تحصيل مبلغ"><i data-lucide="dollar-sign" style="width: 18px;"></i></button>
                        <button class="neumorph-btn" style="width: 38px; height: 38px; border-radius: 12px; color: var(--primary-color);" onclick="customersController.showEditModal(${c.id})"><i data-lucide="edit-3" style="width: 18px;"></i></button>
                        <button class="neumorph-btn" style="width: 38px; height: 38px; border-radius: 12px; color: var(--danger-color);" onclick="customersController.handleDelete(${c.id})"><i data-lucide="trash-2" style="width: 18px;"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    filterCustomers() {
        const query = document.getElementById('customer-search').value.toLowerCase();
        const customers = db.getCollection('customers');
        const filtered = customers.filter(c => c.name.toLowerCase().includes(query) || (c.phone && c.phone.includes(query)));
        document.getElementById('customers-list').innerHTML = this.renderList(filtered);
        lucide.createIcons();
    },

    showAddModal() {
        const modal = document.getElementById('customer-modal');
        document.getElementById('c-modal-title').innerText = "إضافة عميل جديد";
        document.getElementById('customer-form').reset();
        document.getElementById('c-id').value = "";
        modal.classList.add('active');
    },

    showEditModal(id) {
        const customers = db.getCollection('customers');
        const c = customers.find(c => c.id == id);
        if (!c) return;
        const modal = document.getElementById('customer-modal');
        document.getElementById('c-modal-title').innerText = "تعديل بيانات العميل";
        document.getElementById('c-id').value = c.id;
        document.getElementById('c-name').value = c.name;
        document.getElementById('c-phone').value = c.phone || "";
        document.getElementById('c-address').value = c.address || "";
        modal.classList.add('active');
    },

    closeModal() { document.getElementById('customer-modal').classList.remove('active'); },

    handleSave(e) {
        e.preventDefault();
        const id = document.getElementById('c-id').value;
        const customerData = {
            name: document.getElementById('c-name').value,
            phone: document.getElementById('c-phone').value,
            address: document.getElementById('c-address').value
        };
        if (id) {
            db.updateItem('customers', id, customerData);
            App.showToast("تم تحديث بيانات العميل بنجاح", "success");
        } else {
            customerData.balance = 0;
            db.addItem('customers', customerData);
            App.showToast("تمت إضافة العميل لقاعدة البيانات", "success");
        }
        this.closeModal();
        this.render(document.getElementById('view-container'));
    },

    handleDelete(id) {
        if (id == 0) {
            App.showToast("لا يمكن حذف العميل النقدي الافتراضي", "warning");
            return;
        }
        if (confirm("تحذير: هل أنت متأكد من حذف هذا العميل؟")) {
            db.deleteItem('customers', id);
            App.showToast("تم حذف سجل العميل", "info");
            this.render(document.getElementById('view-container'));
        }
    },

    showStatementModal(id) {
        const customers = db.getCollection('customers');
        const c = customers.find(c => c.id == id);
        if (!c) return;

        const sales = db.getCollection('sales').filter(s => s.customerId == id);
        const settings = db.getSettings();

        const overlay = document.createElement('div');
        overlay.id = 'c-statement-overlay';
        overlay.className = 'modal active';
        overlay.innerHTML = `
            <div class="modal-content stat-card-nm" style="width: 950px; padding: 1.5rem; max-height: 92vh; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; border-bottom: 2px solid var(--primary-glow); padding-bottom: 0.8rem;">
                    <h2 style="font-weight: 1000; font-size: 1.4rem; color: var(--primary-color);">كشف حساب: <span style="color:var(--text-main);">${c.name}</span></h2>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-primary-nm" style="padding: 0.4rem 1rem; font-size: 0.75rem; width: auto;" onclick="window.print()"><i data-lucide="printer" style="width:14px; margin-left:5px;"></i> طباعة</button>
                        <button class="neumorph-btn" style="width: 32px; height: 32px; border-radius: 50%; font-size: 1.2rem; display:flex; align-items:center; justify-content:center;" onclick="document.getElementById('c-statement-overlay').remove()">&times;</button>
                    </div>
                </div>

                <!-- Compact Summary Bar -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.2rem;">
                    <div class="neumorph-inset" style="padding: 0.8rem; text-align: center; background: #fff;">
                        <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 850;">إجمالي الطلبات</span>
                        <p style="font-size: 1.1rem; font-weight: 1000; color: var(--primary-color); margin: 0;">${sales.reduce((sum, s) => sum + s.total, 0).toLocaleString()} <small>${settings.currency}</small></p>
                    </div>
                    <div class="neumorph-inset" style="padding: 0.8rem; text-align: center; background: #f0fdf4;">
                        <span style="font-size: 0.75rem; color: var(--success); font-weight: 850;">إجمالي المدفوع</span>
                        <p style="font-size: 1.1rem; font-weight: 1000; color: var(--success); margin: 0;">${sales.reduce((sum, s) => sum + s.paid, 0).toLocaleString()} <small>${settings.currency}</small></p>
                    </div>
                    <div class="neumorph-inset" style="padding: 0.8rem; text-align: center; background: #fef2f2;">
                        <span style="font-size: 0.75rem; color: var(--danger-color); font-weight: 850;">المديونية الحالية</span>
                        <p style="font-size: 1.1rem; font-weight: 1000; color: var(--danger-color); margin: 0;">${(c.balance || 0).toLocaleString()} <small>${settings.currency}</small></p>
                    </div>
                    <div class="neumorph-inset" style="padding: 0.8rem; text-align: center; background: #f8fbff;">
                        <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 850;">عدد العمليات</span>
                        <p style="font-size: 1.1rem; font-weight: 1000; color: var(--text-main); margin: 0;">${sales.length}</p>
                    </div>
                </div>

                <div style="overflow-y: auto; flex-grow: 1; border-radius: 12px; border: 1px solid #eee;">
                    <table class="erp-table" style="font-size: 0.85rem;">
                        <thead style="position: sticky; top: 0; z-index: 5; background: var(--surface-dim);">
                            <tr>
                                <th width="100">رقم السند</th>
                                <th width="130">التاريخ والوقت</th>
                                <th>البيان</th>
                                <th width="100">طريقة الدفع</th>
                                <th width="110" style="text-align: center;">إجمالي الفاتورة</th>
                                <th width="110" style="text-align: center;">المبلغ المحصل</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sales.length > 0 ? sales.reverse().map(s => `
                                <tr>
                                    <td style="font-weight: 950; color: var(--primary-color);">#${s.id}</td>
                                    <td style="font-weight: 800; font-size: 0.8rem;">
                                        ${new Date(s.date).toLocaleDateString('ar-EG')} 
                                        <span style="opacity:0.5; font-size: 0.7rem;">${new Date(s.date).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>
                                    </td>
                                    <td style="font-weight: 700;">فاتورة مبيعات (${s.items.length} صنف)</td>
                                    <td>
                                        <span style="padding: 2px 8px; border-radius: 20px; font-size: 0.75rem; background: ${s.paymentMethod === 'credit' ? '#fff1f2' : '#f0fdf4'}; color: ${s.paymentMethod === 'credit' ? '#be123c' : '#15803d'}; font-weight: 900;">
                                            ${s.paymentMethod === 'credit' ? 'أجل' : (s.paymentMethod === 'bankak' ? 'بنكك' : 'نقداً')}
                                        </span>
                                    </td>
                                    <td style="font-weight: 950; text-align: center;">${s.total.toLocaleString()}</td>
                                    <td style="font-weight: 950; color: var(--success); text-align: center;">${s.paid.toLocaleString()}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="6" style="text-align: center; padding: 4rem;">لا توجد عمليات مسجلة للعميل</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        lucide.createIcons();
    },

    showSettleModal(id) {
        const customers = db.getCollection('customers');
        const c = customers.find(c => c.id == id);
        if (!c) return;

        const overlay = document.createElement('div');
        overlay.id = 'c-settle-overlay';
        overlay.className = 'modal active';
        overlay.innerHTML = `
            <div class="modal-content stat-card-nm" style="width: 400px; padding: 2.5rem;">
                <h2 style="font-weight: 950; color: var(--success); margin-bottom: 1.5rem;">تحصيل من عميل</h2>
                <div style="margin-bottom: 1.5rem; text-align: center;">
                    <p style="font-weight: 800; font-size: 1.1rem; margin-bottom: 0.5rem;">${c.name}</p>
                    <div style="background: var(--surface-dim); padding: 1rem; border-radius: 12px; font-weight: 900; font-size: 1.2rem; color: var(--danger-color);">
                        المديونية الحالية: ${c.balance.toLocaleString()}
                    </div>
                </div>
                <div class="input-group">
                    <label style="font-weight: 800; margin-bottom: 0.8rem; display: block;">المبلغ المستلم</label>
                    <div class="input-wrapper neumorph-inset" style="margin-bottom: 2rem;">
                        <input type="number" id="settle-val" value="${c.balance}" style="font-weight: 950; font-size: 1.3rem; text-align: center; color: var(--primary-color);">
                    </div>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn-primary-nm" style="flex: 1; padding: 1.2rem; background: var(--success);" onclick="customersController.handleSettle(${id})">تأكيد الاستلام</button>
                    <button class="neumorph-btn" style="flex: 1; padding: 1.2rem; font-weight: 800;" onclick="document.getElementById('c-settle-overlay').remove()">إلغاء</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    handleSettle(id) {
        const amount = parseFloat(document.getElementById('settle-val').value) || 0;
        if (amount <= 0) return;

        const customers = db.getCollection('customers');
        const idx = customers.findIndex(c => c.id == id);
        if (idx !== -1) {
            customers[idx].balance = Math.max(0, (customers[idx].balance || 0) - amount);
            db.saveCollection('customers', customers);
            
            App.showToast("تم تحصيل المبلغ وتحديث رصيد العميل", "success");
            const overlay = document.getElementById('c-settle-overlay');
            if (overlay) overlay.remove();
            this.render(document.getElementById('view-container'));
        }
    }
};

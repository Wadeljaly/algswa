window.expensesController = {
    render(container) {
        const expenses = db.getCollection('expenses');
        const settings = db.getSettings();

        // Stats
        const today = new Date().toISOString().split('T')[0];
        const month = today.substring(0, 7);
        
        const todayTotal = expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);
        const monthTotal = expenses.filter(e => e.date.startsWith(month)).reduce((sum, e) => sum + e.amount, 0);

        // Full screen style
        container.style.padding = '0';
        container.style.overflow = 'hidden';

        container.innerHTML = `
            <div class="tager-pos-view view-entry">
                <div class="tager-top-tabs">
                    <div class="tager-tab active"><i data-lucide="wallet" style="width:14px;"></i> سجل المنصرفات</div>
                    <div class="tager-tab" onclick="expensesController.showCategoryModal()"><i data-lucide="layers" style="width:14px;"></i> بنود الصرف</div>
                </div>

                <div class="tager-main-layout">
                    <div class="tager-main-content">
                        <!-- Header with Stats -->
                        <div class="tager-main-header" style="height:auto; padding:10px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:20px;">
                                <div style="display:flex; gap:15px; flex:1.5;">
                                    <div style="background:#fff; border:1px solid #ddd; padding:5px 15px; border-radius:4px; text-align:center;">
                                        <div style="font-size:0.7rem; color:#7f8c8d; font-weight:800;">منصرفات اليوم</div>
                                        <div style="font-size:1.1rem; font-weight:900; color:#e74c3c;">${todayTotal.toLocaleString()} ${settings.currency}</div>
                                    </div>
                                    <div style="background:#fff; border:1px solid #ddd; padding:5px 15px; border-radius:4px; text-align:center;">
                                        <div style="font-size:0.7rem; color:#7f8c8d; font-weight:800;">إجمالي الشهر</div>
                                        <div style="font-size:1.1rem; font-weight:900; color:#2c3e50;">${monthTotal.toLocaleString()} ${settings.currency}</div>
                                    </div>
                                </div>

                                <div class="tager-item-entry-bar" style="flex:3; margin:0; border:none; background:#f0f2f5;">
                                    <div class="tager-entry-group" style="flex:2; border:none;">
                                        <input type="text" id="expense-search" class="tager-classic-input" placeholder="بحث في المنصرفات..." oninput="expensesController.filterExpenses()">
                                    </div>
                                    <button class="tager-arrow-btn blue"><i data-lucide="search" style="width:16px;"></i></button>
                                </div>

                                <div style="flex:1; text-align:left; display:flex; gap:8px;">
                                    <button class="tager-arrow-btn blue" onclick="expensesController.showAddModal()" style="padding:0 15px; height:40px;"><i data-lucide="plus" style="width:14px;"></i> إضافة منصرف</button>
                                    <button class="tager-arrow-btn" onclick="App.switchView('dashboard')" style="padding:0 15px; height:40px;">إغلاق</button>
                                </div>
                            </div>
                        </div>

                        <!-- Grid -->
                        <div class="tager-table-container">
                            <table class="tager-grid">
                                <thead>
                                    <tr>
                                        <th width="60">م</th>
                                        <th width="120">التاريخ</th>
                                        <th width="150">بند الصرف</th>
                                        <th>البيان / التفاصيل</th>
                                        <th width="120">المبلغ</th>
                                        <th width="100" style="text-align: center;">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody id="expenses-list">
                                    ${this.renderList(expenses)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Add/Edit Modal -->
                <div id="expense-modal" class="modal">
                    <div class="modal-content" style="width: 500px; padding: 0; background:#fff; border-radius:8px; overflow:hidden;">
                        <div style="background:var(--primary-color); color:white; padding:15px; font-weight:900; display:flex; justify-content:space-between; align-items:center;">
                            <span id="exp-modal-title">تسجيل منصرف جديد</span>
                            <span style="cursor:pointer; font-size:1.5rem;" onclick="expensesController.closeModal()">&times;</span>
                        </div>
                        <form id="expense-form" onsubmit="expensesController.handleSave(event)" style="padding:20px;">
                            <input type="hidden" id="exp-id">
                            
                            <div class="tager-entry-group" style="flex-direction:column; align-items:flex-start; height:auto; padding:10px; margin-bottom:15px;">
                                <label style="font-size:0.75rem; color:#7f8c8d; margin-bottom:5px;">بند الصرف</label>
                                <select id="exp-category" class="tager-classic-input" required style="width:100%; background:#f9f9f9; border:1px solid #ddd;">
                                    ${this.getCategories().map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                                </select>
                            </div>

                            <div class="tager-entry-group" style="flex-direction:column; align-items:flex-start; height:auto; padding:10px; margin-bottom:15px;">
                                <label style="font-size:0.75rem; color:#7f8c8d; margin-bottom:5px;">المبلغ</label>
                                <input type="number" id="exp-amount" class="tager-classic-input" required step="0.01" style="width:100%; background:#f9f9f9; border:1px solid #ddd;">
                            </div>

                            <div class="tager-entry-group" style="flex-direction:column; align-items:flex-start; height:auto; padding:10px; margin-bottom:15px;">
                                <label style="font-size:0.75rem; color:#7f8c8d; margin-bottom:5px;">التاريخ</label>
                                <input type="date" id="exp-date" class="tager-classic-input" required style="width:100%; background:#f9f9f9; border:1px solid #ddd;">
                            </div>

                            <div class="tager-entry-group" style="flex-direction:column; align-items:flex-start; height:auto; padding:10px; margin-bottom:20px;">
                                <label style="font-size:0.75rem; color:#7f8c8d; margin-bottom:5px;">البيان / ملاحظات</label>
                                <textarea id="exp-notes" class="tager-classic-input" style="width:100%; height:80px; background:#f9f9f9; border:1px solid #ddd; padding:10px;"></textarea>
                            </div>

                            <div style="display:flex; gap:10px;">
                                <button type="submit" class="tager-arrow-btn blue" style="flex:2; height:50px; font-size:1.1rem; font-weight:900;">حفظ المنصرف</button>
                                <button type="button" class="tager-arrow-btn" style="flex:1; height:50px;" onclick="expensesController.closeModal()">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Category Modal -->
                <div id="expense-cat-modal" class="modal">
                    <div class="modal-content" style="width: 400px; padding: 0; background:#fff; border-radius:8px; overflow:hidden;">
                        <div style="background:#2c3e50; color:white; padding:12px; font-weight:900; display:flex; justify-content:space-between; align-items:center;">
                            <span>إدارة بنود الصرف</span>
                            <span style="cursor:pointer; font-size:1.5rem;" onclick="expensesController.closeCategoryModal()">&times;</span>
                        </div>
                        <div style="padding:20px;">
                            <div id="expense-cat-list" style="max-height: 250px; overflow-y: auto; margin-bottom: 20px;"></div>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="new-exp-cat" class="tager-classic-input" placeholder="بند جديد..." style="border:1px solid #ddd; flex:1;">
                                <button class="tager-arrow-btn blue" style="padding:0 20px;" onclick="expensesController.addCategory()">إضافة</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    renderList(expenses) {
        if (expenses.length === 0) {
            return `<tr><td colspan="6" style="text-align: center; padding: 5rem; color: #7f8c8d; font-weight: 800;">لا توجد منصرفات مسجلة حالياً.</td></tr>`;
        }

        // Sort by date descending
        const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

        return sorted.map((e, idx) => `
            <tr>
                <td style="text-align:center; font-weight:800; color:#7f8c8d;">${idx + 1}</td>
                <td style="font-weight:900; color:#2c3e50;">${e.date}</td>
                <td><span style="background:#f0f2f5; padding:2px 8px; border-radius:4px; font-weight:800; font-size:0.8rem;">${e.category}</span></td>
                <td style="font-weight:700;">${e.notes || '---'}</td>
                <td style="font-weight:950; color:#e74c3c;">${e.amount.toLocaleString()}</td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 5px; justify-content: center;">
                        <button class="tager-arrow-btn" style="width: 30px; height: 30px; padding:0;" onclick="expensesController.showEditModal(${e.id})"><i data-lucide="edit-2" style="width: 14px;"></i></button>
                        <button class="tager-arrow-btn" style="width: 30px; height: 30px; padding:0; color:#e74c3c;" onclick="expensesController.handleDelete(${e.id})"><i data-lucide="trash-2" style="width: 14px;"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    getCategories() {
        const cats = db.getCollection('expense_categories');
        if (cats.length === 0) {
            // Default categories
            const defaults = ["إيجار", "كهرباء ومياه", "رواتب", "نثريات", "صيانة", "أخرى"];
            db.saveCollection('expense_categories', defaults);
            return defaults;
        }
        return cats;
    },

    showAddModal() {
        document.getElementById('exp-modal-title').innerText = "تسجيل منصرف جديد";
        document.getElementById('expense-form').reset();
        document.getElementById('exp-id').value = "";
        document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('expense-modal').classList.add('active');
    },

    showEditModal(id) {
        const expenses = db.getCollection('expenses');
        const exp = expenses.find(e => e.id == id);
        if (!exp) return;

        document.getElementById('exp-modal-title').innerText = "تعديل بيانات المنصرف";
        document.getElementById('exp-id').value = exp.id;
        document.getElementById('exp-category').value = exp.category;
        document.getElementById('exp-amount').value = exp.amount;
        document.getElementById('exp-date').value = exp.date;
        document.getElementById('exp-notes').value = exp.notes || "";
        
        document.getElementById('expense-modal').classList.add('active');
    },

    closeModal() {
        document.getElementById('expense-modal').classList.remove('active');
    },

    handleSave(e) {
        e.preventDefault();
        const id = document.getElementById('exp-id').value;
        const data = {
            category: document.getElementById('exp-category').value,
            amount: parseFloat(document.getElementById('exp-amount').value),
            date: document.getElementById('exp-date').value,
            notes: document.getElementById('exp-notes').value
        };

        if (id) {
            db.updateItem('expenses', id, data);
            App.showToast("تم تحديث المنصرف بنجاح", "success");
        } else {
            db.addItem('expenses', data);
            App.showToast("تم تسجيل المنصرف بنجاح", "success");
        }

        this.closeModal();
        this.render(document.getElementById('view-container'));
    },

    handleDelete(id) {
        if (confirm("هل أنت متأكد من حذف هذا المنصرف؟")) {
            db.deleteItem('expenses', id);
            App.showToast("تم حذف المنصرف", "info");
            this.render(document.getElementById('view-container'));
        }
    },

    filterExpenses() {
        const query = document.getElementById('expense-search').value.toLowerCase();
        const expenses = db.getCollection('expenses');
        const filtered = expenses.filter(e => 
            e.category.toLowerCase().includes(query) || 
            (e.notes && e.notes.toLowerCase().includes(query))
        );
        document.getElementById('expenses-list').innerHTML = this.renderList(filtered);
        lucide.createIcons();
    },

    showCategoryModal() {
        this.renderCategoryList();
        document.getElementById('expense-cat-modal').classList.add('active');
    },

    closeCategoryModal() {
        document.getElementById('expense-cat-modal').classList.remove('active');
    },

    renderCategoryList() {
        const cats = this.getCategories();
        const container = document.getElementById('expense-cat-list');
        container.innerHTML = cats.map((cat, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #f0f2f5;">
                <span style="font-weight:800;">${cat}</span>
                <button class="tager-arrow-btn" style="width:25px; height:25px; color:#e74c3c;" onclick="expensesController.deleteCategory(${idx})"><i data-lucide="trash-2" style="width:12px;"></i></button>
            </div>
        `).join('');
        lucide.createIcons();
    },

    addCategory() {
        const input = document.getElementById('new-exp-cat');
        const name = input.value.trim();
        if (!name) return;
        const cats = this.getCategories();
        if (!cats.includes(name)) {
            cats.push(name);
            db.saveCollection('expense_categories', cats);
            input.value = "";
            this.renderCategoryList();
            // Refresh main categories select in modal if it's open
            this.render(document.getElementById('view-container'));
        }
    },

    deleteCategory(idx) {
        if (confirm("حذف هذا البند؟")) {
            const cats = this.getCategories();
            cats.splice(idx, 1);
            db.saveCollection('expense_categories', cats);
            this.renderCategoryList();
            this.render(document.getElementById('view-container'));
        }
    }
};

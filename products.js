window.productsController = {
    render(container) {
        const products = db.getCollection('products');
        const categories = db.getCollection('categories');
        const settings = db.getSettings();

        // Stats
        const lowStock = products.filter(p => p.quantity <= (p.minStock || 5)).length;

        // Full screen style
        container.style.padding = '0';
        container.style.overflow = 'hidden';

        container.innerHTML = `
            <div class="tager-pos-view view-entry">
                <div class="tager-top-tabs">
                    <div class="tager-tab active"><i data-lucide="package" style="width:14px;"></i> قائمة المنتجات والمخزون</div>
                    <div class="tager-tab" onclick="productsController.showCategoryModal()"><i data-lucide="layers" style="width:14px;"></i> إدارة التصنيفات</div>
                </div>

                <div class="tager-main-layout">
                    <div class="tager-main-content">
                        <!-- Header with Stats & Search -->
                        <div class="tager-main-header" style="height:auto; padding:10px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:20px;">
                                <div style="display:flex; gap:15px; flex:1.5;">
                                    <div style="background:#fff; border:1px solid #ddd; padding:5px 15px; border-radius:4px; text-align:center;">
                                        <div style="font-size:0.7rem; color:#7f8c8d; font-weight:800;">إجمالي الأصناف</div>
                                        <div style="font-size:1.1rem; font-weight:900; color:var(--primary-color);">${products.length}</div>
                                    </div>
                                    <div style="background:#fff; border:1px solid #ddd; padding:5px 15px; border-radius:4px; text-align:center;">
                                        <div style="font-size:0.7rem; color:#7f8c8d; font-weight:800;">تنبيه المخزون</div>
                                        <div style="font-size:1.1rem; font-weight:900; color:#e74c3c;">${lowStock}</div>
                                    </div>
                                </div>

                                <div class="tager-item-entry-bar" style="flex:3; margin:0; border:none; background:#f0f2f5;">
                                    <div class="tager-entry-group" style="flex:2; border:none;">
                                        <input type="text" id="product-search" class="tager-classic-input" placeholder="بحث باسم المنتج، الكود، الباركود..." oninput="productsController.filterProducts()">
                                    </div>
                                    <div class="tager-entry-group" style="flex:1; border-right:1px solid #ddd;">
                                        <select id="category-filter" class="tager-classic-input" onchange="productsController.filterProducts()" style="background:transparent; border:none;">
                                            <option value="">كل التصنيفات</option>
                                            ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                                        </select>
                                    </div>
                                    <button class="tager-arrow-btn blue"><i data-lucide="search" style="width:16px;"></i></button>
                                </div>

                                <div style="flex:1; text-align:left; display:flex; gap:8px;">
                                    <button class="tager-arrow-btn blue" onclick="productsController.showAddModal()" style="padding:0 15px; height:40px;"><i data-lucide="plus" style="width:14px;"></i> صنف جديد</button>
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
                                        <th width="120">الباركود</th>
                                        <th>اسم المنتج</th>
                                        <th width="120">التصنيف</th>
                                        <th width="100">سعر البيع</th>
                                        <th width="80">الكمية</th>
                                        <th width="80">الوحدة</th>
                                        <th width="100">الحالة</th>
                                        <th width="120" style="text-align: center;">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody id="products-list">
                                    ${this.renderList(products, settings)}
                                </tbody>
                            </table>
                        </div>

                        <!-- Footer -->
                        <div class="tager-final-actions" style="position:relative; margin-top:auto;">
                            <button class="tager-final-btn" onclick="window.print()"><i data-lucide="printer" style="width:14px;"></i> طباعة القائمة</button>
                            <button class="tager-final-btn" onclick="productsController.showCategoryModal()"><i data-lucide="layers" style="width:14px;"></i> إدارة التصنيفات</button>
                            <button class="tager-final-btn" onclick="productsController.showAddModal()"><i data-lucide="plus" style="width:14px;"></i> إضافة صنف</button>
                        </div>
                    </div>
                </div>

                <!-- Product Modal -->
                <div id="product-modal" class="modal">
                    <div class="modal-content" style="width: 600px; padding: 0; background:#fff; border-radius:8px; overflow:hidden;">
                        <div style="background:var(--primary-color); color:white; padding:15px; font-weight:900; display:flex; justify-content:space-between; align-items:center;">
                            <span id="modal-title">بيانات المنتج</span>
                            <span style="cursor:pointer; font-size:1.5rem;" onclick="productsController.closeModal()">&times;</span>
                        </div>
                        <form id="product-form" onsubmit="productsController.handleSave(event)" style="padding:20px;">
                            <input type="hidden" id="p-id">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                                <div class="tager-entry-group" style="flex:1; flex-direction:column; align-items:flex-start; height:auto; padding:10px;">
                                    <label style="font-size:0.75rem; color:#7f8c8d; margin-bottom:5px;">اسم المنتج</label>
                                    <input type="text" id="p-name" class="tager-classic-input" required style="width:100%; background:#f9f9f9; border:1px solid #ddd;">
                                </div>
                                <div class="tager-entry-group" style="flex:1; flex-direction:column; align-items:flex-start; height:auto; padding:10px;">
                                    <label style="font-size:0.75rem; color:#7f8c8d; margin-bottom:5px;">التصنيف</label>
                                    <select id="p-category" class="tager-classic-input" required style="width:100%; background:#f9f9f9; border:1px solid #ddd;">
                                        ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                                <div class="tager-entry-group" style="flex:1; flex-direction:column; align-items:flex-start; height:auto; padding:10px;">
                                    <label style="font-size:0.75rem; color:#7f8c8d; margin-bottom:5px;">سعر التكلفة</label>
                                    <input type="number" id="p-cost-price" class="tager-classic-input" required style="width:100%; background:#f9f9f9; border:1px solid #ddd;">
                                </div>
                                <div class="tager-entry-group" style="flex:1; flex-direction:column; align-items:flex-start; height:auto; padding:10px;">
                                    <label style="font-size:0.75rem; color:#7f8c8d; margin-bottom:5px;">سعر البيع</label>
                                    <input type="number" id="p-price" class="tager-classic-input" required style="width:100%; background:#f9f9f9; border:1px solid #ddd;">
                                </div>
                                <div class="tager-entry-group" style="flex:1; flex-direction:column; align-items:flex-start; height:auto; padding:10px;">
                                    <label style="font-size:0.75rem; color:#7f8c8d; margin-bottom:5px;">الكمية الحالية</label>
                                    <input type="number" id="p-quantity" class="tager-classic-input" required style="width:100%; background:#f9f9f9; border:1px solid #ddd;">
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:20px;">
                                <div class="tager-entry-group" style="flex:1; flex-direction:column; align-items:flex-start; height:auto; padding:10px;">
                                    <label style="font-size:0.75rem; color:#7f8c8d; margin-bottom:5px;">وحدة القياس</label>
                                    <select id="p-unit" class="tager-classic-input" style="width:100%; background:#f9f9f9; border:1px solid #ddd;">
                                    </select>
                                </div>
                                <div class="tager-entry-group" style="flex:1; flex-direction:column; align-items:flex-start; height:auto; padding:10px;">
                                    <label style="font-size:0.75rem; color:#7f8c8d; margin-bottom:5px;">تنبيه عند وصول الكمية لـ</label>
                                    <input type="number" id="p-min-stock" value="5" class="tager-classic-input" style="width:100%; background:#f9f9f9; border:1px solid #ddd;">
                                </div>
                            </div>
                            <div style="display:flex; gap:10px;">
                                <button type="submit" class="tager-arrow-btn blue" style="flex:2; height:50px; font-size:1.1rem; font-weight:900;">حفظ البيانات</button>
                                <button type="button" class="tager-arrow-btn" style="flex:1; height:50px;" onclick="productsController.closeModal()">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Modals containers -->
                <div id="unit-modal" class="modal"></div>
                <div id="category-modal" class="modal">
                    <div class="modal-content" style="width: 450px; padding: 0; background:#fff; border-radius:8px; overflow:hidden;">
                        <div style="background:#2c3e50; color:white; padding:12px; font-weight:900; display:flex; justify-content:space-between; align-items:center;">
                            <span>إدارة التصنيفات</span>
                            <span style="cursor:pointer; font-size:1.5rem;" onclick="productsController.closeCategoryModal()">&times;</span>
                        </div>
                        <div style="padding:20px;">
                            <div id="category-list-container" style="max-height: 250px; overflow-y: auto; margin-bottom: 20px;"></div>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="new-category-name" class="tager-classic-input" placeholder="اسم التصنيف الجديد" style="border:1px solid #ddd; flex:1;">
                                <button class="tager-arrow-btn blue" style="padding:0 20px;" onclick="productsController.addCategory()">إضافة</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.populateUnitSelectors();
        lucide.createIcons();
    },

    renderList(products, settings = {currency: 'ج.س'}) {
        if (products.length === 0) {
            return `<tr><td colspan="9" style="text-align: center; padding: 5rem; color: #7f8c8d; font-weight: 800;">لا توجد منتجات مسجلة حالياً.</td></tr>`;
        }

        return products.map((p, idx) => {
             const isLow = p.quantity <= (p.minStock || 5);
             const isZero = p.quantity === 0;
             let statusText = 'متوفر';
             let statusColor = '#27ae60';
             if (isZero) { statusText = 'نفد'; statusColor = '#e74c3c'; }
             else if (isLow) { statusText = 'منخفض'; statusColor = '#f39c12'; }

             return `
            <tr>
                <td style="text-align:center; font-weight:800; color:#7f8c8d;">${idx + 1}</td>
                <td style="font-weight:900; color:var(--primary-color);">${p.barcode || '---'}</td>
                <td style="font-weight:900; color:#2c3e50;">${p.name}</td>
                <td style="font-weight:800; color:#7f8c8d;">${p.category}</td>
                <td style="font-weight:950; color:#2c3e50;">${p.price.toLocaleString()}</td>
                <td style="font-weight:950; color:${statusColor};">${p.quantity}</td>
                <td style="font-weight:800;">${p.unit || 'قطعة'}</td>
                <td>
                    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${statusColor}; margin-left:5px;"></span>
                    <span style="font-weight:900; color:${statusColor}; font-size:0.75rem;">${statusText}</span>
                </td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 5px; justify-content: center;">
                        <button class="tager-arrow-btn" style="width: 30px; height: 30px; padding:0;" onclick="productsController.showEditModal(${p.id})"><i data-lucide="edit-2" style="width: 14px;"></i></button>
                        <button class="tager-arrow-btn" style="width: 30px; height: 30px; padding:0; color:#e74c3c;" onclick="productsController.handleDelete(${p.id})"><i data-lucide="trash-2" style="width: 14px;"></i></button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    },

    filterProducts() {
        const query = document.getElementById('product-search').value.toLowerCase();
        const category = document.getElementById('category-filter').value;
        const products = db.getCollection('products');

        const filtered = products.filter(p => {
            const matchesQuery = p.name.toLowerCase().includes(query);
            const matchesCategory = !category || p.category === category;
            return matchesQuery && matchesCategory;
        });

        const settings = db.getSettings();
        document.getElementById('products-list').innerHTML = this.renderList(filtered, settings);
        lucide.createIcons();
    },

    showAddModal() {
        const modal = document.getElementById('product-modal');
        document.getElementById('modal-title').innerText = "إضافة منتج جديد";
        document.getElementById('product-form').reset();
        document.getElementById('p-id').value = "";
        this.populateUnitSelectors();
        modal.classList.add('active');
    },

    showEditModal(id) {
        const products = db.getCollection('products');
        const p = products.find(p => p.id == id);
        if (!p) return;
        this.populateUnitSelectors();
        const modal = document.getElementById('product-modal');
        document.getElementById('modal-title').innerText = "تعديل المنتج";
        document.getElementById('p-id').value = p.id;
        document.getElementById('p-name').value = p.name;
        document.getElementById('p-category').value = p.category;
        document.getElementById('p-cost-price').value = p.costPrice || 0;
        document.getElementById('p-price').value = p.price;
        document.getElementById('p-quantity').value = p.quantity;
        document.getElementById('p-min-stock').value = p.minStock || 5;
        document.getElementById('p-unit').value = p.unit || "قطعة";
        modal.classList.add('active');
    },

    populateUnitSelectors() {
        const units = db.getCollection('units');
        const smallSelect = document.getElementById('p-unit');
        if (!smallSelect) return;
        smallSelect.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
    },

    showUnitModal() {
        const modal = document.getElementById('unit-modal');
        this.renderUnitList();
        modal.classList.add('active');
    },

    closeUnitModal() { document.getElementById('unit-modal').classList.remove('active'); },

    renderUnitList() {
        const units = db.getCollection('units');
        const container = document.getElementById('unit-list-container');
        container.innerHTML = units.map((u, idx) => `
            <div class="neumorph-inset" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-radius: 12px; margin-bottom: 0.8rem;">
                <span style="font-weight: 900;">${u}</span>
                <button class="neumorph-btn" style="width: 30px; height: 30px;" onclick="productsController.deleteUnit(${idx})"><i data-lucide="trash-2" style="width: 12px; color: var(--danger);"></i></button>
            </div>
        `).join('');
        lucide.createIcons();
    },

    addUnit() {
        const input = document.getElementById('new-unit-name');
        const name = input.value.trim();
        if (!name) return;
        const units = db.getCollection('units');
        if (!units.includes(name)) {
            units.push(name);
            db.saveCollection('units', units);
            input.value = "";
            this.renderUnitList();
            App.showToast("تمت إضافة الوحدة", "success");
        }
    },

    deleteUnit(idx) {
        if (confirm("حذف هذه الوحدة؟")) {
            const units = db.getCollection('units');
            units.splice(idx, 1);
            db.saveCollection('units', units);
            this.renderUnitList();
        }
    },

    closeModal() { document.getElementById('product-modal').classList.remove('active'); },

    handleSave(e) {
        e.preventDefault();
        const id = document.getElementById('p-id').value;
        const productData = {
            name: document.getElementById('p-name').value,
            category: document.getElementById('p-category').value,
            costPrice: parseFloat(document.getElementById('p-cost-price').value) || 0,
            price: parseFloat(document.getElementById('p-price').value),
            quantity: parseInt(document.getElementById('p-quantity').value),
            minStock: parseInt(document.getElementById('p-min-stock').value),
            unit: document.getElementById('p-unit').value
        };

        if (id) {
            db.updateItem('products', id, productData);
            App.showToast("تم تحديث المنتج بنجاح", "success");
        } else {
            db.addItem('products', productData);
            App.showToast("تمت إضافة المنتج بنجاح", "success");
        }
        this.closeModal();
        this.render(document.getElementById('view-container'));
    },

    handleDelete(id) {
        if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
            db.deleteItem('products', id);
            App.showToast("تم حذف المنتج بنجاح", "info");
            this.render(document.getElementById('view-container'));
        }
    },

    showCategoryModal() {
        const modal = document.getElementById('category-modal');
        this.renderCategoryList();
        modal.classList.add('active');
        lucide.createIcons();
    },

    closeCategoryModal() { document.getElementById('category-modal').classList.remove('active'); },

    renderCategoryList() {
        const categories = db.getCollection('categories');
        const container = document.getElementById('category-list-container');
        if (categories.length === 0) {
            container.innerHTML = '<p style="text-align: center; opacity: 0.5;">لا توجد فئات حالياً</p>';
            return;
        }

        container.innerHTML = categories.map((cat, idx) => `
            <div class="neumorph-inset" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-radius: 12px; margin-bottom: 0.8rem;">
                <span style="font-weight: 900;">${cat}</span>
                <button class="neumorph-btn" style="width: 30px; height: 30px;" onclick="productsController.deleteCategory(${idx})"><i data-lucide="trash-2" style="width: 12px; color: var(--danger);"></i></button>
            </div>
        `).join('');
        lucide.createIcons();
    },

    addCategory() {
        const input = document.getElementById('new-category-name');
        const name = input.value.trim();
        if (!name) return;

        const categories = db.getCollection('categories');
        if (categories.includes(name)) {
            App.showToast("هذه الفئة موجودة بالفعل", "warning");
            return;
        }

        categories.push(name);
        db.saveCollection('categories', categories);
        input.value = "";
        this.renderCategoryList();
        App.showToast("تمت إضافة الفئة بنجاح", "success");
        this.render(document.getElementById('view-container'));
    },

    deleteCategory(idx) {
        if (confirm("هل أنت متأكد من حذف هذه الفئة؟")) {
            const categories = db.getCollection('categories');
            categories.splice(idx, 1);
            db.saveCollection('categories', categories);
            this.renderCategoryList();
            this.render(document.getElementById('view-container'));
            App.showToast("تم حذف الفئة بنجاح", "info");
        }
    }
};

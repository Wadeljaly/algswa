window.settingsController = {
    render(container) {
        const settings = db.getSettings();

        container.innerHTML = `
            <div id="settings-view" class="view-entry" style="padding: 10px; height: 100%; display: flex; flex-direction: column; gap: 1rem;">
                <!-- Modern Settings Layout -->
                <div style="display: flex; gap: 1.5rem; flex-grow: 1; overflow: hidden;">
                    
                    <!-- Navigation Sidebar (Right Side) -->
                    <div class="settings-sidebar neumorph" style="width: 220px; display: flex; flex-direction: column; padding: 1.2rem; gap: 0.5rem; flex-shrink: 0;">
                        <h2 style="font-weight: 950; font-size: 1.1rem; color: var(--primary-color); margin-bottom: 1rem; border-bottom: 2px solid var(--primary-glow); padding-bottom: 0.5rem;">التنقل السريع</h2>
                        
                        <div class="settings-nav-item active" onclick="settingsController.scrollToSection('identity-section', this)">
                            <i data-lucide="info" style="width: 18px;"></i>
                            <span>هوية المؤسسة</span>
                        </div>
                        <div class="settings-nav-item" onclick="settingsController.scrollToSection('security-section', this)">
                            <i data-lucide="lock" style="width: 18px;"></i>
                            <span>الأمان والخصوصية</span>
                        </div>
                        <div class="settings-nav-item" onclick="settingsController.scrollToSection('data-section', this)">
                            <i data-lucide="cloud-cog" style="width: 18px;"></i>
                            <span>البيانات والصيانة</span>
                        </div>
                        <div class="settings-nav-item" onclick="settingsController.scrollToSection('about-section', this)">
                            <i data-lucide="code" style="width: 18px;"></i>
                            <span>حول النظام</span>
                        </div>

                        <div style="margin-top: auto; padding: 10px; text-align: center;">
                            <button class="neumorph-btn" style="width: 100%; height: 40px; border-radius: 10px; gap: 8px; color: var(--text-secondary);" onclick="document.getElementById('settings-content-scroll').scrollTo({top:0, behavior:'smooth'})">
                                <i data-lucide="arrow-up" style="width: 16px;"></i>
                                <span style="font-size: 0.8rem; font-weight: 800;">للأعلى</span>
                            </button>
                        </div>
                    </div>

                    <!-- Settings Content Area -->
                    <div id="settings-content-scroll" style="flex-grow: 1; overflow-y: auto; padding-left: 10px; display: flex; flex-direction: column; gap: 1.5rem;">
                        
                        <!-- Header -->
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid var(--primary-glow); padding-bottom: 1rem;">
                            <div>
                                <h1 style="font-weight: 1000; font-size: 1.6rem; color: var(--primary-color);">
                                    <i data-lucide="settings" style="width:24px; vertical-align:middle; margin-left:8px;"></i>
                                    إعدادات النظام
                                </h1>
                                <p style="color: var(--text-secondary); font-weight: 700; font-size: 0.9rem; margin:0;">تحكم شامل في هوية المتجر، الأمان، والبيانات</p>
                            </div>
                        </div>

                        <!-- Section 1: Identity -->
                        <div id="identity-section" class="stat-card-nm" style="padding: 1.5rem; border-top: 4px solid var(--primary-color);">
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                                <div class="neumorph" style="width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: var(--primary-color);">
                                    <i data-lucide="info" style="width: 22px;"></i>
                                </div>
                                <h3 style="font-weight: 1000; font-size: 1.3rem; margin:0;">هوية المؤسسة</h3>
                            </div>
                            
                            <form id="company-settings-form" onsubmit="settingsController.saveSettings(event)" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem;">
                                <div class="input-group" style="grid-column: span 2;">
                                    <label style="font-weight: 900; margin-bottom: 0.5rem; font-size: 0.9rem; display: block; color:var(--primary-color);">اسم المتجر</label>
                                    <div class="input-wrapper neumorph-inset" style="padding: 0.8rem 1.2rem;">
                                        <input type="text" id="s-company" value="${settings.companyName || ''}" style="font-weight:700;">
                                    </div>
                                </div>
                                <div class="input-group">
                                    <label style="font-weight: 900; margin-bottom: 0.5rem; font-size: 0.9rem; display: block; color:var(--primary-color);">رقم الهاتف</label>
                                    <div class="input-wrapper neumorph-inset" style="padding: 0.8rem 1.2rem;">
                                        <input type="text" id="s-phone" value="${settings.phone || ''}" style="font-weight:700;">
                                    </div>
                                </div>
                                <div class="input-group">
                                    <label style="font-weight: 900; margin-bottom: 0.5rem; font-size: 0.9rem; display: block; color:var(--primary-color);">العملة الافتراضية</label>
                                    <div class="input-wrapper neumorph-inset" style="padding: 0.8rem 1.2rem;">
                                        <input type="text" id="s-currency" value="${settings.currency || 'ج.س'}" style="font-weight:800;">
                                    </div>
                                </div>
                                <div class="input-group" style="grid-column: span 2;">
                                    <label style="font-weight: 900; margin-bottom: 0.5rem; font-size: 0.9rem; display: block; color:var(--primary-color);">عنوان المنشأة</label>
                                    <div class="input-wrapper neumorph-inset" style="padding: 0.8rem 1.2rem;">
                                        <input type="text" id="s-address" value="${settings.address || ''}" style="font-weight:700;">
                                    </div>
                                </div>
                                <div style="grid-column: span 2; display: flex; justify-content: flex-end; margin-top: 1rem;">
                                    <button type="submit" class="btn-primary-nm" style="width: auto; padding: 1rem 3rem; border-radius:15px; font-size:1rem;">
                                        <i data-lucide="save" style="margin-left:8px; width:20px;"></i> حفظ التغييرات
                                    </button>
                                </div>
                            </form>
                        </div>

                        <!-- Section 2: Security -->
                        <div id="security-section" class="stat-card-nm" style="padding: 1.5rem; border-top: 4px solid var(--danger-color);">
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                                <div class="neumorph" style="width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: var(--danger-color);">
                                    <i data-lucide="lock" style="width: 22px;"></i>
                                </div>
                                <h3 style="font-weight: 1000; font-size: 1.3rem; margin:0;">الأمان وتغيير كلمة المرور</h3>
                            </div>
                            <form onsubmit="settingsController.changePassword(event)" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem;">
                                    <div class="input-group" style="grid-column: span 2;">
                                        <label style="font-weight: 900; margin-bottom: 0.5rem; font-size: 0.9rem; display: block;">كلمة مرور المدير الجديدة</label>
                                        <div class="input-wrapper neumorph-inset" style="padding: 0.8rem 1.2rem;">
                                            <input type="password" id="s-new-pass" required style="font-weight:800;" placeholder="أدخل كلمة المرور الجديدة">
                                        </div>
                                    </div>
                                    <div class="input-group">
                                        <label style="font-weight: 900; margin-bottom: 0.5rem; font-size: 0.9rem; display: block; color: var(--text-secondary);">سؤال الأمان (للاستعادة)</label>
                                        <div class="input-wrapper neumorph-inset" style="padding: 0.8rem 1.2rem;">
                                            <input type="text" id="s-secret-q" value="${settings.secretQuestion || ''}" placeholder="مثال: اسم صديق الطفولة">
                                        </div>
                                    </div>
                                    <div class="input-group">
                                        <label style="font-weight: 900; margin-bottom: 0.5rem; font-size: 0.9rem; display: block; color: var(--text-secondary);">إجابة السؤال السرية</label>
                                        <div class="input-wrapper neumorph-inset" style="padding: 0.8rem 1.2rem;">
                                            <input type="password" id="s-secret-a" value="${settings.secretAnswer || ''}" placeholder="الإجابة السرية">
                                        </div>
                                    </div>
                                    <div style="grid-column: span 2; display: flex; justify-content: flex-end; margin-top: 1rem; gap: 1rem; align-items: center;">
                                        <p style="margin:0; font-size:0.8rem; font-weight:800; color:#e74c3c; flex-grow:1;">تنبيه: لا يفضل مشاركة كلمة المرور مع أي شخص غير مخول.</p>
                                        <button type="submit" class="neumorph-btn" style="padding: 1rem 2rem; border-radius:15px; color: var(--danger-color); font-weight: 1000; font-size: 1rem;">
                                            تحديث بيانات الدخول
                                        </button>
                                    </div>
                            </form>
                        </div>

                        <!-- Section 3: Maintenance -->
                        <div id="data-section" class="stat-card-nm" style="padding: 1.5rem; border-top: 4px solid var(--success);">
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                                <div class="neumorph" style="width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: var(--success);">
                                    <i data-lucide="cloud-cog" style="width: 22px;"></i>
                                </div>
                                <h3 style="font-weight: 1000; font-size: 1.3rem; margin:0;">إدارة البيانات والصيانة</h3>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                                <div class="neumorph-btn" style="padding:1.5rem; gap:12px; flex-direction: column;" onclick="settingsController.exportDatabase()">
                                    <i data-lucide="download" style="color:var(--primary-color); width:32px; height:32px;"></i>
                                    <span style="font-weight:900; font-size:1rem;">تصدير نسخة احتياطية (Download)</span>
                                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin:0;">حفظ كافة البيانات في ملف خارجي</p>
                                </div>
                                <label class="neumorph-btn" style="padding:1.5rem; gap:12px; cursor:pointer; flex-direction: column;">
                                    <input type="file" id="import-db-file" style="display: none;" onchange="settingsController.importDatabase(event)">
                                    <i data-lucide="upload" style="color:var(--success); width:32px; height:32px;"></i>
                                    <span style="font-weight:900; font-size:1rem;">استيراد نسخة احتياطية (Restore)</span>
                                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin:0;">استعادة البيانات من ملف سابق</p>
                                </label>
                                
                                <div style="grid-column: span 2; margin: 1rem 0; border-top: 2px dashed rgba(0,0,0,0.05);"></div>
                                
                                <button class="neumorph-btn" style="grid-column: span 2; padding: 1.5rem; background: rgba(231, 76, 60, 0.05); color: var(--danger); font-weight: 1000; font-size: 1.1rem; border:2px dashed var(--danger); border-radius: 20px;" onclick="settingsController.factoryReset()">
                                    <i data-lucide="trash-2" style="margin-left:12px; width:24px;"></i> 
                                    تصفير النظام ومسح كافة البيانات نهائياً
                                </button>
                            </div>
                        </div>

                        <!-- Section 4: About -->
                        <div id="about-section" class="stat-card-nm" style="margin-top: 1rem; padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, #fff 0%, #f8fbff 100%); border-right: 6px solid var(--primary-color);">
                            <div style="display: flex; align-items: center; gap: 1.5rem;">
                                <div style="width: 50px; height: 50px; background: #3498db; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                    <i data-lucide="code" style="width: 24px; color: white;"></i>
                                </div>
                                <div>
                                    <h4 style="font-weight: 1000; font-size: 1.1rem; color: var(--primary-color); margin:0;">المطور: محمد الجعلي الحسين</h4>
                                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 5px 0 0; font-weight: 700;">برمجة النظم السحابية وتطبيقات السطح</p>
                                    <div style="margin-top: 8px; display: flex; gap: 15px;">
                                        <span style="font-size: 0.8rem; color: var(--primary-color); font-weight: 900;"><i data-lucide="phone" style="width:12px; vertical-align:middle; margin-left:4px;"></i> +249 922 199 674</span>
                                        <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 800;">wadeljaly@gmail.com</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 0.8rem; align-items: flex-end;">
                                <div class="neumorph-inset" style="padding: 0.6rem 1.2rem; border-radius: 12px; display: flex; align-items: center; gap: 8px; background: #f0fdf4;">
                                    <i data-lucide="shield-check" style="color: var(--success); width: 16px;"></i>
                                    <span style="font-size: 0.9rem; font-weight: 900; color: var(--success);">تم تفعيل الرخصة</span>
                                </div>
                                <div class="neumorph-inset" style="padding: 0.6rem 1.2rem; border-radius: 12px; display: flex; align-items: center; gap: 8px; background: #fffcf0;">
                                    <i data-lucide="zap" style="color: #f39c12; width: 16px;"></i>
                                    <span style="font-size: 0.9rem; font-weight: 900; color: #d35400;">Version 1.0.2 Stable</span>
                                </div>
                            </div>
                        </div>

                        <!-- Bottom spacer for better scrolling -->
                        <div style="height: 50px;"></div>
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();
    },

    scrollToSection(sectionId, element) {
        // Scroll logic
        const section = document.getElementById(sectionId);
        const container = document.getElementById('settings-content-scroll');
        
        if (section && container) {
            container.scrollTo({
                top: section.offsetTop - 20,
                behavior: 'smooth'
            });
        }

        // Active state logic
        document.querySelectorAll('.settings-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        element.classList.add('active');
    },

    saveSettings(e) {
        e.preventDefault();
        const newSettings = {
            companyName: document.getElementById('s-company').value,
            phone: document.getElementById('s-phone').value,
            address: document.getElementById('s-address').value,
            currency: document.getElementById('s-currency').value,
            taxRate: 0 
        };
        db.updateSettings(newSettings);
        App.updateIdentity();
        App.showToast("تم تحديث إعدادات المنشأة بنجاح", "success");
        this.render(document.getElementById('view-container'));
    },

    changePassword(e) {
        e.preventDefault();
        const newPass = document.getElementById('s-new-pass').value;
        const secretQ = document.getElementById('s-secret-q').value;
        const secretA = document.getElementById('s-secret-a').value;

        if (newPass.length < 3) {
            App.showToast("كلمة المرور يجب أن لا تقل عن 3 خانات", "warning");
            return;
        }

        db.updateSettings({ 
            password: newPass,
            secretQuestion: secretQ,
            secretAnswer: secretA
        });
        
        App.showToast("تم تحديث بيانات الأمان بنجاح", "success");
        if (newPass) document.getElementById('s-new-pass').value = '';
    },

    exportDatabase() {
        const data = db.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `al_qaswaa_pos_db_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        App.showToast("جاري تحميل النسخة الاحتياطية", "success");
    },

    importDatabase(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target.result;
            if (db.importData(data)) {
                App.showToast("تم استيراد البيانات، جاري إعادة تشغيل النظام..", "success");
                setTimeout(() => location.reload(), 1500);
            } else {
                App.showToast("الملف المختار غير صالح لاستعادة البيانات", "error");
            }
        };
        reader.readAsText(file);
    },

    factoryReset() {
        if (confirm("تحذير: هذا الخيار سيقوم بمسح كافة المبيعات والمنتجات والبيانات نهائياً! هل أنت متأكد؟")) {
            if (confirm("يرجى التأكيد للمرة الأخيرة: مسح شامل للبيانات والبدء من جديد؟")) {
                localStorage.clear();
                App.showToast("جاري مسح النظام والبدء من جديد..", "warning");
                setTimeout(() => location.reload(), 2000);
            }
        }
    }
};

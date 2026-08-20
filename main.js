/**
 * Main Application Controller - Al-Qaswaa POS
 * Handles authentication, UI toggles, and base logic
 */

const App = {
    currentView: 'dashboard',
    isLoggedIn: false,
    loginAttempts: 0,

    init() {
        this.setupActivation();
        this.updateIdentity();
        this.setupAuth();
        this.setupTheme();
        this.setupNavigation();
        this.checkLoginStatus();
        this.setupShortcuts();
        lucide.createIcons();
    },

    setupActivation() {
        const trialStatus = db.getTrialStatus();
        const activationScreen = document.getElementById('activation-screen');
        const loginScreen = document.getElementById('login-screen');
        const hwidDisplay = document.getElementById('hwid-display');

        if (hwidDisplay) hwidDisplay.innerText = db.getHardwareId();

        // Check if we should allow access
        if (trialStatus.activated || trialStatus.isTrialActive) {
            activationScreen.classList.remove('active');
            loginScreen.classList.add('active');
            
            if (!trialStatus.activated) {
                App.showToast(`نسخة تجريبية: متبقي ${trialStatus.daysLeft} يوم على انتهاء الفترة المجانية`, "warning");
            }
        } else {
            // Trial Expired and not activated
            activationScreen.classList.add('active');
            loginScreen.classList.remove('active');
        }

        // Add "Continue with Trial" button if eligible
        const activationForm = document.getElementById('activation-form');
        let trialBtn = document.getElementById('continue-trial-btn');
        
        if (trialStatus.isTrialActive && !trialStatus.activated) {
            if (!trialBtn) {
                trialBtn = document.createElement('button');
                trialBtn.id = 'continue-trial-btn';
                trialBtn.className = 'neumorph-btn';
                trialBtn.style.cssText = 'width: 100%; padding: 1rem; margin-top: 1rem; font-weight: 800; color: var(--text-secondary);';
                trialBtn.innerHTML = `المتابعة بالفترة التجريبية (${trialStatus.daysLeft} يوم متبقية)`;
                trialBtn.onclick = () => {
                    activationScreen.classList.remove('active');
                    loginScreen.classList.add('active');
                };
                activationForm.appendChild(trialBtn);
            }
        } else if (trialBtn) {
            trialBtn.remove();
        }

        if (activationForm) {
            activationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const serial = document.getElementById('serial-input').value.trim();
                const result = db.activate(serial);

                if (result.success) {
                    alert(result.message);
                    this.setupActivation();
                } else {
                    alert(result.message);
                }
            });
        }
    },

    setupShortcuts() {
        window.addEventListener('keydown', (e) => {
            // Guard: don't trigger if not logged in
            if (!this.isLoggedIn) return;

            const map = {
                'F1': 'dashboard',
                'F2': 'sales',
                'F3': 'purchases',
                'F4': 'invoices',
                'F5': 'products',
                'F6': 'reports'
            };

            if (map[e.key]) {
                e.preventDefault();
                this.switchView(map[e.key]);
                
                // Update sidebar active class
                const navItems = document.querySelectorAll('.nav-item[data-view]');
                navItems.forEach(item => {
                    item.classList.toggle('active', item.getAttribute('data-view') === map[e.key]);
                });
            }
        });
    },

    updateIdentity() {
        const settings = db.getSettings();
        const name = settings.companyName || "نظام المبيعات";
        
        const loginName = document.getElementById('login-company-name');
        const sidebarName = document.getElementById('sidebar-company-name');
        
        if (loginName) loginName.innerText = name;
        if (sidebarName) sidebarName.innerText = name;
        
        // Update window title if possible
        document.title = name;
    },

    setupAuth() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const password = document.getElementById('password').value;
                
                if (db.verifyPassword(password)) {
                    this.loginAttempts = 0;
                    this.login();
                } else {
                    this.loginAttempts++;
                    if (this.loginAttempts >= 3) {
                        this.showToast('تم إدخال كلمة المرور بشكل خاطئ 3 مرات!', 'warning');
                        setTimeout(() => this.openRecoveryModal(), 500);
                        this.loginAttempts = 0;
                    } else {
                        this.showToast(`كلمة المرور غير صحيحة! (محاولة ${this.loginAttempts} من 3)`, 'error');
                    }
                }
            });
        }

        const forgotLink = document.getElementById('forgot-password-link');
        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openRecoveryModal();
            });
        }

        const recoveryModal = document.getElementById('recovery-modal');
        const recoveryConfirm = document.getElementById('btn-confirm-recovery');
        const recoveryClose = document.getElementById('btn-close-recovery');

        if (recoveryClose) {
            recoveryClose.onclick = () => recoveryModal.classList.remove('active');
        }

        if (recoveryConfirm) {
            recoveryConfirm.onclick = () => {
                const recoveryInput = document.getElementById('recovery-answer-input');
                const ans = recoveryInput.value.trim();
                const settings = db.getSettings();
                let success = false;

                if (settings.secretQuestion) {
                    if (ans === settings.secretAnswer || ans === 'alqaswaa@2026') success = true;
                } else {
                    if (ans === 'alqaswaa@2026') success = true;
                }

                if (success) {
                    db.updateSettings({ password: '123' });
                    recoveryModal.classList.remove('active');
                    this.showToast('تمت المصادقة! كلمة المرور هي: 123', 'success');
                    setTimeout(() => alert('تم تصفير كلمة المرور بنجاح! كلمة المرور الحالية هي: 123'), 500);
                } else {
                    this.showToast('الإجابة أو الكود غير صحيح!', 'error');
                }
            };
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    },

    openRecoveryModal() {
        const recoveryModal = document.getElementById('recovery-modal');
        const recoveryLabel = document.getElementById('recovery-question-label');
        const recoveryInput = document.getElementById('recovery-answer-input');
        const settings = db.getSettings();
        
        if (recoveryModal && recoveryLabel && recoveryInput) {
            if (settings.secretQuestion) {
                recoveryLabel.innerText = `سؤال الأمان: ${settings.secretQuestion}`;
                recoveryInput.type = "password";
            } else {
                recoveryLabel.innerText = "لم يتم ضبط سؤال أمان. أدخل كود المتطور:";
                recoveryInput.type = "text";
            }
            
            recoveryInput.value = '';
            recoveryModal.classList.add('active');
            lucide.createIcons();
            
            // Focus the input automatically
            setTimeout(() => recoveryInput.focus(), 300);
        }
    },

    login() {
        this.isLoggedIn = true;
        sessionStorage.setItem('isLoggedIn', 'true');
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-view').classList.add('active');
        this.showToast('تم تسجيل الدخول بنجاح', 'success');
        
        // Load initial dashboard
        this.switchView('dashboard');
    },

    logout() {
        this.isLoggedIn = false;
        sessionStorage.removeItem('isLoggedIn');
        document.getElementById('main-view').classList.remove('active');
        document.getElementById('login-screen').classList.add('active');
        document.getElementById('password').value = '';
    },

    checkLoginStatus() {
        if (sessionStorage.getItem('isLoggedIn') === 'true') {
            this.login();
        }
    },

    setupTheme() {
        const themeBtn = document.getElementById('theme-toggle');
        if (!themeBtn) return;

        const body = document.body;
        const currentTheme = db.getSettings().theme || 'light';
        
        if (currentTheme === 'dark') {
            body.classList.add('dark-theme');
            themeBtn.innerHTML = '<i data-lucide="sun"></i>';
        }

        themeBtn.addEventListener('click', () => {
            const isDark = body.classList.toggle('dark-theme');
            const newTheme = isDark ? 'dark' : 'light';
            
            // Update icon
            themeBtn.innerHTML = isDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
            lucide.createIcons();
            
            // Save to DB
            db.updateSettings({ theme: newTheme });
        });
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item[data-view]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                this.switchView(view);
                
                // Update active state
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    },

    switchView(viewName) {
        this.currentView = viewName;
        const container = document.getElementById('view-container');
        
        // Use a small delay for fade-out/in effect if needed
        // For now, loading the corresponding module view function
        if (viewName === 'debts') viewName = 'accounts'; // Backward compatibility
        
        if (window[viewName + 'Controller'] && typeof window[viewName + 'Controller'].render === 'function') {
            window[viewName + 'Controller'].render(container);
            lucide.createIcons();
        } else {
            container.innerHTML = `
                <div class="neumorph" style="padding: 2rem; text-align: center;">
                    <h2 style="color: var(--primary-color)">جارٍ تطوير قسم ${viewName}...</h2>
                    <p style="margin-top: 1rem;">سيتم الانتهاء من هذه الميزة قريباً.</p>
                </div>
            `;
        }
    },

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast neumorph ${type}`;
        
        const colors = {
            success: 'var(--success-color)',
            error: 'var(--danger-color)',
            info: 'var(--primary-color)',
            warning: 'var(--warning-color)'
        };
        
        const icons = {
            success: 'check-circle',
            error: 'alert-circle',
            info: 'info',
            warning: 'alert-triangle'
        };

        toast.style.padding = '1rem 1.5rem';
        toast.style.marginBottom = '1rem';
        toast.style.borderRadius = '10px';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '1rem';
        toast.style.borderRight = `5px solid ${colors[type]}`;
        toast.style.animation = 'slideIn 0.3s ease-out';
        
        toast.innerHTML = `
            <i data-lucide="${icons[type]}" style="color: ${colors[type]}"></i>
            <span style="font-weight: 600;">${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        lucide.createIcons();

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = '0.5s';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    },

    generateInvoiceHTML(data, title = 'فــاتــورة بــيــــــع') {
        const dateObj = new Date(data.date);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const isCash = data.paymentMethod === 'cash';
        const isBankak = data.paymentMethod === 'bankak';
        const isCredit = data.paymentMethod === 'credit';
        
        let itemsHtml = '';
        const limit = Math.max(15, data.items.length);
        for (let i = 0; i < limit; i++) {
            const item = data.items[i];
            if (item) {
                itemsHtml += `
                    <tr>
                        <td style="text-align:right;">${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>${item.price.toLocaleString()}</td>
                        <td>${(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                `;
            } else {
                itemsHtml += `
                    <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
                `;
            }
        }

        const totalAmount = data.total.toLocaleString();
        const clientName = data.customerName || data.supplierName || '..........................................................';
        const settings = db.getSettings();
        const storeName = settings.storeName || 'شركة القصواء';
        const phone = settings.phone || '';
        const address = settings.address || '';
        
        return `
            <div class="inv-wrapper" style="width: 100%; max-width: 800px; margin: 0 auto; padding: 15px; box-sizing: border-box; background: white; direction: rtl; color: black; font-family: 'Cairo', sans-serif;">
                <div class="inv-top-band" style="background-color: var(--primary-color) !important; border-radius: 12px 12px 0 0; min-height: 85px; position: relative; display: flex; justify-content: space-between; padding: 12px 20px; align-items: center; overflow: hidden;">
                    <!-- Company Info -->
                    <div style="color: white; z-index: 3; flex: 1; padding-left: 90px;">
                        <h1 style="margin: 0; font-size: 22px; font-weight: 950; line-height: 1.2;">${storeName}</h1>
                        ${phone ? '<p style="margin: 6px 0 0 0; font-size: 14px; font-weight: 800;">\u0647\u0627\u062a\u0641: ' + phone + '</p>' : ''}
                        ${address ? '<p style="margin: 3px 0 0 0; font-size: 12px; opacity: 0.95; font-weight: 600;">' + address + '</p>' : ''}
                    </div>
                    <!-- Logo (Fixed on the left in RTL, which is visually right) -->
                    <div class="inv-logo-bg" style="position: absolute; top: 8px; left: 20px; width: 75px; height: 75px; background: white !important; border-radius: 15px; border: 3px solid white; z-index: 10; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                        <i data-lucide="shopping-bag" style="width: 45px; height: 45px; color: var(--primary-color);"></i>
                    </div>
                </div>
                
                <div class="inv-mid-band" style="background-color: #f6f8fb !important; display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; margin-top: 6px; position: relative; border-radius: 0 0 4px 4px;">
                    <!-- Date and Number -->
                    <div class="inv-info-left" style="font-weight: 900; display: flex; flex-direction: column; color: var(--primary-color); font-size: 13px; text-align: right; min-width: 150px; border-left: 2px solid #dde1e7; padding-left: 10px;">
                        <div style="margin-bottom: 5px; display: flex; justify-content: space-between; gap: 10px;"><span>\u0627\u0644\u062a\u0627\u0631\u064a\u062e: </span><span style="color: black;"> ${yyyy}/${mm}/${dd}</span></div>
                        <div style="display: flex; justify-content: space-between; gap: 10px;"><span>\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629: </span><span style="color: black;"> #${data.id}</span></div>
                    </div>
                    
                    <!-- Center: Title and Checkboxes -->
                    <div style="display:flex; flex-direction:column; align-items:center; flex: 1; padding: 0 20px;">
                        <div class="inv-title-box" style="background-color: var(--primary-color) !important; color: white !important; padding: 5px 35px; border-radius: 8px; font-weight: 1000; font-size: 16px; margin-top: -30px; margin-bottom: 10px; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 2px solid white;">${title}</div>
                        
                        <div class="inv-payment-types" style="display: flex; gap: 20px; font-weight: 900; font-size: 13px; color: var(--primary-color);">
                            <div style="display: flex; align-items: center;"><span class="inv-checkbox" style="display:inline-block; width:13px; height:13px; border:2.5px solid var(--primary-color); background:${isCash ? 'var(--primary-color)' : 'white'} !important; margin-left:6px; border-radius:3px;"></span> \u0646\u0642\u062f\u0627\u064b</div>
                            <div style="display: flex; align-items: center;"><span class="inv-checkbox" style="display:inline-block; width:13px; height:13px; border:2.5px solid var(--primary-color); background:${isBankak ? 'var(--primary-color)' : 'white'} !important; margin-left:6px; border-radius:3px;"></span> \u0628\u0646\u0643\u0643</div>
                            <div style="display: flex; align-items: center;"><span class="inv-checkbox" style="display:inline-block; width:13px; height:13px; border:2.5px solid var(--primary-color); background:${isCredit ? 'var(--primary-color)' : 'white'} !important; margin-left:6px; border-radius:3px;"></span> \u0622\u062c\u0644</div>
                        </div>
                    </div>

                    <!-- Layout Spacer to balance the ID/Date on right -->
                    <div style="width: 100px;"></div>
                </div>
                
                <div class="inv-bottom-band" style="background-color: var(--primary-color) !important; height: 22px; border-radius: 0 0 8px 8px; margin-top: 5px; display: flex; justify-content: space-between; align-items: center; color: white !important; padding: 0 15px;">
                   <div style="display: flex; align-items: center; font-size: 11px; font-weight: bold; color: white !important;">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px; color: white !important;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                       ${phone || '---'}
                   </div>
                   <div style="display: flex; align-items: center; font-size: 11px; font-weight: bold; color: white !important;">
                       ${address || 'المقر الرئيسي'}
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; color: white !important;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                   </div>
                </div>
                
                <div class="inv-customer" style="margin: 12px 0 8px 0; font-weight: 900; font-size: 13px; color: var(--primary-color) !important;">
                    اسم العميل المحترم: <span style="color: black; margin: 0 10px;">${clientName}</span>
                </div>
                
                <table class="inv-table" style="width: 100%; border-collapse: collapse; border: 2px solid var(--primary-color); margin-bottom: 0;">
                    <thead>
                        <tr>
                            <th style="width:50%; background-color: var(--primary-color) !important; color: white !important; padding: 4px; text-align: center; border: 1px solid var(--primary-color); font-weight: 900; font-size: 12px;">التفاصيل<br><span style="display: block; font-size: 9px; font-weight: normal; margin-top: 1px;">Description</span></th>
                            <th style="width:10%; background-color: var(--primary-color) !important; color: white !important; padding: 4px; text-align: center; border: 1px solid var(--primary-color); font-weight: 900; font-size: 12px;">العدد<br><span style="display: block; font-size: 9px; font-weight: normal; margin-top: 1px;">Qty</span></th>
                            <th style="width:20%; background-color: var(--primary-color) !important; color: white !important; padding: 4px; text-align: center; border: 1px solid var(--primary-color); font-weight: 900; font-size: 12px;">السعر<br><span style="display: block; font-size: 9px; font-weight: normal; margin-top: 1px;">Price</span></th>
                            <th style="width:20%; background-color: var(--primary-color) !important; color: white !important; padding: 4px; text-align: center; border: 1px solid var(--primary-color); font-weight: 900; font-size: 12px;">القيمة الإجمالية<br><span style="display: block; font-size: 9px; font-weight: normal; margin-top: 1px;">Total Amount</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml.replace(/<td/g, '<td style="padding: 6px 10px; border-left: 1px solid var(--primary-color); border-right: 1px solid var(--primary-color); border-bottom: 1px solid #eee; text-align: center; font-size: 13px; font-weight: 800; color: black !important;"')}
                    </tbody>
                </table>
                
                <div class="inv-summary-row" style="display: flex; border: 2px solid var(--primary-color); border-top: none; align-items: stretch;">
                    <div class="inv-summary-empty" style="flex-grow: 1; border-left: 2px solid var(--primary-color);"></div>
                    <div class="inv-summary-label" style="background-color: var(--primary-color) !important; color: white !important; padding: 6px; width: 90px; text-align: center; font-weight: 900; font-size: 12px;">الإجمالي<br><span style="letter-spacing: 1px; display: block; font-size: 9px; font-weight: normal; margin-top: 1px;">TOTAL</span></div>
                    <div class="inv-summary-val" style="width: 120px; text-align: center; padding: 6px; font-weight: 900; font-size: 15px; color: var(--primary-color) !important; display: flex; align-items: center; justify-content: center;">${totalAmount}</div>
                </div>
                
                <div style="text-align:left; font-size:9px; margin-top:3px; font-weight:900; color:var(--primary-color);">
                    إستلمت البضاعة الموضحه أعلاه كاملة وسليمة
                </div>
                
                <div class="inv-footer" style="margin-top: 25px; display: flex; justify-content: space-between; font-weight: 900; color: var(--primary-color) !important; font-size: 12px;">
                    <div>المبيعات: ............................</div>
                    <div>التوقيع: ............................</div>
                    <div>اسم المستلم: ............................</div>
                </div>
            </div>
            
            <style>
                @media print {
                    #app-container, #toast-container, .modal { display: none !important; }
                    body, html { margin: 0; padding: 0; background: white !important; }
                    #invoice-print-area { display: block !important; width: 100%; direction: rtl; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: 'Cairo', 'Almarai', sans-serif !important; }
                    @page { size: A4 portrait; margin: 0; }
                }
            </style>
        `;
    },

    printInvoice(data, type) {
        let printDiv = document.getElementById('invoice-print-area');
        if (!printDiv) {
            printDiv = document.createElement('div');
            printDiv.id = 'invoice-print-area';
            printDiv.style.display = 'none';
            document.body.appendChild(printDiv);
        }
        const title = type === 'purchases' ? 'فــاتــورة شــراء' : (type === 'proformas' ? 'فــاتــورة مــبــدئــيــة' : 'فــاتــورة بــيــــــع');
        printDiv.innerHTML = this.generateInvoiceHTML(data, title);
        window.print();
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// --- Handle Financial Printing CSS ---
const printStyles = `
@media print {
    #sidebar, #top-bar, .no-print, .btn-primary, .icon-btn, .notifications, .badge, .quick-expense, .close-btn, .theme-toggle, #electron-titlebar {
        display: none !important;
    }
    body { background: white !important; color: black !important; font-family: 'Cairo', 'Almarai', sans-serif !important; direction: rtl !important; }
    #content-area { margin: 0 !important; padding: 0 !important; width: 100% !important; border: none !important; }
    #view-container { margin: 0 !important; padding: 0 !important; }
    .stat-card-nm, .neumorph, .neumorph-inset { box-shadow: none !important; border: 1px solid #ddd !important; background: white !important; color: black !important; border-radius: 4px !important; }
    .erp-table th { border-bottom: 2px solid #000 !important; background: #eee !important; color: #000 !important; }
    .erp-table td { border-bottom: 1px solid #ccc !important; color: #000 !important; }
}
`;
const printStyleSheet = document.createElement("style");
printStyleSheet.innerText = printStyles;
document.head.appendChild(printStyleSheet);

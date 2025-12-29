// 库存数据本地存储KEY
const INVENTORY_KEY = 'car_dealership_inventory_my';
// 留言数据本地存储KEY
const MESSAGE_KEY = 'car_dealership_messages';

// 页面加载完成初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化计算器（如果当前页面是计算器页）
    if (document.getElementById('loan-form')) {
        updateDownPayment();
        calculateLoanResult();
        bindCalculatorEvents();
        loadCalculatorPrice(); // 移到DOM加载后执行
    }

    // 初始化库存（如果是库存/分店页面）
    if (document.getElementById('car-stocks')) {
        loadInventory();
        // 绑定筛选事件（移除内联onclick）
        bindFilterEvents();
    }

    // 绑定添加车辆表单（如果是管理页）
    if (document.getElementById('add-car-form')) {
        document.getElementById('add-car-form').addEventListener('submit', function(e) {
            e.preventDefault();
            addNewCar();
        });
        // 绑定导入导出事件
        bindImportExportEvents();
    }

    // 绑定留言表单（如果是留言页）
    if (document.getElementById('contact-form')) {
        document.getElementById('contact-form').addEventListener('submit', function(e) {
            e.preventDefault();
            submitMessage();
        });
    }

    // 绑定筛选重置按钮（如果有）
    const resetFilterBtn = document.getElementById('reset-filter-btn');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetFilters);
    }
});

// 绑定筛选事件（统一移除内联onclick）
function bindFilterEvents() {
    const searchInput = document.getElementById('search-input');
    const brandFilter = document.getElementById('brand-filter');
    const priceFilter = document.getElementById('price-filter');
    const filterBtn = document.querySelector('.stock-filter .btn-primary');

    // 实时筛选（输入/选择即筛选）
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (brandFilter) brandFilter.addEventListener('change', applyFilters);
    if (priceFilter) priceFilter.addEventListener('change', applyFilters);
    // 兼容原有筛选按钮
    if (filterBtn) filterBtn.addEventListener('click', applyFilters);
}

// 绑定导入导出事件
function bindImportExportEvents() {
    // 创建导入导出按钮（如果页面没有）
    const inventorySection = document.getElementById('inventory-management');
    if (inventorySection) {
        const importExportDiv = document.createElement('div');
        importExportDiv.className = 'mt-4 d-flex gap-2';
        importExportDiv.innerHTML = `
            <button class="btn btn-outline-primary" id="export-inventory-btn">
                <i class="bi bi-download"></i> Export Inventory
            </button>
            <label class="btn btn-outline-secondary">
                <i class="bi bi-upload"></i> Import Inventory
                <input type="file" id="import-inventory-file" accept=".json" hidden>
            </label>
        `;
        inventorySection.appendChild(importExportDiv);

        // 绑定事件
        document.getElementById('export-inventory-btn').addEventListener('click', exportInventory);
        document.getElementById('import-inventory-file').addEventListener('change', importInventory);
    }
}

// 计算器实时计算事件绑定
function bindCalculatorEvents() {
    const carPriceInput = document.getElementById('car-price');
    const downPercentInput = document.getElementById('down-payment-percent');
    const downPaymentInput = document.getElementById('down-payment');
    const loanTermSelect = document.getElementById('loan-term');
    const interestRateInput = document.getElementById('interest-rate');

    if (carPriceInput) carPriceInput.addEventListener('input', () => {
        updateDownPayment();
        calculateLoanResult();
    });

    if (downPercentInput) downPercentInput.addEventListener('input', () => {
        updateDownPayment();
        calculateLoanResult();
    });

    if (downPaymentInput) downPaymentInput.addEventListener('input', () => {
        updateDownPayment(true);
        calculateLoanResult();
    });

    if (loanTermSelect) loanTermSelect.addEventListener('change', calculateLoanResult);
    if (interestRateInput) interestRateInput.addEventListener('input', calculateLoanResult);
}

// 显示保存状态提示（统一函数，移除重复定义）
function showSaveStatus(message = 'Changes saved successfully!') {
    const status = document.getElementById('save-status');
    if (!status) return;
    
    status.textContent = `✅ ${message}`;
    status.style.display = 'block';
    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
}

// 显示内联错误提示
function showInlineError(element, message) {
    // 移除原有错误提示
    const oldError = element.parentNode.querySelector('.text-danger');
    if (oldError) oldError.remove();

    // 创建新提示
    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-danger small mt-1';
    errorDiv.textContent = `❌ ${message}`;
    element.parentNode.appendChild(errorDiv);

    // 5秒后自动移除
    setTimeout(() => errorDiv.remove(), 5000);
}

// 保存库存到本地存储（容错处理）
function saveInventory(inventory) {
    try {
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
        showSaveStatus('Inventory saved successfully!');
    } catch (e) {
        showSaveStatus('❌ Storage full! Failed to save inventory');
        console.error('LocalStorage error:', e);
    }
}

// 加载库存数据（修复数据解析+兼容页面）
function loadInventory() {
    const savedInventory = localStorage.getItem(INVENTORY_KEY);
    let inventory = [];
    
    // 无保存数据时初始化默认数据
    if (!savedInventory) {
        inventory = [
            // MANTHONG 总部
            {
                id: 1, // 新增ID，避免删除冲突
                brand: "Proton",
                model: "X70 1.8 PREMIUM",
                price: 62600,
                color: "White",
                mileage: "Used (2019)",
                branch: "manthong",
                specs: "Automatic, Premium Trim, Plate: VDB7826"
            },
            {
                id: 2,
                brand: "Perodua",
                model: "ATIVA 1.0 AV",
                price: 66600,
                color: "White",
                mileage: "Used (2023)",
                branch: "manthong",
                specs: "Turbo, Automatic, Advanced Trim, Plate: BRH3747"
            },
            // TSCAR 分支
            {
                id: 3,
                brand: "Proton",
                model: "PERSONA 1.6 PREMIUM",
                price: 36800,
                color: "White",
                mileage: "Used (2019)",
                branch: "tscar",
                specs: "Automatic, Premium Trim, Plate: VDK1259"
            },
            // EVERFORWARD 分支
            {
                id: 4,
                brand: "Honda",
                model: "CIVIC 1.8 S",
                price: 82800,
                color: "Red",
                mileage: "Used (2020)",
                branch: "everforward",
                specs: "Automatic, Plate: BQE6661"
            }
        ];
        saveInventory(inventory);
        console.log('默认库存数据已初始化并保存');
    } else {
        try {
            inventory = JSON.parse(savedInventory);
            // 为旧数据补充ID
            inventory.forEach((car, index) => {
                if (!car.id) car.id = index + 1;
            });
            console.log('从本地存储加载库存数据：', inventory.length, '辆车');
        } catch (e) {
            inventory = [];
            saveInventory(inventory);
            console.error('本地存储数据损坏，已重置：', e);
        }
    }
    
    // 渲染库存（兼容页面名称）
    const currentPage = window.location.pathname.split('/').pop().toLowerCase().split('?')[0];
    let filteredInventory = inventory;
    
    // 筛选对应分支
    if (currentPage.includes('manthong')) {
        filteredInventory = inventory.filter(car => car.branch === 'manthong');
    } else if (currentPage.includes('everforward')) {
        filteredInventory = inventory.filter(car => car.branch === 'everforward');
    } else if (currentPage.includes('tscar')) {
        filteredInventory = inventory.filter(car => car.branch === 'tscar');
    }
    
    console.log('当前页面：', currentPage, '筛选后车辆数：', filteredInventory.length);
    renderInventory(filteredInventory);
}   

// 渲染库存卡片（修复类名+添加data属性）
function renderInventory(inventory) {
    const inventoryContainer = document.getElementById('car-stocks');
    if (!inventoryContainer) {
        console.warn('未找到id为car-stocks的容器！');
        return;
    }

    inventoryContainer.innerHTML = '';

    if (inventory.length === 0) {
        inventoryContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <h4>No cars available in this branch yet</h4>
                <p class="text-muted">Check back later or add new cars to inventory</p>
                <a href="inventory.html" class="btn btn-outline-primary mt-3">
                    <i class="bi bi-plus-circle"></i> Add New Car
                </a>
            </div>
        `;
        return;
    }

    inventory.forEach(car => {
        let branchBadgeText = '';
        let branchBadgeClass = '';
        if (car.branch === 'manthong') {
            branchBadgeText = 'Manthong (Head Office)';
            branchBadgeClass = 'bg-primary';
        } else if (car.branch === 'everforward') {
            branchBadgeText = 'Everforward';
            branchBadgeClass = 'bg-success';
        } else if (car.branch === 'tscar') {
            branchBadgeText = 'Tscar (Branch)';
            branchBadgeClass = 'bg-secondary';
        }

        const imageUrl = `https://picsum.photos/seed/${car.brand.toLowerCase()}-${car.model.replace(/\s+/g, '-')}/600/400`;

        const isInventoryPage = window.location.pathname.includes('inventory.html');
        const carCard = `
            <div class="col-md-4 mb-4 stock-card" 
                 data-brand="${car.brand}" 
                 data-price="${car.price}"
                 data-model="${car.model.toLowerCase()}">
                <div class="card h-100 shadow-sm">
                    <span class="badge ${branchBadgeClass} branch-badge">${branchBadgeText}</span>
                    ${isInventoryPage ? 
                        `<button class="btn btn-sm delete-btn" data-car-id="${car.id}">
                            <i class="bi bi-trash-fill"></i>
                        </button>` : ''
                    }
                    <img src="${imageUrl}" class="card-img-top" alt="${car.brand} ${car.model}" style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h5 class="card-title">${car.brand} ${car.model}</h5>
                        <p class="card-text">
                            <strong>Price:</strong> RM ${car.price.toLocaleString()}<br>
                            <strong>Color:</strong> ${car.color}<br>
                            <strong>Mileage:</strong> ${car.mileage}<br>
                            <strong>Specs:</strong> ${car.specs}
                        </p>
                    </div>
                    <div class="card-footer">
                        <a href="calculator.html?price=${car.price}" class="btn btn-primary w-100">
                            <i class="bi bi-calculator"></i> Calculate Loan
                        </a>
                    </div>
                </div>
            </div>
        `;

        inventoryContainer.insertAdjacentHTML('beforeend', carCard);
    });

    // 绑定删除事件（移除内联onclick）
    bindDeleteEvents();
}

// 绑定删除车辆事件
function bindDeleteEvents() {
    const deleteBtns = document.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const carId = parseInt(this.getAttribute('data-car-id'));
            deleteCar(carId);
        });
    });
}

// 添加新车（优化校验+内联提示）
function addNewCar() {
    const brandInput = document.getElementById('new-car-brand');
    const modelInput = document.getElementById('new-car-model');
    const priceInput = document.getElementById('new-car-price');
    const colorInput = document.getElementById('new-car-color');
    const mileageInput = document.getElementById('new-car-mileage');
    const branchInput = document.getElementById('new-car-branch');
    const specsInput = document.getElementById('new-car-specs');

    const brand = brandInput.value.trim();
    const model = modelInput.value.trim();
    const price = parseFloat(priceInput.value);
    const color = colorInput.value.trim();
    const mileage = mileageInput.value.trim();
    const branch = branchInput.value;
    const specs = specsInput.value.trim();

    // 校验并显示内联错误
    let isValid = true;
    if (!brand) {
        showInlineError(brandInput, 'Brand is required');
        isValid = false;
    }
    if (!model) {
        showInlineError(modelInput, 'Model is required');
        isValid = false;
    }
    if (isNaN(price) || price <= 0) {
        showInlineError(priceInput, 'Price must be a positive number');
        isValid = false;
    }
    if (!color) {
        showInlineError(colorInput, 'Color is required');
        isValid = false;
    }
    if (!mileage) {
        showInlineError(mileageInput, 'Mileage is required');
        isValid = false;
    }
    if (!branch) {
        showInlineError(branchInput, 'Branch is required');
        isValid = false;
    }
    if (!specs) {
        showInlineError(specsInput, 'Specifications are required');
        isValid = false;
    }

    if (!isValid) return;

    const inventory = JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]');
    // 生成唯一ID
    const newId = inventory.length > 0 ? Math.max(...inventory.map(car => car.id)) + 1 : 1;
    inventory.push({
        id: newId,
        brand: brand,
        model: model,
        price: price,
        color: color,
        mileage: mileage,
        branch: branch,
        specs: specs
    });
    saveInventory(inventory);
    renderInventory(inventory);

    document.getElementById('add-car-form').reset();
    showSaveStatus('New car successfully added to inventory!');
}

// 删除车辆（通过ID精准删除）
function deleteCar(carId) {
    if (confirm('Are you sure you want to delete this car from inventory? (This car has been sold)')) {
        const inventory = JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]');
        const updatedInventory = inventory.filter(car => car.id !== carId);
        saveInventory(updatedInventory);
        // 重新加载库存（保持分支筛选）
        loadInventory();
    }
}

// 更新首付金额
function updateDownPayment(isManual = false) {
    const carPriceInput = document.getElementById('car-price');
    const downPercentInput = document.getElementById('down-payment-percent');
    const downPaymentInput = document.getElementById('down-payment');
    const downPercentDisplay = document.getElementById('down-percent-display');

    if (!carPriceInput || !downPercentInput || !downPaymentInput || !downPercentDisplay) return;

    const carPrice = parseFloat(carPriceInput.value) || 0;

    if (isManual) {
        const downPayment = parseFloat(downPaymentInput.value) || 0;
        let downPercent = 0;
        if (carPrice > 0) {
            downPercent = (downPayment / carPrice) * 100;
            downPercent = Math.min(Math.max(downPercent, 0), 50);
        }
        downPercentInput.value = downPercent;
        downPercentDisplay.textContent = `${downPercent.toFixed(1)}%`;
    } else {
        const downPercent = parseFloat(downPercentInput.value) || 0;
        const downPayment = carPrice * (downPercent / 100);
        downPaymentInput.value = downPayment.toFixed(2);
        downPercentDisplay.textContent = `${downPercent}%`;
    }
}

// 计算车贷（index.html兼容别名）
function calculateLoanResult() {
    const carPriceInput = document.getElementById('car-price');
    const downPercentInput = document.getElementById('down-payment-percent');
    const loanTermSelect = document.getElementById('loan-term');
    const interestRateInput = document.getElementById('interest-rate');

    if (!carPriceInput || !downPercentInput || !loanTermSelect || !interestRateInput) return;

    const carPrice = parseFloat(carPriceInput.value) || 0;
    const downPercent = parseFloat(downPercentInput.value) || 0;
    const loanTerm = parseFloat(loanTermSelect.value) || 0;
    const interestRate = parseFloat(interestRateInput.value) || 0;

    if (carPrice <= 0 || loanTerm <= 0) {
        updateLoanDisplay(0, 0, 0, 0);
        return;
    }

    const downPayment = carPrice * (downPercent / 100);
    const loanPrincipal = carPrice - downPayment;
    const totalMonths = loanTerm * 12;
    const totalInterest = loanPrincipal * (interestRate / 100) * loanTerm;
    const totalPayment = loanPrincipal + totalInterest;
    const monthlyInstallment = totalPayment / totalMonths;

    updateLoanDisplay(loanPrincipal, totalInterest, totalPayment, monthlyInstallment);
}

// 更新贷款显示（统一逻辑）
function updateLoanDisplay(principal, interest, total, monthly) {
    const loanAmountEl = document.getElementById('loan-amount');
    const totalInterestEl = document.getElementById('total-interest');
    const totalPaymentEl = document.getElementById('total-payment');
    const monthlyPaymentEl = document.getElementById('monthly-payment');

    if (loanAmountEl) loanAmountEl.textContent = `RM ${principal.toFixed(2)}`;
    if (totalInterestEl) totalInterestEl.textContent = `RM ${interest.toFixed(2)}`;
    if (totalPaymentEl) totalPaymentEl.textContent = `RM ${total.toFixed(2)}`;
    if (monthlyPaymentEl) monthlyPaymentEl.textContent = `RM ${monthly.toFixed(2)}`;
}

// index.html兼容：别名函数
function updateLoanCalculation() {
    calculateLoanResult();
}

// 防抖筛选（修复data属性匹配）
let filterTimeout;
function applyFilters() {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        const brandFilter = document.getElementById('brand-filter');
        const priceFilter = document.getElementById('price-filter');
        
        if (!searchInput || !brandFilter) return;

        const searchText = searchInput.value.toLowerCase();
        const brandValue = brandFilter.value;
        const priceValue = priceFilter ? priceFilter.value : 'all';
        const cards = document.querySelectorAll('.stock-card');

        cards.forEach(card => {
            const cardBrand = card.dataset.brand?.toLowerCase() || '';
            const cardModel = card.dataset.model || '';
            const cardPrice = parseFloat(card.dataset.price) || 0;
            
            const searchMatch = searchText === '' || cardBrand.includes(searchText) || cardModel.includes(searchText);
            const brandMatch = brandValue === 'all' || card.dataset.brand === brandValue;
            let priceMatch = true;
            
            if (priceValue === 'low') priceMatch = cardPrice < 100000;
            if (priceValue === 'mid') priceMatch = cardPrice >= 100000 && cardPrice <= 300000;
            if (priceValue === 'high') priceMatch = cardPrice > 300000;

            card.style.display = (searchMatch && brandMatch && priceMatch) ? 'block' : 'none';
        });
    }, 300);
}

// 重置筛选
function resetFilters() {
    const searchInput = document.getElementById('search-input');
    const brandFilter = document.getElementById('brand-filter');
    const priceFilter = document.getElementById('price-filter');

    if (searchInput) searchInput.value = '';
    if (brandFilter) brandFilter.value = 'all';
    if (priceFilter) priceFilter.value = 'all';
    
    loadInventory(); // 重新加载全部数据
}

// 提交留言（优化邮箱校验+内联提示）
function submitMessage() {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const branchInput = document.getElementById('branch');
    const messageInput = document.getElementById('message');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const branch = branchInput.value;
    const message = messageInput.value.trim();

    // 更严格的邮箱正则
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    let isValid = true;

    if (!name) {
        showInlineError(nameInput, 'Name is required');
        isValid = false;
    }
    if (!email || !emailRegex.test(email)) {
        showInlineError(emailInput, 'Please enter a valid email (e.g. name@example.com)');
        isValid = false;
    }
    if (!branch) {
        showInlineError(branchInput, 'Branch is required');
        isValid = false;
    }
    if (!message) {
        showInlineError(messageInput, 'Message is required');
        isValid = false;
    }

    if (!isValid) return;

    const newMessage = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: name,
        email: email,
        branch: branch,
        message: message,
        date: new Date().toLocaleString('en-MY')
    };

    try {
        const messages = JSON.parse(localStorage.getItem(MESSAGE_KEY) || '[]');
        messages.push(newMessage);
        localStorage.setItem(MESSAGE_KEY, JSON.stringify(messages));

        document.getElementById('contact-form').reset();
        showSaveStatus('Message sent successfully! We will get back to you soon.');
        
        setTimeout(() => {
            if (confirm('Message sent successfully! Do you want to return to homepage?')) {
                window.location.href = 'index.html';
            }
        }, 2000);
    } catch (e) {
        showInlineError(messageInput, 'Failed to save message! Storage may be full.');
        console.error('Message save error:', e);
    }
}

// 从URL加载计算器价格
function loadCalculatorPrice() {
    const urlParams = new URLSearchParams(window.location.search);
    const price = urlParams.get('price');
    if (price) {
        const carPriceInput = document.getElementById('car-price');
        if (carPriceInput) {
            carPriceInput.value = price;
            updateDownPayment();
            calculateLoanResult();
        }
    }
}

// 导出库存
function exportInventory() {
    const inventory = JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]');
    const blob = new Blob([JSON.stringify(inventory, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `car-inventory-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSaveStatus('Inventory exported successfully!');
}

// 导入库存
function importInventory(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const inventory = JSON.parse(e.target.result);
            const validBranches = ['manthong', 'tscar', 'everforward'];
            const isInvalid = !Array.isArray(inventory) || inventory.some(item => 
                !item.brand || !item.model || isNaN(item.price) || item.price <= 0 ||
                !item.color || !item.mileage || !validBranches.includes(item.branch) || !item.specs
            );
            
            if (isInvalid) {
                alert('❌ Invalid inventory file!\n- Ensure all fields are filled and valid\n- Branch must be: manthong/tscar/everforward\n- Price must be positive number');
                return;
            }

            // 补充ID
            inventory.forEach((car, index) => {
                if (!car.id) car.id = index + 1;
            });

            saveInventory(inventory);
            loadInventory();
            showSaveStatus('Inventory imported successfully!');
        } catch (err) {
            alert('❌ Invalid JSON file!');
            console.error('Import error:', err);
        }
    };
    reader.readAsText(file);
}

// ===== index.html 兼容函数 =====
let inventory = []; // 兼容cars变量
function getCars() {
    inventory = JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]');
    return inventory;
}

function saveCars() {
    saveInventory(inventory);
}

function renderCarList(filteredCars) {
    renderInventory(filteredCars);
}

function openAddCarModal() {
    window.location.href = 'inventory.html';
}

function openEditCarModal() {
    alert('Edit functionality: Please update car details in Inventory Management page');
}

function closeAllModals() {
    // 兼容index.html模态框关闭
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
}

function saveCarData() {
    alert('Please use the Inventory Management page to save car data');
    window.location.href = 'inventory.html';
}

function deleteCarData() {
    alert('Please use the Inventory Management page to delete cars');
    window.location.href = 'inventory.html';
}

function resetToDefaultData() {
    if (confirm('Are you sure to reset to default inventory?')) {
        localStorage.removeItem(INVENTORY_KEY);
        loadInventory();
        showSaveStatus('Inventory reset to default!');
    }
}

function exportCarData() {
    exportInventory();
}

function importFromGitHub() {
    alert('GitHub import: Please use the Import Inventory button in Inventory Management page');
}

function toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-more-menu');
    if (mobileMenu) {
        mobileMenu.style.display = mobileMenu.style.display === 'flex' ? 'none' : 'flex';
    }
}

function displayLastUpdatedTime() {
    const lastUpdated = localStorage.getItem('last_updated') || new Date().toLocaleString();
    showSaveStatus(`Last updated: ${lastUpdated}`);
    localStorage.setItem('last_updated', new Date().toLocaleString());
}
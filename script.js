// 부가세 모드 (기본값: 포함)
let taxMode = 'included';

// 부가세 모드 변경
function setTaxMode(mode) {
    taxMode = mode;

    // 버튼 활성화 상태 변경
    document.querySelectorAll('.tax-buttons .title-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // 각 행의 비고란 업데이트
    updateRemarksForAllRows();

    // 토탈 계산 업데이트
    calculateTotals();
}

// 모든 행의 비고란 업데이트
function updateRemarksForAllRows() {
    const tbody = document.getElementById('itemsTableBody');

    tbody.querySelectorAll('tr').forEach(row => {
        updateRemarksForRow(row);
    });
}

// 특정 행의 비고란 업데이트
function updateRemarksForRow(row) {
    const amount = parseFloat(row.querySelector('.amount-display').textContent) || 0;
    const remarksInput = row.querySelector('.remarks-field');

    if (amount > 0) {
        if (taxMode === 'included') {
            remarksInput.value = '부가세포함';
        } else {
            remarksInput.value = '부가세미포함';
        }
    } else {
        remarksInput.value = '';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeDate();
    addItemRows(10);
    addEventListeners();
    loadSupplierData();
    addSupplierSaveListeners();
});

// Set title
function setTitle(title) {
    document.getElementById('pageTitle').textContent = title;
    document.querySelectorAll('.title-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Set today's date
function initializeDate() {
    const dateInput = document.getElementById('quotationDate');
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
}

// Add item rows
function addItemRows(count) {
    const tbody = document.getElementById('itemsTableBody');
    for (let i = 0; i < count; i++) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="date" class="date-field" value=""></td>
            <td><input type="text" class="item-field" placeholder=""></td>
            <td><input type="text" class="unit-field" placeholder=""></td>
            <td><input type="number" class="quantity-field" placeholder="" value="" min="0" step="1"></td>
            <td><input type="number" class="unit-price-field" placeholder="" value="" min="0" step="1"></td>
            <td><span class="amount-display"></span></td>
            <td><input type="text" class="remarks-field" placeholder=""></td>
        `;
        tbody.appendChild(row);
    }
}

// Add event listeners
function addEventListeners() {
    const tbody = document.getElementById('itemsTableBody');
    tbody.addEventListener('input', function(e) {
        if (e.target.classList.contains('quantity-field') ||
            e.target.classList.contains('unit-price-field')) {
            const row = e.target.closest('tr');
            calculateRowAmount(row);
            calculateTotals();
        }
    });
}

// Calculate row amount
function calculateRowAmount(row) {
    const quantity = parseFloat(row.querySelector('.quantity-field').value) || 0;
    const unitPrice = parseFloat(row.querySelector('.unit-price-field').value) || 0;
    const amount = quantity * unitPrice;
    row.querySelector('.amount-display').textContent = amount.toFixed(0);

    // 비고란 업데이트
    updateRemarksForRow(row);
}

// Calculate totals
function calculateTotals() {
    const tbody = document.getElementById('itemsTableBody');
    let total = 0;

    tbody.querySelectorAll('tr').forEach(row => {
        const amount = parseFloat(row.querySelector('.amount-display').textContent) || 0;
        total += amount;
    });

    // 부가세미포함 모드면 10% 추가
    if (taxMode === 'excluded') {
        total = total * 1.1;
    }

    document.getElementById('finalTotal').textContent = total.toFixed(0);
}

// Stamp upload
function triggerStampUpload() {
    document.getElementById('stampInput').click();
}

document.getElementById('stampInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const stampContainer = document.getElementById('stampContainer');
            stampContainer.innerHTML = '';

            const img = document.createElement('img');
            img.src = event.target.result;
            img.classList.add('stamp-image');

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('stamp-delete');
            deleteBtn.textContent = '×';
            deleteBtn.type = 'button';
            deleteBtn.onclick = function(e) {
                e.preventDefault();
                stampContainer.innerHTML = '';
                document.getElementById('stampInput').value = '';
                document.querySelector('.stamp-btn').style.display = '';
            };

            img.onclick = triggerStampUpload;

            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.appendChild(img);
            wrapper.appendChild(deleteBtn);

            stampContainer.appendChild(wrapper);
            document.querySelector('.stamp-btn').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
});

// PDF Download
function downloadPDF() {
    const element = document.querySelector('.quotation-container');
    const pageWrapper = document.querySelector('.page-wrapper');
    const body = document.body;

    // 원본 스타일 저장
    const originalWidth = element.style.width;
    const originalHeight = element.style.height;
    const originalOverflow = element.style.overflow;
    const originalBoxShadow = element.style.boxShadow;
    const originalPaddingTop = element.style.paddingTop;
    const originalPageWrapperWidth = pageWrapper.style.width;
    const originalPageWrapperHeight = pageWrapper.style.height;
    const originalBodyPadding = body.style.padding;

    // PDF 저장 시 A5 사이즈 유지
    element.style.width = '148mm';
    element.style.height = '210mm';
    element.style.overflow = 'visible';
    element.style.boxShadow = 'none';
    element.style.paddingTop = '15mm';

    // 부모 컨테이너 크기 조정
    pageWrapper.style.width = '148mm';
    pageWrapper.style.height = '210mm';
    body.style.padding = '0';

    // 파일명 생성: 문서명_날짜_시간
    const pageTitle = document.getElementById('pageTitle').textContent;
    const dateInput = document.getElementById('quotationDate').value;
    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    const filename = dateInput
        ? `${pageTitle}_${dateInput.replace(/-/g, '')}_${timeStr}.pdf`
        : `${pageTitle}_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${timeStr}.pdf`;

    const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            logging: false,
            useCORS: true
        },
        jsPDF: {
            format: 'a5',
            orientation: 'portrait',
            unit: 'mm'
        }
    };

    // 숨길 요소들
    const titleSelector = document.querySelector('.title-selector');
    const stampBtn = document.querySelector('.stamp-btn');
    const stampDelete = document.querySelector('.stamp-delete');
    const buttonSection = document.querySelector('.button-section');

    titleSelector.style.display = 'none';
    stampBtn.style.display = 'none';
    if (stampDelete) stampDelete.style.display = 'none';
    buttonSection.style.display = 'none';

    html2pdf().set(opt).from(element).save().then(() => {
        // 원본 스타일 복원
        element.style.width = originalWidth;
        element.style.height = originalHeight;
        element.style.overflow = originalOverflow;
        element.style.boxShadow = originalBoxShadow;
        element.style.paddingTop = originalPaddingTop;
        pageWrapper.style.width = originalPageWrapperWidth;
        pageWrapper.style.height = originalPageWrapperHeight;
        body.style.padding = originalBodyPadding;

        titleSelector.style.display = '';
        stampBtn.style.display = '';
        if (stampDelete) stampDelete.style.display = '';
        buttonSection.style.display = '';
    });
}

// Load supplier data from localStorage
function loadSupplierData() {
    const supplierFields = ['businessNumber', 'companyName', 'businessAddress', 'representative', 'businessType', 'category'];

    supplierFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            const savedValue = localStorage.getItem(`supplier_${fieldId}`);
            if (savedValue) {
                element.value = savedValue;
            }
        }
    });
}

// Add event listeners for supplier fields to save to localStorage
function addSupplierSaveListeners() {
    const supplierFields = ['businessNumber', 'companyName', 'businessAddress', 'representative', 'businessType', 'category'];

    supplierFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.addEventListener('input', function(e) {
                localStorage.setItem(`supplier_${fieldId}`, e.target.value);
            });
        }
    });
}

// Initialize final total on page load
window.addEventListener('load', function() {
    calculateTotals();
});

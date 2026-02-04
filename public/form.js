// Simple Expense Tracker Form
class ExpenseForm {
    constructor() {
        // Use current origin for API calls
        this.apiBaseUrl = window.location.origin;

        // Form elements
        this.form = document.getElementById('expenseForm');
        this.messageDiv = document.getElementById('message');
        this.submitBtn = document.getElementById('submitBtn');
        this.expenseList = document.getElementById('expenseList');
        this.noExpenses = document.getElementById('noExpenses');
        this.totalAmountEl = document.getElementById('totalAmount');
        this.refreshBtn = document.getElementById('refreshBtn');

        // Filter elements
        this.filterStartDate = document.getElementById('filterStartDate');
        this.filterEndDate = document.getElementById('filterEndDate');
        this.applyFilterBtn = document.getElementById('applyFilterBtn');
        this.clearFilterBtn = document.getElementById('clearFilterBtn');

        // Filter state
        this.isFilterActive = false;
        this.allExpenses = [];

        this.init();
    }

    init() {
        this.setDefaultDate();
        this.setupEventListeners();
        this.loadExpenses();
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Refresh button
        this.refreshBtn.addEventListener('click', () => {
            this.loadExpenses();
        });

        // Apply filter button
        this.applyFilterBtn.addEventListener('click', () => {
            this.applyFilter();
        });

        // Clear filter button
        this.clearFilterBtn.addEventListener('click', () => {
            this.clearFilter();
        });
    }

    async handleFormSubmit() {
        // Prevent duplicate submissions
        if (this.isSubmitting) {
            return;
        }

        try {
            const formData = new FormData(this.form);
            const expenseData = {
                date: formData.get('date'),
                category: formData.get('category'),
                description: formData.get('description'),
                amount: parseFloat(formData.get('amount'))
            };

            // Validation
            if (!expenseData.date || !expenseData.category || !expenseData.description || !expenseData.amount) {
                this.showMessage('Semua field harus diisi!', 'error');
                return;
            }

            if (expenseData.amount <= 0) {
                this.showMessage('Nominal harus lebih dari 0!', 'error');
                return;
            }

            this.isSubmitting = true;
            this.setSubmitLoading(true);

            // Submit to API
            const response = await fetch(`${this.apiBaseUrl}/api/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(expenseData)
            });

            const result = await response.json();

            if (response.ok) {
                this.showMessage(`✅ Pengeluaran berhasil disimpan!`, 'success');
                this.resetForm();
                await this.loadExpenses();
            } else {
                throw new Error(result.error || 'Gagal menyimpan pengeluaran');
            }

        } catch (error) {
            console.error('Error submitting expense:', error);
            this.showMessage(`❌ ${error.message}`, 'error');
        } finally {
            this.isSubmitting = false;
            this.setSubmitLoading(false);
        }
    }

    async loadExpenses() {
        try {
            let url = `${this.apiBaseUrl}/api/expenses`;

            // Add filter parameters if active
            if (this.isFilterActive && this.filterStartDate.value && this.filterEndDate.value) {
                url += `?startDate=${this.filterStartDate.value}&endDate=${this.filterEndDate.value}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const expenses = await response.json();

            // Store all expenses for calculations
            this.allExpenses = expenses;

            // If filter is NOT active, only show first 5
            const expensesToShow = this.isFilterActive ? expenses : expenses.slice(0, 5);

            this.displayExpenses(expensesToShow, expenses.length);

        } catch (error) {
            console.error('Error loading expenses:', error);
        }
    }

    applyFilter() {
        if (!this.filterStartDate.value || !this.filterEndDate.value) {
            this.showMessage('Pilih tanggal awal dan akhir!', 'error');
            return;
        }

        this.isFilterActive = true;
        this.loadExpenses();
    }

    clearFilter() {
        this.isFilterActive = false;
        this.filterStartDate.value = '';
        this.filterEndDate.value = '';
        this.loadExpenses();
    }

    displayExpenses(expenses, totalCount = null) {
        if (expenses.length === 0) {
            this.expenseList.innerHTML = '';
            this.noExpenses.style.display = 'block';
            this.totalAmountEl.textContent = 'Rp 0';
            document.getElementById('jasaTotal').textContent = 'Rp 0';
            document.getElementById('barangTotal').textContent = 'Rp 0';
            return;
        }

        this.noExpenses.style.display = 'none';

        // Calculate totals from displayed expenses only
        const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        const jasaTotal = expenses.filter(e => e.category === 'jasa').reduce((sum, e) => sum + Number(e.amount), 0);
        const barangTotal = expenses.filter(e => e.category === 'barang').reduce((sum, e) => sum + Number(e.amount), 0);

        // Update displays
        this.totalAmountEl.textContent = 'Rp ' + total.toLocaleString('id-ID');
        document.getElementById('jasaTotal').textContent = 'Rp ' + jasaTotal.toLocaleString('id-ID');
        document.getElementById('barangTotal').textContent = 'Rp ' + barangTotal.toLocaleString('id-ID');

        // Build expense list
        let html = '';

        // Show indicator if not all expenses are displayed
        if (!this.isFilterActive && totalCount && totalCount > 5) {
            html += `
                <div class="list-indicator">
                    📊 Menampilkan 5 pengeluaran terakhir dari ${totalCount} total
                </div>
            `;
        }

        expenses.forEach(expense => {
            const categoryLabel = expense.category === 'jasa' ? 'Jasa' : 'Barang';
            const amount = Number(expense.amount);
            html += `
                <div class="expense-card category-${expense.category}">
                    <div class="expense-header">
                        <span class="expense-category">${categoryLabel}</span>
                        <span class="expense-date">${this.formatDate(expense.date)}</span>
                    </div>
                    <div class="expense-description">${expense.description}</div>
                    <div class="expense-amount">${amount.toLocaleString('id-ID')}</div>
                    <button class="delete-btn" onclick="deleteExpense(${expense.id})">🗑️ Hapus</button>
                </div>
            `;
        });

        this.expenseList.innerHTML = html;
    }

    resetForm() {
        this.form.reset();
        this.setDefaultDate();
    }

    // Utility methods
    formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    showMessage(text, type = 'success') {
        this.messageDiv.textContent = text;
        this.messageDiv.className = `message ${type}`;
        this.messageDiv.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                this.hideMessage();
            }, 3000);
        }
    }

    hideMessage() {
        this.messageDiv.style.display = 'none';
    }

    setSubmitLoading(loading) {
        this.submitBtn.disabled = loading;
        document.getElementById('submitText').textContent = loading
            ? '⏳ Menyimpan...'
            : '💾 Simpan Pengeluaran';
    }
}

// Delete expense function (global scope)
async function deleteExpense(id) {
    if (!confirm('Hapus pengeluaran ini?')) return;

    const apiBaseUrl = window.location.origin;

    try {
        const response = await fetch(`${apiBaseUrl}/api/expenses?id=${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // Reload expenses
            const form = new ExpenseForm();
            await form.loadExpenses();
        } else {
            alert('Gagal menghapus pengeluaran');
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Gagal menghapus pengeluaran');
    }
}

// Initialize when DOM is loaded (prevent multiple instances)
document.addEventListener('DOMContentLoaded', () => {
    if (!window.expenseFormInstance) {
        window.expenseFormInstance = new ExpenseForm();
    }
});

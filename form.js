// Smart Transaction Form with Automatic Journal Generation and Real-time Transaction List
class SmartTransactionForm {
    constructor() {
        // Dynamic API base URL - works for both local and production
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : window.location.origin;
        this.accounts = [];
        this.accountsMap = {};
        
        // Form elements
        this.form = document.getElementById('transactionForm');
        this.transactionTypeSelect = document.getElementById('transactionType');
        this.akunKasSelect = document.getElementById('akunKas');
        this.messageDiv = document.getElementById('message');
        this.loadingDiv = document.getElementById('loading');
        this.submitBtn = document.getElementById('submitBtn');
        this.journalPreview = document.getElementById('journalPreview');
        this.journalLines = document.getElementById('journalLines');
        
        // Transaction list elements
        this.refreshBtn = document.getElementById('refreshBtn');
        this.transactionTableBody = document.getElementById('transactionTableBody');
        this.noTransactions = document.getElementById('noTransactions');
        this.transactionsTable = document.getElementById('transactionsTable');
        
        this.init();
    }

    async init() {
        this.setDefaultDate();
        await this.loadAccounts();
        this.setupEventListeners();
        this.hideLoading();
        
        // Load initial transaction list
        await this.loadTransactions();
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    async loadAccounts() {
        try {
            this.showLoading();
            
            const response = await fetch(`${this.apiBaseUrl}/api/accounts`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.accounts = await response.json();
            this.createAccountsMap();
            this.populateKasAccounts();
            
        } catch (error) {
            console.error('Error loading accounts:', error);
            this.showMessage('Gagal memuat data akun. Pastikan server berjalan.', 'error');
        }
    }

    createAccountsMap() {
        this.accountsMap = {};
        this.accounts.forEach(account => {
            this.accountsMap[account.id] = account;
        });
    }

    populateKasAccounts() {
        // Filter accounts for Kas (codes: 111, 112, 113)
        const kasAccounts = this.accounts.filter(account => 
            ['111', '112', '113'].includes(account.code)
        );

        this.akunKasSelect.innerHTML = '<option value="" disabled selected>Pilih kas...</option>';
        
        kasAccounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.code} - ${account.name}`;
            this.akunKasSelect.appendChild(option);
        });
    }

    populateAccountSelect(selectElement) {
        selectElement.innerHTML = '<option value="" disabled selected>Pilih akun...</option>';
        this.accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.code} - ${account.name}`;
            selectElement.appendChild(option);
        });
    }

    setupEventListeners() {
        // Transaction type change handler
        this.transactionTypeSelect.addEventListener('change', () => {
            this.handleTransactionTypeChange();
        });

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Real-time journal preview
        this.form.addEventListener('input', () => {
            this.updateJournalPreview();
        });

        this.form.addEventListener('change', () => {
            this.updateJournalPreview();
        });

        // Auto-calculate Midtrans amount for Pelunasan
        const pelunasanField = document.getElementById('nominalPelunasan');
        const ongkirField = document.getElementById('biayaOngkir');
        
        if (pelunasanField && ongkirField) {
            pelunasanField.addEventListener('input', () => {
                this.updateMidtransCalculation();
            });
            
            ongkirField.addEventListener('input', () => {
                this.updateMidtransCalculation();
            });
        }

        // Add line button for Umum
        const addLineBtn = document.getElementById('addUmumLineBtn');
        if (addLineBtn) {
            addLineBtn.addEventListener('click', () => {
                this.addUmumLine();
            });
        }

        // Refresh transactions button
        this.refreshBtn.addEventListener('click', () => {
            this.loadTransactions();
        });
    }

    handleTransactionTypeChange() {
        const selectedType = this.transactionTypeSelect.value;
        const commonFields = document.getElementById('commonFields');
        
        // Hide all conditional fields
        document.querySelectorAll('.conditional-fields').forEach(field => {
            field.classList.remove('show');
        });

        // Show/hide common fields based on transaction type
        if (selectedType === 'Umum') {
            commonFields.style.display = 'none';
        } else {
            commonFields.style.display = 'block';
        }

        // Show relevant fields based on selected type
        if (selectedType) {
            const targetFields = document.getElementById(`${selectedType.toLowerCase()}Fields`);
            if (targetFields) {
                targetFields.classList.add('show');
                
                // Initialize Umum fields if needed
                if (selectedType === 'Umum') {
                    this.initializeUmumFields();
                }
                
                // Initialize Midtrans calculation for Pelunasan
                if (selectedType === 'Pelunasan') {
                    this.updateMidtransCalculation();
                }
            }
        }

        // Update journal preview
        this.updateJournalPreview();
    }

    initializeUmumFields() {
        const container = document.getElementById('umumLinesContainer');
        if (container.children.length === 0) {
            this.addUmumLine(); // Add first line
        }
    }

    addUmumLine() {
        const container = document.getElementById('umumLinesContainer');
        const lineDiv = document.createElement('div');
        lineDiv.className = 'form-row';
        lineDiv.style.marginBottom = '15px';
        lineDiv.style.padding = '15px';
        lineDiv.style.border = '1px solid #ddd';
        lineDiv.style.borderRadius = '8px';
        lineDiv.style.background = '#f9f9f9';
        
        const lineNumber = container.children.length + 1;
        
        lineDiv.innerHTML = `
            <div class="form-group">
                <label style="font-size: 11px;">Akun ${lineNumber}</label>
                <select class="akunSelect" style="padding: 6px; font-size: 11px;" required></select>
            </div>
            <div class="form-group">
                <label style="font-size: 11px;">Debit</label>
                <input type="number" placeholder="0" class="debitInput" style="padding: 6px; font-size: 11px;" min="0" step="1">
            </div>
            <div class="form-group">
                <label style="font-size: 11px;">Kredit</label>
                <input type="number" placeholder="0" class="creditInput" style="padding: 6px; font-size: 11px;" min="0" step="1">
            </div>
            <div class="form-group">
                <button type="button" class="removeLineBtn" style="background: #e74c3c; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 10px;">
                    🗑️ Hapus
                </button>
            </div>
        `;
        
        container.appendChild(lineDiv);
        
        // Populate account select
        this.populateAccountSelect(lineDiv.querySelector('.akunSelect'));
        
        // Add remove functionality
        lineDiv.querySelector('.removeLineBtn').addEventListener('click', () => {
            lineDiv.remove();
            this.updateJournalPreview();
        });
        
        // Add change listeners for preview update
        lineDiv.querySelectorAll('select, input').forEach(element => {
            element.addEventListener('change', () => this.updateJournalPreview());
            element.addEventListener('input', () => this.updateJournalPreview());
        });
    }

    updateJournalPreview() {
        const transactionType = this.transactionTypeSelect.value;
        if (!transactionType) {
            this.journalPreview.classList.remove('show');
            return;
        }

        const inputs = this.getFormInputs();
        const journalLines = this.generateJournalLines(transactionType, inputs);
        
        if (journalLines.length > 0) {
            this.displayJournalPreview(journalLines);
            this.journalPreview.classList.add('show');
        } else {
            this.journalPreview.classList.remove('show');
        }
    }

    getFormInputs() {
        const inputs = {
            akunKas: parseInt(document.getElementById('akunKas').value) || null,
            biayaAdmin: parseFloat(document.getElementById('biayaAdmin').value) || 0,
            nominalDP: parseFloat(document.getElementById('nominalDP').value) || 0,
            nominalPiutang: parseFloat(document.getElementById('nominalPiutang').value) || 0,
            nominalTotalPenjualan: parseFloat(document.getElementById('nominalTotalPenjualan').value) || 0,
            nominalPelunasan: parseFloat((document.getElementById('nominalPelunasan')?.value || '0').replace(/[^\d.]/g, '')) || 0,
            biayaOngkir: parseFloat((document.getElementById('biayaOngkir')?.value || '0').replace(/[^\d.]/g, '')) || 0
        };

        // Get nominalPembelian from the appropriate section
        const transactionType = this.transactionTypeSelect.value;
        if (transactionType === 'DP') {
            const dpPembelian = document.getElementById('dpPembelian');
            inputs.nominalPembelian = parseFloat(dpPembelian?.value) || 0;
        } else if (transactionType === 'Lunas') {
            const lunasPembelian = document.getElementById('lunasPembelian');
            inputs.nominalPembelian = parseFloat(lunasPembelian?.value) || 0;
        }

        // Handle Umum transaction lines
        if (transactionType === 'Umum') {
            const umumLines = [];
            document.querySelectorAll('#umumLinesContainer > div').forEach(div => {
                const accountId = parseInt(div.querySelector('.akunSelect').value);
                const debit = parseFloat(div.querySelector('.debitInput').value) || 0;
                const credit = parseFloat(div.querySelector('.creditInput').value) || 0;

                if (accountId && (debit > 0 || credit > 0)) {
                    umumLines.push({ account_id: accountId, debit, credit });
                }
            });
            inputs.umumLines = umumLines;
        }

        return inputs;
    }

    // CORE FUNCTION: Generate Journal Lines based on Transaction Type
    generateJournalLines(transactionType, inputs) {
        switch (transactionType) {
            case 'DP':
                return this.generateDPJournal(inputs);
            case 'Lunas':
                return this.generateLunasJournal(inputs);
            case 'Pelunasan':
                return this.generatePelunasanJournal(inputs);
            case 'Umum':
                return this.generateUmumJournal(inputs);
            default:
                return [];
        }
    }

    generateDPJournal(inputs) {
        const lines = [];
        
        // Validation
        if (!inputs.akunKas || inputs.nominalDP <= 0 || inputs.nominalPiutang <= 0) {
            return [];
        }

        // Debit: Kas (DP amount)
        lines.push({
            account_id: inputs.akunKas,
            debit: inputs.nominalDP,
            credit: 0
        });

        // Debit: Piutang Usaha (114)
        const piutangAccount = this.accounts.find(acc => acc.code === '114');
        if (piutangAccount) {
            lines.push({
                account_id: piutangAccount.id,
                debit: inputs.nominalPiutang,
                credit: 0
            });
        }

        // Credit: Penjualan (411) - Total of DP + Piutang
        const penjualanAccount = this.accounts.find(acc => acc.code === '411');
        if (penjualanAccount) {
            lines.push({
                account_id: penjualanAccount.id,
                debit: 0,
                credit: inputs.nominalDP + inputs.nominalPiutang
            });
        }

        // Optional: Biaya Produksi (512)
        if (inputs.nominalPembelian > 0) {
            const produksiAccount = this.accounts.find(acc => acc.code === '512');
            if (produksiAccount) {
                lines.push({
                    account_id: produksiAccount.id,
                    debit: inputs.nominalPembelian,
                    credit: 0
                });
            }

            // Credit: Hutang (211)
            const hutangAccount = this.accounts.find(acc => acc.code === '211');
            if (hutangAccount) {
                lines.push({
                    account_id: hutangAccount.id,
                    debit: 0,
                    credit: inputs.nominalPembelian
                });
            }
        }

        // Optional: Biaya Admin
        if (inputs.biayaAdmin > 0) {
            // Debit: Beban Lain-lain (811)
            const bebanAccount = this.accounts.find(acc => acc.code === '811');
            if (bebanAccount) {
                lines.push({
                    account_id: bebanAccount.id,
                    debit: inputs.biayaAdmin,
                    credit: 0
                });
            }

            // Credit: Midtrans (112)
            const midtransAccount = this.accounts.find(acc => acc.code === '112');
            if (midtransAccount) {
                lines.push({
                    account_id: midtransAccount.id,
                    debit: 0,
                    credit: inputs.biayaAdmin
                });
            }
        }

        return lines;
    }

    generateLunasJournal(inputs) {
        const lines = [];
        
        // Validation
        if (!inputs.akunKas || inputs.nominalTotalPenjualan <= 0) {
            return [];
        }

        // Debit: Kas (Total Penjualan)
        lines.push({
            account_id: inputs.akunKas,
            debit: inputs.nominalTotalPenjualan,
            credit: 0
        });

        // Credit: Penjualan (411)
        const penjualanAccount = this.accounts.find(acc => acc.code === '411');
        if (penjualanAccount) {
            lines.push({
                account_id: penjualanAccount.id,
                debit: 0,
                credit: inputs.nominalTotalPenjualan
            });
        }

        // Optional: Biaya Produksi (512)
        if (inputs.nominalPembelian > 0) {
            const produksiAccount = this.accounts.find(acc => acc.code === '512');
            if (produksiAccount) {
                lines.push({
                    account_id: produksiAccount.id,
                    debit: inputs.nominalPembelian,
                    credit: 0
                });
            }

            // Credit: Hutang (211)
            const hutangAccount = this.accounts.find(acc => acc.code === '211');
            if (hutangAccount) {
                lines.push({
                    account_id: hutangAccount.id,
                    debit: 0,
                    credit: inputs.nominalPembelian
                });
            }
        }

        // Optional: Biaya Admin
        if (inputs.biayaAdmin > 0) {
            // Debit: Beban Lain-lain (811)
            const bebanAccount = this.accounts.find(acc => acc.code === '811');
            if (bebanAccount) {
                lines.push({
                    account_id: bebanAccount.id,
                    debit: inputs.biayaAdmin,
                    credit: 0
                });
            }

            // Credit: Midtrans (112)
            const midtransAccount = this.accounts.find(acc => acc.code === '112');
            if (midtransAccount) {
                lines.push({
                    account_id: midtransAccount.id,
                    debit: 0,
                    credit: inputs.biayaAdmin
                });
            }
        }

        return lines;
    }

    generatePelunasanJournal(inputs) {
        const lines = [];
        
        // Debug logging
        const ongkirElement = document.getElementById('biayaOngkir');
        console.log('🔍 ongkir element:', ongkirElement);
        console.log('🔍 ongkir raw value:', ongkirElement?.value);
        console.log('🔍 DEBUG Pelunasan inputs:', inputs);
        console.log('🔍 biayaOngkir value:', inputs.biayaOngkir);
        console.log('🔍 biayaOngkir > 0?', inputs.biayaOngkir > 0);
        
        // Validation
        if (!inputs.akunKas || inputs.nominalPelunasan <= 0) {
            return [];
        }

        // If there's shipping cost (beban ongkir), add Midtrans debit entry  
        if (inputs.biayaOngkir > 0) {
            console.log('🔍 Using Midtrans logic (ongkir > 0)');
            // Debit: Midtrans (112) - auto-calculated: pelunasan + ongkir
            const midtransAccount = this.accounts.find(acc => acc.code === '112');
            if (midtransAccount) {
                lines.push({
                    account_id: midtransAccount.id,
                    debit: inputs.nominalPelunasan + inputs.biayaOngkir,
                    credit: 0
                });
            }

            // Credit: Piutang Usaha (114) - pelunasan amount only
            const piutangAccount = this.accounts.find(acc => acc.code === '114');
            if (piutangAccount) {
                lines.push({
                    account_id: piutangAccount.id,
                    debit: 0,
                    credit: inputs.nominalPelunasan
                });
            }

            // Credit: Beban Ongkos Kirim (615) - shipping cost as revenue/reimbursement to balance
            const ongkirAccount = this.accounts.find(acc => acc.code === '615');
            if (ongkirAccount) {
                lines.push({
                    account_id: ongkirAccount.id,
                    debit: 0,
                    credit: inputs.biayaOngkir
                });
            }
        } else {
            console.log('🔍 Using Kas logic (no ongkir)');
            // No shipping cost - use original kas logic
            // Debit: Kas (Selected account)
            lines.push({
                account_id: inputs.akunKas,
                debit: inputs.nominalPelunasan,
                credit: 0
            });

            // Credit: Piutang Usaha (114)
            const piutangAccount = this.accounts.find(acc => acc.code === '114');
            if (piutangAccount) {
                lines.push({
                    account_id: piutangAccount.id,
                    debit: 0,
                    credit: inputs.nominalPelunasan
                });
            }
        }

        // Optional: Biaya Admin (ALWAYS can exist - independent of ongkir)
        if (inputs.biayaAdmin > 0) {
            // Debit: Beban Lain-lain (811)
            const bebanAccount = this.accounts.find(acc => acc.code === '811');
            if (bebanAccount) {
                lines.push({
                    account_id: bebanAccount.id,
                    debit: inputs.biayaAdmin,
                    credit: 0
                });
            }

            // Credit: Midtrans (112)
            const midtransAccount = this.accounts.find(acc => acc.code === '112');
            if (midtransAccount) {
                lines.push({
                    account_id: midtransAccount.id,
                    debit: 0,
                    credit: inputs.biayaAdmin
                });
            }
        }

        return lines;
    }

    generateUmumJournal(inputs) {
        return inputs.umumLines || [];
    }

    displayJournalPreview(lines) {
        let html = '';
        let totalDebit = 0;
        let totalCredit = 0;

        lines.forEach(line => {
            const account = this.accountsMap[line.account_id];
            if (account) {
                const debitAmount = line.debit || 0;
                const creditAmount = line.credit || 0;
                
                totalDebit += debitAmount;
                totalCredit += creditAmount;

                html += `
                    <div class="journal-line">
                        <span class="account-name">${account.code} - ${account.name}</span>
                        <div>
                            ${debitAmount > 0 ? `<span class="amount debit">Debit: ${this.formatRupiah(debitAmount)}</span>` : ''}
                            ${creditAmount > 0 ? `<span class="amount credit">Kredit: ${this.formatRupiah(creditAmount)}</span>` : ''}
                        </div>
                    </div>
                `;
            }
        });

        // Add totals
        html += `
            <div class="journal-line" style="border-top: 2px solid #dee2e6; margin-top: 10px; padding-top: 10px; font-weight: bold;">
                <span class="account-name">TOTAL</span>
                <div>
                    <span class="amount debit">Debit: ${this.formatRupiah(totalDebit)}</span>
                    <span class="amount credit">Kredit: ${this.formatRupiah(totalCredit)}</span>
                </div>
            </div>
        `;

        // Balance check
        const balanced = Math.abs(totalDebit - totalCredit) < 0.01;
        if (!balanced) {
            html += `
                <div style="color: #e74c3c; font-weight: bold; text-align: center; margin-top: 10px; font-size: 10px;">
                    ⚠️ Jurnal tidak seimbang! Selisih: ${this.formatRupiah(Math.abs(totalDebit - totalCredit))}
                </div>
            `;
        } else {
            html += `
                <div style="color: #27ae60; font-weight: bold; text-align: center; margin-top: 10px; font-size: 10px;">
                    ✅ Jurnal seimbang
                </div>
            `;
        }

        this.journalLines.innerHTML = html;
    }

    async handleFormSubmit() {
        try {
            // Validate form
            if (!this.validateForm()) {
                return;
            }

            this.setSubmitLoading(true);

            // Get form data
            const formData = new FormData(this.form);
            const transactionType = formData.get('transactionType');
            const inputs = this.getFormInputs();

            // Generate journal lines
            const lines = this.generateJournalLines(transactionType, inputs);
            
            if (lines.length === 0) {
                throw new Error('Tidak dapat membuat jurnal. Periksa input Anda.');
            }

            // Prepare transaction data
            const transactionData = {
                date: formData.get('date'),
                description: formData.get('description'),
                lines: lines
            };

            // Submit to API
            const response = await fetch(`${this.apiBaseUrl}/api/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData)
            });

            const result = await response.json();

            if (response.ok) {
                this.showMessage(
                    `✅ Transaksi ${transactionType} berhasil disimpan! ID: ${result.id}`, 
                    'success'
                );
                this.resetForm();
                
                // Auto-reload transaction list
                await this.loadTransactions();
            } else {
                throw new Error(result.error || 'Gagal menyimpan transaksi');
            }

        } catch (error) {
            console.error('Error submitting transaction:', error);
            this.showMessage(`❌ ${error.message}`, 'error');
        } finally {
            this.setSubmitLoading(false);
        }
    }

    async loadTransactions() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/transactions`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const transactions = await response.json();
            this.displayTransactions(transactions);
            
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    }

    displayTransactions(transactions) {
        if (transactions.length === 0) {
            this.transactionsTable.style.display = 'none';
            this.noTransactions.style.display = 'block';
            return;
        }

        this.transactionsTable.style.display = 'table';
        this.noTransactions.style.display = 'none';

        let html = '';
        
        transactions.forEach(tx => {
            const debits = tx.lines.filter(l => l.debit > 0);
            const credits = tx.lines.filter(l => l.credit > 0);
            const maxLength = Math.max(debits.length, credits.length);

            for (let i = 0; i < maxLength; i++) {
                const debit = debits[i] || {};
                const credit = credits[i] || {};

                html += `
                    <tr>
                        ${i === 0 ? `
                            <td rowspan="${maxLength}">
                                <span class="transaction-id">#${tx.id}</span>
                            </td>
                            <td rowspan="${maxLength}" class="transaction-date">
                                ${new Date(tx.date).toLocaleDateString('id-ID')}
                            </td>
                            <td rowspan="${maxLength}" class="transaction-desc">
                                ${tx.description}
                            </td>
                        ` : ''}
                        <td class="account-info">
                            ${debit.account_code ? `${debit.account_code} - ${debit.account_name}` : ''}
                        </td>
                        <td class="amount-debit">
                            ${debit.debit ? this.formatRupiah(debit.debit) : ''}
                        </td>
                        <td class="account-info">
                            ${credit.account_code ? `${credit.account_code} - ${credit.account_name}` : ''}
                        </td>
                        <td class="amount-credit">
                            ${credit.credit ? this.formatRupiah(credit.credit) : ''}
                        </td>
                    </tr>
                `;
            }
        });

        this.transactionTableBody.innerHTML = html;
    }

    validateForm() {
        const transactionType = this.transactionTypeSelect.value;
        const inputs = this.getFormInputs();

        if (!transactionType) {
            this.showMessage('Pilih tipe transaksi terlebih dahulu!', 'error');
            return false;
        }

        if (!inputs.akunKas && transactionType !== 'Umum') {
            this.showMessage('Pilih akun kas terlebih dahulu!', 'error');
            return false;
        }

        // Validate based on transaction type
        switch (transactionType) {
            case 'DP':
                if (inputs.nominalDP <= 0 || inputs.nominalPiutang <= 0) {
                    this.showMessage('Nominal DP dan Piutang harus diisi dengan benar!', 'error');
                    return false;
                }
                break;
            case 'Lunas':
                if (inputs.nominalTotalPenjualan <= 0) {
                    this.showMessage('Nominal Total Penjualan harus diisi dengan benar!', 'error');
                    return false;
                }
                break;
            case 'Pelunasan':
                if (inputs.nominalPelunasan <= 0) {
                    this.showMessage('Nominal Pelunasan harus diisi dengan benar!', 'error');
                    return false;
                }
                break;
            case 'Umum':
                if (!inputs.umumLines || inputs.umumLines.length === 0) {
                    this.showMessage('Tambahkan minimal satu baris jurnal untuk transaksi umum!', 'error');
                    return false;
                }
                break;
        }

        return true;
    }

    resetForm() {
        this.form.reset();
        this.setDefaultDate();
        
        // Hide conditional fields
        document.querySelectorAll('.conditional-fields').forEach(field => {
            field.classList.remove('show');
        });
        
        // Show common fields by default
        const commonFields = document.getElementById('commonFields');
        commonFields.style.display = 'block';
        
        // Clear Umum lines
        const container = document.getElementById('umumLinesContainer');
        if (container) {
            container.innerHTML = '';
        }
        
        // Hide journal preview
        this.journalPreview.classList.remove('show');
        
        // Focus on transaction type for next entry
        this.transactionTypeSelect.focus();
    }

    // Auto-calculate Midtrans amount
    updateMidtransCalculation() {
        const pelunasanField = document.getElementById('nominalPelunasan');
        const ongkirField = document.getElementById('biayaOngkir');
        const midtransField = document.getElementById('midtransCalculated');
        
        if (pelunasanField && ongkirField && midtransField) {
            // nominalPelunasan represents the piutang (receivable) amount customer owes
            const piutangAmount = parseFloat(pelunasanField.value) || 0;
            const ongkir = parseFloat(ongkirField.value) || 0;
            // Midtrans receives: Piutang amount + Shipping cost
            const midtransTotal = piutangAmount + ongkir;
            
            if (midtransTotal > 0) {
                midtransField.value = this.formatRupiah(midtransTotal);
                midtransField.style.color = '#333';
                midtransField.style.fontWeight = 'bold';
            } else {
                midtransField.value = 'Rp 0,00';
                midtransField.style.color = '#999';
                midtransField.style.fontWeight = 'normal';
            }
        }
    }

    // Utility methods
    formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(number);
    }

    showMessage(text, type = 'success') {
        this.messageDiv.textContent = text;
        this.messageDiv.className = `message ${type}`;
        this.messageDiv.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                this.hideMessage();
            }, 5000);
        }
    }

    hideMessage() {
        this.messageDiv.style.display = 'none';
    }

    showLoading() {
        this.loadingDiv.style.display = 'block';
    }

    hideLoading() {
        this.loadingDiv.style.display = 'none';
    }

    setSubmitLoading(loading) {
        this.submitBtn.disabled = loading;
        document.getElementById('submitText').textContent = loading ? 
            '⏳ Menyimpan...' : '💾 Simpan Transaksi';
    }
}

// Initialize the form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SmartTransactionForm();
});

// Removed problematic input formatting that was preventing typing
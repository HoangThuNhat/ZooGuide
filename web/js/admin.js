/**
 * ZooGuide - Staff & Administrator Management Portal
 * Features: Ticket Validation Logs, Enclosure Status, Veterinary Health & Breeding Logs, Narration Content CMS
 */

const AdminPortal = {
    currentSubTab: 'tickets',

    init() {
        this.bindEvents();
        this.renderAll();
    },

    bindEvents() {
        // Sub-tabs navigation
        document.querySelectorAll('.admin-nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-subtab');
                this.switchSubTab(target);
            });
        });

        // Health Log Form submit
        const healthForm = document.getElementById('admin-health-form');
        if (healthForm) {
            healthForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleHealthSubmit();
            });
        }

        // Add Narration Form
        const narrationForm = document.getElementById('admin-narration-form');
        if (narrationForm) {
            narrationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNarrationSubmit();
            });
        }
    },

    switchSubTab(subtab) {
        this.currentSubTab = subtab;
        document.querySelectorAll('.admin-nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-subtab') === subtab);
        });

        document.querySelectorAll('.admin-subtab-pane').forEach(pane => {
            pane.classList.toggle('hidden', pane.id !== `admin-pane-${subtab}`);
        });

        this.renderSubTab(subtab);
    },

    renderAll() {
        this.renderTicketsTab();
        this.renderEnclosuresTab();
        this.renderHealthTab();
        this.renderNarrationsTab();
    },

    renderSubTab(subtab) {
        if (subtab === 'tickets') this.renderTicketsTab();
        if (subtab === 'enclosures') this.renderEnclosuresTab();
        if (subtab === 'health') this.renderHealthTab();
        if (subtab === 'narrations') this.renderNarrationsTab();
    },

    // 1. TICKETS TAB
    renderTicketsTab() {
        const tbody = document.getElementById('admin-tickets-table-body');
        if (!tbody) return;

        const tickets = MOCK_DB.tickets;
        tbody.innerHTML = tickets.map(t => {
            const statusClass = t.status === 'Active' ? 'badge-success' : 'badge-danger';
            return `
                <tr>
                    <td class="font-mono font-bold">${t.ticketCode}</td>
                    <td><strong>${t.customerName}</strong></td>
                    <td>${t.ticketType}</td>
                    <td>${t.validDate}</td>
                    <td><span class="badge ${statusClass}">${t.status}</span></td>
                    <td>
                        <span class="chip chip-sm">${t.hasAudioGuide ? 'Có Audio Guide' : 'Không'}</span>
                    </td>
                </tr>
            `;
        }).join('');

        const totalEl = document.getElementById('admin-metric-total-tickets');
        const activeEl = document.getElementById('admin-metric-active-tickets');
        if (totalEl) totalEl.textContent = tickets.length;
        if (activeEl) activeEl.textContent = tickets.filter(t => t.status === 'Active').length;
    },

    // 2. ENCLOSURES TAB
    renderEnclosuresTab() {
        const grid = document.getElementById('admin-enclosures-grid');
        if (!grid) return;

        const areas = MOCK_DB.areas;
        grid.innerHTML = areas.map(area => `
            <div class="admin-card">
                <div class="admin-card-header" style="border-left: 4px solid ${area.color};">
                    <div>
                        <span class="text-xs uppercase tracking-wider text-muted">Khu vực ${area.code}</span>
                        <h4 class="font-bold text-base">${area.nameVi}</h4>
                    </div>
                    <span class="badge badge-success">Vận hành tốt</span>
                </div>
                <div class="admin-card-body">
                    <p class="text-sm text-muted mb-3">${area.descriptionVi}</p>
                    <div class="admin-stat-row">
                        <span>Số lượng loài hiện tại:</span>
                        <strong>${area.animalCount} loài</strong>
                    </div>
                    <div class="admin-stat-row">
                        <span>Tình trạng vệ sinh & an toàn:</span>
                        <span class="text-success font-semibold">✓ Đã kiểm định sáng nay</span>
                    </div>
                    <div class="admin-stat-row">
                        <span>Nhiệt độ môi trường:</span>
                        <span>28°C • Độ ẩm 72%</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // 3. HEALTH & BREEDING TAB
    async renderHealthTab() {
        const listContainer = document.getElementById('admin-health-logs-list');
        const selectAnimal = document.getElementById('health-select-animal');

        // Populate select box if empty
        if (selectAnimal && selectAnimal.children.length <= 1) {
            selectAnimal.innerHTML = MOCK_DB.animals.map(a => `
                <option value="${a.code}">${a.nameVi} (${a.code})</option>
            `).join('');
        }

        if (!listContainer) return;

        const res = await ZooApi.getHealthLogs();
        if (!res.success) return;

        listContainer.innerHTML = res.data.map(log => `
            <div class="health-log-card">
                <div class="health-log-header">
                    <div>
                        <h4 class="font-bold text-sm text-primary">${log.animalName} <span class="font-mono text-muted text-xs">(${log.animalCode})</span></h4>
                        <span class="text-xs text-muted">Ngày khám: ${log.date} • Bác sĩ: ${log.veterinarian}</span>
                    </div>
                    <span class="badge badge-info">${log.healthStatus}</span>
                </div>
                <div class="health-log-details">
                    <div class="pill-stat">Cân nặng: <strong>${log.weightKg} kg</strong></div>
                    <div class="pill-stat">Thân nhiệt: <strong>${log.temperatureC}°C</strong></div>
                </div>
                <p class="health-log-notes">📝 <strong>Ghi chú:</strong> ${log.notes}</p>
                ${log.actionRequired ? `<p class="health-log-action">⚠️ <strong>Hành động:</strong> ${log.actionRequired}</p>` : ''}
            </div>
        `).join('');
    },

    async handleHealthSubmit() {
        const animalCode = document.getElementById('health-select-animal').value;
        const veterinarian = document.getElementById('health-input-vet').value;
        const weightKg = parseFloat(document.getElementById('health-input-weight').value) || 0;
        const temperatureC = parseFloat(document.getElementById('health-input-temp').value) || 38.0;
        const healthStatus = document.getElementById('health-input-status').value;
        const notes = document.getElementById('health-input-notes').value;
        const actionRequired = document.getElementById('health-input-action').value;

        const animal = MOCK_DB.animals.find(a => a.code === animalCode);
        const animalName = animal ? animal.nameVi : animalCode;

        const res = await ZooApi.addHealthRecord({
            animalCode,
            animalName,
            veterinarian,
            weightKg,
            temperatureC,
            healthStatus,
            notes,
            actionRequired
        });

        if (res.success) {
            if (window.ZooApp && window.ZooApp.showToast) {
                window.ZooApp.showToast("Đã lưu nhật ký khám sức khỏe động vật!", "success");
            }
            document.getElementById('admin-health-form').reset();
            this.renderHealthTab();
        }
    },

    // 4. NARRATIONS TAB
    renderNarrationsTab() {
        const container = document.getElementById('admin-narrations-list');
        const animalSelect = document.getElementById('narration-select-animal');

        if (animalSelect && animalSelect.children.length <= 1) {
            animalSelect.innerHTML = MOCK_DB.animals.map(a => `
                <option value="${a.id}">${a.nameVi} (Khu ${a.zoneCode})</option>
            `).join('');
        }

        if (!container) return;

        const items = [];
        for (const [id, narr] of Object.entries(MOCK_DB.narrations)) {
            const animal = MOCK_DB.animals.find(a => a.id === parseInt(id));
            if (narr.vi) items.push({ animal, lang: 'vi', data: narr.vi });
            if (narr.en) items.push({ animal, lang: 'en', data: narr.en });
        }

        container.innerHTML = items.map(item => `
            <div class="narration-item-card">
                <div class="narration-item-header">
                    <div>
                        <span class="badge ${item.lang === 'vi' ? 'badge-primary' : 'badge-amber'} uppercase">
                            ${item.lang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
                        </span>
                        <h4 class="font-bold text-sm mt-1">${item.data.title}</h4>
                        <span class="text-xs text-muted">Động vật: ${item.animal ? item.animal.nameVi : 'Unknown'} • Giọng đọc: ${item.data.narrator}</span>
                    </div>
                    <span class="chip chip-sm font-mono">${item.data.durationFormatted}</span>
                </div>
                <p class="text-xs text-muted mt-2">${item.data.summary}</p>
                <div class="mt-3 flex gap-2">
                    <button class="btn btn-sm btn-outline btn-play-sample" data-id="${item.animal ? item.animal.id : 1}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        <span>Nghe thử</span>
                    </button>
                    <span class="text-xs text-muted flex items-center">✓ Đã duyệt xuất bản</span>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.btn-play-sample').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                if (window.AudioEngine) window.AudioEngine.playAnimalAudio(id);
            });
        });
    },

    handleNarrationSubmit() {
        const animalId = parseInt(document.getElementById('narration-select-animal').value);
        const lang = document.getElementById('narration-select-lang').value;
        const title = document.getElementById('narration-input-title').value;
        const narrator = document.getElementById('narration-input-narrator').value;
        const summary = document.getElementById('narration-input-summary').value;
        const scriptText = document.getElementById('narration-input-script').value;

        if (!title || !scriptText) return;

        if (!MOCK_DB.narrations[animalId]) {
            MOCK_DB.narrations[animalId] = {};
        }

        const transcript = scriptText.split('\n').filter(s => s.trim()).map((line, idx) => ({
            time: idx * 12,
            text: line.trim()
        }));

        MOCK_DB.narrations[animalId][lang] = {
            animalId,
            title,
            narrator: narrator || "Cán bộ chuyên môn ZooGuide",
            durationSec: transcript.length * 12,
            durationFormatted: `${Math.floor((transcript.length * 12) / 60)}:${((transcript.length * 12) % 60).toString().padStart(2, '0')}`,
            summary,
            transcript
        };

        if (window.ZooApp && window.ZooApp.showToast) {
            window.ZooApp.showToast("Đã lưu nội dung thuyết minh thành công!", "success");
        }

        document.getElementById('admin-narration-form').reset();
        this.renderNarrationsTab();
    }
};

window.AdminPortal = AdminPortal;

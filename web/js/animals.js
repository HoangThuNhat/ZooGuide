/**
 * ZooGuide - Animal Discovery & Catalog Module
 * Features: Instant Search, Species/Zone Filters, Detail Modal, Loading & Empty States
 */

const AnimalsModule = {
    animals: [],
    activeFilterZone: 'all',
    activeFilterIucn: 'all',
    searchTerm: '',

    init() {
        this.bindEvents();
        this.loadAnimals();
    },

    async loadAnimals() {
        this.renderSkeleton();

        const res = await ZooApi.getAnimals({
            search: this.searchTerm,
            zoneId: this.activeFilterZone,
            iucnStatus: this.activeFilterIucn
        });

        if (res.success) {
            this.animals = res.data;
            this.renderList();
        } else {
            this.renderError("Không thể tải danh sách động vật.");
        }
    },

    renderSkeleton() {
        const grid = document.getElementById('animals-grid');
        if (!grid) return;

        grid.innerHTML = Array(6).fill(0).map(() => `
            <div class="animal-card skeleton-card">
                <div class="skeleton skeleton-img"></div>
                <div class="card-body">
                    <div class="skeleton skeleton-tag"></div>
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-desc"></div>
                </div>
            </div>
        `).join('');
    },

    renderList() {
        const grid = document.getElementById('animals-grid');
        const emptyState = document.getElementById('animals-empty-state');
        const countBadge = document.getElementById('animals-count-badge');

        if (!grid) return;

        if (countBadge) {
            countBadge.textContent = `${this.animals.length} loài`;
        }

        if (this.animals.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        grid.innerHTML = this.animals.map(animal => {
            const iucnClass = this.getIucnBadgeClass(animal.iucnStatus);
            return `
                <article class="animal-card" data-id="${animal.id}">
                    <div class="card-media">
                        <img src="${animal.imageUrl}" alt="${animal.nameVi}" loading="lazy" class="card-img"/>
                        <span class="badge ${iucnClass}">${animal.iucnStatus}</span>
                        <span class="card-zone-tag">Khu ${animal.zoneCode}</span>
                    </div>
                    <div class="card-content">
                        <div class="card-header-info">
                            <h3 class="card-title">${animal.nameVi}</h3>
                            <p class="card-latin"><em>${animal.scientificName}</em></p>
                        </div>
                        <p class="card-origin">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                            <span>${animal.origin}</span>
                        </p>
                        <div class="card-meta-chips">
                            <span class="chip">${animal.species}</span>
                            <span class="chip chip-subtle">${animal.weight}</span>
                        </div>
                        <div class="card-actions">
                            <button class="btn btn-sm btn-primary btn-play-audio" data-id="${animal.id}" aria-label="Nghe thuyết minh ${animal.nameVi}">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                <span>Thuyết minh</span>
                            </button>
                            <button class="btn btn-sm btn-outline btn-locate-map" data-id="${animal.id}" aria-label="Định vị trên bản đồ">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                                </svg>
                                <span>Bản đồ</span>
                            </button>
                            <button class="btn btn-sm btn-icon btn-detail" data-id="${animal.id}" aria-label="Xem chi tiết">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        // Bind Card Action Buttons
        grid.querySelectorAll('.btn-play-audio').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.getAttribute('data-id'));
                if (window.AudioEngine) window.AudioEngine.playAnimalAudio(id);
            });
        });

        grid.querySelectorAll('.btn-locate-map').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.getAttribute('data-id'));
                if (window.ZooApp) window.ZooApp.switchTab('map');
                if (window.ZooMap) {
                    window.ZooMap.selectAnimalPin(id);
                    const animal = MOCK_DB.animals.find(a => a.id === id);
                    if (animal) window.ZooMap.navigate(animal);
                }
            });
        });

        grid.querySelectorAll('.btn-detail, .animal-card').forEach(item => {
            item.addEventListener('click', (e) => {
                const id = parseInt(item.getAttribute('data-id'));
                this.openDetailModal(id);
            });
        });
    },

    getIucnBadgeClass(status) {
        if (status.includes('Cực kỳ')) return 'badge-danger';
        if (status.includes('Nguy cấp')) return 'badge-warning';
        if (status.includes('Sắp bị')) return 'badge-amber';
        return 'badge-success';
    },

    async openDetailModal(animalId) {
        const res = await ZooApi.getAnimalById(animalId);
        if (!res.success) return;

        const animal = res.data;
        const modal = document.getElementById('animal-detail-modal');
        if (!modal) return;

        document.getElementById('detail-modal-img').src = animal.imageUrl;
        document.getElementById('detail-modal-title').textContent = animal.nameVi;
        document.getElementById('detail-modal-latin').textContent = animal.scientificName;
        document.getElementById('detail-modal-zone').textContent = `${animal.zoneName} (Khu ${animal.zoneCode})`;
        document.getElementById('detail-modal-species').textContent = animal.species;
        document.getElementById('detail-modal-origin').textContent = animal.origin;
        document.getElementById('detail-modal-diet').textContent = animal.diet;
        document.getElementById('detail-modal-weight').textContent = animal.weight;
        document.getElementById('detail-modal-lifespan').textContent = animal.lifespan;
        document.getElementById('detail-modal-health').textContent = animal.healthStatus;
        document.getElementById('detail-modal-breeding').textContent = animal.breedingStatus;

        // Fun facts
        const funFactsContainer = document.getElementById('detail-modal-funfacts');
        if (funFactsContainer) {
            funFactsContainer.innerHTML = animal.funFactsVi.map(fact => `
                <li class="fun-fact-item">
                    <span class="fun-fact-bullet">✦</span>
                    <span>${fact}</span>
                </li>
            `).join('');
        }

        // Action CTA buttons in Modal
        const btnPlayModal = document.getElementById('detail-modal-btn-play');
        if (btnPlayModal) {
            btnPlayModal.onclick = () => {
                if (window.AudioEngine) window.AudioEngine.playAnimalAudio(animal.id);
                this.closeDetailModal();
            };
        }

        const btnNavigateModal = document.getElementById('detail-modal-btn-navigate');
        if (btnNavigateModal) {
            btnNavigateModal.onclick = () => {
                this.closeDetailModal();
                if (window.ZooApp) window.ZooApp.switchTab('map');
                if (window.ZooMap) {
                    window.ZooMap.selectAnimalPin(animal.id);
                    window.ZooMap.navigate(animal);
                }
            };
        }

        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
    },

    closeDetailModal() {
        const modal = document.getElementById('animal-detail-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }
    },

    filterByZone(zoneId) {
        this.activeFilterZone = zoneId;
        // Update pill tabs active state
        document.querySelectorAll('.filter-zone-pill').forEach(pill => {
            pill.classList.toggle('active', pill.getAttribute('data-zone') === zoneId);
        });
        if (window.ZooApp) window.ZooApp.switchTab('animals');
        this.loadAnimals();
    },

    bindEvents() {
        // Search Input with debounce
        const searchInput = document.getElementById('animals-search-input');
        let searchTimeout;
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchTerm = e.target.value;
                    this.loadAnimals();
                }, 250);
            });
        }

        // Zone filter pills
        document.querySelectorAll('.filter-zone-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                this.filterByZone(pill.getAttribute('data-zone'));
            });
        });

        // IUCN filter
        const iucnSelect = document.getElementById('filter-iucn-select');
        if (iucnSelect) {
            iucnSelect.addEventListener('change', (e) => {
                this.activeFilterIucn = e.target.value;
                this.loadAnimals();
            });
        }

        // Reset Filter button
        const resetBtn = document.getElementById('btn-reset-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.searchTerm = '';
                this.activeFilterZone = 'all';
                this.activeFilterIucn = 'all';
                if (searchInput) searchInput.value = '';
                if (iucnSelect) iucnSelect.value = 'all';
                document.querySelectorAll('.filter-zone-pill').forEach(p => {
                    p.classList.toggle('active', p.getAttribute('data-zone') === 'all');
                });
                this.loadAnimals();
            });
        }

        // Modal Close Button & Backdrop
        const closeBtn = document.getElementById('btn-close-animal-modal');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeDetailModal());

        const modalBackdrop = document.querySelector('#animal-detail-modal .modal-backdrop');
        if (modalBackdrop) modalBackdrop.addEventListener('click', () => this.closeDetailModal());
    }
};

window.AnimalsModule = AnimalsModule;

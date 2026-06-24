document.addEventListener('DOMContentLoaded', () => {
    const vehicleGrid = document.getElementById('vehicle-grid-container');
    let allVehicles = []; // Store our master list of vehicles

    // Helper to get initials
    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    // Helper to render vehicle icon/gradient if no image url is set
    const getVehicleIconAndBg = (type) => {
        switch(type) {
            case 'Scooty': 
                return { icon: 'fa-motorcycle', bg: 'from-bgLight to-[#FEF3C7] text-chaiGold dark:from-slate-850 dark:to-slate-950 dark:text-amber-400' };
            case 'Cycle': 
                return { icon: 'fa-bicycle', bg: 'from-bgLight to-[#DBEAFE] text-primaryIndigo dark:from-slate-850 dark:to-slate-950 dark:text-blue-400' };
            case 'Car': 
                return { icon: 'fa-car', bg: 'from-bgLight to-[#E0E7FF] text-primaryIndigo dark:from-slate-850 dark:to-slate-950 dark:text-indigo-400' };
            case 'Bike': 
                return { icon: 'fa-motorcycle', bg: 'from-bgLight to-[#FEE2E2] text-sunsetCoral dark:from-slate-850 dark:to-slate-950 dark:text-rose-400' };
            default: 
                return { icon: 'fa-bicycle', bg: 'from-bgLight to-[#DBEAFE] text-primaryIndigo dark:from-slate-850 dark:to-slate-950' };
        }
    };

    // Helper for dynamic vehicle descriptions
    const getVehicleDescription = (type) => {
        switch(type) {
            case 'Scooty': return 'Lent for countless late-night chai missions and station runs.';
            case 'Bike': return 'Still gets borrowed before every spontaneous Sangam plan.';
            case 'Cycle': return 'Used mostly for 8:58 AM lab comms and CC3 rescues.';
            case 'Car': return 'Perfect for big hostel groups heading for Civil Lines snack runs or airport drops.';
            default: return 'Reliable classmate wheels, shared by folks two hostels away.';
        }
    };

    // Helper for dynamic card container height classes
    const getImageHeightClass = (type) => {
        switch(type) {
            case 'Cycle': return 'h-32';
            case 'Scooty': return 'h-36';
            case 'Bike': return 'h-40';
            case 'Car': return 'h-48';
            default: return 'h-36';
        }
    };

    // Load vehicles from API
    const loadVehicles = async () => {
        if (!vehicleGrid) return;

        try {
            const res = await fetch('/api/vehicles');
            if (!res.ok) {
                throw new Error('Failed to fetch vehicles');
            }
            allVehicles = await res.json();
            renderVehicles(allVehicles);
            setupTabListeners();
        } catch (error) {
            console.error(error);
            vehicleGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <p class="text-rose-500 font-semibold">Could not load campus wheels. Please try again later.</p>
                </div>
            `;
        }
    };

    // Pool of random authentic campus notes if the user did not specify one
    const getRandomCampusNote = () => {
        const notes = [
            "Helmet hangs near the handle.",
            "Petrol's low. Please refill if heading far.",
            "Bell doesn't work. Everything else does.",
            "Please don't leave it outside SAC overnight 😭",
            "Back brake is sensitive.",
            "Still gets borrowed before every Sangam plan."
        ];
        return notes[Math.floor(Math.random() * notes.length)];
    };

    // Render vehicles in the grid
    const renderVehicles = (vehicles) => {
        vehicleGrid.innerHTML = '';

        if (vehicles.length === 0) {
            vehicleGrid.innerHTML = `
                <div class="col-span-full text-center py-16 bg-white dark:bg-darkCard rounded-3xl border border-dashed border-slate-200 dark:border-white/10 p-8">
                    <i class="fa-solid fa-bicycle text-4xl text-slate-350 dark:text-slate-600 mb-4"></i>
                    <p class="text-slate-500 dark:text-slate-400 font-medium font-display text-lg">No wheels listed in this category yet.</p>
                    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Be the first to share your wheels with the campus!</p>
                </div>
            `;
            return;
        }

        vehicles.forEach(vehicle => {
            const card = document.createElement('div');
            card.className = `bg-white dark:bg-darkCard border border-slate-200/60 dark:border-white/5 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between ${vehicle.vehicleType === 'Car' ? 'md:col-span-2' : ''}`;

            const ownerName = vehicle.user ? vehicle.user.name : 'IIITA Student';
            const initials = getInitials(ownerName);
            const ownerMeta = vehicle.user ? `${vehicle.user.department || 'B.Tech'} • ${vehicle.user.year || 'Student'}` : 'Verified Student';
            const imgHeight = getImageHeightClass(vehicle.vehicleType);
            
            // Image vs generic representation
            let imageHtml = '';
            if (vehicle.image && vehicle.image !== '/images/vehicle_placeholder.png' && vehicle.image.trim() !== '') {
                imageHtml = `<img src="${vehicle.image}" alt="${vehicle.title}" class="w-full h-full object-cover rounded-2xl">`;
            } else {
                const visual = getVehicleIconAndBg(vehicle.vehicleType);
                imageHtml = `
                    <div class="w-full h-full bg-gradient-to-br ${visual.bg} flex flex-col items-center justify-center rounded-2xl py-6 gap-2">
                        <i class="fa-solid ${visual.icon} text-4xl"></i>
                        <span class="text-xs uppercase font-bold tracking-widest opacity-80">${vehicle.vehicleType}</span>
                    </div>
                `;
            }

            // Specs tag pills
            const specsHtml = vehicle.specs.map(spec => `
                <span class="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 py-1 px-2.5 rounded-full">${spec}</span>
            `).join('');

            // Parking and Personal Note variables
            const parking = vehicle.parkingLocation || 'Inside Campus';
            const note = vehicle.note && vehicle.note.trim() !== 'Please return safely! 🛵' ? vehicle.note : getRandomCampusNote();

            // Status and Badges
            const displayStatus = vehicle.status === 'available' ? 'READY TO LEND' : vehicle.status.toUpperCase();
            const badgeClass = vehicle.status === 'available' 
                ? 'bg-[#FEF3C7] dark:bg-amber-950/20 text-[#D97706] dark:text-[#FBBF24] border border-[#FBBF24]/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10';

            card.innerHTML = `
                <!-- Card Header: Student Profile Info -->
                <div class="flex items-center justify-between gap-3 mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-primaryIndigo flex items-center justify-center text-white text-xs font-extrabold uppercase shrink-0 shadow-sm">
                            ${initials}
                        </div>
                        <div class="min-w-0">
                            <h4 class="font-bold text-sm text-slate-800 dark:text-white truncate leading-tight">${ownerName}</h4>
                            <p class="text-[11px] text-slate-450 dark:text-slate-400 truncate mt-0.5">${ownerMeta}</p>
                        </div>
                    </div>
                    <span class="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${badgeClass}">
                        ${displayStatus}
                    </span>
                </div>

                <!-- Visual representation -->
                <div class="${imgHeight} w-full relative mb-4">
                    ${imageHtml}
                </div>

                <!-- Vehicle Details & Specs -->
                <div class="space-y-3 flex-1">
                    <div>
                        <h3 class="font-display font-bold text-lg text-slate-900 dark:text-white leading-tight">
                            ${vehicle.title}
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            ${getVehicleDescription(vehicle.vehicleType)}
                        </p>
                    </div>
                    
                    <!-- Specifications pills -->
                    <div class="flex flex-wrap gap-1.5">
                        ${specsHtml}
                    </div>

                    <!-- Approximate parking location -->
                    <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <i class="fa-solid fa-location-dot text-sunsetCoral dark:text-[#F87171] text-sm"></i>
                        <span>Parked near: <strong class="text-slate-700 dark:text-slate-300 font-semibold">${parking}</strong></span>
                    </div>

                    <!-- Trust Badges Section -->
                    <div class="py-2 border-y border-slate-100 dark:border-white/5 text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-semibold">
                        <span>✓ IIITA Verified</span>
                        <span class="text-slate-300 dark:text-slate-700">·</span>
                        <span>✓ College Email Verified</span>
                        <span class="text-slate-300 dark:text-slate-700">·</span>
                        <span>✓ Borrow History Available</span>
                    </div>

                    <!-- Personal Owner Note Sticky Note Bubble -->
                    <div class="bg-[#FFFDF9] dark:bg-amber-955/10 border border-chaiGold/20 p-3 rounded-2xl relative mb-4 shadow-sm">
                        <i class="fa-solid fa-quote-left text-[10px] text-chaiGold block mb-1"></i>
                        <p class="font-handwritten text-base text-slate-650 dark:text-slate-300 pl-1 leading-relaxed">
                            "${note}"
                        </p>
                    </div>
                </div>

                <!-- Footer: Price & Borrow Actions -->
                <div class="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <span class="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Fuel + wear estimate</span>
                        <span class="font-display font-extrabold text-lg text-slate-900 dark:text-white">₹${vehicle.price}<span class="text-xs font-normal text-slate-500">/${vehicle.rate}</span></span>
                    </div>
                    <div class="flex gap-2">
                        <button class="ask-borrow-btn border border-primaryIndigo/30 hover:bg-primaryIndigo/5 text-primaryIndigo dark:text-blue-400 text-xs font-bold py-2 px-3.5 rounded-xl transition-all" data-id="${vehicle._id}">
                            Ask Owner
                        </button>
                        <button class="borrow-btn bg-primaryIndigo hover:bg-blue-900 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md hover:shadow-lg transition-all" data-id="${vehicle._id}">
                            Borrow Now
                        </button>
                    </div>
                </div>
            `;
            
            vehicleGrid.appendChild(card);
        });
    };

    // Mapping destinations to allowed vehicle types
    const destinationToTypes = {
        'All': ['Scooty', 'Bike', 'Cycle', 'Car'],
        'Civil Lines': ['Scooty', 'Bike', 'Car'],
        'Station': ['Scooty', 'Car'],
        'Sangam': ['Scooty', 'Bike', 'Car'],
        'Airport': ['Car'],
        'Lecture Complex': ['Cycle'],
        'Hostel Run': ['Cycle'],
        'Late-Night Chai': ['Scooty', 'Bike']
    };

    // Category and Destination chips listeners
    const setupTabListeners = () => {
        const tabs = document.querySelectorAll('.vehicle-tab');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active state
                tabs.forEach(t => t.classList.remove('filter-chip-active'));
                tab.classList.add('filter-chip-active');

                const filterType = tab.dataset.filterType; // "destination" or "type"
                const filterValue = tab.dataset.value;     // e.g., "Civil Lines" or "Scooty"

                let filteredVehicles;

                if (filterType === 'destination') {
                    if (filterValue === 'All') {
                        filteredVehicles = allVehicles;
                    } else {
                        const allowedTypes = destinationToTypes[filterValue] || [];
                        filteredVehicles = allVehicles.filter(vehicle => allowedTypes.includes(vehicle.vehicleType));
                    }
                } else {
                    if (filterValue === 'All') {
                        filteredVehicles = allVehicles;
                    } else {
                        filteredVehicles = allVehicles.filter(vehicle => vehicle.vehicleType === filterValue);
                    }
                }

                renderVehicles(filteredVehicles);
            });
        });
    };

    // Modal elements and logic for List Vehicle
    const listModal = document.getElementById('list-vehicle-modal');
    const openListBtn = document.getElementById('list-vehicle-btn');
    const closeListBtn = listModal ? listModal.querySelector('.close-btn') : null;
    const postForm = document.getElementById('list-vehicle-form');

    const setupModalListeners = () => {
        if (openListBtn) {
            openListBtn.addEventListener('click', () => {
                listModal.classList.remove('hidden');
                listModal.classList.add('flex');
            });
        }

        if (closeListBtn) {
            closeListBtn.addEventListener('click', () => {
                listModal.classList.remove('flex');
                listModal.classList.add('hidden');
            });
        }

        if (listModal) {
            listModal.addEventListener('click', (e) => {
                if (e.target === listModal) {
                    listModal.classList.remove('flex');
                    listModal.classList.add('hidden');
                }
            });
        }
    };

    // Drag & Drop File Upload Logic
    const dragZone = document.getElementById('image-drag-zone');
    const fileInput = document.getElementById('image-file-input');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview');
    const removeImgBtn = document.getElementById('remove-image-btn');
    let uploadedImageBase64 = '';

    const resetDragUploadZone = () => {
        uploadedImageBase64 = '';
        if (fileInput) fileInput.value = '';
        if (previewContainer) previewContainer.classList.add('hidden');
        if (previewImg) previewImg.src = '';
        if (dragZone) {
            const helpers = dragZone.querySelectorAll('p, i');
            helpers.forEach(h => {
                if (h.id !== 'image-preview-container') h.classList.remove('hidden');
            });
        }
    };

    if (dragZone && fileInput) {
        dragZone.addEventListener('click', (e) => {
            if (e.target !== removeImgBtn && !removeImgBtn?.contains(e.target)) {
                fileInput.click();
            }
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dragZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragZone.classList.add('border-primaryIndigo', 'bg-blue-50/10');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dragZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragZone.classList.remove('border-primaryIndigo', 'bg-blue-50/10');
            }, false);
        });

        dragZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                handleImageFile(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleImageFile(files[0]);
            }
        });
    }

    const handleImageFile = (file) => {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImageBase64 = e.target.result;
            if (previewImg && previewContainer) {
                previewImg.src = uploadedImageBase64;
                previewContainer.classList.remove('hidden');
                const helpers = dragZone.querySelectorAll('p, i');
                helpers.forEach(h => {
                    if (h.id !== 'image-preview-container') h.classList.add('hidden');
                });
            }
        };
        reader.readAsDataURL(file);
    };

    if (removeImgBtn) {
        removeImgBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetDragUploadZone();
        });
    }

    // Submit new vehicle
    const handlePostVehicle = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        const formData = new FormData(postForm);
        
        const newVehicle = {
            title: formData.get('title'),
            vehicleType: formData.get('vehicleType'),
            price: parseInt(formData.get('price')),
            rate: formData.get('rate'),
            parkingLocation: formData.get('parkingLocation') || 'Inside Campus',
            note: formData.get('note') || 'Please return safely! 🛵',
            image: uploadedImageBase64 || '',
            specs: formData.get('specs').split(',').map(s => s.trim()).filter(s => s.length > 0)
        };

        try {
            const res = await fetch('/api/vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newVehicle),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to list wheels.');
            }

            alert('Wheels shared on campus successfully!');
            listModal.classList.remove('flex');
            listModal.classList.add('hidden');
            postForm.reset(); 
            resetDragUploadZone();
            loadVehicles();
        } catch (error) {
            console.error('Error posting wheels:', error);
            alert(`Error: ${error.message}`);
        }
    };

    // Borrow Request Modal Logic
    const borrowModal = document.getElementById('borrow-request-modal');
    const closeBorrowBtn = borrowModal ? borrowModal.querySelector('.close-borrow-btn') : null;

    const setupBorrowModalListeners = () => {
        if (closeBorrowBtn) {
            closeBorrowBtn.addEventListener('click', () => {
                borrowModal.classList.remove('flex');
                borrowModal.classList.add('hidden');
            });
        }
        if (borrowModal) {
            borrowModal.addEventListener('click', (e) => {
                if (e.target === borrowModal) {
                    borrowModal.classList.remove('flex');
                    borrowModal.classList.add('hidden');
                }
            });
        }
    };

    const openBorrowModal = (vehicle) => {
        const ownerName = vehicle.user ? vehicle.user.name : 'IIITA Mate';
        const ownerMeta = vehicle.user ? `${vehicle.user.department || 'B.Tech'} (${vehicle.user.year || 'Student'})` : 'IIITA Member';
        const ownerEmail = vehicle.user ? vehicle.user.email : '';
        
        // Avatar initials
        const initials = getInitials(ownerName);
        document.getElementById('borrow-avatar').textContent = initials;
        document.getElementById('borrow-owner-name').textContent = ownerName;
        document.getElementById('borrow-owner-meta').textContent = ownerMeta;
        document.getElementById('borrow-vehicle-details').textContent = `${vehicle.title} (${vehicle.vehicleType}) • ₹${vehicle.price}/${vehicle.rate}`;

        const draftText = `Hi ${ownerName},\n\nI saw your ${vehicle.title} shared on UniLink. I'd love to borrow it for a quick run. Let me know if your wheels are available and when/where we could meet to grab the keys!\n\nThanks,\n[My Name]`;
        const emailBody = document.getElementById('borrow-email-body');
        emailBody.value = draftText;

        const mailLink = document.getElementById('borrow-mail-link');
        mailLink.href = `mailto:${ownerEmail}?subject=UniLink: Borrowing your ${encodeURIComponent(vehicle.title)}&body=${encodeURIComponent(draftText)}`;

        // Copy Draft Action
        const copyBtn = document.getElementById('copy-draft-btn');
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(draftText);
            copyBtn.textContent = 'Copied! ✓';
            setTimeout(() => { copyBtn.textContent = 'Copy Draft'; }, 2000);
        };

        borrowModal.classList.remove('hidden');
        borrowModal.classList.add('flex');
    };

    // Event delegation on grid container for borrow button clicks
    if (vehicleGrid) {
        vehicleGrid.addEventListener('click', (e) => {
            const borrowBtn = e.target.closest('.borrow-btn');
            const askBorrowBtn = e.target.closest('.ask-borrow-btn');
            if (borrowBtn || askBorrowBtn) {
                const id = (borrowBtn || askBorrowBtn).dataset.id;
                const vehicle = allVehicles.find(v => v._id === id);
                if (vehicle) {
                    openBorrowModal(vehicle);
                }
            }
        });
    }

    // Initialize all components
    if (postForm) {
        postForm.addEventListener('submit', handlePostVehicle);
    }
    loadVehicles();
    setupModalListeners();
    setupBorrowModalListeners();
});
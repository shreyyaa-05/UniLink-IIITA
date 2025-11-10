document.addEventListener('DOMContentLoaded', () => {
    const vehicleGrid = document.getElementById('vehicle-grid-container');
    let allVehicles = []; // <-- NEW: This will store our master list

    // Function to fetch and render vehicles
    const loadVehicles = async () => {
        if (!vehicleGrid) return; // Safety check

        try {
            const res = await fetch('/api/vehicles');
            if (!res.ok) {
                throw new Error('Failed to fetch vehicles');
            }
            allVehicles = await res.json(); // <-- NEW: Store in the master list
            
            renderVehicles(allVehicles); // Render all vehicles by default
            setupTabListeners(); // <-- NEW: Call our new function

        } catch (error) {
            console.error(error);
            vehicleGrid.innerHTML = '<p class="error-message">Could not load vehicles. Please try again later.</p>';
        }
    };

    // Function to render the vehicle cards
    // Function to render the vehicle cards
const renderVehicles = (vehicles) => {
    // Clear any existing content
    vehicleGrid.innerHTML = '';

    if (vehicles.length === 0) {
        vehicleGrid.innerHTML = '<p>No vehicles found for this category.</p>';
        return;
    }

    vehicles.forEach(vehicle => {
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        
        const ownerName = vehicle.user ? vehicle.user.name : 'Unknown User';
        const ownerDetails = vehicle.user ? (vehicle.user.year || vehicle.user.department) : 'IIIT-A Member';
        
        const specsHtml = vehicle.specs.map(spec => `<span>${spec}</span>`).join('\n');

        // Get the image URL, or use a default placeholder if it's missing
        const imageUrl = vehicle.image || '/images/vehicle_placeholder.png';

        card.innerHTML = `
            <div class="vehicle-image">
                <img src="${imageUrl}" alt="${vehicle.title}">
                <div class="vehicle-badge" style="text-transform: capitalize;">${vehicle.status}</div>
            </div>
            <div class="vehicle-details">
                <h3 class="vehicle-title">${vehicle.title}</h3>
                <div class="vehicle-owner">
                    <i class="fas fa-user"></i>
                    <span>${ownerName} (${ownerDetails})</span>
                </div>
                <div class="vehicle-specs">
                    ${specsHtml}
                </div>
                <div class="vehicle-price">₹${vehicle.price}/${vehicle.rate}</div>
                <div class="vehicle-actions">
                    <button class="btn btn-outline">Contact via Mail</button>
                    <button class="btn btn-primary"><i class="far fa-heart"></i></button>
                </div>
            </div>
        `;
        
        vehicleGrid.appendChild(card);
    });
};

    // <-- NEW: This function handles all the tab-clicking logic -->
    // <-- NEW: This function handles all the tab-clicking logic -->
const setupTabListeners = () => {
    const tabs = document.querySelectorAll('.vehicle-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 1. Update the 'active' class
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // 2. Get the category from the data-type attribute
            const category = tab.dataset.type; // "All", "Bike", "Scooty", etc.

            let filteredVehicles;

            // 3. Filter the master list
            if (category === 'All') {
                filteredVehicles = allVehicles;
            } else {
                // <-- THIS WAS THE FIX -->
                // It's now 'allVehicles', not 'allVehicans'
                filteredVehicles = allVehicles.filter(vehicle => vehicle.vehicleType === category);
            }

            // 4. Re-render the grid with the filtered list
            renderVehicles(filteredVehicles);
        });
    });
};
    // --- NEW: Modal and Posting Logic ---

const modal = document.getElementById('list-vehicle-modal');
const openModalBtn = document.getElementById('list-vehicle-btn');
const closeBtn = modal ? modal.querySelector('.close-btn') : null;
const postForm = document.getElementById('list-vehicle-form');

// Function to handle opening and closing the modal
const setupModalListeners = () => {
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Close when clicking outside the modal
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

// Function to handle the form submission
const handlePostVehicle = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const formData = new FormData(postForm);
    
    // Convert FormData to a standard JSON object
    const newVehicle = {
        title: formData.get('title'),
        vehicleType: formData.get('vehicleType'),
        price: parseInt(formData.get('price')),
        rate: formData.get('rate'),
        description: formData.get('description'),
        image: formData.get('image') || '/images/vehicle_placeholder.png',
        // Specs need special handling: turn the comma-separated string into an array
        specs: formData.get('specs').split(',').map(s => s.trim()).filter(s => s.length > 0)
    };

    try {
        const res = await fetch('/api/vehicles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Assuming authentication is handled via cookies/session, otherwise add 'Authorization' header
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newVehicle),
        });

        if (!res.ok) {
            // Throw an error with the response message if available
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to list vehicle.');
        }

        // Successfully posted!
        alert('Vehicle listed successfully!');
        
        // 1. Close the modal
        modal.style.display = 'none';
        
        // 2. Clear the form
        postForm.reset(); 

        // 3. Re-load the list to show the new vehicle (it will appear in the 'All' tab)
        loadVehicles();

    } catch (error) {
        console.error('Error posting vehicle:', error);
        alert(`Error: ${error.message}. Please check your input.`);
    }
};


// Add listeners to the form
// Add listeners to the form
// Add listeners to the form
if (postForm) {
    postForm.addEventListener('submit', handlePostVehicle);
}

// Final Initialization Calls: These run inside the outer DOMContentLoaded block (from Line 1)
loadVehicles();
setupModalListeners(); // This line attaches the listener to your button

}); // <--- THIS IS THE CRITICAL MISSING CLOSING BRACE/PARENTHESES.

// The file MUST end exactly here.

// The file MUST end here. If the entire carrental.js is wrapped in a DOMContentLoaded
// block from the beginning, remove the block above and just use:
// loadVehicles();
// setupModalListeners();
// ... and ensure the file ends with the closing '});' for the wrapper.
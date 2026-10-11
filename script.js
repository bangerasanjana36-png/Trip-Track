

const TRIPS_KEY = "tripTrackTrips";
const EXPENSES_KEY = "tripTrackExpenses";

let trips = loadData(TRIPS_KEY);
let expenses = loadData(EXPENSES_KEY);

function loadData(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function saveData() {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatMoney(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

function formatDate(dateString) {
    if (!dateString) return "Not set";

    const date = new Date(dateString + "T00:00:00");

    if (Number.isNaN(date.getTime())) return "Not set";

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function todayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Dashboard statistics
function updateDashboard() {
    document.getElementById("totalTrips").textContent = trips.length;

    const upcoming = trips.filter(trip =>
        trip.endDate >= todayString()
    ).length;

    document.getElementById("upcomingTrips").textContent = upcoming;

    const total = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
    );

    document.getElementById("totalExpenses").textContent =
        formatMoney(total);
}

// Add a new trip
document.getElementById("tripForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("tripName").value.trim();
    const destination = document.getElementById("destination").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const budget = Number(document.getElementById("tripBudget").value);
    const type = document.getElementById("tripType").value;

    if (!name || !destination || !startDate || !endDate) {
        alert("Please fill in all trip details.");
        return;
    }

    if (endDate < startDate) {
        alert("The end date cannot be before the start date.");
        return;
    }

    if (!Number.isFinite(budget) || budget < 0) {
        alert("Please enter a valid trip budget.");
        return;
    }

    const trip = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        name,
        destination,
        startDate,
        endDate,
        budget,
        type
    };

    trips.push(trip);
    saveData();
    renderApp();

    this.reset();

    alert("Your trip has been saved successfully!");
});

// Display trips
function renderTrips() {
    const tripList = document.getElementById("tripList");

    if (trips.length === 0) {
        tripList.innerHTML = `
            <div class="empty-state">
                <span>🧭</span>
                <h3>Your adventures start here!</h3>
                <p>Add your first trip using the form above.</p>
            </div>
        `;
        return;
    }

    tripList.innerHTML = trips.map(trip => {
        const isPast = trip.endDate < todayString();
        const status = isPast ? "Completed" : "Upcoming";
        const statusClass = isPast ? "past" : "";

        const emojiMap = {
            "Vacation": "🏖️",
            "Adventure": "⛰️",
            "Business": "💼",
            "Family": "👨‍👩‍👧‍👦",
            "Other": "🌍"
        };

        const tripExpenses = expenses
            .filter(expense => expense.tripId === trip.id)
            .reduce((sum, expense) => sum + Number(expense.amount), 0);

        return `
            <article class="trip-card">
                <div class="trip-banner">
                    <span class="destination-emoji">
                        ${emojiMap[trip.type] || "🌍"}
                    </span>
                    <span class="trip-type">
                        ${escapeHTML(trip.type)}
                    </span>
                </div>

                <div class="trip-details">
                    <h3>${escapeHTML(trip.name)}</h3>
                    <p class="trip-destination">
                        📍 ${escapeHTML(trip.destination)}
                    </p>

                    <div class="trip-meta">
                        <span>🗓️ ${formatDate(trip.startDate)}</span>
                        <span>→ ${formatDate(trip.endDate)}</span>
                    </div>

                    <div class="trip-footer">
                        <div>
                            <div class="trip-budget">
                                ${formatMoney(trip.budget)}
                            </div>
                            <small>Budget</small>
                        </div>
                        <span class="status-badge ${statusClass}">
                            ${status}
                        </span>
                    </div>

                    <div class="trip-meta">
                        <span>💸 Spent: ${formatMoney(tripExpenses)}</span>
                        <span>💰 Left: ${formatMoney(trip.budget - tripExpenses)}</span>
                    </div>

                    <div class="trip-footer">
                        <span></span>
                        <button class="delete-button"
                            data-delete-trip="${escapeHTML(trip.id)}">
                            Delete Trip
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

// Update the trip dropdown in the expense form
function renderTripOptions() {
    const select = document.getElementById("expenseTrip");
    const previousValue = select.value;

    if (trips.length === 0) {
        select.innerHTML = `<option value="">Add a trip first</option>`;
        return;
    }

    select.innerHTML = `
        <option value="">Select a trip</option>
        ${trips.map(trip => `
            <option value="${escapeHTML(trip.id)}">
                ${escapeHTML(trip.name)} — ${escapeHTML(trip.destination)}
            </option>
        `).join("")}
    `;

    if (trips.some(trip => trip.id === previousValue)) {
        select.value = previousValue;
    }
}

// Add an expense
document.getElementById("expenseForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const tripId = document.getElementById("expenseTrip").value;
    const title = document.getElementById("expenseTitle").value.trim();
    const amount = Number(document.getElementById("expenseAmount").value);
    const category = document.getElementById("expenseCategory").value;

    if (!trips.some(trip => trip.id === tripId)) {
        alert("Please select a valid trip first.");
        return;
    }

    if (!title || !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a description and a valid amount.");
        return;
    }

    expenses.push({
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        tripId,
        title,
        amount,
        category
    });

    saveData();
    renderApp();
    this.reset();

    alert("Expense added successfully!");
});

// Display expenses
function renderExpenses() {
    const expenseList = document.getElementById("expenseList");

    if (expenses.length === 0) {
        expenseList.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty">
                    No expenses added yet.
                </td>
            </tr>
        `;
        return;
    }

    expenseList.innerHTML = expenses.map(expense => {
        const trip = trips.find(item => item.id === expense.tripId);

        return `
            <tr>
                <td>${escapeHTML(trip ? trip.name : "Unknown trip")}</td>
                <td>${escapeHTML(expense.title)}</td>
                <td>${escapeHTML(expense.category)}</td>
                <td>${formatMoney(expense.amount)}</td>
                <td>
                    <button class="delete-button"
                        data-delete-expense="${escapeHTML(expense.id)}">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

// Handle delete buttons
document.addEventListener("click", function(event) {
    const tripButton = event.target.closest("[data-delete-trip]");
    const expenseButton = event.target.closest("[data-delete-expense]");

    if (tripButton) {
        const tripId = tripButton.dataset.deleteTrip;
        const trip = trips.find(item => item.id === tripId);

        if (!trip) return;

        const confirmed = confirm(
            `Delete "${trip.name}" and all its recorded expenses?`
        );

        if (confirmed) {
            trips = trips.filter(item => item.id !== tripId);
            expenses = expenses.filter(item => item.tripId !== tripId);

            saveData();
            renderApp();
        }
    }

    if (expenseButton) {
        const expenseId = expenseButton.dataset.deleteExpense;

        if (confirm("Are you sure you want to delete this expense?")) {
            expenses = expenses.filter(item => item.id !== expenseId);

            saveData();
            renderApp();
        }
    }
});

// Refresh all sections
function renderApp() {
    updateDashboard();
    renderTrips();
    renderTripOptions();
    renderExpenses();
}

// Initial setup
renderApp();

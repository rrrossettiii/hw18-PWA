const indexedDB =
	window.indexedDB ||
	window.mozIndexedDB ||
	window.webkitIndexedDB ||
	window.msIndexedDB ||
	window.shimIndexedDB;

let db;
const request = indexedDB.open("transactions", 1);

// Pending;
// =============: - sets up "pending" store;
request.onupgradeneeded = ({ target }) => {
	let db = target.result;
	db.createObjectStore("pending", { autoIncrement: true });
};

// OnLine?
// =============: - once app is online, read db;
request.onsuccess = ({ target }) => {
	db = target.result;

	if (navigator.onLine) {
		checkDatabase();
	}
};

// Error;
// =============: - Oof!
request.onerror = function (event) {
	console.log("Oof! " + event.target.errorCode);
};

// Save;
// =============: - creates pending transaction; saves data to "pending" store;
function saveRecord(record) {
	const transaction = db.transaction(["pending"], "readwrite");
	const store = transaction.objectStore("pending");
	store.add(record);
}

// Submit;
// =============: opens pending transactions; submits data from store to db;
function checkDatabase() {
	const transaction = db.transaction(["pending"], "readwrite");
	const store = transaction.objectStore("pending");
	const getAll = store.getAll();

	getAll.onsuccess = function () {
		if (getAll.result.length > 0) {
			fetch("/api/transaction/bulk", {
				method: "POST",
				body: JSON.stringify(getAll.result),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json"
				}
			})
				.then(response => {
					return response.json();
				})
				.then(() => {
					// - clear "pending" store;
					const transaction = db.transaction(["pending"], "readwrite");
					const store = transaction.objectStore("pending");
					store.clear();
				});
		}
	};
}

// listen for app "online";
window.addEventListener("online", checkDatabase);

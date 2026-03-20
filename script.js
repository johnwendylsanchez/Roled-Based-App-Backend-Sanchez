// ==============================
// Phase 2: Client- Side Routing
// ==============================
let currentUser = null;

function navigateTo(hash){
    window.location.hash=hash;
}
function handleRouting(){
    let hash = window.location.hash || "#/";

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    switch(hash)
    {
        case '#/login':
            document.getElementById('login-page').classList.add('active');
            break;
        case '#/register':
            document.getElementById('register-page').classList.add('active');
            break;
        case '#/verify-email':
            document.getElementById("verify-email-page").classList.add("active");
            break;
        case '#/profile':
            document.getElementById('profile-page').classList.add('active');
            break;
        case '#/employees':
            document.getElementById('employees-page').classList.add('active');
            break;
        case '#/departments':
            document.getElementById('departments-page').classList.add('active');
            break;
        case '#/accounts':
            document.getElementById('accounts-page').classList.add('active');
            break;    
        case '#/requests':
            document.getElementById('requests-page').classList.add('active');
            break;
        case '#/admin-dashboard':
            document.getElementById('admin-dashboard-page').classList.add('active');
            break;
        default:
            document.getElementById('home-page').classList.add('active');
    }


    // Redirects non-user away
    const protectedRoutes = ["#/profile", "#/requests"];
    const adminRoutes = ["#/employees", "#/accounts", "#/departments", "#/admin-dashboard"];
    
    if (!currentUser && protectedRoutes.includes(hash))
    {
        showToast("Please Login to access this page.", "warning");
        navigateTo("#/login");
        return;
    }

    if(!currentUser && adminRoutes.includes(hash))
    {
        showToast("Access denied. Admins only.", "danger");
        navigateTo("#/login");
        return;
    }

    if (currentUser && currentUser.role.toLowerCase() !== "admin" && adminRoutes.includes(hash)) {
        showToast("Access denied. Admins only.", "danger");
        navigateTo("#/");
    }

    const routes = 
    {
        "#/verify-email": renderVerifyEmail,
        "#/profile": renderProfile,
        "#/accounts": renderAccountList,
        "#/departments": renderDepartmentTable,
        "#/employees": () => {
        getDepartmentOptions();
        renderEmployeesTable();
        },
        "#/requests": renderRequestsTable,
        "#/admin-dashboard": loadAdminDashBoard
    }

    if(routes[hash])
    {
        routes[hash]();
    }
}


// ==============================
// Phase 3: Authentication System
// ==============================
// =================
//  REGISTER FORM
// =================
document.getElementById("register-form").addEventListener("submit", async function (e){
    e.preventDefault();

    const firstName = document.getElementById("reg-firstname").value.trim();
    const lastName = document.getElementById("reg-lastname").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const password = document.getElementById("reg-password").value.trim();

    if(!firstName || !lastName || !email || !password)
    {
        alert("Please complete all fields.");
        return;
    }

    if(password.length <6)
    {
        alert("Password must be at least 6 characters.");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/api/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ firstName, lastName, email, password})
        });

        const data = await res.json();

        if(res.ok){
            showToast("Registration successful! Please verify email.", "success");

            // Store email temporarily
            localStorage.setItem("unverified_email", email);

            navigateTo("#/verify-email");
        } else {
            alert("Registration failed: " + data.error);
        }
    } catch(err) {
        alert("Network error during registration.");
    }
});

// =====================
//  EMAIL VERIFICATION
// =====================
function renderVerifyEmail()
{
    const email = localStorage.getItem("unverified_email");
    document.getElementById("verify-msg").textContent = "✅ Verification sent to " + email;
}

document.getElementById("verify-btn").addEventListener("click", function(){
    showToast("Email verified successfully! You can now log in.", "success");
    localStorage.removeItem("unverified_email");
    navigateTo("#/login");
});


// ===================
//  PROFILE PAGE
// ===================
function renderProfile()
{
    document.getElementById("profile-name").innerText = currentUser.firstName + " " + currentUser.lastName;
    document.getElementById("profile-email").innerText = currentUser.email;
    document.getElementById("profile-role").innerText = currentUser.role;

    document.getElementById("edit-profile").onclick = function(){
        alert("Edit profile coming soon.");
    };
}

// ==================
//   LOGIN FORM
// ==================
async function login(email, password) {
    try {
        const res = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, password})
        });

        const data = await res.json();

        if(res.ok) {
            // Save token in memory (or sessionStorage for page refresh)
            sessionStorage.setItem('authToken', data.token);
            setAuthState(true, data.user);
            currentUser = data.user;
            updateNavbarUser();
            showToast("Successfully logged in.", "info");
            navigateTo('#/');
        } else {
            alert('Login failed: ' + data.error);
        }
    } catch(err) {
        alert('Network error');
    }
};

document.getElementById("login-form").addEventListener("submit", async function(e){
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value.trim();

    await login(email, password);
});

// =================================
//  Authentication State Management
// =================================

function getAuthHeader() {
    const token = sessionStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}`} : {};
}

async function loadAdminDashBoard() {
    const res = await fetch ('http://localhost:3000/api/admin/dashboard', {
        headers: getAuthHeader()
    });
    if(res.ok) {
        const data = await res.json();
        document.getElementById('content').innerText = data.message;
    } else {
        document.getElementById('content').innerText = 'Access denied!';
    }
}

function setAuthState(isAuth, user = null){
    currentUser = isAuth ? user : null;

    if(isAuth)
    {
        document.body.classList.add("authenticated");
        document.body.classList.remove("not-authenticated");
        document.body.classList.remove("is-admin");
        if(isAuth && user.role === "admin")
        {
            document.body.classList.add("is-admin");
        }
    }
    else
    {
        document.body.classList.remove("authenticated", "is-admin");
        document.body.classList.add("not-authenticated");
    }
}



// ================
//     Logout
// ================

document.querySelector("a[href='#/logout']").addEventListener("click", function(){
        sessionStorage.removeItem("authToken");
        setAuthState(false);
        showToast("Logged out successfully!", "info");
        navigateTo("#/");
    });

// =============================================
//  Phase 4: Data Persistence with localStorage
// =============================================
const STORAGE_KEY = "ipt_demo_v1";

function loadFromStorage() {
    const data = localStorage.getItem("db");
    try
    {
        if(data)
        {
            window.db = JSON.parse(data);
            return;
        }
    }
    catch (e)
    {
        console.warn("Storage invalid, resetting...");
    }

    window.db = {
        departments: JSON.parse(localStorage.getItem("db_departments")) ||
        [
            {id: 1, name: "Engineering", description: ""},
            {id: 2, name: "HR", description: ""},
        ],
        requests: JSON.parse(localStorage.getItem("db_requests")) || [],
        employees: JSON.parse(localStorage.getItem("db_employees")) || []
    };
}


// ===============================
//  Phase 6: Admin Features (CRUD)
// ===============================
function renderAccountList()
{
    const tbody = document.querySelector("#accounts-table tbody");
    tbody.innerHTML = "";

      if(window.db.accounts.length === 0)
    {
        tbody.innerHTML = 
        `<tr>
            <td colspan="5" class="text-center text-muted">
            No accounts yet. Click <b>Add Account</b> to create one.
            </td>
        </tr>`;
        return;
    }

    window.db.accounts.forEach((acc, i) => {

        tbody.innerHTML += `
            <tr>
                <td>${acc.firstName} ${acc.lastName}</td>
                <td>${acc.email}</td>
                <td>${acc.role}</td>
                <td>${acc.verified ? "✔" : "—"}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick = "editAccount(${i})">Edit</button>
                    <button class="btn btn-sm btn-outline-warning" onclick = "resetPassword(${i})">Reset Password</button>
                    <button class="btn btn-sm btn-outline-danger" onclick = "deleteAccount(${i})">Delete</button>
                </td> 
            </tr>
        `;
    });
}

document.getElementById("add-account-btn").addEventListener("click", () => {
    showAccountForm();
});


function showAccountForm(mode = "add", acc = null, index = null)
{
    window.editingAccount = mode === "edit" ? index : null;

    const form = document.getElementById("account-form");

    const firstInput = document.getElementById("firstname");
    const lastInput = document.getElementById("lastname");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const roleSelect = document.getElementById("role"); 
    const verifiedCheckbox = document.getElementById("checkbox");

    if (mode === "add")
    {
        firstInput.value = "";
        lastInput.value = "";
        emailInput.value = "";
        passwordInput.value = "";
        roleSelect.value = "user";
        verifiedCheckbox.checked = false;
    }

    if (mode === "edit" && acc)
    {
        firstInput.value = acc.firstName;
        lastInput.value = acc.lastName;
        emailInput.value = acc.email;
        passwordInput.value = "";
        roleSelect.value = acc.role.toLowerCase();
        verifiedCheckbox.checked = acc.verified;
    }

    form.style.display = "block";
}

document.querySelector("#accounts-page .btn-primary").addEventListener("click", saveAccount);


function saveAccount()
{
    const first = document.getElementById("firstname").value.trim();
    const last = document.getElementById("lastname").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;
    const verified = document.getElementById("checkbox").checked;

    if (!first || !last || !email || (password && password.length < 6))
    {
        alert("Complete all fields");
        return;
    }

    if(window.editingAccount === null)
    {
        showToast("Account created successfully!", "success");
    }
    else
    {
        showToast("Account updated successfully!", "success");
    }


    if(window.editingAccount === null)
    {
        window.db.accounts.push({
            firstName: first,
            lastName: last,
            email: email,
            password: password || "Password123!",
            verified: verified,
            role: role
        });
    } 
    else 
    {
        window.db.accounts[window.editingAccount] = {
            firstName: first,
            lastName: last,
            email: email,
            password: password ? password : window.db.accounts[window.editingAccount].password,
            verified: verified,
            role: role
        };
    }

    saveToStorage();
    renderAccountList();
    document.getElementById("account-form").style.display = "none";

}

function hideAccountForm()
{
    document.getElementById("account-form").style.display = "none";
}

function editAccount(index)
{
    const acc = window.db.accounts[index];
    showAccountForm("edit", acc, index);
}

function resetPassword(index)
{
    const newPW = prompt("Enter new password (min 6 chars):");
    if (!newPW || newPW.length < 6)
    {
        return alert("Invalid Password!");
    }

    window.db.accounts[index].password = newPW;
    saveToStorage();
    showToast("Password updated!", "success");
}

function deleteAccount(index)
{
    const acc = window.db.accounts[index];
    if(acc.email === currentUser.email)
    {
        alert("You cannot delete your own account,");
        return;
    }

    if(!confirm("Are you sure you want to delete this account?"))
        return;
    showToast("Account deleted successfully!", "success");


    window.db.accounts.splice(index, 1);
    saveToStorage();
    renderAccountList();
}


function renderDepartmentTable()
{
    const tbody = document.querySelector("#departments-table tbody");
    tbody.innerHTML = "";

    if(window.db.departments.length === 0)
    {
        tbody.innerHTML = 
        `<tr>
            <td colspan="5" class="text-center text-muted">
            No departments yet. Click <b>Add Department</b> to create one.
            </td>
        </tr>`;
        return;
    }

    window.db.departments.forEach((dept, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${dept.name}</td>
                <td>${dept.description}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editDepartment(${i})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteDepartment(${i})">Delete</button>
                </td>
            </tr>
        `;
    });

}

document.getElementById("add-department-btn").addEventListener("click", () =>{
editingDeptIndex = null;
document.getElementById("dept-form-title").textContent = "Add Department";

document.getElementById("dept-name").value = "";
document.getElementById("dept-desc").value = "";

document.getElementById("department-form").style.display = "block";
});

let editingDeptIndex = null;

function editDepartment(i)
{
    editingDeptIndex = i;
    const dept = window.db.departments[i];

    document.getElementById("dept-form-title").textContent = "Edit Department";

    document.getElementById("dept-name").value = dept.name;
    document.getElementById("dept-desc").value = dept.description;

    document.getElementById("department-form").style.display = "block";
}

document.getElementById("cancel-department-btn").addEventListener("click", () => {
    document.getElementById("department-form").style.display = "none";
    editingDeptIndex = null;
}); 

document.getElementById("save-department-btn").addEventListener("click", () => {
    const name = document.getElementById("dept-name").value.trim();
    const desc = document.getElementById("dept-desc").value.trim();

    if(!name)
    {
        alert("Department name is required.");
        return;
    }

    if(editingDeptIndex === null)
    {
        showToast("Department added successfully!", "success");
    }
    else
    {
        showToast("Department updated successfully!", "success");
    }

    if(editingDeptIndex === null)
    {
        window.db.departments.push({
            id: Date.now(),
            name,
            description: desc
        });
    }
    else
    {
        window.db.departments[editingDeptIndex].name = name;
        window.db.departments[editingDeptIndex].description = desc;
    }

    saveToStorage();
    renderDepartmentTable();
    getDepartmentOptions();

    document.getElementById("department-form").style.display = "none";
});

function deleteDepartment(i)
{
    if(!confirm("Are you sure you want to delete this department?"))
        return;
    showToast("Department deleted successfully!", "success");

    window.db.departments.splice(i, 1);
    saveToStorage();
    renderDepartmentTable();
    getDepartmentOptions();
}

function getDepartmentOptions()
{
    const select = document.getElementById("emp-department");
    if(!select)
        return;

    select.innerHTML = "";

    window.db.departments.forEach(dept => {
        const option = document.createElement("option");
        option.value = dept.id;
        option.textContent = dept.name;
        select.appendChild(option);
    });
}


function renderEmployeesTable()
{
    const tbody = document.querySelector(".employee-list-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    if(window.db.employees.length === 0)
    {
        tbody.innerHTML = 
        `<tr>
            <td colspan="5" class="text-center text-muted">
            No employees yet. Click <b>Add Employee</b> to create one.
            </td>
        </tr>`;
        return;
    }

    window.db.employees.forEach((emp, i) => {
        const dept = window.db.departments.find(d => d.id === emp.deptId);
    
        tbody.innerHTML += `
            <tr>
                <td>${emp.employeeId}</td>
                <td>${emp.name}
                <br>
                <small class="text-muted">${emp.userEmail}</small>
                </td>
                <td>${emp.position}</td>
                <td>${dept ? dept.name : "N/A"}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary"onclick="editEmployee(${i})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee(${i})">Delete</button>
                </td>
            </tr>
        `;
    });
}
document.getElementById("add-employee-btn").addEventListener("click", () => {
    editingEmpIndex = null;
    document.getElementById("emp-form-title").textContent = "Add Employee";
    document.getElementById("emp-save-btn").textContent = "Save Employee";
    document.getElementById("emp-cancel-btn").onclick = function() {
        document.getElementById("employee-form").style.display = "none";
        document.getElementById("emp-save-btn").onclick = addEmployee;
    } 

    document.getElementById("emp-name").value = "";
    document.getElementById("emp-email").value = "";
    document.getElementById("emp-position").selectedIndex = 0;
    document.getElementById("emp-department").value = "";
    document.getElementById("hire-date").value = "";

    getDepartmentOptions();
    document.getElementById("employee-form").style.display = "block";
    document.getElementById("emp-save-btn").onclick = addEmployee;
});


function addEmployee()
{
    const name = document.getElementById("emp-name").value.trim();
    const email = document.getElementById("emp-email").value.trim().toLowerCase();
    const position = document.getElementById("emp-position").value.trim();
    const department = Number(document.getElementById("emp-department").value);
    const hireDate = document.getElementById("hire-date").value;
    const id = "EMP-" + (window.db.employees.length + 1).toString().padStart(4, "0");


    if(!name || !email || !position || !department || !hireDate)
    {
        alert("Please fill in all fields.");
        return;
    }
    showToast("Employee added successfully!", "success");

    window.db.employees.push({
        employeeId: id,
        name,
        userEmail: email,
        position,
        deptId: department,
        hireDate
    });

    saveToStorage();
    renderEmployeesTable();
    document.getElementById("employee-form").style.display = "none";
}

let editingEmpIndex = null;

function editEmployee(i)
{
    editingEmpIndex = i;
    const emp = window.db.employees[i];

    getDepartmentOptions();

    document.getElementById("emp-form-title").textContent = "Edit Employee";
    document.getElementById("emp-save-btn").textContent = "Update Employee";

    document.getElementById("emp-id").value = "Auto Generated";
    document.getElementById("emp-name").value = emp.name;
    document.getElementById("emp-email").value = emp.userEmail;
    document.getElementById("emp-position").value = emp.position;
    document.getElementById("emp-department").value = emp.deptId;
    document.getElementById("hire-date").value = emp.hireDate;

    document.getElementById("employee-form").style.display = "block";
    document.getElementById("emp-save-btn").onclick = updateEmployee;
}

function updateEmployee()
{
    const emp = window.db.employees[editingEmpIndex];

    emp.name = document.getElementById("emp-name").value.trim();
    emp.userEmail = document.getElementById("emp-email").value.trim().toLowerCase();
    emp.position = document.getElementById("emp-position").value.trim();
    emp.deptId = Number(document.getElementById("emp-department").value);
    emp.hireDate = document.getElementById("hire-date").value;

    saveToStorage();
    showToast("Employee updated successfully!", "success");
    renderEmployeesTable();

    document.getElementById("employee-form").style.display = "none";
    document.getElementById("emp-save-btn").onclick = addEmployee;
}

function deleteEmployee(i)
{
    if(!confirm("Are you sure you want to delete this employee?"))
        return;
    showToast("Employee deleted successfully!", "success");

    window.db.employees.splice(i, 1);
    saveToStorage();
    renderEmployeesTable();
}


// ===============================
//      Phase 7: User Requests
// ===============================
function renderRequestsTable()
{
    console.log("Current user:", currentUser);
    console.log("All requests:", window.db.requests);
    const tbody = document.querySelector("#requests-table tbody");
    tbody.innerHTML = "";

    if(!currentUser) return;

    let list = [];

    if(currentUser && currentUser.role.toLowerCase() === "admin")
    {
        document.querySelector("#requests-page h1").textContent = "All Requests";
        list = window.db.requests;
    }
    else
    {
        document.querySelector("#requests-page h1").textContent = "My Requests";
        list = window.db.requests.filter(r => r.userEmail === currentUser.email);
    }

    if(list.length === 0)
    {
        tbody.innerHTML = 
        `<tr>
            <td colspan="6" class="text-center text-muted">
            No requests found. Click <b>New Request</b> to create one.
            </td>
        </tr>`;
        return;
    }

    list.forEach((req) => {
        const realIndex = window.db.requests.indexOf(req);
        const items = (req.items || [])
            .map(i => `• ${i.qty} x ${i.name}`)
            .join("<br>") || "—";

        let statusBadge = "";

        if(req.status === "Approved")
            statusBadge = `<span class="badge bg-success">Approved</span>`;
        else if(req.status === "Rejected")
            statusBadge = `<span class="badge bg-danger">Rejected</span>`;

        else
            statusBadge = `<span class="badge bg-warning text-dark">Pending</span>`;

        
        let actionButtons = "";

        if(currentUser && currentUser.role.toLowerCase() === "admin")
        {
            if(req.status === "Pending")
            {
                actionButtons = `
                    <button class="btn btn-sm btn-outline-success" onclick="approveRequest(${realIndex})">Approve</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="rejectRequest(${realIndex})">Reject</button>
                `;
            }
            else
            {
                actionButtons = "Processed";
            }
        }
        else if(req.userEmail === currentUser.email)
        {
            actionButtons = `
                <button class="btn btn-sm btn-outline-danger" onclick="deleteRequest(${realIndex})">Delete</button>
            `;
        }
        else
        {
            actionButtons = "";
        }

            tbody.innerHTML += `
                <tr>
                    <td>REQ-${(realIndex + 1).toString().padStart(4, "0")}</td>
                    <td>${new Date(req.dateFiled).toISOString().split("T")[0]}</td>
                    <td>${req.userEmail}</td>
                    <td>${items}</td>
                    <td>${statusBadge}</td>
                    <td>${actionButtons}</td>
                </tr>
            `;
    });
}

document.addEventListener("click", function(e){

    if(e.target.id === "submit-request-btn")
    {

        const type = document.getElementById("req-type").value.trim();
        const itemRows = document.querySelectorAll(".item-row");

        const items = [];

        itemRows.forEach(row => {

            const name = row.querySelector(".req-item-name").value.trim();
            const qty = Number(row.querySelector(".req-qty").value);

            if(name && qty > 0)
            {
                items.push({
                    name: name,
                    qty: qty
                });
            }

        });

        if(!type || items.length === 0)
        {
            alert("Please add at least one item.");
            return;
        }

        window.db.requests.push({
            type,
            items,
            userEmail: currentUser.email,
            status: "Pending",
            dateFiled: new Date().toISOString()
        });

        saveToStorage();
        renderRequestsTable();

        showToast("Request submitted successfully!", "success");

        const modal = bootstrap.Modal.getInstance(document.getElementById("req-form"));
        modal.hide();

        document.getElementById("req-type").value = "";
    }

});

function approveRequest(i)
{
    if (!confirm("Are you sure you want to approve this request?"))
        return;

    window.db.requests[i].status = "Approved";

    showToast("Request approved successfully.", "success");
    saveToStorage();
    renderRequestsTable();
}

function rejectRequest(i)
{
    if(!confirm("Are you sure you want to reject this request?"))
        return;

    window.db.requests[i].status = "Rejected";
    saveToStorage();
    renderRequestsTable();
    showToast("Request rejected!", "danger");
}

function deleteRequest(i)
{
    if(!confirm("Are you sure you want to delete this request?"))
        return;

    window.db.requests.splice(i, 1);
    saveToStorage();
    renderRequestsTable();
    showToast("Request deleted successfully!", "success");
}

document.addEventListener("click", function(e){
    if(e.target.id === "add-item-btn")
    {

        const container = document.getElementById("request-items");

        const row = document.createElement("div");
        row.className = "d-flex gap-2 mb-2 item-row";

        row.innerHTML = `
            <input type="text" class="form-control req-item-name" placeholder="Item name">
            <input type="number" class="form-control req-qty" min="1" placeholder="Qty" value="1">
            <button type="button" class="btn btn-outline-danger remove-item">×</button>
        `;

        container.appendChild(row);
        showToast("Item added!", "info");
    }
});

document.addEventListener("click", function(e){

    if(e.target.classList.contains("remove-item"))
    {
        e.target.parentElement.remove();
        showToast("Item removed!", "warning");
    }

});

function showToast(message, type = "info")
{
    const toast = document.createElement("div");

    toast.className = `alert alert-${type}`;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.zIndex = 9999;
    
    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function saveToStorage()
{
    localStorage.setItem("db", JSON.stringify(window.db));
}

function restoreAuthSession()
{
    const token = sessionStorage.getItem("authToken");
    if (!token)
        return;
    
}

function updateNavbarUser()
{
    const dropdown = document.getElementById("nav-username")

    if(!dropdown || !currentUser)
        return;

    dropdown.textContent = currentUser.firstName;
}

loadFromStorage();
restoreAuthSession();

window.addEventListener("hashchange", handleRouting);

if(!window.location.hash) {
    window.location.hash = "#/";
}

handleRouting();
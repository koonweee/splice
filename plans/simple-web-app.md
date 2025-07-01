### **Web Application Plan: A Simple Splice Client**

This plan outlines a straightforward, single-page web application designed to provide a user-friendly interface for all the core features of the Splice API. The goal is to create a clear, step-by-step user journey, from creating an account to viewing financial transactions, using only basic HTML, CSS, and JavaScript.

---

### **Step 1: Creating Your User Account**

**What we are doing:** This is the first step for any new user. We will create a secure user account within the Splice service. In return, you will receive a personal API Key, which is like a password that will authorize your future actions in the app.

**User Interaction:**

1.  The user will be presented with a simple form asking for a **Username** and an optional **Email**.
2.  Upon clicking "Create User," the app will send this information to the `POST /users` endpoint.
3.  The web app will then display the **API Key** returned by the service. The user will be instructed to copy this key, as it will be needed for the next steps.

---

### **Step 2: Securely Storing Your Credentials**

**What we are doing:** To fetch financial data, Splice needs access to your bank's credentials. Instead of storing them directly, we use a secure vault like Bitwarden. This step involves providing your Bitwarden Access Token to Splice, which will be encrypted and stored securely. You will receive a "Secret" that acts as a key to unlock this token later.

**User Interaction:**

1.  The user will see a field to paste their **Bitwarden Access Token**.
2.  When the user clicks "Store Token," the app will call the `POST /api-key-store` endpoint. It will send the Bitwarden token in a secure `X-Api-Key` header and will be authenticated using the API Key from Step 1.
3.  The application will then capture the **Secret** from the `X-Secret` response header and display it. The user will be told to save this Secret, as it's required to fetch any transaction data.

---

### **Step 3: Managing Your Bank Connections**

**What we are doing:** Now that your credentials can be accessed securely, you can start connecting your bank accounts to Splice. This section will serve as a dashboard for adding new connections and viewing existing ones.

**User Interaction:**

1.  **Load Available Banks:** The user will click a button to call the `GET /banks/available` endpoint. This will populate a dropdown menu with a list of all financial institutions that Splice can connect to.
2.  **Connect a Bank:** The user will select a bank from the dropdown and provide the **Auth Details UUID** (the unique ID for the credentials stored in Bitwarden). Clicking "Connect Bank" will call the `POST /users/banks` endpoint to create the link.
3.  **View Connections:** After a connection is made, a list of the user's connected banks will be displayed, showing the bank's name and its current status (e.g., `ACTIVE`, `PENDING_AUTH`). This list will be fetched from the `GET /users/banks` endpoint.

---

### **Step 4: Fetching and Viewing Your Transactions**

**What we are doing:** This is the final step where you can view your financial data. The application will use your API Key and Secret to securely fetch and display transactions from a selected bank connection.

**User Interaction:**

1.  The user will see a dropdown menu populated with their currently active bank connections.
2.  After selecting a connection and clicking "Fetch Transactions," the app will call the `GET /transactions/by-connection` endpoint.
3.  The app will use the API Key (from Step 1) for authentication and the Secret (from Step 2) in the `X-Secret` header to authorize the data fetching.
4.  A formatted view of the transaction data returned by the API will be displayed on the page, showing details for each transaction.

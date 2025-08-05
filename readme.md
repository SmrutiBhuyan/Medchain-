# 🧬 MedChain – Track Every Medicine at Every Step

MedChain is a blockchain-powered medical tracking system designed to ensure transparency, traceability, and safety in the pharmaceutical supply chain. The application combats counterfeit drugs, stockouts, and lack of traceability—challenges that plague India's healthcare infrastructure—by enabling real-time tracking and verification of medicines.

---

## 🚨 Problem Statement

India’s healthcare system faces significant challenges:

- A large proportion of counterfeit drugs in circulation.
- Lack of supply chain transparency.
- Frequent medicine stockouts in rural areas.
- Absence of real-time tracking mechanisms.

MedChain aims to bridge these gaps with a secure, scalable, and intelligent solution.

---

## ✅ Key Features

### 1. 🔐 Blockchain-Based Drug Authentication
- Verify the **authenticity**, **origin**, and **safety** of any drug using its **batch number** via voice or text input.
- Prevents counterfeit drug usage and promotes trust.

### 2. 🔗 Supply Chain Tracking
- **End-to-end tracking** from manufacturer to pharmacy.
- Ensures full transparency at every stage of the medicine lifecycle.

### 3. 🏥 Locate Pharmacies
- Find nearby pharmacies stocking **critical medicines** using **PIN code-based search**.
- Supports timely access during emergencies.

### 4. 📦 Smart Inventory Management
- Real-time alerts for:
  - Low stock levels
  - Expiry warnings
  - Supply chain delays

### 5. 🤖 AI-Based Chatbot for Navigation
- Seamlessly guides users through the app.
- Answers common queries and assists in tracking or locating medicines.

### 6. 🌐 Multi-Language Support
- Designed to be inclusive with support for **multiple Indian languages**, making the platform accessible across regions.

---

## 🚀 Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js with Express
- **Database:** MySQL / PostgreSQL
- **Blockchain Layer:** (e.g., Ethereum, Hyperledger – specify based on your implementation)
- **Hosting/Deployment:** AWS / Oracle Cloud / EBS (as per your actual setup)
- **AI & Chatbot:** NLP with Dialogflow or custom ML model

---

## 📌 How to Run Locally

```bash
# Clone the repository
git clone https://github.com/your-username/medchain.git
cd medchain

# Install dependencies
npm install

# Run the backend server
cd backend
npm start

# In another terminal, run the frontend
cd frontend
npm start

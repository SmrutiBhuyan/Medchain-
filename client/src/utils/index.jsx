// Check for MetaMask
if (window.ethereum) {
    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
    
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            // MetaMask is locked or user disconnected all accounts
            console.log('Please connect to MetaMask.');
        } else {
            window.location.reload();
        }
    });
}
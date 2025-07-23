export const generateBarcode = (name, batch) => {
  // Simple barcode generation - you might want to use a proper library
  const cleanName = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
  const cleanBatch = batch.replace(/\s+/g, '').substring(0, 4);
  const timestamp = Date.now().toString().slice(-4);
  
  return `${cleanName}-${cleanBatch}-${timestamp}`;
};

export const validateBarcode = (barcode) => {
  return /^[A-Za-z0-9-]+$/.test(barcode);
};
export const generateBarcode = (name, batch, index = null) => {
  const cleanName = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
  const cleanBatch = batch.replace(/\s+/g, '').substring(0, 4);
  const timestamp = Date.now().toString().slice(-4);
  
  if (index !== null) {
    return `${cleanName}-${cleanBatch}-${timestamp}-${index.toString().padStart(6, '0')}`;
  }
  return `${cleanName}-${cleanBatch}-${timestamp}`;
};

export const validateBarcode = (barcode) => {
  return /^[A-Za-z0-9-]+$/.test(barcode);
};
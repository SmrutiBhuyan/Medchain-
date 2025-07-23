export const generateBarcode = (name, batch) => {
    const prefix = name.substring(0, 3).toUpperCase();
    const batchPart = batch.replace(/[^A-Z0-9]/gi, '').substring(0, 5);
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${batchPart}-${randomPart}`;
  };
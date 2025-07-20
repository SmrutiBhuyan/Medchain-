// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // Changed to match OpenZeppelin version
import "@openzeppelin/contracts/access/Ownable.sol";

contract MedicineTracking is Ownable {
 constructor() {
        transferOwnership(msg.sender);
    }
    struct Drug {
        string name;
        string batchNumber;
        uint256 manufacturingDate;
        uint256 expiryDate;
        string barcode;
        address manufacturer;
    }

    struct Batch {
        uint256 drugId;
        uint256 quantity;
        uint256 status; // 0: in_storage, 1: shipped, 2: delivered
        address currentOwner;
    }

    struct Shipment {
        uint256 batchId;
        uint256 quantity;
        address distributor;
        string destination;
        uint256 status; // 0: in_transit, 1: delivered
    }

    mapping(uint256 => Drug) public drugs;
    mapping(uint256 => Batch) public batches;
    mapping(uint256 => Shipment) public shipments;
    mapping(string => uint256) public barcodeToDrugId;

    uint256 public drugCount;
    uint256 public batchCount;
    uint256 public shipmentCount;

    event DrugCreated(uint256 indexed drugId, string name, string batchNumber, string barcode);
    event BatchCreated(uint256 indexed batchId, uint256 drugId, uint256 quantity);
    event ShipmentCreated(uint256 indexed shipmentId, uint256 batchId, address distributor);
    event ShipmentDelivered(uint256 indexed shipmentId);

    function createDrug(
        string memory _name,
        string memory _batchNumber,
        uint256 _manufacturingDate,
        uint256 _expiryDate,
        string memory _barcode
    ) external onlyOwner {
        drugCount++;
        drugs[drugCount] = Drug({
            name: _name,
            batchNumber: _batchNumber,
            manufacturingDate: _manufacturingDate,
            expiryDate: _expiryDate,
            barcode: _barcode,
            manufacturer: msg.sender
        });

        barcodeToDrugId[_barcode] = drugCount;
        emit DrugCreated(drugCount, _name, _batchNumber, _barcode);
    }

    function createBatch(
        uint256 _drugId,
        uint256 _quantity
    ) external onlyOwner {
        require(_drugId <= drugCount, "Drug does not exist");
        
        batchCount++;
        batches[batchCount] = Batch({
            drugId: _drugId,
            quantity: _quantity,
            status: 0, // in_storage
            currentOwner: msg.sender
        });

        emit BatchCreated(batchCount, _drugId, _quantity);
    }

    function createShipment(
        uint256 _batchId,
        uint256 _quantity,
        address _distributor,
        string memory _destination
    ) external onlyOwner {
        require(_batchId <= batchCount, "Batch does not exist");
        require(batches[_batchId].status == 0, "Batch already shipped");
        
        shipmentCount++;
        shipments[shipmentCount] = Shipment({
            batchId: _batchId,
            quantity: _quantity,
            distributor: _distributor,
            destination: _destination,
            status: 0 // in_transit
        });

        batches[_batchId].status = 1; // shipped
        batches[_batchId].currentOwner = _distributor;

        emit ShipmentCreated(shipmentCount, _batchId, _distributor);
    }

    function markShipmentDelivered(uint256 _shipmentId) external {
        require(_shipmentId <= shipmentCount, "Shipment does not exist");
        require(shipments[_shipmentId].status == 0, "Shipment already delivered");
        require(msg.sender == shipments[_shipmentId].distributor, "Only distributor can mark as delivered");

        shipments[_shipmentId].status = 1; // delivered
        uint256 batchId = shipments[_shipmentId].batchId;
        batches[batchId].status = 2; // delivered

        emit ShipmentDelivered(_shipmentId);
    }

    function verifyDrug(string memory _barcode) external view returns (Drug memory, Batch memory) {
        uint256 drugId = barcodeToDrugId[_barcode];
        require(drugId != 0, "Drug not found");

        Drug memory drug = drugs[drugId];
        Batch memory batch;

        // Find the most recent batch for this drug
        for (uint256 i = 1; i <= batchCount; i++) {
            if (batches[i].drugId == drugId) {
                batch = batches[i];
            }
        }

        return (drug, batch);
    }
}
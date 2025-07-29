// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DrugTracking is Ownable {
     constructor(address initialOwner) Ownable(initialOwner) {
        // Your contract initialization logic
    }
    struct Drug {
        string name;
        string batch;
        uint256 quantity;
        uint256 mfgDate;
        uint256 expiryDate;
        string batchBarcode;
        address manufacturer;
        string status;
    }

    mapping(string => Drug) public drugs;
    string[] public drugBarcodes;

    event DrugCreated(
        string name,
        string batch,
        uint256 quantity,
        uint256 mfgDate,
        uint256 expiryDate,
        string batchBarcode,
        address manufacturer
    );

    function createDrug(
        string memory _name,
        string memory _batch,
        uint256 _quantity,
        uint256 _mfgDate,
        uint256 _expiryDate,
        string memory _batchBarcode
    ) public {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_batch).length > 0, "Batch cannot be empty");
        require(_quantity > 0, "Quantity must be greater than 0");
        require(_expiryDate > _mfgDate, "Expiry date must be after manufacturing date");
        require(bytes(_batchBarcode).length > 0, "Barcode cannot be empty");
        require(drugs[_batchBarcode].manufacturer == address(0), "Drug with this barcode already exists");

        Drug memory newDrug = Drug({
            name: _name,
            batch: _batch,
            quantity: _quantity,
            mfgDate: _mfgDate,
            expiryDate: _expiryDate,
            batchBarcode: _batchBarcode,
            manufacturer: msg.sender,
            status: "created"
        });

        drugs[_batchBarcode] = newDrug;
        drugBarcodes.push(_batchBarcode);

        emit DrugCreated(
            _name,
            _batch,
            _quantity,
            _mfgDate,
            _expiryDate,
            _batchBarcode,
            msg.sender
        );
    }

    function getDrug(string memory _barcode) public view returns (
        string memory,
        string memory,
        uint256,
        uint256,
        uint256,
        string memory,
        address,
        string memory
    ) {
        Drug memory drug = drugs[_barcode];
        require(drug.manufacturer != address(0), "Drug not found");
        return (
            drug.name,
            drug.batch,
            drug.quantity,
            drug.mfgDate,
            drug.expiryDate,
            drug.batchBarcode,
            drug.manufacturer,
            drug.status
        );
    }

    function getAllDrugs() public view returns (string[] memory) {
        return drugBarcodes;
    }
}
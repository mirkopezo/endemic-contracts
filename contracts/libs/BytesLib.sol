// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

library BytesLib {
    function bytesToAddress(bytes memory bys)
        private
        pure
        returns (address addr)
    {
        assembly {
            addr := mload(add(bys, 20))
        }
    }

    function equals(bytes memory _addr1, address _addr2)
        internal
        pure
        returns (bool)
    {
        address addr1 = bytesToAddress(_addr1);
        if (addr1 == _addr2) return true;
        else return false;
    }
}

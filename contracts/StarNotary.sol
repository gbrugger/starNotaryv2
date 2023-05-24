//SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "../node_modules/@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/ERC721.sol";

contract StarNotary is ERC721UpgradeSafe {
    struct Star {
        string name;
    }

    mapping(uint256 => Star) public tokenIdToStarInfo;
    mapping(uint256 => uint256) public starsForSale;

    function createStar(string memory _name, uint256 _tokenId) public {
        Star memory newStar = Star(_name);
        tokenIdToStarInfo[_tokenId] = newStar;
        _mint(_msgSender(), _tokenId);
    }

    function putStarUpForSale(uint256 _tokenId, uint256 _price) public {
        require(ownerOf(_tokenId) == _msgSender());
        starsForSale[_tokenId] = _price;
    }

    function _makePayable(
        address addr
    ) internal pure returns (address payable) {
        return address(uint160(addr));
    }

    function buyStar(uint256 _tokenId) public payable {
        uint256 starCost = starsForSale[_tokenId];
        require(starCost > 0, "The Star should be up for sale");
        require(msg.value >= starCost, "You need to have enough Ether");

        address starOwnerAddress = ownerOf(_tokenId);

        safeTransferFrom(starOwnerAddress, _msgSender(), _tokenId);
        address payable ownerAddressPayable = _makePayable(starOwnerAddress);
        ownerAddressPayable.transfer(starCost);
        if (msg.value > starCost) {
            _msgSender().transfer(msg.value - starCost);
        }
    }
}

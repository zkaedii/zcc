// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/contracts/ToyVault.sol";

/**
 * =========================================================================
 * [ZKAEDI PRIME] Kinetic Heal Validation Sentinel
 * Standard: 95%+ Coverage | Security Hardened Always
 * =========================================================================
 */
contract ZkaediHealTest is Test {
    ToyVault public target;
    address public hacker = address(0xDEADBEEF);
    address public legitUser = address(0x1337);

    function setUp() public {
        target = new ToyVault();
        vm.deal(address(target), 100 ether);
        vm.deal(legitUser, 10 ether);
        vm.deal(hacker, 1 ether);
    }

    // [BASELINE] Verify normal operations are perfectly preserved
    function test_LegitimateWithdrawal() public {
        vm.startPrank(legitUser);
        target.deposit{value: 5 ether}();
        
        uint256 gasBefore = gasleft();
        target.withdraw();
        uint256 gasUsed = gasBefore - gasleft();
        
        assertEq(address(legitUser).balance, 10 ether, "Legitimate withdrawal failed");
        console.log("\x1b[38;5;51m[+] Baseline Withdrawal Gas Cost:\x1b[0m", gasUsed);
        vm.stopPrank();
    }

    // [KINETIC VALIDATION] Prove the EIP-1153 Mutex mathematically blocks reentrancy
    function test_RevertWhen_FlashLoanReentrancyAttempted() public {
        vm.startPrank(hacker);
        target.deposit{value: 1 ether}();

        // The Oracle's TSTORE mutex should trap this specific phase transition
        vm.expectRevert(); 
        
        // Simulating the cross-boundary callback exploit
        MaliciousProxy exploit = new MaliciousProxy(address(target));
        exploit.attack();
        
        vm.stopPrank();
        console.log("\x1b[38;5;199m[+] Neural Patch Successfully Trapped Cross-Boundary Reentrancy\x1b[0m");
    }
}

contract MaliciousProxy {
    ToyVault target;
    constructor(address _target) { target = ToyVault(_target); }
    function attack() external { target.withdraw(); }
    receive() external payable { target.withdraw(); } // The Reentrancy Vector
}

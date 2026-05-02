#include <stdint.h>

// RP2040 MMIO Map
#define SIO_BASE       0xD0000000
#define GPIO_OUT       (*(volatile uint32_t*)(SIO_BASE + 0x010))
#define GPIO_OUT_SET   (*(volatile uint32_t*)(SIO_BASE + 0x014))
#define GPIO_OUT_CLR   (*(volatile uint32_t*)(SIO_BASE + 0x018))
#define GPIO_OE_SET    (*(volatile uint32_t*)(SIO_BASE + 0x024))

#define IO_BANK0_BASE  0x40014000
#define GPIO25_CTRL    (*(volatile uint32_t*)(IO_BANK0_BASE + 0x0CC))

#define RESETS_BASE    0x4000C000
#define RESET          (*(volatile uint32_t*)(RESETS_BASE + 0x000))
#define RESET_DONE     (*(volatile uint32_t*)(RESETS_BASE + 0x008))

// Uncalibrated busy-wait delay. 
// Uses a volatile to prevent the compiler from optimizing it out.
void delay(volatile uint32_t count) {
    while (count--) {
        // Spin
    }
}

int main() {
    // 1. Release reset on IO_BANK0
    // Bit 5 corresponds to IO_BANK0 in the reset block
    RESET &= ~(1 << 5);

    // Wait for the reset to complete
    while ((RESET_DONE & (1 << 5)) == 0) {
        // Block until subsystem is online
    }

    // 2. Configure GPIO25 for Software Controlled IO (SIO)
    // Function 5 maps the pin to SIO control
    GPIO25_CTRL = 5;

    // 3. Enable Output Drive for GPIO25
    GPIO_OE_SET = (1 << 25);

    // 4. Infinite Blink Loop
    while (1) {
        // Set GPIO25 High
        GPIO_OUT_SET = (1 << 25);
        delay(500000); // 500k cycles

        // Set GPIO25 Low
        GPIO_OUT_CLR = (1 << 25);
        delay(500000); // 500k cycles
    }

    return 0; // Unreachable
}
